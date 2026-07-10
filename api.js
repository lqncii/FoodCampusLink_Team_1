// Thin client for the Neon Data API (PostgREST-compatible).
// Table names are centralized so a schema rename is a one-line change.
const TABLES = {
  roles: 'roles',
  users: 'users',
  vendors: 'vendors',
  menus: 'menus',
  orders: 'orders',
  orderItems: 'order_items',
  vendorHours: 'vendor_hours',
};

const API = (() => {
  let base = null;
  let key = '';
  let useAuthHeader = true; // flips off if the server rejects the bearer token

  async function init() {
    if (base) return;
    const env = await Env.load();
    base = (env.API_BASE_URL || '').replace(/\/+$/, '');
    key = env.API_KEY || '';
    if (!base) throw new Error('API_BASE_URL is missing from .env');
    if (!key) useAuthHeader = false;
  }

  async function request(method, path, { body, prefer } = {}) {
    await init();
    const doFetch = (withAuth) => {
      const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (withAuth) headers.Authorization = `Bearer ${key}`;
      if (prefer) headers.Prefer = prefer;
      return fetch(`${base}/${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    };

    let res = await doFetch(useAuthHeader);
    // A napi_ management key is not a Data API JWT; fall back to anonymous access.
    if (res.status === 401 && useAuthHeader) {
      const retry = await doFetch(false);
      if (retry.ok) useAuthHeader = false;
      res = retry.ok ? retry : res;
    }

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (_) { /* ignore */ }
      throw new Error(`${method} ${path.split('?')[0]} failed (${res.status})${detail ? ': ' + detail : ''}`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    get: (path) => request('GET', path),
    insert: (table, rows) => request('POST', table, { body: rows, prefer: 'return=representation' }),
    upsert: (table, rows, conflictCols) =>
      request('POST', `${table}?on_conflict=${conflictCols}`, {
        body: rows,
        prefer: 'resolution=merge-duplicates,return=representation',
      }),
    update: (table, filter, patch) =>
      request('PATCH', `${table}?${filter}`, { body: patch, prefer: 'return=representation' }),
    remove: (table, filter) => request('DELETE', `${table}?${filter}`),
  };
})();
