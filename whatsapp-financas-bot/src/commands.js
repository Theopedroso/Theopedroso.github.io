const { db, ensureUser } = require('./db');
const { money, categoryBreakdown, goalProgress } = require('./charts');
const {
  normalizeCommand,
  parseAmount,
  parseMonthYear,
  currentMonthYear,
} = require('./parsing');

const HELP_TEXT = `🤖 *Bot de Finanças*

*Entradas*
• salario 3000 → registra seu salário
• receita 200 freela → outra receita

*Gastos*
• gasto 50 mercado compras da semana
• -50 mercado → atalho pro mesmo comando

*Consultas*
• resumo → saldo do mês atual
• resumo 08/2026 → saldo de um mês específico
• categorias → gastos por categoria (mês atual)
• extrato → últimas 10 transações
• apagar 12 → apaga a transação de id 12

*Metas*
• meta viagem 2000 → cria meta "viagem" de R$ 2000
• guardar viagem 100 → guarda R$ 100 na meta
• metas → progresso de todas as metas

*Contas fixas*
• conta luz 150 10 → conta "luz", R$150, vence dia 10
• contas → status das contas do mês
• pago luz → marca "luz" como paga esse mês

Digite *ajuda* a qualquer momento para ver este menu de novo.`;

function reply(text) {
  return { text };
}

function getMonthRange(month, year) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function cmdResumo(jid, argsStr) {
  const parsed = parseMonthYear(argsStr.trim());
  const { month, year } = parsed || currentMonthYear();
  const key = getMonthRange(month, year);

  const totals = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_jid = ? AND strftime('%Y-%m', created_at) = ?
       GROUP BY type`
    )
    .all(jid, key);

  const income = totals.find((t) => t.type === 'income')?.total || 0;
  const expense = totals.find((t) => t.type === 'expense')?.total || 0;
  const balance = income - expense;
  const emoji = balance >= 0 ? '✅' : '⚠️';

  return reply(
    `📅 *Resumo ${key}*\n\n` +
      `🟢 Receitas: ${money(income)}\n` +
      `🔴 Despesas: ${money(expense)}\n` +
      `${emoji} Saldo: ${money(balance)}`
  );
}

function cmdCategorias(jid, argsStr) {
  const parsed = parseMonthYear(argsStr.trim());
  const { month, year } = parsed || currentMonthYear();
  const key = getMonthRange(month, year);

  const rows = db
    .prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_jid = ? AND type = 'expense' AND strftime('%Y-%m', created_at) = ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(jid, key);

  return reply(`📅 Referente a ${key}\n\n${categoryBreakdown(rows)}`);
}

function cmdSalario(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/);
  const amount = parseAmount(parts[0]);
  if (!parts[0] || Number.isNaN(amount) || amount <= 0) {
    return reply('❌ Use: *salario 3000* (ou "salario 3000 mes de agosto")');
  }
  const description = parts.slice(1).join(' ') || null;
  db.prepare(
    `INSERT INTO transactions (user_jid, type, amount, category, description)
     VALUES (?, 'income', ?, 'salario', ?)`
  ).run(jid, amount, description);
  return reply(`✅ Salário de ${money(amount)} registrado!`);
}

function cmdReceita(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/);
  const amount = parseAmount(parts[0]);
  if (!parts[0] || Number.isNaN(amount) || amount <= 0) {
    return reply('❌ Use: *receita 200 freela*');
  }
  const description = parts.slice(1).join(' ') || null;
  db.prepare(
    `INSERT INTO transactions (user_jid, type, amount, category, description)
     VALUES (?, 'income', ?, 'outros', ?)`
  ).run(jid, amount, description);
  return reply(`✅ Receita de ${money(amount)} registrada!`);
}

function cmdGasto(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/).filter(Boolean);
  const amount = parseAmount(parts[0]);
  if (!parts[0] || Number.isNaN(amount) || amount <= 0) {
    return reply('❌ Use: *gasto 50 mercado compras da semana*');
  }
  const category = (parts[1] || 'outros').toLowerCase();
  const description = parts.slice(2).join(' ') || null;
  const info = db
    .prepare(
      `INSERT INTO transactions (user_jid, type, amount, category, description)
       VALUES (?, 'expense', ?, ?, ?)`
    )
    .run(jid, amount, category, description);
  return reply(
    `✅ Gasto de ${money(amount)} em *${category}* registrado! (id ${info.lastInsertRowid})`
  );
}

function cmdExtrato(jid, argsStr) {
  const n = Math.min(Math.max(parseInt(argsStr.trim(), 10) || 10, 1), 50);
  const rows = db
    .prepare(
      `SELECT id, type, amount, category, description, created_at
       FROM transactions
       WHERE user_jid = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .all(jid, n);

  if (rows.length === 0) return reply('Nenhuma transação registrada ainda.');

  const lines = rows.map((r) => {
    const sign = r.type === 'income' ? '🟢+' : '🔴-';
    const desc = r.description ? ` (${r.description})` : '';
    const date = r.created_at.slice(0, 10).split('-').reverse().join('/');
    return `#${r.id} ${date} ${sign}${money(r.amount)} — ${r.category}${desc}`;
  });

  return reply(`🧾 *Últimas ${rows.length} transações*\n\n${lines.join('\n')}`);
}

