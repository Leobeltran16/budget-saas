import { createContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

export const AuthContext = createContext(null);

const LS_TOKEN = "token";
const LS_USER = "user";

// ✅ alineado con backend (evita 400)
const SUPPORTED_CURRENCIES = [
  "USD",
  "UYU",
  "ARS",
  "BRL",
  "CLP",
  "COP",
  "MXN",
  "PEN",
  "EUR",
];

function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;

  const name =
    (typeof u.name === "string" && u.name.trim()) ||
    (typeof u.nombre === "string" && u.nombre.trim()) ||
    "";

  const email = typeof u.email === "string" ? u.email : "";
  const role = typeof u.role === "string" ? u.role : "user";
  const plan = typeof u.plan === "string" ? u.plan : "free";

  // ✅ moneda preferida (persistente) — normalizada
  const currencyRaw = typeof u.currency === "string" ? u.currency : "USD";
  const currencyNorm = String(currencyRaw || "USD").toUpperCase().trim();
  const currency = SUPPORTED_CURRENCIES.includes(currencyNorm)
    ? currencyNorm
    : "USD";

  // ✅ locale preferido (opcional)
  const currencyLocaleRaw =
    typeof u.currencyLocale === "string" ? u.currencyLocale : "es-UY";
  const currencyLocale = String(currencyLocaleRaw || "es-UY").trim() || "es-UY";

  return { ...u, name, email, role, plan, currency, currencyLocale };
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

  const persistUser = (u) => {
    const nu = normalizeUser(u);
    setUser(nu);

    try {
      localStorage.setItem(LS_USER, JSON.stringify(nu));
    } catch {
      // ignore
    }

    return nu;
  };

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

    persistUser(newUser);

    // 🔥 Evita "plan pegado" / user incompleto
    await refreshMe(t);
  };

  // ✅ actualizar moneda (frontend + backend)
  // Backend esperado: PATCH /auth/me  body: { currency, currencyLocale? }
  const updateCurrency = async (currency, currencyLocale) => {
    const cur = String(currency || "").toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(cur)) {
      throw new Error("Moneda inválida");
    }
    if (!token) throw new Error("No autenticado");

    const prev = user?.currency || "USD";
    const prevLocale = user?.currencyLocale || "es-UY";

    // Optimista: se ve instantáneo
    persistUser({
      ...(user || {}),
      currency: cur,
      ...(currencyLocale ? { currencyLocale } : {}),
    });

    try {
      const updated = await apiRequest("/auth/me", {
        method: "PATCH",
        token,
        body: { currency: cur, ...(currencyLocale ? { currencyLocale } : {}) },
      });

      if (updated && typeof updated === "object") {
        persistUser({ ...(user || {}), ...(updated || {}), currency: cur });
      } else {
        await refreshMe(token);
      }

      return cur;
    } catch (err) {
      // rollback
      persistUser({ ...(user || {}), currency: prev, currencyLocale: prevLocale });
      throw err;
    }
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
      updateCurrency,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    }),
    [token, user, isAuthenticated, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
