import mongoose from "mongoose";

const nodeEmbeddingSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    nodeId: { type: String, required: true, index: true },
    text: { type: String, default: "" },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of embedding per node on a board
nodeEmbeddingSchema.index({ boardId: 1, nodeId: 1 }, { unique: true });

export default mongoose.models.NodeEmbedding || mongoose.model("NodeEmbedding", nodeEmbeddingSchema);
