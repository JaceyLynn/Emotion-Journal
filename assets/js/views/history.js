/*
 * History view. Each entry shows, in order: the original entry with its
 * tags; when opened, the follow-ups written later; and last a reflective
 * question with a nudge toward related entries.
 */
window.EJ = window.EJ || {};
EJ.views = EJ.views || {};

EJ.views.history = (function () {
  const $ = (id) => document.getElementById(id);
  const u = EJ.util;
  const PREVIEW = 6; // entries shown before "Show all" in the one-page scroll
  let filter = null;
  let expanded = false;

  function chip(label, mark) {
    return `<span class="chip"${mark ? ` style="--mark:${mark}"` : ''}>${mark ? '<span class="mark" aria-hidden="true"></span>' : ''}${u.esc(label)}</span>`;
  }

  function emotionOptions(selected) {
    return '<option value="">Not sure</option>' + Object.entries(EJ.EMOTIONS)
      .map(([k, em]) => `<option value="${k}"${k === selected ? ' selected' : ''}>${u.esc(em.label)}</option>`).join('');
  }

  // Open part 1: follow-ups written after the original entry.
  function followUps(e) {
    const list = (e.followUps || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return `
      <section class="followups" aria-label="Follow-ups">
        <p class="note-label">Follow-ups</p>
        ${list.length ? `<ol class="followup-list">${list.map((f) => `
          <li>
            <div class="chips">
              ${chip(u.formatShort(f.createdAt) + ', ' + u.formatTime(f.createdAt))}
              ${f.emotion ? chip(u.emotionLabel(f.emotion), u.emotionColor(f.emotion)) : ''}
            </div>
            <p>${u.esc(f.text)}</p>
          </li>`).join('')}</ol>` : '<p class="muted small">Nothing added yet. What happened next, or how does it look now?</p>'}
        <div class="followup-form">
          <label class="sr-only" for="fu-${u.esc(e.id)}">Write a follow-up</label>
          <textarea id="fu-${u.esc(e.id)}" rows="2" placeholder="Write a follow-up…"></textarea>
          <label class="followup-feel">
            <span>How does it feel now?</span>
            <select id="fu-emotion-${u.esc(e.id)}">${emotionOptions('')}</select>
          </label>
          <button type="button" class="btn btn-small btn-primary" data-add-followup="${u.esc(e.id)}">Add follow-up</button>
        </div>
      </section>`;
  }

  // Open part 2: the reflective question, plus a nudge toward related entries.
  function reflection(e, all) {
    const c = e.confirmed;
    let related = '';
    const sameTrigger = c.trigger ? all.filter((x) => x.id !== e.id && x.confirmed.trigger === c.trigger).length : 0;
    const sameEmotion = c.emotion ? all.filter((x) => x.id !== e.id && x.confirmed.emotion === c.emotion).length : 0;
    if (sameTrigger) {
      related = `This is one of ${sameTrigger + 1} entries about ${u.esc(u.triggerLabel(c.trigger).toLowerCase())}. Does it remind you of any of the others?`;
    } else if (sameEmotion) {
      related = `You have felt ${u.esc(u.emotionLabel(c.emotion).toLowerCase())} in ${sameEmotion} other ${sameEmotion > 1 ? 'entries' : 'entry'}. Was it about something similar?`;
    }
    return `
      <section class="entry-reflection" aria-label="Reflection">
        <p class="note-label">Reflect</p>
        <p class="reflection-q small-q">${u.esc(e.reflection.question)}</p>
        ${e.reflection.answer ? `<p class="reflection-a">${u.esc(e.reflection.answer)}</p>` : ''}
        ${related ? `<p class="related">${related} <a href="#patterns">See patterns</a></p>` : ''}
      </section>`;
  }

  // A feeling saved on its own, waiting for words.
  function pendingItem(e) {
    const c = e.confirmed;
    const word = e.mood ? EJ.moodWord(e.mood.pleasure, e.mood.energy) : u.emotionLabel(c.emotion);
    const color = e.mood ? EJ.moodColor(e.mood.pleasure, e.mood.energy) : u.emotionColor(c.emotion);
    return `
      <li class="entry entry-pending" id="entry-${u.esc(e.id)}" style="--mark:${color}">
        <div class="entry-date">
          <span class="entry-day">${u.esc(u.formatShort(e.eventTime))}</span>
          <span class="entry-time">${u.esc(u.formatTime(e.eventTime))}</span>
        </div>
        <div class="entry-body">
          <p class="pending-text"><span class="pending-dot" aria-hidden="true"></span>Only the feeling so far: somewhere near <strong>${u.esc(word.toLowerCase())}</strong>.</p>
          <div class="chips">
            ${chip(u.emotionLabel(c.emotion), u.emotionColor(c.emotion))}
            ${e.category ? chip(e.category) : ''}
            <button type="button" class="btn btn-small btn-primary" data-edit-entry="${u.esc(e.id)}">Write about it</button>
            <button type="button" class="btn btn-small btn-quiet" data-delete="${u.esc(e.id)}">Delete</button>
          </div>
        </div>
      </li>`;
  }

  function item(e, all) {
    if (e.pending) return pendingItem(e);
    const c = e.confirmed;
    const nFollow = (e.followUps || []).length;

    return `
      <li class="entry" id="entry-${u.esc(e.id)}" style="--mark:${u.emotionColor(c.emotion)}">
        <div class="entry-date">
          <span class="entry-day">${u.esc(u.formatShort(e.eventTime))}</span>
          <span class="entry-time">${u.esc(u.formatTime(e.eventTime))}</span>
        </div>
        <details class="entry-body">
          <summary>
            <span class="entry-text-preview">${u.esc(e.text)}</span>
            ${c.note ? `<span class="you-wrote"><span class="note-label">You wrote</span> ${u.esc(c.note)}</span>` : ''}
            <span class="chips">
              ${chip(u.emotionLabel(c.emotion), u.emotionColor(c.emotion))}
              ${c.trigger ? chip(u.triggerLabel(c.trigger)) : ''}
              ${c.intensity ? chip(c.intensity) : ''}
              ${e.category ? chip(e.category) : ''}
              ${nFollow ? `<span class="chip chip-followup">↳ ${nFollow} follow-up${nFollow > 1 ? 's' : ''}</span>` : ''}
              <span class="followup-pill" data-followup-open>↳ Follow up</span>
            </span>
          </summary>
          <div class="entry-detail">
            ${followUps(e)}
            ${reflection(e, all)}
            <div class="entry-actions">
              <button type="button" class="btn btn-small" data-edit-entry="${u.esc(e.id)}">Edit entry</button>
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
    $('entries').innerHTML = (list.length ? shown.map((e) => item(e, all)).join('') :
      '<li class="empty">Nothing here yet. <a href="#journal">Start an entry</a>.</li>') +
      (more > 0 ? `<li class="show-all"><button type="button" class="btn" data-show-all>Show all ${list.length} entries</button></li>` : '');

    const samples = all.filter((e) => e.sample).length;
    $('history-footnote').textContent = samples
      ? `${samples} of these ${all.length} entries belong to a fictional sample journal, so there is something to explore.`
      : '';

    if (openId) {
      const el = document.getElementById('entry-' + openId);
      if (el) {
        const d = el.querySelector('details');
        if (d) d.open = true;
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
        const pill = ev.target.closest('[data-followup-open]');
        if (pill) {
          ev.preventDefault();
          const li = pill.closest('.entry');
          li.querySelector('details').open = true;
          li.querySelector('.followups textarea').focus();
          return;
        }
        const add = ev.target.closest('[data-add-followup]');
        if (add) {
          const box = add.closest('.followups').querySelector('textarea');
          const text = box.value.trim();
          if (!text) { box.focus(); return; }
          const entry = EJ.store.get(add.dataset.addFollowup);
          const feel = document.getElementById('fu-emotion-' + entry.id).value || null;
          entry.followUps = (entry.followUps || []).concat({ id: 'fu-' + Date.now(), createdAt: new Date().toISOString(), text, emotion: feel });
          EJ.store.save(entry);
          render(entry.id);
          u.toast('Follow-up added to the entry.');
          return;
        }
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
