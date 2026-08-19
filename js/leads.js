const ADMIN_KEY_STORAGE = "guia_tatui_admin_key";

const keySection = document.getElementById("key-section");
const leadsSection = document.getElementById("leads-section");
const keyForm = document.getElementById("key-form");
const keyInput = document.getElementById("key-input");
const keyMessage = document.getElementById("key-message");

const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const contactedSelect = document.getElementById("contacted-select");
const resultsCount = document.getElementById("results-count");
const statusMessage = document.getElementById("status-message");
const leadsList = document.getElementById("leads-list");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");
const exportBtn = document.getElementById("export-btn");
const logoutBtn = document.getElementById("logout-btn");

let currentPage = 1;
let totalPages = 1;
let debounceTimer = null;

function getAdminKey() {
  return localStorage.getItem(ADMIN_KEY_STORAGE);
}

async function api(path, options = {}) {
  const key = getAdminKey();
  const headers = { "Content-Type": "application/json", "x-admin-key": key, ...(options.headers || {}) };
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    showKeyForm("Chave inválida.");
    throw new Error("Não autorizado");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro inesperado");
  return data;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function showKeyForm(message) {
  keySection.classList.remove("hidden");
  leadsSection.classList.add("hidden");
  keyMessage.textContent = message || "";
}

function showLeads() {
  keySection.classList.add("hidden");
  leadsSection.classList.remove("hidden");
  loadCategories();
  loadLeads();
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const categories = await res.json();
    categorySelect.innerHTML = '<option value="">Todas as categorias</option>';
    for (const category of categories) {
      const option = document.createElement("option");
      option.value = category.slug;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    }
  } catch (err) {
    console.error(err);
  }
}

function leadCard(business) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <h3>${escapeHtml(business.name)}</h3>
    <p class="category">${escapeHtml(business.category.name)}</p>
    ${business.address ? `<p class="address">${escapeHtml(business.address)}${business.neighborhood ? `, ${escapeHtml(business.neighborhood)}` : ""}</p>` : ""}
    ${business.phone ? `<p class="phone">${escapeHtml(business.phone)}</p>` : '<p class="phone">Sem telefone cadastrado</p>'}
    <label><input type="checkbox" class="contacted-checkbox" ${business.contacted ? "checked" : ""} /> Já contatado</label>
    <label>Notas
      <textarea class="notes-input" placeholder="Ex: enviado orçamento em...">${escapeHtml(business.notes)}</textarea>
    </label>
    <span class="save-status"></span>
  `;

  const checkbox = card.querySelector(".contacted-checkbox");
  const notesInput = card.querySelector(".notes-input");
  const status = card.querySelector(".save-status");

  checkbox.addEventListener("change", async () => {
    status.textContent = "Salvando...";
    try {
      await api(`/api/leads/${business.id}`, { method: "PATCH", body: JSON.stringify({ contacted: checkbox.checked }) });
      status.textContent = "Salvo!";
    } catch (err) {
      status.textContent = `Erro: ${err.message}`;
    }
  });

  let notesDebounce = null;
  notesInput.addEventListener("input", () => {
    clearTimeout(notesDebounce);
    status.textContent = "";
    notesDebounce = setTimeout(async () => {
      status.textContent = "Salvando...";
      try {
        await api(`/api/leads/${business.id}`, { method: "PATCH", body: JSON.stringify({ notes: notesInput.value }) });
        status.textContent = "Salvo!";
      } catch (err) {
        status.textContent = `Erro: ${err.message}`;
      }
    }, 600);
  });

  return card;
}

function buildQuery(page) {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (categorySelect.value) params.set("category", categorySelect.value);
  if (contactedSelect.value) params.set("contacted", contactedSelect.value);
  params.set("page", page);
  return params.toString();
}

async function loadLeads() {
  statusMessage.textContent = "Buscando...";
  leadsList.innerHTML = "";
  try {
    const data = await api(`/api/leads?${buildQuery(currentPage)}`);
    resultsCount.textContent = `${data.total} empresa${data.total === 1 ? "" : "s"} sem site`;
    statusMessage.textContent = "";
    totalPages = data.totalPages || 1;
    pageInfo.textContent = `Página ${data.page} de ${totalPages}`;
    prevBtn.disabled = data.page <= 1;
    nextBtn.disabled = data.page >= totalPages;

    if (data.results.length === 0) {
      statusMessage.textContent = "Nenhum lead encontrado com esses filtros.";
      return;
    }
    for (const business of data.results) {
      leadsList.appendChild(leadCard(business));
    }
  } catch (err) {
    if (err.message !== "Não autorizado") {
      statusMessage.textContent = `Erro: ${err.message}`;
    }
  }
}

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

async function exportCsv() {
  exportBtn.disabled = true;
  exportBtn.textContent = "Exportando...";
  try {
    const all = [];
    let page = 1;
    let pages = 1;
    do {
      const data = await api(`/api/leads?${buildQuery(page)}`);
      all.push(...data.results);
      pages = data.totalPages || 1;
      page++;
    } while (page <= pages);

    const header = ["nome", "categoria", "telefone", "endereco", "bairro", "cidade", "contatado"];
    const lines = [header.join(",")];
    for (const b of all) {
      lines.push(
        [b.name, b.category.name, b.phone, b.address, b.neighborhood, b.city, b.contacted ? "sim" : "não"]
          .map(csvEscape)
          .join(",")
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-sem-site.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    if (err.message !== "Não autorizado") alert(`Erro ao exportar: ${err.message}`);
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = "Exportar CSV";
  }
}

keyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  localStorage.setItem(ADMIN_KEY_STORAGE, keyInput.value.trim());
  currentPage = 1;
  showLeads();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(ADMIN_KEY_STORAGE);
  showKeyForm();
});

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage = 1;
    loadLeads();
  }, 300);
});
categorySelect.addEventListener("change", () => {
  currentPage = 1;
  loadLeads();
});
contactedSelect.addEventListener("change", () => {
  currentPage = 1;
  loadLeads();
});
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadLeads();
  }
});
nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadLeads();
  }
});
exportBtn.addEventListener("click", exportCsv);

if (getAdminKey()) {
  showLeads();
} else {
  showKeyForm();
}
