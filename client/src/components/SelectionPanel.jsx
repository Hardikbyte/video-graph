import { normalizeUrl } from "../lib/url.js";
import { DEFAULT_EDGE_COLOR, EDGE_PRESET_COLORS } from "../lib/edgeStyle.js";

const TYPE_LABELS = { video: "Video", text: "Text", image: "Image", link: "Link" };

function nodeSummary(node) {
  const { title, text, url, youtubeId } = node.data;
  return title || (node.type === "text" ? text : node.type === "video" ? youtubeId : url) || "";
}

function nodeHref(node) {
  if (node.type === "video") return `https://youtu.be/${node.data.youtubeId}`;
  if (node.type === "link" || node.type === "image") return normalizeUrl(node.data.url);
  return null;
}

function NodePanel({ node, onEdit, onDelete }) {
  const href = nodeHref(node);

  return (
    <div className="selection-panel" role="toolbar" aria-label="Selected node">
      <div className="selection-panel-info">
        <span className="selection-panel-type">{TYPE_LABELS[node.type] || node.type}</span>
        <span className="selection-panel-title">{nodeSummary(node)}</span>
      </div>
      <div className="selection-panel-actions">
        {href && (
          <a className="btn btn-ghost" href={href} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        )}
        <button className="btn btn-ghost" onClick={() => onEdit(node.id)}>
          Edit
        </button>
        <button className="btn btn-ghost btn-danger" onClick={() => onDelete(node.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

function EdgePanel({ edge, onUpdate, onDelete }) {
  const { color, label, lineStyle = "solid", arrow } = edge.data;
  const current = color || DEFAULT_EDGE_COLOR;

  return (
    <div className="selection-panel selection-panel-edge" role="toolbar" aria-label="Selected edge">
      <div className="selection-panel-row">
        {EDGE_PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`edge-swatch${current === c ? " edge-swatch-active" : ""}`}
            style={{ background: c }}
            aria-label={`Set color ${c}`}
            onClick={() => onUpdate(edge.id, { color: c })}
          />
        ))}
        <input
          type="color"
          className="edge-color-input"
          value={current}
          aria-label="Custom color"
          onChange={(e) => onUpdate(edge.id, { color: e.target.value })}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onUpdate(edge.id, { color: null })}
        >
          Reset
        </button>
      </div>

      <div className="selection-panel-row">
        <input
          className="edge-label-input"
          value={label || ""}
          placeholder="Label"
          maxLength={60}
          onChange={(e) => onUpdate(edge.id, { label: e.target.value })}
        />
        <select
          className="edge-select"
          value={lineStyle}
          aria-label="Line style"
          onChange={(e) => onUpdate(edge.id, { lineStyle: e.target.value })}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
        <label className="edge-check">
          <input
            type="checkbox"
            checked={!!arrow}
            onChange={(e) => onUpdate(edge.id, { arrow: e.target.checked })}
          />
          Arrow
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          onClick={() => onDelete(edge.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Fixed bar shown when exactly one node or one edge is selected. It does not
// scale with the canvas zoom, so it stays usable on phones and when zoomed out.
export default function SelectionPanel({
  node,
  edge,
  onNodeEdit,
  onNodeDelete,
  onEdgeUpdate,
  onEdgeDelete,
}) {
  if (node) return <NodePanel node={node} onEdit={onNodeEdit} onDelete={onNodeDelete} />;
  if (edge) return <EdgePanel edge={edge} onUpdate={onEdgeUpdate} onDelete={onEdgeDelete} />;
  return null;
}
