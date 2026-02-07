const paypal = require("@paypal/checkout-server-sdk");
const Usuario = require("../models/User");

function requirePayPalEnv() {
  const missing = [];
  if (!process.env.PAYPAL_CLIENT_ID) missing.push("PAYPAL_CLIENT_ID");
  if (!process.env.PAYPAL_SECRET) missing.push("PAYPAL_SECRET");
  return missing;
}

function paypalClient() {
  const isLive = String(process.env.PAYPAL_MODE || "sandbox").toLowerCase() === "live";

  const env = isLive
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

  return new paypal.core.PayPalHttpClient(env);
}

exports.createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (plan !== "pro") return res.status(400).json({ message: "Plan inválido" });

    const missing = requirePayPalEnv();
    if (missing.length) {
      return res.status(500).json({
        message: `Faltan variables de PayPal en .env: ${missing.join(", ")} (usá Sandbox primero)`,
      });
    }

    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const price = String(process.env.PRO_PRICE_USD || "3.00");
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: price },
          description: "Budget SaaS – Plan PRO (1 mes)",
          custom_id: String(user._id), // intentamos, pero NO dependemos de esto
        },
      ],
      application_context: {
        brand_name: "Budget SaaS",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${BACKEND_URL}/billing/paypal/capture`,
        cancel_url: `${CLIENT_URL}/billing/cancel`,
      },
    });

    const order = await paypalClient().execute(request);

    // ✅ Guardamos el ORDER ID en el usuario para poder resolver en capture aunque custom_id no venga
    user.billingProvider = "paypal";
    user.billingStatus = "pending";
    user.billingSubscriptionId = String(order?.result?.id || null); // usamos este campo como "order id"
    await user.save();

    const approve = order.result.links?.find((l) => l.rel === "approve");
    if (!approve?.href) return res.status(500).json({ message: "No se recibió link approve de PayPal" });

    return res.json({ url: approve.href, orderId: order?.result?.id });
  } catch (err) {
    console.error("PAYPAL createSubscription ERROR:", err);
    return res.status(500).json({ message: err?.message || "Error PayPal" });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const missing = requirePayPalEnv();
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

    if (missing.length) {
      console.log("PAYPAL capture -> faltan env:", missing);
      return res.redirect(`${CLIENT_URL}/billing/cancel`);
    }

    const orderId = req.query.token;
    if (!orderId) {
      console.log("PAYPAL capture -> no vino token/orderId en query");
      return res.redirect(`${CLIENT_URL}/billing/cancel`);
    }

    // Capturar pago
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient().execute(request);

    const status = capture?.result?.status;
    const userIdFromCustom = capture?.result?.purchase_units?.[0]?.custom_id;

    console.log("PAYPAL capture -> orderId:", orderId, "status:", status, "custom_id:", userIdFromCustom);

    if (status !== "COMPLETED") {
      console.log("PAYPAL capture -> no COMPLETED, result:", capture?.result);
      return res.redirect(`${CLIENT_URL}/billing/cancel`);
    }

    // ✅ Resolver el usuario: primero por custom_id, si no existe, por billingSubscriptionId (orderId guardado)
    let user = null;

    if (userIdFromCustom) {
      user = await Usuario.findById(userIdFromCustom);
    }

    if (!user) {
      user = await Usuario.findOne({ billingSubscriptionId: String(orderId), billingStatus: "pending" });
    }

    if (!user) {
      console.log("PAYPAL capture -> pago COMPLETED pero no se encontró usuario para orderId:", orderId);
      return res.redirect(`${CLIENT_URL}/billing/cancel`);
    }

    // ✅ Activar PRO
    user.plan = "pro";
    user.billingProvider = "paypal";
    user.billingStatus = "active";
    user.billingSubscriptionId = String(orderId);
    await user.save();

    return res.redirect(`${CLIENT_URL}/billing/success?ok=1`);
  } catch (err) {
    console.error("PAYPAL captureOrder ERROR:", err);
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${CLIENT_URL}/billing/cancel`);
  }
};
