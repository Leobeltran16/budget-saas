const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Usuario = require("../models/User");
const verificarToken = require("../middleware/verificarToken");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ==============================
// ✅ AUTH (MVP)
// ==============================

// ✅ POST /auth/register
router.post("/register", async (req, res) => {
  try {
    // ✅ Aceptamos nombre o name (para no romper el frontend)
    const nombre = (req.body.nombre || req.body.name || req.body.username || "").trim();
    const email = (req.body.email || "").trim();
    const password = req.body.password;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        message: "Faltan campos requeridos (nombre/name, email, password)",
      });
    }

    const exists = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await Usuario.create({
      nombre,
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "user",
      plan: "free",
    });

    return res.status(201).json({ ok: true, message: "Usuario creado ✅" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y password son requeridos" });
    }

    const user = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.role || "user",
        plan: user.plan || "free",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ GET /auth/me (protegida)
router.get("/me", verificarToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ PATCH /auth/password (protegida)
router.patch("/password", verificarToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res
        .status(401)
        .json({ message: "La contraseña actual no es correcta" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    await user.save();

    return res.json({ ok: true, message: "Contraseña actualizada ✅" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ==============================
// ✅ PLANES (fase Pricing, sin pagos)
// ==============================

// ✅ NUEVO: GET /auth/plan (protegida)
router.get("/plan", verificarToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select("plan");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ plan: user.plan || "free" });
  } catch (err) {
    console.error("GET PLAN ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ PATCH /auth/plan (protegida)
router.patch("/plan", verificarToken, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !["free", "pro"].includes(plan)) {
      return res.status(400).json({ message: "Plan inválido" });
    }

    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.plan = plan;
    await user.save();

    return res.json({
      ok: true,
      message: `Plan actualizado a ${plan.toUpperCase()} ✅`,
      plan: user.plan,
    });
  } catch (err) {
    console.error("PLAN UPDATE ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

// ==============================
// ✅ PASSWORD RESET (Fase 1)
// ==============================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }

    const user = await Usuario.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.json({
        ok: true,
        message:
          "Si el email existe, te enviaremos un link para resetear la contraseña.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 30);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    return res.json({
      ok: true,
      message:
        "Si el email existe, te enviaremos un link para resetear la contraseña.",
      resetLink,
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) return res.status(400).json({ message: "Token requerido" });
    if (!newPassword)
      return res.status(400).json({ message: "Nueva contraseña requerida" });

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await Usuario.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ ok: true, message: "Contraseña restablecida ✅" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
