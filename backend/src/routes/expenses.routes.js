const express = require("express");
const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Crear gasto
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ message: "Faltan datos (title, amount)" });
    }

    const expense = await Expense.create({
      user: req.userId,
      title,
      amount,
      category: category || "General",
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Error creando gasto" });
  }
});

// Listar mis gastos (del usuario logueado)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error listando gastos" });
  }
});

// Eliminar un gasto mío
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({ _id: id, user: req.userId });
    if (!expense) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    await expense.deleteOne();
    res.json({ ok: true, message: "Gasto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando gasto" });
  }
});

module.exports = router;
