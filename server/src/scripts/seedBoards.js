import "dotenv/config";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import Board from "../models/Board.js";
import { findOwner } from "./lib/findOwner.js";
import { BOARDS } from "./boards/index.js";
import { buildGridBoard, fillMissingTitles, findProblems } from "./lib/boardBuilder.js";

// Usage: node src/scripts/seedBoards.js [--only=slug,slug] [--dry-run] [--replace]
// New boards are created for --email=you@example.com (or SEED_EMAIL). A board with the same name is skipped unless --replace.

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => !a.startsWith("--only=") && !a.startsWith("--email=")));
  const onlyArg = argv.find((a) => a.startsWith("--only="));
  return {
    dryRun: flags.has("--dry-run"),
    replace: flags.has("--replace"),
    only: onlyArg ? onlyArg.slice("--only=".length).split(",").filter(Boolean) : null,
  };
}

function selectBoards(only) {
  if (!only) return BOARDS.filter((b) => b.slug !== "system-design");
  const unknown = only.filter((slug) => !BOARDS.some((b) => b.slug === slug));
  if (unknown.length) {
    throw new Error(`Unknown board(s): ${unknown.join(", ")}. Known: ${BOARDS.map((b) => b.slug).join(", ")}`);
  }
  return BOARDS.filter((b) => only.includes(b.slug));
}

export async function runSeed(argv) {
  const { dryRun, replace, only } = parseArgs(argv);
  const selected = selectBoards(only);

  // Build and check everything before writing anything.
  const built = [];
  let hasProblems = false;
  for (const board of selected) {
    console.log(`Building "${board.name}"`);
    const result = buildGridBoard(board.stages);
    const problems = findProblems(result.nodes);
    if (problems.length) {
      hasProblems = true;
      console.error(`  ${problems.length} problem(s) in "${board.name}":`);
      problems.forEach((p) => console.error(`   - ${p}`));
    }
    built.push({ board, ...result });
  }
  if (hasProblems) throw new Error("Fix the problems above, nothing was written.");

  const allNodes = built.flatMap((b) => b.nodes);
  const titlesFilled = await fillMissingTitles(allNodes);

  console.log("");
  for (const { board, nodes, edges, counts } of built) {
    const byType = nodes.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {});
    const untitled = nodes.filter((n) => n.type === "video" && !n.title).length;
    console.log(
      `${board.name}: ${nodes.length} nodes (${JSON.stringify(byType)}), ${edges.length} edges, ${counts.length} sections` +
        (untitled ? `, ${untitled} videos without a title` : "")
    );
  }
  console.log(`Fetched ${titlesFilled} video titles from YouTube`);

  if (dryRun) {
    console.log("Dry run, nothing written.");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const owner = await findOwner(process.argv.slice(2));
    

    for (const { board, nodes, edges } of built) {
      const existing = await Board.findOne({ owner: owner._id, name: board.name });
      if (existing && !replace) {
        console.warn(`Skipped "${board.name}": it already exists (use --replace to overwrite it).`);
        continue;
      }
      if (existing) {
        existing.nodes = nodes;
        existing.edges = edges;
        await existing.save();
        console.log(`Replaced "${board.name}" (${existing._id})`);
      } else {
        const created = await Board.create({ owner: owner._id, name: board.name, nodes, edges });
        console.log(`Created "${board.name}" (${created._id})`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeed(process.argv.slice(2)).catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
}
