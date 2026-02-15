export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl p-6 bg-white text-slate-900 rounded-3xl shadow">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
        Contacto
      </h1>

      <p className="mb-6 text-slate-700">
        Si tenés dudas o problemas con tu suscripción, podés contactarnos:
      </p>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-2 text-sm text-slate-600">
          Email:
        </p>

        <div className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-900 shadow">
          leorevisacv@gmail.com
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Respondemos dentro de las 48 horas hábiles.
        </p>
      </div>
    </div>
  );
}
