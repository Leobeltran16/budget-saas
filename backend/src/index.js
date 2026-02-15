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

const app = express();

// ==========================
// Seguridad básica
// ==========================
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173", // frontend local
      process.env.FRONTEND_URL, // producción
    ],
    credentials: true,
  })
);

// ==========================
// Middlewares
// ==========================
app.use(express.json());

// ==========================
// Rutas
// ==========================
app.use("/auth", authRoutes);
app.use("/billing", billingRoutes);
app.use("/budgets", budgetsRoutes);
app.use("/expenses", expensesRoutes);
app.use("/demo", demoRoutes);
app.use("/contact", contactRoutes);

// ==========================
// Health check
// ==========================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==========================
// Handler global de errores
// ==========================
app.use((err, req, res, next) => {
  console.error("Error global:", err.stack);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ==========================
// Conexión Mongo + Server
// ==========================
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
  });
