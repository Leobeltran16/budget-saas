const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const expensesRoutes = require("./routes/expenses.routes");
const budgetsRoutes = require("./routes/budgets.routes");
const demoRoutes = require("./routes/demo.routes");
const billingRoutes = require("./routes/billing.routes");

const app = express();
app.set("trust proxy", 1);

// ✅ CORS primero (antes de cualquier ruta)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://budget-saas.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isVercel = origin.endsWith(".vercel.app");
    if (allowedOrigins.includes(origin) || isVercel) return callback(null, true);

    return callback(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// ❌ NO app.options("*") ni "/*" (te crashea en tu setup)

app.use(express.json());

// Routes (después de CORS)
app.use("/auth", authRoutes);
app.use("/expenses", expensesRoutes);
app.use("/budgets", budgetsRoutes);
app.use("/demo", demoRoutes);
app.use("/billing", billingRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend funcionando ✅" });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Backend corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando DB:", err.message);
    process.exit(1);
  });
