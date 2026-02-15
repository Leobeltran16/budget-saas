const express = require("express");
const router = express.Router();
const ContactNote = require("../models/ContactNote");

// ==============================
// POST /contact  (público)
// ==============================
router.post("/", async (req, res) => {
  try {
    const { email, message, page } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ message: "Faltan datos (email o message)" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMessage = String(message).trim();

    if (cleanEmail.length < 5 || cleanMessage.length < 3) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const doc = await ContactNote.create({
      email: cleanEmail,
      message: cleanMessage,
      page: page ? String(page).trim() : "",
      userId: req.user?.id || null,
    });

    return res.json({
      success: true,
      message: "Nota guardada correctamente",
      id: doc._id,
    });
  } catch (err) {
    console.error("CONTACT NOTE ERROR:", err);
    return res.status(500).json({
      message: "Error guardando nota",
    });
  }
});

module.exports = router;
