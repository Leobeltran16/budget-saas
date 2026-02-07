// src/pages/Pricing.jsx
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, token, refreshMe } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const currentPlan = String(user?.plan || "free").toLowerCase();

  const setPlan = async (plan) => {
    setMsg("");
    setError("");

    if (!isAuthenticated) {
      setError("Tenés que iniciar sesión para cambiar el plan.");
      navigate("/login");
      return;
    }

    const t = token || localStorage.getItem("token") || "";
    if (!t) {
      setError("No hay token. Volvé a iniciar sesión.");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/plan", {
        method: "PATCH",
        token: t, // ✅ IMPORTANTE
        body: { plan },
      });

      // ✅ FIX: AuthContext.login(newToken, newUser)
      const nextPlan = String(data?.plan || plan).toLowerCase();
      login(t, { ...user, plan: nextPlan });

      // ✅ opcional pero recomendado: sincroniza user real desde backend (/auth/me)
      if (typeof refreshMe === "function") {
        await refreshMe(t);
      }

      setMsg(data?.message || "Plan actualizado ✅");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el plan");
    } finally {
      setLoading(false);
    }
  };

  const Feature = ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-200/80">
      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs text-slate-100">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Planes (fase 1: estructura)
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Elegí el plan que te sirva
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-200/70">
            Arrancá gratis y pasate a Pro cuando quieras. En esta fase, Pro es modo demo
            para validar el flujo (sin pagos).
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/80">
          {isAuthenticated ? (
            <div>
              Tu plan actual:{" "}
              <span className="font-semibold text-white">{currentPlan.toUpperCase()}</span>
            </div>
          ) : (
            <div>
              No estás logueado.{" "}
              <Link
                className="font-semibold text-indigo-300 hover:text-indigo-200"
                to="/login"
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {(msg || error) && (
        <div className="mt-6 grid gap-3">
          {msg && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {msg}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* FREE */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Free</h2>
              <p className="mt-1 text-sm text-slate-200/70">
                Ideal para empezar a controlar tu mes.
              </p>
            </div>

            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100">
              $0
            </span>
          </div>

          <ul className="mt-5 grid gap-2">
            <Feature>Gastos (alta, lista, filtros)</Feature>
            <Feature>Presupuesto del mes actual</Feature>
            <Feature>Resumen mensual</Feature>
            <Feature>Alertas ok / warn / over</Feature>
          </ul>

          <div className="mt-6">
            {currentPlan === "free" ? (
              <button
                type="button"
                disabled
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 opacity-70"
              >
                Plan actual
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPlan("free")}
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? "Actualizando..." : "Cambiar a Free"}
              </button>
            )}
          </div>
        </div>

        {/* PRO */}
        <div className="rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 via-white/5 to-white/5 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                Recomendado
              </div>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Pro
              </h2>
              <p className="mt-1 text-sm text-slate-200/70">
                Para quienes quieren más control y features avanzadas.
              </p>
            </div>

            <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              $ (fase 2)
            </span>
          </div>

          <ul className="mt-5 grid gap-2">
            <Feature>Selección de meses</Feature>
            <Feature>Gráficos y tendencias</Feature>
            <Feature>Exportar datos</Feature>
            <Feature>Categorías personalizadas</Feature>
          </ul>

          <div className="mt-6 grid gap-2">
            {currentPlan === "pro" ? (
              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-slate-950 opacity-80"
              >
                Plan actual
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPlan("pro")}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading ? "Activando..." : "Activar Pro (demo)"}
              </button>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/70">
              Pagos reales y suscripción automática se integran en fase 2.
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-6 text-xs text-slate-200/60">
        Nota: el cambio de plan se guarda en tu usuario. Si cerrás sesión y volvés a entrar,
        tu plan debería mantenerse.
      </div>
    </div>
  );
}
