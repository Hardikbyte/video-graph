import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { api } from "../api/client.js";

export default function Boards() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.listBoards(token);
      setBoards(data);
    } catch (err) {
      setError(err.message);
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
    if (!newName.trim()) return;
    try {
      const board = await api.createBoard(token, newName.trim());
      setNewName("");
      navigate(`/boards/${board._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this board? This cannot be undone.")) return;
    try {
      await api.deleteBoard(token, id);
      setBoards((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.message);
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
            placeholder="New board name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Create board
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}

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
