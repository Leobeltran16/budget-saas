// src/pages/BudgetPage.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Budget from "./Budget";

function parseMonthKeySafe(monthKey) {
  const fallback = new Date();
  const fbMonthKey = fallback.toISOString().slice(0, 7);

  if (!monthKey || typeof monthKey !== "string") {
    return { monthKey: fbMonthKey, month: fallback.getMonth(), year: fallback.getFullYear() };
  }

  const [y, m] = monthKey.split("-");
  const year = Number(y);
  const month = Number(m) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return { monthKey: fbMonthKey, month: fallback.getMonth(), year: fallback.getFullYear() };
  }

  return { monthKey, month, year };
}

function formatMoneyUYU(n) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function monthLabelUY(monthKey) {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  return new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric" }).format(d);
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
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 text-slate-900 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
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

  const { month: selectedMonth, year: selectedYear } = useMemo(() => {
    const parsed = parseMonthKeySafe(monthKey);
    return { month: parsed.month, year: parsed.year };
  }, [monthKey]);

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
      setItems([]);
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

  const totalMonth = useMemo(() => {
    return monthItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }, [monthItems]);

  const monthVolumeTone =
    totalMonth > 0
      ? "success"
      : "neutral";

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* Header (mismo estilo que Gastos/Home) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Presupuesto</h1>
            <p className="mt-1 text-white/80">
              Definí tu presupuesto mensual y controlá el gasto del mes con claridad.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Mes: <span className="ml-1">{monthLabelUY(monthKey)}</span>{" "}
                <span className="ml-1 text-white/70">({monthKey})</span>
              </span>

              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Plan: <span className="ml-1">{isPro ? "PRO" : "FREE"}</span>
              </span>

              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Gastos del mes: <span className="ml-1">{monthItems.length}</span>
              </span>

              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Gastado: <span className="ml-1">{formatMoneyUYU(totalMonth)}</span>
              </span>
            </div>

            {/* Selector mes (PRO) */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isPro ? (
                <label className="rounded-2xl bg-white/10 px-4 py-3">
                  <span className="block text-xs text-white/70">Elegir mes</span>
                  <input
                    type="month"
                    value={monthKey}
                    onChange={(e) => setMonthKey(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50"
                  />
                </label>
              ) : (
                <span className="rounded-2xl bg-white/10 px-4 py-3 text-xs text-white/80">
                  Free: solo mes actual
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadExpenses}
              disabled={loading}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              title="Volver a cargar los gastos"
            >
              {loading ? "Cargando..." : "Recargar"}
            </button>

            <Link
              to="/expenses"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Ir a Gastos
            </Link>

            {!isPro ? (
              <Link
                to="/plans"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Pasar a PRO
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {/* Contenedor estilo Gastos */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
        {/* Estados vacíos */}
        {!error && !loading && !hasAnyExpenses ? (
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-sm">
            <h2 className="text-base font-extrabold">Empezá en 30 segundos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Todavía no cargaste ningún gasto. Cargá 1 gasto y después definí tu presupuesto mensual.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/expenses"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Cargar primer gasto
              </Link>

              <button
                onClick={loadExpenses}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Volver a intentar
              </button>
            </div>
          </div>
        ) : null}

        {!error && !loading && hasAnyExpenses && !hasMonthExpenses ? (
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-sm">
            <h2 className="text-base font-extrabold">No hay gastos en este mes</h2>
            <p className="mt-1 text-sm text-slate-600">
              Para que el presupuesto tenga sentido, cargá al menos un gasto en el mes seleccionado.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/expenses"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ir a Gastos
              </Link>

              {isPro ? (
                <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  Tip: probá elegir otro mes con gastos
                </span>
              ) : (
                <span className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
                  Tip: Free = solo mes actual
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Bloque de ayuda */}
        {!error && !loading && hasMonthExpenses ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Cómo usar esto" subtitle="En 2 pasos" right={<Badge tone="info">Guía rápida</Badge>}>
              <ol className="space-y-2 text-sm text-slate-700">
                <li>
                  <span className="font-semibold text-slate-900">1)</span> Definí tu{" "}
                  <span className="font-semibold text-slate-900">presupuesto</span>.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2)</span> Cargá gastos y mirá tu{" "}
                  <span className="font-semibold text-slate-900">progreso</span>.
                </li>
              </ol>

              {!isPro ? (
                <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
                  <div className="font-extrabold">TIP</div>
                  <div className="mt-1 opacity-90">
                    Con PRO podés ver meses anteriores y llevar historial.
                  </div>
                  <Link to="/plans" className="mt-2 inline-block font-semibold underline">
                    Ver planes
                  </Link>
                </div>
              ) : null}
            </Card>

            <Card
              title="Resumen del mes"
              subtitle="Un vistazo rápido"
              right={<Badge tone={totalMonth > 0 ? "success" : "neutral"}>{totalMonth > 0 ? "OK" : "Sin gastos"}</Badge>}
            >
              <div className="space-y-2 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  Gastos del mes:{" "}
                  <span className="font-semibold text-slate-900">{monthItems.length}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  Total gastado:{" "}
                  <span className="font-semibold text-slate-900">{formatMoneyUYU(totalMonth)}</span>
                </div>
              </div>
            </Card>

            <Card title="Atajos" subtitle="Ir rápido" right={<Badge tone="neutral">Acciones</Badge>}>
              <div className="grid gap-2">
                <Link
                  to="/expenses"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Cargar / ver gastos
                </Link>
                <Link
                  to="/app"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Volver al Dashboard
                </Link>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Main Budget card (tu componente) */}
        <div className="mt-4">
          <Budget monthItems={monthItems} monthKey={monthKey} />
        </div>
      </div>
    </div>
  );
}
