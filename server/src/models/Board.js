import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["video", "text", "image", "link"], default: "video" },
    youtubeId: { type: String, default: "", match: /^[a-zA-Z0-9_-]{11}$/ },
    text: { type: String, default: "" },
    url: { type: String, default: "" },
    section: { type: String, default: "" },
    title: { type: String, default: "" },
    notes: { type: String, default: "" },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    target: { type: String, required: true },
    targetHandle: { type: String, default: null },
    color: { type: String, default: null },
    label: { type: String, default: "" },
    lineStyle: { type: String, enum: ["solid", "dashed", "dotted"], default: "solid" },
    arrow: { type: Boolean, default: false },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    nodes: { type: [nodeSchema], default: [] },
    edges: { type: [edgeSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Board", boardSchema);
