// src/routes/RequireAdmin.jsx
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RequireAdmin() {
  const { isAuthenticated, user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Si tu AuthContext no tiene "loading", borrá estas 2 líneas y listo.
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = String(user?.role || "").toLowerCase();
  if (role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
