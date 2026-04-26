require("dotenv").config();

console.log("✅ index.js inició");
console.log("MONGO_URI:", process.env.MONGO_URI ? "OK" : "FALTA");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "OK" : "FALTA");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "FALTA");
console.log("CLIENT_URL:", process.env.CLIENT_URL || "FALTA");
console.log("PORT:", process.env.PORT || "Render lo asigna");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

console.log("Cargando authRoutes");
const authRoutes = require("./routes/auth.routes");

console.log("Cargando billingRoutes");
const billingRoutes = require("./routes/billing.routes");

console.log("Cargando budgetsRoutes");
const budgetsRoutes = require("./routes/budgets.routes");

console.log("Cargando expensesRoutes");
const expensesRoutes = require("./routes/expenses.routes");

console.log("Cargando demoRoutes");
const demoRoutes = require("./routes/demo.routes");

console.log("Cargando contactRoutes");
const contactRoutes = require("./routes/contact.routes");

console.log("Cargando adminNotesRoutes");
const adminNotesRoutes = require("./routes/adminNotes.routes");

const app = express();

// ==========================
// Seguridad básica
// ==========================
app.use(helmet());

// ==========================
// CORS
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
  })
);

// ==========================
// Middlewares
// ==========================
app.use(express.json({ limit: "1mb" }));

// ==========================
// Rutas
// ==========================
app.use("/auth", authRoutes);
app.use("/billing", billingRoutes);
app.use("/budgets", budgetsRoutes);
app.use("/expenses", expensesRoutes);
app.use("/demo", demoRoutes);
app.use("/contact", contactRoutes);
app.use("/admin", adminNotesRoutes);

// ==========================
// Health check
// ==========================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==========================
// 404
// ==========================
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ==========================
// Handler global de errores
// ==========================
app.use((err, req, res, next) => {
  console.error("❌ Error global:", err.message);
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ==========================
// Conexión Mongo + Server
// ==========================
if (!process.env.MONGO_URI) {
  console.error("❌ Falta MONGO_URI en variables de entorno");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

console.log("Intentando conectar a MongoDB...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Mongo conectado");

    app.listen(PORT, () => {
      console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando Mongo:");
    console.error(err);
    process.exit(1);
  });
