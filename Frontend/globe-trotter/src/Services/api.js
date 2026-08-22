const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function token() { return localStorage.getItem("globetrotter_token"); }

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "We could not complete that request.");
  return body;
}
