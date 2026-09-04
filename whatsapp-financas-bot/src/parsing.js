function removeAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeCommand(word) {
  return removeAccents(word || '').toLowerCase();
}

// Aceita "50", "50.90", "50,90", "1.234,56", "R$ 50,90"
function parseAmount(raw) {
  if (raw == null) return NaN;
  let str = String(raw).trim().replace(/^r\$\s*/i, '').replace(/\s/g, '');
  if (str === '') return NaN;
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  if (hasComma && hasDot) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    str = str.replace(',', '.');
  }
  const value = Number(str);
  return Number.isFinite(value) ? value : NaN;
}

// "01/2026" -> { month: 1, year: 2026 }. Retorna null se não bater o formato.
function parseMonthYear(raw) {
  if (!raw) return null;
  const match = String(raw).trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function monthKey(month, year) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

module.exports = {
  removeAccents,
  normalizeCommand,
  parseAmount,
  parseMonthYear,
  currentMonthYear,
  monthKey,
};
