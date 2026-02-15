import { useState } from "react";

export default function Privacy() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) {
      alert("Completá todos los campos");
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest("/contact", { method: "POST", body: { email, message } });

      if (!response.ok) {
        throw new Error("Error enviando mensaje");
      }

      alert("Mensaje enviado correctamente ✅");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error(error);
      alert("Error enviando mensaje ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 bg-white text-slate-900 rounded-3xl shadow">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
        Política de Privacidad
      </h1>

      <p className="mb-4 text-sm text-slate-500">
        Última actualización: {new Date().toLocaleDateString("es-UY")}
      </p>

      <p className="mb-4 text-slate-700">
        En Budget SaaS respetamos tu privacidad. Solo almacenamos la información
        estrictamente necesaria para que el servicio funcione correctamente.
      </p>

      <h2 className="mt-6 mb-2 font-bold text-slate-900">
        Datos almacenados
      </h2>
      <ul className="mb-4 list-disc pl-6 text-slate-700">
        <li>Email de registro</li>
        <li>Gastos ingresados</li>
        <li>Plan de suscripción</li>
      </ul>

      <h2 className="mt-6 mb-2 font-bold text-slate-900">
        Pagos
      </h2>
      <p className="mb-4 text-slate-700">
        Los pagos son procesados por PayPal. No almacenamos datos de tarjetas
        ni información bancaria.
      </p>

      <h2 className="mt-6 mb-2 font-bold text-slate-900">
        Seguridad
      </h2>
      <p className="mb-6 text-slate-700">
        Implementamos medidas razonables para proteger tu información.
      </p>

      {/* BLOQUE CONTACTO */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="mb-2 font-extrabold text-slate-900">
          ¿Tenés dudas sobre tu privacidad?
        </h3>

        <p className="mb-3 text-sm text-slate-600">
          También podés escribirnos directamente a:
        </p>

        <div className="mb-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-900 shadow">
          leorevisacv@gmail.com
        </div>

        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Tu correo:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tuemail@gmail.com"
          className="mb-3 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
        />

        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Mensaje:
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribí tu consulta aquí..."
          className="mb-4 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
          rows={4}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
