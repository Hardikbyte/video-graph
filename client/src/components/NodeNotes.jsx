import { useState } from "react";
import { useNodeActions } from "../context/NodeActionsContext.jsx";
import { useLowDetail } from "../hooks/useLowDetail.js";

export default function NodeNotes({ id, notes }) {
  const { onNoteChange } = useNodeActions();
  const lowDetail = useLowDetail();
  const [draft, setDraft] = useState(notes || "");

  const [prevNotes, setPrevNotes] = useState(notes);
  if (notes !== prevNotes) {
    setPrevNotes(notes);
    setDraft(notes || "");
  }

  function commit() {
    if (draft !== notes) {
      onNoteChange(id, draft);
    }
  }

  if (lowDetail) {
    return <div className="node-notes node-notes-static">{notes}</div>;
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
