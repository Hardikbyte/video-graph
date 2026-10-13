import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import Board from "../models/Board.js";
import User from "../models/User.js";
import { extractYoutubeId, validateNode } from "../routes/boards.js";
import { SYSTEM_DESIGN_STAGES } from "./systemDesignData.js";

const BOARD_NAME = "System Design";
const COLUMN_WIDTH = 300;
const HEADER_HEIGHT = 150;
const GAP = 50;
const GRID_COLUMNS = 5;
const GRID_LEFT = 300;
const CELL_WIDTH = 260;
const ROW_GAP = 40;
const STAGE_GAP = 120;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const replace = args.has("--replace");
const useColumnsLayout = args.has("--layout=columns");

function estimateHeight(item) {
  if (item.type === "video") return 250;
  if (item.type === "link") return item.notes ? 165 : 115;
  const lines = item.text
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 27)), 0);
  return (item.title ? 40 : 0) + Math.min(220, 22 + 20 * lines) + 10;
}

async function fetchVideoTitle(youtubeId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return typeof data.title === "string" ? data.title : "";
  } catch {
    return "";
  }
}

async function fillMissingTitles(videoNodes) {
  const queue = videoNodes.filter((n) => !n.title);
  let filled = 0;
  async function worker() {
    while (queue.length) {
      const node = queue.shift();
      node.title = await fetchVideoTitle(node.youtubeId);
      if (node.title) filled += 1;
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return filled;
}

function edge(source, target, sourceHandle, targetHandle, color, extra) {
  return {
    id: uuid(),
    source,
    sourceHandle,
    target,
    targetHandle,
    color,
    label: "",
    lineStyle: "solid",
    arrow: false,
    ...extra,
  };
}

function makeNode(stage, item, videoId, position) {
  return {
    id: uuid(),
    type: item.type,
    youtubeId: videoId || "",
    url: item.type === "link" ? item.url : "",
    text: item.type === "text" ? item.text : "",
    title: item.title || "",
    notes: item.notes || "",
    section: stage.title,
    position,
  };
}

function makeHeader(stage, position) {
  return {
    id: uuid(),
    type: "text",
    title: stage.title,
    text: stage.summary,
    notes: "",
    section: stage.title,
    position,
  };
}

// Drops duplicates (same video or same URL or same note title) across all stages.
function uniqueItems(stage, seen) {
  const result = [];
  for (const item of stage.items) {
    const videoId = item.type === "video" ? extractYoutubeId(item.url) : null;
    const key = videoId ? `video:${videoId}` : item.type === "text" ? `text:${item.title}` : item.url;
    if (seen.has(key)) {
      console.warn(`Skipping duplicate: ${key}`);
      continue;
    }
    seen.add(key);
    result.push({ item, videoId });
  }
  return result;
}

// Old layout: one tall column per stage, items chained top to bottom.
function buildColumnsBoard() {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const counts = [];
  let previousHeaderId = null;

  SYSTEM_DESIGN_STAGES.forEach((stage, column) => {
    const x = column * COLUMN_WIDTH;
    const header = makeHeader(stage, { x, y: 0 });
    nodes.push(header);

    if (previousHeaderId) {
      const previous = SYSTEM_DESIGN_STAGES[column - 1];
      edges.push(edge(previousHeaderId, header.id, "right", "left", previous.color, { arrow: true }));
    }
    previousHeaderId = header.id;

    let y = HEADER_HEIGHT + GAP;
    let previousId = header.id;
    const entries = uniqueItems(stage, seen);

    for (const { item, videoId } of entries) {
      const node = makeNode(stage, item, videoId, { x, y });
      nodes.push(node);
      edges.push(edge(previousId, node.id, "bottom", "top", stage.color, { lineStyle: "dashed" }));
      previousId = node.id;
      y += estimateHeight(item) + GAP;
    }
    counts.push({ stage: stage.title, items: entries.length });
  });

  return { nodes, edges, counts };
}

// New layout: stage headers form a vertical spine on the left, and each stage's
// items fill a tidy grid to the right of its header.
function buildGridBoard() {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const counts = [];
  let previousHeaderId = null;
  let blockTop = 0;

  SYSTEM_DESIGN_STAGES.forEach((stage, index) => {
    const header = makeHeader(stage, { x: 0, y: blockTop });
    nodes.push(header);

    if (previousHeaderId) {
      const previous = SYSTEM_DESIGN_STAGES[index - 1];
      edges.push(edge(previousHeaderId, header.id, "bottom", "top", previous.color, { arrow: true }));
    }
    previousHeaderId = header.id;

    const entries = uniqueItems(stage, seen);
    let rowTop = blockTop;
    let firstItemId = null;

    for (let start = 0; start < entries.length; start += GRID_COLUMNS) {
      const row = entries.slice(start, start + GRID_COLUMNS);
      row.forEach(({ item, videoId }, col) => {
        const node = makeNode(stage, item, videoId, { x: GRID_LEFT + col * CELL_WIDTH, y: rowTop });
        nodes.push(node);
        firstItemId ??= node.id;
      });
      rowTop += Math.max(...row.map(({ item }) => estimateHeight(item))) + ROW_GAP;
    }

    if (firstItemId) {
      edges.push(edge(header.id, firstItemId, "right", "left", stage.color, { lineStyle: "dashed" }));
    }
    blockTop = Math.max(rowTop, blockTop + HEADER_HEIGHT) + STAGE_GAP;
    counts.push({ stage: stage.title, items: entries.length });
  });

  return { nodes, edges, counts };
}

async function main() {
  const { nodes, edges, counts } = useColumnsLayout ? buildColumnsBoard() : buildGridBoard();

  const errors = nodes.map((n) => validateNode(n)).filter(Boolean);
  if (errors.length) {
    console.error(`Validation failed for ${errors.length} node(s):`);
    errors.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  }

  const positions = new Set(nodes.map((n) => `${n.position.x},${n.position.y}`));
  if (positions.size !== nodes.length) {
    console.error("Layout bug: two nodes share the same position");
    process.exit(1);
  }

  const videoNodes = nodes.filter((n) => n.type === "video");
  const filled = await fillMissingTitles(videoNodes);

  const byType = nodes.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {});
  console.log(`Board "${BOARD_NAME}": ${nodes.length} nodes, ${edges.length} edges`);
  console.log("By type:", byType);
  console.log(`Fetched ${filled} video titles from YouTube`);
  counts.forEach((c) => console.log(`  ${c.stage}: ${c.items} items`));

  if (dryRun) {
    console.log("Dry run, nothing written.");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const owner = await User.findOne({ username: process.env.SEED_USERNAME });
    if (!owner) throw new Error("Seed user not found (check SEED_USERNAME)");

    const existing = await Board.findOne({ owner: owner._id, name: BOARD_NAME });
    if (existing && !replace) {
      console.error(`Board "${BOARD_NAME}" already exists. Re-run with --replace to overwrite it.`);
      process.exit(1);
    }

    if (existing) {
      existing.nodes = nodes;
      existing.edges = edges;
      await existing.save();
      console.log(`Replaced contents of board ${existing._id}`);
    } else {
      const board = await Board.create({ owner: owner._id, name: BOARD_NAME, nodes, edges });
      console.log(`Created board ${board._id}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
