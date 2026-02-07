import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest(`/auth/reset-password/${token}`, {
        method: "POST",
        body: { newPassword },
      });

      setSuccess(data?.message || "Contraseña restablecida ✅");

      // Llevar a login después de un reset exitoso
      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña");
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
            Token temporal
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Restablecer contraseña
          </h1>

          <p className="mt-3 text-sm text-slate-200/70 max-w-xl">
            Elegí una nueva contraseña segura. Si el token expiró, pedí uno nuevo.
          </p>
        </div>

        {/* Right card */}
        <div className="lg:justify-self-end w-full">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Nueva contraseña
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ingresá y confirmá tu nueva contraseña.
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {success} Redirigiendo a login…
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Nueva contraseña</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Confirmar contraseña</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>

              <button
                disabled={loading}
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Pedir otro token
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
            BudgetSaaS • Reset de contraseña
          </div>
        </div>
      </div>
    </div>
  );
}
