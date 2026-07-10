// Vendor pages. Routed by <body data-page="...">.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function statusPill(status) {
  const st = normalizeStatus(status);
  return `<span class="pill ${st.toLowerCase()}">${st}</span>`;
}

// ---------- dashboard ----------
async function initVdash() {
  const ctx = requireVendor(); if (!ctx) return;
  document.getElementById('greeting').textContent = `Hi, ${ctx.firstName}!`;
  document.getElementById('vendorName').textContent = ctx.vendorName;

  const orders = await API.get(
    `${TABLES.orders}?vendor_id=eq.${ctx.vendorId}&date_time=gte.${todayISO()}&select=*&order=date_time.desc,id.desc&limit=3`);
  document.getElementById('todayOrders').innerHTML = orders.map((o) => `
    <a class="row" href="vorders.html">
      <div class="grow"><h4>${orderNum(o.id)}</h4><p>${fmtWhen(o.date_time)} \u00B7 ${money(o.total_price)}</p></div>
      ${statusPill(o.status)}
    </a>`).join('') || '<p class="muted">No orders yet today.</p>';
}

// ---------- orders ----------
async function initVorders() {
  const ctx = requireVendor(); if (!ctx) return;
  const listEl = document.getElementById('ordersList');

  async function load() {
    const [orders, users] = await Promise.all([
      API.get(`${TABLES.orders}?vendor_id=eq.${ctx.vendorId}&select=*&order=date_time.desc,id.desc&limit=40`),
      API.get(`${TABLES.users}?select=id,first_name,last_name`),
    ]);
    const uname = Object.fromEntries(users.map((u) => [u.id, `${u.first_name} ${u.last_name[0]}.`]));

    listEl.innerHTML = orders.map((o) => {
      const st = normalizeStatus(o.status);
      const idx = STATUS_FLOW.indexOf(st);
      const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
      const actions = st === 'Cancelled' || st === 'Complete' ? '' : `
        ${next ? `<button class="btn btn-primary btn-small" data-advance="${o.id}" data-next="${next}">MARK ${next.toUpperCase()}</button>` : ''}
        ${st === 'Pending' ? `<button class="btn btn-ghost btn-small" data-cancel="${o.id}">CANCEL</button>` : ''}`;
      return `<div class="row row-stack">
        <div class="row-top">
          <div class="grow"><h4>${orderNum(o.id)} \u00B7 ${esc(uname[o.user_id] || 'Student')}</h4>
          <p>${fmtDate(o.date_time)} ${fmtWhen(o.date_time)} \u00B7 ${money(o.total_price)}${o.notes ? ` \u00B7 \u201C${esc(o.notes)}\u201D` : ''}</p></div>
          ${statusPill(o.status)}
        </div>
        ${actions ? `<div class="row-actions">${actions}</div>` : ''}
      </div>`;
    }).join('') || '<p class="muted">No orders yet.</p>';
  }
  await load();

  listEl.addEventListener('click', async (e) => {
    const adv = e.target.closest('[data-advance]');
    const can = e.target.closest('[data-cancel]');
    try {
      if (adv) {
        await API.update(TABLES.orders, `id=eq.${adv.dataset.advance}`, { status: adv.dataset.next });
        toast(`Order marked ${adv.dataset.next}`);
        await load();
      } else if (can && confirm('Cancel this order?')) {
        await API.update(TABLES.orders, `id=eq.${can.dataset.cancel}`, { status: 'Cancelled' });
        toast('Order cancelled');
        await load();
      }
    } catch (err) { setAlert(err.message); }
  });
}

