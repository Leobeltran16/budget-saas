import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const [open, setOpen] = useState(false);

  const isPro = useMemo(
    () => String(user?.plan || "").toLowerCase() === "pro",
    [user]
  );

  const displayName = useMemo(() => {
    const n = (user?.name || user?.nombre || "").trim();
    if (n) return n;
    const e = (user?.email || "").trim();
    if (!e) return "Usuario";
    return e.split("@")[0] || e;
  }, [user]);

  // cerrar menú al cambiar de ruta
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // bloquear scroll cuando menú móvil está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const NavItem = ({ to, children, onClick, end }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          "rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-200/80 hover:bg-white/5 hover:text-white"
        )
      }
      end={end}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* ✅ Brand: NavLink (misma pinta) */}
          <NavLink
            to={isAuthenticated ? "/app" : "/"}
            end={!isAuthenticated} // solo marca activo en "/" cuando es público
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-extrabold tracking-tight text-white hover:bg-white/10"
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
            Budget SaaS
          </NavLink>

          {isAuthenticated && (
            <span
              className={cx(
                "hidden items-center rounded-full border px-3 py-1 text-xs sm:inline-flex",
                isPro
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                  : "border-indigo-400/30 bg-indigo-500/10 text-indigo-100"
              )}
            >
              Plan:{" "}
              <span className="ml-1 font-semibold">{isPro ? "Pro" : "Free"}</span>
            </span>
          )}
        </div>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <NavItem to="/app" end>
              Dashboard
            </NavItem>
          ) : (
            <NavItem to="/" end>
              Inicio
            </NavItem>
          )}

          {isAuthenticated ? (
            <>
              <NavItem to="/expenses">Gastos</NavItem>
              <NavItem to="/budget">Presupuesto</NavItem>
              <NavItem to="/plans">Planes</NavItem>
              <NavItem to="/profile">Perfil</NavItem>

              <div className="ml-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs text-slate-200/80">Hola,</span>
                <span className="text-xs font-semibold text-white">{displayName}</span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login">Login</NavItem>
              <NavItem to="/register">Registro</NavItem>
            </>
          )}
        </nav>

        {/* Mobile button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-slate-950/70 backdrop-blur md:hidden"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1">
              {isAuthenticated ? (
                <NavItem to="/app" end>
                  Dashboard
                </NavItem>
              ) : (
                <NavItem to="/" end>
                  Inicio
                </NavItem>
              )}

              {isAuthenticated ? (
                <>
                  <NavItem to="/expenses">Gastos</NavItem>
                  <NavItem to="/budget">Presupuesto</NavItem>
                  <NavItem to="/plans">Planes</NavItem>
                  <NavItem to="/profile">Perfil</NavItem>

                  <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="text-slate-200/70">Cuenta</div>
                        <div className="font-semibold text-white">{displayName}</div>
                      </div>

                      <span
                        className={cx(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          isPro
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                            : "border-indigo-400/30 bg-indigo-500/10 text-indigo-100"
                        )}
                      >
                        {isPro ? "Pro" : "Free"}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="mt-3 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      Salir
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <NavItem to="/login">Login</NavItem>
                  <NavItem to="/register">Registro</NavItem>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
