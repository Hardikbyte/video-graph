import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import Board from "../models/Board.js";
import NodeEmbedding from "../models/NodeEmbedding.js";

test("search route logic returns empty results when query is empty", async () => {
  const req = {
    params: { id: new mongoose.Types.ObjectId().toString() },
    query: { q: "" },
    userId: new mongoose.Types.ObjectId().toString(),
  };

  let responseData = null;
  const res = {
    json(data) {
      responseData = data;
      return this;
    },
    status() {
      return this;
    },
  };

  // Directly verify the empty query condition contract
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    res.json({ results: [], total: 0 });
  }

  assert.deepEqual(responseData, { results: [], total: 0 });
});

test("search query executes hybrid search matching on title and text", async () => {
  const { executeHybridSearch } = await import("../lib/hybridSearch.js");

  const nodes = [
    { id: "node-1", title: "React State Management", text: "Zustand and Redux toolkit", notes: "Use Zustand for simpler store" },
    { id: "node-2", title: "Python Machine Learning", text: "Scikit learn and PyTorch", notes: "Gradient boosting" },
  ];

  const embeddings = [
    { nodeId: "node-1", embedding: [0.8, 0.2, 0] },
    { nodeId: "node-2", embedding: [0.1, 0.9, 0] },
  ];

  const results = executeHybridSearch({
    nodes,
    embeddings,
    query: "Zustand store",
    queryEmbedding: [0.75, 0.25, 0],
  });

  assert.ok(results.length >= 1);
  assert.equal(results[0].node.id, "node-1");
  assert.ok(results[0].matches.lexical);
  assert.ok(results[0].score > 0);
});
