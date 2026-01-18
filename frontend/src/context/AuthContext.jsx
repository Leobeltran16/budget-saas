import { createContext, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export const AuthContext = createContext(null);

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const login = ({ user, token }) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ✅ Al iniciar: si hay token, traer usuario real desde /auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = safeJsonParse(localStorage.getItem("user"));

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      setUser(storedUser);
    }

    if (!storedToken) {
      setLoadingAuth(false);
      return;
    }

    (async () => {
      try {
        const me = await apiRequest("/auth/me", { token: storedToken });
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch (err) {
        // token inválido -> limpiar sesión
        logout();
      } finally {
        setLoadingAuth(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loadingAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
