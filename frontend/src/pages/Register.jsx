import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length > 3 && password.length >= 4 && !busy;
  }, [name, email, password, busy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const n = name.trim();
    const em = email.trim().toLowerCase();

    if (!n || !em || !password) {
      setError("Completá nombre, email y contraseña.");
      return;
    }

    setBusy(true);
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: { name: n, email: em, password },
      });

      // Si el backend responde token+user, logueamos directo.
      if (data?.token && data?.user) {
        login(data.token, data.user);
        navigate("/");
        return;
      }

      // Si el backend responde solo ok/message, mandamos al login.
      navigate("/login");
    } catch (err) {
      setError(err.message || "Error registrando usuario");
    } finally {
      setBusy(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Ya estás logueado
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Podés ir al dashboard.
          </p>

          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Registrate para empezar a usar el control de gastos y presupuesto.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="tuemail@gmail.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Mínimo 4 caracteres"
              autoComplete="new-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className={cx(
              "w-full rounded-xl px-4 py-2 text-sm font-semibold text-white transition",
              canSubmit ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-400"
            )}
          >
            {busy ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
