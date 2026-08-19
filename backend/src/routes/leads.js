const express = require("express");
const prisma = require("../db");
const { requireAdmin } = require("../adminAuth");

const router = express.Router();
const PAGE_SIZE = 50;

router.use(requireAdmin);

// Empresas sem site cadastrado, pra prospecção de propostas.
router.get("/", async (req, res, next) => {
  try {
    const { category, city, q, contacted } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const where = {
      OR: [{ website: null }, { website: "" }],
    };
    if (category) where.category = { slug: category };
    if (city) where.city = { equals: city, mode: "insensitive" };
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (contacted === "true") where.contacted = true;
    if (contacted === "false") where.contacted = false;

    const [results, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: { category: true },
        orderBy: [{ contacted: "asc" }, { name: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.business.count({ where }),
    ]);

    res.json({
      results,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const data = {};
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "contacted")) {
      data.contacted = Boolean(req.body.contacted);
      data.contactedAt = data.contacted ? new Date() : null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "notes")) {
      data.notes = req.body.notes;
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
