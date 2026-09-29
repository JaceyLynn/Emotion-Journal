/*
 * Patterns view: hypotheses from the Pattern Finder, each one put back to
 * the user as a question, plus three quiet D3 charts.
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
          <ul>${evidence.map((e) => `<li><a href="#/history/${encodeURIComponent(e.id)}">${u.esc(u.formatShort(e.eventTime))}</a> ${u.esc(e.text.length > 110 ? e.text.slice(0, 110) + '…' : e.text)}</li>`).join('')}</ul>
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
      .on('click', (ev, e) => { hideTip(); location.hash = '#/history/' + encodeURIComponent(e.id); })
      .on('keydown', (ev, e) => { if (ev.key === 'Enter') { hideTip(); location.hash = '#/history/' + encodeURIComponent(e.id); } });
  }

  function intensityChart() {
    const el = $('chart-intensity');
    el.innerHTML = '';
    const width = el.clientWidth || 640;
    const height = 220;
    const m = { top: 12, right: 16, bottom: 28, left: 104 };
    const data = entries.filter((e) => e.confirmed.intensity);
    if (!data.length) return;

    const x = d3.scaleTime()
      .domain(d3.extent(data, (e) => new Date(e.eventTime))).nice()
      .range([m.left, width - m.right]);
    const y = d3.scalePoint().domain(EJ.INTENSITIES.slice().reverse()).range([m.top + 10, height - m.bottom - 10]);

    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)
      .attr('role', 'img').attr('aria-label', 'Each entry plotted by date and confirmed intensity');

    svg.append('g').attr('class', 'grid').selectAll('line').data(y.domain()).join('line')
      .attr('x1', m.left).attr('x2', width - m.right).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
    svg.append('g').attr('class', 'axis').selectAll('text').data(y.domain()).join('text')
      .attr('x', m.left - 12).attr('y', (d) => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').text((d) => d);
    svg.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${height - m.bottom + 6})`)
      .call(d3.axisBottom(x).ticks(width < 520 ? d3.timeWeek.every(2) : d3.timeWeek.every(1)).tickSize(0).tickFormat(d3.timeFormat('%b %-d')))
      .call((g) => g.select('.domain').remove());

    dots(svg.append('g'), data, (e) => x(new Date(e.eventTime)), (e) => y(e.confirmed.intensity));
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
          .map((e) => `<a class="tdot" href="#/history/${encodeURIComponent(e.id)}" style="background:${u.emotionColor(e.confirmed.emotion)}" title="${u.esc(u.emotionLabel(e.confirmed.emotion))}, ${u.esc(u.formatShort(e.eventTime))}"></a>`).join('')}</span>
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
    intensityChart();
    timeChart();
    triggerChart();
  }

  let resizeTimer;
  return {
    init() {
      document.getElementById('view-patterns').addEventListener('click', (ev) => {
        const b = ev.target.closest('button[data-pattern]');
        if (!b) return;
        EJ.store.respondToPattern(b.dataset.pattern, b.dataset.answer);
        renderHypotheses();
        if (b.dataset.answer === 'no') u.toast('Set aside. It stays out of the way unless you bring it back.');
      });
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (!$('view-patterns').hidden) renderCharts(); }, 150);
      });
    },
    show() {
      entries = EJ.store.entries();
      renderHypotheses();
      renderCharts();
    }
  };
})();
