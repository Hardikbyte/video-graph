import NodeEmbedding from "../models/NodeEmbedding.js";
import { extractNodeSearchText, generateEmbedding } from "./embeddings.js";

/**
 * Creates or updates the vector embedding for a single node.
 * Silently catches and logs errors so node operations do not fail if embedding generation fails.
 * @param {string|mongoose.Types.ObjectId} boardId
 * @param {object} node
 */
export async function syncNodeEmbedding(boardId, node) {
  if (!boardId || !node || !node.id) return;
  try {
    const text = extractNodeSearchText(node);
    if (!text) {
      await NodeEmbedding.deleteOne({ boardId, nodeId: node.id });
      return;
    }
    const embedding = await generateEmbedding(text);
    await NodeEmbedding.findOneAndUpdate(
      { boardId, nodeId: node.id },
      { boardId, nodeId: node.id, text, embedding },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error(`Failed to sync embedding for node ${node?.id}:`, err?.message || err);
  }
}

/**
 * Removes the embedding record for a deleted node.
 * @param {string|mongoose.Types.ObjectId} boardId
 * @param {string} nodeId
 */
export async function removeNodeEmbedding(boardId, nodeId) {
  if (!boardId || !nodeId) return;
  try {
    await NodeEmbedding.deleteOne({ boardId, nodeId });
  } catch (err) {
    console.error(`Failed to delete embedding for node ${nodeId}:`, err?.message || err);
  }
}

/**
 * Removes all embedding records for an entire board.
 * @param {string|mongoose.Types.ObjectId} boardId
 */
export async function removeBoardEmbeddings(boardId) {
  if (!boardId) return;
  try {
    await NodeEmbedding.deleteMany({ boardId });
  } catch (err) {
    console.error(`Failed to delete embeddings for board ${boardId}:`, err?.message || err);
  }
}
