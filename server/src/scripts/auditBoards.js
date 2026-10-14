import "dotenv/config";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Board from "../models/Board.js";
import User from "../models/User.js";
import { extractYoutubeId, validateNode } from "../routes/boards.js";

// Read-only check of every board in the database. Run: npm run audit:boards
//  1. structure (rules the server enforces, ids, positions, edges)
//  2. coverage (every link in chat-data/ is on a board), skipped if the folder is missing
//  3. YouTube availability (oEmbed), and 4. link status (sites that block bots show as 403/429)

const CHAT_DIR = fileURLToPath(new URL("../../../chat-data/", import.meta.url));
const LOGIN_GATED = /docs\.google|drive\.google|linkedin|x\.com|share\.google|chatgpt|notion/;

function checkStructure(boards) {
  let problems = 0;
  for (const board of boards) {
    const issues = [];
    const ids = new Set();
    const positions = new Set();
    for (const n of board.nodes) {
      const type = n.type || "video"; // nodes saved before node types existed have no type
      const error = validateNode({ ...n, type });
      if (error) issues.push(`${n.id.slice(0, 6)} ${type}: ${error}`);
      if (ids.has(n.id)) issues.push(`duplicate id ${n.id}`);
      ids.add(n.id);
      const key = `${n.position?.x},${n.position?.y}`;
      if (positions.has(key)) issues.push(`two nodes at ${key}`);
      positions.add(key);
      if (typeof n.position?.x !== "number" || typeof n.position?.y !== "number") issues.push(`bad position on ${n.id}`);
      if (type !== "video" && n.youtubeId) issues.push(`${type} node with a youtubeId: ${n.title}`);
      if (type === "video" && (n.url || n.text)) issues.push(`video node with url or text: ${n.title}`);
      if (type === "link" && !n.title) issues.push(`link without a title: ${n.url}`);
      if (!n.type) issues.push(`node without a type (works, treated as video): ${n.title || n.youtubeId}`);
    }
    for (const e of board.edges) {
      if (!ids.has(e.source) || !ids.has(e.target)) issues.push(`edge ${e.id} points at a missing node`);
    }
    problems += issues.length;
    console.log(`  ${board.name} (${board.nodes.length} nodes, ${board.edges.length} edges): ${issues.length ? "" : "ok"}`);
    issues.forEach((i) => console.log(`     - ${i}`));
  }
  return problems;
}

function checkCoverage(boards) {
  if (!fs.existsSync(CHAT_DIR)) {
    console.log("  chat-data/ not found, skipped");
    return 0;
  }
  const videos = new Set();
  const links = new Set();
  for (const b of boards) {
    for (const n of b.nodes) {
      if (n.type === "video" || (!n.type && n.youtubeId)) videos.add(n.youtubeId);
      if (n.url) links.add(n.url.split("?")[0].split("#")[0].replace(/\/$/, ""));
    }
  }
  let missingTotal = 0;
  for (const file of fs.readdirSync(CHAT_DIR).filter((f) => f.endsWith(".txt"))) {
    const text = fs.readFileSync(new URL(file, `file:///${CHAT_DIR.replace(/\\/g, "/")}`), "utf8");
    const urls = [...new Set((text.match(/https?:\/\/[^\s]+/g) || []).map((u) => u.replace(/[)\]>,.]+$/, "")))];
    const missing = urls.filter((u) => {
      const id = /youtu(\.be|be\.com)/.test(u) && !u.includes("playlist") ? extractYoutubeId(u) : null;
      if (id) return !videos.has(id);
      return !links.has(u.split("?")[0].split("#")[0].replace(/\/$/, ""));
    });
    missingTotal += missing.length;
    console.log(`  ${file}: ${urls.length} links, ${missing.length} missing`);
    missing.forEach((m) => console.log(`     - ${m.slice(0, 120)}`));
  }
  return missingTotal;
}

async function pool(items, size, task) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) await task(items[next++]);
    })
  );
}

async function checkVideos(boards) {
  const ids = [...new Set(boards.flatMap((b) => b.nodes).filter((n) => n.youtubeId).map((n) => n.youtubeId))];
  const bad = [];
  await pool(ids, 8, async (id) => {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) bad.push(`${id} (status ${res.status}, private, removed or embedding disabled)`);
    } catch (err) {
      bad.push(`${id} (${err.name})`);
    }
  });
  console.log(`  ${ids.length} videos checked, ${bad.length} not available`);
  bad.forEach((b) => console.log(`     - https://www.youtube.com/watch?v=${b}`));
  return bad.length;
}

async function fetchStatus(url, timeoutMs) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "Mozilla/5.0" },
    });
    return { status: res.status };
  } catch (err) {
    return { error: err.cause?.code || err.name };
  }
}

async function checkLinks(boards) {
  const urls = [...new Set(boards.flatMap((b) => b.nodes).map((n) => n.url).filter(Boolean))].filter(
    (u) => !LOGIN_GATED.test(u)
  );
  const results = new Map();
  await pool(urls, 6, async (url) => results.set(url, await fetchStatus(url, 10000)));

  // Timeouts are often just a busy connection, so ask again, slowly, before flagging.
  const slow = urls.filter((u) => results.get(u).error === "TimeoutError");
  await pool(slow, 2, async (url) => results.set(url, await fetchStatus(url, 25000)));

  const flagged = urls.filter((u) => {
    const r = results.get(u);
    return r.error || r.status >= 400;
  });
  console.log(`  ${urls.length} links checked (login-gated sites skipped), ${flagged.length} flagged`);
  console.log("  Note: 403 and 429 usually mean the site blocks scripts, not that the link is dead.");
  flagged.forEach((u) => {
    const r = results.get(u);
    console.log(`     - ${u.slice(0, 120)} -> ${r.error || r.status}`);
  });
  return flagged.length;
}

async function main() {
  const offline = process.argv.includes("--offline");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const owner = await User.findOne({ username: process.env.SEED_USERNAME });
    const boards = await Board.find(owner ? { owner: owner._id } : {}).lean();
    console.log(`Auditing ${boards.length} boards (read-only)\n`);

    console.log("1. Structure");
    const structure = checkStructure(boards);
    console.log("\n2. Coverage of chat-data/");
    const missing = checkCoverage(boards);

    let unavailable = 0;
    let flagged = 0;
    if (!offline) {
      console.log("\n3. YouTube videos");
      unavailable = await checkVideos(boards);
      console.log("\n4. Links");
      flagged = await checkLinks(boards);
    }
    console.log(
      `\nSummary: ${structure} structure issue(s), ${missing} missing link(s), ${unavailable} unavailable video(s), ${flagged} flagged link(s)`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Audit failed:", err.message);
  process.exit(1);
});
