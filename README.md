# Theopedroso.github.io

Guia de empresas locais de Tatuí/SP: um diretório único e pesquisável de
restaurantes, bares, farmácias e outras empresas da região, para o cliente
achar rápido o que precisa.

## Como funciona

- **Frontend** (`index.html`, `css/`, `js/`): página estática servida pelo
  GitHub Pages, consome a API via `fetch`.
- **Backend** (`backend/`): API em Node.js/Express + PostgreSQL (via Prisma),
  hospedada separadamente (ex: Render ou Railway) — o GitHub Pages só serve
  arquivos estáticos.
- **Dados**: importados dos [Dados Abertos de CNPJ da Receita
  Federal](https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/),
  filtrados para empresas ativas de Tatuí/SP nas categorias configuradas em
  `backend/scripts/cnae-map.js`.

## Rodando localmente

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL para o seu Postgres local e defina JWT_SECRET
npx prisma migrate dev # cria as tabelas
npm run seed            # popula as categorias
npm run dev              # sobe a API em http://localhost:3001
```

### 2. Popular com dados reais (importação de CNPJ)

Os arquivos da Receita Federal cobrem o Brasil inteiro e somam vários GB, por
isso a importação é um passo manual:

1. Acesse
   `https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/` e
   entre na pasta do mês mais recente.
2. Baixe e descompacte os arquivos `Estabelecimentos*.zip`, `Empresas*.zip` e
   `Municipios.zip` numa pasta local (ex: `backend/data/cnpj`).
3. Rode a importação apontando para essa pasta:

```bash
cd backend
CNPJ_DATA_DIR=./data/cnpj CNPJ_MUNICIPIO=TATUI CNPJ_UF=SP npm run import
```

O script filtra por município (nome, via `Municipios.csv`), UF, situação
cadastral ATIVA e pelos CNAEs configurados em `scripts/cnae-map.js`, e faz
upsert das empresas encontradas (idempotente — pode rodar de novo pra
atualizar os dados). Para adicionar novas categorias, edite esse arquivo.

> Repita este passo periodicamente (a Receita atualiza a base mensalmente)
> pra manter o diretório em dia. Isso ainda não está automatizado.

### 3. Frontend

Sirva a raiz do repositório com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`. Por padrão `js/config.js` aponta para
`http://localhost:3001` (o backend local).

### 4. Área do lojista

`owner.html` permite que o dono de uma empresa crie conta, reivindique o
anúncio (busca por nome) e edite descrição, horário, telefone, site e
endereço do próprio anúncio. Fluxo:

- `POST /api/auth/signup` / `POST /api/auth/login` — retornam um JWT
- `POST /api/businesses/:id/claim` (autenticado) — reivindica um anúncio
  ainda não reivindicado
- `GET /api/businesses/mine` (autenticado) — lista os anúncios do dono
  logado
- `PATCH /api/businesses/:id` (autenticado, só o dono) — atualiza
  `description`, `hours`, `phone`, `website`, `address`, `neighborhood`

O campo `featured` (destaque pago) ainda não tem endpoint — hoje só é
ativável manualmente no banco. Fica pra quando entrar a integração de
pagamento.

## Deploy

- **Frontend**: já é publicado automaticamente pelo GitHub Pages a partir da
  raiz do repositório.
- **Backend**: deploy de `backend/` no Render ou Railway (Node + banco
  Postgres gerenciado). Configure a variável de ambiente `DATABASE_URL` no
  serviço, rode as migrações (`npx prisma migrate deploy`) e o seed.
- Depois do deploy, atualize `API_BASE_URL` em `js/config.js` para a URL
  pública da API e faça commit.

## Próximos passos (fora do escopo atual)

- Plano pago "destaque" (campo `featured` já existe no schema) + integração
  de pagamento (ex: Mercado Pago) — é o caminho de monetização
- Enriquecimento via Google Places API (fotos, avaliações, horário) para
  anúncios reivindicados
- Reimportação periódica automatizada (ex: GitHub Actions rodando
  `npm run import` mensalmente contra o banco de produção)
