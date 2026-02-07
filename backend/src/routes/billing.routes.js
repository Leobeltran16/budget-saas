// routes/billing.routes.js
const express = require("express");
const verificarToken = require("../middleware/verificarToken");
const { createSubscription, captureOrder } = require("../controllers/paypal.controller");

const router = express.Router();

// ✅ El frontend llama esto (requiere JWT)
router.post("/paypal/create-subscription", verificarToken, createSubscription);

// ✅ PayPal vuelve acá sin Authorization (NO usar verificarToken)
router.get("/paypal/capture", captureOrder);

module.exports = router;
