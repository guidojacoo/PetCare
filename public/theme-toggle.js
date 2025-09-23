(() => {
  const KEY = 'petcare_theme';
  const root = document.documentElement; // <html>

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    // Botón de texto (opcional)
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.textContent = isDark ? '☀️ Claro' : '🌙 Oscuro';
      btn.classList.toggle('is-dark', isDark);
    }
    // Switch animado (input checkbox)
    const sw = document.getElementById('theme-switch');
    if (sw) {
      sw.checked = isDark;
      sw.setAttribute('aria-checked', String(isDark));
    }
  }

  function currentTheme() {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(KEY, theme);
    applyTheme(theme);
  }

  // Inicial
  setTheme(currentTheme());

  // Conectar controles cuando estén en el DOM
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    if (btn && !btn.__bound) {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
      btn.__bound = true;
    }

    const sw = document.getElementById('theme-switch');
    if (sw && !sw.__bound) {
      sw.addEventListener('change', (e) => {
        setTheme(e.target.checked ? 'dark' : 'light');
      });
      sw.__bound = true;
    }

    // Sincroniza estados visuales por si el HTML cargó antes
    applyTheme(currentTheme());
  });
})();
