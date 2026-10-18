import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { validateEmail } from "../lib/validation.js";
import AuthCard from "../components/AuthCard.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function Login() {
  const { login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const problem = validateEmail(email);
    setEmailError(problem);
    if (problem) return;
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/boards", { replace: true });
    } catch (err) {
      setError(err.message || "Could not log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      lead={
        <>
          Log in to organize your videos, notes and links on <span className="highlight">visual boards</span>.
        </>
      }
      onSubmit={handleSubmit}
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      {sessionMessage && !error && <div className="auth-notice">{sessionMessage}</div>}

      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          autoComplete="email"
          autoFocus
          aria-invalid={emailError ? "true" : undefined}
        />
        {emailError && <small className="field-error">{emailError}</small>}
      </div>

      <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}
      </button>
    </AuthCard>
  );
}
