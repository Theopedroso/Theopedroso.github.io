// Mapeia categorias do diretório para códigos CNAE (Classificação Nacional de
// Atividades Econômicas) usados pela Receita Federal nos Dados Abertos de CNPJ.
// Os códigos no arquivo de estabelecimentos vêm sem pontuação (ex: "5611201").
// Para adicionar uma categoria nova, só é preciso adicionar uma entrada aqui.

const CATEGORIES = [
  {
    slug: "restaurantes",
    name: "Restaurantes",
    cnaes: ["5611201"],
  },
  {
    slug: "lanchonetes",
    name: "Lanchonetes e Casas de Suco",
    cnaes: ["5611202"],
  },
  {
    slug: "bares",
    name: "Bares",
    cnaes: ["5611203", "5611204", "5611205"],
  },
  {
    slug: "farmacias",
    name: "Farmácias",
    cnaes: ["4771701", "4771702", "4771703", "4771704"],
  },
  {
    slug: "mercados",
    name: "Mercados e Mercearias",
    cnaes: ["4711302", "4712100"],
  },
  {
    slug: "padarias",
    name: "Padarias e Confeitarias",
    cnaes: ["1091102"],
  },
  {
    slug: "saloes-de-beleza",
    name: "Salões de Beleza",
    cnaes: ["9602501"],
  },
  {
    slug: "academias",
    name: "Academias",
    cnaes: ["9313100"],
  },
];

// Índice reverso CNAE -> categoria, usado pelo script de importação.
const CNAE_TO_CATEGORY = {};
for (const category of CATEGORIES) {
  for (const cnae of category.cnaes) {
    CNAE_TO_CATEGORY[cnae] = category.slug;
  }
}

module.exports = { CATEGORIES, CNAE_TO_CATEGORY };
