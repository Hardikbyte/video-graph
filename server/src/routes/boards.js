import { Router } from "express";
import { v4 as uuid } from "uuid";
import Board from "../models/Board.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

function extractYoutubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/embed/")[1];
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1];
      }
    }
  } catch {
    return null;
  }

  return null;
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

router.put("/:id", async (req, res) => {
  const { nodes, edges, name } = req.body || {};
  const update = {};
  if (Array.isArray(nodes)) update.nodes = nodes;
  if (Array.isArray(edges)) update.edges = edges;
  if (typeof name === "string" && name.trim()) update.name = name.trim();

  const board = await Board.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    update,
    { new: true }
  );

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
  const { urlOrId, title, notes, position } = req.body || {};
  const youtubeId = extractYoutubeId(urlOrId);

  if (!youtubeId) {
    return res.status(400).json({ error: "Could not parse a YouTube video ID from input" });
  }

  const board = await Board.findOne({ _id: req.params.id, owner: req.userId });
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const node = {
    id: uuid(),
    youtubeId,
    title: title || "",
    notes: notes || "",
    position: position || { x: 100, y: 100 },
  };

  board.nodes.push(node);
  await board.save();
  res.status(201).json(board);
});

export default router;