// ---------- menu editor ----------
async function initVmenu() {
  const ctx = requireVendor(); if (!ctx) return;
  const listEl = document.getElementById('menuItems');
  let items = [];

  async function load() {
    items = await API.get(`${TABLES.menus}?vendor_id=eq.${ctx.vendorId}&select=*&order=item_name`);
    listEl.innerHTML = items.map((i) => `
      <div class="row row-stack" data-item="${i.id}">
        <div class="row-top">
          <div class="grow"><h4>${esc(i.item_name)}</h4><p>${esc(i.item_description || '')}</p></div>
          <span class="price">${money(i.item_price)}</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-ghost btn-small" data-edit="${i.id}">EDIT</button>
          <button class="btn btn-ghost btn-small" data-delete="${i.id}">DELETE</button>
        </div>
        <form class="edit-form hidden" data-form="${i.id}">
          <div class="field"><label>Name</label><input name="item_name" value="${esc(i.item_name)}" required></div>
          <div class="field"><label>Description</label><input name="item_description" value="${esc(i.item_description || '')}"></div>
          <div class="field"><label>Price</label><input name="item_price" type="number" step="0.01" min="0" value="${Number(i.item_price)}" required></div>
          <div class="row-actions">
            <button type="submit" class="btn btn-primary btn-small">SAVE</button>
            <button type="button" class="btn btn-ghost btn-small" data-cancel-edit="${i.id}">CANCEL</button>
          </div>
        </form>
      </div>`).join('') || '<p class="muted">No menu items yet. Add your first one above.</p>';
  }
  await load();

  document.getElementById('addItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('');
    const f = e.target;
    const payload = {
      vendor_id: ctx.vendorId,
      item_name: f.item_name.value.trim(),
      item_description: f.item_description.value.trim(),
      item_price: Number(f.item_price.value),
    };
    const category = f.category.value.trim();
    try {
      try {
        await API.insert(TABLES.menus, category ? { ...payload, category } : payload);
      } catch (err) {
        if (category && /category/i.test(err.message)) await API.insert(TABLES.menus, payload);
        else throw err;
      }
      f.reset();
      toast('Item added');
      await load();
    } catch (err) { setAlert(err.message); }
  });

  listEl.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    const cancel = e.target.closest('[data-cancel-edit]');
    if (edit) listEl.querySelector(`[data-form="${edit.dataset.edit}"]`).classList.toggle('hidden');
    if (cancel) listEl.querySelector(`[data-form="${cancel.dataset.cancelEdit}"]`).classList.add('hidden');
    if (del && confirm('Delete this menu item?')) {
      try {
        await API.remove(TABLES.menus, `id=eq.${del.dataset.delete}`);
        toast('Item deleted');
        await load();
      } catch (err) {
        setAlert(/foreign key|violates/i.test(err.message)
          ? 'This item is part of past orders and cannot be deleted. Edit its price or name instead.'
          : err.message);
      }
    }
  });

  listEl.addEventListener('submit', async (e) => {
    const form = e.target.closest('.edit-form');
    if (!form) return;
    e.preventDefault();
    try {
      await API.update(TABLES.menus, `id=eq.${form.dataset.form}`, {
        item_name: form.item_name.value.trim(),
        item_description: form.item_description.value.trim(),
        item_price: Number(form.item_price.value),
      });
      toast('Item updated');
      await load();
    } catch (err) { setAlert(err.message); }
  });
}

