import { Router } from "express";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import Board from "../models/Board.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

// Express 4 does not catch rejected promises, so every route handler goes through this.
const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch((err) => {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  });

for (const method of ["get", "post", "put", "patch", "delete"]) {
  const register = router[method].bind(router);
  router[method] = (path, ...handlers) => register(path, ...handlers.map(asyncRoute));
}

router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: "Board not found" });
  }
  return next();
});

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeId(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    let id = null;
    if (url.hostname.includes("youtu.be")) {
      id = url.pathname.slice(1);
    } else if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/embed/")[1];
      } else if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/shorts/")[1];
      }
    }
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function validateNode(node) {
  if (!node || typeof node !== "object") return "Invalid node";
  const type = node.type || "video";
  switch (type) {
    case "video":
      return YOUTUBE_ID_PATTERN.test(node.youtubeId || "")
        ? null
        : "Could not parse a YouTube video ID from input";
    case "text":
      return typeof node.text === "string" && node.text.trim() ? null : "Text node needs some text";
    case "image":
    case "link":
      return isHttpUrl(node.url) ? null : `${type} node needs a valid http(s) URL`;
    default:
      return `Unknown node type "${type}"`;
  }
}

const asString = (value) => (typeof value === "string" ? value : "");

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

// A cursor is just the array offset, base64url encoded so clients treat it as opaque.
const encodeCursor = (offset) => Buffer.from(String(offset)).toString("base64url");

function decodeCursor(cursor) {
  if (!cursor) return 0;
  const raw = Buffer.from(String(cursor), "base64url").toString();
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}

// Distinct section names in order of first appearance, with their size and first offset.
function summarizeSections(names) {
  const sections = new Map();
  names.forEach((name, offset) => {
    const key = typeof name === "string" ? name : "";
    const entry = sections.get(key);
    if (entry) entry.count += 1;
    else sections.set(key, { name: key, count: 1, offset });
  });
  return [...sections.values()];
}

router.get("/", async (req, res) => {
  const boards = await Board.find({ owner: req.userId })
    .select("name updatedAt createdAt")
    .sort({ updatedAt: -1 });
  res.json(boards);
});

router.post("/", async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Board name is required" });
  }

  const board = await Board.create({ owner: req.userId, name: name.trim(), nodes: [], edges: [] });
  res.status(201).json(board);
});

router.get("/:id", async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, owner: req.userId });
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }
  res.json(board);
});

router.get("/:id/nodes", async (req, res) => {
  const offset = decodeCursor(req.query.cursor);
  if (offset === null) {
    return res.status(400).json({ error: "Invalid cursor" });
  }
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: "Board not found" });
  }

  const [board] = await Board.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params.id),
        owner: new mongoose.Types.ObjectId(req.userId),
      },
    },
    {
      $project: {
        name: 1,
        total: { $size: "$nodes" },
        nodes: { $slice: ["$nodes", offset, limit] },
        ...(offset === 0 ? { sectionNames: "$nodes.section" } : {}),
      },
    },
  ]);

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const response = {
    board: { id: board._id, name: board.name },
    total: board.total,
    nodes: board.nodes,
    nextCursor: offset + limit < board.total ? encodeCursor(offset + limit) : null,
  };
  if (offset === 0) response.sections = summarizeSections(board.sectionNames || []);
  res.json(response);
});

router.put("/:id", async (req, res) => {
  const { nodes, edges, name } = req.body || {};
  const update = {};
  if (Array.isArray(nodes)) {
    const nodeError = nodes.map(validateNode).find(Boolean);
    if (nodeError) return res.status(400).json({ error: nodeError });
    update.nodes = nodes;
  }
  if (Array.isArray(edges)) update.edges = edges;
  if (typeof name === "string" && name.trim()) update.name = name.trim();

  let board;
  try {
    board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      update,
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }
  res.json(board);
});

router.delete("/:id", async (req, res) => {
  const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }
  res.status(204).end();
});

