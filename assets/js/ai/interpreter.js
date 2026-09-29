/*
 * SIMULATED AI: Interpreter
 *
 * Looks at one journal entry and proposes a possible emotion, trigger,
 * intensity and a short observation. In the original prototype this was a
 * call to a local language model (LM Studio / Ollama). In this portfolio
 * demo it is deterministic keyword matching over EJ lexicon data, so the
 * same entry always gets the same reading and nothing leaves the browser.
 *
 * Every output is a suggestion. The user confirms or rewrites it.
 */
window.EJ = window.EJ || {};
EJ.ai = EJ.ai || {};

(function () {
  // A keyword counts only where a word starts, so "ugh" doesn't match "laughed".
  function countMatches(text, keywords) {
    return keywords.reduce((n, k) => {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return n + (new RegExp('(^|[^a-z])' + escaped).test(text) ? 1 : 0);
    }, 0);
  }

  function topMatch(text, table) {
    let best = null;
    let bestScore = 0;
    Object.entries(table).forEach(([key, keywords]) => {
      const score = countMatches(text, keywords);
      if (score > bestScore) { best = key; bestScore = score; }
    });
    return { key: best, score: bestScore };
  }

  function estimateIntensity(raw, mood, emotion) {
    const text = raw.toLowerCase();
    // High-energy emotions start one step up the scale.
    let score = emotion && EJ.EMOTIONS[emotion].energy >= 60 ? 2 : 1;
    if (/\b(so|really|very|extremely|completely|totally)\b/.test(text)) score += 1;
    if (/than i expected|can't stop|can’t stop|all day|all week/.test(text)) score += 1;
    if ((raw.match(/!/g) || []).length >= 1) score += 1;
    if (/\b[A-Z]{3,}\b/.test(raw)) score += 1;
    if (mood) score += Math.abs(mood.energy - 50) > 30 ? 1 : 0;
    return EJ.INTENSITIES[Math.min(score, 4) - 1];
  }

  /**
   * @param {{text: string, mood?: {pleasure:number, energy:number}}} entry
   * @returns {{emotion, trigger, intensity, observation, confidence}}
   */
  EJ.ai.interpret = function (entry) {
    const text = ' ' + entry.text.toLowerCase().replace(/[‘’]/g, "'") + ' ';

    const emotionMatch = topMatch(text, EJ.EMOTION_KEYWORDS);
    const triggerMatch = topMatch(
      text,
      Object.fromEntries(Object.entries(EJ.TRIGGERS).map(([k, t]) => [k, t.keywords]))
    );

    // The Mood Meter is a second signal: if the words don't name a
    // feeling, the location the user picked stands in for it.
    let emotion = emotionMatch.key;
    if (!emotion && entry.mood) emotion = EJ.emotionFromMood(entry.mood.pleasure, entry.mood.energy);

    const trigger = triggerMatch.key;
    const confidence = (emotionMatch.score ? 1 : 0) + (triggerMatch.score ? 1 : 0);

    let observation;
    if (trigger) {
      observation = EJ.TRIGGERS[trigger].observe;
    } else if (emotion) {
      observation = 'I couldn’t tell what this was connected to. You’ll know better than I do.';
    } else {
      observation = 'I’m not confident about this one. It might help to say a little more about what happened, or to locate the feeling on the Mood Meter.';
    }

    return {
      emotion: emotion || null,
      trigger: trigger || null,
      intensity: estimateIntensity(entry.text, entry.mood, emotion),
      observation,
      confidence // 0 = guessing, 2 = both emotion and trigger had matches
    };
  };
})();
