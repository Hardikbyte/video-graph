import { Link } from "react-router-dom";
import Segmented from "./Segmented.jsx";
import SiteHeader from "./SiteHeader.jsx";
import ThemeSwitcher from "./ThemeSwitcher.jsx";

const VIEWS = [
  { value: "canvas", label: "Canvas" },
  { value: "list", label: "List" },
];

export default function BoardHeader({ name, view, onViewChange, onOpenSearch, children }) {
  return (
    <SiteHeader solid className="board-header">
      <Link className="btn btn-ghost" to="/boards" aria-label="Back to boards">
        ←<span className="hide-mobile"> Boards</span>
      </Link>
      <h1 className="board-title">{name}</h1>
      <Segmented options={VIEWS} value={view} onChange={onViewChange} label="Board view" />
      <div className="site-header-end">
        {onOpenSearch && (
          <button
            className="btn btn-ghost search-trigger-btn"
            onClick={onOpenSearch}
            title="Search board (/ or Ctrl+K)"
            aria-label="Search board"
          >
            🔍 <span className="hide-mobile">Search</span>
          </button>
        )}
        {children}
        <ThemeSwitcher />
      </div>
    </SiteHeader>
  );
}
