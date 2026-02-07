import { useEffect, useMemo, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const DEFAULT_TIMEOUT_MS = 8000;

function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms)`)), ms)
    ),
  ]);
}

function safeJson(res) {
  return res
    .json()
    .catch(() => null)
    .then((data) => data);
}

function statusPill(ok) {
  return ok
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : "bg-red-100 text-red-800 border-red-200";
}

export default function Health() {
  const { token, isAuthenticated } = useContext(AuthContext);

  const API_BASE = useMemo(() => {
    // Ajustá si ya tenés otra convención (ej: VITE_BACKEND_URL).
    const fromEnv =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_SERVER_URL;

    // Si no hay env, asume mismo dominio (útil si tenés proxy). Si no, poné tu Render URL en .env
    return (fromEnv || "").replace(/\/$/, "");
  }, []);

  const [running, setRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ ok: false, total: 0, passed: 0 });
  const [error, setError] = useState("");

  const authHeaders = useMemo(() => {
    const t = token || localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    };
  }, [token]);

  const canRun = isAuthenticated && (token || localStorage.getItem("token"));

  async function call(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const res = await withTimeout(
      fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      })
    );

    const data = await safeJson(res);

    return {
      ok: res.ok,
      status: res.status,
      data,
      url,
    };
  }

  async function runChecks() {
    setRunning(true);
    setError("");
    setResults([]);
    setSummary({ ok: false, total: 0, passed: 0 });

    const checks = [
      {
        key: "auth_me",
        label: "token + /auth/me",
        fn: () => call("/auth/me", { method: "GET" }),
      },
      {
        key: "expenses_get",
        label: "/expenses GET",
        fn: () => call("/expenses", { method: "GET" }),
      },
      {
        key: "expenses_post",
        label: "/expenses POST",
        fn: () =>
          call("/expenses", {
            method: "POST",
            body: JSON.stringify({
              title: "Health Test Expense",
              amount: 1,
              category: "Health",
              date: new Date().toISOString(),
              _health: true,
            }),
          }),
      },
      {
        key: "expenses_delete",
        label: "/expenses DELETE (borra el gasto recién creado)",
        fn: async () => {
          // 1) crear un gasto
          const created = await call("/expenses", {
            method: "POST",
            body: JSON.stringify({
              title: "Health Delete Test",
              amount: 1,
              category: "Health",
              date: new Date().toISOString(),
              _health: true,
            }),
          });

          if (!created.ok) {
            return {
              ok: false,
              status: created.status,
              data: { step: "create", ...created.data },
              url: created.url,
            };
          }

          const id =
            created?.data?._id ||
            created?.data?.expense?._id ||
            created?.data?.id;

          if (!id) {
            return {
              ok: false,
              status: 500,
              data: { message: "No pude detectar el id del gasto creado." },
              url: created.url,
            };
          }

          // 2) borrar
          const deleted = await call(`/expenses/${id}`, { method: "DELETE" });
          return deleted;
        },
      },
      {
        key: "budgets_get",
        label: "/budgets GET",
        fn: () => call("/budgets", { method: "GET" }),
      },
      {
        key: "budgets_post",
        label: "/budgets POST",
        fn: () =>
          call("/budgets", {
            method: "POST",
            body: JSON.stringify({
              month: new Date().toISOString().slice(0, 7), // YYYY-MM
              amount: 100,
              _health: true,
            }),
          }),
      },
      {
        key: "demo_seed",
        label: "/demo/seed",
        fn: () => call("/demo/seed", { method: "POST" }),
      },
      {
        key: "auth_plan",
        label: "/auth/plan",
        fn: () => call("/auth/plan", { method: "GET" }),
      },
    ];

    try {
      // corre en paralelo para que entre en ~30s (depende de tu backend)
      const promises = checks.map(async (c) => {
        const start = performance.now();
        try {
          const r = await c.fn();
          const ms = Math.round(performance.now() - start);
          return {
            key: c.key,
            label: c.label,
            ok: !!r.ok,
            status: r.status,
            ms,
            details: r.data,
          };
        } catch (e) {
          const ms = Math.round(performance.now() - start);
          return {
            key: c.key,
            label: c.label,
            ok: false,
            status: 0,
            ms,
            details: { message: e?.message || "Error" },
          };
        }
      });

      const out = await Promise.all(promises);

      const total = out.length;
      const passed = out.filter((x) => x.ok).length;

      setResults(out);
      setSummary({ ok: passed === total, total, passed });
      setLastRunAt(new Date());
    } catch (e) {
      setError(e?.message || "Error corriendo health checks.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    // auto-run cuando entra, si está autenticado
    if (canRun) runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRun]);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Health</h1>
            <p className="mt-1 text-sm text-slate-600">
              Pantalla interna para validar producción en ~30 segundos.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              API:{" "}
              <span className="font-mono">
                {API_BASE || "(no detectada) - setea VITE_API_URL"}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runChecks}
              disabled={!canRun || running}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? "Corriendo..." : "Run checks"}
            </button>
          </div>
        </div>

        {!canRun && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Necesitás estar logueado para ver esta pantalla.
          </div>
        )}

        {!!error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusPill(
                  summary.ok
                )}`}
              >
                {summary.ok ? "OK" : "NOT OK"}
              </span>
              <span className="text-sm text-slate-700">
                {summary.passed}/{summary.total} checks
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Última corrida:{" "}
              {lastRunAt ? lastRunAt.toLocaleString() : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {results.map((r) => (
            <div
              key={r.key}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusPill(
                      r.ok
                    )}`}
                  >
                    {r.ok ? "PASS" : "FAIL"}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {r.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    status:{" "}
                    <span className="font-mono text-slate-700">
                      {r.status}
                    </span>
                  </span>
                  <span>
                    ms:{" "}
                    <span className="font-mono text-slate-700">{r.ms}</span>
                  </span>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate-600">
                  Ver respuesta
                </summary>
                <pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
{JSON.stringify(r.details, null, 2)}
                </pre>
              </details>
            </div>
          ))}

          {canRun && results.length === 0 && !running && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Sin resultados todavía. Tocá <b>Run checks</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
