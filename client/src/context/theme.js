import { createContext, useContext } from "react";

export const THEME_KEY = "chaiui-theme";

export const ThemeContext = createContext({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}