router.post("/:id/nodes", async (req, res) => {
  const { type = "video", urlOrId, title, notes, text, url, section, position } = req.body || {};

  const node = {
    id: uuid(),
    type,
    youtubeId: type === "video" ? extractYoutubeId(urlOrId) || "" : "",
    title: asString(title),
    notes: asString(notes),
    text: asString(text),
    url: asString(url),
    section: asString(section),
    position: position || { x: 100, y: 100 },
  };

  const nodeError = validateNode(node);
  if (nodeError) {
    return res.status(400).json({ error: nodeError });
  }

  const board = await Board.findOne({ _id: req.params.id, owner: req.userId });
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  board.nodes.push(node);
  await board.save();
  res.status(201).json(board);
});

// ---- Granular updates: touch only the array elements that changed ----

const MAX_LAYOUT_UPDATES = 200;
const COORD_LIMIT = 1_000_000;
const NODE_PATCH_FIELDS = ["title", "notes", "text", "url", "section", "youtubeId"];
const EDGE_STYLES = ["solid", "dashed", "dotted"];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isCoordinate = (value) =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= COORD_LIMIT;

const boardFilter = (req) => ({ _id: req.params.id, owner: req.userId });

// Returns { error } or { value } for the style fields shared by create and patch.
function parseEdgeStyle(body, { partial }) {
  const value = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("color")) {
    if (body.color !== null && body.color !== undefined && !HEX_COLOR.test(body.color)) {
      return { error: "Edge color must be null or a #rrggbb value" };
    }
    value.color = body.color ?? null;
  }
  if (!partial || has("label")) {
    const label = body.label ?? "";
    if (typeof label !== "string" || label.length > 60) {
      return { error: "Edge label must be a string of at most 60 characters" };
    }
    value.label = label;
  }
  if (!partial || has("lineStyle")) {
    const lineStyle = body.lineStyle ?? "solid";
    if (!EDGE_STYLES.includes(lineStyle)) return { error: "Invalid edge line style" };
    value.lineStyle = lineStyle;
  }
  if (!partial || has("arrow")) {
    const arrow = body.arrow ?? false;
    if (typeof arrow !== "boolean") return { error: "Edge arrow must be true or false" };
    value.arrow = arrow;
  }
  return { value };
}

router.patch("/:id/layout", async (req, res) => {
  const { positions } = req.body || {};
  if (!Array.isArray(positions) || positions.length === 0 || positions.length > MAX_LAYOUT_UPDATES) {
    return res.status(400).json({ error: `positions must have 1 to ${MAX_LAYOUT_UPDATES} entries` });
  }

  const latest = new Map();
  for (const p of positions) {
    if (!p || typeof p.id !== "string" || !isCoordinate(p.x) || !isCoordinate(p.y)) {
      return res.status(400).json({ error: "Each position needs an id and finite x and y" });
    }
    latest.set(p.id, { x: p.x, y: p.y });
  }

  // One positional $set per moved node; the rest of the board is not touched.
  const $set = {};
  const arrayFilters = [];
  [...latest].forEach(([nodeId, position], i) => {
    $set[`nodes.$[n${i}].position`] = position;
    arrayFilters.push({ [`n${i}.id`]: nodeId });
  });

  const result = await Board.updateOne(boardFilter(req), { $set }, { arrayFilters });
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Board not found" });
  }
  // Unknown node ids are ignored on purpose: the node may have been deleted elsewhere.
  return res.json({ ok: true });
});

