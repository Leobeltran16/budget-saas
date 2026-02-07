import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Budget from "./Budget";
import EditExpenseModal from "../components/EditExpenseModal";

const CATEGORIES = [
  "General",
  "Supermercado",
  "Comida",
  "Transporte",
  "Hogar",
  "Salud",
  "Mascotas",
  "Ocio",
  "Otros",
];

function parseMonthKeySafe(monthKey) {
  const fallback = new Date();
  const fb = {
    monthKey: fallback.toISOString().slice(0, 7),
    month: fallback.getMonth(),
    year: fallback.getFullYear(),
  };

  if (!monthKey || typeof monthKey !== "string") return fb;

  const [y, m] = monthKey.split("-");
  const year = Number(y);
  const month = Number(m) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) return fb;

  return { monthKey, month, year };
}

function sanitizeDecimalInput(raw) {
  // Mantiene solo dígitos y separador decimal (.,)
  // - Permite "" , "1", "12", "12.5", "12,5"
  // - Si pega " $ 1.234,50 " => "1234,50" (o "1234.50" según lo que quede)
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // Quitar todo menos dígitos, puntos y comas
  let cleaned = s.replace(/[^\d.,]/g, "");

  // Si hay más de un separador, dejamos el primero como decimal y el resto se elimina
  // Ej: "1.234.567,89" -> "1234567,89"
  // Estrategia simple: quitar separadores de miles asumiendo que el ÚLTIMO separador es el decimal si hay ambos.
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  const lastSep = Math.max(lastDot, lastComma);
  if (lastSep !== -1) {
    const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    const decPart = cleaned.slice(lastSep + 1).replace(/[.,]/g, "");
    const sepChar = cleaned[lastSep];
    cleaned = decPart.length ? `${intPart}${sepChar}${decPart}` : `${intPart}${sepChar}`;
  } else {
    cleaned = cleaned.replace(/[.,]/g, "");
  }

  // Validación final: números + opcional separador + decimales
  if (!/^[0-9]*([.,][0-9]*)?$/.test(cleaned)) return "";

  return cleaned;
}

function toNumberFromDecimalString(value) {
  // "123,45" -> 123.45
  // "" -> NaN
  const v = String(value ?? "").trim();
  if (!v) return NaN;
  return Number(v.replace(",", "."));
}

