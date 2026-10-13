import { memo, useState } from "react";
import { useInView } from "../hooks/useInView.js";
import NodeShell from "./NodeShell.jsx";
import NodeNotes from "./NodeNotes.jsx";

function VideoNode({ id, data, selected }) {
  const [ref, inView] = useInView({ rootMargin: "200px" });
  const [playing, setPlaying] = useState(false);

  const { youtubeId, title, notes, onNoteChange } = data;

  const [prevYoutubeId, setPrevYoutubeId] = useState(youtubeId);
  if (youtubeId !== prevYoutubeId) {
    setPrevYoutubeId(youtubeId);
    setPlaying(false);
  }

  const thumbSrc = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <NodeShell id={id} data={data} selected={selected} innerRef={ref}>
      <div className="video-node-media">
        {playing ? (
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

      <NodeNotes id={id} notes={notes} onNoteChange={onNoteChange} />
    </NodeShell>
  );
}

export default memo(VideoNode);
