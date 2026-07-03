// js/index.js

let businesses = [];

async function loadBusinesses() {
  try {
    businesses = await getBusinesses();

    renderRecentCards();
    renderList(null);
  } catch (err) {
    console.error(err);
    showToast("Couldn't load businesses.");
  }
}

function renderRecentCards() {
  const wrap = document.getElementById('recentCards');

  const recents = businesses.slice(0, 5);

  wrap.innerHTML = recents.map(b => `
    <div class="biz-card" onclick="goToBusiness('${b.id}')">
      <div class="biz-card-icon">${b.icon}</div>
      <div class="biz-card-name">${b.name}</div>
      <div class="biz-card-meta">
        <span class="status-dot ${isBusinessOpenNow(b) ? 'open' : 'closed'}"></span>
        ${b.area}
      </div>
    </div>
  `).join('');
}

function renderList(filtered) {
  const list = document.getElementById('bizList');
  const hint = document.getElementById('searchHint');

  if (!filtered) {
    list.innerHTML = '';
    hint.style.display = 'block';
    return;
  }

  hint.style.display = 'none';

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        No businesses match that search.<br>
        Try a different name or area.
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(b => `
    <div class="biz-list-item" onclick="goToBusiness('${b.id}')">
      <div class="biz-list-icon">${b.icon}</div>

      <div class="biz-list-text">
        <div class="biz-list-name">${b.name}</div>

        <div class="biz-list-meta">
          <span class="status-dot ${isBusinessOpenNow(b) ? 'open' : 'closed'}"></span>
          ${b.category} · ${b.area}
        </div>
      </div>

      <div class="biz-list-chevron">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `).join('');
}

function goToBusiness(id) {
  window.location.href = `business.html?id=${id}`;
}

document
  .getElementById('searchInput')
  .addEventListener('input', (e) => {

    const q = e.target.value.trim().toLowerCase();

    if (!q) {
      renderList(null);
      return;
    }

    const filtered = businesses.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.area.toLowerCase().includes(q)
    );

    renderList(filtered);
  });

document
  .getElementById('registerBanner')
  .addEventListener('click', () => {
    window.location.href = 'register.html';
  });

loadBusinesses();