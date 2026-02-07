import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResetLink("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });

      setSuccess(
        data?.message ||
          "Si el email existe, te enviaremos un link para resetear la contraseña."
      );

      // ✅ Opción A: para pruebas devolvemos link
      if (data?.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err.message || "Error al solicitar recuperación de contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        {/* Left */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Recuperación segura
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Recuperar contraseña
          </h1>

          <p className="mt-3 text-sm text-slate-200/70 max-w-xl">
            Ingresá tu email y te daremos un link para restablecer la contraseña.
          </p>

          <div className="mt-6 grid gap-3 max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Token temporal</div>
              <div className="mt-1 text-xs text-slate-200/70">
                Expira automáticamente para mayor seguridad.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Flujo simple</div>
              <div className="mt-1 text-xs text-slate-200/70">
                Primero validamos el flujo (fase A). Email real (fase B).
              </div>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="lg:justify-self-end w-full">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Olvidé mi contraseña
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Te enviaremos (por ahora te mostramos) un link para resetearla.
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Email</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Generar link de recuperación"}
              </button>
            </form>

            {/* ✅ Link dev para pruebas */}
            {resetLink && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">
                  Link de reset (modo dev):
                </div>
                <a
                  href={resetLink}
                  className="mt-2 block break-all font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {resetLink}
                </a>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Volver a login
              </Link>

              <Link
                to="/"
                className="font-semibold text-slate-600 hover:text-slate-800"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-200/70 lg:hidden">
            BudgetSaaS • Recuperación de contraseña
          </div>
        </div>
      </div>
    </div>
  );
}
