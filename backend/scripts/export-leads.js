// Exporta pra CSV as empresas sem site cadastrado, pra prospecção de propostas.
// Uso: LEADS_CATEGORY=restaurantes LEADS_CITY=TATUI LEADS_OUT=leads.csv npm run leads

require("dotenv/config");
const fs = require("fs");
const prisma = require("../src/db");

const CATEGORY = process.env.LEADS_CATEGORY || null;
const CITY = process.env.LEADS_CITY || null;
const OUT = process.env.LEADS_OUT || "leads.csv";

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const where = { OR: [{ website: null }, { website: "" }] };
  if (CATEGORY) where.category = { slug: CATEGORY };
  if (CITY) where.city = { equals: CITY.toUpperCase(), mode: "insensitive" };

  const businesses = await prisma.business.findMany({
    where,
    include: { category: true },
    orderBy: [{ contacted: "asc" }, { name: "asc" }],
  });

  const header = ["nome", "categoria", "telefone", "endereco", "bairro", "cidade", "contatado", "cnpj"];
  const lines = [header.join(",")];
  for (const b of businesses) {
    lines.push(
      [b.name, b.category.name, b.phone, b.address, b.neighborhood, b.city, b.contacted ? "sim" : "não", b.cnpj]
        .map(csvEscape)
        .join(",")
    );
  }

  fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log(`Exportado ${businesses.length} lead(s) sem site para ${OUT}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
