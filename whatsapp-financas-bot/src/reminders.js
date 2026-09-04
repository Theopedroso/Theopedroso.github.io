const cron = require('node-cron');
const { db } = require('./db');
const { money } = require('./charts');

const TIMEZONE = process.env.FINANCAS_TZ || 'America/Sao_Paulo';
const REMINDER_CRON = process.env.FINANCAS_REMINDER_CRON || '0 8 * * *';

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function messageFor(diff, bill) {
  if (diff === 3) return `⏰ A conta *${bill.name}* (${money(bill.amount)}) vence em 3 dias.`;
  if (diff === 1) return `⏰ A conta *${bill.name}* (${money(bill.amount)}) vence amanhã!`;
  if (diff === 0) return `🚨 A conta *${bill.name}* (${money(bill.amount)}) vence hoje!`;
  if (diff === -1)
    return `❗ A conta *${bill.name}* (${money(bill.amount)}) venceu ontem e ainda não foi paga. Marque como paga com: *pago ${bill.name}*`;
  return null;
}

function checkAndSend(sendMessage) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const bills = db.prepare('SELECT * FROM bills').all();
  for (const bill of bills) {
    const effectiveDueDay = Math.min(bill.due_day, daysInMonth(year, month));
    const diff = effectiveDueDay - today;
    const text = messageFor(diff, bill);
    if (!text) continue;

    const paid = db
      .prepare(
        'SELECT 1 FROM bill_payments WHERE bill_id = ? AND year = ? AND month = ?'
      )
      .get(bill.id, year, month);
    if (paid) continue;

    sendMessage(bill.user_jid, text).catch((err) =>
      console.error(`Falha ao enviar lembrete para ${bill.user_jid}:`, err)
    );
  }
}

function startReminders(sendMessage) {
  cron.schedule(REMINDER_CRON, () => checkAndSend(sendMessage), { timezone: TIMEZONE });
  console.log(`Lembretes de contas agendados: "${REMINDER_CRON}" (${TIMEZONE})`);
}

module.exports = { startReminders, checkAndSend };
