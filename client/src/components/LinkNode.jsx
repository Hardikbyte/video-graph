import { memo } from "react";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";
import { hostnameOf, normalizeUrl } from "../lib/url.js";

function LinkNode({ id, data, selected }) {
  const { url, title, notes, onNoteChange } = data;
  const safeUrl = normalizeUrl(url);
  const host = hostnameOf(safeUrl);

  return (
    <NodeShell id={id} data={data} selected={selected}>
      <a
        className="link-node-card nodrag"
        href={safeUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          className="link-node-favicon"
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
          alt=""
          referrerPolicy="no-referrer"
        />
        <span className="link-node-text">
          <span className="link-node-title">{title || host || url}</span>
          <span className="link-node-host">{host}</span>
        </span>
      </a>

      <NodeNotes id={id} notes={notes} onNoteChange={onNoteChange} />
    </NodeShell>
  );
}

export default memo(LinkNode);
