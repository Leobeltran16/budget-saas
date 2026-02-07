import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Toast({ type = "success", message, onClose }) {
  if (!message) return null;

  const styles =
    type === "error"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div className={cx("mt-4 rounded-xl border p-3 text-sm", styles)}>
      <div className="flex items-start justify-between gap-3">
        <p className="leading-5">{message}</p>
        <button
          onClick={onClose}
          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold hover:bg-black/5"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function Plans() {
  const navigate = useNavigate();
  const { token, user, refreshMe, isAuthenticated } = useContext(AuthContext);

  const currentPlan = useMemo(
    () => String(user?.plan || "free").toLowerCase(),
    [user]
  );
  const isPro = currentPlan === "pro";

  const [busy, setBusy] = useState(""); // "free" | "pro" | ""
  const [toast, setToast] = useState({ type: "success", message: "" });

  // ✅ Modal downgrade
  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const showToast = (type, message) => setToast({ type, message });
  const clearToast = () => setToast({ type: "success", message: "" });

  const requireAuth = () => {
    if (!isAuthenticated || !token) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const closeDowngrade = () => setDowngradeOpen(false);
  const openDowngrade = () => setDowngradeOpen(true);

  // ✅ UX: cerrar modal con ESC + bloquear scroll cuando está abierto
  useEffect(() => {
    if (!downgradeOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeDowngrade();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [downgradeOpen]);

  // ✅ Acción real: setear Free
  const applyPlanFree = async () => {
    clearToast();
    if (!requireAuth()) return;

    setBusy("free");
    try {
      const res = await apiRequest("/auth/plan", {
        method: "PATCH",
        token,
        body: { plan: "free" },
      });

      await refreshMe(token);
      showToast("success", res?.message || "Plan Free activo ✅");
    } catch (err) {
      showToast("error", err?.message || "Error cambiando plan");
    } finally {
      setBusy("");
      closeDowngrade();
    }
  };

  // ✅ Click en botón Free
  const onClickFree = () => {
    clearToast();
    if (!requireAuth()) return;

    if (currentPlan === "free") {
      showToast("success", "Ya estás en Free ✅");
      return;
    }

    // si está en PRO -> mostramos modal pro
    if (isPro) {
      openDowngrade();
      return;
    }

    // si no es PRO -> aplicar free directo
    applyPlanFree();
  };

  // ✅ Pasar a PRO (PayPal)
  const startPayPal = async () => {
    clearToast();
    if (!requireAuth()) return;

    if (isPro) {
      showToast("success", "Ya tenés PRO activo ✅");
      return;
    }

    setBusy("pro");
    try {
      const res = await apiRequest("/billing/paypal/create-subscription", {
        method: "POST",
        token,
        body: { plan: "pro" },
      });

      if (!res?.url) throw new Error("No se recibió la URL de PayPal");
      window.location.href = res.url;
    } catch (err) {
      showToast("error", err?.message || "Error iniciando PayPal");
      setBusy("");
    }
  };

  const Card = ({
    title,
    price,
    tag,
    features,
    cta,
    onClick,
    active,
    disabled,
    highlight,
    footer,
  }) => (
    <div
      className={cx(
        "rounded-3xl border bg-white p-6 shadow-sm",
        highlight
          ? "border-emerald-400/40 ring-2 ring-emerald-400/20"
          : "border-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{tag}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-slate-900">{price}</div>
          <div className="text-xs text-slate-500">por mes</div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={disabled}
        className={cx(
          "mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition",
          highlight
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-slate-900 text-white hover:bg-slate-800",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {cta}
      </button>

      {active && (
        <div className="mt-3 text-xs font-semibold text-emerald-700">
          Plan activo
        </div>
      )}

      {footer && <div className="mt-3 text-xs text-slate-500">{footer}</div>}
    </div>
  );

  const freeDisabled = busy !== "" || currentPlan === "free";
  const proDisabled = busy !== "" || isPro;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Planes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Elegí el plan que mejor se ajuste a tu uso.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Plan actual: <span className="font-semibold text-white">{currentPlan.toUpperCase()}</span>
        </div>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={clearToast}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card
          title="Free"
          price="$0"
          tag="Para empezar"
          features={["Gastos y presupuesto", "Mes actual", "Dashboard básico"]}
          cta={
            currentPlan === "free"
              ? "Free activo"
              : isPro
              ? "Cancelar PRO (bajar a Free)"
              : busy === "free"
              ? "Aplicando..."
              : "Usar Free"
          }
          onClick={onClickFree}
          active={currentPlan === "free"}
          disabled={freeDisabled}
          footer={
            isPro
              ? "Si bajás a Free perdés funciones PRO. Para volver a PRO vas a tener que pagar nuevamente."
              : "Ideal para probar la app."
          }
        />

        <Card
          title="Pro"
          price="$3"
          tag="Uso completo"
          features={[
            "Elegir cualquier mes",
            "Alertas de presupuesto",
            "Dashboard completo",
            "Export CSV (próximo)",
          ]}
          cta={
            isPro
              ? "Plan actual: Pro"
              : busy === "pro"
              ? "Redirigiendo a PayPal..."
              : "Pagar y activar Pro"
          }
          onClick={startPayPal}
          active={isPro}
          disabled={proDisabled}
          highlight
          footer="Pago para activar PRO (en este MVP, si bajás a Free y querés volver, pagás otra vez)."
        />
      </div>

      <div className="mt-6 text-sm text-slate-500">
        ¿Dudas?{" "}
        <Link to="/profile" className="underline">
          Ver perfil
        </Link>
      </div>

      {/* ✅ MODAL: Cancelar PRO */}
      {downgradeOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            // click fuera para cerrar
            if (e.target === e.currentTarget) closeDowngrade();
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Cancelar PRO
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Estás por bajar de <b>PRO</b> a <b>FREE</b>.
                </p>
              </div>
              <button
                onClick={closeDowngrade}
                disabled={busy !== ""}
                className={cx(
                  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50",
                  busy !== "" && "opacity-60 cursor-not-allowed"
                )}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <ul className="space-y-2">
                <li>• Vas a perder acceso a funciones PRO.</li>
                <li>
                  • Si querés volver a PRO, vas a tener que pagar nuevamente los{" "}
                  <b>$3</b>.
                </li>
              </ul>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeDowngrade}
                disabled={busy !== ""}
                className={cx(
                  "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50",
                  busy !== "" && "opacity-60 cursor-not-allowed"
                )}
              >
                Mantener PRO
              </button>

              <button
                onClick={applyPlanFree}
                disabled={busy !== ""}
                className={cx(
                  "rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500",
                  busy !== "" && "opacity-60 cursor-not-allowed"
                )}
              >
                {busy === "free" ? "Bajando a Free..." : "Sí, bajar a Free"}
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Tip: podés cerrar con <b>ESC</b>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
