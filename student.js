// Student pages. Routed by <body data-page="...">.

function cartTotals(cart = Session.cart) {
  const count = cart.items.reduce((n, i) => n + i.qty, 0);
  const total = cart.items.reduce((n, i) => n + i.qty * i.price, 0);
  return { count, total: Math.round(total * 100) / 100 };
}

function updateCartUi() {
  const { count, total } = cartTotals();
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.textContent = count; badge.classList.toggle('hidden', !count); }
  const btn = document.getElementById('viewCartBtn');
  if (btn) { btn.textContent = `VIEW CART (${count}) - ${money(total)}`; btn.classList.toggle('hidden', !count); }
}

// ---------- dashboard ----------
async function initSdash() {
  const u = requireStudent(); if (!u) return;
  document.getElementById('greeting').textContent = `Hi, ${u.firstName}!`;
  try {
    const fresh = (await API.get(`${TABLES.users}?id=eq.${u.id}&select=balance`))[0];
    if (fresh) { u.balance = Number(fresh.balance ?? 0); Session.user = u; }
  } catch (e) { setAlert(e.message); }
  document.getElementById('balance').textContent = money(u.balance);
}

// ---------- browse vendors ----------
async function initVendors() {
  if (!requireStudent()) return;
  const [vendors, menus] = await Promise.all([
    API.get(`${TABLES.vendors}?select=id,name&order=name`),
    API.get(`${TABLES.menus}?select=vendor_id,item_name`),
  ]);
  const byVendor = {};
  menus.forEach((m) => (byVendor[m.vendor_id] ||= []).push(m.item_name));

  const listEl = document.getElementById('vendorList');
  function render(filter = '') {
    const q = filter.toLowerCase();
    const rows = vendors.filter((v) => v.name.toLowerCase().includes(q));
    listEl.innerHTML = rows.map((v) => {
      const items = byVendor[v.id] || [];
      return `<a class="row" href="menu.html?vendor=${v.id}">
        <div class="thumb">\u{1F374}</div>
        <div class="grow"><h4>${esc(v.name)}</h4><p>${esc(items.slice(0, 3).join(' \u00B7 ') || 'Menu coming soon')}</p></div>
        <span class="pill">${items.length} items</span>
      </a>`;
    }).join('') || '<p class="muted">No vendors found.</p>';
  }
  render();
  document.getElementById('vendorSearch').addEventListener('input', (e) => render(e.target.value));
}

