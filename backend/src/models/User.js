// backend/models/User.js
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

    // ✅ Moneda persistente por usuario
    currency: {
      type: String,
      enum: ["USD", "UYU", "ARS", "CLP", "PEN", "BRL", "EUR", "MXN", "COP"],
      default: "USD",
      trim: true,
      uppercase: true,
    },

    // ✅ Locale para formateo (Intl.NumberFormat)
    currencyLocale: {
      type: String,
      default: "es-UY",
      trim: true,
    },

    // ✅ Billing / Suscripción (para monetización real)
    billingProvider: {
      type: String,
      default: null,
    },
    billingStatus: {
      type: String,
      default: null,
    },
    billingSubscriptionId: {
      type: String,
      default: null,
    },
    billingCurrentPeriodEnd: {
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
