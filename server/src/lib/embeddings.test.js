import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cosineSimilarity,
  extractNodeSearchText,
  generateEmbedding,
  normalizeText,
} from "./embeddings.js";

test("normalizeText trims and collapses whitespace", () => {
  assert.equal(normalizeText("   hello    world   \n  test  "), "hello world test");
  assert.equal(normalizeText(null), "");
  assert.equal(normalizeText(123), "");
});

test("extractNodeSearchText combines relevant fields", () => {
  const node = {
    title: "Graph Theory",
    section: "Algorithms",
    text: "Dijkstra shortest path",
    notes: "Remember priority queue",
    url: "https://example.com",
  };
  const result = extractNodeSearchText(node);
  assert.equal(
    result,
    "Graph Theory Algorithms Dijkstra shortest path Remember priority queue https://example.com"
  );

  assert.equal(extractNodeSearchText({}), "");
  assert.equal(extractNodeSearchText(null), "");
});

test("cosineSimilarity calculates vector similarities accurately", () => {
  // Identical vectors -> similarity = 1
  assert.equal(Math.round(cosineSimilarity([1, 0, 0], [1, 0, 0]) * 1000) / 1000, 1);

  // Orthogonal vectors -> similarity = 0
  assert.equal(cosineSimilarity([1, 0, 0], [0, 1, 0]), 0);

  // Opposite vectors -> similarity = -1
  assert.equal(Math.round(cosineSimilarity([1, 0], [-1, 0]) * 1000) / 1000, -1);

  // Edge cases
  assert.equal(cosineSimilarity([], []), 0);
  assert.equal(cosineSimilarity([0, 0], [0, 0]), 0);
});

test("generateEmbedding handles empty text or uses custom extractor", async () => {
  const emptyRes = await generateEmbedding("   ");
  assert.deepEqual(emptyRes, []);

  // Mock extractor test
  const mockExtractor = async (text, opts) => {
    return { data: new Float32Array([0.1, 0.2, 0.3]) };
  };

  const res = await generateEmbedding("hello world", { customExtractor: mockExtractor });
  assert.equal(res.length, 3);
  assert.equal(Math.round(res[0] * 10) / 10, 0.1);
});