// ---------- vendor menu ----------
async function initMenu() {
  if (!requireStudent()) return;
  const vendorId = Number(new URLSearchParams(location.search).get('vendor'));
  if (!vendorId) { location.href = 'vendors.html'; return; }

  const [vendorArr, items] = await Promise.all([
    API.get(`${TABLES.vendors}?id=eq.${vendorId}&select=*`),
    API.get(`${TABLES.menus}?vendor_id=eq.${vendorId}&select=*&order=item_name`),
  ]);
  const vendor = vendorArr[0];
  if (!vendor) throw new Error('Vendor not found.');
  document.getElementById('vendorName').textContent = vendor.name;

  // Menu / Info / Hours tabs
  document.querySelectorAll('[data-tab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      ['menuSection', 'infoSection', 'hoursSection'].forEach((id) =>
        document.getElementById(id).classList.toggle('hidden', id !== btn.dataset.tab));
    }));

  document.getElementById('infoSection').innerHTML = `
    <div class="card">
      <div class="kv"><span>Address</span><span>${esc(vendor.address || '')}, ${esc(vendor.city || '')} ${esc(vendor.state || '')}</span></div>
      <div class="kv"><span>Phone</span><span>${esc(vendor.phone_number || '')}</span></div>
      <div class="kv"><span>Email</span><span>${esc(vendor.email || '')}</span></div>
    </div>`;

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  try {
    const hours = await API.get(`${TABLES.vendorHours}?vendor_id=eq.${vendorId}&select=*&order=day_of_week`);
    document.getElementById('hoursSection').innerHTML = hours.length
      ? `<div class="card">${hours.map((h) => `
          <div class="kv"><span>${DAY_NAMES[h.day_of_week]}</span>
          <span>${h.is_closed ? 'Closed' : `${esc(h.open_time || '').slice(0, 5)} - ${esc(h.close_time || '').slice(0, 5)}`}</span></div>`).join('')}</div>`
      : '<p class="muted">Hours not posted yet.</p>';
  } catch (e) {
    document.getElementById('hoursSection').innerHTML = '<p class="muted">Hours not posted yet.</p>';
  }

  // Category chips only when the optional category column is populated
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const chipsEl = document.getElementById('chips');
  let activeCat = 'All';
  if (cats.length) {
    chipsEl.innerHTML = ['All', ...cats].map((c) =>
      `<button class="chip ${c === 'All' ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    chipsEl.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      activeCat = b.dataset.cat;
      chipsEl.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b));
      renderItems();
    });
  } else {
    chipsEl.classList.add('hidden');
  }

  const listEl = document.getElementById('menuList');
  function renderItems() {
    const list = activeCat === 'All' ? items : items.filter((i) => i.category === activeCat);
    listEl.innerHTML = list.map((i) => `
      <div class="row">
        <div class="thumb">\u{1F37D}\u{FE0F}</div>
        <div class="grow"><h4>${esc(i.item_name)}</h4><p>${esc(i.item_description || '')}</p></div>
        <div class="item-side"><span class="price">${money(i.item_price)}</span>
        <button class="add-btn" data-id="${i.id}" aria-label="Add ${esc(i.item_name)}">+</button></div>
      </div>`).join('') || '<p class="muted">No items yet.</p>';
  }
  renderItems();

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    const item = items.find((i) => i.id === Number(btn.dataset.id));
    let cart = Session.cart;
    if (cart.vendorId && cart.vendorId !== vendor.id) {
      if (!confirm(`Your cart has items from ${cart.vendorName}. Start a new cart for ${vendor.name}?`)) return;
      cart = { vendorId: null, vendorName: '', items: [] };
    }
    cart.vendorId = vendor.id;
    cart.vendorName = vendor.name;
    const line = cart.items.find((i) => i.id === item.id);
    if (line) line.qty += 1;
    else cart.items.push({ id: item.id, name: item.item_name, price: Number(item.item_price), qty: 1 });
    Session.cart = cart;
    toast(`${item.item_name} added`);
    updateCartUi();
  });

  updateCartUi();
}

// ---------- cart / checkout ----------
async function initCart() {
  const u = requireStudent(); if (!u) return;
  const listEl = document.getElementById('cartList');
  const placeBtn = document.getElementById('placeOrderBtn');

  function render() {
    const cart = Session.cart;
    const { total } = cartTotals(cart);
    listEl.innerHTML = cart.items.map((i) => `
      <div class="row">
        <div class="grow"><h4>${esc(i.name)}</h4><p>${money(i.price)} each</p></div>
        <div class="qty">
          <button data-act="dec" data-id="${i.id}" aria-label="Decrease">\u2212</button>
          <span>${i.qty}</span>
          <button data-act="inc" data-id="${i.id}" aria-label="Increase">+</button>
        </div>
        <button class="remove" data-act="rm" data-id="${i.id}" aria-label="Remove">\u2715</button>
      </div>`).join('') || '<p class="muted">Your cart is empty. <a class="link" href="vendors.html">Browse vendors</a>.</p>';
    document.getElementById('cartTotal').textContent = money(total);
    placeBtn.disabled = !cart.items.length;
  }
  render();

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const cart = Session.cart;
    const line = cart.items.find((i) => i.id === Number(btn.dataset.id));
    if (!line) return;
    if (btn.dataset.act === 'inc') line.qty += 1;
    if (btn.dataset.act === 'dec') line.qty = Math.max(1, line.qty - 1);
    if (btn.dataset.act === 'rm') cart.items = cart.items.filter((i) => i !== line);
    if (!cart.items.length) { cart.vendorId = null; cart.vendorName = ''; }
    Session.cart = cart;
    render();
  });

  async function createOrder(payload, notes) {
    try {
      return await API.insert(TABLES.orders, notes ? { ...payload, notes } : payload);
    } catch (e) {
      // If the optional notes column doesn't exist yet, place the order without it.
      if (notes && /notes/i.test(e.message)) return API.insert(TABLES.orders, payload);
      throw e;
    }
  }

  placeBtn.addEventListener('click', async () => {
    setAlert('');
    const cart = Session.cart;
    const { total } = cartTotals(cart);
    if (!cart.items.length) return;
    try {
      const fresh = (await API.get(`${TABLES.users}?id=eq.${u.id}&select=balance`))[0];
      if (fresh) u.balance = Number(fresh.balance ?? 0);
    } catch (e) { /* fall back to session balance */ }
    if (total > u.balance) {
      setAlert(`Insufficient meal plan balance (${money(u.balance)}). Ask Dining Services to load funds.`);
      return;
    }
    placeBtn.disabled = true;
    placeBtn.textContent = 'PLACING ORDER...';
    try {
      const notes = document.getElementById('notes').value.trim();
      const orderRows = await createOrder({
        user_id: u.id,
        vendor_id: cart.vendorId,
        date_time: new Date().toISOString(),
        status: 'Pending',
        discount: 0,
        total_price: total,
      }, notes);
      const order = orderRows[0];

      await API.insert(TABLES.orderItems, cart.items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.id,
        quantity: i.qty,
        item_price_at_order: i.price,
        item_total_price: Math.round(i.qty * i.price * 100) / 100,
      })));

      const newBalance = Math.round((u.balance - total) * 100) / 100;
      await API.update(TABLES.users, `id=eq.${u.id}`, { balance: newBalance });
      u.balance = newBalance;
      Session.user = u;
      Session.clearCart();
      location.href = `confirm.html?order=${order.id}`;
    } catch (err) {
      setAlert(err.message);
      placeBtn.disabled = false;
      placeBtn.textContent = 'PLACE ORDER';
    }
  });
}

// ---------- order confirmation ----------
async function initConfirm() {
  if (!requireStudent()) return;
  const orderId = Number(new URLSearchParams(location.search).get('order'));
  const order = (await API.get(`${TABLES.orders}?id=eq.${orderId}&select=*`))[0];
  if (!order) throw new Error('Order not found.');
  const [vendor, items] = await Promise.all([
    API.get(`${TABLES.vendors}?id=eq.${order.vendor_id}&select=name`).then((r) => r[0]),
    API.get(`${TABLES.orderItems}?order_id=eq.${orderId}&select=quantity`),
  ]);

  const placed = new Date(order.date_time);
  const eta = new Date((isNaN(placed) ? Date.now() : placed.getTime()) + 20 * 60 * 1000);

  document.getElementById('orderNum').textContent = orderNum(order.id);
  document.getElementById('pickupAt').textContent = vendor ? vendor.name : '';
  document.getElementById('etaTime').textContent = fmtTime(eta);
  document.getElementById('itemCount').textContent = `${items.reduce((n, i) => n + i.quantity, 0)} items`;
  document.getElementById('orderTotal').textContent = money(order.total_price);
  document.getElementById('statusLink').href = `status.html?order=${order.id}`;
}

// ---------- order status (tracking + ready notification) ----------
async function initStatus() {
  if (!requireStudent()) return;
  const orderId = Number(new URLSearchParams(location.search).get('order'));
  document.getElementById('orderNum').textContent = orderNum(orderId);

  let vendorName = '';
  let notified = false;
  let timer = null;

  async function refresh() {
    const order = (await API.get(`${TABLES.orders}?id=eq.${orderId}&select=*`))[0];
    if (!order) throw new Error('Order not found.');
    if (!vendorName) {
      const v = (await API.get(`${TABLES.vendors}?id=eq.${order.vendor_id}&select=name`))[0];
      vendorName = v ? v.name : '';
      document.getElementById('readyVendor').textContent = vendorName;
    }
    const st = normalizeStatus(order.status);
    if (st === 'Cancelled') {
      document.getElementById('etaTime').textContent = 'Cancelled';
      clearInterval(timer);
      return;
    }
    const idx = STATUS_FLOW.indexOf(st);
    document.querySelectorAll('.step').forEach((el, i) => el.classList.toggle('done', i <= idx));

    if (idx >= 2) {
      document.getElementById('etaTime').textContent = 'Now';
    } else {
      const placed = new Date(order.date_time);
      const eta = new Date((isNaN(placed) ? Date.now() : placed.getTime()) + 20 * 60 * 1000);
      document.getElementById('etaTime').textContent = fmtTime(eta);
    }
    if (st === 'Ready' && !notified) {
      notified = true;
      document.getElementById('readyNum').textContent = orderNum(orderId);
      document.getElementById('readyOverlay').classList.remove('hidden');
    }
    if (st === 'Complete') clearInterval(timer);
  }

  document.getElementById('gotIt').addEventListener('click', () =>
    document.getElementById('readyOverlay').classList.add('hidden'));

  await refresh();
  timer = setInterval(() => refresh().catch(() => {}), 5000);
}

// ---------- my orders / history ----------
async function initOrders() {
  const u = requireStudent(); if (!u) return;
  const [orders, vendors] = await Promise.all([
    API.get(`${TABLES.orders}?user_id=eq.${u.id}&select=*&order=date_time.desc,id.desc`),
    API.get(`${TABLES.vendors}?select=id,name`),
  ]);
  const vname = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  const isActive = (o) => ['Pending', 'Preparing', 'Ready'].includes(normalizeStatus(o.status));

  let tab = location.hash === '#history' ? 'history' : 'active';
  const listEl = document.getElementById('ordersList');

  function render() {
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const rows = orders.filter((o) => (tab === 'active' ? isActive(o) : !isActive(o)));
    listEl.innerHTML = rows.map((o) => {
      const st = normalizeStatus(o.status);
      return `<a class="row" href="status.html?order=${o.id}">
        <div class="grow"><h4>${orderNum(o.id)} \u00B7 ${esc(vname[o.vendor_id] || 'Vendor')}</h4>
        <p>${fmtDate(o.date_time)} \u00B7 ${money(o.total_price)}</p></div>
        <span class="pill ${st.toLowerCase()}">${st}</span>
      </a>`;
    }).join('') || `<p class="muted">${tab === 'active' ? 'No active orders. Hungry?' : 'No past orders yet.'}</p>`;
  }
  render();

  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
}

// ---------- meal plan / balance ----------
async function initMealplan() {
  const u = requireStudent(); if (!u) return;
  const [freshArr, orders, vendors] = await Promise.all([
    API.get(`${TABLES.users}?id=eq.${u.id}&select=balance`),
    API.get(`${TABLES.orders}?user_id=eq.${u.id}&select=*&order=date_time.desc,id.desc&limit=15`),
    API.get(`${TABLES.vendors}?select=id,name`),
  ]);
  if (freshArr[0]) { u.balance = Number(freshArr[0].balance ?? 0); Session.user = u; }
  const vname = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  document.getElementById('balance').textContent = money(u.balance);
  document.getElementById('lastUpdated').textContent =
    `Last updated: ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${fmtTime(new Date())}`;

  document.getElementById('activityList').innerHTML = orders
    .filter((o) => normalizeStatus(o.status) !== 'Cancelled')
    .map((o) => `<div class="row">
        <div class="grow"><h4>${esc(vname[o.vendor_id] || 'Vendor')}</h4><p>${fmtDate(o.date_time)}</p></div>
        <span class="price">-${money(o.total_price)}</span>
      </div>`).join('') || '<p class="muted">No activity yet.</p>';

  document.getElementById('detailsSection').innerHTML = `
    <div class="card">
      <div class="kv"><span>Name</span><span>${esc(u.firstName)} ${esc(u.lastName)}</span></div>
      <div class="kv"><span>Email</span><span>${esc(u.email)}</span></div>
      <div class="kv"><span>Plan type</span><span>Standard Meal Plan</span></div>
      <div class="kv"><span>Balance</span><span>${money(u.balance)}</span></div>
    </div>`;

  document.querySelectorAll('[data-tab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('activitySection').classList.toggle('hidden', btn.dataset.tab !== 'activitySection');
      document.getElementById('detailsSection').classList.toggle('hidden', btn.dataset.tab !== 'detailsSection');
    }));
}

document.addEventListener('DOMContentLoaded', () => {
  const map = {
    sdash: initSdash, vendors: initVendors, menu: initMenu, cart: initCart,
    confirm: initConfirm, status: initStatus, orders: initOrders, mealplan: initMealplan,
  };
  const fn = map[document.body.dataset.page];
  if (fn) fn().catch((err) => setAlert(err.message));
});
