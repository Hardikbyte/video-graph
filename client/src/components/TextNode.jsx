import { memo } from "react";
import NodeShell from "./NodeShell.jsx";

function TextNode({ data }) {
  const { title, text } = data;

  return (
    <NodeShell>
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
