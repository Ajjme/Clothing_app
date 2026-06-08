/* app.js — main controller: state, events, orchestration */

const App = (() => {
  // ── state ──────────────────────────────────────────────────────────────────
  let state = {
    items:      [],
    categories: [],
    season:     'all',
    view:       'closet',
    deleteTargetId: null,
  };

  // ── boot ───────────────────────────────────────────────────────────────────
  async function init() {
    try {
      const [items, categories, stats] = await Promise.all([
        API.getItems(),
        API.getCategories(),
        API.getStats(),
      ]);
      state.items      = items;
      state.categories = categories;

      UI.updateStats(stats, categories);
      UI.updateAlertBar(items);
      UI.updateCategoryNav(items, categories);

      renderCurrentView();
      bindEvents();
    } catch (err) {
      console.error('Init error:', err);
      UI.toast('Could not connect to server. Is it running?', 'error');
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  function renderCurrentView() {
    UI.showView(state.view);
    switch (state.view) {
      case 'closet':      UI.renderCloset(state.items, state.categories, state.season); break;
      case 'gaps':        UI.renderGaps(state.items, state.categories);                 break;
      case 'suggestions': UI.renderSuggestions();                                       break;
      case 'thrift':      UI.renderThrift();                                            break;
    }
  }

  async function refreshData() {
    const [items, stats] = await Promise.all([
      API.getItems(),
      API.getStats(),
    ]);
    state.items = items;
    UI.updateStats(stats, state.categories);
    UI.updateAlertBar(items);
    UI.updateCategoryNav(items, state.categories);
    renderCurrentView();
  }

  // ── events ─────────────────────────────────────────────────────────────────
  function bindEvents() {

    // season toggle
    document.querySelectorAll('.season-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.season = btn.dataset.season;
        if (state.view === 'closet') UI.renderCloset(state.items, state.categories, state.season);
      });
    });

    // top-level nav (view switcher)
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.view = btn.dataset.view;
        renderCurrentView();
      });
    });

    // category scroll links (sidebar)
    document.getElementById('category-nav').addEventListener('click', e => {
      const btn = e.target.closest('[data-scroll-cat]');
      if (!btn) return;
      // switch to closet view first if not there
      if (state.view !== 'closet') {
        state.view = 'closet';
        renderCurrentView();
      }
      setTimeout(() => {
        const target = document.getElementById(`cat-${btn.dataset.scrollCat}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });

    // global "Add Item" button in topbar
    document.getElementById('btn-add-item').addEventListener('click', () => {
      UI.openModal('Add Item', null, state.categories);
    });

    // "Add X" buttons inside each category grid
    document.getElementById('view-closet').addEventListener('click', e => {
      const addBtn = e.target.closest('.btn-add-in-cat');
      if (addBtn) {
        UI.openModal('Add Item', { category: addBtn.dataset.category }, state.categories);
        return;
      }

      const editBtn = e.target.closest('.btn-edit');
      if (editBtn) {
        const item = state.items.find(i => i.id === editBtn.dataset.id);
        if (item) UI.openModal('Edit Item', item, state.categories);
        return;
      }

      const delBtn = e.target.closest('.btn-delete');
      if (delBtn) {
        state.deleteTargetId = delBtn.dataset.id;
        const item = state.items.find(i => i.id === delBtn.dataset.id);
        UI.openConfirm(item?.name || 'this item');
      }
    });

    // modal: close buttons
    document.getElementById('modal-close').addEventListener('click', UI.closeModal);
    document.getElementById('modal-cancel').addEventListener('click', UI.closeModal);
    document.getElementById('item-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) UI.closeModal();
    });

    // modal: form submit (create or update)
    document.getElementById('item-form').addEventListener('submit', async e => {
      e.preventDefault();
      const data = UI.formData();
      const id   = document.getElementById('f-id').value;

      const submitBtn = document.getElementById('modal-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      try {
        if (id) {
          await API.updateItem(id, data);
          UI.toast(`"${data.name}" updated`);
        } else {
          await API.createItem(data);
          UI.toast(`"${data.name}" added to your wardrobe`);
        }
        UI.closeModal();
        await refreshData();
      } catch (err) {
        UI.toast('Save failed: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Item';
      }
    });

    // confirm: cancel
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      state.deleteTargetId = null;
      UI.closeConfirm();
    });
    document.getElementById('confirm-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        state.deleteTargetId = null;
        UI.closeConfirm();
      }
    });

    // confirm: delete
    document.getElementById('confirm-delete').addEventListener('click', async () => {
      if (!state.deleteTargetId) return;
      const item = state.items.find(i => i.id === state.deleteTargetId);
      try {
        await API.deleteItem(state.deleteTargetId);
        UI.toast(`"${item?.name || 'Item'}" removed`, 'success');
        state.deleteTargetId = null;
        UI.closeConfirm();
        await refreshData();
      } catch (err) {
        UI.toast('Delete failed: ' + err.message, 'error');
      }
    });

    // keyboard: close modals on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        UI.closeModal();
        UI.closeConfirm();
      }
    });
  }

  return { init };
})();

// kick off
document.addEventListener('DOMContentLoaded', App.init);
