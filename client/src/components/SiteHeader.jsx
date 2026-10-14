import { useScrolled } from "../hooks/useScrolled.js";

// Sticky, transparent header that blurs after scrolling. `solid` keeps the blur on
// (used on board screens, where the content scrolls inside the page instead of the window).
export default function SiteHeader({ solid = false, className = "", children }) {
  const scrolled = useScrolled();
  const classes = ["site-header", scrolled ? "scrolled" : "", solid ? "solid" : "", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="site-header-inner">{children}</div>
    </header>
  );
}
