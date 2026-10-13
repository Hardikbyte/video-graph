import { memo, useState } from "react";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { useInView } from "../hooks/useInView.js";

const handles = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

function VideoNode({ id, data, selected }) {
  const [ref, inView] = useInView({ rootMargin: "200px" });
  const [playing, setPlaying] = useState(false);
  const [noteDraft, setNoteDraft] = useState(data.notes || "");

  const { youtubeId, title, onNoteChange, onEdit, onDelete } = data;

  const [prevNotes, setPrevNotes] = useState(data.notes);
  if (data.notes !== prevNotes) {
    setPrevNotes(data.notes);
    setNoteDraft(data.notes || "");
  }

  const [prevYoutubeId, setPrevYoutubeId] = useState(youtubeId);
  if (youtubeId !== prevYoutubeId) {
    setPrevYoutubeId(youtubeId);
    setPlaying(false);
  }

  const thumbSrc = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  function commitNote() {
    if (onNoteChange && noteDraft !== data.notes) {
      onNoteChange(id, noteDraft);
    }
  }

  return (
    <div className="video-node" ref={ref}>
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
          className="video-node-handle"
        />
      ))}
      {handles.map((h) => (
        <Handle
          key={`s-${h.id}`}
          id={h.id}
          type="source"
          position={h.position}
          className="video-node-handle"
        />
      ))}

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

      <div className="video-node-title" title={title || youtubeId}>
        {title || youtubeId}
      </div>

      <textarea
        className="video-node-notes nodrag nowheel"
        placeholder="Add a note..."
        value={noteDraft}
        onChange={(e) => setNoteDraft(e.target.value)}
        onBlur={commitNote}
        rows={2}
      />
    </div>
  );
}

export default memo(VideoNode);
