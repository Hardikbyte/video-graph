import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { api } from "../api/client.js";
import { useToast } from "../context/toast.js";
import Backdrop from "../components/Backdrop.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Logo from "../components/Logo.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import ThemeSwitcher from "../components/ThemeSwitcher.jsx";

export default function Boards() {
  const { token, username, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { board, total }
  const [deleting, setDeleting] = useState(false);
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

  // Ask first, and say how many items go with the board.
  async function askToDelete(board) {
    setPendingDelete({ board, total: null });
    try {
      const page = await api.getNodesPage(token, board._id, { limit: 1 });
      setPendingDelete((current) => (current?.board._id === board._id ? { board, total: page.total } : current));
    } catch {
      /* the dialog still works without the count */
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteBoard(token, pendingDelete.board._id);
      setBoards((prev) => prev.filter((b) => b._id !== pendingDelete.board._id));
      setPendingDelete(null);
    } catch (err) {
      toast.error(err, { title: "Could not delete the board" });
    } finally {
      setDeleting(false);
    }
  }

  const deleteTotal = pendingDelete?.total;

  return (
    <div className="page chai-page">
      <Backdrop />
      <SiteHeader>
        <Logo />
        <div className="site-header-end">
          <span className="username">{username}</span>
          <ThemeSwitcher />
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </SiteHeader>

      <main className="content">
        <section className="page-intro">
          <h1 className="page-title">Your boards</h1>
          <p className="page-lead">
            Keep videos, notes and links together on <span className="highlight">visual boards</span> you can arrange
            and share.
          </p>
        </section>

        <form className="new-board-form" onSubmit={handleCreate}>
          <input
            ref={nameInput}
            placeholder="New board name..."
            aria-label="New board name"
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
          <p className="muted page-status">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="muted page-status">No boards yet. Create one above to get started.</p>
        ) : (
          <div className="board-grid">
            {boards.map((board) => (
              <div className="board-card" key={board._id} onClick={() => navigate(`/boards/${board._id}`)}>
                <div className="board-card-title">{board.name}</div>
                <div className="board-card-meta">Updated {new Date(board.updatedAt).toLocaleString()}</div>
                <button
                  className="board-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    askToDelete(board);
                  }}
                  aria-label={`Delete ${board.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete ? `Delete "${pendingDelete.board.name}"?` : ""}
        confirmLabel="Delete board"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      >
        This permanently deletes the board
        {typeof deleteTotal === "number"
          ? ` and its ${deleteTotal} ${deleteTotal === 1 ? "item" : "items"}`
          : " and everything on it"}
        . This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
