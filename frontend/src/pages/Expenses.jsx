import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Budget from "./Budget";

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

function Expenses() {
  const { token } = useContext(AuthContext);

  // form
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
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

  const loadExpenses = async () => {
    setError("");
    try {
      const data = await apiRequest("/expenses", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error cargando gastos");
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiRequest("/expenses", {
        method: "POST",
        token,
        body: { title, amount: Number(amount), category },
      });

      setTitle("");
      setAmount("");
      setCategory("General");
      await loadExpenses();
    } catch (err) {
      setError(err.message || "Error creando gasto");
    }
  };

  const deleteExpense = async (id) => {
    setError("");
    const ok = confirm("¿Seguro que querés eliminar este gasto?");
    if (!ok) return;

    try {
      await apiRequest(`/expenses/${id}`, { method: "DELETE", token });
      await loadExpenses();
    } catch (err) {
      setError(err.message || "Error eliminando gasto");
    }
  };

  const formatMoney = (n) =>
    new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      maximumFractionDigits: 0,
    }).format(n);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let arr = items;

    if (filterCategory !== "Todas") {
      arr = arr.filter((x) => (x.category || "General") === filterCategory);
    }

    if (q) {
      arr = arr.filter((x) => (x.title || "").toLowerCase().includes(q));
    }

    arr = [...arr].sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount_desc") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === "amount_asc") return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });

    return arr;
  }, [items, filterCategory, search, sortBy]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthItems = useMemo(() => {
    return items.filter((x) => {
      const d = new Date(x.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [items, currentMonth, currentYear]);

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

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Gastos</h1>
        <p className="mt-1 text-sm text-slate-200/70">
          Gestión de gastos y presupuesto mensual.
        </p>
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

      {/* Top cards: Budget + Summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Budget monthItems={monthItems} onStatusChange={setBudgetStatus} />

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
        <div className="grid gap-3 md:grid-cols-4">
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

        <button
          onClick={loadExpenses}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
        >
          Refrescar
        </button>
      </div>

      {/* Form */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Agregar gasto</h3>

        <form onSubmit={addExpense} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="md:col-span-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Título (Ej: Supermercado)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
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

          {error && (
            <p className="md:col-span-4 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="md:col-span-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Agregar gasto
          </button>
        </form>
      </div>

      {/* List */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Mis gastos</h3>

        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No hay gastos con ese filtro/búsqueda.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {filtered.map((x) => (
              <li
                key={x._id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{x.title}</p>
                  <p className="mt-1 text-slate-600">
                    {x.category || "General"} · {new Date(x.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatMoney(Number(x.amount) || 0)}
                  </span>

                  <button
                    onClick={() => deleteExpense(x._id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Expenses;
