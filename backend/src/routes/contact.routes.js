const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

function requireEnv(name) {
  return process.env[name] && String(process.env[name]).trim().length > 0;
}

// ✅ Crea transporter una sola vez (evita colgarse por verify() en cada request)
function createTransporter() {
  if (!requireEnv("CONTACT_EMAIL") || !requireEnv("CONTACT_EMAIL_PASS")) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.CONTACT_EMAIL,
      pass: process.env.CONTACT_EMAIL_PASS, // App Password
    },
    // timeouts más agresivos para que NO quede colgado
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 12000,
  });
}

let transporter = createTransporter();

// ✅ helper para cortar una promesa si se cuelga
function withTimeout(promise, ms, label = "TIMEOUT") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: ${ms}ms`)), ms)
    ),
  ]);
}

router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    if (!requireEnv("CONTACT_EMAIL") || !requireEnv("CONTACT_EMAIL_PASS")) {
      return res.status(500).json({
        message:
          "Faltan variables en el servidor: CONTACT_EMAIL / CONTACT_EMAIL_PASS",
      });
    }

    // si Render reinició y transporter quedó null, lo recreamos
    if (!transporter) transporter = createTransporter();

    console.log("[/contact] incoming:", { email });

    // ⚠️ NO hacemos verify() acá porque puede colgarse o demorar.
    // Vamos directo al envío con timeout duro.
    const sendPromise = transporter.sendMail({
      from: `"Budget SaaS" <${process.env.CONTACT_EMAIL}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: "Nuevo mensaje desde Privacy",
      html: `
        <h3>Nuevo mensaje recibido</h3>
        <p><b>Email del usuario:</b> ${email}</p>
        <p><b>Mensaje:</b></p>
        <p>${String(message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    // ✅ si se cuelga, cortamos a los 12s con error claro
    await withTimeout(sendPromise, 12000, "SMTP_SEND_TIMEOUT");

    console.log("[/contact] sent OK");
    return res.json({ success: true, message: "Mensaje enviado" });
  } catch (error) {
    console.error("Error en /contact:", error?.message);
    console.error(error);

    return res.status(500).json({
      message: error?.message || "Error enviando mensaje",
    });
  }
});

module.exports = router;
