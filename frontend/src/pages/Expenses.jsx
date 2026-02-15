// src/pages/Expenses.jsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import EditExpenseModal from "../components/EditExpenseModal";
import * as XLSX from "xlsx";

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

function parseMonthKeySafe(key) {
  const [yStr, mStr] = String(key || "").split("-");
  const year = Number(yStr);
  const month = Number(mStr);

  const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
  const safeMonthNum = Number.isFinite(month) ? month : new Date().getMonth() + 1;

  const monthIndex = Math.min(Math.max(safeMonthNum, 1), 12) - 1;
  return { year: safeYear, month: monthIndex };
}

function toNumberFromDecimalString(value) {
  if (value === null || value === undefined) return NaN;
  const s = String(value).trim();
  if (!s) return NaN;
  return Number(s.replace(/\s/g, "").replace(",", "."));
}

function formatMonthLabel(monthKey) {
  // monthKey: "YYYY-MM"
  if (!monthKey || typeof monthKey !== "string" || monthKey.length < 7) return monthKey;
  const [y, m] = monthKey.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function Expenses() {
  const { token, user } = useContext(AuthContext);

  const isPro = String(user?.plan || "").toLowerCase() === "pro";
  const currency = (user?.currency || "USD").toUpperCase();
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isDemoUser = userEmail.startsWith("demo"); // solo demo ve seed

  // Congelamos el mes actual solo 1 vez (evita resets raros)
  const initialMonthRef = useRef(new Date().toISOString().slice(0, 7));

  // Mes seleccionado (persistente solo en frontend)
  const [monthKey, setMonthKey] = useState(() => {
    return localStorage.getItem("expenses_monthKey") || initialMonthRef.current;
  });

  // En Free: forzar mes actual (congelado)
  useEffect(() => {
    if (!isPro) setMonthKey(initialMonthRef.current);
  }, [isPro]);

  // Persistir mes seleccionado (solo Pro realmente lo usa)
  useEffect(() => {
    try {
      localStorage.setItem("expenses_monthKey", monthKey);
    } catch {
      // ignore
    }
  }, [monthKey]);

  const { month: selectedMonth, year: selectedYear } = useMemo(
    () => parseMonthKeySafe(monthKey),
    [monthKey]
  );

  // form (add)
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(""); // string
  const [category, setCategory] = useState("General");

  // ✅ fecha opcional:
  // - si la dejás vacía => usa el mes seleccionado (monthKey-01)
  // - si ponés una fecha => NO se borra al agregar (así cargás varios seguidos)
  const [date, setDate] = useState(""); // "YYYY-MM-DD"
  const lastDateRef = useRef(""); // recuerda la última fecha usada (por UX)

  // list
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // ui filters
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // UX states
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(""); // "add" | "delete" | "seed" | "bulk" | "edit" | ""
  const [toast, setToast] = useState(null); // { type: "success"|"error", text: string }
  const toastTimerRef = useRef(null);

  // selección
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("General");

  const showToast = (type, text) => {
    setToast({ type, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  /* =========================
     API
  ========================= */

  const loadExpenses = async () => {
    setError("");
    setLoading(true);

    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest("/expenses", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.message || "Error cargando gastos";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    if (!token) {
      showToast("error", "No hay token. Volvé a iniciar sesión.");
      setBusyAction("");
      return;
    }

    // ✅ Fecha final:
    // 1) si escribiste/seleccionaste una fecha => usar esa
    // 2) si no, pero ya venías cargando con una fecha => usar la última
    // 3) si no, usar el primer día del mes seleccionado (monthKey-01)
    const fallbackDate = `${monthKey}-01`;
    const finalDate = date || lastDateRef.current || fallbackDate;

    try {
      await apiRequest("/expenses", {
        method: "POST",
        token,
        body: { title: t, amount: a, category, date: finalDate },
      });

      // Limpio campos rápidos
      setTitle("");
      setAmount("");
      setCategory("General");

      // ✅ NO limpiamos "date" para que puedas cargar varios gastos seguidos
      // Si el usuario puso fecha, la recordamos
      if (date) lastDateRef.current = date;

      showToast("success", "Gasto agregado ✅");
      await loadExpenses();
    } catch (err) {
      const msg = err?.message || "Error agregando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  const deleteExpense = async (id) => {
    setError("");
    setBusyAction("delete");

    if (!token) {
      showToast("error", "No hay token. Volvé a iniciar sesión.");
      setBusyAction("");
      return;
    }

    try {
      await apiRequest(`/expenses/${id}`, { method: "DELETE", token });
      showToast("success", "Gasto eliminado ✅");
      await loadExpenses();

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      const msg = err?.message || "Error eliminando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setError("");
    setBusyAction("bulk");

    if (!token) {
      showToast("error", "No hay token. Volvé a iniciar sesión.");
      setBusyAction("");
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      await apiRequest("/expenses/bulk", {
        method: "DELETE",
        token,
        body: { ids },
      });

      showToast("success", "Gastos eliminados ✅");
      setSelectedIds(new Set());
      await loadExpenses();
    } catch (err) {
      const msg = err?.message || "Error eliminando seleccionados";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  const seedDemo = async () => {
    if (!isDemoUser) return;

    setError("");
    setBusyAction("seed");

    if (!token) {
      showToast("error", "No hay token. Volvé a iniciar sesión.");
      setBusyAction("");
      return;
    }

    try {
      const res = await apiRequest("/demo/seed", { method: "POST", token });
      showToast("success", res?.message || "Datos demo cargados ✅");
      await loadExpenses();
    } catch (err) {
      const msg = err?.message || "Error creando datos demo";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  // abrir modal editar
  const openEdit = (expense) => {
    setEditId(expense._id);
    setEditTitle(expense.title || "");
    setEditAmount(String(expense.amount ?? "")); // string
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

  // guardar edición
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
    if (!token) {
      showToast("error", "No hay token. Volvé a iniciar sesión.");
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
      await loadExpenses();
      closeEdit();
    } catch (err) {
      const msg = err?.message || "Error actualizando gasto";
      setError(msg);
      showToast("error", msg);
    } finally {
      setBusyAction("");
    }
  };

  /* =========================
     helpers ui
  ========================= */

  const monthFiltered = useMemo(() => {
    if (!isPro) return items;

    return items.filter((x) => {
      const d = new Date(x.date || x.createdAt || x.updatedAt || Date.now());
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [items, isPro, selectedMonth, selectedYear]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let arr = monthFiltered;

    if (filterCategory !== "Todas") {
      arr = arr.filter((x) => x.category === filterCategory);
    }

    if (q) {
      arr = arr.filter((x) => {
        const t = String(x.title || "").toLowerCase();
        const c = String(x.category || "").toLowerCase();
        return t.includes(q) || c.includes(q);
      });
    }

    const copy = [...arr];

    copy.sort((a, b) => {
      const da = new Date(a.date || a.createdAt || 0).getTime();
      const db = new Date(b.date || b.createdAt || 0).getTime();

      if (sortBy === "date_desc") return db - da;
      if (sortBy === "date_asc") return da - db;
      if (sortBy === "amount_desc") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === "amount_asc") return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });

    return copy;
  }, [monthFiltered, filterCategory, search, sortBy]);

  const totalMonth = useMemo(() => {
    return filtered.reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
  }, [filtered]);

  const totalsByCategory = useMemo(() => {
    const map = new Map();
    for (const x of filtered) {
      const cat = x.category || "General";
      const prev = map.get(cat) || 0;
      map.set(cat, prev + (Number(x.amount) || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency }).format(v || 0);

  // Excel (solo pro)
  const exportExcel = () => {
    if (!isPro) {
      showToast("error", "Disponible solo en Pro");
      return;
    }

    const rows = filtered.map((x) => ({
      Fecha: new Date(x.date || x.createdAt || Date.now()).toLocaleDateString("es-UY"),
      Titulo: x.title || "",
      Categoria: x.category || "General",
      Monto: Number(x.amount) || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gastos");

    const fileName = `gastos_${monthKey}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // WhatsApp (solo pro)
  const shareWhatsApp = () => {
    if (!isPro) {
      showToast("error", "Disponible solo en Pro");
      return;
    }

    const top = totalsByCategory
      .slice(0, 5)
      .map(([c, v]) => `- ${c}: ${formatMoney(v)}`)
      .join("\n");

    const text =
      `Resumen de gastos (${formatMonthLabel(monthKey)})\n` +
      `Total: ${formatMoney(totalMonth)}\n\n` +
      (top ? `Top categorías:\n${top}` : "Sin gastos en este período.");

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    for (const x of filtered) if (!selectedIds.has(x._id)) return false;
    return true;
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

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[9999] pointer-events-none rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Gastos</h1>
            <p className="mt-1 text-white/80">Agregá, filtrá, editá y eliminá tus gastos.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="text-xs text-white/70">Total del mes</div>
              <div className="text-lg font-extrabold">{formatMoney(totalMonth)}</div>
            </div>

            {isPro ? (
              <label className="rounded-2xl bg-white/10 px-4 py-3">
                <span className="block text-xs text-white/70">Mes</span>
                <input
                  type="month"
                  className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50"
                  value={monthKey}
                  onChange={(e) => setMonthKey(e.target.value)}
                />
              </label>
            ) : (
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-xs text-white/70">Mes</div>
                <div className="text-sm font-semibold">{formatMonthLabel(monthKey)}</div>
                <div className="mt-1 text-xs text-white/60">(Free: solo mes actual)</div>
              </div>
            )}
          </div>
        </div>

        {/* Botones (se ven siempre, solo habilitados en Pro) */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={exportExcel}
            disabled={!isPro}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            title={!isPro ? "Disponible solo en Pro" : "Exportar lo que estás viendo (filtros incluidos)"}
          >
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            disabled={!isPro}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            title={!isPro ? "Disponible solo en Pro" : "Compartir resumen por WhatsApp"}
          >
            Compartir WhatsApp
          </button>

          {!isPro && <div className="text-xs text-white/70 sm:ml-2">Disponible en Pro</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm md:grid-cols-3">
        {/* Nuevo gasto */}
        <div className="md:col-span-1">
          <div className="text-sm font-semibold text-white">Nuevo gasto</div>

          <form onSubmit={addExpense} className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
            />

            {/* ✅ Fecha opcional + atajos */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDate(todayISO())}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                title="Usar la fecha de hoy"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => setDate("")}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                title="Sin fecha: usa el mes seleccionado"
              >
                Sin fecha
              </button>
            </div>

            {/* ✅ Monto: NO deja letras (solo números + coma/punto) */}
            <input
              value={amount}
              onChange={(e) => {
                const raw = e.target.value;

                // permitir solo dígitos, coma y punto
                let cleaned = raw.replace(/[^\d.,]/g, "");

                // permitir solo un separador decimal
                const firstSepIndex = cleaned.search(/[.,]/);
                if (firstSepIndex !== -1) {
                  const intPart = cleaned.slice(0, firstSepIndex);
                  const sep = cleaned[firstSepIndex];
                  const decPart = cleaned.slice(firstSepIndex + 1).replace(/[.,]/g, "");

                  // máximo 2 decimales
                  cleaned = intPart + sep + decPart.slice(0, 2);
                }

                setAmount(cleaned);
              }}
              placeholder="Monto (ej: 1200.50)"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
              inputMode="decimal"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-indigo-400/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="text-slate-900">
                  {c}
                </option>
              ))}
            </select>

            <button
              disabled={busyAction === "add"}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
            >
              {busyAction === "add" ? "Agregando..." : "Agregar"}
            </button>

            {isDemoUser && (
              <button
                type="button"
                onClick={seedDemo}
                disabled={busyAction === "seed"}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
              >
                {busyAction === "seed" ? "Cargando..." : "Cargar demo"}
              </button>
            )}
          </form>

          {error && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-white">Tus gastos</div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40 sm:w-56"
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-indigo-400/40 sm:w-44"
              >
                <option value="Todas" className="text-slate-900">
                  Todas
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-slate-900">
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none focus:border-indigo-400/40 sm:w-44"
              >
                <option value="date_desc" className="text-slate-900">
                  Fecha ↓
                </option>
                <option value="date_asc" className="text-slate-900">
                  Fecha ↑
                </option>
                <option value="amount_desc" className="text-slate-900">
                  Monto ↓
                </option>
                <option value="amount_asc" className="text-slate-900">
                  Monto ↑
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 text-sm text-slate-200/90">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleAllFiltered}
                className="h-4 w-4 rounded border-white/20 bg-slate-950/40"
              />
              Seleccionar todos los filtrados
            </label>

            <button
              onClick={deleteSelected}
              disabled={busyAction === "bulk" || selectedIds.size === 0}
              className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {busyAction === "bulk"
                ? "Eliminando..."
                : `Eliminar seleccionados (${selectedIds.size})`}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/80">
                Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/80">
                No hay gastos para mostrar.
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((x) => {
                  const checked = selectedIds.has(x._id);
                  const dateLabel = new Date(
                    x.date || x.createdAt || Date.now()
                  ).toLocaleDateString("es-UY");

                  return (
                    <li
                      key={x._id}
                      className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white p-4 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(x._id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />

                        <div>
                          <div className="font-extrabold">{x.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                              {x.category || "General"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                              {dateLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                        <div className="font-extrabold text-slate-900">
                          {formatMoney(Number(x.amount) || 0)}
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(x)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deleteExpense(x._id)}
                            disabled={busyAction === "delete"}
                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                          >
                            {busyAction === "delete" ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal editar */}
      {editOpen && (
        <EditExpenseModal
          open={editOpen}
          onClose={closeEdit}
          onSave={saveEdit}
          busy={busyAction === "edit"}
          title={editTitle}
          setTitle={setEditTitle}
          amount={editAmount}
          setAmount={setEditAmount}
          category={editCategory}
          setCategory={setEditCategory}
          categories={CATEGORIES}
        />
      )}
    </div>
  );
}

export default Expenses;
