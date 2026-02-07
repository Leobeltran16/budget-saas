export default function EditExpenseModal({
  open,
  onClose,
  onSave,
  busy,
  editTitle,
  setEditTitle,
  editAmount,
  setEditAmount,
  editCategory,
  setEditCategory,
  CATEGORIES,
  sanitizeDecimalInput,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Editar gasto</h3>
            <p className="mt-1 text-sm text-slate-600">Título, monto y categoría.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Título</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) =>
                setEditTitle(
                  e.target.value.replace(/[\r\n\u2028\u2029]/g, " ")
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Supermercado"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Monto</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              type="text"
              inputMode="decimal"
              value={editAmount}
              onChange={(e) => {
                const next = sanitizeDecimalInput(e.target.value);
                setEditAmount(next);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                const next = sanitizeDecimalInput(pasted);
                setEditAmount(next);
              }}
              placeholder="Ej: 350 o 350,50"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Categoría</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
