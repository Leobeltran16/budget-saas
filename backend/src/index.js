// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes");
const expensesRoutes = require("./routes/expenses.routes");
const budgetsRoutes = require("./routes/budgets.routes");
const demoRoutes = require("./routes/demo.routes");
const billingRoutes = require("./routes/billing.routes");

const app = express();

// ==============================
// ✅ Middleware
// ==============================
app.use(express.json());

// CORS (ajustado a tu FRONT)
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: false,
  })
);

// ==============================
// ✅ Routes
// ==============================
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/expenses", expensesRoutes);
app.use("/budgets", budgetsRoutes);
app.use("/demo", demoRoutes);

// ✅ CLAVE: esto crea la ruta /billing/paypal/capture
app.use("/billing", billingRoutes);

// ==============================
// ✅ DB + Server
// ==============================
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () => console.log(`✅ API corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
  });
