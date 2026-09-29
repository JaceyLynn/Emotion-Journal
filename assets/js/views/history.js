/*
 * History view: every entry with the user's confirmed reading. Where the
 * user corrected the AI, the original suggestion is shown alongside.
 */
window.EJ = window.EJ || {};
EJ.views = EJ.views || {};

EJ.views.history = (function () {
  const $ = (id) => document.getElementById(id);
  const u = EJ.util;
  const PREVIEW = 6; // entries shown before "Show all" in the one-page scroll
  let filter = null;
  let expanded = false;

  const ACCURACY = {
    accurate: 'You said the reading felt accurate.',
    partly: 'You said the reading was partly accurate, and revised it.',
    not: 'You said this was not how you saw it, and rewrote it.'
  };

  function revised(e) {
    return e.accuracy !== 'accurate' ||
      e.suggested.emotion !== e.confirmed.emotion ||
      e.suggested.trigger !== e.confirmed.trigger;
  }

  function item(e) {
    const c = e.confirmed;
    const s = e.suggested;
    const color = u.emotionColor(c.emotion);
    const meta = [u.triggerLabel(c.trigger), c.intensity, e.category].filter(Boolean).map(u.esc).join(' · ');

    const original = revised(e) ? `
      <div class="ai-original">
        <p class="note-label">The AI first suggested</p>
        <p>${u.esc(u.emotionLabel(s.emotion))} · ${u.esc(u.triggerLabel(s.trigger))} · ${u.esc(s.intensity)}</p>
        <p class="noticed">${u.esc(s.observation)}</p>
      </div>` : `
      <div class="ai-original">
        <p class="note-label">What the AI noticed</p>
        <p class="noticed">${u.esc(s.observation)}</p>
      </div>`;

    return `
      <li class="entry" id="entry-${u.esc(e.id)}" style="--mark:${color}">
        <div class="entry-date">
          <span class="entry-day">${u.esc(u.formatShort(e.eventTime))}</span>
          <span class="entry-time">${u.esc(u.formatTime(e.eventTime))}</span>
        </div>
        <details class="entry-body">
          <summary>
            <span class="entry-emotion"><span class="mark" aria-hidden="true"></span>${u.esc(u.emotionLabel(c.emotion))}${revised(e) ? '<span class="tag">revised by you</span>' : ''}</span>
            <span class="entry-text-preview">${u.esc(e.text)}</span>
            <span class="entry-meta-line">${meta}</span>
          </summary>
          <div class="entry-detail">
            <p class="muted small">${ACCURACY[e.accuracy] || ''}</p>
            ${c.note ? `<blockquote class="your-words"><p class="note-label">In your words</p><p>${u.esc(c.note)}</p></blockquote>` : ''}
            ${original}
            <div class="entry-reflection">
              <p class="note-label">Reflection</p>
              <p class="reflection-q small-q">${u.esc(e.reflection.question)}</p>
              ${e.reflection.answer ? `<p>${u.esc(e.reflection.answer)}</p>` : '<p class="muted">Left as a question.</p>'}
            </div>
            <div class="entry-actions">
              <button type="button" class="btn btn-small" data-edit-entry="${u.esc(e.id)}">Revisit or edit</button>
              <button type="button" class="btn btn-small btn-quiet" data-delete="${u.esc(e.id)}">Delete</button>
            </div>
          </div>
        </details>
      </li>`;
  }

  function renderFilters(entries) {
    const present = Object.keys(EJ.EMOTIONS).filter((k) => entries.some((e) => e.confirmed.emotion === k));
    $('history-filters').innerHTML =
      `<button type="button" data-filter="" aria-pressed="${!filter}">All</button>` +
      present.map((k) => `<button type="button" data-filter="${k}" aria-pressed="${filter === k}" style="--mark:${u.emotionColor(k)}"><span class="mark" aria-hidden="true"></span>${u.esc(u.emotionLabel(k))}</button>`).join('');
  }

  function render(openId) {
    const all = EJ.store.entries();
    renderFilters(all);
    const list = filter ? all.filter((e) => e.confirmed.emotion === filter) : all;
    if (openId) expanded = true;
    const shown = expanded ? list : list.slice(0, PREVIEW);
    const more = list.length - shown.length;
    $('entries').innerHTML = (list.length ? shown.map(item).join('') :
      '<li class="empty">Nothing here yet. <a href="#journal">Start an entry</a>.</li>') +
      (more > 0 ? `<li class="show-all"><button type="button" class="btn" data-show-all>Show all ${list.length} entries</button></li>` : '');

    const samples = all.filter((e) => e.sample).length;
    $('history-footnote').textContent = samples
      ? `${samples} of these ${all.length} entries belong to a fictional sample journal, so there is something to explore.`
      : '';

    if (openId) {
      const el = document.getElementById('entry-' + openId);
      if (el) {
        el.querySelector('details').open = true;
        el.classList.add('highlight');
        setTimeout(() => el.scrollIntoView({ block: 'center' }), 0);
      }
    }
  }

  return {
    init() {
      $('history-filters').addEventListener('click', (ev) => {
        const b = ev.target.closest('button[data-filter]');
        if (!b) return;
        filter = b.dataset.filter || null;
        render();
      });
      $('entries').addEventListener('click', (ev) => {
        if (ev.target.closest('[data-show-all]')) {
          expanded = true;
          render();
          return;
        }
        const b = ev.target.closest('button[data-delete]');
        if (!b) return;
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.textContent = 'Delete for good?';
          return;
        }
        EJ.store.remove(b.dataset.delete);
        EJ.app.refresh();
        u.toast('Entry deleted.');
      });
    },
    show(openId) { render(openId); }
  };
})();
