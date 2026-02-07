const express = require("express");
const Budget = require("../models/Budget");
const verificarToken = require("../middleware/verificarToken");

const router = express.Router();

function currentMonthYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ✅ NUEVO: GET /budgets -> presupuesto del mes actual
router.get("/", verificarToken, async (req, res) => {
  try {
    const month = currentMonthYYYYMM();
    const budget = await Budget.findOne({ user: req.user.id, month });
    return res.json(budget || null);
  } catch (error) {
    console.error("GET CURRENT BUDGET ERROR:", error);
    return res.status(500).json({ message: "Error obteniendo presupuesto" });
  }
});

// Obtener presupuesto del mes (existente)
router.get("/:month", verificarToken, async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOne({ user: req.user.id, month });
    return res.json(budget || null);
  } catch (error) {
    console.error("GET BUDGET ERROR:", error);
    return res.status(500).json({ message: "Error obteniendo presupuesto" });
  }
});

// Crear o actualizar presupuesto (existente)
router.post("/", verificarToken, async (req, res) => {
  try {
    const { amount, month } = req.body;

    if (amount === undefined || !month) {
      return res.status(400).json({ message: "Faltan datos (amount, month)" });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, month },
      { amount: Number(amount) },
      { new: true, upsert: true }
    );

    return res.status(201).json(budget);
  } catch (error) {
    console.error("UPSERT BUDGET ERROR:", error);
    return res.status(500).json({ message: "Error guardando presupuesto" });
  }
});

module.exports = router;
