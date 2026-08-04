const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const resultsGrid = document.getElementById("results-grid");
const resultsCount = document.getElementById("results-count");
const statusMessage = document.getElementById("status-message");

let debounceTimer = null;

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    if (!res.ok) throw new Error("Falha ao carregar categorias");
    const categories = await res.json();

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

function businessCard(business) {
  const card = document.createElement("article");
  card.className = "card";

  const badge = business.featured ? '<span class="badge">Destaque</span>' : "";

  card.innerHTML = `
    <h3>${escapeHtml(business.name)} ${badge}</h3>
    <p class="category">${escapeHtml(business.category.name)}</p>
    ${business.address ? `<p class="address">${escapeHtml(business.address)}${business.neighborhood ? `, ${escapeHtml(business.neighborhood)}` : ""}</p>` : ""}
    ${business.phone ? `<p class="phone">${escapeHtml(business.phone)}</p>` : ""}
  `;
  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadBusinesses() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (categorySelect.value) params.set("category", categorySelect.value);

  statusMessage.textContent = "Buscando...";
  resultsGrid.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE_URL}/api/businesses?${params.toString()}`);
    if (!res.ok) throw new Error("Falha ao buscar empresas");
    const data = await res.json();

    resultsCount.textContent = `${data.total} resultado${data.total === 1 ? "" : "s"}`;
    statusMessage.textContent = "";

    if (data.results.length === 0) {
      statusMessage.textContent = "Nenhuma empresa encontrada.";
      return;
    }

    for (const business of data.results) {
      resultsGrid.appendChild(businessCard(business));
    }
  } catch (err) {
    console.error(err);
    statusMessage.textContent = "Não foi possível conectar à API. Verifique se o backend está rodando.";
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadBusinesses, 300);
});
categorySelect.addEventListener("change", loadBusinesses);

loadCategories();
loadBusinesses();
