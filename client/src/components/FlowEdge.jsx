import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

const DEFAULT_COLOR = "#9aa1c4";
const PRESET_COLORS = [
  "#6c8cff",
  "#ff6b81",
  "#ffb86b",
  "#f1fa8c",
  "#50fa7b",
  "#8be9fd",
  "#bd93f9",
  "#ffffff",
];
const DASH_ARRAYS = { solid: undefined, dashed: "8 5", dotted: "2 6" };

function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  data = {},
}) {
  const { color, label, lineStyle = "solid", arrow, onEdgeUpdate, onEdgeDelete } = data;
  const stroke = color || DEFAULT_COLOR;

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: DASH_ARRAYS[lineStyle],
        }}
      />

      <EdgeLabelRenderer>
        {selected ? (
          <div
            className="edge-toolbar nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <div className="edge-toolbar-row">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`edge-swatch${stroke === c ? " edge-swatch-active" : ""}`}
                  style={{ background: c }}
                  aria-label={`Set color ${c}`}
                  onClick={() => onEdgeUpdate?.(id, { color: c })}
                />
              ))}
              <input
                type="color"
                className="edge-color-input"
                value={color || DEFAULT_COLOR}
                aria-label="Custom color"
                onChange={(e) => onEdgeUpdate?.(id, { color: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-ghost edge-reset"
                onClick={() => onEdgeUpdate?.(id, { color: null })}
              >
                Reset
              </button>
            </div>

            <div className="edge-toolbar-row">
              <input
                className="edge-label-input"
                value={label || ""}
                placeholder="Label"
                maxLength={60}
                onChange={(e) => onEdgeUpdate?.(id, { label: e.target.value })}
              />
              <select
                className="edge-select"
                value={lineStyle}
                aria-label="Line style"
                onChange={(e) => onEdgeUpdate?.(id, { lineStyle: e.target.value })}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
              <label className="edge-check">
                <input
                  type="checkbox"
                  checked={!!arrow}
                  onChange={(e) => onEdgeUpdate?.(id, { arrow: e.target.checked })}
                />
                Arrow
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                onClick={() => onEdgeDelete?.(id)}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          label && (
            <div
              className="edge-label nodrag nopan"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                borderColor: stroke,
              }}
            >
              {label}
            </div>
          )
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(FlowEdge);
