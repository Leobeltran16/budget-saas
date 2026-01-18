import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* HERO */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            MVP listo · Dashboard tipo SaaS
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Controlá tus gastos y tu presupuesto{" "}
            <span className="text-indigo-300">sin complicarte</span>
          </h1>

          <p className="mt-4 text-base text-slate-200/70">
            Una app simple para LATAM: registrá gastos, definí tu presupuesto mensual
            y mirá en segundos cómo venís en el mes.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/expenses"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-500/90 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-500"
                >
                  Ir al Dashboard
                </Link>
                <Link
                  to="/budget"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Ver Presupuesto
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-500/90 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-500"
                >
                  Empezar gratis
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-200/50">
            {isAuthenticated
              ? `Sesión activa: ${user?.email || "usuario"}`
              : "Sin tarjeta · Sin compromiso · Registro en 1 minuto"}
          </p>
        </div>

        {/* PANEL PREVIEW */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
          <div className="rounded-2xl bg-slate-950/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Resumen del mes</div>
                <div className="mt-1 text-xs text-slate-200/60">
                  Visual claro como SaaS
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/70">
                Mes actual
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-200/60">Gastado</div>
                <div className="mt-1 text-lg font-extrabold">$ 8.200</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-200/60">Presupuesto</div>
                <div className="mt-1 text-lg font-extrabold">$ 20.000</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-200/60">Restante</div>
                <div className="mt-1 text-lg font-extrabold">$ 11.800</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-200/70">
                <span>Uso</span>
                <span className="font-semibold">41%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[41%] bg-emerald-400" />
              </div>
              <div className="mt-2 text-xs text-slate-200/60">
                Estado: <span className="font-semibold text-slate-100">Vas bien</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Gastos</div>
          <p className="mt-2 text-sm text-slate-200/70">
            Agregá, buscá, filtrá y ordená tus gastos en segundos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Presupuesto</div>
          <p className="mt-2 text-sm text-slate-200/70">
            Definí tu presupuesto del mes y mirá lo restante automáticamente.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Alertas</div>
          <p className="mt-2 text-sm text-slate-200/70">
            Avisos cuando estás cerca del límite o cuando te pasaste.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-200/50">
        BudgetSaaS · Hecho con React + Node + MongoDB · MVP
      </div>
    </div>
  );
}
