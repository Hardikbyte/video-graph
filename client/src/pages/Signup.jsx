import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import { validateEmail, validateNewPassword } from "../lib/validation.js";
import AuthCard from "../components/AuthCard.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const found = { email: validateEmail(email), password: validateNewPassword(password) };
    setErrors(found);
    if (found.email || found.password) return;

    setLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      navigate("/boards", { replace: true });
    } catch (err) {
      // "An account with this email already exists" belongs next to the email field.
      if (err.status === 409) setErrors({ email: err.message });
      else setError(err.message || "Could not create the account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      lead={
        <>
          Keep your videos, notes and links on boards that stay <span className="highlight">private to you</span>.
        </>
      }
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <div className="field">
        <label htmlFor="signup-name">Name (optional)</label>
        <input
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={60}
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((current) => ({ ...current, email: "" }));
          }}
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
        />
        {errors.email && <small className="field-error">{errors.email}</small>}
      </div>

      <PasswordField
        label="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((current) => ({ ...current, password: "" }));
        }}
        autoComplete="new-password"
        hint="At least 8 characters."
        error={errors.password}
      />

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </button>
    </AuthCard>
  );
}
