import { useNavigate } from "react-router-dom";

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
        <h1 className="text-2xl font-extrabold text-red-500">❌ Pago cancelado</h1>

        <p className="mt-3 text-slate-600">
          No se realizó ningún cargo. Podés intentar de nuevo cuando quieras.
        </p>

        <button
          onClick={() => navigate("/plans")}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Volver a Planes
        </button>
      </div>
    </div>
  );
}
