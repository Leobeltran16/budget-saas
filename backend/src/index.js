const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const expensesRoutes = require("./routes/expenses.routes");
const budgetsRoutes = require("./routes/budgets.routes");

const app = express();

// Render / proxies (no rompe local)
app.set("trust proxy", 1);

// CORS seguro (local + prod)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://budget-saas.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sin origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Permitir cualquier subdominio de Vercel (previews)
      const isVercel =
        origin.endsWith(".vercel.app");

      if (allowedOrigins.includes(origin) || isVercel) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/expenses", expensesRoutes);
app.use("/budgets", budgetsRoutes);

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
