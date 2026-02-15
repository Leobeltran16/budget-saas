import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function formatMoneyUYU(n) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

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
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function AlertBox({ tone = "info", title, children }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-indigo-200 bg-indigo-50 text-indigo-900";

  return (
    <div className={`mt-4 rounded-2xl border p-4 text-sm ${cls}`}>
      <div className="font-extrabold">{title}</div>
      <div className="mt-1 opacity-90">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-4">
      <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-24 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-3 h-16 w-full animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function Budget({ monthItems = [], monthKey, onStatusChange }) {
  const { token, user } = useContext(AuthContext);
  const isPro = String(user?.plan || "").toLowerCase() === "pro";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [budgetAmount, setBudgetAmount] = useState("");
  const [serverBudget, setServerBudget] = useState(null);
  const [error, setError] = useState("");

  const totalMonth = useMemo(() => {
    return (monthItems || []).reduce((acc, x) => acc + (Number(x?.amount) || 0), 0);
  }, [monthItems]);

  const budgetNumber = useMemo(() => {
    const n = Number(budgetAmount);
    return Number.isFinite(n) ? n : 0;
  }, [budgetAmount]);

  const percentUsed = useMemo(() => {
    if (!budgetNumber) return 0;
    return Math.min(100, Math.round((totalMonth / budgetNumber) * 100));
  }, [totalMonth, budgetNumber]);

  const status = useMemo(() => {
    if (!budgetNumber) return "none";
    if (totalMonth > budgetNumber) return "over";
    if (totalMonth >= budgetNumber * 0.85) return "warn";
    return "ok";
  }, [totalMonth, budgetNumber]);

  const remaining = useMemo(() => {
    if (!budgetNumber) return 0;
    return budgetNumber - totalMonth;
  }, [budgetNumber, totalMonth]);

  useEffect(() => {
    if (typeof onStatusChange === "function") onStatusChange(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadBudget = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest(`/budgets/${encodeURIComponent(monthKey)}`, { token });
      setServerBudget(data || null);

      if (data?.amount !== undefined && data?.amount !== null) {
        setBudgetAmount(String(data.amount));
      } else {
        setBudgetAmount("");
      }
    } catch (err) {
      setError(err.message || "Error cargando presupuesto");
      setServerBudget(null);
      setBudgetAmount("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!monthKey) return;
    loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const saveBudget = async (e) => {
    e.preventDefault();
    setError("");

    const n = Number(budgetAmount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Ingresá un presupuesto válido (mayor a 0).");
      return;
    }

    setSaving(true);
    try {
      const data = await apiRequest("/budgets", {
        method: "POST",
        token,
        body: { amount: n, month: monthKey },
      });

      setServerBudget(data || null);
    } catch (err) {
      setError(err.message || "Error guardando presupuesto");
    } finally {
      setSaving(false);
    }
  };

  const barTone =
    status === "over" ? "bg-red-600" : status === "warn" ? "bg-amber-500" : "bg-emerald-600";

  const alertTone = status === "over" ? "danger" : status === "warn" ? "warning" : status === "ok" ? "success" : "info";

  const alertTitle =
    status === "over"
      ? "Te pasaste del presupuesto"
      : status === "warn"
      ? "Cerca del límite"
      : status === "ok"
      ? "Vas bien"
      : "Definí tu presupuesto";

  const alertText =
    status === "over"
      ? `Te pasaste por ${formatMoneyUYU(Math.abs(remaining))}.`
      : status === "warn"
      ? `Te quedan ${formatMoneyUYU(Math.max(0, remaining))}. Estás arriba del 85%.`
      : status === "ok"
      ? `Te quedan ${formatMoneyUYU(Math.max(0, remaining))}.`
      : "Configurá un monto para activar la barra y las alertas.";

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">Presupuesto del mes</h3>
          <p className="mt-1 text-sm text-slate-600">
            Mes: <span className="font-semibold text-slate-900">{monthKey}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isPro ? (
              <Badge tone="info">Free: solo mes actual</Badge>
            ) : (
              <Badge tone="success">PRO</Badge>
            )}

            {serverBudget?._id ? (
              <Badge tone="success">Guardado en servidor</Badge>
            ) : (
              <Badge>No guardado</Badge>
            )}

            {budgetNumber ? (
              <Badge tone={status === "over" ? "danger" : status === "warn" ? "warning" : "success"}>
                Uso: {percentUsed}%
              </Badge>
            ) : (
              <Badge tone="info">Sin presupuesto</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/expenses"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Ver gastos
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-extrabold">Ocurrió un error</div>
          <div className="mt-1 opacity-90">{error}</div>
        </div>
      ) : null}

      {loading ? (
        <Skeleton />
      ) : (
        <>
          {/* Top numbers */}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Presupuesto</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {budgetNumber ? formatMoneyUYU(budgetNumber) : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Gastado</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {formatMoneyUYU(totalMonth)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">{remaining >= 0 ? "Restante" : "Exceso"}</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {budgetNumber ? formatMoneyUYU(Math.abs(remaining)) : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Uso</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {budgetNumber ? `${percentUsed}%` : "—"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progreso</span>
              <span className="font-semibold text-slate-800">
                {budgetNumber
                  ? `${formatMoneyUYU(totalMonth)} / ${formatMoneyUYU(budgetNumber)}`
                  : "Sin presupuesto"}
              </span>
            </div>

            <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {/* Marks (85% and 100%) */}
              <div className="absolute inset-y-0 left-[85%] w-[2px] bg-slate-300/80" title="85%" />
              <div className="absolute inset-y-0 left-[99.5%] w-[2px] bg-slate-300/80" title="100%" />

              <div
                className={`h-full rounded-full ${barTone}`}
                style={{ width: `${budgetNumber ? percentUsed : 0}%` }}
              />
            </div>

            <AlertBox tone={alertTone} title={alertTitle}>
              {alertText}
            </AlertBox>
          </div>

          {/* Form */}
          <form onSubmit={saveBudget} className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Monto del presupuesto (UYU)
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-300"
                type="number"
                min="0"
                step="1"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Ej: 15000"
              />
              <p className="mt-1 text-xs text-slate-500">
                Sugerencia: poné un número redondo para que la barra sea más fácil de leer.
              </p>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-0 h-12 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:mt-6"
            >
              {saving ? "Guardando..." : serverBudget ? "Actualizar" : "Guardar"}
            </button>
          </form>

          {/* Small meta */}
          <div className="mt-3 text-xs text-slate-500">
            {serverBudget?._id ? (
              <span>Guardado en servidor ✅</span>
            ) : (
              <span>No hay presupuesto guardado todavía.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
