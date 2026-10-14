import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Builds the content of an error toast from any thrown value.
// ApiError instances carry their own hint and technical details.
export function toastFromError(error, { title = "Something went wrong", context, key, retry } = {}) {
  const reason = error?.message || String(error);
  const message = context ? `${context}: ${reason}` : reason;
  return {
    type: "error",
    key: key ?? `${title}:${message}`,
    title,
    message,
    hint: error?.hint || "",
    details: typeof error?.toDetails === "function" ? error.toDetails() : error?.stack || reason,
    retry,
  };
}
