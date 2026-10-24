import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/auth.js";

export default function SearchBar({
  boardId,
  open,
  onClose,
  onSelectNode,
}) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Debounced search query
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchBoard(token, boardId, trimmed);
        setResults(data?.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, boardId, token, open]);

  function handleClose() {
    setQuery("");
    setResults([]);
    setLoading(false);
    onClose();
  }

  // Keyboard navigation within the modal
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }

  function handleSelect(item) {
    if (!item?.node) return;
    onSelectNode(item.node);
    handleClose();
  }

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className="modal-card search-palette-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search notes, videos, titles, or concepts... (Esc to close)"
            value={query}
            onChange={handleQueryChange}
            aria-label="Search board"
          />
          {loading && <span className="search-spinner" aria-label="Searching">⏳</span>}
        </div>

        <div className="search-results-container">
          {query.trim() && !loading && results.length === 0 && (
            <div className="search-empty-state">
              No matching nodes found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="search-hint-state">
              Type keywords or semantic concepts to search this board
            </div>
          )}

          {results.length > 0 && (
            <ul className="search-results-list" role="listbox">
              {results.map((item, index) => {
                const node = item.node;
                const isSelected = index === selectedIndex;
                const snippet = node.text || node.notes || node.url || "";
                return (
                  <li
                    key={node.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`search-result-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-result-header">
                      <span className="search-node-type-badge">{node.type}</span>
                      <strong className="search-result-title">
                        {node.title || (node.type === "video" ? "YouTube Video" : "Untitled")}
                      </strong>
                      {node.section && (
                        <span className="search-section-badge">{node.section}</span>
                      )}
                    </div>

                    {snippet && (
                      <p className="search-result-snippet">
                        {snippet.length > 120 ? `${snippet.slice(0, 120)}...` : snippet}
                      </p>
                    )}

                    <div className="search-result-footer">
                      {item.matches?.semantic && (
                        <span className="search-match-tag tag-semantic">✨ Semantic Match</span>
                      )}
                      {item.matches?.lexical && (
                        <span className="search-match-tag tag-keyword">🔤 Exact Keyword</span>
                      )}
                      <span className="search-score">
                        Score: {(item.score * 100).toFixed(1)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
