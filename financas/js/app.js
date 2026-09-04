(function () {
  'use strict';

  var STORAGE_KEY = 'financas-app-v1';
  var NOTIFIED_KEY = 'financas-notified-v1';

  var EXPENSE_CATEGORIES = [
    { key: 'moradia', label: 'Moradia' },
    { key: 'alimentacao', label: 'Alimentação' },
    { key: 'transporte', label: 'Transporte' },
    { key: 'saude', label: 'Saúde' },
    { key: 'lazer', label: 'Lazer' },
    { key: 'educacao', label: 'Educação' },
    { key: 'contas', label: 'Contas' },
    { key: 'outros', label: 'Outros' },
  ];

  var INCOME_CATEGORIES = [
    { key: 'salario', label: 'Salário' },
    { key: 'outros', label: 'Outra receita' },
  ];

  // ---------- estado ----------

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { transactions: [], goals: [], bills: [] };
      var parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
      };
    } catch (err) {
      console.error('Falha ao ler dados salvos:', err);
      return { transactions: [], goals: [], bills: [] };
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

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function monthKey(year, month) {
    return year + '-' + pad(month);
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
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

  // ---------- estado de navegação de mês ----------

  var now = new Date();
  var viewedYear = now.getFullYear();
  var viewedMonth = now.getMonth() + 1;
  var REAL_YEAR = now.getFullYear();
  var REAL_MONTH = now.getMonth() + 1;
  var REAL_DAY = now.getDate();

  // ---------- elementos ----------

  var els = {
    monthLabel: document.getElementById('month-label'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    statIncome: document.getElementById('stat-income'),
    statExpense: document.getElementById('stat-expense'),
    statBalance: document.getElementById('stat-balance'),
    txForm: document.getElementById('tx-form'),
    txAmount: document.getElementById('tx-amount'),
    txCategory: document.getElementById('tx-category'),
    txDescription: document.getElementById('tx-description'),
    txDate: document.getElementById('tx-date'),
    segmentedBtns: document.querySelectorAll('.segmented-btn'),
    chartSection: document.getElementById('chart-section'),
    categoryChart: document.getElementById('category-chart'),
    transactionList: document.getElementById('transaction-list'),
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
  };

  var currentType = 'expense';

  function categoryListFor(type) {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }

  function categoryLabel(type, key) {
    var list = categoryListFor(type);
    var found = list.filter(function (c) { return c.key === key; })[0];
    return found ? found.label : key;
  }

  function categorySlotColor(key) {
    var idx = EXPENSE_CATEGORIES.findIndex(function (c) { return c.key === key; });
    var slot = idx === -1 ? 8 : idx + 1;
    return 'var(--series-' + slot + ')';
  }

  function populateCategorySelect(type) {
    var list = categoryListFor(type);
    els.txCategory.innerHTML = list
      .map(function (c) { return '<option value="' + c.key + '">' + c.label + '</option>'; })
      .join('');
  }

  // ---------- render ----------

  function render() {
    renderMonthLabel();
    renderStats();
    renderCategoryChart();
    renderTransactions();
    renderGoals();
    renderBills();
  }

  function renderMonthLabel() {
    var d = new Date(viewedYear, viewedMonth - 1, 1);
    var label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    els.monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function transactionsForViewedMonth() {
    var key = monthKey(viewedYear, viewedMonth);
    return state.transactions.filter(function (t) { return t.date && t.date.slice(0, 7) === key; });
  }

  function renderStats() {
    var txs = transactionsForViewedMonth();
    var income = 0, expense = 0;
    txs.forEach(function (t) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    var balance = income - expense;

    els.statIncome.textContent = money(income);
    els.statExpense.textContent = money(expense);
    els.statBalance.textContent = (balance >= 0 ? '▲ ' : '▼ ') + money(Math.abs(balance)) + (balance < 0 ? ' negativo' : '');
    els.statBalance.classList.toggle('is-good', balance >= 0);
    els.statBalance.classList.toggle('is-bad', balance < 0);
  }

  function renderCategoryChart() {
    var txs = transactionsForViewedMonth().filter(function (t) { return t.type === 'expense'; });
    if (txs.length === 0) {
      els.chartSection.hidden = true;
      els.categoryChart.innerHTML = '';
      return;
    }
    els.chartSection.hidden = false;

    var totals = {};
    txs.forEach(function (t) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    var rows = Object.keys(totals).map(function (key) {
      return { key: key, total: totals[key] };
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    var grandTotal = rows.reduce(function (s, r) { return s + r.total; }, 0);

    els.categoryChart.innerHTML = rows.map(function (r) {
      var pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
      var color = categorySlotColor(r.key);
      var label = categoryLabel('expense', r.key);
      return (
        '<div class="cat-row">' +
        '<span class="cat-label"><span class="cat-swatch" style="background:' + color + '"></span>' + escapeHtml(label) + '</span>' +
        '<span class="cat-track"><span class="cat-fill" style="width:' + pct.toFixed(1) + '%;background:' + color + '"></span></span>' +
        '<span class="cat-value">' + money(r.total) + ' · ' + pct.toFixed(0) + '%</span>' +
        '</div>'
      );
    }).join('');
  }

  function renderTransactions() {
    var txs = transactionsForViewedMonth().slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return 0;
    });

    els.transactionEmpty.hidden = txs.length > 0;
    els.transactionList.innerHTML = txs.map(function (t) {
      var dateParts = t.date.split('-');
      var dateLabel = dateParts[2] + '/' + dateParts[1];
      var label = t.description ? escapeHtml(t.description) : categoryLabel(t.type, t.category);
      var sign = t.type === 'income' ? '+' : '-';
      return (
        '<li class="tx-row">' +
        '<div class="tx-main">' +
        '<span class="tx-desc">' + label + '</span>' +
        '<span class="tx-meta">' + dateLabel + ' · ' + escapeHtml(categoryLabel(t.type, t.category)) + '</span>' +
        '</div>' +
        '<span class="tx-amount ' + (t.type === 'income' ? 'is-income' : 'is-expense') + '">' + sign + ' ' + money(t.amount) + '</span>' +
        '<button type="button" class="tx-delete" data-action="delete-tx" data-id="' + t.id + '" aria-label="Apagar">🗑️</button>' +
        '</li>'
      );
    }).join('');
  }

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
        '<button type="button" data-action="delete-goal" data-id="' + g.id + '" aria-label="Apagar meta">🗑️</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

  function billStatus(bill) {
    var key = monthKey(viewedYear, viewedMonth);
    var paid = !!bill.payments[key];
    if (paid) return { type: 'good', text: 'Paga' };

    var isRealCurrentMonth = viewedYear === REAL_YEAR && viewedMonth === REAL_MONTH;
    if (!isRealCurrentMonth) return { type: 'neutral', text: 'Pendente' };

    var effectiveDueDay = Math.min(bill.dueDay, daysInMonth(viewedYear, viewedMonth));
    var diff = effectiveDueDay - REAL_DAY;
    if (diff < 0) return { type: 'critical', text: 'Venceu há ' + (-diff) + ' dia(s)' };
    if (diff === 0) return { type: 'critical', text: 'Vence hoje' };
    if (diff === 1) return { type: 'serious', text: 'Vence amanhã' };
    if (diff <= 3) return { type: 'warning', text: 'Vence em ' + diff + ' dias' };
    return { type: 'neutral', text: 'Vence dia ' + bill.dueDay };
  }

  function renderBills() {
    els.billsEmpty.hidden = state.bills.length > 0;
    var key = monthKey(viewedYear, viewedMonth);
    els.billsList.innerHTML = state.bills.map(function (b) {
      var status = billStatus(b);
      var paid = !!b.payments[key];
      return (
        '<li class="bill-item">' +
        '<div class="bill-row-info">' +
        '<span class="bill-name">' + escapeHtml(b.name) + ' · ' + money(b.amount) + '</span>' +
        '<span class="bill-status"><span class="status-dot ' + status.type + '"></span>' + status.text + '</span>' +
        '</div>' +
        '<div class="goal-actions">' +
        '<button type="button" data-action="toggle-bill-paid" data-id="' + b.id + '">' + (paid ? 'Desmarcar paga' : 'Marcar como paga') + '</button>' +
        '<button type="button" data-action="delete-bill" data-id="' + b.id + '" aria-label="Apagar conta">🗑️</button>' +
        '</div>' +
        '</li>'
      );
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- eventos ----------

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

  els.segmentedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentType = btn.getAttribute('data-type');
      els.segmentedBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-checked', String(active));
      });
      populateCategorySelect(currentType);
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
    state.transactions.push({
      id: genId(),
      type: currentType,
      amount: amount,
      category: els.txCategory.value,
      description: els.txDescription.value.trim() || null,
      date: date,
      createdAt: Date.now(),
    });
    saveState();

    var d = date.split('-');
    viewedYear = Number(d[0]);
    viewedMonth = Number(d[1]);

    els.txAmount.value = '';
    els.txDescription.value = '';
    render();
    showToast(currentType === 'income' ? 'Receita adicionada!' : 'Gasto adicionado!');
  });

  els.transactionList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="delete-tx"]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    if (!confirm('Apagar esta transação?')) return;
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    saveState();
    render();
  });

  els.goalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = els.goalName.value.trim();
    var target = parseAmount(els.goalTarget.value);
    if (!name || !target || target <= 0) {
      showToast('Preencha nome e valor alvo da meta.');
      return;
    }
    var existing = state.goals.filter(function (g) { return g.name.toLowerCase() === name.toLowerCase(); })[0];
    if (existing) {
      existing.target = target;
    } else {
      state.goals.push({ id: genId(), name: name, target: target, saved: 0 });
    }
    saveState();
    els.goalName.value = '';
    els.goalTarget.value = '';
    render();
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
        render();
        showToast('Guardado na meta "' + goal.name + '"!');
      }
    } else if (delBtn) {
      var gid = delBtn.getAttribute('data-id');
      if (!confirm('Apagar esta meta?')) return;
      state.goals = state.goals.filter(function (g) { return g.id !== gid; });
      saveState();
      render();
    }
  });

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
    render();
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
        render();
      }
    } else if (delBtn) {
      var bid = delBtn.getAttribute('data-id');
      if (!confirm('Apagar esta conta?')) return;
      state.bills = state.bills.filter(function (b) { return b.id !== bid; });
      saveState();
      render();
    }
  });

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
    try {
      stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || 'null');
    } catch (err) {
      stored = null;
    }
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

  els.txDate.value = todayISO();
  populateCategorySelect(currentType);
  render();
  checkBillNotifications();

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    var enableBtn = document.createElement('button');
    enableBtn.type = 'button';
    enableBtn.className = 'btn-link';
    enableBtn.textContent = '🔔 Ativar lembretes de contas neste navegador';
    enableBtn.style.display = 'block';
    enableBtn.style.margin = '0 0 16px';
    enableBtn.addEventListener('click', function () {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          showToast('Lembretes ativados!');
          checkBillNotifications();
        }
        enableBtn.remove();
      });
    });
    document.querySelector('.topbar').appendChild(enableBtn);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.error('Falha ao registrar service worker:', err);
    });
  }
})();
