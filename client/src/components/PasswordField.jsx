import { useId, useState } from "react";

// A password input with a show / hide button and an optional hint or error.
export default function PasswordField({ label, value, onChange, autoComplete, hint, error, autoFocus }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {(error || hint) && (
        <small id={`${id}-note`} className={error ? "field-error" : "field-hint"}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
