import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { useNodeActions } from "../context/NodeActionsContext.jsx";

const handles = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

export default function NodeShell({ id, selected, className = "", innerRef, children }) {
  const { onEdit, onDelete } = useNodeActions();

  return (
    <div className={`node-card ${className}`} ref={innerRef}>
      <NodeToolbar isVisible={selected} position={Position.Top} className="node-toolbar nodrag">
        <button className="btn btn-ghost" onClick={() => onEdit?.(id)}>
          Edit
        </button>
        <button className="btn btn-ghost btn-danger" onClick={() => onDelete?.(id)}>
          Delete
        </button>
      </NodeToolbar>
      {handles.map((h) => (
        <Handle
          key={`t-${h.id}`}
          id={h.id}
          type="target"
          position={h.position}
          className="node-handle"
        />
      ))}
      {handles.map((h) => (
        <Handle
          key={`s-${h.id}`}
          id={h.id}
          type="source"
          position={h.position}
          className="node-handle"
        />
      ))}
      {children}
    </div>
  );
}
