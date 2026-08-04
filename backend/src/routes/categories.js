const express = require("express");
const prisma = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
