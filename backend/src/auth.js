const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado (defina em backend/.env)");
}
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(owner) {
  return jwt.sign({ sub: owner.id, email: owner.email }, JWT_SECRET, { expiresIn: "7d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.ownerId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = { signToken, requireAuth };
