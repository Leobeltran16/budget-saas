import { Link } from "react-router-dom";

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "warning"
      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function BillingCancel() {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                aria-hidden="true"
              >
                ⚠️
              </span>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-slate-900">
                  Pago cancelado
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  No se realizó ningún cargo. Podés volver a intentar cuando
                  quieras.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="warning">Operación cancelada</Badge>
              <Badge>Sin cobro</Badge>
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

        {/* Info card */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-sm font-extrabold text-slate-900">
              ¿Querés reintentar?
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Volvé a Planes y elegí tu suscripción otra vez. Si se te cortó
              internet o cerraste la ventana, es normal que quede cancelado.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-semibold">Tip:</span> si querés exportar o
              compartir por WhatsApp, necesitás <span className="font-bold">PRO</span>.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/plans"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            Reintentar pago
          </Link>

          <Link
            to="/app"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Ir al Dashboard
          </Link>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-xs text-slate-500">
          Si el pago fue cancelado por error, reintentá desde Planes. Si tenés
          problemas recurrentes, probá de nuevo en otra pestaña o más tarde.
        </div>
      </div>
    </div>
  );
}
