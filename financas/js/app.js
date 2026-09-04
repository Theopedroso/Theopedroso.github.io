(function () {
  'use strict';

  var STORAGE_KEY = 'financas-app-v2';
  var NOTIFIED_KEY = 'financas-notified-v1';
  var THEME_KEY = 'financas-theme';
  var ACCOUNT_KEY = 'financas-selected-account';
  var PIN_KEY = 'financas-pin-hash';
  var DEFAULT_ACCOUNT_ID = 'default';

  // ---------- ícones (svg, sem emoji) ----------

  var ICONS = {
    moradia: '<polyline points="3 11.5 12 4 21 11.5"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9"/>',
    alimentacao: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    transporte: '<rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/><path d="M5 11l2-5h10l2 5"/>',
    saude: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    lazer: '<polygon points="12 3 14.7 9.5 21.8 9.9 16.2 14.3 18.1 21.1 12 17.1 5.9 21.1 7.8 14.3 2.2 9.9 9.3 9.5"/>',
    educacao: '<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z"/>',
    contas: '<rect x="6" y="3" width="12" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',
    outros: '<rect x="4" y="8" width="16" height="12" rx="1"/><polyline points="4 8 12 3 20 8"/><line x1="12" y1="8" x2="12" y2="20"/>',
    salario: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/>',
    outraReceita: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><circle cx="12" cy="12" r="2.5"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="17" cy="15" r="1.3"/>',
    landmark: '<line x1="3" y1="21" x2="21" y2="21"/><polyline points="4 10 12 4 20 10"/><line x1="5" y1="10" x2="5" y2="21"/><line x1="9" y1="10" x2="9" y2="21"/><line x1="15" y1="10" x2="15" y2="21"/><line x1="19" y1="10" x2="19" y2="21"/>',
    creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    piggyBank: '<ellipse cx="12" cy="13" rx="8" ry="6"/><line x1="9" y1="19" x2="9" y2="21"/><line x1="15" y1="19" x2="15" y2="21"/><line x1="9" y1="10" x2="13" y2="10"/>',
    box: '<rect x="4" y="8" width="16" height="12" rx="1"/><polyline points="4 8 12 3 20 8"/><line x1="12" y1="8" x2="12" y2="20"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    trendingUp: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
    trendingDown: '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
    alertTriangle: '<path d="M12 2 1 21h22z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c1 1 1 2 1 3h6c0-1 0-2 1-3a7 7 0 0 0-4-12z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  };

  function icon(name, size) {
    var inner = ICONS[name] || ICONS.outros;
    var s = size || 18;
    return '<svg viewBox="0 0 24 24" class="icon" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true">' + inner + '</svg>';
  }

  var EXPENSE_CATEGORIES = [
    { key: 'moradia', label: 'Moradia', icon: 'moradia' },
    { key: 'alimentacao', label: 'Alimentação', icon: 'alimentacao' },
    { key: 'transporte', label: 'Transporte', icon: 'transporte' },
    { key: 'saude', label: 'Saúde', icon: 'saude' },
    { key: 'lazer', label: 'Lazer', icon: 'lazer' },
    { key: 'educacao', label: 'Educação', icon: 'educacao' },
    { key: 'contas', label: 'Contas', icon: 'contas' },
    { key: 'outros', label: 'Outros', icon: 'outros' },
  ];

  var INCOME_CATEGORIES = [
    { key: 'salario', label: 'Salário', icon: 'salario' },
    { key: 'outros', label: 'Outra receita', icon: 'outraReceita' },
  ];

  var ACCOUNT_ICON_CHOICES = ['wallet', 'landmark', 'creditCard', 'piggyBank', 'box'];

  // ---------- estado ----------

  function loadState() {
    var fallback = { transactions: [], goals: [], bills: [], budgets: {}, accounts: [], recurring: [] };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
        budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {},
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
        recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
      };
    } catch (err) {
      console.error('Falha ao ler dados salvos:', err);
      return fallback;
    }
  }

  var state = loadState();

  // migração: import de backup antigo (financas-app-v1) sem carteiras/recorrência
  (function migrateLegacy() {
    if (state.transactions.length === 0 && state.accounts.length === 0) {
      try {
        var legacyRaw = localStorage.getItem('financas-app-v1');
        if (legacyRaw) {
          var legacy = JSON.parse(legacyRaw);
          if (Array.isArray(legacy.transactions) && legacy.transactions.length) {
            state.transactions = legacy.transactions;
            state.goals = Array.isArray(legacy.goals) ? legacy.goals : [];
            state.bills = Array.isArray(legacy.bills) ? legacy.bills : [];
            state.budgets = legacy.budgets || {};
          }
        }
      } catch (err) { /* ignora */ }
    }
  })();

  if (state.accounts.length === 0) {
    state.accounts.push({ id: DEFAULT_ACCOUNT_ID, name: 'Carteira', icon: 'wallet' });
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error(err);
      showToast('Não foi possível salvar (armazenamento cheio ou bloqueado).');
    }
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- utils ----------

  function money(value) {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseAmount(raw) {
    if (raw == null) return NaN;
    var str = String(raw).trim().replace(/^r\$\s*/i, '').replace(/\s/g, '');
    if (str === '') return NaN;
    var hasComma = str.indexOf(',') !== -1;
    var hasDot = str.indexOf('.') !== -1;
    if (hasComma && hasDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      str = str.replace(',', '.');
    }
    var value = Number(str);
    return isFinite(value) ? value : NaN;
  }

  function removeAccents(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var CATEGORY_KEYWORDS = {
    moradia: ['aluguel', 'condominio', 'iptu', 'moradia', 'casa'],
    alimentacao: ['mercado', 'supermercado', 'ifood', 'restaurante', 'lanche', 'comida', 'almoco', 'janta', 'padaria', 'feira'],
    transporte: ['uber', 'gasolina', 'combustivel', 'onibus', 'metro', 'transporte', '99', 'taxi', 'carro'],
    saude: ['farmacia', 'remedio', 'medico', 'plano de saude', 'academia', 'dentista'],
    lazer: ['cinema', 'show', 'viagem', 'bar', 'balada', 'netflix', 'jogo', 'streaming', 'passeio'],
    educacao: ['curso', 'livro', 'faculdade', 'escola', 'material escolar'],
    contas: ['luz', 'agua', 'internet', 'telefone', 'celular', 'conta de'],
  };

  var INCOME_KEYWORDS = ['recebi', 'ganhei', 'entrou', 'caiu'];
  var SALARY_KEYWORDS = ['salario', 'salário'];
  var EXPENSE_KEYWORDS = ['gastei', 'paguei', 'comprei', 'gasto'];

  // Interpreta frases como "gastei 45 no mercado" ou "recebi 200 de freela"
  function parseNaturalLanguage(text) {
    var raw = (text || '').trim();
    if (!raw) return null;
    var normalized = removeAccents(raw.toLowerCase());

    var amountMatch = raw.match(/(\d+(?:[.,]\d+)?)/);
    if (!amountMatch) return null;
    var amount = parseAmount(amountMatch[1]);
    if (!amount || amount <= 0) return null;

    var type = 'expense';
    if (/^\s*-/.test(raw)) type = 'expense';
    else if (/^\s*\+/.test(raw)) type = 'income';
    else if (INCOME_KEYWORDS.some(function (k) { return normalized.indexOf(k) !== -1; })) type = 'income';
    else if (SALARY_KEYWORDS.some(function (k) { return normalized.indexOf(k) !== -1; })) type = 'income';
    else if (EXPENSE_KEYWORDS.some(function (k) { return normalized.indexOf(k) !== -1; })) type = 'expense';

    var category = 'outros';
    if (type === 'income') {
      category = SALARY_KEYWORDS.some(function (k) { return normalized.indexOf(k) !== -1; }) ? 'salario' : 'outros';
    } else {
      Object.keys(CATEGORY_KEYWORDS).some(function (key) {
        var hit = CATEGORY_KEYWORDS[key].some(function (k) { return normalized.indexOf(k) !== -1; });
        if (hit) category = key;
        return hit;
      });
    }

    return { type: type, amount: amount, category: category, description: raw };
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return isoDate(new Date()); }
  function yesterdayISO() { var d = new Date(); d.setDate(d.getDate() - 1); return isoDate(d); }
  function monthKey(year, month) { return year + '-' + pad(month); }
  function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  var animState = {};
  function animateNumber(el, key, toValue) {
    var from = Object.prototype.hasOwnProperty.call(animState, key) ? animState[key] : toValue;
    animState[key] = toValue;
    if (Math.abs(from - toValue) < 0.005) { el.textContent = money(toValue); return; }
    var start = null;
    var duration = 500;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = money(from + (toValue - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = money(toValue);
    }
    requestAnimationFrame(step);
  }

  var toastTimer = null;
  function showToast(text) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  // ---------- navegação de mês ----------

  var now = new Date();
  var viewedYear = now.getFullYear();
  var viewedMonth = now.getMonth() + 1;
  var REAL_YEAR = now.getFullYear();
  var REAL_MONTH = now.getMonth() + 1;
  var REAL_DAY = now.getDate();

  var selectedAccountId = localStorage.getItem(ACCOUNT_KEY) || 'all';

  // ---------- categorias / contas ----------

  function categoryListFor(type) { return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES; }

  function categoryInfo(type, key) {
    var list = categoryListFor(type);
    return list.filter(function (c) { return c.key === key; })[0] || { key: key, label: key, icon: 'outros' };
  }

  function categorySlotColor(key) {
    var idx = EXPENSE_CATEGORIES.findIndex(function (c) { return c.key === key; });
    var slot = idx === -1 ? 8 : idx + 1;
    return 'var(--series-' + slot + ')';
  }

  function accountById(id) {
    return state.accounts.filter(function (a) { return a.id === id; })[0];
  }

  function txAccountId(t) { return t.accountId || DEFAULT_ACCOUNT_ID; }

  // ---------- elementos ----------

  var els = {
    themeIcon: document.getElementById('theme-icon'),
    themeToggle: document.getElementById('theme-toggle'),
    notifToggle: document.getElementById('notif-toggle'),
    accountChips: document.getElementById('account-chips'),
    monthLabel: document.getElementById('month-label'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    heroBalance: document.getElementById('hero-balance'),
    heroDelta: document.getElementById('hero-delta'),
    statIncome: document.getElementById('stat-income'),
    statExpense: document.getElementById('stat-expense'),

    incomeCtaCard: document.getElementById('income-cta-card'),
    setupIncomeBtn: document.getElementById('setup-income-btn'),
    insightsCard: document.getElementById('insights-card'),
    insightsList: document.getElementById('insights-list'),
    recurringCard: document.getElementById('recurring-card'),
    recurringList: document.getElementById('recurring-list'),

    chartCard: document.getElementById('chart-card'),
    donut: document.getElementById('donut'),
    donutTotal: document.getElementById('donut-total'),
    categoryLegend: document.getElementById('category-legend'),

    previewList: document.getElementById('preview-list'),
    previewEmpty: document.getElementById('preview-empty'),

    budgetList: document.getElementById('budget-list'),

    txSearch: document.getElementById('tx-search'),
    txFilterType: document.getElementById('tx-filter-type'),
    transactionGroups: document.getElementById('transaction-groups'),
    transactionEmpty: document.getElementById('transaction-empty'),

    reportChart: document.getElementById('report-chart'),
    reportStats: document.getElementById('report-stats'),

    goalsList: document.getElementById('goals-list'),
    goalsEmpty: document.getElementById('goals-empty'),
    goalForm: document.getElementById('goal-form'),
    goalName: document.getElementById('goal-name'),
    goalTarget: document.getElementById('goal-target'),

    billsList: document.getElementById('bills-list'),
    billsEmpty: document.getElementById('bills-empty'),
    billForm: document.getElementById('bill-form'),
    billName: document.getElementById('bill-name'),
    billAmount: document.getElementById('bill-amount'),
    billDueDay: document.getElementById('bill-due-day'),

    exportBtn: document.getElementById('export-btn'),
    importInput: document.getElementById('import-input'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    pinToggleBtn: document.getElementById('pin-toggle-btn'),
    lockScreen: document.getElementById('lock-screen'),
    lockForm: document.getElementById('lock-form'),
    lockInput: document.getElementById('lock-input'),
    lockForgot: document.getElementById('lock-forgot'),

    fabAdd: document.getElementById('fab-add'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    txForm: document.getElementById('tx-form'),
    txAmount: document.getElementById('tx-amount'),
    txCategory: document.getElementById('tx-category'),
    txAccount: document.getElementById('tx-account'),
    txDescription: document.getElementById('tx-description'),
    txDate: document.getElementById('tx-date'),
    txSubmit: document.getElementById('tx-submit'),
    txDelete: document.getElementById('tx-delete'),
    txRecurringField: document.getElementById('tx-recurring-field'),
    txRecurring: document.getElementById('tx-recurring'),
    txRecurringNote: document.getElementById('tx-recurring-note'),
    segmentedBtns: document.querySelectorAll('#tx-form .segmented-btn'),
    modeSegmentedBtns: document.querySelectorAll('.mode-segmented .segmented-btn'),
    txQuickForm: document.getElementById('tx-quick-form'),
    txQuickInput: document.getElementById('tx-quick-input'),
    txQuickPreview: document.getElementById('tx-quick-preview'),
    txQuickSubmit: document.getElementById('tx-quick-submit'),

    accountModalBackdrop: document.getElementById('account-modal-backdrop'),
    accountModalClose: document.getElementById('account-modal-close'),
    accountForm: document.getElementById('account-form'),
    accountName: document.getElementById('account-name'),
    accountIconSelect: document.getElementById('account-icon'),
    accountDelete: document.getElementById('account-delete'),

    tabs: document.querySelectorAll('.tab[data-view]'),
    views: document.querySelectorAll('.view[data-view]'),
  };

  var currentType = 'expense';
  var editingTxId = null;
  var editingAccountId = null;

  function populateCategorySelect(type) {
    var list = categoryListFor(type);
    els.txCategory.innerHTML = list
      .map(function (c) { return '<option value="' + c.key + '">' + escapeHtml(c.label) + '</option>'; })
      .join('');
  }

  function populateAccountSelect() {
    els.txAccount.innerHTML = state.accounts
      .map(function (a) { return '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>'; })
      .join('');
  }

  // ---------- navegação por abas ----------

  function switchView(name) {
    els.tabs.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-view') === name); });
    els.views.forEach(function (v) { v.classList.toggle('is-active', v.getAttribute('data-view') === name); });
  }

  els.tabs.forEach(function (t) {
    t.addEventListener('click', function () { switchView(t.getAttribute('data-view')); });
  });

  document.querySelectorAll('[data-action="go-extrato"]').forEach(function (btn) {
    btn.addEventListener('click', function () { switchView('extrato'); });
  });

  // ---------- tema (escuro por padrão) ----------

  function effectiveTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    return attr === 'light' ? 'light' : 'dark';
  }

  function updateThemeIcon() {
    els.themeIcon.innerHTML = effectiveTheme() === 'dark' ? ICONS.sun : ICONS.moon;
  }

  function applyTheme(theme) {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon();
  }

  els.themeToggle.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  // ---------- recorrência automática ----------

  function ensureRecurringGenerated(year, month) {
    var key = monthKey(year, month);
    var changed = false;
    state.recurring.forEach(function (r) {
      if (!r.active) return;
      var startKey = monthKey(r.startYear, r.startMonth);
      if (key < startKey) return;
      var already = state.transactions.some(function (t) { return t.recurringId === r.id && t.date.slice(0, 7) === key; });
      if (already) return;
      var day = Math.min(r.dayOfMonth, daysInMonth(year, month));
      state.transactions.push({
        id: genId(),
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description,
        date: year + '-' + pad(month) + '-' + pad(day),
        createdAt: Date.now(),
        accountId: r.accountId,
        recurringId: r.id,
      });
      changed = true;
    });
    if (changed) saveState();
  }

  // ---------- render ----------

  function transactionsForMonth(year, month) {
    var key = monthKey(year, month);
    return state.transactions.filter(function (t) {
      if (!t.date || t.date.slice(0, 7) !== key) return false;
      if (selectedAccountId !== 'all' && txAccountId(t) !== selectedAccountId) return false;
      return true;
    });
  }

  function monthTotals(year, month) {
    var txs = transactionsForMonth(year, month);
    var income = 0, expense = 0;
    txs.forEach(function (t) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income: income, expense: expense, balance: income - expense, txs: txs };
  }

  function render() {
    ensureRecurringGenerated(viewedYear, viewedMonth);
    renderAccountChips();
    renderMonthLabel();
    renderHero();
    renderIncomeCta();
    renderInsights();
    renderRecurringList();
    renderCategoryChart();
    renderPreviewList();
    renderBudgets();
    renderTransactionGroups();
    renderReports();
    renderGoals();
    renderBills();
  }

  function renderAccountChips() {
    var html = '<button type="button" class="acct-chip' + (selectedAccountId === 'all' ? ' is-active' : '') + '" data-account="all">Todas</button>';
    html += state.accounts.map(function (a) {
      return '<button type="button" class="acct-chip' + (selectedAccountId === a.id ? ' is-active' : '') + '" data-account="' + a.id + '">' + icon(a.icon, 14) + escapeHtml(a.name) + '</button>';
    }).join('');
    html += '<button type="button" class="acct-chip acct-chip-add" data-action="add-account">+ Carteira</button>';
    els.accountChips.innerHTML = html;
  }

  els.accountChips.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-action="add-account"]');
    if (addBtn) { openAccountModalForAdd(); return; }
    var chip = e.target.closest('[data-account]');
    if (!chip) return;
    var id = chip.getAttribute('data-account');
    if (id !== 'all' && id === selectedAccountId) {
      var acc = accountById(id);
      if (acc) openAccountModalForEdit(acc);
      return;
    }
    selectedAccountId = id;
    localStorage.setItem(ACCOUNT_KEY, id);
    render();
  });

  function renderMonthLabel() {
    var d = new Date(viewedYear, viewedMonth - 1, 1);
    var label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    els.monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function computeExpenseDelta(year, month) {
    var totals = monthTotals(year, month);
    var prevMonth = month - 1, prevYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    var prevTotals = monthTotals(prevYear, prevMonth);
    if (!(prevTotals.expense > 0 && totals.expense > 0)) return null;
    var pct = ((totals.expense - prevTotals.expense) / prevTotals.expense) * 100;
    var prevLabel = new Date(prevYear, prevMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
    return { pct: pct, prevLabel: prevLabel };
  }

  function renderHero() {
    var totals = monthTotals(viewedYear, viewedMonth);
    animateNumber(els.statIncome, 'income', totals.income);
    animateNumber(els.statExpense, 'expense', totals.expense);
    animateNumber(els.heroBalance, 'balance', totals.balance);

    var delta = computeExpenseDelta(viewedYear, viewedMonth);
    if (delta) {
      if (Math.abs(delta.pct) < 1) {
        els.heroDelta.textContent = '≈ igual a ' + delta.prevLabel + ' em gastos';
      } else {
        els.heroDelta.textContent = (delta.pct > 0 ? '▲ ' : '▼ ') + Math.abs(delta.pct).toFixed(0) + '% em gastos vs ' + delta.prevLabel;
      }
      els.heroDelta.hidden = false;
    } else {
      els.heroDelta.hidden = true;
    }
  }

  function generateInsights() {
    var insights = [];
    var totals = monthTotals(viewedYear, viewedMonth);
    var rows = expenseBreakdown(viewedYear, viewedMonth);

    if (rows.length && totals.expense > 0) {
      var top = rows[0];
      var topPct = (top.total / totals.expense) * 100;
      if (topPct >= 30) {
        var topInfo = categoryInfo('expense', top.key);
        insights.push({ type: 'info', icon: topInfo.icon, text: topInfo.label + ' é sua maior categoria este mês (' + topPct.toFixed(0) + '% dos gastos).' });
      }
    }

    var delta = computeExpenseDelta(viewedYear, viewedMonth);
    if (delta) {
      if (delta.pct >= 15) {
        insights.push({ type: 'warning', icon: 'trendingUp', text: 'Você gastou ' + delta.pct.toFixed(0) + '% a mais que em ' + delta.prevLabel + '.' });
      } else if (delta.pct <= -15) {
        insights.push({ type: 'good', icon: 'trendingDown', text: 'Você gastou ' + Math.abs(delta.pct).toFixed(0) + '% a menos que em ' + delta.prevLabel + '. Mandou bem!' });
      }
    }

    var budgetKeys = Object.keys(state.budgets);
    if (budgetKeys.length) {
      var spentByCategory = {};
      rows.forEach(function (r) { spentByCategory[r.key] = r.total; });
      var overCount = budgetKeys.filter(function (k) { return (spentByCategory[k] || 0) > state.budgets[k]; }).length;
      if (overCount > 0) {
        insights.push({ type: 'warning', icon: 'alertTriangle', text: 'Você estourou o orçamento em ' + overCount + ' categoria' + (overCount > 1 ? 's' : '') + ' este mês.' });
      } else {
        insights.push({ type: 'good', icon: 'checkCircle', text: 'Você está dentro do orçamento em todas as categorias com limite definido.' });
      }
    }

    var openGoals = state.goals
      .filter(function (g) { return g.saved < g.target; })
      .sort(function (a, b) { return (b.saved / b.target) - (a.saved / a.target); });
    if (openGoals.length) {
      var g = openGoals[0];
      insights.push({ type: 'info', icon: 'target', text: 'Faltam ' + money(g.target - g.saved) + ' pra bater sua meta "' + g.name + '".' });
    }

    var range = monthsBackFrom(viewedYear, viewedMonth, 6);
    var streak = 0;
    for (var i = range.length - 1; i >= 0; i--) {
      var t = monthTotals(range[i].year, range[i].month);
      if (t.balance >= 0 && (t.income > 0 || t.expense > 0)) streak++; else break;
    }
    if (streak >= 2) {
      insights.push({ type: 'good', icon: 'trendingUp', text: streak + ' meses seguidos com saldo positivo. Continue assim!' });
    }

    return insights.slice(0, 4);
  }

  function renderInsights() {
    var insights = generateInsights();
    els.insightsCard.hidden = insights.length === 0;
    els.insightsList.innerHTML = insights.map(function (i) {
      return '<li class="insight-item"><span class="insight-icon ' + i.type + '">' + icon(i.icon, 16) + '</span><span>' + escapeHtml(i.text) + '</span></li>';
    }).join('');
  }

  function renderIncomeCta() {
    var hasIncomeRecurring = state.recurring.some(function (r) { return r.active && r.type === 'income'; });
    els.incomeCtaCard.hidden = hasIncomeRecurring;
  }

  function renderRecurringList() {
    var active = state.recurring.filter(function (r) { return r.active; });
    els.recurringCard.hidden = active.length === 0;
    els.recurringList.innerHTML = active.map(function (r) {
      var info = categoryInfo(r.type, r.category);
      var sign = r.type === 'income' ? '+' : '-';
      return (
        '<li class="recurring-item">' +
        '<span class="icon-badge">' + icon(info.icon, 17) + '</span>' +
        '<span class="recurring-main"><strong>' + escapeHtml(r.description || info.label) + '</strong><span>Todo dia ' + r.dayOfMonth + '</span></span>' +
        '<span class="recurring-amount ' + (r.type === 'income' ? 'is-income' : '') + '">' + sign + ' ' + money(r.amount) + '</span>' +
        '<button type="button" class="recurring-stop" data-action="stop-recurring" data-id="' + r.id + '">Parar</button>' +
        '</li>'
      );
    }).join('');
  }

  els.recurringList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="stop-recurring"]');
    if (!btn) return;
    var r = state.recurring.filter(function (x) { return x.id === btn.getAttribute('data-id'); })[0];
    if (r && confirm('Parar a repetição de "' + (r.description || categoryInfo(r.type, r.category).label) + '"? As transações já geradas continuam no extrato.')) {
      r.active = false;
      saveState();
      render();
    }
  });

  function expenseBreakdown(year, month) {
    var txs = transactionsForMonth(year, month).filter(function (t) { return t.type === 'expense'; });
    var totals = {};
    txs.forEach(function (t) { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    var rows = EXPENSE_CATEGORIES
      .map(function (c) { return { key: c.key, total: totals[c.key] || 0 }; })
      .filter(function (r) { return r.total > 0; });
    Object.keys(totals).forEach(function (key) {
      if (!EXPENSE_CATEGORIES.some(function (c) { return c.key === key; })) rows.push({ key: key, total: totals[key] });
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    return rows;
  }

  function buildDonutGradient(rows, total) {
    var GAP = 3, cursor = 0, parts = [];
    rows.forEach(function (r) {
      var sweep = (r.total / total) * 360;
      var start = cursor + GAP / 2;
      var end = cursor + sweep - GAP / 2;
      if (end < start) end = start;
      parts.push('var(--surface-1) ' + cursor.toFixed(2) + 'deg ' + start.toFixed(2) + 'deg');
      parts.push(categorySlotColor(r.key) + ' ' + start.toFixed(2) + 'deg ' + end.toFixed(2) + 'deg');
      cursor += sweep;
    });
    parts.push('var(--surface-1) ' + cursor.toFixed(2) + 'deg 360deg');
    return 'conic-gradient(' + parts.join(', ') + ')';
  }

  function renderCategoryChart() {
    var rows = expenseBreakdown(viewedYear, viewedMonth);
    if (rows.length === 0) { els.chartCard.hidden = true; return; }
    els.chartCard.hidden = false;
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);

    els.donut.style.background = buildDonutGradient(rows, total);
    els.donut.setAttribute('aria-label', 'Gastos por categoria: ' + rows.map(function (r) {
      var info = categoryInfo('expense', r.key);
      return info.label + ' ' + ((r.total / total) * 100).toFixed(0) + '%';
    }).join(', '));
    els.donutTotal.textContent = money(total);

    els.categoryLegend.innerHTML = rows.map(function (r) {
      var info = categoryInfo('expense', r.key);
      var pct = (r.total / total) * 100;
      return (
        '<li>' +
        '<span class="cat-swatch" style="background:' + categorySlotColor(r.key) + '"></span>' +
        '<span class="cat-legend-label">' + icon(info.icon, 15) + escapeHtml(info.label) + '</span>' +
        '<span class="cat-legend-value">' + money(r.total) + '</span>' +
        '<span class="cat-legend-pct">' + pct.toFixed(0) + '%</span>' +
        '</li>'
      );
    }).join('');
  }

  function renderTxRow(t) {
    var info = categoryInfo(t.type, t.category);
    var dateParts = t.date.split('-');
    var dateLabel = dateParts[2] + '/' + dateParts[1];
    var label = t.description ? escapeHtml(t.description) : escapeHtml(info.label);
    var sign = t.type === 'income' ? '+' : '-';
    var acc = accountById(txAccountId(t));
    var metaExtra = (acc && state.accounts.length > 1) ? ' · ' + escapeHtml(acc.name) : '';
    var recurringBadge = t.recurringId ? icon('repeat', 12) : '';
    return (
      '<li class="tx-row" data-action="edit-tx" data-id="' + t.id + '">' +
      '<span class="icon-badge">' + icon(info.icon, 17) + '</span>' +
      '<span class="tx-main">' +
      '<span class="tx-desc">' + label + ' ' + recurringBadge + '</span>' +
      '<span class="tx-meta">' + dateLabel + ' · ' + escapeHtml(info.label) + metaExtra + '</span>' +
      '</span>' +
      '<span class="tx-amount ' + (t.type === 'income' ? 'is-income' : 'is-expense') + '">' + sign + ' ' + money(t.amount) + '</span>' +
      '</li>'
    );
  }

  function renderPreviewList() {
    var txs = transactionsForMonth(viewedYear, viewedMonth)
      .slice()
      .sort(function (a, b) { if (a.date !== b.date) return a.date < b.date ? 1 : -1; return b.createdAt - a.createdAt; })
      .slice(0, 5);
    els.previewEmpty.hidden = txs.length > 0;
    els.previewList.innerHTML = txs.map(renderTxRow).join('');
  }

  function renderBudgets() {
    var rows = expenseBreakdown(viewedYear, viewedMonth);
    var spentByCategory = {};
    rows.forEach(function (r) { spentByCategory[r.key] = r.total; });

    els.budgetList.innerHTML = EXPENSE_CATEGORIES.map(function (c) {
      var spent = spentByCategory[c.key] || 0;
      var budget = state.budgets[c.key] || 0;
      var inputValue = budget > 0 ? String(budget).replace('.', ',') : '';
      var meterHtml = '';
      if (budget > 0) {
        var pct = spent / budget;
        var cls = pct >= 1 ? 'critical' : pct >= 0.7 ? 'warning' : 'ok';
        var widthPct = Math.min(1, pct) * 100;
        var figuresHtml = money(spent) + ' de ' + money(budget);
        var isOver = spent > budget;
        if (isOver) figuresHtml += ' · estourou em ' + money(spent - budget);
        meterHtml =
          '<div class="budget-track"><div class="budget-fill ' + cls + '" style="width:' + widthPct.toFixed(1) + '%"></div></div>' +
          '<div class="budget-figures' + (isOver ? ' is-over' : '') + '">' + figuresHtml + '</div>';
      } else if (spent > 0) {
        meterHtml = '<div class="budget-figures">' + money(spent) + ' gastos, sem limite definido</div>';
      }
      return (
        '<li>' +
        '<div class="budget-row-head">' +
        '<span class="budget-label">' + icon(c.icon, 16) + escapeHtml(c.label) + '</span>' +
        '<input type="text" inputmode="decimal" class="budget-input" data-budget-key="' + c.key + '" placeholder="sem limite" value="' + inputValue + '">' +
        '</div>' + meterHtml +
        '</li>'
      );
    }).join('');
  }

  els.budgetList.addEventListener('change', function (e) {
    var input = e.target.closest('.budget-input');
    if (!input) return;
    var key = input.getAttribute('data-budget-key');
    var value = parseAmount(input.value);
    if (!value || value <= 0) delete state.budgets[key];
    else state.budgets[key] = value;
    saveState();
    renderBudgets();
  });

  function dateGroupLabel(dateStr) {
    if (dateStr === todayISO()) return 'Hoje';
    if (dateStr === yesterdayISO()) return 'Ontem';
    var parts = dateStr.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    var label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderTransactionGroups() {
    var search = (els.txSearch.value || '').trim().toLowerCase();
    var filterType = els.txFilterType.value;

    var txs = transactionsForMonth(viewedYear, viewedMonth).filter(function (t) {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (!search) return true;
      var info = categoryInfo(t.type, t.category);
      var haystack = ((t.description || '') + ' ' + info.label).toLowerCase();
      return haystack.indexOf(search) !== -1;
    });

    els.transactionEmpty.hidden = txs.length > 0;
    if (txs.length === 0) { els.transactionGroups.innerHTML = ''; return; }

    var groups = {}, order = [];
    txs.slice()
      .sort(function (a, b) { if (a.date !== b.date) return a.date < b.date ? 1 : -1; return b.createdAt - a.createdAt; })
      .forEach(function (t) {
        if (!groups[t.date]) { groups[t.date] = []; order.push(t.date); }
        groups[t.date].push(t);
      });

    els.transactionGroups.innerHTML = order.map(function (date) {
      return '<div class="tx-group-label">' + dateGroupLabel(date) + '</div><ul class="transaction-list">' + groups[date].map(renderTxRow).join('') + '</ul>';
    }).join('');
  }

  els.txSearch.addEventListener('input', renderTransactionGroups);
  els.txFilterType.addEventListener('change', renderTransactionGroups);

  // ---------- relatórios ----------

  function monthsBackFrom(year, month, n) {
    var list = [];
    for (var i = n - 1; i >= 0; i--) {
      var m = month - i, y = year;
      while (m < 1) { m += 12; y -= 1; }
      list.push({ year: y, month: m });
    }
    return list;
  }

  function renderReports() {
    var range = monthsBackFrom(viewedYear, viewedMonth, 6);
    var data = range.map(function (m) {
      var t = monthTotals(m.year, m.month);
      var label = new Date(m.year, m.month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { label: label.charAt(0).toUpperCase() + label.slice(1), income: t.income, expense: t.expense, balance: t.balance };
    });

    var maxVal = Math.max(1, Math.max.apply(null, data.map(function (d) { return Math.max(d.income, d.expense); })));

    els.reportChart.innerHTML = data.map(function (d) {
      var incomeH = Math.max(2, (d.income / maxVal) * 100);
      var expenseH = Math.max(2, (d.expense / maxVal) * 100);
      return (
        '<div class="bar-col">' +
        '<div class="bar-pair">' +
        '<div class="bar bar-income" style="height:' + incomeH.toFixed(1) + '%" title="Receitas: ' + money(d.income) + '"></div>' +
        '<div class="bar bar-expense" style="height:' + expenseH.toFixed(1) + '%" title="Despesas: ' + money(d.expense) + '"></div>' +
        '</div>' +
        '<span class="bar-col-label">' + d.label + '</span>' +
        '</div>'
      );
    }).join('');

    var avgExpense = data.reduce(function (s, d) { return s + d.expense; }, 0) / data.length;
    var best = data.reduce(function (a, b) { return b.balance > a.balance ? b : a; }, data[0]);
    var worst = data.reduce(function (a, b) { return b.expense > a.expense ? b : a; }, data[0]);
    var totalSaved = data.reduce(function (s, d) { return s + d.balance; }, 0);

    els.reportStats.innerHTML = [
      { label: 'Gasto médio mensal', value: money(avgExpense) },
      { label: 'Saldo acumulado (6 meses)', value: money(totalSaved) },
      { label: 'Melhor mês (saldo)', value: best.label },
      { label: 'Mês com mais gasto', value: worst.label },
    ].map(function (s) { return '<div class="stat-mini-card"><span>' + s.label + '</span><strong>' + s.value + '</strong></div>'; }).join('');
  }

  // ---------- metas ----------

  function renderGoals() {
    els.goalsEmpty.hidden = state.goals.length > 0;
    els.goalsList.innerHTML = state.goals.map(function (g) {
      var pct = g.target > 0 ? g.saved / g.target : 0;
      var widthPct = Math.min(1, Math.max(0, pct)) * 100;
      var done = g.saved >= g.target;
      return (
        '<li class="goal-item">' +
        '<div class="goal-head">' +
        '<span class="goal-name">' + icon('piggyBank', 16) + escapeHtml(g.name) + (done ? ' · concluída 🎉' : '') + '</span>' +
        '<span class="goal-figures">' + money(g.saved) + ' de ' + money(g.target) + '</span>' +
        '</div>' +
        '<div class="meter-track"><div class="meter-fill" style="width:' + widthPct.toFixed(1) + '%"></div></div>' +
        '<div class="goal-actions">' +
        '<input type="text" inputmode="decimal" placeholder="Guardar quanto?" data-goal-input="' + g.id + '">' +
        '<button type="button" data-action="add-goal-amount" data-id="' + g.id + '">Guardar</button>' +
        '<button type="button" class="icon-only-btn" data-action="delete-goal" data-id="' + g.id + '" aria-label="Apagar meta">' + icon('trash', 16) + '</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

  els.goalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = els.goalName.value.trim();
    var target = parseAmount(els.goalTarget.value);
    if (!name || !target || target <= 0) { showToast('Preencha nome e valor alvo da meta.'); return; }
    var existing = state.goals.filter(function (g) { return g.name.toLowerCase() === name.toLowerCase(); })[0];
    if (existing) existing.target = target;
    else state.goals.push({ id: genId(), name: name, target: target, saved: 0 });
    saveState();
    els.goalName.value = '';
    els.goalTarget.value = '';
    renderGoals();
    showToast('Meta salva!');
  });

  els.goalsList.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-action="add-goal-amount"]');
    var delBtn = e.target.closest('[data-action="delete-goal"]');
    if (addBtn) {
      var id = addBtn.getAttribute('data-id');
      var input = els.goalsList.querySelector('[data-goal-input="' + id + '"]');
      var amount = parseAmount(input.value);
      if (!amount || amount <= 0) { showToast('Digite um valor válido pra guardar.'); return; }
      var goal = state.goals.filter(function (g) { return g.id === id; })[0];
      if (goal) { goal.saved += amount; saveState(); renderGoals(); showToast('Guardado na meta "' + goal.name + '"!'); }
    } else if (delBtn) {
      var gid = delBtn.getAttribute('data-id');
      if (!confirm('Apagar esta meta?')) return;
      state.goals = state.goals.filter(function (g) { return g.id !== gid; });
      saveState();
      renderGoals();
    }
  });

  // ---------- contas fixas ----------

  function billStatus(bill) {
    var key = monthKey(viewedYear, viewedMonth);
    var paid = !!bill.payments[key];
    if (paid) return { type: 'good', text: 'Paga', rank: 4 };
    var isRealCurrentMonth = viewedYear === REAL_YEAR && viewedMonth === REAL_MONTH;
    if (!isRealCurrentMonth) return { type: 'neutral', text: 'Pendente', rank: 3 };
    var effectiveDueDay = Math.min(bill.dueDay, daysInMonth(viewedYear, viewedMonth));
    var diff = effectiveDueDay - REAL_DAY;
    if (diff < 0) return { type: 'critical', text: 'Venceu há ' + (-diff) + ' dia(s)', rank: 0 };
    if (diff === 0) return { type: 'critical', text: 'Vence hoje', rank: 0 };
    if (diff === 1) return { type: 'serious', text: 'Vence amanhã', rank: 1 };
    if (diff <= 3) return { type: 'warning', text: 'Vence em ' + diff + ' dias', rank: 2 };
    return { type: 'neutral', text: 'Vence dia ' + bill.dueDay, rank: 3 };
  }

  function renderBills() {
    els.billsEmpty.hidden = state.bills.length > 0;
    var key = monthKey(viewedYear, viewedMonth);
    var sorted = state.bills
      .map(function (b) { return { bill: b, status: billStatus(b) }; })
      .sort(function (a, b) { if (a.status.rank !== b.status.rank) return a.status.rank - b.status.rank; return a.bill.dueDay - b.bill.dueDay; });

    els.billsList.innerHTML = sorted.map(function (entry) {
      var b = entry.bill, status = entry.status;
      var paid = !!b.payments[key];
      return (
        '<li class="bill-item">' +
        '<div class="bill-row-info">' +
        '<span class="bill-name">' + icon('contas', 16) + escapeHtml(b.name) + ' · ' + money(b.amount) + '</span>' +
        '<span class="bill-status"><span class="status-dot ' + status.type + '"></span>' + status.text + '</span>' +
        '</div>' +
        '<div class="bill-actions">' +
        '<button type="button" data-action="toggle-bill-paid" data-id="' + b.id + '">' + (paid ? 'Desmarcar paga' : 'Marcar como paga') + '</button>' +
        '<button type="button" class="icon-only-btn" data-action="delete-bill" data-id="' + b.id + '" aria-label="Apagar conta">' + icon('trash', 16) + '</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

  els.billForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = els.billName.value.trim();
    var amount = parseAmount(els.billAmount.value);
    var dueDay = parseInt(els.billDueDay.value, 10);
    if (!name || !amount || amount <= 0 || !dueDay || dueDay < 1 || dueDay > 31) {
      showToast('Preencha nome, valor e dia de vencimento válidos.');
      return;
    }
    var existing = state.bills.filter(function (b) { return b.name.toLowerCase() === name.toLowerCase(); })[0];
    if (existing) { existing.amount = amount; existing.dueDay = dueDay; }
    else state.bills.push({ id: genId(), name: name, amount: amount, dueDay: dueDay, payments: {} });
    saveState();
    els.billName.value = ''; els.billAmount.value = ''; els.billDueDay.value = '';
    renderBills();
    showToast('Conta salva!');
  });

  els.billsList.addEventListener('click', function (e) {
    var toggleBtn = e.target.closest('[data-action="toggle-bill-paid"]');
    var delBtn = e.target.closest('[data-action="delete-bill"]');
    if (toggleBtn) {
      var id = toggleBtn.getAttribute('data-id');
      var bill = state.bills.filter(function (b) { return b.id === id; })[0];
      if (bill) {
        var key = monthKey(viewedYear, viewedMonth);
        if (bill.payments[key]) delete bill.payments[key]; else bill.payments[key] = true;
        saveState();
        renderBills();
      }
    } else if (delBtn) {
      var bid = delBtn.getAttribute('data-id');
      if (!confirm('Apagar esta conta?')) return;
      state.bills = state.bills.filter(function (b) { return b.id !== bid; });
      saveState();
      renderBills();
    }
  });

  // ---------- mês: navegação ----------

  els.prevMonth.addEventListener('click', function () {
    viewedMonth -= 1;
    if (viewedMonth < 1) { viewedMonth = 12; viewedYear -= 1; }
    render();
  });

  els.nextMonth.addEventListener('click', function () {
    viewedMonth += 1;
    if (viewedMonth > 12) { viewedMonth = 1; viewedYear += 1; }
    render();
  });

  // ---------- modal de transação ----------

  function setType(type) {
    currentType = type;
    els.segmentedBtns.forEach(function (b) {
      var active = b.getAttribute('data-type') === type;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
    populateCategorySelect(type);
  }

  els.segmentedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setType(btn.getAttribute('data-type')); });
  });

  function setEntryMode(mode) {
    els.modeSegmentedBtns.forEach(function (b) {
      var active = b.getAttribute('data-mode') === mode;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
    els.txQuickForm.hidden = mode !== 'quick';
    els.txForm.hidden = mode !== 'detailed';
    if (mode === 'quick') {
      els.txQuickInput.value = '';
      updateQuickPreview();
      setTimeout(function () { els.txQuickInput.focus(); }, 10);
    }
  }

  els.modeSegmentedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setEntryMode(btn.getAttribute('data-mode')); });
  });

  function updateQuickPreview() {
    var parsed = parseNaturalLanguage(els.txQuickInput.value);
    if (!els.txQuickInput.value.trim()) {
      els.txQuickPreview.textContent = 'Digite algo pra eu entender sozinho ✨';
      els.txQuickPreview.className = 'quick-preview';
      els.txQuickSubmit.disabled = true;
      return null;
    }
    if (!parsed) {
      els.txQuickPreview.textContent = '🤔 Não encontrei um valor. Tente algo como "gastei 45 no mercado".';
      els.txQuickPreview.className = 'quick-preview is-error';
      els.txQuickSubmit.disabled = true;
      return null;
    }
    var info = categoryInfo(parsed.type, parsed.category);
    var verb = parsed.type === 'income' ? 'Receita' : 'Gasto';
    els.txQuickPreview.innerHTML = '→ ' + verb + ' de ' + money(parsed.amount) + ' · ' + icon(info.icon, 14) + ' ' + escapeHtml(info.label);
    els.txQuickPreview.className = 'quick-preview is-ready';
    els.txQuickSubmit.disabled = false;
    return parsed;
  }

  els.txQuickInput.addEventListener('input', updateQuickPreview);

  els.txQuickForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var parsed = updateQuickPreview();
    if (!parsed) return;
    var accountId = selectedAccountId !== 'all' ? selectedAccountId : DEFAULT_ACCOUNT_ID;
    state.transactions.push({
      id: genId(), type: parsed.type, amount: parsed.amount, category: parsed.category,
      description: parsed.description, date: defaultDateForViewedMonth(), createdAt: Date.now(),
      accountId: accountId, recurringId: null,
    });
    saveState();
    closeModal();
    render();
    showToast(parsed.type === 'income' ? 'Receita adicionada!' : 'Gasto adicionado!');
  });

  function openModal() { els.modalBackdrop.hidden = false; }
  function closeModal() { els.modalBackdrop.hidden = true; editingTxId = null; }

  function defaultDateForViewedMonth() {
    if (viewedYear === REAL_YEAR && viewedMonth === REAL_MONTH) return todayISO();
    var day = Math.min(REAL_DAY, daysInMonth(viewedYear, viewedMonth));
    return viewedYear + '-' + pad(viewedMonth) + '-' + pad(day);
  }

  function openModalForAdd(presets) {
    editingTxId = null;
    els.modalTitle.textContent = 'Adicionar';
    els.txSubmit.textContent = 'Adicionar';
    els.txDelete.hidden = true;
    populateAccountSelect();
    setType((presets && presets.type) || 'expense');
    els.txAmount.value = '';
    els.txDescription.value = '';
    els.txDate.value = defaultDateForViewedMonth();
    els.txAccount.value = selectedAccountId !== 'all' ? selectedAccountId : DEFAULT_ACCOUNT_ID;
    els.txRecurringField.hidden = false;
    els.txRecurringNote.hidden = true;
    els.txRecurring.checked = false;
    els.txRecurring.disabled = false;
    if (presets && presets.category) els.txCategory.value = presets.category;
    if (presets && presets.recurring) els.txRecurring.checked = true;
    setEntryMode(presets ? 'detailed' : 'quick');
    openModal();
    if (!presets) setTimeout(function () { els.txQuickInput.focus(); }, 10);
  }

  function openModalForEdit(tx) {
    editingTxId = tx.id;
    setEntryMode('detailed');
    els.modalTitle.textContent = 'Editar transação';
    els.txSubmit.textContent = 'Salvar';
    els.txDelete.hidden = false;
    populateAccountSelect();
    setType(tx.type);
    els.txAmount.value = String(tx.amount).replace('.', ',');
    els.txCategory.value = tx.category;
    els.txAccount.value = txAccountId(tx);
    els.txDescription.value = tx.description || '';
    els.txDate.value = tx.date;
    if (tx.recurringId) {
      els.txRecurringField.hidden = true;
      els.txRecurringNote.hidden = false;
    } else {
      els.txRecurringField.hidden = false;
      els.txRecurringNote.hidden = true;
      els.txRecurring.checked = false;
    }
    openModal();
  }

  els.fabAdd.addEventListener('click', function () { openModalForAdd(); });
  els.setupIncomeBtn.addEventListener('click', function () {
    openModalForAdd({ type: 'income', category: 'salario', recurring: true });
  });
  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', function (e) { if (e.target === els.modalBackdrop) closeModal(); });

  function findTxById(id) { return state.transactions.filter(function (t) { return t.id === id; })[0]; }

  [els.previewList, els.transactionGroups].forEach(function (container) {
    container.addEventListener('click', function (e) {
      var row = e.target.closest('[data-action="edit-tx"]');
      if (!row) return;
      var tx = findTxById(row.getAttribute('data-id'));
      if (tx) openModalForEdit(tx);
    });
  });

  els.txForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var amount = parseAmount(els.txAmount.value);
    if (!amount || amount <= 0) { showToast('Digite um valor válido.'); return; }
    var date = els.txDate.value || todayISO();
    var category = els.txCategory.value;
    var description = els.txDescription.value.trim() || null;
    var accountId = els.txAccount.value || DEFAULT_ACCOUNT_ID;

    if (editingTxId) {
      var tx = findTxById(editingTxId);
      if (tx) {
        tx.type = currentType; tx.amount = amount; tx.category = category;
        tx.description = description; tx.date = date; tx.accountId = accountId;
      }
    } else {
      var recurringId = null;
      if (els.txRecurring.checked) {
        recurringId = genId();
        var d = date.split('-');
        state.recurring.push({
          id: recurringId, type: currentType, amount: amount, category: category, description: description,
          dayOfMonth: Number(d[2]), accountId: accountId,
          startYear: Number(d[0]), startMonth: Number(d[1]), active: true,
        });
      }
      state.transactions.push({
        id: genId(), type: currentType, amount: amount, category: category, description: description,
        date: date, createdAt: Date.now(), accountId: accountId, recurringId: recurringId,
      });
    }
    saveState();

    var dParts = date.split('-');
    viewedYear = Number(dParts[0]);
    viewedMonth = Number(dParts[1]);

    closeModal();
    render();
    showToast(editingTxId ? 'Transação atualizada!' : (currentType === 'income' ? 'Receita adicionada!' : 'Gasto adicionado!'));
  });

  els.txDelete.addEventListener('click', function () {
    if (!editingTxId) return;
    if (!confirm('Apagar esta transação?')) return;
    state.transactions = state.transactions.filter(function (t) { return t.id !== editingTxId; });
    saveState();
    closeModal();
    render();
  });

  // ---------- modal de carteira ----------

  function openAccountModalForAdd() {
    editingAccountId = null;
    document.getElementById('account-modal-title').textContent = 'Nova carteira';
    els.accountDelete.hidden = true;
    els.accountName.value = '';
    els.accountIconSelect.value = 'wallet';
    els.accountModalBackdrop.hidden = false;
    els.accountName.focus();
  }

  function openAccountModalForEdit(acc) {
    editingAccountId = acc.id;
    document.getElementById('account-modal-title').textContent = 'Editar carteira';
    els.accountDelete.hidden = false;
    els.accountName.value = acc.name;
    els.accountIconSelect.value = ACCOUNT_ICON_CHOICES.indexOf(acc.icon) !== -1 ? acc.icon : 'wallet';
    els.accountModalBackdrop.hidden = false;
  }

  function closeAccountModal() { els.accountModalBackdrop.hidden = true; editingAccountId = null; }

  els.accountModalClose.addEventListener('click', closeAccountModal);
  els.accountModalBackdrop.addEventListener('click', function (e) { if (e.target === els.accountModalBackdrop) closeAccountModal(); });

  els.accountForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = els.accountName.value.trim();
    var iconKey = els.accountIconSelect.value;
    if (!name) { showToast('Digite um nome pra carteira.'); return; }
    if (editingAccountId) {
      var acc = accountById(editingAccountId);
      if (acc) { acc.name = name; acc.icon = iconKey; }
    } else {
      var id = genId();
      state.accounts.push({ id: id, name: name, icon: iconKey });
      selectedAccountId = id;
      localStorage.setItem(ACCOUNT_KEY, id);
    }
    saveState();
    closeAccountModal();
    render();
    showToast('Carteira salva!');
  });

  els.accountDelete.addEventListener('click', function () {
    if (!editingAccountId) return;
    if (state.accounts.length <= 1) { showToast('Você precisa ter ao menos uma carteira.'); return; }
    var hasTx = state.transactions.some(function (t) { return txAccountId(t) === editingAccountId; });
    if (hasTx) { showToast('Não dá pra apagar: essa carteira tem transações.'); return; }
    if (!confirm('Apagar esta carteira?')) return;
    state.accounts = state.accounts.filter(function (a) { return a.id !== editingAccountId; });
    if (selectedAccountId === editingAccountId) { selectedAccountId = 'all'; localStorage.setItem(ACCOUNT_KEY, 'all'); }
    saveState();
    closeAccountModal();
    render();
  });

  // ---------- backup ----------

  els.exportBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'financas-backup-' + todayISO() + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener('change', function () {
    var file = els.importInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!confirm('Isso substitui todos os dados atuais pelo backup importado. Continuar?')) return;
        state = {
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          bills: Array.isArray(parsed.bills) ? parsed.bills : [],
          budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {},
          accounts: Array.isArray(parsed.accounts) && parsed.accounts.length ? parsed.accounts : [{ id: DEFAULT_ACCOUNT_ID, name: 'Carteira', icon: 'wallet' }],
          recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
        };
        state.bills.forEach(function (b) { if (!b.payments) b.payments = {}; });
        selectedAccountId = 'all';
        localStorage.setItem(ACCOUNT_KEY, 'all');
        saveState();
        render();
        showToast('Backup importado!');
      } catch (err) {
        console.error(err);
        showToast('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
    els.importInput.value = '';
  });

  // ---------- exportar csv ----------

  function csvEscape(value) {
    var str = String(value == null ? '' : value);
    if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  }

  els.exportCsvBtn.addEventListener('click', function () {
    var header = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Carteira'];
    var rows = state.transactions
      .slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .map(function (t) {
        var info = categoryInfo(t.type, t.category);
        var acc = accountById(txAccountId(t));
        return [
          t.date,
          t.type === 'income' ? 'Receita' : 'Gasto',
          info.label,
          t.description || '',
          String(t.amount).replace('.', ','),
          acc ? acc.name : '',
        ].map(csvEscape).join(',');
      });
    var csv = '﻿' + header.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'financas-extrato-' + todayISO() + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ---------- proteção por pin ----------

  async function hashPin(pin) {
    var enc = new TextEncoder().encode(pin);
    var buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function refreshPinButton() {
    els.pinToggleBtn.textContent = localStorage.getItem(PIN_KEY) ? 'Remover proteção com PIN' : 'Proteger com PIN';
  }

  els.pinToggleBtn.addEventListener('click', async function () {
    var hasPin = !!localStorage.getItem(PIN_KEY);
    if (!hasPin) {
      var pin = prompt('Crie um PIN de 4 a 6 números:');
      if (pin == null) return;
      if (!/^\d{4,6}$/.test(pin)) { showToast('PIN inválido. Use de 4 a 6 números.'); return; }
      var confirmPin = prompt('Confirme o PIN:');
      if (confirmPin !== pin) { showToast('Os PINs não coincidem.'); return; }
      localStorage.setItem(PIN_KEY, await hashPin(pin));
      showToast('PIN ativado! Vai ser pedido toda vez que abrir o app.');
    } else {
      var current = prompt('Digite seu PIN atual pra remover a proteção:');
      if (current == null) return;
      var currentHash = await hashPin(current);
      if (currentHash !== localStorage.getItem(PIN_KEY)) { showToast('PIN incorreto.'); return; }
      localStorage.removeItem(PIN_KEY);
      showToast('Proteção removida.');
    }
    refreshPinButton();
  });

  function showLockScreenIfNeeded() {
    if (!localStorage.getItem(PIN_KEY)) return;
    els.lockScreen.hidden = false;
    setTimeout(function () { els.lockInput.focus(); }, 50);
  }

  els.lockForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var attempt = await hashPin(els.lockInput.value);
    if (attempt === localStorage.getItem(PIN_KEY)) {
      els.lockScreen.hidden = true;
      els.lockInput.value = '';
    } else {
      showToast('PIN incorreto.');
      els.lockInput.value = '';
      els.lockInput.focus();
    }
  });

  els.lockForgot.addEventListener('click', function () {
    if (confirm('Sem o PIN não dá pra recuperar seus dados salvos neste navegador. A única opção é apagar tudo e começar de novo. Apagar tudo?')) {
      localStorage.clear();
      location.reload();
    }
  });

  // ---------- notificações de contas ----------

  function checkBillNotifications() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    var stored;
    try { stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || 'null'); } catch (err) { stored = null; }
    var today = todayISO();
    if (!stored || stored.date !== today) stored = { date: today, ids: [] };

    state.bills.forEach(function (bill) {
      var key = monthKey(REAL_YEAR, REAL_MONTH);
      if (bill.payments[key]) return;
      var effectiveDueDay = Math.min(bill.dueDay, daysInMonth(REAL_YEAR, REAL_MONTH));
      var diff = effectiveDueDay - REAL_DAY;
      if (diff !== 3 && diff !== 1 && diff !== 0 && diff !== -1) return;
      if (stored.ids.indexOf(bill.id) !== -1) return;
      var text = diff === 0 ? 'vence hoje!' : diff === 1 ? 'vence amanhã!' : diff === -1 ? 'venceu ontem e ainda não foi paga.' : 'vence em 3 dias.';
      new Notification('Conta ' + bill.name, { body: money(bill.amount) + ' — ' + text });
      stored.ids.push(bill.id);
    });
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(stored));
  }

  function refreshNotifToggle() {
    els.notifToggle.hidden = !(typeof Notification !== 'undefined' && Notification.permission === 'default');
  }

  els.notifToggle.addEventListener('click', function () {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(function (permission) {
      refreshNotifToggle();
      if (permission === 'granted') { showToast('Lembretes ativados!'); checkBillNotifications(); }
    });
  });

  // ---------- init ----------

  applyTheme(localStorage.getItem(THEME_KEY));
  els.txDate.value = todayISO();
  setType('expense');
  render();
  checkBillNotifications();
  refreshNotifToggle();
  refreshPinButton();
  showLockScreenIfNeeded();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.error('Falha ao registrar service worker:', err);
    });
  }
})();
