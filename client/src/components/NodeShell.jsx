import { Handle, Position } from "@xyflow/react";

const handles = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

export default function NodeShell({ className = "", innerRef, children }) {
  return (
    <div className={`node-card ${className}`} ref={innerRef}>
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
