const TOKEN_KEY = "guia_tatui_token";
const EMAIL_KEY = "guia_tatui_email";

const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const authMessage = document.getElementById("auth-message");
const accountEmail = document.getElementById("account-email");

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const myBusinessesEl = document.getElementById("my-businesses");
const claimSearchInput = document.getElementById("claim-search-input");
const claimResultsEl = document.getElementById("claim-results");

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro inesperado");
  return data;
}

function showDashboard() {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  accountEmail.textContent = localStorage.getItem(EMAIL_KEY) || "";
  loadMyBusinesses();
}

function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "";
  try {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setSession(data.token, data.owner.email);
    showDashboard();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "";
  try {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const data = await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
    setSession(data.token, data.owner.email);
    showDashboard();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearSession();
  showAuth();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function businessEditForm(business) {
  const wrapper = document.createElement("article");
  wrapper.className = "card";
  wrapper.innerHTML = `
    <h3>${escapeHtml(business.name)}</h3>
    <p class="category">${escapeHtml(business.category.name)}</p>
    <form class="edit-form">
      <label>Descrição
        <textarea name="description">${escapeHtml(business.description)}</textarea>
      </label>
      <label>Horário de funcionamento
        <input type="text" name="hours" value="${escapeHtml(business.hours)}" placeholder="Seg-Sex 9h-18h" />
      </label>
      <label>Telefone
        <input type="text" name="phone" value="${escapeHtml(business.phone)}" />
      </label>
      <label>Site
        <input type="text" name="website" value="${escapeHtml(business.website)}" placeholder="https://..." />
      </label>
      <label>Endereço
        <input type="text" name="address" value="${escapeHtml(business.address)}" />
      </label>
      <button type="submit">Salvar</button>
      <span class="save-status"></span>
    </form>
  `;

  const form = wrapper.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".save-status");
    status.textContent = "Salvando...";
    try {
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      await api(`/api/businesses/${business.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      status.textContent = "Salvo!";
    } catch (err) {
      status.textContent = `Erro: ${err.message}`;
    }
  });

  return wrapper;
}

async function loadMyBusinesses() {
  myBusinessesEl.innerHTML = "Carregando...";
  try {
    const businesses = await api("/api/businesses/mine");
    myBusinessesEl.innerHTML = "";
    if (businesses.length === 0) {
      myBusinessesEl.innerHTML = "<p>Você ainda não reivindicou nenhuma empresa. Busque abaixo.</p>";
      return;
    }
    for (const business of businesses) {
      myBusinessesEl.appendChild(businessEditForm(business));
    }
  } catch (err) {
    myBusinessesEl.textContent = `Erro ao carregar: ${err.message}`;
  }
}

let claimDebounce = null;
claimSearchInput.addEventListener("input", () => {
  clearTimeout(claimDebounce);
  claimDebounce = setTimeout(searchToClaim, 300);
});

async function searchToClaim() {
  const q = claimSearchInput.value.trim();
  claimResultsEl.innerHTML = "";
  if (!q) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/businesses?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (data.results.length === 0) {
      claimResultsEl.innerHTML = "<p>Nenhuma empresa encontrada.</p>";
      return;
    }

    for (const business of data.results) {
      const row = document.createElement("div");
      row.className = "card claim-row";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(business.name)}</strong>
          <p class="category">${escapeHtml(business.category.name)} — ${escapeHtml(business.address || "")}</p>
        </div>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      if (business.claimed) {
        btn.textContent = "Já reivindicada";
        btn.disabled = true;
      } else {
        btn.textContent = "Reivindicar";
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "Reivindicando...";
          try {
            await api(`/api/businesses/${business.id}/claim`, { method: "POST" });
            claimSearchInput.value = "";
            claimResultsEl.innerHTML = "";
            loadMyBusinesses();
          } catch (err) {
            btn.disabled = false;
            btn.textContent = `Erro: ${err.message}`;
          }
        });
      }
      row.appendChild(btn);
      claimResultsEl.appendChild(row);
    }
  } catch (err) {
    claimResultsEl.textContent = `Erro na busca: ${err.message}`;
  }
}

if (getToken()) {
  showDashboard();
} else {
  showAuth();
}