// ---------- business hours ----------
async function initVhours() {
  const ctx = requireVendor(); if (!ctx) return;
  const listEl = document.getElementById('hoursList');
  const saveBtn = document.getElementById('saveHoursBtn');
  let existing = [];

  try {
    existing = await API.get(`${TABLES.vendorHours}?vendor_id=eq.${ctx.vendorId}&select=*`);
  } catch (e) {
    setAlert('Business hours table not found. Run sql/schema_additions.sql in the Neon SQL Editor, then reload this page.');
    saveBtn.disabled = true;
  }
  const byDay = Object.fromEntries(existing.map((h) => [h.day_of_week, h]));

  listEl.innerHTML = DAY_NAMES.map((name, d) => {
    const h = byDay[d] || {};
    return `<div class="row hours-row" data-day="${d}">
      <span class="day-label">${name}</span>
      <input type="time" name="open" value="${(h.open_time || '09:00').slice(0, 5)}" ${h.is_closed ? 'disabled' : ''}>
      <span class="muted">to</span>
      <input type="time" name="close" value="${(h.close_time || '17:00').slice(0, 5)}" ${h.is_closed ? 'disabled' : ''}>
      <label class="closed-label"><input type="checkbox" name="closed" ${h.is_closed ? 'checked' : ''}> Closed</label>
    </div>`;
  }).join('');

  listEl.addEventListener('change', (e) => {
    if (e.target.name !== 'closed') return;
    const row = e.target.closest('.hours-row');
    row.querySelectorAll('input[type=time]').forEach((i) => (i.disabled = e.target.checked));
  });

  saveBtn.addEventListener('click', async () => {
    setAlert('');
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
    try {
      const rows = [...listEl.querySelectorAll('.hours-row')].map((row) => {
        const closed = row.querySelector('[name=closed]').checked;
        return {
          vendor_id: ctx.vendorId,
          day_of_week: Number(row.dataset.day),
          open_time: closed ? null : row.querySelector('[name=open]').value,
          close_time: closed ? null : row.querySelector('[name=close]').value,
          is_closed: closed,
        };
      });
      await API.upsert(TABLES.vendorHours, rows, 'vendor_id,day_of_week');
      toast('Hours saved');
    } catch (err) { setAlert(err.message); }
    saveBtn.disabled = false;
    saveBtn.textContent = 'SAVE HOURS';
  });
}

// ---------- reports ----------
async function initVreports() {
  const ctx = requireVendor(); if (!ctx) return;
  const orders = await API.get(`${TABLES.orders}?vendor_id=eq.${ctx.vendorId}&select=*&order=date_time.desc`);
  const valid = orders.filter((o) => normalizeStatus(o.status) !== 'Cancelled');
  const today = todayISO();
  const todays = valid.filter((o) => String(o.date_time || '').slice(0, 10) >= today);

  const sum = (arr) => arr.reduce((n, o) => n + Number(o.total_price || 0), 0);
  document.getElementById('mToday').textContent = todays.length;
  document.getElementById('mTodayRev').textContent = money(sum(todays));
  document.getElementById('mPending').textContent =
    orders.filter((o) => normalizeStatus(o.status) === 'Pending').length;
  document.getElementById('mAllRev').textContent = money(sum(valid));

  const counts = {};
  orders.forEach((o) => {
    const st = normalizeStatus(o.status);
    counts[st] = (counts[st] || 0) + 1;
  });
  document.getElementById('statusBreakdown').innerHTML = Object.entries(counts)
    .map(([st, n]) => `<span class="pill ${st.toLowerCase()}">${st}: ${n}</span>`).join(' ') ||
    '<p class="muted">No orders yet.</p>';

  // Top items by quantity
  const ids = valid.slice(0, 100).map((o) => o.id);
  const topEl = document.getElementById('topItems');
  if (!ids.length) { topEl.innerHTML = '<p class="muted">No order data yet.</p>'; return; }
  const [lines, menus] = await Promise.all([
    API.get(`${TABLES.orderItems}?order_id=in.(${ids.join(',')})&select=menu_item_id,quantity`),
    API.get(`${TABLES.menus}?vendor_id=eq.${ctx.vendorId}&select=id,item_name`),
  ]);
  const names = Object.fromEntries(menus.map((m) => [m.id, m.item_name]));
  const qty = {};
  lines.forEach((l) => { qty[l.menu_item_id] = (qty[l.menu_item_id] || 0) + l.quantity; });
  const top = Object.entries(qty)
    .map(([id, q]) => ({ name: names[id] || `Item ${id}`, q }))
    .sort((a, b) => b.q - a.q)
    .slice(0, 5);
  const max = top[0]?.q || 1;
  topEl.innerHTML = top.map((t) => `
    <div class="bar-row">${esc(t.name)} \u00B7 ${t.q} sold
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((t.q / max) * 100)}%"></div></div>
    </div>`).join('') || '<p class="muted">No line-item data yet.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  const map = { vdash: initVdash, vorders: initVorders, vmenu: initVmenu, vhours: initVhours, vreports: initVreports };
  const fn = map[document.body.dataset.page];
  if (fn) fn().catch((err) => setAlert(err.message));
});
