import { cosineSimilarity, normalizeText } from "./embeddings.js";

/**
 * Calculates lexical score for a node against query and query terms.
 * @param {object} node
 * @param {string} queryLower
 * @param {string[]} terms
 * @returns {number}
 */
export function computeLexicalScore(node, queryLower, terms) {
  if (!node || !queryLower) return 0;

  const title = (node.title || "").toLowerCase();
  const text = (node.text || "").toLowerCase();
  const notes = (node.notes || "").toLowerCase();
  const section = (node.section || "").toLowerCase();
  const url = (node.url || "").toLowerCase();

  let score = 0;

  // Exact verbatim phrase matches
  if (title === queryLower) score += 50;
  else if (title.includes(queryLower)) score += 30;

  if (text.includes(queryLower)) score += 20;
  if (notes.includes(queryLower)) score += 15;
  if (section.includes(queryLower)) score += 10;
  if (url.includes(queryLower)) score += 5;

  // Individual term matches
  for (const term of terms) {
    if (!term) continue;
    if (title.includes(term)) score += 5;
    if (text.includes(term)) score += 3;
    if (notes.includes(term)) score += 2;
    if (section.includes(term)) score += 2;
  }

  return score;
}

/**
 * Executes hybrid search across a set of nodes.
 *
 * @param {object} params
 * @param {Array<object>} params.nodes - Board nodes
 * @param {Array<object>} params.embeddings - Array of { nodeId, embedding }
 * @param {string} params.query - Search query string
 * @param {number[]} [params.queryEmbedding] - Optional vector embedding of query
 * @param {object} [params.options]
 * @param {number} [params.options.limit=20]
 * @param {number} [params.options.k=60] - RRF constant
 * @param {number} [params.options.wLexical=1.0]
 * @param {number} [params.options.wSemantic=1.0]
 * @param {number} [params.options.minSemanticSim=0.25]
 * @returns {Array<object>} Sorted list of search result items
 */
export function executeHybridSearch({
  nodes = [],
  embeddings = [],
  query = "",
  queryEmbedding = [],
  options = {},
}) {
  const cleanedQuery = normalizeText(query);
  if (!cleanedQuery || !Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const queryLower = cleanedQuery.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(Boolean);

  const {
    limit = 20,
    k = 60,
    wLexical = 1.0,
    wSemantic = 1.0,
    minSemanticSim = 0.25,
  } = options;

  // Map embedding vector by nodeId
  const embeddingMap = new Map();
  for (const item of embeddings) {
    if (item && item.nodeId && Array.isArray(item.embedding)) {
      embeddingMap.set(item.nodeId, item.embedding);
    }
  }

  // 1. Calculate raw lexical and semantic scores
  const nodeScores = nodes.map((node) => {
    const lexScore = computeLexicalScore(node, queryLower, terms);

    let semScore = 0;
    if (queryEmbedding && queryEmbedding.length > 0) {
      const nodeVec = embeddingMap.get(node.id);
      if (nodeVec && nodeVec.length > 0) {
        semScore = Math.max(0, cosineSimilarity(queryEmbedding, nodeVec));
      }
    }

    return {
      node,
      lexScore,
      semScore: semScore >= minSemanticSim ? semScore : 0,
    };
  });

  // 2. Rank for lexical matches
  const sortedByLex = [...nodeScores]
    .filter((s) => s.lexScore > 0)
    .sort((a, b) => b.lexScore - a.lexScore);

  const lexRankMap = new Map();
  sortedByLex.forEach((item, index) => {
    lexRankMap.set(item.node.id, index + 1);
  });

  // 3. Rank for semantic matches
  const sortedBySem = [...nodeScores]
    .filter((s) => s.semScore > 0)
    .sort((a, b) => b.semScore - a.semScore);

  const semRankMap = new Map();
  sortedBySem.forEach((item, index) => {
    semRankMap.set(item.node.id, index + 1);
  });

  // 4. Reciprocal Rank Fusion (RRF)
  const results = [];
  for (const item of nodeScores) {
    const lexRank = lexRankMap.get(item.node.id);
    const semRank = semRankMap.get(item.node.id);

    if (!lexRank && !semRank) continue;

    let rrfScore = 0;
    if (lexRank) {
      rrfScore += wLexical / (k + lexRank);
    }
    if (semRank) {
      rrfScore += wSemantic / (k + semRank);
    }

    results.push({
      node: item.node,
      score: rrfScore,
      lexicalScore: item.lexScore,
      semanticScore: item.semScore,
      matches: {
        lexical: Boolean(lexRank),
        semantic: Boolean(semRank),
      },
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
