import { memo, useState } from "react";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";
import { useLowDetail } from "../hooks/useLowDetail.js";

function ImageNode({ id, data }) {
  const { url, title, notes } = data;
  const lowDetail = useLowDetail();
  const [failed, setFailed] = useState(false);

  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    setFailed(false);
  }

  return (
    <NodeShell>
      <div className="image-node-media">
        {lowDetail ? (
          <div className="image-node-fallback" />
        ) : failed ? (
          <div className="image-node-fallback">Image could not be loaded</div>
        ) : (
          <img
            src={url}
            alt={title || "Image"}
            referrerPolicy="no-referrer"
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {title && (
        <div className="node-title" title={title}>
          {title}
        </div>
      )}

      <NodeNotes id={id} notes={notes} />
    </NodeShell>
  );
}

export default memo(ImageNode);
