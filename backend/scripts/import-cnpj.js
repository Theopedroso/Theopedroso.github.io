// Importa estabelecimentos ativos de uma cidade a partir dos Dados Abertos de
// CNPJ da Receita Federal (https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/).
//
// Os arquivos são grandes demais (vários GB, todo o Brasil) pra baixar e
// processar automaticamente aqui: baixe e descompacte manualmente os arquivos
// "Estabelecimentos*.zip", "Empresas*.zip" e "Municipios.zip" de um mês
// recente, deixando os .csv extraídos numa pasta, e aponte CNPJ_DATA_DIR pra
// ela. Veja o README pra passo a passo.
//
// O script faz duas passadas em streaming (não carrega os arquivos inteiros
// em memória):
//   1) Estabelecimentos*.csv -> filtra por UF + nome do município (via
//      Municipios.csv) + CNAE de interesse + situação cadastral ATIVA.
//   2) Empresas*.csv -> só pra descobrir a razão social dos CNPJs que
//      passaram no filtro acima (usada quando não há nome fantasia).

require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const prisma = require("../src/db");
const { CNAE_TO_CATEGORY } = require("./cnae-map");

const DATA_DIR = process.env.CNPJ_DATA_DIR || path.join(__dirname, "..", "data", "cnpj");
const TARGET_UF = (process.env.CNPJ_UF || "SP").toUpperCase();
const TARGET_MUNICIPIO_NOME = (process.env.CNPJ_MUNICIPIO || "TATUI").toUpperCase();
const ACTIVE_SITUACAO_CADASTRAL = "02"; // 02 = ATIVA na tabela de domínio da Receita

function filesStartingWith(prefix) {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(
      `Pasta de dados não encontrada: ${DATA_DIR}. Baixe e extraia os arquivos da Receita Federal primeiro (veja o README).`
    );
  }
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith(prefix) && f.toLowerCase().endsWith(".csv"))
    .map((f) => path.join(DATA_DIR, f));
}

function streamCsv(filePath, onRow) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath, { encoding: "latin1" })
      .pipe(
        parse({
          delimiter: ";",
          quote: '"',
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on("data", onRow)
      .on("end", resolve)
      .on("error", reject);
  });
}

function loadMunicipioCodes() {
  const [municipiosFile] = filesStartingWith("Municipios");
  if (!municipiosFile) {
    throw new Error("Arquivo Municipios*.csv não encontrado em " + DATA_DIR);
  }
  const codes = new Set();
  return new Promise((resolve, reject) => {
    fs.createReadStream(municipiosFile, { encoding: "latin1" })
      .pipe(
        parse({
          delimiter: ";",
          quote: '"',
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on("data", (row) => {
        const [codigo, nome] = row;
        if (nome && nome.toUpperCase() === TARGET_MUNICIPIO_NOME) {
          codes.add(codigo);
        }
      })
      .on("end", () => resolve(codes))
      .on("error", reject);
  });
}

async function main() {
  console.log(`Importando estabelecimentos ativos de ${TARGET_MUNICIPIO_NOME}/${TARGET_UF}...`);

  const municipioCodes = await loadMunicipioCodes();
  if (municipioCodes.size === 0) {
    throw new Error(
      `Nenhum código de município encontrado para "${TARGET_MUNICIPIO_NOME}". Confira o nome em Municipios.csv.`
    );
  }

  // Passada 1: Estabelecimentos -> registros filtrados, indexados por CNPJ básico.
  const matches = new Map(); // cnpjBasico -> { cnpj, nomeFantasia, categorySlug, address... }
  const estabelecimentoFiles = filesStartingWith("Estabelecimentos");
  if (estabelecimentoFiles.length === 0) {
    throw new Error("Nenhum arquivo Estabelecimentos*.csv encontrado em " + DATA_DIR);
  }

  for (const file of estabelecimentoFiles) {
    console.log(`Lendo ${path.basename(file)}...`);
    await streamCsv(file, (row) => {
      const [
        cnpjBasico,
        cnpjOrdem,
        cnpjDv,
        ,
        nomeFantasia,
        situacaoCadastral,
        ,
        ,
        ,
        ,
        ,
        cnaeFiscalPrincipal,
        ,
        tipoLogradouro,
        logradouro,
        numero,
        ,
        bairro,
        cep,
        uf,
        municipio,
        ddd1,
        telefone1,
      ] = row;

      if (situacaoCadastral !== ACTIVE_SITUACAO_CADASTRAL) return;
      if (uf !== TARGET_UF) return;
      if (!municipioCodes.has(municipio)) return;

      const categorySlug = CNAE_TO_CATEGORY[cnaeFiscalPrincipal];
      if (!categorySlug) return;

      const cnpj = `${cnpjBasico}${cnpjOrdem}${cnpjDv}`;
      const address = [tipoLogradouro, logradouro, numero].filter(Boolean).join(" ").trim();
      const phone = ddd1 && telefone1 ? `(${ddd1}) ${telefone1}` : null;

      matches.set(cnpjBasico, {
        cnpj,
        nomeFantasia: nomeFantasia && nomeFantasia.trim() ? nomeFantasia.trim() : null,
        razaoSocial: null,
        categorySlug,
        address: address || null,
        neighborhood: bairro || null,
        cep: cep || null,
        phone,
      });
    });
  }

  console.log(`Estabelecimentos encontrados nas categorias configuradas: ${matches.size}`);
  if (matches.size === 0) {
    console.log("Nada a importar. Encerrando.");
    return;
  }

  // Passada 2: Empresas -> completa a razão social pra quem não tem nome fantasia.
  const empresaFiles = filesStartingWith("Empresas");
  for (const file of empresaFiles) {
    console.log(`Lendo ${path.basename(file)}...`);
    await streamCsv(file, (row) => {
      const [cnpjBasico, razaoSocial] = row;
      const match = matches.get(cnpjBasico);
      if (match && !match.nomeFantasia) {
        match.razaoSocial = razaoSocial ? razaoSocial.trim() : null;
      }
    });
  }

  // Grava categorias e upserta os estabelecimentos.
  const categorySlugs = [...new Set([...matches.values()].map((m) => m.categorySlug))];
  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let processed = 0;
  for (const match of matches.values()) {
    const categoryId = categoryIdBySlug.get(match.categorySlug);
    if (!categoryId) {
      console.warn(`Categoria "${match.categorySlug}" não existe no banco. Rode "npm run seed" antes de importar.`);
      continue;
    }

    const name = match.nomeFantasia || match.razaoSocial || `Empresa ${match.cnpj}`;

    await prisma.business.upsert({
      where: { cnpj: match.cnpj },
      update: {
        name,
        categoryId,
        address: match.address,
        neighborhood: match.neighborhood,
        phone: match.phone,
      },
      create: {
        cnpj: match.cnpj,
        name,
        categoryId,
        address: match.address,
        neighborhood: match.neighborhood,
        city: TARGET_MUNICIPIO_NOME,
        state: TARGET_UF,
        phone: match.phone,
        source: "cnpj_rf",
      },
    });
    processed++;
  }

  console.log(`Importação concluída: ${processed} estabelecimentos processados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
