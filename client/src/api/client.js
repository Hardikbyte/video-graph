const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password } }),

  listBoards: (token) => request("/boards", { token }),

  createBoard: (token, name) =>
    request("/boards", { method: "POST", body: { name }, token }),

  getBoard: (token, id) => request(`/boards/${id}`, { token }),

  saveBoard: (token, id, { nodes, edges, name }) =>
    request(`/boards/${id}`, { method: "PUT", body: { nodes, edges, name }, token }),

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
};
