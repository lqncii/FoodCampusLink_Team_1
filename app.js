// Shared session state, UI helpers, and auth flows.

const ROLE_TITLES = { student: 'user', vendor: 'vendor_role', admin: 'admin' };
const STATUS_FLOW = ['Pending', 'Preparing', 'Ready', 'Complete'];

const Session = {
  get user() { return JSON.parse(sessionStorage.getItem('cfl_user') || 'null'); },
  set user(u) { u ? sessionStorage.setItem('cfl_user', JSON.stringify(u)) : sessionStorage.removeItem('cfl_user'); },
  get vendorCtx() { return JSON.parse(sessionStorage.getItem('cfl_vendor') || 'null'); },
  set vendorCtx(v) { v ? sessionStorage.setItem('cfl_vendor', JSON.stringify(v)) : sessionStorage.removeItem('cfl_vendor'); },
  get cart() { return JSON.parse(sessionStorage.getItem('cfl_cart') || '{"vendorId":null,"vendorName":"","items":[]}'); },
  set cart(c) { sessionStorage.setItem('cfl_cart', JSON.stringify(c)); },
  clearCart() { sessionStorage.removeItem('cfl_cart'); },
  logout() { sessionStorage.clear(); location.href = 'index.html'; },
};

// ---------- small helpers ----------
function money(n) { return '$' + Number(n || 0).toFixed(2); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function normalizeStatus(s) {
  s = s || 'Pending';
  if (s === 'Processing') return 'Preparing';
  if (s === 'Delivered') return 'Complete';
  return s;
}
function fmtTime(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function fmtDate(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function fmtWhen(value) {
  return String(value || '').length <= 10 ? fmtDate(value) : fmtTime(value);
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function orderNum(id) { return '#A' + String(id).padStart(5, '0'); }

function setAlert(msg) {
  const el = document.getElementById('alert');
  if (!el) { if (msg) alert(msg); return; }
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}
function toast(msg, ms = 2400) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// ---------- route guards ----------
function requireStudent() {
  const u = Session.user;
  if (!u || u.roleTitle !== 'user') { location.href = 'login.html'; return null; }
  return u;
}
function requireVendor() {
  const v = Session.vendorCtx;
  if (!v) { location.href = 'login.html'; return null; }
  return v;
}
function requireAdmin() {
  const u = Session.user;
  if (!u || u.roleTitle !== 'admin') { location.href = 'login.html'; return null; }
  return u;
}

// ---------- bottom navigation (full-width footer) ----------
const NAVS = {
  student: [
    { label: 'Home', icon: '\u{1F3E0}', href: 'sdash.html' },
    { label: 'Orders', icon: '\u{1F6D2}', href: 'orders.html' },
    { label: 'Wallet', icon: '\u{1F4B3}', href: 'mealplan.html' },
    { label: 'Profile', icon: '\u{1F464}', href: '#', action: 'logout' },
  ],
  vendor: [
    { label: 'Home', icon: '\u{1F3E0}', href: 'vdash.html' },
    { label: 'Orders', icon: '\u{1F37D}\u{FE0F}', href: 'vorders.html' },
    { label: 'Menu', icon: '\u{1F4DC}', href: 'vmenu.html' },
    { label: 'More', icon: '\u{22EF}', href: '#', action: 'logout' },
  ],
};

function renderBottomNav() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const kind = nav.dataset.nav || 'student';
  const active = nav.dataset.active || '';
  nav.innerHTML = (NAVS[kind] || []).map((i) => `
    <a href="${i.href}" class="nav-item ${i.label === active ? 'active' : ''}" ${i.action ? `data-action="${i.action}"` : ''}>
      <span class="nav-icon">${i.icon}</span>${i.label}
    </a>`).join('');
  nav.querySelectorAll('[data-action="logout"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Log out of CampusFoodLink?')) Session.logout();
    }));
}

function wireBackLinks() {
  document.querySelectorAll('[data-action="back"]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (history.length > 1) history.back();
      else location.href = el.dataset.fallback || 'index.html';
    }));
}

