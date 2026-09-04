(function () {
  'use strict';

  var STORAGE_KEY = 'financas-app-v1';
  var NOTIFIED_KEY = 'financas-notified-v1';
  var THEME_KEY = 'financas-theme';

  var EXPENSE_CATEGORIES = [
    { key: 'moradia', label: 'Moradia', icon: '🏠' },
    { key: 'alimentacao', label: 'Alimentação', icon: '🍔' },
    { key: 'transporte', label: 'Transporte', icon: '🚗' },
    { key: 'saude', label: 'Saúde', icon: '💊' },
    { key: 'lazer', label: 'Lazer', icon: '🎉' },
    { key: 'educacao', label: 'Educação', icon: '📚' },
    { key: 'contas', label: 'Contas', icon: '🧾' },
    { key: 'outros', label: 'Outros', icon: '📦' },
  ];

  var INCOME_CATEGORIES = [
    { key: 'salario', label: 'Salário', icon: '💼' },
    { key: 'outros', label: 'Outra receita', icon: '💵' },
  ];

  // ---------- estado ----------

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { transactions: [], goals: [], bills: [], budgets: {} };
      var parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
        budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {},
      };
    } catch (err) {
      console.error('Falha ao ler dados salvos:', err);
      return { transactions: [], goals: [], bills: [], budgets: {} };
    }
  }

  var state = loadState();

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

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function todayISO() {
    return isoDate(new Date());
  }

  function yesterdayISO() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return isoDate(d);
  }

  function monthKey(year, month) {
    return year + '-' + pad(month);
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  var toastTimer = null;
  function showToast(text) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 2600);
  }

  // ---------- navegação de mês ----------

  var now = new Date();
  var viewedYear = now.getFullYear();
  var viewedMonth = now.getMonth() + 1;
  var REAL_YEAR = now.getFullYear();
  var REAL_MONTH = now.getMonth() + 1;
  var REAL_DAY = now.getDate();

  // ---------- categorias ----------

  function categoryListFor(type) {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }

  function categoryInfo(type, key) {
    var list = categoryListFor(type);
    return list.filter(function (c) { return c.key === key; })[0] || { key: key, label: key, icon: '💰' };
  }

  function categorySlotColor(key) {
    var idx = EXPENSE_CATEGORIES.findIndex(function (c) { return c.key === key; });
    var slot = idx === -1 ? 8 : idx + 1;
    return 'var(--series-' + slot + ')';
  }

  // ---------- elementos ----------

  var els = {
    themeToggle: document.getElementById('theme-toggle'),
    monthLabel: document.getElementById('month-label'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    heroBalance: document.getElementById('hero-balance'),
    heroDelta: document.getElementById('hero-delta'),
    statIncome: document.getElementById('stat-income'),
    statExpense: document.getElementById('stat-expense'),

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

    fabAdd: document.getElementById('fab-add'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    txForm: document.getElementById('tx-form'),
    txAmount: document.getElementById('tx-amount'),
    txCategory: document.getElementById('tx-category'),
    txDescription: document.getElementById('tx-description'),
    txDate: document.getElementById('tx-date'),
    txSubmit: document.getElementById('tx-submit'),
    txDelete: document.getElementById('tx-delete'),
    segmentedBtns: document.querySelectorAll('.segmented-btn'),

    tabs: document.querySelectorAll('.tab[data-view]'),
    views: document.querySelectorAll('.view[data-view]'),
  };

  var currentType = 'expense';
  var editingTxId = null;

  function populateCategorySelect(type) {
    var list = categoryListFor(type);
    els.txCategory.innerHTML = list
      .map(function (c) { return '<option value="' + c.key + '">' + c.icon + ' ' + c.label + '</option>'; })
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

  // ---------- tema ----------

  function effectiveTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateThemeIcon() {
    els.themeToggle.textContent = effectiveTheme() === 'dark' ? '☀️' : '🌙';
  }

  function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    updateThemeIcon();
  }

  els.themeToggle.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  // ---------- render ----------

  function transactionsForMonth(year, month) {
    var key = monthKey(year, month);
    return state.transactions.filter(function (t) { return t.date && t.date.slice(0, 7) === key; });
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
    renderMonthLabel();
    renderHero();
    renderCategoryChart();
    renderPreviewList();
    renderBudgets();
    renderTransactionGroups();
    renderGoals();
    renderBills();
  }

  function renderMonthLabel() {
    var d = new Date(viewedYear, viewedMonth - 1, 1);
    var label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    els.monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderHero() {
    var totals = monthTotals(viewedYear, viewedMonth);
    els.statIncome.textContent = money(totals.income);
    els.statExpense.textContent = money(totals.expense);
    els.heroBalance.textContent = money(totals.balance);
    els.heroBalance.style.color = totals.balance < 0 ? '#ffd1cb' : '';

    var prevMonth = viewedMonth - 1, prevYear = viewedYear;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    var prevTotals = monthTotals(prevYear, prevMonth);

    if (prevTotals.expense > 0 && totals.expense > 0) {
      var diffPct = ((totals.expense - prevTotals.expense) / prevTotals.expense) * 100;
      var prevLabel = new Date(prevYear, prevMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
      if (Math.abs(diffPct) < 1) {
        els.heroDelta.textContent = '≈ igual a ' + prevLabel + ' em gastos';
      } else {
        els.heroDelta.textContent =
          (diffPct > 0 ? '▲ ' : '▼ ') + Math.abs(diffPct).toFixed(0) + '% em gastos vs ' + prevLabel;
      }
      els.heroDelta.hidden = false;
    } else {
      els.heroDelta.hidden = true;
    }
  }

  function expenseBreakdown(year, month) {
    var txs = transactionsForMonth(year, month).filter(function (t) { return t.type === 'expense'; });
    var totals = {};
    txs.forEach(function (t) { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    var rows = EXPENSE_CATEGORIES
      .map(function (c) { return { key: c.key, total: totals[c.key] || 0 }; })
      .filter(function (r) { return r.total > 0; });
    Object.keys(totals).forEach(function (key) {
      if (!EXPENSE_CATEGORIES.some(function (c) { return c.key === key; })) {
        rows.push({ key: key, total: totals[key] });
      }
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    return rows;
  }

  function buildDonutGradient(rows, total) {
    var GAP = 3;
    var cursor = 0;
    var parts = [];
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
    if (rows.length === 0) {
      els.chartCard.hidden = true;
      return;
    }
    els.chartCard.hidden = false;
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);

    els.donut.style.background = buildDonutGradient(rows, total);
    els.donut.setAttribute(
      'aria-label',
      'Gastos por categoria: ' + rows.map(function (r) {
        var info = categoryInfo('expense', r.key);
        return info.label + ' ' + ((r.total / total) * 100).toFixed(0) + '%';
      }).join(', ')
    );
    els.donutTotal.textContent = money(total);

    els.categoryLegend.innerHTML = rows.map(function (r) {
      var info = categoryInfo('expense', r.key);
      var pct = (r.total / total) * 100;
      return (
        '<li>' +
        '<span class="cat-swatch" style="background:' + categorySlotColor(r.key) + '"></span>' +
        '<span class="cat-legend-label">' + info.icon + ' ' + escapeHtml(info.label) + '</span>' +
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
    return (
      '<li class="tx-row" data-action="edit-tx" data-id="' + t.id + '">' +
      '<span class="tx-icon">' + info.icon + '</span>' +
      '<span class="tx-main">' +
      '<span class="tx-desc">' + label + '</span>' +
      '<span class="tx-meta">' + dateLabel + ' · ' + escapeHtml(info.label) + '</span>' +
      '</span>' +
      '<span class="tx-amount ' + (t.type === 'income' ? 'is-income' : 'is-expense') + '">' + sign + ' ' + money(t.amount) + '</span>' +
      '</li>'
    );
  }

  function renderPreviewList() {
    var txs = transactionsForMonth(viewedYear, viewedMonth)
      .slice()
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      })
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
        '<span class="budget-label">' + c.icon + ' ' + c.label + '</span>' +
        '<input type="text" inputmode="decimal" class="budget-input" data-budget-key="' + c.key + '" placeholder="sem limite" value="' + inputValue + '">' +
        '</div>' +
        meterHtml +
        '</li>'
      );
    }).join('');
  }

  els.budgetList.addEventListener('change', function (e) {
    var input = e.target.closest('.budget-input');
    if (!input) return;
    var key = input.getAttribute('data-budget-key');
    var value = parseAmount(input.value);
    if (!value || value <= 0) {
      delete state.budgets[key];
    } else {
      state.budgets[key] = value;
    }
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
    if (txs.length === 0) {
      els.transactionGroups.innerHTML = '';
      return;
    }

    var groups = {};
    var order = [];
    txs
      .slice()
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.createdAt - a.createdAt;
      })
      .forEach(function (t) {
        if (!groups[t.date]) { groups[t.date] = []; order.push(t.date); }
        groups[t.date].push(t);
      });

    els.transactionGroups.innerHTML = order.map(function (date) {
      return (
        '<div class="tx-group-label">' + dateGroupLabel(date) + '</div>' +
        '<ul class="transaction-list">' + groups[date].map(renderTxRow).join('') + '</ul>'
      );
    }).join('');
  }

  els.txSearch.addEventListener('input', renderTransactionGroups);
  els.txFilterType.addEventListener('change', renderTransactionGroups);

  function renderGoals() {
    els.goalsEmpty.hidden = state.goals.length > 0;
    els.goalsList.innerHTML = state.goals.map(function (g) {
      var pct = g.target > 0 ? g.saved / g.target : 0;
      var widthPct = Math.min(1, Math.max(0, pct)) * 100;
      var done = g.saved >= g.target;
      return (
        '<li class="goal-item">' +
        '<div class="goal-head">' +
        '<span class="goal-name">🎯 ' + escapeHtml(g.name) + (done ? ' · concluída 🎉' : '') + '</span>' +
        '<span class="goal-figures">' + money(g.saved) + ' de ' + money(g.target) + '</span>' +
        '</div>' +
        '<div class="meter-track"><div class="meter-fill" style="width:' + widthPct.toFixed(1) + '%"></div></div>' +
        '<div class="goal-actions">' +
        '<input type="text" inputmode="decimal" placeholder="Guardar quanto?" data-goal-input="' + g.id + '">' +
        '<button type="button" data-action="add-goal-amount" data-id="' + g.id + '">Guardar</button>' +
        '<button type="button" class="icon-only-btn" data-action="delete-goal" data-id="' + g.id + '" aria-label="Apagar meta">🗑️</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

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
      .sort(function (a, b) {
        if (a.status.rank !== b.status.rank) return a.status.rank - b.status.rank;
        return a.bill.dueDay - b.bill.dueDay;
      });

    els.billsList.innerHTML = sorted.map(function (entry) {
      var b = entry.bill, status = entry.status;
      var paid = !!b.payments[key];
      return (
        '<li class="bill-item">' +
        '<div class="bill-row-info">' +
        '<span class="bill-name">🧾 ' + escapeHtml(b.name) + ' · ' + money(b.amount) + '</span>' +
        '<span class="bill-status"><span class="status-dot ' + status.type + '"></span>' + status.text + '</span>' +
        '</div>' +
        '<div class="bill-actions">' +
        '<button type="button" data-action="toggle-bill-paid" data-id="' + b.id + '">' + (paid ? 'Desmarcar paga' : 'Marcar como paga') + '</button>' +
        '<button type="button" class="icon-only-btn" data-action="delete-bill" data-id="' + b.id + '" aria-label="Apagar conta">🗑️</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

  // ---------- eventos: mês ----------

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

  function openModal() {
    els.modalBackdrop.hidden = false;
  }

  function closeModal() {
    els.modalBackdrop.hidden = true;
    editingTxId = null;
  }

  function defaultDateForViewedMonth() {
    if (viewedYear === REAL_YEAR && viewedMonth === REAL_MONTH) return todayISO();
    var day = Math.min(REAL_DAY, daysInMonth(viewedYear, viewedMonth));
    return viewedYear + '-' + pad(viewedMonth) + '-' + pad(day);
  }

  function openModalForAdd() {
    editingTxId = null;
    els.modalTitle.textContent = 'Adicionar';
    els.txSubmit.textContent = 'Adicionar';
    els.txDelete.hidden = true;
    setType('expense');
    els.txAmount.value = '';
    els.txDescription.value = '';
    els.txDate.value = defaultDateForViewedMonth();
    openModal();
    els.txAmount.focus();
  }

  function openModalForEdit(tx) {
    editingTxId = tx.id;
    els.modalTitle.textContent = 'Editar transação';
    els.txSubmit.textContent = 'Salvar';
    els.txDelete.hidden = false;
    setType(tx.type);
    els.txAmount.value = String(tx.amount).replace('.', ',');
    els.txCategory.value = tx.category;
    els.txDescription.value = tx.description || '';
    els.txDate.value = tx.date;
    openModal();
  }

  els.fabAdd.addEventListener('click', openModalForAdd);
  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', function (e) {
    if (e.target === els.modalBackdrop) closeModal();
  });

  function findTxById(id) {
    return state.transactions.filter(function (t) { return t.id === id; })[0];
  }

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
    if (!amount || amount <= 0) {
      showToast('Digite um valor válido.');
      return;
    }
    var date = els.txDate.value || todayISO();

    if (editingTxId) {
      var tx = findTxById(editingTxId);
      if (tx) {
        tx.type = currentType;
        tx.amount = amount;
        tx.category = els.txCategory.value;
        tx.description = els.txDescription.value.trim() || null;
        tx.date = date;
      }
    } else {
      state.transactions.push({
        id: genId(),
        type: currentType,
        amount: amount,
        category: els.txCategory.value,
        description: els.txDescription.value.trim() || null,
        date: date,
        createdAt: Date.now(),
      });
    }
    saveState();

    var d = date.split('-');
    viewedYear = Number(d[0]);
    viewedMonth = Number(d[1]);

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

  // ---------- metas ----------

  els.goalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = els.goalName.value.trim();
    var target = parseAmount(els.goalTarget.value);
    if (!name || !target || target <= 0) {
      showToast('Preencha nome e valor alvo da meta.');
      return;
    }
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
      if (!amount || amount <= 0) {
        showToast('Digite um valor válido pra guardar.');
        return;
      }
      var goal = state.goals.filter(function (g) { return g.id === id; })[0];
      if (goal) {
        goal.saved += amount;
        saveState();
        renderGoals();
        showToast('Guardado na meta "' + goal.name + '"!');
      }
    } else if (delBtn) {
      var gid = delBtn.getAttribute('data-id');
      if (!confirm('Apagar esta meta?')) return;
      state.goals = state.goals.filter(function (g) { return g.id !== gid; });
      saveState();
      renderGoals();
    }
  });

  // ---------- contas ----------

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
    if (existing) {
      existing.amount = amount;
      existing.dueDay = dueDay;
    } else {
      state.bills.push({ id: genId(), name: name, amount: amount, dueDay: dueDay, payments: {} });
    }
    saveState();
    els.billName.value = '';
    els.billAmount.value = '';
    els.billDueDay.value = '';
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
        if (bill.payments[key]) delete bill.payments[key];
        else bill.payments[key] = true;
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

  // ---------- backup ----------

  els.exportBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'financas-backup-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        };
        state.bills.forEach(function (b) { if (!b.payments) b.payments = {}; });
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

  // ---------- notificações de contas ----------

  function checkBillNotifications() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    var stored;
    try { stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || 'null'); }
    catch (err) { stored = null; }
    var today = todayISO();
    if (!stored || stored.date !== today) stored = { date: today, ids: [] };

    state.bills.forEach(function (bill) {
      var key = monthKey(REAL_YEAR, REAL_MONTH);
      if (bill.payments[key]) return;
      var effectiveDueDay = Math.min(bill.dueDay, daysInMonth(REAL_YEAR, REAL_MONTH));
      var diff = effectiveDueDay - REAL_DAY;
      if (diff !== 3 && diff !== 1 && diff !== 0 && diff !== -1) return;
      if (stored.ids.indexOf(bill.id) !== -1) return;

      var text =
        diff === 0 ? 'vence hoje!' :
        diff === 1 ? 'vence amanhã!' :
        diff === -1 ? 'venceu ontem e ainda não foi paga.' :
        'vence em 3 dias.';
      new Notification('💰 Conta ' + bill.name, { body: money(bill.amount) + ' — ' + text });
      stored.ids.push(bill.id);
    });

    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(stored));
  }

  // ---------- init ----------

  applyTheme(localStorage.getItem(THEME_KEY));
  els.txDate.value = todayISO();
  setType('expense');
  render();
  checkBillNotifications();

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    var enableBtn = document.createElement('button');
    enableBtn.type = 'button';
    enableBtn.className = 'icon-btn';
    enableBtn.textContent = '🔔';
    enableBtn.setAttribute('aria-label', 'Ativar lembretes de contas');
    enableBtn.title = 'Ativar lembretes de contas';
    enableBtn.addEventListener('click', function () {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          showToast('Lembretes ativados!');
          checkBillNotifications();
        }
      });
    });
    document.querySelector('.hero-top').insertBefore(enableBtn, els.themeToggle);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.error('Falha ao registrar service worker:', err);
    });
  }
})();
