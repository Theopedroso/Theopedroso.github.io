if (!process.env.ADMIN_API_KEY) {
  throw new Error("ADMIN_API_KEY não configurado (defina em backend/.env)");
}
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

module.exports = { requireAdmin };
