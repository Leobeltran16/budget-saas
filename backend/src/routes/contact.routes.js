const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isEmailLike(v) {
  return isNonEmptyString(v) && v.includes("@") && v.includes(".");
}

router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body || {};

    if (!isEmailLike(email) || !isNonEmptyString(message)) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!isNonEmptyString(apiKey) || !isEmailLike(toEmail) || !isEmailLike(fromEmail)) {
      return res.status(500).json({
        message:
          "Faltan variables en el servidor: RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL",
      });
    }

    const resend = new Resend(apiKey);

    const safeEmail = String(email).trim().slice(0, 200);
    const safeMessage = String(message).trim().slice(0, 10000);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      reply_to: safeEmail, // para que respondas directo al usuario
      subject: "Nuevo mensaje desde Budget SaaS (Privacy/Contact)",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Nuevo mensaje recibido</h2>
          <p><b>Email del usuario:</b> ${safeEmail}</p>
          <p><b>Mensaje:</b></p>
          <div style="white-space: pre-wrap; padding: 12px; border: 1px solid #eee; border-radius: 10px;">
            ${safeMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);
      return res.status(500).json({ message: error.message || "Error enviando mensaje" });
    }

    console.log("RESEND OK:", data?.id);
    return res.json({ success: true, message: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    return res.status(500).json({ message: err?.message || "Error enviando mensaje" });
  }
});

module.exports = router;
