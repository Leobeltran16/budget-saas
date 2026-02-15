// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * apiRequest
 * - Maneja token automáticamente (si no se pasa, toma localStorage.token)
 * - Soporta GET / POST / PATCH / DELETE
 * - Si falla: lanza Error con message claro (+ status + data)
 * - Tolera respuestas sin JSON (text/plain) y 204 No Content
 */
export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const authToken = token || localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return null;

  // Intentamos leer JSON; si no, leemos texto
  let data = null;
  let text = "";
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      text = await res.text();
      data = text ? { message: text } : null;
    }
  } catch {
    try {
      text = await res.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      data?.message || data?.error || `Error ${res.status} en la petición`;

    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
