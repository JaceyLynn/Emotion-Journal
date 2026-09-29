/*
 * Browser-only storage. Entries and pattern responses live in localStorage,
 * so nothing a visitor writes ever leaves their browser. If storage is
 * unavailable (private mode, blocked site data) the demo still works for
 * the current visit using an in-memory copy.
 */
window.EJ = window.EJ || {};

EJ.store = (function () {
  const KEYS = { entries: 'ej.v5.entries', patterns: 'ej.v5.patternResponses' };
  const memory = {};

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) { /* fall through to memory */ }
    return key in memory ? memory[key] : fallback;
  }

  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }

  function entries() {
    let list = read(KEYS.entries, null);
    if (!list) {
      list = EJ.seed.build();
      write(KEYS.entries, list);
    }
    return list.slice().sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
  }

  return {
    entries,
    get(id) { return entries().find((e) => e.id === id) || null; },
    save(entry) {
      const list = entries().filter((e) => e.id !== entry.id);
      list.push(entry);
      write(KEYS.entries, list);
    },
    remove(id) { write(KEYS.entries, entries().filter((e) => e.id !== id)); },
    patternResponses() { return read(KEYS.patterns, {}); },
    respondToPattern(id, answer) {
      const all = read(KEYS.patterns, {});
      all[id] = answer;
      write(KEYS.patterns, all);
    },
    reset() {
      write(KEYS.entries, EJ.seed.build());
      write(KEYS.patterns, {});
    }
  };
})();
