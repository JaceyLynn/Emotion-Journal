/*
 * Mood Meter: an optional way in for when a feeling is hard to name, or
 * too strong to write about yet. The user places a point on pleasure (x)
 * and energy (y) over a colour field; the dot takes the colour under it
 * and the nearest word from the original prototype's map is offered back.
 * Works with pointer and with arrow keys.
 *
 * The journal can also place the point itself (from a reading), so the
 * meter shows where the named emotion sits. `placedBy` says which.
 */
window.EJ = window.EJ || {};

// Corner colours of the field, taken from the emotion palette:
// tense (unpleasant, high energy), lively, low, at ease.
EJ.MOOD_CORNERS = { tl: '#c4502f', tr: '#e2a523', bl: '#3f6ea6', br: '#4c9a70' };

// The colour at a point on the field (pleasure and energy 0–100).
EJ.moodColor = function (pleasure, energy) {
  const c = EJ.MOOD_CORNERS;
  const x = Math.max(0, Math.min(100, pleasure)) / 100;
  const y = Math.max(0, Math.min(100, energy)) / 100;
  const top = d3.interpolateLab(c.tl, c.tr)(x);
  const bottom = d3.interpolateLab(c.bl, c.br)(x);
  return d3.color(d3.interpolateLab(bottom, top)(y)).formatHex();
};

EJ.MoodMeter = function (root, onChange) {
  const SIZE = 240;
  const NS = 'http://www.w3.org/2000/svg';
  const EMPTY = 'Tap where the feeling sits.';
  let value = null;
  let placedBy = null; // 'user' or 'reading'
  let emotionLabel = null;

  root.innerHTML = `
    <div class="mm">
      <div class="mm-axis mm-axis-y">Energy</div>
      <svg class="mm-plane" viewBox="0 0 ${SIZE} ${SIZE}" role="slider" tabindex="0"
           aria-label="Mood Meter. Use arrow keys to move: left and right for pleasure, up and down for energy."
           aria-valuetext="No point placed">
        <image class="mm-field" x="0" y="0" width="${SIZE}" height="${SIZE}" preserveAspectRatio="none"></image>
        <line class="mm-rule" x1="${SIZE / 2}" y1="0" x2="${SIZE / 2}" y2="${SIZE}"></line>
        <line class="mm-rule" x1="0" y1="${SIZE / 2}" x2="${SIZE}" y2="${SIZE / 2}"></line>
        <text class="mm-corner" x="10" y="20">tense</text>
        <text class="mm-corner" x="${SIZE - 10}" y="20" text-anchor="end">lively</text>
        <text class="mm-corner" x="10" y="${SIZE - 12}">low</text>
        <text class="mm-corner" x="${SIZE - 10}" y="${SIZE - 12}" text-anchor="end">at ease</text>
      </svg>
      <div class="mm-axis mm-axis-x">Pleasure</div>
      <p class="mm-readout" aria-live="polite">${EMPTY}</p>
    </div>`;

  const svg = root.querySelector('svg');
  const readout = root.querySelector('.mm-readout');

  // Paint the colour field once, using the same function as the dot, so
  // the dot always matches what is under it.
  const N = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(N, N);
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const rgb = d3.rgb(EJ.moodColor((col / (N - 1)) * 100, 100 - (row / (N - 1)) * 100));
      const i = (row * N + col) * 4;
      img.data[i] = rgb.r; img.data[i + 1] = rgb.g; img.data[i + 2] = rgb.b; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  root.querySelector('.mm-field').setAttribute('href', canvas.toDataURL());

  const dot = document.createElementNS(NS, 'g');
  dot.setAttribute('class', 'mm-dot');
  dot.innerHTML = '<circle class="mm-dot-halo" r="14"></circle><circle class="mm-dot-core" r="9.5"></circle>';

  function render(notify) {
    if (!value) return;
    const color = EJ.moodColor(value.pleasure, value.energy);
    const fresh = !dot.parentNode;
    if (fresh) { dot.style.transition = 'none'; svg.appendChild(dot); }
    dot.style.transform = `translate(${(value.pleasure / 100) * SIZE}px, ${SIZE - (value.energy / 100) * SIZE}px)`;
    if (fresh) { void dot.getBoundingClientRect(); dot.style.transition = ''; }
    dot.querySelector('.mm-dot-core').setAttribute('fill', color);
    const word = EJ.moodWord(value.pleasure, value.energy);
    const swatch = `<span class="mm-swatch" style="background:${color}" aria-hidden="true"></span>`;
    readout.innerHTML = placedBy === 'reading' && emotionLabel
      ? `${swatch}Placed at <em>${EJ.util.esc(emotionLabel.toLowerCase())}</em>, from the journal’s reading. Move it if the feeling sits somewhere else.`
      : `${swatch}Somewhere near <em>${word.toLowerCase()}</em>. <span class="muted">Pleasure ${value.pleasure}, energy ${value.energy}.</span>`;
    svg.setAttribute('aria-valuetext', `${word}: pleasure ${value.pleasure}, energy ${value.energy}`);
    if (notify && onChange) onChange(value, word, placedBy);
  }

  function set(p, e, by, label) {
    value = { pleasure: Math.max(0, Math.min(100, Math.round(p))), energy: Math.max(0, Math.min(100, Math.round(e))) };
    placedBy = by;
    emotionLabel = label || null;
    render(by === 'user');
  }

  svg.addEventListener('pointerdown', (ev) => {
    const r = svg.getBoundingClientRect();
    set(((ev.clientX - r.left) / r.width) * 100, 100 - ((ev.clientY - r.top) / r.height) * 100, 'user');
  });

  svg.addEventListener('keydown', (ev) => {
    const step = ev.shiftKey ? 10 : 4;
    const v = value || { pleasure: 50, energy: 50 };
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!moves[ev.key]) return;
    ev.preventDefault();
    set(v.pleasure + moves[ev.key][0], v.energy + moves[ev.key][1], 'user');
  });

  return {
    get value() { return value; },
    get placedBy() { return placedBy; },
    // A point the user chose (e.g. when reopening an entry).
    set(v) { if (v) set(v.pleasure, v.energy, 'user'); },
    // Place the point where an emotion sits, unless the user already chose one.
    showEmotion(key) {
      if (placedBy === 'user') return;
      const em = key && EJ.EMOTIONS[key];
      if (!em) { this.clear(); return; }
      set(em.valence, em.energy, 'reading', em.label);
    },
    clear() {
      value = null;
      placedBy = null;
      emotionLabel = null;
      dot.remove();
      readout.textContent = EMPTY;
      svg.setAttribute('aria-valuetext', 'No point placed');
    }
  };
};
