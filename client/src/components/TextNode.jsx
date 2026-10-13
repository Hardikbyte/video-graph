import { memo } from "react";
import NodeShell from "./NodeShell.jsx";

function TextNode({ id, data, selected }) {
  const { title, text } = data;

  return (
    <NodeShell id={id} selected={selected}>
      {title && (
        <div className="node-title" title={title}>
          {title}
        </div>
      )}
      <div className="text-node-body nowheel">{text}</div>
    </NodeShell>
  );
}

export default memo(TextNode);