function cmdApagar(jid, argsStr) {
  const id = parseInt(argsStr.trim(), 10);
  if (!id) return reply('❌ Use: *apagar 12* (o número aparece no extrato)');
  const info = db
    .prepare(`DELETE FROM transactions WHERE id = ? AND user_jid = ?`)
    .run(id, jid);
  if (info.changes === 0) return reply(`❌ Não achei a transação #${id}.`);
  return reply(`🗑️ Transação #${id} apagada.`);
}

function cmdMeta(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/);
  if (parts.length < 2) return reply('❌ Use: *meta viagem 2000*');
  const target = parseAmount(parts[parts.length - 1]);
  const name = parts.slice(0, -1).join(' ').toLowerCase();
  if (!name || Number.isNaN(target) || target <= 0) {
    return reply('❌ Use: *meta viagem 2000*');
  }
  const existing = db
    .prepare(`SELECT id FROM goals WHERE user_jid = ? AND name = ?`)
    .get(jid, name);
  if (existing) {
    db.prepare(`UPDATE goals SET target = ? WHERE id = ?`).run(target, existing.id);
    return reply(`✅ Meta *${name}* atualizada para ${money(target)}.`);
  }
  db.prepare(
    `INSERT INTO goals (user_jid, name, target) VALUES (?, ?, ?)`
  ).run(jid, name, target);
  return reply(`🎯 Meta *${name}* criada: ${money(target)}`);
}

function cmdGuardar(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/);
  if (parts.length < 2) return reply('❌ Use: *guardar viagem 100*');
  const amount = parseAmount(parts[parts.length - 1]);
  const name = parts.slice(0, -1).join(' ').toLowerCase();
  if (!name || Number.isNaN(amount) || amount <= 0) {
    return reply('❌ Use: *guardar viagem 100*');
  }
  const goal = db
    .prepare(`SELECT * FROM goals WHERE user_jid = ? AND name = ?`)
    .get(jid, name);
  if (!goal) return reply(`❌ Meta *${name}* não existe. Crie com: *meta ${name} 1000*`);
  const saved = goal.saved + amount;
  db.prepare(`UPDATE goals SET saved = ? WHERE id = ?`).run(saved, goal.id);
  const updated = { ...goal, saved };
  const done = saved >= goal.target ? '\n\n🎉 Meta atingida!' : '';
  return reply(`${goalProgress(updated)}${done}`);
}

function cmdMetas(jid) {
  const goals = db
    .prepare(`SELECT * FROM goals WHERE user_jid = ? ORDER BY created_at`)
    .all(jid);
  if (goals.length === 0) return reply('Nenhuma meta cadastrada. Crie com: *meta viagem 2000*');
  return reply(goals.map((g) => goalProgress(g)).join('\n\n'));
}

