const TOKEN_KEY = "sdb_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = payload?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload;
}

export const api = {
  register: (username, password) =>
    request("/auth/register", { method: "POST", body: { username, password } }),
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password } }),
  me: () => request("/auth/me"),

  listUsers: () => request("/users"),

  listTables: () => request("/tables"),
  createTable: (payload) => request("/tables", { method: "POST", body: payload }),
  getTable: (slug) => request(`/tables/${slug}`),
  updateTable: (slug, payload) => request(`/tables/${slug}`, { method: "PUT", body: payload }),
  deleteTable: (slug) => request(`/tables/${slug}`, { method: "DELETE" }),

  addField: (slug, field) => request(`/tables/${slug}/fields`, { method: "POST", body: field }),
  updateField: (slug, fieldId, field) =>
    request(`/tables/${slug}/fields/${fieldId}`, { method: "PUT", body: field }),
  deleteField: (slug, fieldId) =>
    request(`/tables/${slug}/fields/${fieldId}`, { method: "DELETE" }),

  listRecords: (slug) => request(`/tables/${slug}/records`),
  createRecord: (slug, data) =>
    request(`/tables/${slug}/records`, { method: "POST", body: { data } }),
  updateRecord: (slug, id, data) =>
    request(`/tables/${slug}/records/${id}`, { method: "PUT", body: { data } }),
  deleteRecord: (slug, id) =>
    request(`/tables/${slug}/records/${id}`, { method: "DELETE" }),
};
