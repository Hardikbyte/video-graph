import { useTheme } from "../context/theme.js";

// A half-circle icon with one label for both themes (avoids a mismatch before hydration).
export default function ThemeSwitcher() {
  const { toggle } = useTheme();

  return (
    <button className="theme-switch" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
