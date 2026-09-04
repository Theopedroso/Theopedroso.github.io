# Bot de Finanças no WhatsApp (gratuito)

Um bot pessoal de WhatsApp para controlar salário, gastos, metas de economia e
contas a pagar por mensagem de texto — no estilo do "Pierre Finanças", mas
100% gratuito e rodando na sua própria máquina.

Não usa a API oficial da Meta (que é paga e exige aprovação de negócio).
Em vez disso usa o [Baileys](https://github.com/WhiskeySockets/Baileys), uma
biblioteca open source que conecta como o WhatsApp Web — você escaneia um QR
code uma vez, igual abrir o WhatsApp Web no navegador. Os dados ficam salvos
localmente num banco SQLite (`data/financas.db`), sem depender de nenhum
serviço externo pago.

## Como rodar

```bash
cd whatsapp-financas-bot
npm install
npm start
```

Um QR code vai aparecer no terminal. Abra o WhatsApp no celular → **Aparelhos
conectados** → **Conectar um aparelho** → escaneie o QR code. Pronto, o bot
já está ativo.

> Importante: como é baseado no WhatsApp Web, o processo (`npm start`)
> precisa continuar rodando o tempo todo pro bot funcionar — se ele for
> encerrado, o bot para de responder até você rodar `npm start` de novo. Pra
> deixar rodando 24h, use um servidor/computador que fique sempre ligado (ex:
> uma VPS barata, um Raspberry Pi, ou mesmo o seu PC com um gerenciador de
> processo como [pm2](https://pm2.keymetrics.io/): `npx pm2 start src/index.js --name financas-bot`).
> Hospedagens "grátis" que hibernam por inatividade (como o free tier do
> Render) derrubam a conexão do WhatsApp e não são recomendadas aqui.

A sessão fica salva em `data/auth/` — não é preciso escanear o QR code de
novo a cada reinício, só se você deslogar o aparelho pelo próprio WhatsApp.

## Comandos

Mande estas mensagens no chat com o número conectado (pode ser numa conversa
com você mesmo, no "Mensagem para você mesmo" do WhatsApp):

### Entradas
- `salario 3000` — registra seu salário do mês
- `receita 200 freela` — registra outra receita

### Gastos
- `gasto 50 mercado compras da semana` — valor, categoria e descrição opcional
- `-50 mercado` — atalho rápido pro mesmo comando
- `+200 freela` — atalho rápido pra registrar receita

### Consultas
- `resumo` — saldo do mês atual (receitas − despesas)
- `resumo 08/2026` — saldo de um mês específico
- `categorias` — gastos do mês por categoria, com barra de progresso
- `extrato` — últimas 10 transações (aceita `extrato 20` etc.)
- `apagar 12` — apaga a transação de id 12 (o id aparece no extrato)

### Metas de economia
- `meta viagem 2000` — cria/atualiza a meta "viagem" com alvo de R$ 2000
- `guardar viagem 100` — soma R$ 100 guardados na meta
- `metas` — mostra o progresso de todas as metas

### Contas fixas / lembretes
- `conta luz 150 10` — cadastra a conta "luz", R$ 150, vence todo dia 10
- `contas` — status de todas as contas do mês (paga/pendente)
- `pago luz` — marca a conta "luz" como paga nesse mês

O bot manda lembrete automático (todo dia às 8h, horário de Brasília) 3 dias
antes do vencimento, 1 dia antes, no dia do vencimento e no dia seguinte se
ainda não tiver sido paga.

Digite `ajuda` a qualquer momento para ver o menu completo.

## Como funciona por baixo dos panos

- `src/db.js` — schema SQLite (better-sqlite3): usuários, transações, metas,
  contas e pagamentos.
- `src/parsing.js` — funções puras de parsing (valores em real, mês/ano).
- `src/commands.js` — interpreta o texto da mensagem e executa a lógica.
- `src/charts.js` — "gráficos" em texto/emoji (barras de progresso) para
  funcionar dentro do WhatsApp sem precisar gerar imagens.
- `src/reminders.js` — cron diário (`node-cron`) que varre as contas
  cadastradas e manda lembrete pra quem está perto do vencimento.
- `src/index.js` — conexão com o WhatsApp via Baileys e roteamento das
  mensagens recebidas para `commands.js`.

Cada número de WhatsApp que manda mensagem pro bot tem seus próprios dados
(identificados pelo JID), então em tese várias pessoas podem usar o mesmo
bot — mas o uso pensado aqui é pessoal, um número seu conversando com você
mesmo.

## Variáveis de ambiente (opcionais)

- `FINANCAS_DB_PATH` — caminho do banco SQLite (padrão: `data/financas.db`)
- `FINANCAS_AUTH_DIR` — pasta da sessão do WhatsApp (padrão: `data/auth`)
- `FINANCAS_REMINDER_CRON` — expressão cron dos lembretes (padrão: `0 8 * * *`)
- `FINANCAS_TZ` — fuso horário dos lembretes (padrão: `America/Sao_Paulo`)

## Limitações

- Baileys usa a API não-oficial do WhatsApp Web; é a mesma técnica usada por
  bots pessoais populares, mas o WhatsApp pode, em teoria, banir números que
  automatizam em grande volume. Para uso pessoal (uma pessoa conversando
  consigo mesma) o risco é baixo.
- Sem app de celular nem servidor pago: você é responsável por manter o
  processo rodando.