// ---------- auth ----------
async function getRoleId(title) {
  const roles = await API.get(`${TABLES.roles}?select=id,title`);
  const r = roles.find((x) => x.title === title);
  if (!r) throw new Error(`Role "${title}" is missing from the roles table.`);
  return r.id;
}

async function login(roleKey, email, password, vendorId) {
  const roleId = await getRoleId(ROLE_TITLES[roleKey]);
  const users = await API.get(`${TABLES.users}?email=eq.${encodeURIComponent(email)}&select=*`);
  const user = users[0];
  if (!user) throw new Error('No account found for that email.');
  if (user.role !== roleId) throw new Error(`That account does not have ${roleKey} access.`);

  // Seed data stores bcrypt-style stubs the browser can't verify, so those
  // accounts are accepted as simulated logins (per packet: auth is simulated only).
  const stored = user.password || '';
  if (!stored.startsWith('$2') && stored !== password) throw new Error('Incorrect password.');

  Session.user = {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    balance: Number(user.balance ?? 0),
    roleTitle: ROLE_TITLES[roleKey],
  };

  if (roleKey === 'vendor') {
    if (!vendorId) throw new Error('Select the vendor location you represent.');
    const v = (await API.get(`${TABLES.vendors}?id=eq.${vendorId}&select=id,name`))[0];
    if (!v) throw new Error('Select the vendor location you represent.');
    Session.vendorCtx = { vendorId: v.id, vendorName: v.name, userId: user.id, firstName: user.first_name };
    location.href = 'vdash.html';
  } else if (roleKey === 'admin') {
    location.href = 'adash.html';
  } else {
    location.href = 'sdash.html';
  }
}

function initSplash() {
  const overlay = document.getElementById('learnOverlay');
  document.getElementById('learnMore')?.addEventListener('click', () => overlay.classList.remove('hidden'));
  overlay?.querySelector('[data-close]')?.addEventListener('click', () => overlay.classList.add('hidden'));
}

function initLogin() {
  let selectedRole = null;
  const form = document.getElementById('loginForm');
  const vendorField = document.getElementById('vendorField');
  const vendorSelect = document.getElementById('vendorSelect');

  async function populateVendors() {
    if (vendorSelect.options.length > 1) return;
    const vendors = await API.get(`${TABLES.vendors}?select=id,name&order=name`);
    vendors.forEach((v) => vendorSelect.append(new Option(v.name, v.id)));
  }

  document.querySelectorAll('.role-card').forEach((card) => {
    card.addEventListener('click', async () => {
      selectedRole = card.dataset.role;
      document.querySelectorAll('.role-card').forEach((c) => c.classList.toggle('selected', c === card));
      document.getElementById('roleLabel').textContent = selectedRole.toUpperCase();
      form.classList.remove('hidden');
      vendorField.classList.toggle('hidden', selectedRole !== 'vendor');
      setAlert('');
      if (selectedRole === 'vendor') {
        try { await populateVendors(); } catch (e) { setAlert('Could not load vendors: ' + e.message); }
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'CHECKING...';
    try {
      await login(
        selectedRole,
        document.getElementById('email').value.trim(),
        document.getElementById('password').value,
        vendorSelect.value
      );
    } catch (err) {
      setAlert(err.message);
      btn.disabled = false;
      btn.textContent = 'LOG IN';
    }
  });
}

function initSignup() {
  const form = document.getElementById('signupForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'CREATING...';
    try {
      const roleId = await getRoleId('user');
      const rows = await API.insert(TABLES.users, {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        date_birth: document.getElementById('dob').value,
        phone_number: document.getElementById('phone').value.trim(),
        role: roleId,
      });
      const user = rows[0];
      Session.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        balance: Number(user.balance ?? 0),
        roleTitle: 'user',
      };
      toast('Account created!');
      location.href = 'sdash.html';
    } catch (err) {
      setAlert(/duplicate|409/i.test(err.message) ? 'An account with that email already exists.' : err.message);
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderBottomNav();
  wireBackLinks();
  const page = document.body.dataset.page;
  if (page === 'splash') initSplash();
  if (page === 'login') initLogin();
  if (page === 'signup') initSignup();
});
