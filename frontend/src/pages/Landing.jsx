import { Link, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated, user } = useContext(AuthContext);

  // ✅ Si está logueado, mandamos directo al dashboard
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200/80">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        MVP listo · Dashboard tipo SaaS
      </div>

      {/* Hero */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Controlá tus gastos y tu{" "}
            <span className="text-indigo-400">presupuesto</span> sin complicarte
          </h1>

          <p className="mt-4 max-w-xl text-base text-slate-200/80">
            Una app simple para LATAM: registrá gastos, definí tu presupuesto
            mensual y mirá en segundos cómo venís en el mes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-400"
            >
              Empezar gratis
            </Link>

            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Sin tarjeta · Sin compromiso · Registro en 1 minuto
          </div>
        </div>

        {/* Preview card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Resumen del mes
            </h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Mes actual
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-slate-400">Gastado</div>
              <div className="mt-1 text-lg font-bold">$ 8.200</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-slate-400">Presupuesto</div>
              <div className="mt-1 text-lg font-bold">$ 20.000</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs text-slate-400">Restante</div>
              <div className="mt-1 text-lg font-bold">$ 11.800</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Uso</span>
              <span>41%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-emerald-400"
                style={{ width: "41%" }}
              />
            </div>

            <div className="mt-2 text-xs text-emerald-300">
              Estado: Vas bien
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Gastos</h3>
          <p className="mt-1 text-sm text-slate-200/70">
            Agregá, buscá, filtrá y ordená tus gastos en segundos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Presupuesto</h3>
          <p className="mt-1 text-sm text-slate-200/70">
            Definí tu presupuesto del mes y mirá lo restante automáticamente.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Alertas</h3>
          <p className="mt-1 text-sm text-slate-200/70">
            Avisos cuando estás cerca del límite o cuando te pasaste.
          </p>
        </div>
      </div>
    </div>
  );
}
