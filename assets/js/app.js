/*
 * Page structure: Journal, History and Patterns are sections of one
 * continuous scroll; About is a separate view. The hash is a plain anchor
 * (#journal, #history, #patterns, #about) so links into the page work
 * everywhere, including inside embedded previews.
 */
window.EJ = window.EJ || {};

EJ.app = (function () {
  const SECTIONS = ['journal', 'history', 'patterns'];
  const $ = (id) => document.getElementById(id);

  function setCurrent(name) {
    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.view === name) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    const name = location.hash.replace(/^#/, '');
    const about = name === 'about';
    $('about').hidden = !about;
    $('scroll-view').hidden = about;
    if (about) {
      setCurrent('about');
      window.scrollTo(0, 0);
    } else if (SECTIONS.includes(name)) {
      $(name).scrollIntoView();
    }
  }

  // Highlight the nav item for whichever section is in view.
  function watchSections() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((items) => {
      if (!$('about').hidden) return;
      items.forEach((it) => { if (it.isIntersecting) setCurrent(it.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    SECTIONS.forEach((id) => io.observe($(id)));
  }

  function goToSection(id) {
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    $('about').hidden = true;
    $('scroll-view').hidden = false;
  }

  const app = {
    // Re-render everything that depends on the stored entries.
    refresh() {
      EJ.views.history.show();
      EJ.views.patterns.show();
    },
    openEntry(id) {
      goToSection('history');
      EJ.views.history.show(id);
    },
    editEntry(id) {
      goToSection('journal');
      EJ.views.journal.show(id);
      $('journal').scrollIntoView({ behavior: 'smooth' });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    EJ.views.journal.init();
    EJ.views.history.init();
    EJ.views.patterns.init();
    app.refresh();

    // Any element can link to an entry with data-open-entry or data-edit-entry.
    document.addEventListener('click', (ev) => {
      const open = ev.target.closest('[data-open-entry]');
      const edit = ev.target.closest('[data-edit-entry]');
      if (!open && !edit) return;
      ev.preventDefault();
      if (open) app.openEntry(open.dataset.openEntry);
      else app.editEntry(edit.dataset.editEntry);
    });

    $('reset-btn').addEventListener('click', (ev) => {
      const btn = ev.currentTarget;
      if (btn.dataset.armed) {
        EJ.store.reset();
        delete btn.dataset.armed;
        btn.textContent = 'Reset the sample journal';
        app.refresh();
        EJ.util.toast('The sample journal has been restored.', { label: 'View history', action: () => { location.hash = '#history'; } });
      } else {
        btn.dataset.armed = '1';
        btn.textContent = 'This removes your own entries. Reset?';
      }
    });

    window.addEventListener('hashchange', route);
    watchSections();
    route();
  });

  return app;
})();
