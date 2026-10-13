import { useState } from "react";
import { extractYoutubeId } from "../lib/youtube.js";

export default function VideoFormModal({ mode = "add", initial, onSubmit, onClose }) {
  const isEdit = mode === "edit";
  const [urlOrId, setUrlOrId] = useState(initial?.urlOrId || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!urlOrId.trim()) return;
    if (isEdit && !extractYoutubeId(urlOrId)) {
      setError("Could not parse a YouTube video ID from input");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ urlOrId: urlOrId.trim(), title: title.trim(), notes: notes.trim() });
      onClose();
    } catch (err) {
      setError(err.message || (isEdit ? "Could not save video" : "Could not add video"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isEdit ? "Edit video" : "Add video"}</h2>

        <label className="field">
          <span>YouTube URL or video ID</span>
          <input
            value={urlOrId}
            onChange={(e) => setUrlOrId(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span>Title (optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My video" />
        </label>

        <label className="field">
          <span>Note (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note about this video..."
            rows={2}
          />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {isEdit ? (submitting ? "Saving..." : "Save") : submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
