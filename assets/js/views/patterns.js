/*
 * Patterns view: hypotheses from the Pattern Finder, each one put back to
 * the user as a question, plus the monthly calendar, the daily view and
 * two smaller D3 charts.
 */
window.EJ = window.EJ || {};
EJ.views = EJ.views || {};

EJ.views.patterns = (function () {
  const $ = (id) => document.getElementById(id);
  const u = EJ.util;
  const ANSWERS = { yes: 'Yes', maybe: 'Maybe', no: 'No' };
  let entries = [];

  // ---------- hypotheses ----------

  function hypothesis(p, answer, byId) {
    const evidence = p.evidence.map((id) => byId[id]).filter(Boolean).slice(0, 6);
    return `
      <li class="hypothesis" style="--mark:${u.emotionColor(p.emotion)}">
        <p class="eyebrow">${u.esc(p.kind)}</p>
        <p class="hypothesis-text">${u.esc(p.text)}</p>
        <details class="evidence">
          <summary>Based on ${p.evidence.length} entries</summary>
          <ul>${evidence.map((e) => `<li><a href="#history" data-open-entry="${u.esc(e.id)}">${u.esc(u.formatShort(e.eventTime))}</a> ${u.esc(e.text.length > 110 ? e.text.slice(0, 110) + '…' : e.text)}</li>`).join('')}</ul>
        </details>
        <fieldset class="confirm confirm-inline">
          <legend>Does this connection feel meaningful to you?</legend>
          <div class="confirm-options">
            ${Object.entries(ANSWERS).map(([k, label]) =>
              `<button type="button" data-pattern="${u.esc(p.id)}" data-answer="${k}" aria-pressed="${answer === k}">${label}</button>`).join('')}
          </div>
        </fieldset>
      </li>`;
  }

  function renderHypotheses() {
    const found = EJ.ai.findPatterns(entries);
    const responses = EJ.store.patternResponses();
    const byId = Object.fromEntries(entries.map((e) => [e.id, e]));
    const open = found.filter((p) => responses[p.id] !== 'no');
    const rejected = found.filter((p) => responses[p.id] === 'no');

    $('hypotheses').innerHTML = open.length
      ? open.map((p) => hypothesis(p, responses[p.id], byId)).join('')
      : '<li class="empty">Nothing stands out yet. Patterns appear once a few confirmed entries share an emotion, a trigger or a time of day.</li>';
    $('hypotheses-rejected').innerHTML = rejected.map((p) => hypothesis(p, 'no', byId)).join('');
    $('set-aside').hidden = !rejected.length;
  }

  // ---------- charts ----------

  const tooltip = () => $('tooltip');

  function showTip(ev, e) {
    const t = tooltip();
    t.innerHTML = `<strong>${u.esc(u.emotionLabel(e.confirmed.emotion))}</strong> · ${u.esc(u.formatShort(e.eventTime))}, ${u.esc(u.formatTime(e.eventTime))}<br>${u.esc(e.text.length > 120 ? e.text.slice(0, 120) + '…' : e.text)}`;
    t.hidden = false;
    const x = Math.min(ev.clientX + 14, window.innerWidth - t.offsetWidth - 12);
    t.style.left = x + 'px';
    t.style.top = (ev.clientY + 14) + 'px';
  }
  function hideTip() { tooltip().hidden = true; }

  function dots(sel, data, x, y) {
    sel.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 5.5)
      .attr('fill', (e) => u.emotionColor(e.confirmed.emotion))
      .attr('tabindex', 0)
      .attr('role', 'link')
      .attr('aria-label', (e) => `${u.emotionLabel(e.confirmed.emotion)}, ${u.formatShort(e.eventTime)}. Open entry.`)
      .on('pointerenter', showTip)
      .on('pointermove', showTip)
      .on('pointerleave', hideTip)
      .on('focus', function (ev, e) { const r = this.getBoundingClientRect(); showTip({ clientX: r.right, clientY: r.bottom }, e); })
      .on('blur', hideTip)
      .on('click', (ev, e) => { hideTip(); EJ.app.openEntry(e.id); })
      .on('keydown', (ev, e) => { if (ev.key === 'Enter') { hideTip(); EJ.app.openEntry(e.id); } });
  }

  // ---------- monthly calendar (ported from the original p5.js Monthly Mood) ----------

  let month = null;       // first day of the month on show
  let selectedDay = null; // 'YYYY-MM-DD'

  function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function entriesByDay() {
    return d3.group(entries, (e) => dayKey(new Date(e.eventTime)));
  }

  // Deterministic stand-in for p5's noise(): layered sines seeded per ring,
  // so each blot keeps its hand-drawn wobble without changing on every render.
  function wobble(seed, angle) {
    return (Math.sin(angle * 2 + seed * 1.7) * 0.6 + Math.sin(angle * 3 + seed * 3.1) * 0.3 + Math.sin(angle * 5 + seed * 0.7) * 0.1) / 2;
  }

  const blotLine = d3.line().curve(d3.curveCardinalClosed);

  function blotPath(diameter, seed) {
    const points = d3.range(60).map((i) => {
      const angle = (i / 60) * Math.PI * 2;
      const r = diameter / 2 + wobble(seed, angle) * diameter * 0.15;
      return [Math.cos(angle) * r, Math.sin(angle) * r];
    });
    return blotLine(points);
  }

  function calendarChart() {
    const el = $('chart-calendar');
    el.innerHTML = '';
    const byDay = entriesByDay();
    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstDay = new Date(year, m, 1).getDay();
    const rows = Math.ceil((daysInMonth + firstDay) / 7);

    const width = el.clientWidth || 640;
    const cellW = width / 7;
    const cellH = Math.min(cellW * 1.05, 118);
    const top = 30;
    const height = top + rows * cellH;
    const maxCircle = Math.min(cellW, cellH - 18) * 0.78;

    $('month-label').textContent = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const svg = d3.select(el).append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)
      .attr('role', 'group').attr('aria-label', 'Monthly mood calendar');

    svg.append('g').attr('class', 'axis').selectAll('text')
      .data(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).join('text')
      .attr('x', (d, i) => i * cellW + cellW / 2).attr('y', 16).attr('text-anchor', 'middle')
      .text((d) => (width < 420 ? d[0] : d));

    const days = d3.range(1, daysInMonth + 1).map((day) => {
      const date = new Date(year, m, day);
      const key = dayKey(date);
      const idx = day - 1 + firstDay;
      return {
        day, key, date,
        x: (idx % 7) * cellW + cellW / 2,
        y: top + Math.floor(idx / 7) * cellH + cellH / 2 + 8,
        entries: (byDay.get(key) || []).slice().sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
      };
    });

    const cell = svg.append('g').selectAll('g').data(days).join('g')
      .attr('class', (d) => 'cal-day' + (d.entries.length ? ' has-entries' : '') + (d.key === selectedDay ? ' is-selected' : ''))
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    cell.append('text').attr('class', 'cal-num')
      .attr('y', -maxCircle / 2 - 8).attr('text-anchor', 'middle').text((d) => d.day);

    cell.filter((d) => !d.entries.length).append('circle')
      .attr('class', 'cal-empty').attr('r', maxCircle * 0.15);

    const filled = cell.filter((d) => d.entries.length)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-pressed', (d) => String(d.key === selectedDay))
      .attr('aria-label', (d) => `${u.formatDay(d.date.toISOString())}: ${d.entries.map((e) => u.emotionLabel(e.confirmed.emotion)).join(', ')}`)
      .on('click', (ev, d) => selectDay(d.key))
      .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectDay(d.key); } });

    filled.append('circle').attr('class', 'cal-ring').attr('r', maxCircle / 2 + 6);

    // Concentric ink blots: first entry of the day is the outer ring.
    filled.append('g')
      .attr('class', 'blots')
      .attr('transform', (d) => `rotate(${(d.day * 47) % 360})`)
      .selectAll('path')
      .data((d) => {
        const step = maxCircle / (2 * d.entries.length);
        return d.entries.map((e, i) => ({ e, diameter: maxCircle - i * step * 2, seed: d.day * 7 + i * 13 }));
      })
      .join('path')
      .attr('d', (b) => blotPath(b.diameter, b.seed))
      .attr('fill', (b) => u.emotionColor(b.e.confirmed.emotion))
      .attr('fill-opacity', 0.8);
  }

  // ---------- daily view (ported from the original D3 Daily Mood) ----------

  function valence(e) {
    if (e.mood) return e.mood.pleasure;
    return e.confirmed.emotion ? EJ.EMOTIONS[e.confirmed.emotion].valence : 50;
  }

  function dayChart() {
    const el = $('chart-day');
    el.innerHTML = '';
    const list = (entriesByDay().get(selectedDay) || []);
    const [y0, m0, d0] = selectedDay.split('-').map(Number);
    $('day-label').textContent = u.formatDay(new Date(y0, m0 - 1, d0).toISOString());

    const width = el.clientWidth || 640;
    const narrow = width < 520;
    const m = { top: 12, right: 8, bottom: 30, left: 8 };
    const height = narrow ? 230 : 300;

    const x = d3.scaleBand().domain(d3.range(0, 24, 2)).range([m.left, width - m.right]).padding(narrow ? 0.3 : 0.22);
    const y = d3.scaleLinear().domain([0, 100]).range([height - m.bottom - 6, m.top + 6]);

    const svg = d3.select(el).append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)
      .attr('role', 'img').attr('aria-label', 'Entries on this day, by time and pleasantness');

    const grad = svg.append('defs').append('linearGradient').attr('id', 'hourBarGradient')
      .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('class', 'bar-stop-top');
    grad.append('stop').attr('offset', '100%').attr('class', 'bar-stop-bottom');

    svg.append('g').selectAll('rect').data(x.domain()).join('rect')
      .attr('class', 'hour-bar')
      .attr('x', (d) => x(d)).attr('y', m.top)
      .attr('width', x.bandwidth()).attr('height', height - m.top - m.bottom)
      .attr('rx', x.bandwidth() / 2)
      .attr('fill', 'url(#hourBarGradient)');

    svg.append('g').attr('class', 'axis').selectAll('text').data(x.domain().filter((h) => !narrow || h % 4 === 0)).join('text')
      .attr('x', (d) => x(d) + x.bandwidth() / 2).attr('y', height - 8).attr('text-anchor', 'middle')
      .text((d) => `${d}:00`);

    const r = Math.min(x.bandwidth() / 2, narrow ? 12 : 18);
    const hour = (e) => new Date(e.eventTime).getHours();
    svg.append('g').selectAll('circle').data(list).join('circle')
      .attr('class', 'dot mood-dot')
      .attr('cx', (e) => x(Math.floor(hour(e) / 2) * 2) + x.bandwidth() / 2)
      .attr('cy', (e) => y(valence(e)))
      .attr('r', r)
      .attr('fill', (e) => u.emotionColor(e.confirmed.emotion))
      .attr('tabindex', 0)
      .attr('role', 'link')
      .attr('aria-label', (e) => `${u.emotionLabel(e.confirmed.emotion)} at ${u.formatTime(e.eventTime)}. Open entry.`)
      .on('pointerenter', showTip).on('pointermove', showTip).on('pointerleave', hideTip)
      .on('focus', function (ev, e) { const b = this.getBoundingClientRect(); showTip({ clientX: b.right, clientY: b.bottom }, e); })
      .on('blur', hideTip)
      .on('click', (ev, e) => { hideTip(); EJ.app.openEntry(e.id); })
      .on('keydown', (ev, e) => { if (ev.key === 'Enter') { hideTip(); EJ.app.openEntry(e.id); } });
  }

  function selectDay(key) {
    selectedDay = key;
    calendarChart();
    dayChart();
  }

  function initMonth() {
    const latest = entries.length ? new Date(entries[0].eventTime) : new Date();
    month = new Date(latest.getFullYear(), latest.getMonth(), 1);
    selectedDay = dayKey(latest);
  }

  function shiftMonth(delta) {
    month = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const inMonth = entries.filter((e) => {
      const d = new Date(e.eventTime);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    });
    if (inMonth.length) selectedDay = dayKey(new Date(inMonth[0].eventTime));
    calendarChart();
    if (inMonth.length) dayChart();
  }

  function timeChart() {
    const el = $('chart-time');
    el.innerHTML = '';
    const present = Object.keys(EJ.EMOTIONS).filter((k) => entries.some((e) => e.confirmed.emotion === k));
    if (!present.length) return;
    const width = el.clientWidth || 320;
    const rowH = 26;
    const m = { top: 8, right: 14, bottom: 28, left: 88 };
    const height = m.top + m.bottom + present.length * rowH;

    const x = d3.scaleLinear().domain([0, 24]).range([m.left, width - m.right]);
    const y = d3.scaleBand().domain(present).range([m.top, height - m.bottom]);
    const hour = (e) => { const d = new Date(e.eventTime); return d.getHours() + d.getMinutes() / 60; };

    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)
      .attr('role', 'img').attr('aria-label', 'Entries by emotion and hour of the day');

    svg.append('g').attr('class', 'grid').selectAll('line').data([6, 12, 18]).join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', m.top).attr('y2', height - m.bottom);
    svg.append('g').attr('class', 'grid grid-rows').selectAll('line').data(present).join('line')
      .attr('x1', m.left).attr('x2', width - m.right)
      .attr('y1', (d) => y(d) + y.bandwidth() / 2).attr('y2', (d) => y(d) + y.bandwidth() / 2);
    svg.append('g').attr('class', 'axis').selectAll('text').data(present).join('text')
      .attr('x', m.left - 12).attr('y', (d) => y(d) + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .text((d) => u.emotionLabel(d));
    svg.append('g').attr('class', 'axis').selectAll('text.hour').data([[6, '6am'], [12, 'noon'], [18, '6pm']]).join('text')
      .attr('x', (d) => x(d[0])).attr('y', height - 8).attr('text-anchor', 'middle').text((d) => d[1]);

    const data = entries.filter((e) => e.confirmed.emotion);
    dots(svg.append('g'), data, (e) => x(hour(e)), (e) => y(e.confirmed.emotion) + y.bandwidth() / 2);
  }

  function triggerChart() {
    const el = $('chart-triggers');
    const groups = d3.groups(entries.filter((e) => e.confirmed.trigger), (e) => e.confirmed.trigger)
      .sort((a, b) => b[1].length - a[1].length);
    el.innerHTML = `<ol class="trigger-list">${groups.map(([t, list]) => `
      <li>
        <span class="trigger-name">${u.esc(u.triggerLabel(t))}</span>
        <span class="trigger-dots" aria-label="${list.length} entries">${list
          .sort((a, b) => a.confirmed.emotion > b.confirmed.emotion ? 1 : -1)
          .map((e) => `<a class="tdot" href="#history" data-open-entry="${u.esc(e.id)}" style="background:${u.emotionColor(e.confirmed.emotion)}" title="${u.esc(u.emotionLabel(e.confirmed.emotion))}, ${u.esc(u.formatShort(e.eventTime))}"></a>`).join('')}</span>
      </li>`).join('')}</ol>`;
  }

  function legend() {
    const present = Object.keys(EJ.EMOTIONS).filter((k) => entries.some((e) => e.confirmed.emotion === k));
    $('legend').innerHTML = present.map((k) =>
      `<span style="--mark:${u.emotionColor(k)}"><span class="mark" aria-hidden="true"></span>${u.esc(u.emotionLabel(k))}</span>`).join('');
  }

  function renderCharts() {
    if (!window.d3) {
      $('chart-intensity').innerHTML = '<p class="muted">Charts need D3, which could not be loaded.</p>';
      return;
    }
    legend();
    if (!month) initMonth();
    calendarChart();
    dayChart();
    timeChart();
    triggerChart();
  }

  let resizeTimer;
  return {
    init() {
      document.getElementById('patterns').addEventListener('click', (ev) => {
        const b = ev.target.closest('button[data-pattern]');
        if (!b) return;
        EJ.store.respondToPattern(b.dataset.pattern, b.dataset.answer);
        renderHypotheses();
        if (b.dataset.answer === 'no') u.toast('Set aside. It stays out of the way unless you bring it back.');
      });
      $('prev-month').addEventListener('click', () => shiftMonth(-1));
      $('next-month').addEventListener('click', () => shiftMonth(1));
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (!$('scroll-view').hidden) renderCharts(); }, 150);
      });
    },
    show() {
      entries = EJ.store.entries();
      month = null;
      renderHypotheses();
      renderCharts();
    }
  };
})();
