// controllers/paypal.controller.js

const PAYPAL_API_BASE = (process.env.PAYPAL_MODE || "sandbox") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// ✅ Normalizamos URLs para evitar dobles //
const RAW_BACKEND_URL =
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
const RAW_CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const BACKEND_URL = String(RAW_BACKEND_URL).replace(/\/+$/, ""); // quita / al final
const CLIENT_URL = String(RAW_CLIENT_URL).replace(/\/+$/, "");   // quita / al final

// ✅ Intentamos cargar el modelo de usuario (según cómo lo tengas nombrado)
let UserModel = null;
try {
  UserModel = require("../models/User");
} catch (e) {
  try {
    UserModel = require("../models/Usuario");
  } catch (e2) {
    UserModel = null;
  }
}

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
exports.createSubscription = async (req, res) => {
  try {
    const accessToken = await getPaypalAccessToken();

    const amount = Number(process.env.PRO_PRICE_USD || 3).toFixed(2);

    // ✅ PayPal vuelve al backend para capturar (sin dobles //)
    const returnUrl = `${BACKEND_URL}/billing/paypal/capture`;

    // ✅ Cancel va directo al frontend (sin dobles //)
    const cancelUrl = `${CLIENT_URL}/billing/cancel`;

    // ✅ userId desde middleware (si la ruta está protegida)
    const userId =
      req.user?.id || req.user?._id || req.user?.userId || req.user?.uid || null;

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
            // ✅ Guardamos quién es el usuario para activar PRO en capture
            ...(userId ? { custom_id: String(userId) } : {}),
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

    const approveLink = (orderData.links || []).find((l) => l.rel === "approve")?.href;

    if (!approveLink) {
      return res.status(500).json({ message: "No se encontró approve link de PayPal" });
    }

    // ✅ Plans.jsx espera res.url
    return res.json({
      ok: true,
      url: approveLink,
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

    // 1) Capturamos
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

    // 2) Recuperar custom_id (userId) desde la orden
    let customId = capData?.purchase_units?.[0]?.custom_id;

    // A veces el capture response no lo trae → lo pedimos con GET
    if (!customId) {
      const getRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const getData = await getRes.json();
      if (getRes.ok) {
        customId = getData?.purchase_units?.[0]?.custom_id;
      }
    }

    // 3) Activar PRO en DB
    if (UserModel && customId) {
      try {
        await UserModel.findByIdAndUpdate(customId, { plan: "pro" }, { new: true });
      } catch (e) {
        console.error("Error actualizando plan en DB:", e);
      }
    } else {
      if (!UserModel) console.warn("No se encontró modelo de Usuario para actualizar plan.");
      if (!customId) console.warn("No se recibió custom_id para activar el plan.");
    }

    return res.redirect(`${CLIENT_URL}/billing/success?ok=1`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${CLIENT_URL}/billing/success?ok=0&reason=server_error`);
  }
};