function Expenses() {
  const { token, user } = useContext(AuthContext);

  const isPro = String(user?.plan || "").toLowerCase() === "pro";
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isDemoUser = userEmail.startsWith("demo"); // ✅ solo demo ve seed

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    if (!isPro) setMonthKey(currentMonthKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  const { month: selectedMonth, year: selectedYear } = useMemo(
    () => parseMonthKeySafe(monthKey),
    [monthKey]
  );

  // form (add)
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(""); // string
  const [category, setCategory] = useState("General");

  // list
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // ui filters
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // presupuesto status
  const [budgetStatus, setBudgetStatus] = useState("none"); // none | ok | warn | over

  // UX states
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(""); // "add" | "delete" | "seed" | "bulk" | "edit" | ""
  const [toast, setToast] = useState(null); // { type: "success"|"error", text: string }

  // ✅ selección
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // ✅ modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("General");

  const showToast = (type, text) => {
    setToast({ type, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  /* =========================
     API
  ========================= */

  const loadExpenses = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/expenses", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message || "Error cargando gastos";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    setError("");
    setBusyAction("add");

    const t = title.trim();
    const a = toNumberFromDecimalString(amount);

    if (!t) {
      showToast("error", "El título no puede estar vacío");
      setBusyAction("");
      return;
    }
    if (!Number.isFinite(a) || a < 0) {
      showToast("error", "El monto debe ser un número válido");
      setBusyAction("");
      return;
    }

    try {
      await apiRequest("/expenses", {
        method: "POST",
        token,
        body: { title: t, amount: a, category },
      });

      setTitle("");
      setAmount("");
      setCategory("General");

      showToast("success", "Gasto agregado ✅");
      await loadExpenses();
    } catch (err) {
      const msg = err.message || "Error creando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  const deleteExpense = async (id) => {
    setError("");
    const ok = window.confirm("¿Seguro que querés eliminar este gasto?");
    if (!ok) return;

    setBusyAction("delete");

    try {
      await apiRequest(`/expenses/${id}`, { method: "DELETE", token });
      showToast("success", "Gasto eliminado ✅");

      // si estaba seleccionado, lo sacamos
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await loadExpenses();
    } catch (err) {
      const msg = err.message || "Error eliminando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  // ✅ eliminar seleccionados (bulk)
  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const ok = window.confirm(`¿Eliminar ${ids.length} gasto(s) seleccionados?`);
    if (!ok) return;

    setError("");
    setBusyAction("bulk");

    try {
      await apiRequest("/expenses/bulk", {
        method: "DELETE",
        token,
        body: { ids },
      });

      showToast("success", "Gastos eliminados ✅");
      setSelectedIds(new Set());
      await loadExpenses();
    } catch (err) {
      const msg = err.message || "Error eliminando seleccionados";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  // DEMO SEED (solo demo)
  const seedDemo = async () => {
    if (!isDemoUser) return; // protección extra
    setError("");
    setBusyAction("seed");

    try {
      const res = await apiRequest("/demo/seed", { method: "POST", token });
      showToast("success", res?.message || "Datos demo cargados ✅");
      await loadExpenses();
    } catch (err) {
      const msg = err.message || "Error creando datos demo";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  // ✅ abrir modal editar
  const openEdit = (expense) => {
    setEditId(expense._id);
    setEditTitle(expense.title || "");
    setEditAmount(String(expense.amount ?? "")); // guardamos string
    setEditCategory(expense.category || "General");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (busyAction === "edit") return;
    setEditOpen(false);
    setEditId("");
    setEditTitle("");
    setEditAmount("");
    setEditCategory("General");
  };

  // ✅ guardar edición (título + monto + categoría)
  const saveEdit = async () => {
    const t = editTitle.trim();
    const a = toNumberFromDecimalString(editAmount);

    if (!t) {
      showToast("error", "El título no puede estar vacío");
      return;
    }
    if (!Number.isFinite(a) || a < 0) {
      showToast("error", "El monto debe ser un número válido");
      return;
    }

    setError("");
    setBusyAction("edit");

    try {
      await apiRequest(`/expenses/${editId}`, {
        method: "PATCH",
        token,
        body: { title: t, amount: a, category: editCategory },
      });

      showToast("success", "Gasto actualizado ✅");
      closeEdit();
      await loadExpenses();
    } catch (err) {
      const msg = err.message || "Error actualizando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  /* =========================
     HELPERS
  ========================= */

  const formatMoney = (n) =>
    new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      maximumFractionDigits: 0,
    }).format(n);

  const filtered = useMemo(() => {
  const q = search.trim().toLowerCase();

  // ✅ 1) primero filtramos por mes (solo lo que corresponde al mes seleccionado)
  let arr = items.filter((x) => {
    // ✅ Más seguro contra zona horaria:
    // si x.date es ISO tipo "2026-01-17T..." o "2026-01-17..."
    const key = String(x.date).slice(0, 7); // "YYYY-MM"
    return key === monthKey;
  });

  // ✅ 2) filtro por categoría
  if (filterCategory !== "Todas") {
    arr = arr.filter((x) => (x.category || "General") === filterCategory);
  }

  // ✅ 3) búsqueda por título
  if (q) {
    arr = arr.filter((x) => (x.title || "").toLowerCase().includes(q));
  }

  // ✅ 4) orden
  arr = [...arr].sort((a, b) => {
    if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
    if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
    if (sortBy === "amount_desc") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    if (sortBy === "amount_asc") return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    return 0;
  });

  return arr;
}, [items, monthKey, filterCategory, search, sortBy]);


  const monthItems = useMemo(() => {
    return items.filter((x) => {
      const d = new Date(x.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [items, selectedMonth, selectedYear]);

  const totalMonth = useMemo(() => {
    return monthItems.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }, [monthItems]);

  const totalsByCategory = useMemo(() => {
    const map = {};
    for (const x of monthItems) {
      const cat = (x.category || "General").trim() || "General";
      map[cat] = (map[cat] || 0) + (Number(x.amount) || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthItems]);

  // ✅ selección helpers (sobre la lista filtrada)
  const selectedCount = selectedIds.size;

  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((x) => selectedIds.has(x._id));
  }, [filtered, selectedIds]);

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !allFilteredSelected;

      for (const x of filtered) {
        if (shouldSelectAll) next.add(x._id);
        else next.delete(x._id);
      }
      return next;
    });
  };

  /* =========================
     UI components
  ========================= */

  const Toast = () => {
    if (!toast) return null;
    const isOk = toast.type === "success";
    return (
      <div className="fixed right-4 top-4 z-[999]">
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
            isOk
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
              : "border-red-400/30 bg-red-500/10 text-red-50"
          }`}
        >
          {toast.text}
        </div>
      </div>
    );
  };

  const LoadingCard = () => (
    <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );

  

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Toast />
        <EditExpenseModal
        open={editOpen}
        onClose={closeEdit}
        onSave={saveEdit}
        busy={busyAction === "edit"}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        CATEGORIES={CATEGORIES}
        sanitizeDecimalInput={sanitizeDecimalInput}
        />

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Gastos</h1>
        <p className="mt-1 text-sm text-slate-200/70">Gestión de gastos y presupuesto mensual.</p>

        {/* Month selector (Pro) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
            Mes: <span className="ml-1 font-semibold text-slate-100">{monthKey}</span>
          </span>

          {isPro ? (
            <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
              <span className="text-slate-200/70">Elegir</span>
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </label>
          ) : (
            <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
              Free: solo mes actual
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {budgetStatus === "over" && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          <b>⚠️ Alerta:</b> Te pasaste del presupuesto del mes.
        </div>
      )}

      {budgetStatus === "warn" && (
        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <b>⚠️ Atención:</b> Estás cerca del límite del presupuesto.
        </div>
      )}

      {/* Top cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <LoadingCard />
        ) : (
          <Budget monthItems={monthItems} monthKey={monthKey} onStatusChange={setBudgetStatus} />
        )}

        <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Resumen del mes</h3>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Total</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatMoney(totalMonth)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Cantidad</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{monthItems.length}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-500">Categorías</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{totalsByCategory.length}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-700">
            <b className="text-slate-900">Por categoría:</b>
            {totalsByCategory.length === 0 ? (
              <p className="mt-2 text-slate-600">Sin gastos este mes.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {totalsByCategory.map(([cat, val]) => (
                  <li key={cat} className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">{cat}</span>
                    <span className="font-semibold text-slate-900">{formatMoney(val)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadExpenses}
            disabled={loading || busyAction}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>

          {isDemoUser ? (
            <button
              onClick={seedDemo}
              disabled={busyAction || loading}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busyAction === "seed" ? "Cargando demo..." : "Cargar datos demo"}
            </button>
          ) : null}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">
              Seleccionados: <b className="text-slate-900">{selectedCount}</b>
            </span>

            <button
              onClick={deleteSelected}
              disabled={selectedCount === 0 || busyAction === "bulk"}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {busyAction === "bulk" ? "Eliminando..." : "Eliminar seleccionados"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Filtro categoría</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="Todas">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Buscar</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: super"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Orden</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Fecha (nuevo → viejo)</option>
              <option value="date_asc">Fecha (viejo → nuevo)</option>
              <option value="amount_desc">Monto (mayor → menor)</option>
              <option value="amount_asc">Monto (menor → mayor)</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-50">
            {error}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Agregar gasto</h3>

        <form onSubmit={addExpense} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="md:col-span-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Título (Ej: Supermercado)"
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            required
          />

          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Monto (350 o 350,50)"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
            required
          />

          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={busyAction === "add"}
            className="md:col-span-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busyAction === "add" ? "Agregando..." : "Agregar gasto"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Mis gastos</h3>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              className="h-4 w-4"
            />
            Seleccionar todo (según filtros)
          </label>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No hay gastos con ese filtro/búsqueda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {filtered.map((x) => {
              const checked = selectedIds.has(x._id);

              return (
                <li
                  key={x._id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(x._id)}
                      className="mt-1 h-4 w-4"
                      aria-label="Seleccionar gasto"
                    />

                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">{x.title}</p>
                      <p className="mt-1 text-slate-600">
                        {x.category || "General"} · {new Date(x.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(Number(x.amount) || 0)}
                    </span>

                    <button
                      onClick={() => openEdit(x)}
                      disabled={busyAction === "edit"}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteExpense(x._id)}
                      disabled={busyAction === "delete"}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busyAction === "delete" ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Expenses;
