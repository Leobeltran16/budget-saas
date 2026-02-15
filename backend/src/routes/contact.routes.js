const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    if (!process.env.CONTACT_EMAIL || !process.env.CONTACT_EMAIL_PASS) {
      return res.status(500).json({
        message:
          "Faltan variables en el servidor: CONTACT_EMAIL / CONTACT_EMAIL_PASS",
      });
    }

    // ✅ Más confiable que 'service: gmail' en producción
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.CONTACT_EMAIL,
        pass: process.env.CONTACT_EMAIL_PASS, // App Password
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    // ✅ Si falla acá, te dice el error REAL (credenciales / conexión / bloqueo)
    await transporter.verify();

    await transporter.sendMail({
      from: `"Budget SaaS" <${process.env.CONTACT_EMAIL}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email, // para responderle al usuario directo
      subject: "Nuevo mensaje desde Privacy",
      html: `
        <h3>Nuevo mensaje recibido</h3>
        <p><b>Email del usuario:</b> ${email}</p>
        <p><b>Mensaje:</b></p>
        <p>${String(message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    return res.json({ success: true, message: "Mensaje enviado" });
  } catch (error) {
    console.error("Error en /contact:", error);

    // ✅ devolvemos el error real (para debug)
    // Si después querés ocultarlo, lo cambiamos a un mensaje genérico.
    return res.status(500).json({
      message: error?.message || "Error enviando mensaje",
    });
  }
});

module.exports = router;