function cmdConta(jid, argsStr) {
  const parts = argsStr.trim().split(/\s+/);
  if (parts.length < 3) return reply('❌ Use: *conta luz 150 10* (nome, valor, dia do vencimento)');
  const dueDay = parseInt(parts[parts.length - 1], 10);
  const amount = parseAmount(parts[parts.length - 2]);
  const name = parts.slice(0, -2).join(' ').toLowerCase();
  if (!name || Number.isNaN(amount) || amount <= 0 || !dueDay || dueDay < 1 || dueDay > 31) {
    return reply('❌ Use: *conta luz 150 10* (nome, valor, dia do vencimento entre 1 e 31)');
  }
  const existing = db
    .prepare(`SELECT id FROM bills WHERE user_jid = ? AND name = ?`)
    .get(jid, name);
  if (existing) {
    db.prepare(`UPDATE bills SET amount = ?, due_day = ? WHERE id = ?`).run(
      amount,
      dueDay,
      existing.id
    );
    return reply(`✅ Conta *${name}* atualizada: ${money(amount)}, vence dia ${dueDay}.`);
  }
  db.prepare(
    `INSERT INTO bills (user_jid, name, amount, due_day) VALUES (?, ?, ?, ?)`
  ).run(jid, name, amount, dueDay);
  return reply(`📌 Conta *${name}* cadastrada: ${money(amount)}, vence dia ${dueDay}.`);
}

function cmdContas(jid) {
  const { month, year } = currentMonthYear();
  const bills = db
    .prepare(`SELECT * FROM bills WHERE user_jid = ? ORDER BY due_day`)
    .all(jid);
  if (bills.length === 0) return reply('Nenhuma conta cadastrada. Crie com: *conta luz 150 10*');

  const paidRows = db
    .prepare(
      `SELECT bill_id FROM bill_payments WHERE year = ? AND month = ? AND bill_id IN (${bills
        .map(() => '?')
        .join(',')})`
    )
    .all(year, month, ...bills.map((b) => b.id));
  const paidIds = new Set(paidRows.map((r) => r.bill_id));

  const lines = bills.map((b) => {
    const status = paidIds.has(b.id) ? '✅ paga' : '⏳ pendente';
    return `• *${b.name}* — ${money(b.amount)} — vence dia ${b.due_day} — ${status}`;
  });
  const totalPending = bills
    .filter((b) => !paidIds.has(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  return reply(
    `📋 *Contas de ${String(month).padStart(2, '0')}/${year}*\n\n${lines.join('\n')}\n\n` +
      `Total pendente: ${money(totalPending)}`
  );
}

function cmdPago(jid, argsStr) {
  const name = argsStr.trim().toLowerCase();
  if (!name) return reply('❌ Use: *pago luz*');
  const bill = db
    .prepare(`SELECT * FROM bills WHERE user_jid = ? AND name = ?`)
    .get(jid, name);
  if (!bill) return reply(`❌ Não achei a conta *${name}*. Veja: *contas*`);
  const { month, year } = currentMonthYear();
  db.prepare(
    `INSERT OR IGNORE INTO bill_payments (bill_id, year, month) VALUES (?, ?, ?)`
  ).run(bill.id, year, month);
  return reply(`✅ Conta *${name}* marcada como paga em ${String(month).padStart(2, '0')}/${year}.`);
}

const HANDLERS = {
  ajuda: () => reply(HELP_TEXT),
  menu: () => reply(HELP_TEXT),
  help: () => reply(HELP_TEXT),
  salario: cmdSalario,
  receita: cmdReceita,
  gasto: cmdGasto,
  resumo: cmdResumo,
  categorias: cmdCategorias,
  extrato: cmdExtrato,
  apagar: cmdApagar,
  meta: cmdMeta,
  guardar: cmdGuardar,
  metas: cmdMetas,
  conta: cmdConta,
  contas: cmdContas,
  pago: cmdPago,
};

function handleMessage(jid, name, rawText) {
  ensureUser(jid, name);
  const text = (rawText || '').trim();
  if (!text) return null;

  // Atalho "-50 mercado" == "gasto 50 mercado"
  if (/^-\s*\d/.test(text)) {
    return cmdGasto(jid, text.replace(/^-\s*/, ''));
  }
  // Atalho "+50 freela" == "receita 50 freela"
  if (/^\+\s*\d/.test(text)) {
    return cmdReceita(jid, text.replace(/^\+\s*/, ''));
  }

  const spaceIdx = text.indexOf(' ');
  const firstWord = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1);
  const command = normalizeCommand(firstWord);

  const handler = HANDLERS[command];
  if (!handler) return null;
  return handler(jid, rest);
}

module.exports = { handleMessage, HELP_TEXT };
