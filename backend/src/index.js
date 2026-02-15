require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const billingRoutes = require("./routes/billing.routes");
const budgetsRoutes = require("./routes/budgets.routes");
const expensesRoutes = require("./routes/expenses.routes");
const demoRoutes = require("./routes/demo.routes");
const contactRoutes = require("./routes/contact.routes");

// ✅ NUEVO: admin notes
const adminNotesRoutes = require("./routes/adminNotes.routes");

const app = express();

// ==========================
// Seguridad básica
// ==========================
app.use(helmet());

// ==========================
// CORS (mejorado sin romper)
// ==========================
// - Permite localhost
// - Permite FRONTEND_URL y/o CLIENT_URL
// - Permite requests sin Origin (Postman/health checks)
const allowedOrigins = [
  "http://localhost:5173", // frontend local
  process.env.FRONTEND_URL, // producción
  process.env.CLIENT_URL, // por si usás este nombre
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / health checks
      if (allowedOrigins.includes(origin)) return callback(null, true);
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

// ✅ NUEVO
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
  console.error("Error global:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ==========================
// Conexión Mongo + Server
// ==========================
if (!process.env.MONGO_URI) {
  console.error("❌ Falta MONGO_URI en variables de entorno");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo conectado");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error conectando Mongo:", err);
    process.exit(1);
  });
