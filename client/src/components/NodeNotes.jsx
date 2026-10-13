import { useState } from "react";

export default function NodeNotes({ id, notes, onNoteChange }) {
  const [draft, setDraft] = useState(notes || "");

  const [prevNotes, setPrevNotes] = useState(notes);
  if (notes !== prevNotes) {
    setPrevNotes(notes);
    setDraft(notes || "");
  }

  function commit() {
    if (onNoteChange && draft !== notes) {
      onNoteChange(id, draft);
    }
  }

  return (
    <textarea
      className="node-notes nodrag nowheel"
      placeholder="Add a note..."
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      rows={2}
    />
  );
}
