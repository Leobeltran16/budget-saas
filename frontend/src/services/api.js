// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * apiRequest
 * - Maneja token automáticamente (si no se pasa, toma localStorage.token)
 * - Soporta GET / POST / PATCH / DELETE
 * - Si falla: lanza Error con message claro (+ status + data)
 * - Tolera respuestas sin JSON (text/plain) y 204 No Content
 * - ✅ NUEVO: timeout para que no quede "enviando" infinito
 * - ✅ NUEVO: normaliza URL para evitar dobles //
 */
export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const authToken = token || localStorage.getItem("token");

  // ✅ Normalizamos para evitar: API_URL con "/" al final + path con "/" al inicio => "//"
  const base = String(API_URL).replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  const url = `${base}${p}`;

  // ✅ Timeout (12s) para evitar "enviando" infinito si Render/Vercel no responde
  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    clearTimeout(timeoutId);

    // ✅ Error de timeout o red (CORS, DNS, caída server)
    const isAbort = err?.name === "AbortError";
    const error = new Error(
      isAbort
        ? "La petición tardó demasiado (timeout). Probá de nuevo."
        : "No se pudo conectar con el servidor. Revisá tu conexión o el backend."
    );
    error.status = 0;
    error.data = null;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

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
