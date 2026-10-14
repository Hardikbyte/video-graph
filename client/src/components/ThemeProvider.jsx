import { useCallback, useEffect, useMemo, useState } from "react";
import { THEME_KEY, ThemeContext } from "../context/theme.js";

function readTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// Dark by default. The inline script in index.html applies the saved theme before first paint.
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#ffffff" : "#0a0a0a");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage blocked: the theme still works for this visit */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
