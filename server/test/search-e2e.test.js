import assert from "node:assert/strict";
import { test } from "node:test";
import { computeLexicalScore, executeHybridSearch } from "../src/lib/hybridSearch.js";
import { extractNodeSearchText, normalizeText, cosineSimilarity } from "../src/lib/embeddings.js";

test("End-to-end hybrid search logic: verbatim keywords and semantic matching", () => {
  const nodes = [
    {
      id: "node-k8s",
      type: "text",
      title: "Kubernetes Cluster Management",
      text: "Pods, services, deployments and helm charts for container orchestration",
      notes: "Scale replicas across worker nodes",
      section: "DevOps",
    },
    {
      id: "node-docker",
      type: "video",
      title: "Docker Container Tutorial",
      text: "Building Dockerfiles and multi-stage images",
      notes: "Best practices for minimal base layers",
      section: "DevOps",
    },
    {
      id: "node-recipe",
      type: "text",
      title: "Classic Spaghetti Carbonara",
      text: "Guanciale, pecorino romano, egg yolks, black pepper",
      notes: "Never use cream in authentic carbonara",
      section: "Cooking",
    },
  ];

  // Simulated normalized embeddings from a semantic vector model
  // Dimension 1: DevOps / Cloud, Dimension 2: Containers / Microservices, Dimension 3: Cooking / Food
  const embeddings = [
    { nodeId: "node-k8s", embedding: [0.92, 0.75, 0.02] },
    { nodeId: "node-docker", embedding: [0.70, 0.95, 0.01] },
    { nodeId: "node-recipe", embedding: [0.01, 0.02, 0.99] },
  ];

  // 1. Exact verbatim keyword query test: "Dockerfile"
  const verbatimResults = executeHybridSearch({
    nodes,
    embeddings,
    query: "Dockerfile",
    queryEmbedding: [0.65, 0.90, 0.01],
  });

  assert.ok(verbatimResults.length > 0, "Should return matching results for Dockerfile");
  assert.equal(verbatimResults[0].node.id, "node-docker", "Exact keyword 'Dockerfile' should rank Docker node first");
  assert.equal(verbatimResults[0].matches.lexical, true);

  // 2. Pure semantic query test: "cloud server infrastructure"
  // Note: the words "cloud", "server", "infrastructure" do NOT appear verbatim in the nodes text
  const semanticResults = executeHybridSearch({
    nodes,
    embeddings,
    query: "cloud server infrastructure",
    queryEmbedding: [0.95, 0.60, 0.01],
  });

  assert.ok(semanticResults.length > 0, "Semantic search should return results");
  assert.equal(semanticResults[0].node.id, "node-k8s", "Semantic concept of cloud infrastructure should rank Kubernetes node highest");
  assert.equal(semanticResults[0].matches.semantic, true);
  // Recipe node should NOT be matched under cloud infrastructure
  assert.ok(!semanticResults.some((r) => r.node.id === "node-recipe"));

  // 3. Negative query test: "Italian dinner culinary"
  const recipeResults = executeHybridSearch({
    nodes,
    embeddings,
    query: "Italian dinner culinary",
    queryEmbedding: [0.01, 0.01, 0.98],
  });

  assert.ok(recipeResults.length > 0);
  assert.equal(recipeResults[0].node.id, "node-recipe");
});
