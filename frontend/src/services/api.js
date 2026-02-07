const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function apiRequest(
  path,
  { method = "GET", body, token } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.message || "Error en la petición");
    err.status = res.status;   // ✅ CLAVE para no desloguear por error de red
    err.data = data;           // opcional (debug)
    throw err;
  }

  return data;
}
