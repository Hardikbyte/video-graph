import { v4 as uuid } from "uuid";
import { extractYoutubeId, validateNode } from "../../routes/boards.js";

// Layout: stage headers form a vertical spine on the left, and each stage's items
// fill a tidy grid to the right of its header.
const HEADER_HEIGHT = 150;
const GRID_COLUMNS = 5;
const GRID_LEFT = 300;
const CELL_WIDTH = 260;
const ROW_GAP = 40;
const STAGE_GAP = 120;

const PALETTE = ["#6c8cff", "#ff6b81", "#ffb86b", "#f1fa8c", "#50fa7b", "#8be9fd", "#bd93f9", "#ffffff"];

export function estimateHeight(item) {
  if (item.type === "video") return 250;
  if (item.type === "link") return item.notes ? 165 : 115;
  const lines = item.text
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 27)), 0);
  return (item.title ? 40 : 0) + Math.min(220, 22 + 20 * lines) + 10;
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

// Drops duplicates (same video, same URL or same note title) within one board.
function uniqueItems(stage, seen) {
  const result = [];
  for (const item of stage.items) {
    const videoId = item.type === "video" ? extractYoutubeId(item.url) : null;
    const key = videoId ? `video:${videoId}` : item.type === "text" ? `text:${item.title}` : item.url;
    if (seen.has(key)) {
      console.warn(`  Skipping duplicate: ${key}`);
      continue;
    }
    seen.add(key);
    result.push({ item, videoId });
  }
  return result;
}

// Builds the nodes and edges of one board from its stages.
export function buildGridBoard(stages) {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const counts = [];
  let previousHeaderId = null;
  let blockTop = 0;

  stages.forEach((stage, index) => {
    const color = stage.color ?? PALETTE[index % PALETTE.length];
    const header = makeHeader(stage, { x: 0, y: blockTop });
    nodes.push(header);

    if (previousHeaderId) {
      const previousColor = stages[index - 1].color ?? PALETTE[(index - 1) % PALETTE.length];
      edges.push(edge(previousHeaderId, header.id, "bottom", "top", previousColor, { arrow: true }));
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
      edges.push(edge(header.id, firstItemId, "right", "left", color, { lineStyle: "dashed" }));
    }
    blockTop = Math.max(rowTop, blockTop + HEADER_HEIGHT) + STAGE_GAP;
    counts.push({ stage: stage.title, items: entries.length });
  });

  return { nodes, edges, counts };
}

// Returns a list of problems found in a board's nodes (empty when it is fine).
export function findProblems(nodes) {
  const problems = nodes.map((n) => validateNode(n)).filter(Boolean);

  const positions = new Set(nodes.map((n) => `${n.position.x},${n.position.y}`));
  if (positions.size !== nodes.length) problems.push("two nodes share the same position");

  const urls = nodes.map((n) => n.url).filter(Boolean);
  for (const url of urls) {
    if (/[?&](si|utm_[a-z]+|rcm)=/.test(url)) problems.push(`tracking parameter left in ${url}`);
  }
  for (const n of nodes) {
    const text = `${n.title} ${n.text} ${n.notes} ${n.url}`;
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) problems.push(`email address found in node "${n.title}"`);
    if (/<Media omitted>|\(file attached\)/.test(text)) problems.push(`WhatsApp artifact in node "${n.title}"`);
  }
  return problems;
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

// Fills blank video titles from YouTube. Returns how many were filled.
export async function fillMissingTitles(nodes) {
  const queue = nodes.filter((n) => n.type === "video" && !n.title);
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
