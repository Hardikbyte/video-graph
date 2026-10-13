import { memo, useState } from "react";
import { useInView } from "../hooks/useInView.js";
import { useLowDetail } from "../hooks/useLowDetail.js";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";

const IN_VIEW_OPTIONS = { rootMargin: "200px" };

function VideoNode({ id, data }) {
  const [ref, inView] = useInView(IN_VIEW_OPTIONS);
  const lowDetail = useLowDetail();
  const [playing, setPlaying] = useState(false);

  const { youtubeId, title, notes } = data;

  const [prevYoutubeId, setPrevYoutubeId] = useState(youtubeId);
  if (youtubeId !== prevYoutubeId) {
    setPrevYoutubeId(youtubeId);
    setPlaying(false);
  }

  const thumbSrc = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <NodeShell innerRef={ref}>
      <div className="video-node-media">
        {lowDetail ? (
          <div className="video-node-placeholder video-node-static" />
        ) : playing ? (
          <iframe
            className="video-node-iframe"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={title || youtubeId}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : inView ? (
          <button
            className="video-node-thumb-btn"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            <img src={thumbSrc} alt={title || youtubeId} loading="lazy" />
            <span className="video-node-play">▶</span>
          </button>
        ) : (
          <div className="video-node-placeholder" />
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
