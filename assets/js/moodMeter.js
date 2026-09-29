/*
 * Mood Meter: an optional way in for when a feeling is hard to name.
 * The user places a point on pleasure (x) and energy (y); the nearest
 * word from the original prototype's map is offered back as a starting
 * point. Works with pointer and with arrow keys.
 */
window.EJ = window.EJ || {};

EJ.MoodMeter = function (root, onChange) {
  const SIZE = 240;
  const NS = 'http://www.w3.org/2000/svg';
  let value = null;

  root.innerHTML = `
    <div class="mm">
      <div class="mm-axis mm-axis-y">Energy</div>
      <svg class="mm-plane" viewBox="0 0 ${SIZE} ${SIZE}" role="slider" tabindex="0"
           aria-label="Mood Meter. Use arrow keys to move: left and right for pleasure, up and down for energy."
           aria-valuetext="No point placed">
        <rect class="mm-q mm-q1" x="0" y="0" width="${SIZE / 2}" height="${SIZE / 2}"></rect>
        <rect class="mm-q mm-q2" x="${SIZE / 2}" y="0" width="${SIZE / 2}" height="${SIZE / 2}"></rect>
        <rect class="mm-q mm-q3" x="0" y="${SIZE / 2}" width="${SIZE / 2}" height="${SIZE / 2}"></rect>
        <rect class="mm-q mm-q4" x="${SIZE / 2}" y="${SIZE / 2}" width="${SIZE / 2}" height="${SIZE / 2}"></rect>
        <line class="mm-rule" x1="${SIZE / 2}" y1="0" x2="${SIZE / 2}" y2="${SIZE}"></line>
        <line class="mm-rule" x1="0" y1="${SIZE / 2}" x2="${SIZE}" y2="${SIZE / 2}"></line>
        <text class="mm-corner" x="8" y="16">tense</text>
        <text class="mm-corner" x="${SIZE - 8}" y="16" text-anchor="end">lively</text>
        <text class="mm-corner" x="8" y="${SIZE - 8}">low</text>
        <text class="mm-corner" x="${SIZE - 8}" y="${SIZE - 8}" text-anchor="end">at ease</text>
      </svg>
      <div class="mm-axis mm-axis-x">Pleasure</div>
      <p class="mm-readout" aria-live="polite">Place a point where the feeling sits.</p>
    </div>`;

  const svg = root.querySelector('svg');
  const readout = root.querySelector('.mm-readout');
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('r', 7);
  dot.setAttribute('class', 'mm-dot');

  function render() {
    if (!value) return;
    if (!dot.parentNode) svg.appendChild(dot);
    dot.setAttribute('cx', (value.pleasure / 100) * SIZE);
    dot.setAttribute('cy', SIZE - (value.energy / 100) * SIZE);
    const word = EJ.moodWord(value.pleasure, value.energy);
    readout.innerHTML = `Somewhere near <em>${word.toLowerCase()}</em>. <span class="muted">Pleasure ${value.pleasure}, energy ${value.energy}.</span>`;
    svg.setAttribute('aria-valuetext', `${word}: pleasure ${value.pleasure}, energy ${value.energy}`);
    onChange && onChange(value, word);
  }

  function set(p, e) {
    value = { pleasure: Math.max(0, Math.min(100, Math.round(p))), energy: Math.max(0, Math.min(100, Math.round(e))) };
    render();
  }

  svg.addEventListener('pointerdown', (ev) => {
    const r = svg.getBoundingClientRect();
    set(((ev.clientX - r.left) / r.width) * 100, 100 - ((ev.clientY - r.top) / r.height) * 100);
  });

  svg.addEventListener('keydown', (ev) => {
    const step = ev.shiftKey ? 10 : 4;
    const v = value || { pleasure: 50, energy: 50 };
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!moves[ev.key]) return;
    ev.preventDefault();
    set(v.pleasure + moves[ev.key][0], v.energy + moves[ev.key][1]);
  });

  return {
    get value() { return value; },
    set(v) { if (v) set(v.pleasure, v.energy); },
    clear() {
      value = null;
      dot.remove();
      readout.textContent = 'Place a point where the feeling sits.';
    }
  };
};
