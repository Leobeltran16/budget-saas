import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import Layout from "../layout/Layout";
import PrivateRoute from "./PrivateRoute";

import Landing from "../pages/Landing";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Expenses from "../pages/Expenses";
import BudgetPage from "../pages/BudgetPage";
import Health from "../pages/Health";
import Plans from "../pages/Plans";

// ✅ páginas de retorno PayPal
import BillingSuccess from "../pages/BillingSuccess";
import BillingCancel from "../pages/BillingCancel";

// ✅ páginas legales
import Terms from "../pages/Terms";
import Privacy from "../pages/Privacy";
import Contact from "../pages/Contact";

function SmartFallback() {
  const { isAuthenticated } = useContext(AuthContext);
  return <Navigate to={isAuthenticated ? "/app" : "/"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        {/* ================= PUBLIC ================= */}
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* ✅ Páginas legales públicas */}
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="contact" element={<Contact />} />

        {/* ================= PRIVATE ================= */}
        <Route
          path="app"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="expenses"
          element={
            <PrivateRoute>
              <Expenses />
            </PrivateRoute>
          }
        />

        <Route
          path="budget"
          element={
            <PrivateRoute>
              <BudgetPage />
            </PrivateRoute>
          }
        />

        <Route
          path="plans"
          element={
            <PrivateRoute>
              <Plans />
            </PrivateRoute>
          }
        />

        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="health"
          element={
            <PrivateRoute>
              <Health />
            </PrivateRoute>
          }
        />

        {/* ================= BILLING ================= */}
        <Route
          path="billing/success"
          element={
            <PrivateRoute>
              <BillingSuccess />
            </PrivateRoute>
          }
        />

        <Route
          path="billing/cancel"
          element={
            <PrivateRoute>
              <BillingCancel />
            </PrivateRoute>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<SmartFallback />} />

      </Route>
    </Routes>
  );
}

export default AppRoutes;
