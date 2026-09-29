/*
 * SIMULATED AI: Pattern Finder
 *
 * Looks across entries and proposes possible recurring relationships.
 * It reads the user's confirmed version of each entry, never the raw AI
 * suggestion, so a correction the user makes changes what patterns appear.
 *
 * The rules are simple counts and thresholds. A pattern is phrased as
 * something that "may be worth noticing", never as a conclusion.
 */
window.EJ = window.EJ || {};
EJ.ai = EJ.ai || {};

(function () {
  const NEGATIVE = ['frustration', 'anxiety', 'overwhelm', 'sadness'];
  const MIN_SUPPORT = 3;

  function partOfDay(date) {
    const h = date.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 22) return 'evening';
    return 'late night';
  }

  function emotionLabel(key) { return EJ.EMOTIONS[key].label; }
  function triggerLabel(key) { return EJ.TRIGGERS[key].label.toLowerCase(); }
  function intensityLevel(label) { return Math.max(0, EJ.INTENSITIES.indexOf(label)); }

  function groupBy(list, keyFn) {
    const map = new Map();
    list.forEach((item) => {
      const k = keyFn(item);
      if (k == null) return;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    });
    return map;
  }

  function emotionWithTrigger(entries) {
    const groups = groupBy(entries, (e) => (e.confirmed.emotion && e.confirmed.trigger
      ? e.confirmed.emotion + '|' + e.confirmed.trigger : null));
    const out = [];
    groups.forEach((items, key) => {
      if (items.length < MIN_SUPPORT) return;
      const [emotion, trigger] = key.split('|');
      out.push({
        id: 'pair:' + key,
        kind: 'Repeated trigger',
        emotion,
        text: `In ${items.length} recent entries, ${emotionLabel(emotion).toLowerCase()} appears alongside situations involving ${triggerLabel(trigger)}.`,
        evidence: items.map((e) => e.id),
        strength: items.length + 1
      });
    });
    return out;
  }

  function emotionWithCategory(entries, taken) {
    const out = [];
    groupBy(entries, (e) => e.category || null).forEach((items, category) => {
      if (items.length < MIN_SUPPORT) return;
      groupBy(items, (e) => e.confirmed.emotion).forEach((withEmotion, emotion) => {
        const share = withEmotion.length / items.length;
        if (withEmotion.length < MIN_SUPPORT || share < 0.6) return;
        if (taken.has(emotion)) return; // already explained by a trigger pattern
        out.push({
          id: 'category:' + category + '|' + emotion,
          kind: 'Event category',
          emotion,
          text: `${withEmotion.length} of your ${items.length} entries about ${category.toLowerCase()} carry ${emotionLabel(emotion).toLowerCase()}.`,
          evidence: withEmotion.map((e) => e.id),
          strength: withEmotion.length
        });
      });
    });
    return out;
  }

  function timeOfDay(entries) {
    const out = [];
    groupBy(entries, (e) => e.confirmed.emotion).forEach((items, emotion) => {
      if (items.length < MIN_SUPPORT) return;
      groupBy(items, (e) => partOfDay(new Date(e.eventTime))).forEach((inPart, part) => {
        if (inPart.length / items.length < 0.7) return;
        out.push({
          id: 'time:' + emotion + '|' + part,
          kind: 'Time of day',
          emotion,
          text: `${emotionLabel(emotion)} tends to show up in the ${part}: ${inPart.length} of ${items.length} entries.`,
          evidence: inPart.map((e) => e.id),
          strength: inPart.length - 0.5
        });
      });
    });
    return out;
  }

  function recovery(entries) {
    const sorted = entries.slice().sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
    const after = [];
    sorted.forEach((e, i) => {
      if (NEGATIVE.includes(e.confirmed.emotion) || !e.confirmed.trigger) return;
      const prev = sorted[i - 1];
      if (!prev || !NEGATIVE.includes(prev.confirmed.emotion)) return;
      const gapHours = (new Date(e.eventTime) - new Date(prev.eventTime)) / 36e5;
      if (gapHours <= 48) after.push(e);
    });
    const out = [];
    groupBy(after, (e) => e.confirmed.trigger).forEach((items, trigger) => {
      if (items.length < 2) return;
      out.push({
        id: 'recovery:' + trigger,
        kind: 'Recovery',
        emotion: items[0].confirmed.emotion,
        text: `After a harder entry, the lighter entries that follow often involve ${triggerLabel(trigger)} (${items.length} times).`,
        evidence: items.map((e) => e.id),
        strength: items.length + 0.5
      });
    });
    return out;
  }

  function intensityTrend(entries) {
    const hard = entries
      .filter((e) => NEGATIVE.includes(e.confirmed.emotion) && e.confirmed.intensity) // feeling-only entries have no intensity
      .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
    if (hard.length < 6) return [];
    const mid = Math.floor(hard.length / 2);
    const avg = (list) => list.reduce((s, e) => s + intensityLevel(e.confirmed.intensity), 0) / list.length;
    const diff = avg(hard.slice(mid)) - avg(hard.slice(0, mid));
    if (Math.abs(diff) < 0.5) return [];
    return [{
      id: 'trend:intensity|' + (diff < 0 ? 'down' : 'up'),
      kind: 'Intensity over time',
      emotion: null,
      text: diff < 0
        ? 'Your more difficult entries seem to have become less intense over the past few weeks.'
        : 'Your more difficult entries seem to have become more intense over the past few weeks.',
      evidence: hard.map((e) => e.id),
      strength: 2
    }];
  }

  EJ.ai.findPatterns = function (entries) {
    const usable = entries.filter((e) => e.confirmed && e.confirmed.emotion);
    const pairs = emotionWithTrigger(usable);
    const taken = new Set(pairs.map((p) => p.emotion));
    return [
      ...pairs,
      ...emotionWithCategory(usable, taken),
      ...timeOfDay(usable),
      ...recovery(usable),
      ...intensityTrend(usable)
    ].sort((a, b) => b.strength - a.strength);
  };

  EJ.ai.partOfDay = partOfDay;
})();
