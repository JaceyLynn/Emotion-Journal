/*
 * SIMULATED AI: Reflection Layer
 *
 * Turns an interpretation into one short question. It never tells the user
 * what to feel, offers a diagnosis, or suggests a treatment. It only
 * offers another angle to look from.
 *
 * Questions come from curated lists; which one is picked depends on a hash
 * of the entry text, so the same entry always gets the same question.
 */
window.EJ = window.EJ || {};
EJ.ai = EJ.ai || {};

(function () {
  const GENERAL = [
    'Did this reaction feel familiar, or unusual for you?',
    'What part of this situation felt outside your control?',
    'Was the strongest part of this experience the event itself, or the uncertainty around it?',
    'If you told this to a friend, which detail would you start with?'
  ];

  const BY_EMOTION = {
    frustration: 'Was the frustration mostly about what happened, or about what it got in the way of?',
    anxiety: 'Which part of this is happening now, and which part is a guess about what comes next?',
    overwhelm: 'If one thing on your mind disappeared, which one would change the most?',
    sadness: 'Is this sadness about something that ended, or something that didn’t happen?',
    calm: 'What made this calm possible today?',
    relief: 'What had you been bracing for before the relief arrived?',
    gratitude: 'What does this gratitude say about what matters to you right now?',
    joy: 'What part of this would you want to remember a year from now?',
    pride: 'Who, if anyone, did you want to tell first?'
  };

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  EJ.ai.reflect = function (text, interpretation) {
    const pool = [];
    if (interpretation.trigger) pool.push(...EJ.TRIGGERS[interpretation.trigger].ask);
    if (interpretation.emotion) pool.push(BY_EMOTION[interpretation.emotion]);
    if (!pool.length) pool.push(...GENERAL);
    return pool[hash(text) % pool.length];
  };
})();
