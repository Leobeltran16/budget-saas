import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function Budget({ monthItems = [], onStatusChange }) {
  const { token } = useContext(AuthContext);

  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const formatMoney = (n) =>
    new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      maximumFractionDigits: 0,
    }).format(n);

  const totalMonth = useMemo(() => {
    return monthItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }, [monthItems]);

  const remaining = useMemo(() => {
    if (saved === null) return null;
    return saved - totalMonth;
  }, [saved, totalMonth]);

  const percentRaw = useMemo(() => {
    if (!saved || saved <= 0) return 0;
    return (totalMonth / saved) * 100;
  }, [totalMonth, saved]);

  const percent = Math.round(percentRaw);
  const barPercent = Math.min(100, Math.max(0, percent));

  const status = useMemo(() => {
    if (saved === null) return { label: "Sin presupuesto", color: "bg-slate-400" };
    if (percentRaw >= 100) return { label: "Te pasaste del presupuesto", color: "bg-red-500" };
    if (percentRaw >= 70) return { label: "Ojo, estás cerca del límite", color: "bg-amber-400" };
    return { label: "Vas bien", color: "bg-emerald-500" };
  }, [saved, percentRaw]);

  useEffect(() => {
    if (!onStatusChange) return;

    if (saved === null) onStatusChange("none");
    else if (percentRaw >= 100) onStatusChange("over");
    else if (percentRaw >= 70) onStatusChange("warn");
    else onStatusChange("ok");
  }, [onStatusChange, saved, percentRaw]);

  const loadBudget = async () => {
    setError("");
    try {
      const data = await apiRequest(`/budgets/${monthKey}`, { token });
      if (data) {
        setSaved(data.amount);
        setAmount(String(data.amount));
      } else {
        setSaved(null);
        setAmount("");
      }
    } catch (err) {
      setError(err.message || "Error cargando presupuesto");
    }
  };

  useEffect(() => {
    loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBudget = async () => {
    setError("");
    setSaving(true);
    try {
      const num = Number(amount);

      if (!Number.isFinite(num) || num < 0) {
        setError("Ingresá un número válido (>= 0)");
        return;
      }

      const data = await apiRequest("/budgets", {
        method: "POST",
        token,
        body: { month: monthKey, amount: num },
      });
      setSaved(data.amount);
    } catch (err) {
      setError(err.message || "Error guardando presupuesto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Estado del presupuesto</h3>
        <span className="text-sm text-slate-500">Mes: {monthKey}</span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-slate-500">Gastado</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(totalMonth)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-slate-500">Presupuesto</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {saved === null ? "—" : formatMoney(saved)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-slate-500">Restante</p>
          <p className={`mt-1 text-base font-semibold ${remaining < 0 ? "text-red-600" : "text-slate-900"}`}>
            {saved === null ? "—" : formatMoney(Math.abs(remaining))}
          </p>
          {remaining < 0 && <p className="mt-1 text-xs text-red-600">(excedido)</p>}
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-700">
        <p>
          Uso: <b className="text-slate-900">{saved === null ? "—" : `${percent}%`}</b>{" "}
          {saved !== null && (
            <span className="font-semibold text-slate-700">— {status.label}</span>
          )}
        </p>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full ${status.color} transition-all`}
            style={{ width: `${saved === null ? 0 : barPercent}%` }}
          />
        </div>
      </div>

      {saved === null && (
        <p className="mt-4 text-sm text-slate-600">
          Todavía no configuraste el presupuesto de este mes.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 sm:w-60"
          type="number"
          placeholder="Presupuesto del mes"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
        />

        <div className="flex w-full gap-2 sm:w-auto">
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
            onClick={saveBudget}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
            onClick={loadBudget}
            type="button"
          >
            Recargar
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Budget;
