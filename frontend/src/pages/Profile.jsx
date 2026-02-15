// src/pages/Profile.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

const FALLBACK_CURRENCIES = ["USD", "UYU", "ARS", "BRL", "CLP", "COP", "MXN", "PEN", "EUR"];

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "info"
      ? "border-indigo-200 bg-indigo-50 text-indigo-900"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function getInitials(name, email) {
  const n = String(name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase() || "U";
  }
  const e = String(email || "").trim();
  if (!e) return "U";
  const base = e.split("@")[0] || "U";
  return (base.slice(0, 2) || "U").toUpperCase();
}

function parseDateSmart(value) {
  if (!value) return null;

  // number: could be seconds or ms
  const n = Number(value);
  if (Number.isFinite(n)) {
    const ms = n < 1e12 ? n * 1000 : n; // if seconds -> ms
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // string ISO or similar
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateUY(dateObj) {
  if (!dateObj) return "";
  return new Intl.DateTimeFormat("es-UY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

export default function Profile() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    token,
    user,
    logout,
    refreshMe,
    updateCurrency,
    supportedCurrencies,
  } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(""); // "" | "refresh" | "logout" | "currency"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serverUser, setServerUser] = useState(null);

  const plan = useMemo(() => String(user?.plan || "free").toLowerCase(), [user]);
  const isPro = plan === "pro";

  const displayName = useMemo(() => {
    const n = (user?.name || "").trim();
    if (n) return n;
    const e = (user?.email || "").trim();
    if (!e) return "Usuario";
    return e.split("@")[0] || e;
  }, [user]);

  const email = useMemo(() => (user?.email || "").trim(), [user]);
  const role = useMemo(() => (user?.role || "").trim(), [user]);
  const isAdmin = useMemo(() => String(user?.role || "").toLowerCase().trim() === "admin", [user]);

  const currency = useMemo(() => String(user?.currency || "USD").toUpperCase().trim(), [user]);

  const currencyOptions = useMemo(() => {
    const list =
      Array.isArray(supportedCurrencies) && supportedCurrencies.length
        ? supportedCurrencies
        : FALLBACK_CURRENCIES;
    return [...new Set(list.map((c) => String(c).toUpperCase().trim()))];
  }, [supportedCurrencies]);

  const avatarUrl = useMemo(() => {
    return user?.avatarUrl || user?.photoUrl || user?.imageUrl || user?.avatar || "";
  }, [user]);

  const initials = useMemo(() => getInitials(user?.name, user?.email), [user]);

  // ✅ Vencimiento PRO (mismo campo que BillingSuccess)
  const billingEndRaw = useMemo(() => {
    return user?.billingCurrentPeriodEnd || serverUser?.billingCurrentPeriodEnd || null;
  }, [user, serverUser]);

  const billingEndDate = useMemo(() => parseDateSmart(billingEndRaw), [billingEndRaw]);

  const proMeta = useMemo(() => {
    if (!isPro) return null;

    if (!billingEndDate) {
      return { expiresText: "Vence: —", leftText: "Sin fecha" };
    }

    const now = new Date();
    const diffMs = billingEndDate.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const expiresText = `Vence: ${formatDateUY(billingEndDate)}`;
    const leftText = days === 1 ? "Falta 1 día" : `Faltan ${days} días`;

    return { expiresText, leftText };
  }, [isPro, billingEndDate]);

  const refreshFromServer = async () => {
    setError("");
    setSuccess("");
    setBusy("refresh");
    setLoading(true);

    try {
      if (!token) throw new Error("Token no encontrado. Volvé a iniciar sesión.");

      const me = await apiRequest("/auth/me", { token });
      setServerUser(me || null);

      // mantiene AuthContext alineado
      await refreshMe(token);
    } catch (err) {
      setError(err?.message || "Error cargando perfil");
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

  const handleCurrencyChange = async (e) => {
    const next = e.target.value;
    setError("");
    setSuccess("");
    setBusy("currency");

    try {
      await updateCurrency(next);
      setSuccess("Moneda guardada ✅");
      window.clearTimeout(handleCurrencyChange._t);
      handleCurrencyChange._t = window.setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo guardar la moneda. Asegurate de tener PATCH /auth/me en el backend."
      );
    } finally {
      setBusy("");
    }
  };

  // ===== Vista pública =====
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Perfil</h1>
          <p className="mt-1 text-sm text-white/80">Para ver tu perfil tenés que iniciar sesión.</p>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
          <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-sm">
            <p className="text-sm text-slate-700">
              Iniciá sesión para ver tu cuenta, plan y preferencias.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Vista privada =====
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* Header (mismo estilo que Gastos) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/10 shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white">
                {initials}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Perfil</h1>

              {/* ✅ solo info útil (sin duplicar email/descripcion) */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  Plan: <span className="ml-1 font-extrabold">{isPro ? "PRO" : "FREE"}</span>
                </span>

                {isPro ? (
                  <>
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {proMeta?.expiresText || "Vence: —"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {proMeta?.leftText || "Sin fecha"}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* ✅ Botón admin: Ver Notas */}
            {isAdmin ? (
              <Link
                to="/admin/notes"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Ver Notas
              </Link>
            ) : null}

            <button
              onClick={refreshFromServer}
              disabled={busy === "refresh" || loading}
              className={cx(
                "rounded-2xl border px-4 py-3 text-sm font-semibold",
                busy === "refresh" || loading
                  ? "cursor-not-allowed border-white/20 bg-white/10 text-white/70"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/15"
              )}
            >
              {busy === "refresh" ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              onClick={handleLogout}
              disabled={busy === "logout"}
              className={cx(
                "rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100",
                busy === "logout" && "cursor-not-allowed opacity-70"
              )}
            >
              {busy === "logout" ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* Cards wrapper */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cuenta */}
          <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-extrabold text-slate-900">Tu cuenta</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{displayName}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{email || "-"}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rol
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{role || "user"}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {isPro ? "PRO" : "FREE"}
                </div>

                {/* ✅ Extra: vencimiento dentro de la tarjeta (no molesta y es útil) */}
                {isPro ? (
                  <div className="mt-2 text-xs text-slate-600">
                    {proMeta?.expiresText || "Vence: —"} • {proMeta?.leftText || "Sin fecha"}
                  </div>
                ) : null}
              </div>
            </div>

            {serverUser ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Datos del servidor
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold">Moneda:</span>{" "}
                    {String(serverUser?.currency || currency).toUpperCase()}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="info">Preferencias por usuario</Badge>
              <Badge tone={isPro ? "success" : "neutral"}>{isPro ? "PRO activo" : "Free"}</Badge>
            </div>
          </div>

          {/* Preferencias */}
          <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">Preferencias</h2>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Moneda</label>

              <select
                value={currency}
                onChange={handleCurrencyChange}
                disabled={busy === "currency"}
                className={cx(
                  "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                  busy === "currency"
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-indigo-300"
                )}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500">
                Moneda actual: <span className="font-semibold">{currency}</span>
              </p>

              <div className="pt-2">
                <Link
                  to="/plans"
                  className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-500"
                >
                  Ver planes
                </Link>
              </div>

              <div className="pt-3">
                <Link
                  to="/app"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Volver al Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
