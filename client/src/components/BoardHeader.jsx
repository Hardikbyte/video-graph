import { Link } from "react-router-dom";
import Segmented from "./Segmented.jsx";
import SiteHeader from "./SiteHeader.jsx";
import ThemeSwitcher from "./ThemeSwitcher.jsx";

const VIEWS = [
  { value: "canvas", label: "Canvas" },
  { value: "list", label: "List" },
];

export default function BoardHeader({ name, view, onViewChange, children }) {
  return (
    <SiteHeader solid className="board-header">
      <Link className="btn btn-ghost" to="/boards" aria-label="Back to boards">
        ←<span className="hide-mobile"> Boards</span>
      </Link>
      <h1 className="board-title">{name}</h1>
      <Segmented options={VIEWS} value={view} onChange={onViewChange} label="Board view" />
      <div className="site-header-end">
        {children}
        <ThemeSwitcher />
      </div>
    </SiteHeader>
  );
}
