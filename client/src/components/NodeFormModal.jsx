import { useState } from "react";
import { extractYoutubeId } from "../lib/youtube.js";
import { normalizeUrl } from "../lib/url.js";

const TYPES = [
  { type: "video", label: "YouTube video", desc: "Paste a YouTube link" },
  { type: "text", label: "Text", desc: "A free-form note" },
  { type: "image", label: "Image", desc: "An image from a URL" },
  { type: "link", label: "Link", desc: "Any website" },
];

const LABELS = Object.fromEntries(TYPES.map((t) => [t.type, t.label]));

function buildPayload(type, v) {
  const section = v.section.trim();
  if (type === "video") {
    if (!extractYoutubeId(v.url)) throw new Error("Could not parse a YouTube video ID from input");
    return { type, urlOrId: v.url.trim(), title: v.title.trim(), notes: v.notes.trim(), section };
  }
  if (type === "text") {
    if (!v.text.trim()) throw new Error("Text is required");
    return { type, title: v.title.trim(), text: v.text.trim(), section };
  }
  const url = normalizeUrl(v.url);
  if (!url) throw new Error("Enter a valid http(s) URL");
  return { type, url, title: v.title.trim(), notes: v.notes.trim(), section };
}

export default function NodeFormModal({
  mode = "add",
  initial,
  sectionOptions = [],
  onSubmit,
  onClose,
}) {
  const isEdit = mode === "edit";
  const [type, setType] = useState(isEdit ? initial.type : null);
  const [values, setValues] = useState({
    url: initial?.url || "",
    title: initial?.title || "",
    notes: initial?.notes || "",
    text: initial?.text || "",
    section: initial?.section || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(buildPayload(type, values));
      onClose();
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  if (!type) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h2>What do you want to add?</h2>
          <div className="type-chooser">
            {TYPES.map((t) => (
              <button key={t.type} className="type-card" onClick={() => setType(t.type)}>
                <span className="type-card-title">{t.label}</span>
                <span className="type-card-desc">{t.desc}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const urlLabel = {
    video: "YouTube URL or video ID",
    image: "Image URL",
    link: "Website URL",
  }[type];
  const urlPlaceholder = type === "video" ? "https://youtube.com/watch?v=..." : "https://...";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{isEdit ? `Edit ${LABELS[type]}` : `Add ${LABELS[type]}`}</h2>

        {type !== "text" && (
          <label className="field">
            <span>{urlLabel}</span>
            <input
              value={values.url}
              onChange={set("url")}
              placeholder={urlPlaceholder}
              autoFocus
              required
            />
          </label>
        )}

        {type === "text" && (
          <label className="field">
            <span>Text</span>
            <textarea
              value={values.text}
              onChange={set("text")}
              placeholder="Write something..."
              rows={4}
              autoFocus
              required
            />
          </label>
        )}

        <label className="field">
          <span>{type === "image" ? "Caption (optional)" : "Title (optional)"}</span>
          <input value={values.title} onChange={set("title")} placeholder="Title" />
        </label>

        {type !== "text" && (
          <label className="field">
            <span>Note (optional)</span>
            <textarea
              value={values.notes}
              onChange={set("notes")}
              placeholder="Add a note..."
              rows={2}
            />
          </label>
        )}

        <label className="field">
          <span>Section (optional)</span>
          <input
            value={values.section}
            onChange={set("section")}
            placeholder="Group this under a heading"
            list="section-options"
          />
          <datalist id="section-options">
            {sectionOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        {error && <div className="auth-error">{error}</div>}

        <div className="modal-actions">
          {!isEdit && (
            <button type="button" className="btn btn-outline" onClick={() => setType(null)}>
              Back
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-plain" disabled={submitting}>
            {isEdit ? (submitting ? "Saving..." : "Save") : submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
