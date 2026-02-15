export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-extrabold mb-4">Términos y Condiciones</h1>

      <p className="mb-4 text-sm text-slate-600">
        Última actualización: {new Date().toLocaleDateString("es-UY")}
      </p>

      <p className="mb-4">
        Budget SaaS es una herramienta para gestión de gastos personales.
        Al utilizar esta plataforma aceptás estos términos.
      </p>

      <h2 className="font-bold mt-6 mb-2">Uso del servicio</h2>
      <p className="mb-4">
        El usuario es responsable de la información ingresada.
        No garantizamos disponibilidad permanente del servicio.
      </p>

      <h2 className="font-bold mt-6 mb-2">Pagos</h2>
      <p className="mb-4">
        Los pagos son procesados por PayPal.
        No almacenamos datos de tarjetas de crédito.
      </p>

      <h2 className="font-bold mt-6 mb-2">Modificaciones</h2>
      <p>
        Nos reservamos el derecho de modificar precios y funcionalidades.
      </p>
    </div>
  );
}
