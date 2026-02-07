// controllers/paypal.controller.js

const PAYPAL_API_BASE = (process.env.PAYPAL_MODE || "sandbox") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const BACKEND_URL =
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

async function getPaypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET en variables de entorno");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal token error: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

// ✅ POST /billing/paypal/create-subscription
// (Usamos Order CAPTURE para que funcione como pago simple / demo)
exports.createSubscription = async (req, res) => {
  try {
    const accessToken = await getPaypalAccessToken();

    const amount = Number(process.env.PRO_PRICE_USD || 3).toFixed(2);

    // ✅ Return/cancel vuelven a TU BACKEND (Render)
    const returnUrl = `${BACKEND_URL}/billing/paypal/capture`;
    const cancelUrl = `${CLIENT_URL}/plans?canceled=1`;

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: "Budget SaaS",
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error("PayPal create order error:", orderData);
      return res.status(500).json({
        message: "Error creando orden en PayPal",
        details: orderData,
      });
    }

    // ✅ Buscar link de aprobación
    const approveLink = (orderData.links || []).find((l) => l.rel === "approve")?.href;

    if (!approveLink) {
      return res.status(500).json({ message: "No se encontró approve link de PayPal" });
    }

    return res.json({
      ok: true,
      approveUrl: approveLink,
      orderId: orderData.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Error PayPal" });
  }
};

// ✅ GET /billing/paypal/capture?token=XXXX
exports.captureOrder = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${CLIENT_URL}/billing/success?ok=0&reason=missing_token`);
    }

    const accessToken = await getPaypalAccessToken();

    const capRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capData = await capRes.json();

    if (!capRes.ok) {
      console.error("PayPal capture error:", capData);
      return res.redirect(`${CLIENT_URL}/billing/success?ok=0&reason=capture_failed`);
    }

    // ✅ TODO: acá podrías actualizar el plan del usuario en tu DB si querés
    // Ej: set user.plan="pro" y guardar

    return res.redirect(`${CLIENT_URL}/billing/success?ok=1`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${CLIENT_URL}/billing/success?ok=0&reason=server_error`);
  }
};
