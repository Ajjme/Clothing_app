/* ui.js — pure rendering helpers, no fetch calls */

const UI = (() => {

  // ── badges ────────────────────────────────────────────────────────────────

  function conditionBadge(condition) {
    const map = {
      good:    ['badge-good',    'Good'],
      new:     ['badge-new',     'New / Unworn'],
      worn:    ['badge-worn',    'Worn / Issue'],
      replace: ['badge-replace', 'Replace Now'],
    };
    const [cls, label] = map[condition] || ['badge-good', condition];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function stars(rating) {
    if (!rating) return '';
    const filled = Math.round(rating);
    const empty  = 10 - filled;
    return `<div class="card-rating">
      <span class="stars-filled">${'★'.repeat(filled)}</span><span style="opacity:.25">${'★'.repeat(empty)}</span>
      <span style="margin-left:4px;font-size:10.5px;color:var(--text-tertiary)">${rating}/10</span>
    </div>`;
  }

  // ── item card ─────────────────────────────────────────────────────────────

  function itemCard(item) {
    const extraClass = item.condition === 'replace' ? ' replace' : item.rating === 10 ? ' star' : '';
    const notesHtml  = item.notes
      ? `<div class="card-notes">${escHtml(item.notes)}</div>`
      : '';

    return `
      <div class="item-card${extraClass}" data-id="${item.id}">
        <div class="card-top">
          <div>
            <div class="card-title">${escHtml(item.name)}</div>
            <div class="card-brand">${escHtml(item.brand || '—')}</div>
          </div>
          <div class="card-actions">
            <button class="icon-btn btn-edit" data-id="${item.id}" title="Edit">
              <i class="ti ti-pencil"></i>
            </button>
            <button class="icon-btn danger btn-delete" data-id="${item.id}" title="Remove">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-meta">
          <div class="color-swatch" style="background:${item.color || '#888'};"></div>
          <span class="card-fit">${escHtml(item.colorName || '')}${item.fit ? ' · ' + escHtml(item.fit) : ''}</span>
          ${conditionBadge(item.condition)}
        </div>
        ${stars(item.rating)}
        ${notesHtml}
      </div>`;
  }

  // ── full closet view ──────────────────────────────────────────────────────

  function renderCloset(items, categories, activeSeason) {
    const el = document.getElementById('view-closet');
    if (!el) return;

    // filter by season
    const filtered = activeSeason === 'all'
      ? items
      : items.filter(i => i.season === activeSeason || i.season === 'both');

    // group by category
    const grouped = {};
    categories.forEach(cat => { grouped[cat.id] = []; });
    filtered.forEach(item => {
      if (grouped[item.category] !== undefined) grouped[item.category].push(item);
    });

    let html = '';
    categories.forEach(cat => {
      const catItems = grouped[cat.id] || [];
      const count    = catItems.length;
      const target   = cat.target || 4;

      html += `
        <div class="section-divider" id="cat-${cat.id}">
          <div class="divider-line"></div>
          <div class="divider-label">${escHtml(cat.label)}</div>
          <div class="divider-line"></div>
        </div>
        <div class="section-header">
          <span class="section-meta">${count} of ${target} target</span>
        </div>
        <div class="item-grid" data-category="${cat.id}">
          ${catItems.map(itemCard).join('')}
          <button class="add-card btn-add-in-cat" data-category="${cat.id}" title="Add item to ${cat.label}">
            <i class="ti ti-plus"></i> Add ${cat.label}
          </button>
        </div>`;
    });

    el.innerHTML = html;
  }

  // ── gaps view ─────────────────────────────────────────────────────────────

  function renderGaps(items, categories) {
    const el = document.getElementById('view-gaps');
    if (!el) return;

    const byCategory = {};
    categories.forEach(c => { byCategory[c.id] = 0; });
    items.forEach(i => { if (byCategory[i.category] !== undefined) byCategory[i.category]++; });

    const rows = categories.map(cat => {
      if (cat.target === 0) return '';
      const count  = byCategory[cat.id] || 0;
      const target = cat.target;
      const gap    = target - count;
      let priority, label;

      if (gap >= 3)        { priority = 'priority-high'; label = `Need ${gap} more`; }
      else if (gap >= 1)   { priority = 'priority-med';  label = `Need ${gap} more`; }
      else if (gap === 0)  { priority = 'priority-low';  label = 'Complete'; }
      else                 { priority = 'priority-low';  label = `${count - target} over target`; }

      return `<div class="gap-row">
        <span class="gap-label">${escHtml(cat.label)}</span>
        <div class="gap-right">
          <span class="gap-count">${count} / ${target}</span>
          <span class="badge ${priority}">${label}</span>
        </div>
      </div>`;
    }).join('');

    // worn / replace summary
    const worn    = items.filter(i => i.condition === 'worn').length;
    const replace = items.filter(i => i.condition === 'replace').length;
    const unworn  = items.filter(i => i.condition === 'new').length;

    el.innerHTML = `
      <div class="section-header" style="margin-bottom:1rem;">
        <div class="section-title">Gaps &amp; Goals</div>
        <span class="section-meta">Target: 4 items per category</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:1.25rem;">
        <div class="stat-card">
          <div class="stat-num" style="color:#9a2828">${replace}</div>
          <div class="stat-label">Replace now</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:#7a4a08">${worn}</div>
          <div class="stat-label">Worn / Issues</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:#1a5a9a">${unworn}</div>
          <div class="stat-label">Never worn</div>
        </div>
      </div>
      ${rows}`;
  }

  // ── suggestions view ──────────────────────────────────────────────────────

  function renderSuggestions() {
    const el = document.getElementById('view-suggestions');
    if (!el) return;

    const suggestions = [
      { emoji: '🔁', title: 'Replace the Lulu brown chino short first',
        body: 'Your best short (waterproof, sweat-proof) is beat up. Search Lululemon for the Commission Short 7" in tan or olive — same properties. Consider buying two to future-proof.' },
      { emoji: '👖', title: 'Upgrade your denim game (1 → 4 pairs)',
        body: 'You only have one pair of jeans with a zipper issue. For your NZ/old wealth aesthetic, look for slim-straight fits in dark indigo and mid-wash. Rodd & Gunn makes excellent denim. Also consider APC or Corridor for quality thrift-able jeans.' },
      { emoji: '👕', title: 'Find your best pocket tee twin',
        body: 'Your black Amazon pocket tee (possibly G Scissors) rated 10/10. Search Amazon for "cooling pocket tee 100% cotton" and buy 3–4 more. This is your anchor piece.' },
      { emoji: '🎽', title: 'Short-sleeve textured polos — biggest gap (0 owned)',
        body: 'Rodd & Gunn make exactly what you described — 2-button placket, relaxed collar, textured fabric. Their Sports Fit Polo is ideal. Look for olive, navy, and stone colorways.' },
      { emoji: '🪡', title: 'Fix the chambray shirt situation',
        body: 'Look for a Japanese selvedge chambray or a Rodd & Gunn linen-blend with horn or corozo (wood-like) buttons. Dark chambray is more versatile than light for PNW layering.' },
      { emoji: '🧥', title: 'Replace the Banana Republic rain jacket (4/10)',
        body: 'For Seattle rain + your outdoor/VC aesthetic: Arc\'teryx Veilance (luxury), Helly Hansen (functional), or Rodd & Gunn\'s Queenstown jacket. Target olive, navy, or stone — black is covered by the Lulu cargo.' },
      { emoji: '🕶', title: 'Sunglasses — nothing logged',
        body: 'For your aesthetic: Moscot, Oliver Peoples, or Maui Jim (outdoor/NZ). Stick to tortoiseshell, olive, or matte black frames. Polarized essential for PNW glare on water.' },
      { emoji: '🌿', title: 'Fragrance — sandalwood + cypress',
        body: 'Tom Ford Oud Wood, Comme des Garçons Wonderwood, or Aesop Hwyl. For NZ/outdoor feel: Margiela Replica "Sailing Day" or Paco Rabanne Pure XS Forest. Try decants before committing.' },
      { emoji: '🎨', title: 'Palette note — the red Vuori pants',
        body: 'Red doesn\'t slot naturally into your minimalist/old wealth palette and you\'ve never worn them. Consider donating and replacing with a navy or olive pair instead.' },
    ];

    el.innerHTML = `
      <div class="section-header" style="margin-bottom:1rem;">
        <div class="section-title">Style Suggestions</div>
        <span class="section-meta">Tailored to Seattle · Minimalist · NZ aesthetic</span>
      </div>
      ${suggestions.map(s => `
        <div class="suggestion-block">
          <h3>${s.emoji} ${escHtml(s.title)}</h3>
          <p>${escHtml(s.body)}</p>
        </div>`).join('')}`;
  }

  // ── thrift view ───────────────────────────────────────────────────────────

  function renderThrift() {
    const el = document.getElementById('view-thrift');
    if (!el) return;

    const sections = [
      {
        priority: '🔴 High Priority', cls: 'priority-high',
        items: [
          { name: 'Slim-straight dark indigo jeans, 32×30/31',
            detail: 'Brands: APC, Nudie, Patagonia, Levi\'s 511. Pass if faded, worn knees, or wide leg.' },
          { name: 'Short-sleeve polo, textured fabric, M',
            detail: '2-button placket, no large logos, pique or ottoman texture. Colors: olive, navy, stone. Pass if synthetic blend or boxy fit.' },
          { name: 'Lululemon Commission or ABC Short, brown/tan, 32W',
            detail: 'Must be waterproof/technical fabric. Check gusset and zipper integrity.' },
        ]
      },
      {
        priority: '🟡 Medium Priority', cls: 'priority-med',
        items: [
          { name: 'Dark chambray or denim shirt, S/M',
            detail: 'Look for horn or wood-look buttons. Rodd & Gunn, Faherty, or Japanese selvedge. Pass if plastic buttons or boxy fit.' },
          { name: 'Solid cotton tees, M, heavier-weight (180gsm+)',
            detail: 'Slight wash/worn look. Colors: off-white, slate, olive, stone. Brands: Sunspel, vintage Hanes, or quality thrift find.' },
          { name: 'Merino quarter-zip or mid-layer, S/M',
            detail: 'Brands: Icebreaker, Smartwool, Rodd & Gunn. Colors: charcoal, navy, olive. Pass if pilled or synthetic.' },
        ]
      },
      {
        priority: '🟢 Opportunistic', cls: 'priority-low',
        items: [
          { name: 'Technical rain shell, M, fully waterproof',
            detail: 'Check for taped seams. Colors: olive, navy, stone. Brands: Arc\'teryx, Marmot, Patagonia, Helly Hansen. Pass on anything without taped seams.' },
          { name: 'Brown leather chukkas',
            detail: 'Clarks Desert Boot or similar. Check sole wear and leather condition. Only buy if stitching is intact.' },
          { name: 'Canvas or twill athletic shorts, M 32',
            detail: 'Lululemon or Vuori preferred. Check inner liner for sweat-proof fabric.' },
        ]
      }
    ];

    const brands = ['Lululemon', 'Rodd & Gunn', 'Hurley', 'Mountain Force', 'Vuori', 'Patagonia', 'Arc\'teryx', 'Icebreaker', 'APC', 'Faherty', 'Sunspel'];
    const coreBrands = new Set(['Lululemon', 'Rodd & Gunn', 'Hurley', 'Mountain Force']);

    el.innerHTML = `
      <div class="section-header" style="margin-bottom:1rem;">
        <div class="section-title">Thrift List</div>
        <span class="section-meta">Prioritized hunting list with pass/fail criteria</span>
      </div>
      ${sections.map(s => `
        <div class="suggestion-block thrift-block" style="margin-bottom:12px;">
          <h3 style="margin-bottom:10px;">${s.priority}</h3>
          ${s.items.map(item => `
            <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:0.5px solid var(--border);">
              <div style="font-size:13px;font-weight:500;margin-bottom:3px;">${escHtml(item.name)}</div>
              <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">${escHtml(item.detail)}</div>
            </div>`).join('')}
        </div>`).join('')}
      <div style="margin-top:1.25rem;">
        <div class="nav-section-label" style="margin-bottom:8px;">Brands to watch for</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${brands.map(b => `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:4px 10px;border-radius:20px;border:0.5px solid var(--border-med);color:var(--text-secondary);background:var(--bg-surface);">
              ${coreBrands.has(b) ? '<i class="ti ti-circle-check" style="color:#2d5a1b;font-size:13px;"></i>' : ''}
              ${escHtml(b)}
            </span>`).join('')}
        </div>
      </div>`;
  }

  // ── stats bar ─────────────────────────────────────────────────────────────

  function updateStats(stats, categories) {
    document.getElementById('stat-total').textContent   = stats.total;
    document.getElementById('stat-replace').textContent = stats.needReplacing;
    document.getElementById('stat-rating').textContent  = stats.avgRating;

    // count gaps (categories below target)
    let gaps = 0;
    categories.forEach(cat => {
      if (cat.target > 0 && (stats.byCategory[cat.id] || 0) < cat.target) gaps++;
    });
    document.getElementById('stat-gaps').textContent = gaps;
  }

  // ── alert bar ─────────────────────────────────────────────────────────────

  function updateAlertBar(items) {
    const replace = items.filter(i => i.condition === 'replace').length;
    const worn    = items.filter(i => i.condition === 'worn').length;
    const bar     = document.getElementById('alert-bar');
    const txt     = document.getElementById('alert-text');

    if (replace > 0 || worn > 0) {
      const parts = [];
      if (replace > 0) parts.push(`${replace} item${replace > 1 ? 's' : ''} need immediate replacement`);
      if (worn > 0)    parts.push(`${worn} item${worn > 1 ? 's' : ''} have fit or condition issues`);
      txt.textContent = parts.join(' · ');
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  // ── sidebar category counts ───────────────────────────────────────────────

  function updateCategoryNav(items, categories, activeCategoryScroll) {
    const el = document.getElementById('category-nav');
    if (!el) return;

    const counts = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

    el.innerHTML = categories.map(cat => `
      <button class="nav-item" data-scroll-cat="${cat.id}">
        <span>${escHtml(cat.label)}</span>
        <span class="nav-count">${counts[cat.id] || 0}</span>
      </button>`).join('');
  }

  // ── modal helpers ─────────────────────────────────────────────────────────

  function openModal(title, item, categories) {
    document.getElementById('modal-title').textContent = title;

    // populate category dropdown
    const catSel = document.getElementById('f-category');
    catSel.innerHTML = categories.map(c =>
      `<option value="${c.id}">${escHtml(c.label)}</option>`
    ).join('');

    // reset / populate fields
    const form = document.getElementById('item-form');
    form.reset();
    document.getElementById('f-id').value       = item?.id       || '';
    document.getElementById('f-name').value     = item?.name     || '';
    document.getElementById('f-brand').value    = item?.brand    || '';
    document.getElementById('f-season').value   = item?.season   || 'both';
    document.getElementById('f-fit').value      = item?.fit      || '';
    document.getElementById('f-material').value = item?.material || '';
    document.getElementById('f-color').value    = item?.color    || '#888888';
    document.getElementById('f-colorName').value= item?.colorName|| '';
    document.getElementById('f-condition').value= item?.condition|| 'good';
    document.getElementById('f-rating').value   = item?.rating   || '';
    document.getElementById('f-notes').value    = item?.notes    || '';
    if (item?.category) catSel.value            = item.category;

    document.getElementById('item-modal').classList.add('open');
    document.getElementById('f-name').focus();
  }

  function closeModal() {
    document.getElementById('item-modal').classList.remove('open');
  }

  // ── confirm dialog ────────────────────────────────────────────────────────

  function openConfirm(itemName) {
    document.getElementById('confirm-body').textContent =
      `"${itemName}" will be permanently removed from your wardrobe.`;
    document.getElementById('confirm-overlay').classList.add('open');
  }

  function closeConfirm() {
    document.getElementById('confirm-overlay').classList.remove('open');
  }

  // ── toast ─────────────────────────────────────────────────────────────────

  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ── view switcher ─────────────────────────────────────────────────────────

  function showView(name) {
    ['closet', 'gaps', 'suggestions', 'thrift'].forEach(v => {
      document.getElementById(`view-${v}`).style.display = v === name ? '' : 'none';
    });
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
  }

  // ── util ──────────────────────────────────────────────────────────────────

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formData() {
    return {
      name:      document.getElementById('f-name').value.trim(),
      brand:     document.getElementById('f-brand').value.trim(),
      category:  document.getElementById('f-category').value,
      season:    document.getElementById('f-season').value,
      fit:       document.getElementById('f-fit').value.trim(),
      material:  document.getElementById('f-material').value.trim(),
      color:     document.getElementById('f-color').value,
      colorName: document.getElementById('f-colorName').value.trim(),
      condition: document.getElementById('f-condition').value,
      rating:    parseInt(document.getElementById('f-rating').value) || null,
      notes:     document.getElementById('f-notes').value.trim(),
    };
  }

  return {
    itemCard, renderCloset, renderGaps,
    renderSuggestions, renderThrift,
    updateStats, updateAlertBar, updateCategoryNav,
    openModal, closeModal,
    openConfirm, closeConfirm,
    toast, showView, formData, escHtml,
  };
})();
