import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const { token, refreshMe } = useContext(AuthContext);

  useEffect(() => {
    const run = async () => {
      if (token) await refreshMe(token);
      setTimeout(() => navigate("/plans"), 1500);
    };
    run();
  }, [token, refreshMe, navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
        <h1 className="text-2xl font-extrabold text-emerald-600">✅ Pago realizado</h1>

        <p className="mt-3 text-slate-600">
          Tu plan <strong>PRO</strong> fue activado correctamente.
        </p>

        <p className="mt-2 text-sm text-slate-500">Te estamos redirigiendo…</p>

        <button
          onClick={() => navigate("/plans")}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Ir a Planes
        </button>
      </div>
    </div>
  );
}
