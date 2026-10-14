import { memo, useState } from "react";
import { useInView } from "../hooks/useInView.js";
import { hostnameOf, normalizeUrl } from "../lib/url.js";
import { youtubeWatchUrl } from "../lib/youtube.js";

const IN_VIEW_OPTIONS = { rootMargin: "300px" };

function VideoMedia({ youtubeId, title }) {
  const [ref, inView] = useInView(IN_VIEW_OPTIONS);

  return (
    <div className="list-media" ref={ref}>
      {inView ? (
        <a
          className="video-node-thumb-btn"
          href={youtubeWatchUrl(youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${title || "video"} on YouTube`}
        >
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={title || youtubeId}
            loading="lazy"
          />
          <span className="video-node-play">▶</span>
        </a>
      ) : (
        <div className="video-node-placeholder" />
      )}
    </div>
  );
}

function ImageMedia({ url, title }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="list-image">
      {failed ? (
        <div className="image-node-fallback">Image could not be loaded</div>
      ) : (
        <img
          src={url}
          alt={title || "Image"}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function LinkCard({ url, title }) {
  const safeUrl = normalizeUrl(url);
  const host = hostnameOf(safeUrl);

  return (
    <a
      className="link-node-card"
      href={safeUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="link-node-favicon"
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <span className="link-node-text">
        <span className="link-node-title">{title || host || url}</span>
        <span className="link-node-host">{host}</span>
      </span>
    </a>
  );
}

function ListItem({ node, onOpenOnCanvas }) {
  const type = node.type || "video";
  const { title, notes, text, url, youtubeId } = node;

  return (
    <article className={`list-item list-item-${type}`}>
      {type === "video" && <VideoMedia youtubeId={youtubeId} title={title} />}
      {type === "image" && <ImageMedia url={url} title={title} />}
      {type === "link" && <LinkCard url={url} title={title} />}

      {type !== "link" && (title || type === "video") && (
        <h3 className="list-item-title">{title || youtubeId}</h3>
      )}
      {type === "text" && <p className="list-item-text">{text}</p>}
      {notes && <p className="list-item-notes">{notes}</p>}

      <button className="list-item-canvas btn btn-ghost" onClick={() => onOpenOnCanvas(node.id)}>
        Open on canvas
      </button>
    </article>
  );
}

export default memo(ListItem);
