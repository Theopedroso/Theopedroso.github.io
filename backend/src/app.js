const express = require("express");
const cors = require("cors");

const categoriesRouter = require("./routes/categories");
const businessesRouter = require("./routes/businesses");
const authRouter = require("./routes/auth");
const leadsRouter = require("./routes/leads");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categories", categoriesRouter);
app.use("/api/businesses", businessesRouter);
app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

module.exports = app;
