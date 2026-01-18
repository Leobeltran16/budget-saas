import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar({ variant = "sidebar" }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { to: "/", label: "Home", auth: "any" },
      { to: "/expenses", label: "Gastos", auth: "private" },
      { to: "/budget", label: "Presupuesto", auth: "private" },
      { to: "/profile", label: "Perfil", auth: "private" },
    ],
    []
  );

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const linkBase =
    "block rounded-xl px-3 py-2 text-sm font-medium border transition";
  const linkInactive =
    "text-slate-200/80 border-white/0 hover:bg-white/5 hover:border-white/10";
  const linkActive =
    "text-slate-100 bg-indigo-500/15 border-indigo-400/30";

  const renderLinks = () =>
    navItems
      .filter((i) => i.auth === "any" || (i.auth === "private" && isAuthenticated))
      .map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          {item.label}
        </NavLink>
      ));

  const UserCard = () => (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">Usuario</div>
      <div className="mt-1 text-xs text-slate-200/70">{user?.email || ""}</div>
      <div className="mt-1 text-xs text-slate-200/70">Role: {user?.role || "user"}</div>

      <button
        onClick={handleLogout}
        className="mt-4 w-full rounded-xl bg-red-500/90 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-red-500"
      >
        Cerrar sesión
      </button>
    </div>
  );

  // MOBILE TOPBAR
  if (variant === "topbar") {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            BudgetSaaS
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>

        {open && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2">{renderLinks()}</div>

            <div className="my-3 h-px bg-white/10" />

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-indigo-500/90 px-3 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-indigo-500"
                >
                  Register
                </Link>
              </div>
            ) : (
              <UserCard />
            )}
          </div>
        )}
      </div>
    );
  }

  // DESKTOP SIDEBAR
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <Link to="/" className="text-lg font-extrabold tracking-tight">
          BudgetSaaS
        </Link>
        <div className="mt-1 text-xs text-slate-200/70">Gastos & Presupuesto</div>
      </div>

      <nav className="grid gap-2">{renderLinks()}</nav>

      <div className="flex-1" />

      {!isAuthenticated ? (
        <div className="grid gap-2">
          <Link
            to="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-indigo-500/90 px-3 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-indigo-500"
          >
            Register
          </Link>
        </div>
      ) : (
        <UserCard />
      )}
    </div>
  );
}
