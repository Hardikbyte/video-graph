import { buildApiError } from "../lib/apiError.js";

// Bump together with API_VERSION in the server when the routes change.
export const REQUIRED_API_VERSION = 3;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Called when a request made with a saved login comes back 401, so the app can sign out.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function request(path, { method = "GET", body, token, keepalive } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE}${path}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      keepalive,
    });
  } catch (networkError) {
    throw buildApiError({ method, url, path, networkError });
  }

  if (res.status === 204) return null;

  const bodyText = await res.text();
  if (!res.ok) {
    const error = buildApiError({ method, url, path, status: res.status, bodyText });
    if (res.status === 401 && token) unauthorizedHandler?.(error);
    throw error;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  signup: ({ name, email, password }) =>
    request("/auth/signup", { method: "POST", body: { name, email, password } }),

  me: (token) => request("/auth/me", { token }),

  listBoards: (token) => request("/boards", { token }),

  createBoard: (token, name) =>
    request("/boards", { method: "POST", body: { name }, token }),

  getBoard: (token, id) => request(`/boards/${id}`, { token }),

  saveBoard: (token, id, { nodes, edges, name }) =>
    request(`/boards/${id}`, { method: "PUT", body: { nodes, edges, name }, token }),

  health: () => request("/health"),

  getNodesPage: (token, id, { cursor, limit } = {}) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    const query = params.toString();
    return request(`/boards/${id}/nodes${query ? `?${query}` : ""}`, { token });
  },

  deleteBoard: (token, id) => request(`/boards/${id}`, { method: "DELETE", token }),

  addNode: (token, id, node) =>
    request(`/boards/${id}/nodes`, { method: "POST", body: node, token }),

  // Granular writes: each one touches only the elements that changed.
  patchLayout: (token, id, positions, opts) =>
    request(`/boards/${id}/layout`, { method: "PATCH", body: { positions }, token, ...opts }),

  patchNode: (token, id, nodeId, patch, opts) =>
    request(`/boards/${id}/nodes/${nodeId}`, { method: "PATCH", body: patch, token, ...opts }),

  deleteNode: (token, id, nodeId, opts) =>
    request(`/boards/${id}/nodes/${nodeId}`, { method: "DELETE", token, ...opts }),

  createEdge: (token, id, edge, opts) =>
    request(`/boards/${id}/edges`, { method: "POST", body: edge, token, ...opts }),

  patchEdge: (token, id, edgeId, patch, opts) =>
    request(`/boards/${id}/edges/${edgeId}`, { method: "PATCH", body: patch, token, ...opts }),

  deleteEdge: (token, id, edgeId, opts) =>
    request(`/boards/${id}/edges/${edgeId}`, { method: "DELETE", token, ...opts }),
};
