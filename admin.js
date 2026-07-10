// Admin: manage meal plan balances (Dining Services).

async function initAdash() {
  const admin = requireAdmin(); if (!admin) return;
  document.getElementById('greeting').textContent = `Hi, ${admin.firstName}!`;

  const roleId = await getRoleId('user');
  const students = await API.get(
    `${TABLES.users}?role=eq.${roleId}&select=id,first_name,last_name,email,balance&order=last_name`);

  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('totalBalance').textContent =
    money(students.reduce((n, s) => n + Number(s.balance || 0), 0));

  const listEl = document.getElementById('studentList');
  listEl.innerHTML = students.map((s) => `
    <div class="row row-stack">
      <div class="row-top">
        <div class="grow"><h4>${esc(s.first_name)} ${esc(s.last_name)}</h4><p>${esc(s.email)}</p></div>
      </div>
      <div class="row-actions">
        <input type="number" step="0.01" min="0" value="${Number(s.balance || 0).toFixed(2)}" data-balance="${s.id}">
        <button class="btn btn-primary btn-small" data-save="${s.id}">SAVE</button>
      </div>
    </div>`).join('') || '<p class="muted">No student accounts found.</p>';

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-save]');
    if (!btn) return;
    const input = listEl.querySelector(`[data-balance="${btn.dataset.save}"]`);
    try {
      await API.update(TABLES.users, `id=eq.${btn.dataset.save}`, { balance: Number(input.value) });
      toast('Balance updated');
    } catch (err) { setAlert(err.message); }
  });

  document.getElementById('adminLogout').addEventListener('click', (e) => {
    e.preventDefault();
    Session.logout();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'adash') initAdash().catch((err) => setAlert(err.message));
});
