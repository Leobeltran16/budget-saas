import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Toast({ type = "success", message, onClose }) {
  if (!message) return null;

  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const title = type === "error" ? "Error" : "Listo";

  return (
    <div className="fixed right-4 top-4 z-[1000] w-[min(92vw,420px)]">
      <div className={cx("rounded-2xl border p-4 shadow-lg", styles)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">{title}</div>
            <p className="mt-1 text-sm leading-5">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Privacy() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ type: "success", message: "" });
  const showToast = (type, msg) => setToast({ type, message: msg });
  const clearToast = () => setToast({ type: "success", message: "" });

  // auto-cierre
  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => clearToast(), 4000);
    return () => clearTimeout(t);
  }, [toast.message]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    clearToast();

    if (!email.trim() || !message.trim()) {
      showToast("error", "Completá todos los campos.");
      return;
    }

    try {
      setLoading(true);

      // ✅ IMPORTANTE: usamos apiRequest -> VITE_API_URL (producción)
      await apiRequest("/contact", {
        method: "POST",
        body: { email: email.trim(), message: message.trim() },
      });

      showToast("success", "Mensaje enviado ✅");
      setEmail("");
      setMessage("");
    } catch (err) {
      showToast("error", err?.message || "Error enviando mensaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <Toast type={toast.type} message={toast.message} onClose={clearToast} />

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta app guarda tus datos para ayudarte a gestionar tu presupuesto. No
          vendemos tu información. Si querés pedir eliminación de datos o tenés
          dudas, podés escribirnos abajo.
        </p>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Contacto (Privacidad)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Dejanos tu correo y mensaje.
          </p>

          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tu correo
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Escribí tu consulta..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cx(
                "w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
