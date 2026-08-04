const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
const PAGE_SIZE = 20;

const OWNER_EDITABLE_FIELDS = ["description", "hours", "website", "phone", "address", "neighborhood"];

router.get("/", async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const where = {};
    if (category) where.category = { slug: category };
    if (q) where.name = { contains: q, mode: "insensitive" };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: { category: true },
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.business.count({ where }),
    ]);

    res.json({
      results: businesses,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { ownerId: req.ownerId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    res.json(businesses);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const business = await prisma.business.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!business) return res.status(404).json({ error: "Empresa não encontrada" });

    res.json(business);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/claim", requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return res.status(404).json({ error: "Empresa não encontrada" });
    if (business.claimed) {
      return res.status(409).json({ error: "Essa empresa já foi reivindicada" });
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { claimed: true, ownerId: req.ownerId },
      include: { category: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return res.status(404).json({ error: "Empresa não encontrada" });
    if (business.ownerId !== req.ownerId) {
      return res.status(403).json({ error: "Você não é o dono desta empresa" });
    }

    const data = {};
    for (const field of OWNER_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        data[field] = req.body[field];
      }
    }

    const updated = await prisma.business.update({
      where: { id },
      data,
      include: { category: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
