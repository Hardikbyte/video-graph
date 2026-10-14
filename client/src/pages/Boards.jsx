import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { api } from "../api/client.js";
import { useToast } from "../context/toast.js";

export default function Boards() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [creating, setCreating] = useState(false);
  const nameInput = useRef(null);
  const creatingRef = useRef(false); // set at once, state alone is too slow for a double click

  async function load() {
    setLoading(true);
    try {
      const data = await api.listBoards(token);
      setBoards(data);
    } catch (err) {
      toast.error(err, { title: "Could not load your boards", retry: load });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (creatingRef.current) return;
    const name = newName.trim();
    if (!name) {
      setNameError("Type a name for the board first.");
      nameInput.current?.focus();
      return;
    }
    creatingRef.current = true;
    setCreating(true);
    try {
      const board = await api.createBoard(token, name);
      setNewName("");
      navigate(`/boards/${board._id}`);
    } catch (err) {
      toast.error(err, { title: "Could not create the board" });
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this board? This cannot be undone.")) return;
    try {
      await api.deleteBoard(token, id);
      setBoards((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      toast.error(err, { title: "Could not delete the board" });
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>VideoGraph</h1>
        <div className="topbar-right">
          <span className="username">{username}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="content">
        <form className="new-board-form" onSubmit={handleCreate}>
          <input
            ref={nameInput}
            placeholder="New board name..."
            value={newName}
            maxLength={100}
            aria-invalid={nameError ? "true" : undefined}
            onChange={(e) => {
              setNewName(e.target.value);
              if (nameError) setNameError("");
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create board"}
          </button>
          {nameError && (
            <p className="form-error" role="alert">
              {nameError}
            </p>
          )}
        </form>

        {loading ? (
          <p className="muted">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="muted">No boards yet — create one above to get started.</p>
        ) : (
          <div className="board-grid">
            {boards.map((board) => (
              <div className="board-card" key={board._id} onClick={() => navigate(`/boards/${board._id}`)}>
                <div className="board-card-title">{board.name}</div>
                <div className="board-card-meta">
                  Updated {new Date(board.updatedAt).toLocaleString()}
                </div>
                <button
                  className="board-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board._id);
                  }}
                  aria-label="Delete board"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
