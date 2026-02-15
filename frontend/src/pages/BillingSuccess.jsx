import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function formatDateUY(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-UY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      : tone === "info"
      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ok = params.get("ok");

  const { token, user, refreshMe, isAuthenticated, authLoading } =
    useContext(AuthContext);

  // ✅ No bloqueamos la UI: mostramos lo que ya tenemos (localStorage/context)
  // y hacemos refreshMe() en background.
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isAuthenticated || !token) return;

      try {
        if (alive) setRefreshing(true);
        await refreshMe(token);
      } finally {
        if (alive) setRefreshing(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [isAuthenticated, token, refreshMe]);

  const plan = useMemo(() => String(user?.plan || "free").toLowerCase(), [user]);
  const isPro = plan === "pro";

  const periodEndRaw = user?.billingCurrentPeriodEnd;
  const periodEnd = useMemo(() => formatDateUY(periodEndRaw), [periodEndRaw]);

  // Si el usuario no está logueado, lo llevamos a login (cuando termina authLoading)
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const t = setTimeout(() => navigate("/login"), 600);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isOk = ok === "1";

  // ✅ si el pago fue OK, redirigimos automáticamente al Dashboard luego de un momento
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (isOk) {
      const t = setTimeout(() => navigate("/app", { replace: true }), 2200);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, isOk, navigate]);

  const title = isOk ? "¡Pago aprobado!" : "Pago recibido (a revisar)";

  const subtitle = authLoading
    ? "Cargando tu sesión…"
    : refreshing
    ? "Estamos actualizando tu cuenta… (esto puede demorar unos segundos)"
    : isOk
    ? "Tu suscripción ya está activa. Podés volver al dashboard y seguir usando la app."
    : "Detectamos un detalle al confirmar el pago. No te preocupes: podés reintentar desde Planes.";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${
                  isOk
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200"
                }`}
                aria-hidden="true"
              >
                {isOk ? "✅" : "⚠️"}
              </span>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-slate-900">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={isOk ? "success" : "warning"}>
                {isOk ? "Suscripción activada" : "Confirmación pendiente"}
              </Badge>

              <Badge>
                Plan:{" "}
                <span className="ml-1 font-extrabold">{plan.toUpperCase()}</span>
              </Badge>

              {isPro && <Badge tone="success">PRO</Badge>}

              {refreshing && <Badge tone="info">Actualizando…</Badge>}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link
              to="/plans"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ver Planes
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs font-semibold text-slate-500">
                Plan actual
              </div>

              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {plan.toUpperCase()}
              </div>

              {!isPro && !refreshing && (
                <div className="mt-2 text-xs text-slate-500">
                  Si pagaste y todavía aparece <b>FREE</b>, esperá unos segundos,
                  o recargá la página. Si sigue igual, volvé a <b>Planes</b>.
                </div>
              )}

              {refreshing && (
                <div className="mt-2 text-xs text-slate-500">
                  Confirmando el plan en segundo plano…
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs font-semibold text-slate-500">Vence el</div>

              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {periodEnd || (authLoading || refreshing ? "Actualizando…" : "—")}
              </div>

              {refreshing && (
                <div className="mt-2 text-xs text-slate-500">
                  Procesando la fecha de vencimiento…
                </div>
              )}

              {!refreshing && !authLoading && !periodEnd && (
                <div className="mt-2 text-xs text-slate-500">
                  Todavía no tenemos la fecha registrada. Si acabás de pagar,
                  puede demorar unos segundos.
                </div>
              )}
            </div>
          </div>

          {/* Helper */}
          {!authLoading && !refreshing && !isOk && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-extrabold">¿Qué hago ahora?</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900/90">
                <li>Volvé a <b>Planes</b> y reintentá el pago.</li>
                <li>
                  Si el problema sigue, cerrá sesión, entrá de nuevo y probá
                  otra vez.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/app"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ir al Dashboard
          </Link>

          <Link
            to="/expenses"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Ver mis Gastos
          </Link>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-xs text-slate-500">
          Tip: Si acabás de pagar, puede tardar unos segundos en reflejarse. Si
          no cambia, entrá a <b>Planes</b> y reintentá.
        </div>
      </div>
    </div>
  );
}
