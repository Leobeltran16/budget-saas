export default function EditExpenseModal({
  open,
  onClose,
  onSave,
  busy,
  title,
  setTitle,
  amount,
  setAmount,
  category,
  setCategory,
  categories = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Editar gasto</h3>
            <p className="mt-1 text-sm text-slate-600">
              Modificá título, monto y categoría.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            Cerrar
          </button>
        </div>

        {/* Form */}
        <div className="mt-5 grid gap-4">
          {/* Título */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Supermercado"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Monto
            </label>
               <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // deja solo: dígitos, coma y punto
                  const raw = e.target.value;

                  // 1) limpiar caracteres no permitidos
                  let cleaned = raw.replace(/[^\d.,]/g, "");

                  // 2) permitir solo un separador decimal (si hay varios, se queda con el primero)
                  const firstSepIndex = cleaned.search(/[.,]/);
                  if (firstSepIndex !== -1) {
                    const intPart = cleaned.slice(0, firstSepIndex);
                    const sep = cleaned[firstSepIndex];
                    const decPart = cleaned
                      .slice(firstSepIndex + 1)
                      .replace(/[.,]/g, ""); // borra otros separadores

                    // 3) opcional: limitar a 2 decimales
                    cleaned = intPart + sep + decPart.slice(0, 2);
                  }

                  setAmount(cleaned);
                }}
                placeholder="Ej: 1200.50"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            <p className="mt-1 text-xs text-slate-500">Podés usar punto o coma.</p>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="text-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
