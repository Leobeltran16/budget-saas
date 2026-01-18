const express = require("express");
const Budget = require("../models/Budget");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Obtener presupuesto del mes
router.get("/:month", authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;
    const budget = await Budget.findOne({ user: req.userId, month });
    res.json(budget || null);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo presupuesto" });
  }
});

// Crear / actualizar presupuesto del mes
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { month, amount } = req.body;
    if (!month || amount === undefined) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, month },
      { amount },
      { upsert: true, new: true }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Error guardando presupuesto" });
  }
});

module.exports = router;
