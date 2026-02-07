const express = require("express");
const Expense = require("../models/Expense");
const verificarToken = require("../middleware/verificarToken");

const router = express.Router();

// Crear gasto
router.post("/", verificarToken, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ message: "Faltan datos (title, amount)" });
    }

    const expense = await Expense.create({
      user: req.user.id,
      title: String(title).trim(),
      amount: Number(amount),
      category: category ? String(category).trim() : "General",
      date: date ? new Date(date) : new Date(),
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);
    return res.status(500).json({ message: "Error creando gasto" });
  }
});

// Listar mis gastos
router.get("/", verificarToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    return res.json(expenses);
  } catch (error) {
    console.error("LIST EXPENSES ERROR:", error);
    return res.status(500).json({ message: "Error listando gastos" });
  }
});

// ✅ Editar un gasto mío (monto / título / categoría / fecha)
router.patch("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    const expense = await Expense.findOne({ _id: id, user: req.user.id });
    if (!expense) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    // Solo actualizamos lo que venga
    if (title !== undefined) expense.title = String(title).trim();
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = String(category).trim();
    if (date !== undefined) expense.date = new Date(date);

    await expense.save();
    return res.json(expense);
  } catch (error) {
    console.error("PATCH EXPENSE ERROR:", error);
    return res.status(500).json({ message: "Error actualizando gasto" });
  }
});

// ✅ Eliminar seleccionados (bulk)
// body: { ids: ["id1","id2", ...] }
router.delete("/bulk", verificarToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Faltan ids" });
    }

    const result = await Expense.deleteMany({
      _id: { $in: ids },
      user: req.user.id,
    });

    return res.json({
      ok: true,
      deletedCount: result.deletedCount || 0,
      message: "Gastos seleccionados eliminados ✅",
    });
  } catch (error) {
    console.error("BULK DELETE EXPENSE ERROR:", error);
    return res.status(500).json({ message: "Error eliminando gastos" });
  }
});

// Eliminar un gasto mío
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({ _id: id, user: req.user.id });
    if (!expense) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    await expense.deleteOne();
    return res.json({ ok: true, message: "Gasto eliminado" });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);
    return res.status(500).json({ message: "Error eliminando gasto" });
  }
});

module.exports = router;
