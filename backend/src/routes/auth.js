const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../db");
const { signToken } = require("../auth");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: "Informe email e senha (mínimo 8 caracteres)" });
    }

    const existing = await prisma.owner.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Já existe uma conta com esse email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const owner = await prisma.owner.create({ data: { email, passwordHash } });

    res.status(201).json({ token: signToken(owner), owner: { id: owner.id, email: owner.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Informe email e senha" });
    }

    const owner = await prisma.owner.findUnique({ where: { email } });
    if (!owner || !(await bcrypt.compare(password, owner.passwordHash))) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    res.json({ token: signToken(owner), owner: { id: owner.id, email: owner.email } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
