/*
 * Hash router. Routes:
 *   #/            home
 *   #/journal     new entry
 *   #/journal/ID  edit an entry
 *   #/history     all entries
 *   #/history/ID  all entries, with one opened
 *   #/patterns    possible patterns and charts
 *   #/about       how the AI works
 */
window.EJ = window.EJ || {};

(function () {
  const views = {
    home: { el: 'view-home' },
    journal: { el: 'view-journal', show: (id) => EJ.views.journal.show(id) },
    history: { el: 'view-history', show: (id) => EJ.views.history.show(id) },
    patterns: { el: 'view-patterns', show: () => EJ.views.patterns.show() },
    about: { el: 'view-about' }
  };

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const name = views[parts[0]] ? parts[0] : 'home';
    Object.entries(views).forEach(([key, v]) => { document.getElementById(v.el).hidden = key !== name; });
    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.view === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (views[name].show) views[name].show(parts[1] ? decodeURIComponent(parts[1]) : null);
    window.scrollTo(0, 0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    EJ.views.journal.init();
    EJ.views.history.init();
    EJ.views.patterns.init();

    document.getElementById('reset-btn').addEventListener('click', (ev) => {
      const btn = ev.currentTarget;
      if (btn.dataset.armed) {
        EJ.store.reset();
        delete btn.dataset.armed;
        btn.textContent = 'Reset the sample journal';
        EJ.util.toast('The sample journal has been restored.', { href: '#/history', label: 'View history' });
      } else {
        btn.dataset.armed = '1';
        btn.textContent = 'This removes your own entries. Reset?';
      }
    });

    window.addEventListener('hashchange', route);
    route();
  });
})();
