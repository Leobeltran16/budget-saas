import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function AdminNotes() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadNotes() {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/admin/notes", { method: "GET" });
      // soporta {notes} o {success, notes}
      const list = Array.isArray(res?.notes) ? res.notes : Array.isArray(res) ? res : [];
      setNotes(list);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las notas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const email = String(n?.email || "").toLowerCase();
      const msg = String(n?.message || "").toLowerCase();
      const page = String(n?.page || "").toLowerCase();
      return email.includes(q) || msg.includes(q) || page.includes(q);
    });
  }, [notes, query]);

  const stats = useMemo(() => {
    const total = notes.length;
    const unread = notes.filter((n) => (n?.status || "new") === "new").length;
    const read = total - unread;
    return { total, unread, read };
  }, [notes]);

  async function markRead(id) {
    setBusyId(id);
    setError("");
    try {
      // ✅ FIX: tu backend no tiene /read. Es PATCH /admin/notes/:id con {status:"read"}
      await apiRequest(`/admin/notes/${id}`, {
        method: "PATCH",
        body: { status: "read" },
      });

      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, status: "read" } : n)));
    } catch (e) {
      setError(e?.message || "No se pudo marcar como leído.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeNote(id) {
    const ok = window.confirm("¿Borrar esta nota? Esta acción no se puede deshacer.");
    if (!ok) return;

    setBusyId(id);
    setError("");
    try {
      await apiRequest(`/admin/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      setError(e?.message || "No se pudo borrar la nota.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Panel Admin · Notas</h1>
          <p className="mt-1 text-sm text-slate-300">
            Mensajes enviados desde Privacy/Contacto. Solo visible para administradores.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por email, mensaje o página…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-white/20 sm:w-80"
          />
          <button
            onClick={loadNotes}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"
          >
            Recargar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-300">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-300">Nuevas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{stats.unread}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-300">Leídas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{stats.read}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-slate-100">Notas</p>
          <p className="text-xs text-slate-300">
            {loading ? "Cargando…" : `${filtered.length} resultado(s)`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-white/5 text-xs text-slate-300">
              <tr>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Página</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-300" colSpan={6}>
                    Cargando notas…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-300" colSpan={6}>
                    No hay notas para mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => {
                  const status = n?.status || "new";
                  const isBusy = busyId === n?._id;

                  return (
                    <tr key={n?._id} className="align-top">
                      <td className="px-4 py-4">
                        <span
                          className={cx(
                            "inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
                            status === "new"
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                          )}
                        >
                          {status === "new" ? "Nueva" : "Leída"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-100">{n?.email || "-"}</td>

                      <td className="px-4 py-4 text-slate-300">{n?.page || "-"}</td>

                      <td className="px-4 py-4">
                        <p className="max-w-[520px] whitespace-pre-wrap text-slate-100">
                          {n?.message || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {n?.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={isBusy || status !== "new"}
                            onClick={() => markRead(n._id)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-xs font-semibold",
                              status !== "new"
                                ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-400"
                                : "border-white/10 bg-white/10 text-slate-100 hover:bg-white/15",
                              isBusy ? "opacity-60" : ""
                            )}
                          >
                            Marcar leído
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => removeNote(n._id)}
                            className={cx(
                              "rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/15",
                              isBusy ? "opacity-60" : ""
                            )}
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
