import { useState } from "react";

export default function AddVideoModal({ onAdd, onClose }) {
  const [urlOrId, setUrlOrId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!urlOrId.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onAdd({ urlOrId: urlOrId.trim(), title: title.trim(), notes: notes.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Could not add video");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add video</h2>

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
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
