const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const verificarToken = require("../middleware/verificarToken");

// POST /demo/seed
router.post("/seed", verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await Expense.countDocuments({ user: userId });
    if (existing > 0) {
      return res.json({ ok: true, message: "Ya tenés gastos, no se creó demo.", created: 0 });
    }

    const now = new Date();
    const mk = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const demoExpenses = [
      { title: "Supermercado", amount: 1200, category: "Supermercado", date: mk(2), user: userId },
      { title: "Transporte", amount: 250, category: "Transporte", date: mk(3), user: userId },
      { title: "Comida", amount: 480, category: "Comida", date: mk(5), user: userId },
      { title: "Internet", amount: 900, category: "Hogar", date: mk(7), user: userId },
      { title: "Farmacia", amount: 320, category: "Salud", date: mk(9), user: userId },
      { title: "Ocio", amount: 600, category: "Ocio", date: mk(11), user: userId },
    ];

    const created = await Expense.insertMany(demoExpenses);

    return res.json({ ok: true, message: "Gastos demo creados ✅", created: created.length });
  } catch (err) {
    console.error("DEMO SEED ERROR:", err);
    return res.status(500).json({ message: err.message || "Error creando demo" });
  }
});

module.exports = router;
