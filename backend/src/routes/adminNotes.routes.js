const express = require("express");
const router = express.Router();

const ContactNote = require("../models/ContactNote");
const verificarToken = require("../middleware/verificarToken");
const requireAdmin = require("../middleware/requireAdmin");

// GET /admin/notes  (solo admin) -> lista mensajes de contacto
router.get("/notes", verificarToken, requireAdmin, async (req, res) => {
  try {
    const notes = await ContactNote.find().sort({ createdAt: -1 });
    return res.json({ notes });
  } catch (err) {
    console.error("ADMIN NOTES GET ERROR:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

// PATCH /admin/notes/:id  (solo admin)
// Permite:
// - cambiar status ("new" | "read")
// - opcional: actualizar message (por si querés corregirlo)
// - opcional: actualizar page
router.patch("/notes/:id", verificarToken, requireAdmin, async (req, res) => {
  try {
    const { status, message, page } = req.body || {};

    const update = {};
    if (status !== undefined) update.status = String(status).trim();
    if (message !== undefined) update.message = String(message).trim();
    if (page !== undefined) update.page = String(page).trim();

    const updated = await ContactNote.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Nota no encontrada" });
    }

    return res.json({ note: updated });
  } catch (err) {
    console.error("ADMIN NOTES PATCH ERROR:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

// DELETE /admin/notes/:id  (solo admin)
router.delete("/notes/:id", verificarToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await ContactNote.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Nota no encontrada" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN NOTES DELETE ERROR:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

module.exports = router;
