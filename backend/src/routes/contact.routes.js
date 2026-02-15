const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

function requireEnv(name) {
  return process.env[name] && String(process.env[name]).trim().length > 0;
}

// ✅ Crea transporter una sola vez
function createTransporter() {
  if (!requireEnv("CONTACT_EMAIL") || !requireEnv("CONTACT_EMAIL_PASS")) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // ✅ STARTTLS (mejor para servidores que bloquean 465)
    requireTLS: true,
    auth: {
      user: process.env.CONTACT_EMAIL,
      pass: process.env.CONTACT_EMAIL_PASS, // App Password (16 chars)
    },
    tls: {
      servername: "smtp.gmail.com",
    },
    // ✅ timeouts más amplios para Render (cold start / red lenta)
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
}

let transporter = createTransporter();

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

    if (!transporter) transporter = createTransporter();

    console.log("[/contact] incoming:", { email });

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

    // ✅ cortamos a los 30s con error claro (para que no quede “enviando” infinito)
    await withTimeout(sendPromise, 30000, "SMTP_SEND_TIMEOUT");

    console.log("[/contact] sent OK");
    return res.json({ success: true, message: "Mensaje enviado" });
  } catch (error) {
    // ✅ logs completos para ver el motivo real en Render
    console.error("CONTACT ERROR FULL:", error);
    console.error("CONTACT ERROR MSG:", error?.message);

    return res.status(500).json({
      message: error?.message || "Error enviando mensaje",
    });
  }
});

module.exports = router;
