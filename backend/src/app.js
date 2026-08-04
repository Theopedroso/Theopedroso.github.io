const express = require("express");
const cors = require("cors");
const prisma = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PAGE_SIZE = 20;

app.get("/api/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

app.get("/api/businesses", async (req, res, next) => {
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

app.get("/api/businesses/:id", async (req, res, next) => {
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

module.exports = app;
