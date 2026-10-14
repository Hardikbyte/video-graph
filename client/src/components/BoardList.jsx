import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/auth.js";
import { api } from "../api/client.js";
import { useToast } from "../context/toast.js";
import { useInfiniteNodes } from "../hooks/useInfiniteNodes.js";
import BoardHeader from "./BoardHeader.jsx";
import ListItem from "./ListItem.jsx";
import NodeFormModal from "./NodeFormModal.jsx";

export default function BoardList({ boardId, view, onViewChange, onOpenOnCanvas }) {
  const { token } = useAuth();
  const toast = useToast();
  const retryRef = useRef(null);
  const { items, status, error, name, total, sections, nextCursor, loadMore, loadUntil, reload } =
    useInfiniteNodes(token, boardId, {
      onError: (err) =>
        toast.error(err, { title: "Could not load items", key: "list-load", retry: () => retryRef.current?.() }),
    });

  useEffect(() => {
    retryRef.current = () => (items.length ? loadMore() : reload());
  }, [items.length, loadMore, reload]);

  const [showAddModal, setShowAddModal] = useState(false);
  const sentinelRef = useRef(null);
  const headingRefs = useRef(new Map());
  const jumpTarget = useRef(null);

  // Ask for the next chunk whenever the sentinel gets near the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, items.length, loadMore]);

  // After a jump has loaded enough chunks, scroll to the heading once it is rendered.
  useEffect(() => {
    const target = jumpTarget.current;
    const heading = target && headingRefs.current.get(target);
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      jumpTarget.current = null;
    }
  }, [items]);

  async function jumpTo(section) {
    jumpTarget.current = section.name;
    const heading = headingRefs.current.get(section.name);
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      jumpTarget.current = null;
      return;
    }
    await loadUntil(section.offset);
  }

  async function handleAdd(payload) {
    const position = { x: 80 + Math.random() * 400, y: 80 + Math.random() * 300 };
    await api.addNode(token, boardId, { ...payload, position });
    await reload();
  }

  const namedSections = sections.filter((s) => s.name);

  // A heading goes above the first item of each run of the same section.
  const rows = useMemo(() => {
    const result = [];
    let previous = null;
    for (const node of items) {
      const section = node.section || "";
      result.push({ node, heading: section && section !== previous ? section : null });
      if (section) previous = section;
    }
    return result;
  }, [items]);

  return (
    <div className="board-page">
      <BoardHeader name={name} view={view} onViewChange={onViewChange}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </BoardHeader>

      {status === "error" && items.length === 0 ? (
        <div className="page-center auth-error">{error}</div>
      ) : (
        <div className="board-list">
          {namedSections.length > 1 && (
            <nav className="section-chips" aria-label="Sections">
              {namedSections.map((section) => (
                <button key={section.name} className="chip" onClick={() => jumpTo(section)}>
                  {section.name}
                </button>
              ))}
            </nav>
          )}

          {status === "loading" && <p className="muted list-status">Loading...</p>}

          {status === "ready" && items.length === 0 && (
            <p className="muted list-status">Nothing here yet. Use + Add to create the first item.</p>
          )}

          <div className="list-grid">
            {rows.map(({ node, heading }) => (
              <div className="list-cell" key={node.id}>
                {heading && (
                  <h2
                    className="list-section-heading"
                    ref={(el) => {
                      if (el) headingRefs.current.set(heading, el);
                      else headingRefs.current.delete(heading);
                    }}
                  >
                    {heading}
                  </h2>
                )}
                <ListItem node={node} onOpenOnCanvas={onOpenOnCanvas} />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
          <p className="muted list-status">
            {nextCursor
              ? `Showing ${items.length} of ${total}`
              : items.length
                ? `All ${total} items loaded`
                : ""}
          </p>
          {status === "error" && items.length > 0 && (
            <div className="auth-error list-status">{error}</div>
          )}
        </div>
      )}

      {showAddModal && (
        <NodeFormModal
          sectionOptions={namedSections.map((s) => s.name)}
          onSubmit={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
