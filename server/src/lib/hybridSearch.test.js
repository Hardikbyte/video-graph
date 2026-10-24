import assert from "node:assert/strict";
import { test } from "node:test";
import { computeLexicalScore, executeHybridSearch } from "./hybridSearch.js";

test("computeLexicalScore rewards exact matches higher than partials", () => {
  const nodeExact = { id: "1", title: "Microservices Architecture", text: "Service mesh" };
  const nodePartial = { id: "2", title: "Monolith to Microservices", text: "Architecture patterns" };
  const nodeNone = { id: "3", title: "Cooking Recipes", text: "Pasta carbonara" };

  const scoreExact = computeLexicalScore(nodeExact, "microservices architecture", ["microservices", "architecture"]);
  const scorePartial = computeLexicalScore(nodePartial, "microservices architecture", ["microservices", "architecture"]);
  const scoreNone = computeLexicalScore(nodeNone, "microservices architecture", ["microservices", "architecture"]);

  assert.ok(scoreExact > scorePartial, "Exact title match should score higher");
  assert.ok(scorePartial > scoreNone, "Partial match should score higher than no match");
  assert.equal(scoreNone, 0);
});

test("executeHybridSearch handles empty queries or nodes", () => {
  assert.deepEqual(executeHybridSearch({ nodes: [], query: "test" }), []);
  assert.deepEqual(executeHybridSearch({ nodes: [{ id: "1" }], query: "" }), []);
  assert.deepEqual(executeHybridSearch({ nodes: [{ id: "1" }], query: "   " }), []);
});

test("executeHybridSearch ranks combined lexical and semantic matches using RRF", () => {
  const nodes = [
    { id: "node-lexical", title: "Docker Container Guide", text: "How to write a Dockerfile" },
    { id: "node-semantic", title: "Cloud Deployment", text: "Kubernetes orchestration" },
    { id: "node-both", title: "Container Deployment", text: "Docker and Kubernetes in production" },
  ];

  // Mock embeddings
  const embeddings = [
    { nodeId: "node-lexical", embedding: [1, 0, 0] },
    { nodeId: "node-semantic", embedding: [0, 1, 0] },
    { nodeId: "node-both", embedding: [0.707, 0.707, 0] },
  ];

  // Query embedding aligns with [0.1, 0.99, 0] (semantic closer to node-semantic and node-both)
  const queryEmbedding = [0.1, 0.99, 0];

  const results = executeHybridSearch({
    nodes,
    embeddings,
    query: "container",
    queryEmbedding,
  });

  assert.ok(results.length > 0, "Should return results");
  // node-both has both lexical match ("Container") and strong semantic match
  const topResult = results[0];
  assert.equal(topResult.node.id, "node-both");
  assert.ok(topResult.matches.lexical);
  assert.ok(topResult.matches.semantic);
});
