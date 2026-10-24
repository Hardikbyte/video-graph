import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import NodeEmbedding from "./NodeEmbedding.js";

test("NodeEmbedding schema initializes with expected fields and defaults", () => {
  const dummyBoardId = new mongoose.Types.ObjectId();
  const doc = new NodeEmbedding({
    boardId: dummyBoardId,
    nodeId: "test-node-1",
    text: "Sample note text",
    embedding: [0.1, 0.2, 0.3],
  });

  assert.equal(doc.boardId.toString(), dummyBoardId.toString());
  assert.equal(doc.nodeId, "test-node-1");
  assert.equal(doc.text, "Sample note text");
  assert.equal(doc.embedding.length, 3);
  assert.equal(doc.embedding[0], 0.1);

  // Validate required fields
  const invalidDoc = new NodeEmbedding({});
  const validationError = invalidDoc.validateSync();
  assert.ok(validationError.errors.boardId, "boardId is required");
  assert.ok(validationError.errors.nodeId, "nodeId is required");
});
