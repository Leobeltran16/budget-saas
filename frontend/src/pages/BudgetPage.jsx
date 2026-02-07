import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Budget from "./Budget";

function parseMonthKeySafe(monthKey) {
  const fallback = new Date();
  const fb = {
    monthKey: fallback.toISOString().slice(0, 7),
    month: fallback.getMonth(),
    year: fallback.getFullYear(),
  };

  if (!monthKey || typeof monthKey !== "string") return fb;

  const [y, m] = monthKey.split("-");
  const year = Number(y);
  const month = Number(m) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) return fb;

  return { monthKey, month, year };
}

export default function BudgetPage() {
  const { token, user } = useContext(AuthContext);
  const isPro = String(user?.plan || "").toLowerCase() === "pro";

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    if (!isPro) setMonthKey(currentMonthKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  const { month: selectedMonth, year: selectedYear } = useMemo(
    () => parseMonthKeySafe(monthKey),
    [monthKey]
  );

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadExpenses = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/expenses", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error cargando gastos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthItems = useMemo(() => {
    return items.filter((x) => {
      const d = new Date(x.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [items, selectedMonth, selectedYear]);

  const hasAnyExpenses = items.length > 0;
  const hasMonthExpenses = monthItems.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Presupuesto</h1>
            <p className="mt-1 text-sm text-slate-200/70">
              Definí tu presupuesto mensual y controlá el gasto del mes de forma clara.
            </p>
          </div>

          <button
            onClick={loadExpenses}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            title="Volver a cargar los gastos"
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {/* Month selector (Pro) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            Mes: <span className="ml-1 font-semibold text-slate-100">{monthKey}</span>
          </span>

          {isPro ? (
            <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
              <span className="text-slate-200/70">Elegir</span>
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </label>
          ) : (
            <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
              Free: solo mes actual
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {/* Empty state: no expenses at all */}
      {!error && !loading && !hasAnyExpenses && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-slate-100">Empezá en 30 segundos</h2>
          <p className="mt-1 text-sm text-slate-200/70">
            Todavía no cargaste ningún gasto. Primero cargá 1 gasto y después definí tu presupuesto mensual.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/expenses"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Cargar primer gasto
            </Link>

            <button
              onClick={loadExpenses}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      )}

      {/* Empty state: has expenses, but not in selected month */}
      {!error && !loading && hasAnyExpenses && !hasMonthExpenses && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-slate-100">No hay gastos en este mes</h2>
          <p className="mt-1 text-sm text-slate-200/70">
            Para que el presupuesto tenga sentido, cargá al menos un gasto en el mes seleccionado.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/expenses"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Ir a Gastos
            </Link>

            {isPro ? (
              <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200/80">
                Tip: probá elegir otro mes con gastos
              </span>
            ) : (
              <span className="inline-flex items-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100">
                Tip: Free = solo mes actual
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Budget card */}
      <Budget monthItems={monthItems} monthKey={monthKey} />
    </div>
  );
}
