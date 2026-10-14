import { memo } from "react";
import { useInView } from "../hooks/useInView.js";
import { useLowDetail } from "../hooks/useLowDetail.js";
import { useClickGuard } from "../hooks/useClickGuard.js";
import { youtubeWatchUrl } from "../lib/youtube.js";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";

const IN_VIEW_OPTIONS = { rootMargin: "200px" };

function VideoNode({ id, data }) {
  const [ref, inView] = useInView(IN_VIEW_OPTIONS);
  const lowDetail = useLowDetail();
  const clickGuard = useClickGuard();

  const { youtubeId, title, notes } = data;
  const thumbSrc = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <NodeShell innerRef={ref}>
      <div className="video-node-media">
        {lowDetail || !inView ? (
          <div className={`video-node-placeholder${lowDetail ? " video-node-static" : ""}`} />
        ) : (
          <a
            className="video-node-thumb-btn"
            href={youtubeWatchUrl(youtubeId)}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            aria-label={`Open ${title || "video"} on YouTube`}
            {...clickGuard}
          >
            <img src={thumbSrc} alt={title || youtubeId} loading="lazy" draggable={false} />
            <span className="video-node-play">▶</span>
          </a>
        )}
      </div>

      <div className="node-title" title={title || youtubeId}>
        {title || youtubeId}
      </div>

      <NodeNotes id={id} notes={notes} />
    </NodeShell>
  );
}

export default memo(VideoNode);
