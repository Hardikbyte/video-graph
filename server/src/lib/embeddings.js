let extractorPromise = null;

/**
 * Initializes and returns the feature-extraction pipeline singleton.
 */
async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return extractorPromise;
}

/**
 * Clean and normalize text for embedding and search.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Extracts searchable text representation from node fields.
 * @param {object} node
 * @returns {string}
 */
export function extractNodeSearchText(node) {
  if (!node || typeof node !== "object") return "";
  const parts = [];
  if (node.title && typeof node.title === "string") parts.push(node.title.trim());
  if (node.section && typeof node.section === "string") parts.push(node.section.trim());
  if (node.text && typeof node.text === "string") parts.push(node.text.trim());
  if (node.notes && typeof node.notes === "string") parts.push(node.notes.trim());
  if (node.url && typeof node.url === "string") parts.push(node.url.trim());
  return normalizeText(parts.join(" "));
}

/**
 * Computes cosine similarity between two numeric vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a normalized vector embedding for given text string.
 * @param {string} text
 * @param {object} [options]
 * @param {Function} [options.customExtractor]
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text, options = {}) {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];

  const extractor = options.customExtractor || (await getExtractor());
  const output = await extractor(cleaned, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
