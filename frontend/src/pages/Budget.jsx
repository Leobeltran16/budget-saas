import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function formatMoneyUYU(n) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
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

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Presupuesto del mes</h3>
          <p className="mt-1 text-sm text-slate-600">
            Mes: <span className="font-semibold text-slate-900">{monthKey}</span>
          </p>
        </div>

        {!isPro && (
          <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-700">
            Free: solo mes actual
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : (
        <>
          {/* Top numbers */}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Presupuesto</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {budgetNumber ? formatMoneyUYU(budgetNumber) : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Gastado</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatMoneyUYU(totalMonth)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Uso</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {budgetNumber ? `${percentUsed}%` : "—"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progreso</span>
              <span>
                {budgetNumber ? `${formatMoneyUYU(totalMonth)} / ${formatMoneyUYU(budgetNumber)}` : "Sin presupuesto"}
              </span>
            </div>

            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  status === "over"
                    ? "bg-red-600"
                    : status === "warn"
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                }`}
                style={{ width: `${budgetNumber ? percentUsed : 0}%` }}
              />
            </div>

            {status === "none" && (
              <p className="mt-2 text-xs text-slate-600">
                Configurá un presupuesto para activar alertas.
              </p>
            )}

            {status === "ok" && (
              <p className="mt-2 text-xs text-emerald-700">
                Vas bien: estás dentro del presupuesto.
              </p>
            )}

            {status === "warn" && (
              <p className="mt-2 text-xs text-amber-700">
                Atención: estás cerca del límite (85%+).
              </p>
            )}

            {status === "over" && (
              <p className="mt-2 text-xs text-red-700">
                Te pasaste del presupuesto.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={saveBudget} className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm text-slate-600">Monto del presupuesto (UYU)</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                type="number"
                min="0"
                step="1"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Ej: 15000"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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
