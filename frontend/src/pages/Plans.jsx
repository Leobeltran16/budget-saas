// src/pages/Plans.jsx
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
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const title = type === "error" ? "Error" : "Listo";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[1000] w-[min(92vw,420px)]"
    >
      <div className={cx("rounded-2xl border p-4 shadow-lg", styles)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">{title}</div>
            <p className="mt-1 text-sm leading-5">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
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
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
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

  const [busy, setBusy] = useState(""); // "free" | "pro_month" | "pro_year" | ""
  const [toast, setToast] = useState({ type: "success", message: "" });

  // ✅ Toast auto-cierre (4s)
  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => {
      setToast({ type: "success", message: "" });
    }, 4000);
    return () => clearTimeout(t);
  }, [toast.message]);

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

    // si está en PRO -> mostramos modal
    if (isPro) {
      openDowngrade();
      return;
    }

    applyPlanFree();
  };

  // ✅ Pasar a PRO (PayPal) — mensual o anual
  const startPayPal = async (billingCycle) => {
    clearToast();
    if (!requireAuth()) return;

    if (isPro) {
      showToast("success", "Ya tenés PRO activo ✅");
      return;
    }

    const busyKey = billingCycle === "year" ? "pro_year" : "pro_month";
    setBusy(busyKey);

    try {
      const res = await apiRequest("/billing/paypal/create-subscription", {
        method: "POST",
        token,
        body: { plan: "pro", billingCycle }, // ✅ month | year
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
    periodLabel,
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
        "rounded-3xl border bg-white p-6 text-slate-900 shadow-sm",
        highlight
          ? "border-emerald-400/40 ring-2 ring-emerald-400/20"
          : "border-slate-200/70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{tag}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-slate-900">{price}</div>
          <div className="text-xs text-slate-500">{periodLabel}</div>
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
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* Header (igual Gastos/Home) */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Planes
            </h1>
            <p className="mt-1 text-white/80">
              Elegí el plan que mejor se ajuste a tu uso.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Plan actual:
                <span className="ml-1 font-extrabold">
                  {currentPlan.toUpperCase()}
                </span>
              </span>

              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Estado:
                <span className="ml-1 font-extrabold">
                  {isPro ? "PRO activo" : "Free"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/app"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Volver al Dashboard
            </Link>
            <Link
              to="/profile"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Perfil
            </Link>
          </div>
        </div>
      </div>

      <Toast type={toast.type} message={toast.message} onClose={clearToast} />

      {/* Contenedor estilo Gastos */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Free"
            price="$0"
            periodLabel="gratis"
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
            title="Pro Mensual"
            price="$5"
            periodLabel="por mes"
            tag="Uso completo"
            features={[
              "Elegir cualquier mes",
              "Dashboard completo",
              "Exportar (Excel/CSV)",
              "Compartir por WhatsApp",
            ]}
            cta={
              isPro
                ? "Plan actual: PRO"
                : busy === "pro_month"
                ? "Redirigiendo a PayPal..."
                : "Pagar y activar PRO mensual"
            }
            onClick={() => startPayPal("month")}
            active={isPro}
            disabled={proDisabled}
            highlight
            footer="Mismas funciones PRO. Duración: 30 días."
          />

          <Card
            title="Pro Anual"
            price="$50"
            periodLabel="por año"
            tag="Uso completo (mejor precio)"
            features={[
              "Todo lo de PRO",
              "Elegir cualquier mes",
              "Exportar (Excel/CSV)",
              "Compartir por WhatsApp",
            ]}
            cta={
              isPro
                ? "Plan actual: PRO"
                : busy === "pro_year"
                ? "Redirigiendo a PayPal..."
                : "Pagar y activar PRO anual"
            }
            onClick={() => startPayPal("year")}
            active={isPro}
            disabled={proDisabled}
            highlight
            footer="Mismas funciones PRO. Duración: 365 días."
          />
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 text-slate-900 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">¿Dudas?</div>
            <Link to="/profile" className="text-sm font-semibold underline">
              Ver perfil
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Podés revisar tu estado, datos y acciones desde tu perfil.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="info">Pago seguro por PayPal</Badge>
            <Badge tone="success">
              PRO = mes histórico + export + WhatsApp
            </Badge>
            <Badge tone="warning">
              Si bajás a Free, luego tenés que pagar de nuevo
            </Badge>
          </div>
        </div>
      </div>

      {/* ✅ MODAL: Cancelar PRO */}
      {downgradeOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
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
                  • Si querés volver a PRO, vas a tener que pagar nuevamente.
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
