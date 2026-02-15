// backend/middleware/requireAdmin.js

module.exports = function requireAdmin(req, res, next) {
  try {
    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "admin") {
      return res.status(403).json({ message: "Acceso denegado (solo admin)" });
    }

    return next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(500).json({ message: "Error validando permisos" });
  }
};
