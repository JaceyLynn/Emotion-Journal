/*
 * Journal view: capture → reading (margin note) → confirmation → reflection → save.
 */
window.EJ = window.EJ || {};
EJ.views = EJ.views || {};

EJ.views.journal = (function () {
  const $ = (id) => document.getElementById(id);
  let meter;
  let draft = null; // entry being written or edited

  // Most visitors won't write their own entry, so the page types one out
  // and asks for a reading on its own. Typing or "Write your own" stops it.
  const EXAMPLE = "The team switched the launch date again this afternoon, right after I'd rearranged my whole week around it. I was more frustrated than I expected.";
  let demo = { active: false, timer: null };

  function stopDemo(clear) {
    clearTimeout(demo.timer);
    demo.active = false;
    $('entry-text').classList.remove('is-typing');
    $('demo-note').hidden = true;
    if (clear) {
      resetForm();
      $('entry-text').focus();
    }
  }


  function playDemo() {
    if (demo.active || $('entry-text').value || draft) return;
    demo.active = true;
    const box = $('entry-text');
    $('demo-note').hidden = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      box.classList.remove('is-typing');
      demo.timer = setTimeout(() => { if (demo.active) interpret({ preventDefault() {} }, true); }, 500);
    };
    if (reduced) {
      box.value = EXAMPLE;
      finish();
      return;
    }
    box.classList.add('is-typing');
    let i = 0;
    const tick = () => {
      if (!demo.active) return;
      i += 1;
      box.value = EXAMPLE.slice(0, i);
      if (i < EXAMPLE.length) demo.timer = setTimeout(tick, EXAMPLE[i - 1] === ' ' ? 45 : 26);
      else finish();
    };
    demo.timer = setTimeout(tick, 400);
  }

  function startDemoWhenVisible() {
    if (!('IntersectionObserver' in window)) { playDemo(); return; }
    const io = new IntersectionObserver((items) => {
      if (items.some((it) => it.isIntersecting)) { io.disconnect(); playDemo(); }
    }, { threshold: 0.4 });
    io.observe($('entry-text'));
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function toLocalInput(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fillSelect(el, options, placeholder) {
    el.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
      options.map(([value, label]) => `<option value="${value}">${EJ.util.esc(label)}</option>`).join('');
  }

  function resetForm() {
    stopDemo(false);
    draft = null;
    $('entry-form').reset();
    $('entry-time').value = toLocalInput(new Date());
    $('journal-title').textContent = 'What happened?';
    $('entry-dateline').textContent = EJ.util.formatDay(new Date().toISOString());
    meter.clear();
    $('mood-toggle').open = false;
    $('margin-empty').hidden = false;
    $('margin-note').hidden = true;
    $('reflection').hidden = true;
    $('form-hint').textContent = '';
    $('interpret-btn').textContent = 'Ask for a reading';
    setAccuracy(null);
  }

  function setAccuracy(value) {
    if (draft) draft.accuracy = value;
    document.querySelectorAll('#confirm button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.accuracy === value));
    });
    $('revise').hidden = !(value === 'partly' || value === 'not');
    $('margin-note').classList.toggle('is-revising', value === 'partly' || value === 'not');
    $('reflection').hidden = !value;
  }

  function showReading(entry, animate) {
    $('r-emotion').value = entry.confirmed.emotion || '';
    $('r-trigger').value = entry.confirmed.trigger || '';
    $('r-intensity').value = entry.confirmed.intensity || '';
    $('r-noticed').textContent = entry.suggested.observation;
    $('r-note').value = entry.confirmed.note || '';
    $('reflection-q').textContent = entry.reflection.question;
    $('reflection-answer').value = entry.reflection.answer || '';
    $('margin-empty').hidden = true;
    const note = $('margin-note');
    note.hidden = false;
    if (animate) {
      note.classList.remove('appear');
      void note.offsetWidth; // restart the fade-in
      note.classList.add('appear');
    }
    setAccuracy(entry.accuracy || null);
  }

  function readForm() {
    const text = $('entry-text').value.trim();
    const time = $('entry-time').value ? new Date($('entry-time').value) : new Date();
    return { text, eventTime: time.toISOString(), category: $('entry-category').value, mood: meter.value };
  }

  function interpret(ev, fromDemo) {
    ev.preventDefault();
    if (!fromDemo) stopDemo(false);
    const form = readForm();
    if (form.text.length < 8) {
      $('form-hint').textContent = 'Write a sentence or two first. The reading works from your words.';
      $('entry-text').focus();
      return;
    }
    $('form-hint').textContent = 'Reading…';
    $('interpret-btn').disabled = true;

    // A short pause so the reading feels considered rather than instant.
    setTimeout(() => {
      const suggested = EJ.ai.interpret(form);
      const previous = draft;
      draft = Object.assign({}, previous || {}, form, {
        id: previous ? previous.id : 'entry-' + Date.now(),
        createdAt: previous ? previous.createdAt : new Date().toISOString(),
        suggested,
        accuracy: null,
        confirmed: { emotion: suggested.emotion, trigger: suggested.trigger, intensity: suggested.intensity, note: '' },
        reflection: { question: EJ.ai.reflect(form.text, suggested), answer: '' }
      });
      $('form-hint').textContent = '';
      $('interpret-btn').disabled = false;
      $('interpret-btn').textContent = 'Read it again';
      showReading(draft, true);
      if (!fromDemo && window.matchMedia('(max-width: 860px)').matches) $('margin').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 650);
  }

  function save() {
    if (!draft) return;
    const form = readForm();
    Object.assign(draft, form);
    draft.accuracy = draft.accuracy || 'accurate';
    draft.confirmed = {
      emotion: $('r-emotion').value || null,
      trigger: $('r-trigger').value || null,
      intensity: $('r-intensity').value,
      note: $('r-note').value.trim()
    };
    draft.reflection.answer = $('reflection-answer').value.trim();
    EJ.store.save(draft);
    const id = draft.id;
    resetForm();
    EJ.app.refresh();
    EJ.util.toast('Kept in your journal.', { label: 'See it in History', action: () => EJ.app.openEntry(id) });
  }

  return {
    init() {
      meter = EJ.MoodMeter($('mood-meter'));
      fillSelect($('entry-category'), EJ.CATEGORIES.map((c) => [c, c]), 'None');
      fillSelect($('r-emotion'), Object.entries(EJ.EMOTIONS).map(([k, e]) => [k, e.label]), 'Not sure');
      fillSelect($('r-trigger'), Object.entries(EJ.TRIGGERS).map(([k, t]) => [k, t.label]), 'Something else');
      fillSelect($('r-intensity'), EJ.INTENSITIES.map((i) => [i, i]));

      $('entry-form').addEventListener('submit', interpret);
      $('save-btn').addEventListener('click', save);
      $('discard-btn').addEventListener('click', resetForm);
      $('demo-clear').addEventListener('click', () => stopDemo(true));
      // Typing into the box while the example is playing replaces it.
      $('entry-text').addEventListener('keydown', () => { if (demo.active && $('entry-text').classList.contains('is-typing')) stopDemo(true); });
      document.querySelectorAll('#confirm button').forEach((b) => {
        b.addEventListener('click', () => {
          setAccuracy(b.dataset.accuracy);
          if (b.dataset.accuracy !== 'accurate') $('r-emotion').focus();
        });
      });
      // Editing any label counts as a revision.
      ['r-emotion', 'r-trigger', 'r-intensity'].forEach((id) => {
        $(id).addEventListener('change', () => {
          if (draft && (!draft.accuracy || draft.accuracy === 'accurate')) setAccuracy('partly');
        });
      });
      resetForm();
      startDemoWhenVisible();
    },

    show(id) {
      const entry = id ? EJ.store.get(id) : null;
      if (!entry) {
        if (draft && !EJ.store.get(draft.id)) return; // keep an unsaved draft
        resetForm();
        return;
      }
      stopDemo(false);
      draft = JSON.parse(JSON.stringify(entry));
      $('journal-title').textContent = 'Revisit an entry';
      $('entry-dateline').textContent = EJ.util.formatDay(entry.eventTime);
      $('entry-text').value = entry.text;
      $('entry-time').value = toLocalInput(new Date(entry.eventTime));
      $('entry-category').value = entry.category || '';
      if (entry.mood) { meter.set(entry.mood); $('mood-toggle').open = true; } else { meter.clear(); }
      $('interpret-btn').textContent = 'Read it again';
      showReading(draft, false);
    }
  };
})();
