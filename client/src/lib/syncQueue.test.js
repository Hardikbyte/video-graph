import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeOperation,
  emptyQueue,
  isEmpty,
  mergeBack,
  queueEdgeCreate,
  queueEdgeDelete,
  queueEdgePatch,
  queueNodeDelete,
  queueNodePatch,
  queuePosition,
  toOperations,
} from "./syncQueue.js";

test("moving a node twice keeps only the last position", () => {
  const q = emptyQueue();
  queuePosition(q, "a", { x: 1, y: 1 });
  queuePosition(q, "a", { x: 5, y: 9 });
  const ops = toOperations(q);
  assert.equal(ops.length, 1);
  assert.deepEqual(ops[0], { kind: "positions", data: [{ id: "a", x: 5, y: 9 }] });
});

test("several moved nodes go out as one batch", () => {
  const q = emptyQueue();
  queuePosition(q, "a", { x: 1, y: 1 });
  queuePosition(q, "b", { x: 2, y: 2 });
  queuePosition(q, "c", { x: 3, y: 3 });
  const ops = toOperations(q);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].data.length, 3);
});

test("patches to one node merge, newest value wins", () => {
  const q = emptyQueue();
  queueNodePatch(q, "a", { notes: "one", title: "T" });
  queueNodePatch(q, "a", { notes: "two" });
  assert.deepEqual(toOperations(q)[0], { kind: "nodePatch", id: "a", data: { notes: "two", title: "T" } });
});

test("deleting a node drops its queued position, patch and new edges", () => {
  const q = emptyQueue();
  queuePosition(q, "a", { x: 1, y: 1 });
  queueNodePatch(q, "a", { notes: "x" });
  queueEdgeCreate(q, { id: "e1", source: "a", target: "b" });
  queueEdgeCreate(q, { id: "e2", source: "b", target: "c" });
  queueNodeDelete(q, "a");
  const kinds = toOperations(q).map((op) => `${op.kind}:${op.id ?? ""}`);
  assert.deepEqual(kinds, ["nodeDelete:a", "edgeCreate:e2"]);
});

test("changes to a node that is queued for deletion are ignored", () => {
  const q = emptyQueue();
  queueNodeDelete(q, "a");
  queuePosition(q, "a", { x: 1, y: 1 });
  queueNodePatch(q, "a", { notes: "x" });
  assert.equal(toOperations(q).length, 1);
});

test("a patch to an edge that is not on the server yet folds into its create", () => {
  const q = emptyQueue();
  queueEdgeCreate(q, { id: "e1", source: "a", target: "b", color: null });
  queueEdgePatch(q, "e1", { color: "#ff6b81" });
  const ops = toOperations(q);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].kind, "edgeCreate");
  assert.equal(ops[0].data.color, "#ff6b81");
});

test("creating and deleting an edge before a flush cancels out", () => {
  const q = emptyQueue();
  queueEdgeCreate(q, { id: "e1", source: "a", target: "b" });
  queueEdgePatch(q, "e1", { label: "x" });
  queueEdgeDelete(q, "e1");
  assert.ok(isEmpty(q));
});

test("deleting an edge that exists on the server queues a delete and drops its patch", () => {
  const q = emptyQueue();
  queueEdgePatch(q, "e1", { label: "x" });
  queueEdgeDelete(q, "e1");
  assert.deepEqual(toOperations(q), [{ kind: "edgeDelete", id: "e1" }]);
});

test("operations go out in a safe order", () => {
  const q = emptyQueue();
  queuePosition(q, "a", { x: 1, y: 1 });
  queueEdgePatch(q, "e9", { arrow: true });
  queueNodePatch(q, "b", { notes: "n" });
  queueEdgeCreate(q, { id: "e1", source: "a", target: "b" });
  queueNodeDelete(q, "z");
  queueEdgeDelete(q, "e5");
  assert.deepEqual(
    toOperations(q).map((op) => op.kind),
    ["edgeDelete", "nodeDelete", "edgeCreate", "nodePatch", "edgePatch", "positions"]
  );
});

test("after a failed flush the operations come back, and newer changes win", () => {
  const q = emptyQueue();
  queuePosition(q, "a", { x: 1, y: 1 });
  queueNodePatch(q, "a", { notes: "old", title: "T" });
  const ops = toOperations(q);

  const next = emptyQueue();
  queuePosition(next, "a", { x: 50, y: 50 }); // user kept dragging during the failed save
  queueNodePatch(next, "a", { notes: "new" });
  for (const op of ops) mergeBack(next, op);

  const restored = toOperations(next);
  assert.deepEqual(restored.find((o) => o.kind === "positions").data, [{ id: "a", x: 50, y: 50 }]);
  assert.deepEqual(restored.find((o) => o.kind === "nodePatch").data, { notes: "new", title: "T" });
});

test("describeOperation gives a readable sentence", () => {
  assert.equal(
    describeOperation({ kind: "positions", data: [{ id: "a", x: 1, y: 1 }] }),
    "Saving the new position of a node"
  );
  assert.equal(
    describeOperation({ kind: "positions", data: [{}, {}, {}] }),
    "Saving the new positions of 3 nodes"
  );
  assert.equal(describeOperation({ kind: "edgeDelete", id: "e" }), "Deleting a connection");
});
