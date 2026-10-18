import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler } from "../api/client.js";
import { AuthContext } from "./auth.js";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);
  const [checking, setChecking] = useState(() => !!localStorage.getItem("token"));
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
    localStorage.removeItem("username"); // from before accounts used an email
  }, [user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Any request made while signed in that comes back 401 means the login ran out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setSessionMessage("Your session expired. Log in again to continue.");
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Check a saved login once when the app opens, so a stale one is dropped straight away.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    api
      .me(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        /* a 401 signs out through the handler; other errors keep the saved login */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // only for the login that was saved when the page opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = useCallback((data) => {
    setSessionMessage("");
    setToken(data.token);
    setUser(data.user);
    setChecking(false);
  }, []);

  const login = useCallback(async (email, password) => startSession(await api.login(email, password)), [startSession]);
  const signup = useCallback(async (details) => startSession(await api.signup(details)), [startSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      username: user?.name || user?.email || "",
      checking,
      sessionMessage,
      clearSessionMessage: () => setSessionMessage(""),
      login,
      signup,
      logout,
    }),
    [token, user, checking, sessionMessage, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
