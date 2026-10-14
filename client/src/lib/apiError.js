// Turns a failed request into an error with a readable message, a hint on what to do,
// and the technical details. Pure (no browser APIs), so it can be unit tested.

const RESTART_HINT =
  "The server is probably running an older version. Stop it and run `npm start` in the server folder.";

function parseBody(bodyText) {
  if (!bodyText) return { json: null, looksLikeHtml: false };
  try {
    return { json: JSON.parse(bodyText), looksLikeHtml: false };
  } catch {
    return { json: null, looksLikeHtml: /^\s*<(!doctype|html)/i.test(bodyText) };
  }
}

export class ApiError extends Error {
  constructor(message, info = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, info);
  }

  // Everything useful for a bug report, as plain text.
  toDetails() {
    return [
      `Request: ${this.method} ${this.url}`,
      this.status ? `Status: ${this.status}` : "Status: no response",
      `Message: ${this.message}`,
      this.detail ? `Server detail: ${this.detail}` : null,
      this.hint ? `Hint: ${this.hint}` : null,
      this.body ? `Response body: ${this.body}` : null,
      this.cause ? `Browser error: ${this.cause}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }
}

export function buildApiError({ method, url, path, status, bodyText, networkError }) {
  const base = { method, url, path, status: status ?? 0 };

  if (networkError) {
    const origin = (() => {
      try {
        return new URL(url).origin;
      } catch {
        return url;
      }
    })();
    return new ApiError(`Could not reach the server at ${origin}`, {
      ...base,
      hint: "Is the server running? Start it with `npm start` in the server folder, then retry.",
      cause: networkError.message || String(networkError),
    });
  }

  const { json, looksLikeHtml } = parseBody(bodyText);
  const serverMessage = typeof json?.error === "string" ? json.error : "";
  const detail = typeof json?.detail === "string" ? json.detail : "";
  const body = (bodyText || "").slice(0, 1500);
  const extra = { ...base, body, detail };

  if (status === 401) {
    return new ApiError(serverMessage || "You are not signed in", {
      ...extra,
      hint: "Your session may have expired. Log out and log in again.",
    });
  }
  if (status === 404 && (looksLikeHtml || (!json && !serverMessage))) {
    return new ApiError(`${method} ${path} was not found on the server`, { ...extra, hint: RESTART_HINT });
  }
  if (status === 405) {
    return new ApiError(`${method} ${path} is not allowed by the server`, { ...extra, hint: RESTART_HINT });
  }
  if (status >= 500) {
    return new ApiError(serverMessage || `The server failed with status ${status}`, {
      ...extra,
      hint: detail ? "" : "Check the server console for the full error.",
    });
  }
  return new ApiError(serverMessage || `Request failed with status ${status}`, extra);
}
