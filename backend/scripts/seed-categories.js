require("dotenv/config");
const prisma = require("../src/db");
const { CATEGORIES } = require("./cnae-map");

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { slug: category.slug, name: category.name },
    });
  }
  console.log(`Categorias sincronizadas: ${CATEGORIES.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