router.patch("/:id/nodes/:nodeId", async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body);
  if (keys.length === 0) return res.status(400).json({ error: "Nothing to update" });
  if (keys.includes("type")) return res.status(400).json({ error: "Node type cannot be changed" });

  const patch = {};
  for (const key of keys) {
    if (!NODE_PATCH_FIELDS.includes(key)) {
      return res.status(400).json({ error: `Cannot update field "${key}"` });
    }
    if (typeof body[key] !== "string") {
      return res.status(400).json({ error: `Field "${key}" must be a string` });
    }
    patch[key] = body[key];
  }
  if (patch.youtubeId && !YOUTUBE_ID_PATTERN.test(patch.youtubeId)) {
    return res.status(400).json({ error: "Could not parse a YouTube video ID from input" });
  }

  // Read just this node (positional projection) so the existing rules can validate the result.
  const found = await Board.findOne(
    { ...boardFilter(req), "nodes.id": req.params.nodeId },
    { "nodes.$": 1 }
  ).lean();
  if (!found) return res.status(404).json({ error: "Node not found" });

  const nodeError = validateNode({ ...found.nodes[0], ...patch });
  if (nodeError) return res.status(400).json({ error: nodeError });

  const $set = {};
  for (const [key, value] of Object.entries(patch)) $set[`nodes.$[n].${key}`] = value;
  await Board.updateOne(boardFilter(req), { $set }, { arrayFilters: [{ "n.id": req.params.nodeId }] });
  return res.json({ ok: true });
});

router.delete("/:id/nodes/:nodeId", async (req, res) => {
  const { nodeId } = req.params;
  // The node and every edge attached to it go in one write.
  const result = await Board.updateOne(boardFilter(req), {
    $pull: { nodes: { id: nodeId }, edges: { $or: [{ source: nodeId }, { target: nodeId }] } },
  });
  if (result.matchedCount === 0) return res.status(404).json({ error: "Board not found" });
  return res.status(204).end();
});

router.post("/:id/edges", async (req, res) => {
  const body = req.body || {};
  const { id, source, target } = body;
  const isId = (v) => typeof v === "string" && v.length > 0 && v.length <= 64;
  const isHandle = (v) => v === null || v === undefined || (typeof v === "string" && v.length <= 16);

  if (!isId(id) || !isId(source) || !isId(target) || !isHandle(body.sourceHandle) || !isHandle(body.targetHandle)) {
    return res.status(400).json({ error: "Edge needs id, source and target" });
  }
  const style = parseEdgeStyle(body, { partial: false });
  if (style.error) return res.status(400).json({ error: style.error });

  const edge = {
    id,
    source,
    target,
    sourceHandle: body.sourceHandle ?? null,
    targetHandle: body.targetHandle ?? null,
    ...style.value,
  };

  // Matches only if both endpoints exist and the edge id is not already used.
  const result = await Board.updateOne(
    { ...boardFilter(req), "nodes.id": { $all: [source, target] }, "edges.id": { $ne: id } },
    { $push: { edges: edge } }
  );
  if (result.matchedCount === 0) {
    return res.status(400).json({ error: "Board, edge endpoints or edge id not valid" });
  }
  return res.status(201).json({ ok: true });
});

router.patch("/:id/edges/:edgeId", async (req, res) => {
  const body = req.body || {};
  const allowed = ["color", "label", "lineStyle", "arrow"];
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !allowed.includes(key))) {
    return res.status(400).json({ error: "Provide one or more of color, label, lineStyle, arrow" });
  }
  const style = parseEdgeStyle(body, { partial: true });
  if (style.error) return res.status(400).json({ error: style.error });

  const $set = {};
  for (const [key, value] of Object.entries(style.value)) $set[`edges.$[e].${key}`] = value;
  const result = await Board.updateOne(
    { ...boardFilter(req), "edges.id": req.params.edgeId },
    { $set },
    { arrayFilters: [{ "e.id": req.params.edgeId }] }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: "Edge not found" });
  return res.json({ ok: true });
});

router.delete("/:id/edges/:edgeId", async (req, res) => {
  const result = await Board.updateOne(boardFilter(req), {
    $pull: { edges: { id: req.params.edgeId } },
  });
  if (result.matchedCount === 0) return res.status(404).json({ error: "Board not found" });
  return res.status(204).end();
});

export default router;
