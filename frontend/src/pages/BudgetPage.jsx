import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Budget from "./Budget";

function BudgetPage() {
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const loadExpenses = async () => {
    setError("");
    try {
      const data = await apiRequest("/expenses", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error cargando gastos");
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthItems = useMemo(() => {
    return items.filter((x) => {
      const d = new Date(x.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [items, currentMonth, currentYear]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Presupuesto</h1>
        <p className="mt-1 text-sm text-slate-200/70">
          Configurá tu presupuesto mensual y controlá el gasto.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Budget monthItems={monthItems} />
        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Tips</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Definí un presupuesto realista para el mes.</li>
            <li>Si llegás al 70% te avisará que estás cerca del límite.</li>
            <li>Si pasás el 100% te marca excedido.</li>
          </ul>

          <button
            onClick={loadExpenses}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
          >
            Refrescar gastos
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetPage;
