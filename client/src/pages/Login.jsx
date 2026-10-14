import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import Backdrop from "../components/Backdrop.jsx";
import Logo from "../components/Logo.jsx";
import ThemeSwitcher from "../components/ThemeSwitcher.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/boards");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page chai-page">
      <Backdrop />
      <form className="auth-card" onSubmit={handleSubmit}>
        <Logo asLink={false} />
        <h1>Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to organize your videos, notes and links on <span className="highlight">visual boards</span>.
        </p>

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="auth-theme">
        <ThemeSwitcher />
      </div>
    </div>
  );
}
