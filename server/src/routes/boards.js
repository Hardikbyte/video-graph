import { Router } from "express";
import { v4 as uuid } from "uuid";
import Board from "../models/Board.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

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
  const { type = "video", urlOrId, title, notes, text, url, position } = req.body || {};

  const node = {
    id: uuid(),
    type,
    youtubeId: type === "video" ? extractYoutubeId(urlOrId) || "" : "",
    title: asString(title),
    notes: asString(notes),
    text: asString(text),
    url: asString(url),
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

export default router;
