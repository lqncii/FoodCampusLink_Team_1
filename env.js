// Loads config from the .env file served alongside the site.
const Env = (() => {
  let vars = null;

  async function load() {
    if (vars) return vars;
    const res = await fetch('.env', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('.env not found. Serve the site from the project root (e.g. python -m http.server).');
    }
    vars = {};
    (await res.text()).split('\n').forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const i = line.indexOf('=');
      if (i > 0) vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return vars;
  }

  return { load };
})();
