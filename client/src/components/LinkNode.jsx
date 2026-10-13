import { memo } from "react";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";
import { hostnameOf, normalizeUrl } from "../lib/url.js";
import { useLowDetail } from "../hooks/useLowDetail.js";

function LinkNode({ id, data }) {
  const { url, title, notes } = data;
  const lowDetail = useLowDetail();
  const safeUrl = normalizeUrl(url);
  const host = hostnameOf(safeUrl);

  return (
    <NodeShell>
      <a
        className="link-node-card nodrag"
        href={safeUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        {lowDetail ? (
          <span className="link-node-favicon" />
        ) : (
          <img
            className="link-node-favicon"
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        <span className="link-node-text">
          <span className="link-node-title">{title || host || url}</span>
          <span className="link-node-host">{host}</span>
        </span>
      </a>

      <NodeNotes id={id} notes={notes} />
    </NodeShell>
  );
}

export default memo(LinkNode);
