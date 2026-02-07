import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user, logout } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(""); // "" | "refresh" | "logout"
  const [error, setError] = useState("");
  const [serverUser, setServerUser] = useState(null);

  const isPro = useMemo(
    () => String(user?.plan || "").toLowerCase() === "pro",
    [user]
  );

  const displayName = useMemo(() => {
    const n = (user?.name || "").trim();
    if (n) return n;
    const e = (user?.email || "").trim();
    if (!e) return "Usuario";
    return e.split("@")[0] || e;
  }, [user]);

  const email = useMemo(() => (user?.email || "").trim(), [user]);
  const role = useMemo(() => (user?.role || "").trim(), [user]);

  const refreshFromServer = async () => {
    setError("");
    setBusy("refresh");
    setLoading(true);
    try {
      const me = await apiRequest("/auth/me", { token });
      setServerUser(me || null);
    } catch (err) {
      setError(err.message || "Error cargando perfil");
    } finally {
      setLoading(false);
      setBusy("");
    }
  };

  useEffect(() => {
    if (isAuthenticated) refreshFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogout = () => {
    setBusy("logout");
    logout();
    navigate("/login");
  };

  /* ======================
     Vista pública
     ====================== */
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Perfil
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Para ver tu perfil tenés que iniciar sesión.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const view = serverUser || user || {};

  /* ======================
     Vista privada
     ====================== */
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-slate-200/70">
          Información de tu cuenta y plan.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cuenta */}
        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cuenta</h2>
              <p className="mt-1 text-sm text-slate-600">
                Datos básicos de tu usuario.
              </p>
            </div>

            <span
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                isPro
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700"
                  : "border-indigo-400/30 bg-indigo-500/10 text-indigo-700"
              )}
            >
              Plan:{" "}
              <span className="ml-1 font-semibold">
                {isPro ? "Pro" : "Free"}
              </span>
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="mt-1 font-semibold text-slate-900">
                {(view?.name || "").trim() || displayName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">
                {(view?.email || "").trim() || email || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Rol</p>
              <p className="mt-1 font-semibold text-slate-900">
                {(view?.role || "").trim() || role || "user"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Estado</p>
              <p className="mt-1 font-semibold text-slate-900">
                {loading ? "Actualizando..." : "Activo"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={refreshFromServer}
              disabled={busy || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy === "refresh"
                ? "Actualizando..."
                : "Actualizar desde servidor"}
            </button>

            <button
              onClick={handleLogout}
              disabled={busy === "logout"}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busy === "logout" ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Accesos rápidos
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to="/expenses"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ir a Gastos
            </Link>

            <Link
              to="/budget"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ir a Presupuesto
            </Link>

            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ir a Dashboard
            </Link>

            <Link
              to="/expenses"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Cargar un gasto
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <b className="text-slate-900">Plan actual:</b>{" "}
            {isPro ? "Pro" : "Free"} —{" "}
            {isPro
              ? "podés elegir mes en Gastos/Presupuesto."
              : "solo mes actual."}
          </div>
        </div>
      </div>
    </div>
  );
}
