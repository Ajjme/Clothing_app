/* api.js — all communication with the Express backend */

const API = (() => {
  const BASE = '/api';

  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    // Items
    getItems:     (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/items${qs ? '?' + qs : ''}`);
    },
    getItem:      (id)          => request('GET',    `/items/${id}`),
    createItem:   (data)        => request('POST',   '/items', data),
    updateItem:   (id, data)    => request('PUT',    `/items/${id}`, data),
    deleteItem:   (id)          => request('DELETE', `/items/${id}`),

    // Meta
    getCategories: ()           => request('GET', '/categories'),
    getStats:      ()           => request('GET', '/stats'),
  };
})();
