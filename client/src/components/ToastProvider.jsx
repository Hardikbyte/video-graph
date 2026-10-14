import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext, toastFromError } from "../context/toast.js";

const AUTO_DISMISS_MS = 4000;
let nextId = 1;

function Toast({ toast, onDismiss }) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isError = toast.type === "error";

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(toast.details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShowDetails(true); // clipboard blocked: show the text so it can be selected by hand
    }
  }

  return (
    <div className={`toast toast-${toast.type}`} role={isError ? "alert" : "status"}>
      <div className="toast-head">
        <strong className="toast-title">{toast.title}</strong>
        {toast.count > 1 && <span className="toast-count">x{toast.count}</span>}
        <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
          ×
        </button>
      </div>
      {toast.message && <p className="toast-message">{toast.message}</p>}
      {toast.hint && <p className="toast-hint">{toast.hint}</p>}

      {showDetails && toast.details && <pre className="toast-details">{toast.details}</pre>}

      {(toast.details || toast.retry) && (
        <div className="toast-actions">
          {toast.retry && (
            <button
              className="btn btn-soft"
              onClick={() => {
                onDismiss();
                toast.retry();
              }}
            >
              Retry
            </button>
          )}
          {toast.details && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "Hide details" : "Details"}
              </button>
              <button className="btn btn-ghost" onClick={copyDetails}>
                {copied ? "Copied" : "Copy details"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((idOrKey) => {
    setToasts((list) => list.filter((t) => t.id !== idOrKey && t.key !== idOrKey));
  }, []);

  const show = useCallback(
    (toast) => {
      const type = toast.type || "info";
      setToasts((list) => {
        const existing = toast.key ? list.find((t) => t.key === toast.key) : null;
        if (existing) {
          // Same problem again: update it and count, do not stack a duplicate.
          return list.map((t) =>
            t.id === existing.id ? { ...t, ...toast, type, id: t.id, count: (t.count || 1) + 1 } : t
          );
        }
        const id = nextId++;
        if (type !== "error") {
          const timer = setTimeout(() => {
            timers.current.delete(id);
            setToasts((current) => current.filter((t) => t.id !== id));
          }, AUTO_DISMISS_MS);
          timers.current.set(id, timer);
        }
        return [...list, { ...toast, type, id, count: 1 }].slice(-5);
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      show,
      dismiss,
      info: (message, title = "") => show({ type: "info", title: title || message, message: title ? message : "" }),
      success: (message, title = "") =>
        show({ type: "success", title: title || message, message: title ? message : "" }),
      error: (error, options) => show(toastFromError(error, options)),
    }),
    [show, dismiss]
  );

  // Anything nobody caught ends up here, so it is visible instead of only in the console.
  useEffect(() => {
    const onRejection = (event) => value.error(event.reason, { title: "Unexpected error" });
    const onError = (event) => {
      if (/ResizeObserver loop/i.test(event.message || "")) return;
      value.error(event.error || new Error(event.message), { title: "Unexpected error" });
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    const activeTimers = timers.current;
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
      activeTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-label="Notifications">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
