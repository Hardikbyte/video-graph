import { useNavigate } from "react-router-dom";

export default function BoardHeader({ name, view, onViewChange, children }) {
  const navigate = useNavigate();

  return (
    <header className="topbar board-header">
      <button className="btn btn-ghost" onClick={() => navigate("/boards")} aria-label="Back to boards">
        ←<span className="hide-mobile"> Boards</span>
      </button>
      <h1 className="board-title">{name}</h1>
      <div className="view-toggle" role="group" aria-label="Board view">
        <button
          className={`view-toggle-btn${view === "canvas" ? " view-toggle-active" : ""}`}
          onClick={() => onViewChange("canvas")}
        >
          Canvas
        </button>
        <button
          className={`view-toggle-btn${view === "list" ? " view-toggle-active" : ""}`}
          onClick={() => onViewChange("list")}
        >
          List
        </button>
      </div>
      <div className="topbar-right">{children}</div>
    </header>
  );
}
