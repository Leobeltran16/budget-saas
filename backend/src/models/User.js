const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
    },

    // ✅ Planes
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    // ✅ Billing / Suscripción (para monetización real)
    billingProvider: {
      // "mercadopago" | "paypal" | "manual" | null
      type: String,
      default: null,
    },
    billingStatus: {
      // "active" | "pending" | "cancelled" | "expired" | null
      type: String,
      default: null,
    },
    billingSubscriptionId: {
      // id de suscripción del proveedor (ej. mp_preapproval_id o paypal_subscription_id)
      type: String,
      default: null,
    },
    billingCurrentPeriodEnd: {
      // fecha fin del período pago (para vencer Pro automáticamente si querés)
      type: Date,
      default: null,
    },

    // ✅ Password Reset
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
