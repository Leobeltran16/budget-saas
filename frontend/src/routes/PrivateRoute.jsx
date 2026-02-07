import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  // Mientras reconstruimos sesión con /auth/me
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
