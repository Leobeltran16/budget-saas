import { createContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

export const AuthContext = createContext(null);

const LS_TOKEN = "token";
const LS_USER = "user";

function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;

  const name =
    (typeof u.name === "string" && u.name.trim()) ||
    (typeof u.nombre === "string" && u.nombre.trim()) ||
    "";

  const email = typeof u.email === "string" ? u.email : "";
  const role = typeof u.role === "string" ? u.role : "user";
  const plan = typeof u.plan === "string" ? u.plan : "free";

  return { ...u, name, email, role, plan };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) || "");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER);
      return normalizeUser(raw ? JSON.parse(raw) : null);
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
  };

  const refreshMe = async (tkn = token) => {
    if (!tkn) return null;

    try {
      const me = await apiRequest("/auth/me", { token: tkn });
      const nu = normalizeUser(me);

      if (nu) {
        setUser(nu);
        try {
          localStorage.setItem(LS_USER, JSON.stringify(nu));
        } catch {
          // ignore
        }
      }

      return nu;
    } catch (err) {
      const status = err?.status;

      // ✅ desloguear solo si el token realmente es inválido
      if (status === 401 || status === 403) {
        logout();
        return null;
      }

      // ✅ si fue red/timeout/back caído -> no desloguear
      console.warn("refreshMe falló (no logout):", err?.message || err);
      return null;
    }
  };

  // ✅ Login PRO: setea token/user y SIEMPRE refresca desde /auth/me
  const login = async (newToken, newUser) => {
    const t = String(newToken || "");
    setToken(t);
    localStorage.setItem(LS_TOKEN, t);

    const nu = normalizeUser(newUser);
    setUser(nu);
    try {
      localStorage.setItem(LS_USER, JSON.stringify(nu));
    } catch {
      // ignore
    }

    // 🔥 Evita "plan pegado" / user incompleto
    await refreshMe(t);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (token) await refreshMe(token);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      authLoading,
      login,
      logout,
      refreshMe,
    }),
    [token, user, isAuthenticated, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
