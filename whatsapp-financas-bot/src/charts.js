const BAR_LENGTH = 12;
const FILLED = '🟩';
const EMPTY = '⬜';

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function textBar(fraction, filled = FILLED, empty = EMPTY, length = BAR_LENGTH) {
  const clamped = Math.max(0, Math.min(1, fraction || 0));
  const filledCount = Math.round(clamped * length);
  return filled.repeat(filledCount) + empty.repeat(length - filledCount);
}

function categoryBreakdown(rows) {
  if (rows.length === 0) return 'Nenhum gasto registrado ainda neste período.';
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const lines = sorted.map((r) => {
    const pct = total > 0 ? r.total / total : 0;
    return `${r.category}\n${textBar(pct)} ${(pct * 100).toFixed(0)}%  ${money(r.total)}`;
  });
  return `📊 *Gastos por categoria*\n\n${lines.join('\n\n')}\n\n*Total: ${money(total)}*`;
}

function goalProgress(goal) {
  const pct = goal.target > 0 ? goal.saved / goal.target : 0;
  return `🎯 *${goal.name}*\n${textBar(pct)} ${(pct * 100).toFixed(0)}%\n${money(goal.saved)} de ${money(goal.target)}`;
}

module.exports = { money, textBar, categoryBreakdown, goalProgress };
