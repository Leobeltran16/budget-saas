// src/pages/Home.jsx
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

function monthLabelUY(monthKey) {
  // "2026-02" -> "febrero 2026"
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  return new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric" }).format(d);
}

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : tone === "warning"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : tone === "danger"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : "border-white/10 bg-white/10 text-white/90";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>
      {children}
    </span>
  );
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

  const remaining = useMemo(() => {
    if (!budgetAmount) return 0;
    return budgetAmount - totalMonth;
  }, [budgetAmount, totalMonth]);

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

  const ProgressTone =
    budgetStatus === "over"
      ? "bg-red-600"
      : budgetStatus === "warn"
      ? "bg-amber-500"
      : "bg-emerald-600";

  const statusLabel =
    budgetStatus === "over"
      ? "Te pasaste del presupuesto"
      : budgetStatus === "warn"
      ? "Cerca del límite"
      : budgetStatus === "ok"
      ? "Vas bien"
      : "Definí un presupuesto para ver alertas";

  const statusBadgeTone =
    budgetStatus === "over"
      ? "danger"
      : budgetStatus === "warn"
      ? "warning"
      : budgetStatus === "ok"
      ? "success"
      : "neutral";

  const displayName = user?.name || user?.nombre || user?.email || "—";

  // ---------- Dashboard ----------
  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* Header (mismo estilo que Gastos) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-white/80">
              Mes actual:{" "}
              <span className="font-semibold text-white">{monthLabelUY(monthKey)}</span>{" "}
              <span className="text-white/70">({monthKey})</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge>
                Usuario: <span className="ml-1 font-semibold text-white">{displayName}</span>
              </Badge>

              <Badge tone={isPro ? "success" : "neutral"}>
                Plan: <span className="ml-1 font-semibold">{isPro ? "PRO" : "FREE"}</span>
              </Badge>

              {isDemoUser ? <Badge tone="warning">Cuenta demo</Badge> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/expenses"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Ver gastos
            </Link>

            <Link
              to="/budget"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Presupuesto
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
        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {/* Contenedor suave (como Gastos) */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Col 1-2 */}
          <div className="grid gap-4 lg:col-span-2">
            <Card
              title="Resumen del mes"
              subtitle="Totales y estado del presupuesto"
              right={<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-900">{statusLabel}</span>}
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
                  <Stat
                    label="Presupuesto"
                    value={budgetAmount ? formatMoneyUYU(budgetAmount) : "—"}
                    hint={!budgetAmount ? "Configurá tu presupuesto para activar alertas" : null}
                  />
                  <Stat
                    label="Restante"
                    value={budgetAmount ? formatMoneyUYU(Math.max(0, budgetAmount - totalMonth)) : "—"}
                    hint={
                      budgetAmount
                        ? remaining < 0
                          ? "Te pasaste del presupuesto"
                          : remaining <= budgetAmount * 0.15
                          ? "Cerca del límite"
                          : "Vas bien"
                        : "Definí presupuesto para ver “Restante”"
                    }
                  />
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Uso del presupuesto</span>
                  <span className="font-semibold text-slate-900">
                    {budgetAmount ? `${percentUsed}%` : "—"}
                  </span>
                </div>

                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${ProgressTone}`}
                    style={{ width: `${budgetAmount ? percentUsed : 0}%` }}
                  />
                </div>

                {!loading && !budgetAmount ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Todavía no definiste presupuesto para este mes.{" "}
                    <Link to="/budget" className="font-semibold text-slate-900 underline">
                      Configurarlo ahora
                    </Link>
                    .
                  </div>
                ) : null}
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
                  Todavía no hay gastos en este mes.{" "}
                  <Link to="/expenses" className="font-semibold text-slate-900 underline">
                    Cargar mi primer gasto
                  </Link>
                  .
                </div>
              )}

              {isDemoUser ? (
                <button
                  onClick={seedDemo}
                  disabled={busy === "seed"}
                  className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {busy === "seed" ? "Cargando..." : "Cargar demo (solo cuentas demo)"}
                </button>
              ) : null}
            </Card>
          </div>

          {/* Col 3 */}
          <div className="grid gap-4">
            <Card title="Acciones rápidas" subtitle="Atajos para moverte rápido">
              <div className="grid gap-2">
                <Link
                  to="/expenses"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  + Nuevo gasto / Ver gastos
                </Link>

                <Link
                  to="/budget"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Configurar presupuesto
                </Link>

                {!isPro ? (
                  <Link
                    to="/plans"
                    className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
                  >
                    Ver planes (mejorar a PRO)
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <div className="font-extrabold">PRO activo</div>
                    <div className="mt-1 text-emerald-900/80">
                      Tenés funciones avanzadas habilitadas.
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Estado del mes" subtitle="Un vistazo rápido">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Gastos cargados este mes:{" "}
                    <span className="font-semibold text-slate-900">{monthItems.length}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Presupuesto definido:{" "}
                    <span className="font-semibold text-slate-900">
                      {budgetAmount ? "Sí" : "No"}
                    </span>
                  </div>

                  {budgetAmount ? (
                    <div
                      className={`rounded-xl border p-4 text-sm ${
                        budgetStatus === "over"
                          ? "border-red-200 bg-red-50 text-red-900"
                          : budgetStatus === "warn"
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-emerald-200 bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      <div className="font-extrabold">{statusLabel}</div>
                      <div className="mt-1 opacity-90">
                        {budgetStatus === "over"
                          ? `Te pasaste por ${formatMoneyUYU(Math.abs(remaining))}.`
                          : `Te quedan ${formatMoneyUYU(Math.max(0, remaining))}.`}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
