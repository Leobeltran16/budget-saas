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

export default function Home() {
  const { isAuthenticated, token, user } = useContext(AuthContext);

  const isPro = String(user?.plan || "").toLowerCase() === "pro";
  const monthKey = new Date().toISOString().slice(0, 7);

  const userEmail = (user?.email || "").toLowerCase().trim();
  const isDemoUser = userEmail.startsWith("demo"); // ✅ solo demo ve seed

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(""); // "" | "seed"
  const [error, setError] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);

  const loadDashboard = async () => {
    if (!isAuthenticated) return;

    setError("");
    setLoading(true);
    try {
      const [expensesData, budgetData] = await Promise.all([
        apiRequest("/expenses", { token }),
        apiRequest(`/budgets/${encodeURIComponent(monthKey)}`, { token }),
      ]);

      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setBudget(budgetData || null);
    } catch (err) {
      setError(err.message || "Error cargando el dashboard");
      setExpenses([]);
      setBudget(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const monthItems = useMemo(() => {
    const [y, m] = monthKey.split("-");
    const year = Number(y);
    const month = Number(m) - 1;

    return expenses.filter((x) => {
      const d = new Date(x.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [expenses, monthKey]);

  const totalMonth = useMemo(() => {
    return monthItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }, [monthItems]);

  const topCategories = useMemo(() => {
    const map = {};
    for (const x of monthItems) {
      const cat = (x.category || "General").trim() || "General";
      map[cat] = (map[cat] || 0) + (Number(x.amount) || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [monthItems]);

  const budgetAmount = Number(budget?.amount) || 0;
  const percentUsed = useMemo(() => {
    if (!budgetAmount) return 0;
    return Math.min(100, Math.round((totalMonth / budgetAmount) * 100));
  }, [totalMonth, budgetAmount]);

  const budgetStatus = useMemo(() => {
    if (!budgetAmount) return "none";
    if (totalMonth > budgetAmount) return "over";
    if (totalMonth >= budgetAmount * 0.85) return "warn";
    return "ok";
  }, [totalMonth, budgetAmount]);

  const seedDemo = async () => {
    setError("");
    setBusy("seed");
    try {
      // ✅ doble protección: UI + guard clause
      if (!isDemoUser) {
        setError("La carga demo está disponible solo para cuentas demo.");
        return;
      }

      await apiRequest("/demo/seed", { method: "POST", token });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Error cargando datos demo");
    } finally {
      setBusy("");
    }
  };

  // ---------- UI helpers ----------
  const Stat = ({ label, value, hint }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );

  const Card = ({ title, subtitle, children, right }) => (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );

  // ---------- Dashboard ----------
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-200/70">
          Mes actual: <span className="font-semibold text-slate-100">{monthKey}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            Usuario:{" "}
            <span className="ml-1 font-semibold text-slate-100">
              {user?.name || user?.nombre || user?.email || "—"}
            </span>
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
              isPro
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-indigo-400/30 bg-indigo-500/10 text-indigo-100"
            }`}
          >
            Plan: <span className="ml-1 font-semibold">{isPro ? "Pro" : "Free"}</span>
          </span>

          {isDemoUser ? (
            <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
              Cuenta demo
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Resumen del mes"
          subtitle="Totales y estado del presupuesto"
          right={
            <div className="flex gap-2">
              <Link
                to="/expenses"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ver gastos
              </Link>
              <Link
                to="/budget"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Presupuesto
              </Link>
            </div>
          }
        >
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Gastado" value={formatMoneyUYU(totalMonth)} />
              <Stat label="Presupuesto" value={budgetAmount ? formatMoneyUYU(budgetAmount) : "—"} />
              <Stat
                label="Restante"
                value={budgetAmount ? formatMoneyUYU(Math.max(0, budgetAmount - totalMonth)) : "—"}
                hint={
                  budgetStatus === "over"
                    ? "Te pasaste del presupuesto"
                    : budgetStatus === "warn"
                    ? "Cerca del límite"
                    : budgetStatus === "ok"
                    ? "Vas bien"
                    : "Definí presupuesto para alertas"
                }
              />
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Uso</span>
              <span className="font-semibold text-slate-900">{percentUsed}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  budgetStatus === "over"
                    ? "bg-red-600"
                    : budgetStatus === "warn"
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </Card>

        <Card title="Top categorías" subtitle="Dónde se va la plata este mes">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : topCategories.length ? (
            <div className="space-y-2">
              {topCategories.map(([cat, val]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-slate-900">{cat}</span>
                  <span className="text-slate-700">{formatMoneyUYU(val)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Todavía no hay gastos en este mes.
            </div>
          )}

          {isDemoUser ? (
            <button
              onClick={seedDemo}
              disabled={busy === "seed"}
              className="mt-4 w-full rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy === "seed" ? "Cargando..." : "Cargar demo (solo cuentas demo)"}
            </button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
