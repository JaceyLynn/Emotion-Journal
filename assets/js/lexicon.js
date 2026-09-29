/*
 * Shared vocabulary for the demo: emotions, possible triggers, event
 * categories and the Mood Meter word map. Everything the simulated AI
 * "knows" lives here, so it is easy to read and easy to change.
 */
window.EJ = window.EJ || {};

EJ.EMOTIONS = {
  frustration: { label: 'Frustration', color: '#b4553c', valence: 25, energy: 72 },
  anxiety:     { label: 'Anxiety',     color: '#8a6aa3', valence: 28, energy: 68 },
  overwhelm:   { label: 'Overwhelm',   color: '#8c4a5e', valence: 20, energy: 60 },
  sadness:     { label: 'Sadness',     color: '#4d6c8c', valence: 22, energy: 25 },
  calm:        { label: 'Calm',        color: '#5b8a74', valence: 72, energy: 25 },
  relief:      { label: 'Relief',      color: '#5f93ad', valence: 68, energy: 40 },
  gratitude:   { label: 'Gratitude',   color: '#7a8f3e', valence: 78, energy: 45 },
  joy:         { label: 'Joy',         color: '#c99a2e', valence: 85, energy: 75 },
  pride:       { label: 'Pride',       color: '#2f7480', valence: 80, energy: 68 }
};

EJ.EMOTION_KEYWORDS = {
  frustration: ['frustrat', 'annoy', 'irritat', 'upset', 'fed up', 'again', 'ugh', 'pointless', 'wasted'],
  anxiety:     ['anxious', 'nervous', 'worried', 'worry', 'uneasy', 'on edge', 'dread', 'what if', 'panic', 'overthink'],
  overwhelm:   ['overwhelm', 'too much', 'drowning', 'swamped', 'buried', 'no time', 'behind on'],
  sadness:     ['sad', 'down', 'lonely', 'miss ', 'missed', 'empty', 'cried', 'disappoint', 'heavy'],
  calm:        ['calm', 'peaceful', 'quiet', 'slow', 'breathe', 'settled', 'at ease'],
  relief:      ['relief', 'relieved', 'finally', 'weight off', 'phew', 'over with'],
  gratitude:   ['grateful', 'thankful', 'appreciate', 'lucky', 'kind of them', 'thank'],
  joy:         ['happy', 'joy', 'laugh', 'fun', 'delight', 'excited', 'amazing', 'loved it', 'great'],
  pride:       ['proud', 'accomplish', 'nailed', 'figured out', 'managed to', 'finished', 'shipped']
};

// Possible triggers the Interpreter can suggest. `observe` and `ask`
// feed the "What I noticed" note and the reflective question.
EJ.TRIGGERS = {
  changing_expectations: {
    label: 'Changing expectations',
    keywords: ['changed the plan', 'changed', 'again', 'last minute', 'moved the', 'cancel', 'switched', 'new plan', 'shifted', 'rescheduled'],
    observe: 'You seem less affected by the change itself than by it arriving after you had already planned around the earlier version.',
    ask: [
      'Was the strongest part of this the change itself, or not having enough time to adjust?',
      'What would have needed to be different for the change to feel manageable?',
      'Did this reaction feel familiar, or unusual for you?'
    ]
  },
  unclear_communication: {
    label: 'Unclear communication',
    keywords: ["didn't hear back", 'no reply', 'unclear', 'vague', 'not sure what', "didn't say", "didn't explain", 'mixed signals', 'ignored', 'left on read', 'no idea what', "don't know what"],
    observe: 'Much of the weight here seems to sit in what was left unsaid, rather than in anything that actually happened.',
    ask: [
      'Was the strongest part of this the event itself, or the uncertainty around it?',
      'What story did you find yourself filling the silence with?',
      'What would a clear answer have changed for you?'
    ]
  },
  workload: {
    label: 'Workload and time pressure',
    keywords: ['deadline', 'too much', 'workload', 'behind', 'overtime', 'no time', 'rushing', 'to-do', 'piling'],
    observe: 'The amount seems to matter, but so does the feeling of not having room to breathe between things.',
    ask: [
      'Which part of the load felt heaviest, and was it the biggest task?',
      'What part of this situation felt outside your control?'
    ]
  },
  time_outdoors: {
    label: 'Time outdoors',
    keywords: ['walk', 'outside', 'park', 'sun', 'trees', 'river', 'hike', 'fresh air', 'garden', 'beach'],
    observe: 'Being outside seems to have shifted the pace of the day, not just the mood of the moment.',
    ask: [
      'What changed first when you were outside: your thoughts, or your body?',
      'Is this something you tend to reach for, or did it happen by chance?'
    ]
  },
  connection: {
    label: 'Time with people',
    keywords: ['friend', 'dinner with', 'called my', 'my sister', 'my brother', 'my mom', 'my dad', 'together', 'hung out', 'caught up'],
    observe: 'The people in this moment seem to be doing a lot of the work, more than the activity itself.',
    ask: [
      'What was it about this person or group that made the moment land the way it did?',
      'Did you feel more like yourself, or like a different version of yourself?'
    ]
  },
  feedback: {
    label: 'Feedback and being evaluated',
    keywords: ['feedback', 'review', 'critique', 'presentation', 'presented', 'judged', 'graded', 'comments on my'],
    observe: 'It sounds like the evaluation touched something beyond the work, closer to how you see yourself.',
    ask: [
      'Was the reaction to what was said, or to who said it?',
      'Which part of the feedback are you still turning over?'
    ]
  },
  progress: {
    label: 'Making progress',
    keywords: ['finished', 'figured out', 'progress', 'shipped', 'solved', 'completed', 'breakthrough', 'finally got'],
    observe: 'The good feeling here seems tied to momentum, the sense of something moving after being stuck.',
    ask: [
      'What made progress possible this time?',
      'Did the feeling come from the result, or from how you got there?'
    ]
  },
  rest: {
    label: 'Rest and slowing down',
    keywords: ['slept', 'nap', 'day off', 'rest', 'lazy', 'nothing planned', 'slow morning', 'weekend'],
    observe: 'Having nothing to answer to seems to have mattered as much as the rest itself.',
    ask: [
      'What made it possible to slow down today?',
      'Did slowing down feel easy, or did part of you resist it?'
    ]
  }
};

EJ.CATEGORIES = ['Work', 'Study', 'Relationships', 'Family', 'Health', 'Daily routine', 'Leisure', 'Other'];

EJ.INTENSITIES = ['Low', 'Moderate', 'Moderate–high', 'High'];

// Mood Meter words placed on a pleasure (x) / energy (y) plane, 0–100.
// Adapted from the original prototype's forty-word map.
EJ.MOOD_WORDS = [
  ['Enraged', 3, 97], ['Panicked', 8, 90], ['Stressed', 15, 85], ['Jittery', 22, 84], ['Angry', 18, 78],
  ['Anxious', 26, 74], ['Nervous', 30, 68], ['Irritated', 32, 62], ['Annoyed', 36, 57], ['Tense', 42, 55],
  ['Despairing', 5, 5], ['Hopeless', 10, 12], ['Miserable', 18, 20], ['Sad', 25, 25], ['Lonely', 22, 34],
  ['Discouraged', 32, 30], ['Tired', 38, 18], ['Bored', 42, 40], ['Down', 30, 42], ['Drained', 12, 30],
  ['Serene', 95, 8], ['Tranquil', 88, 14], ['Peaceful', 84, 20], ['Comfortable', 78, 26], ['Calm', 74, 30],
  ['Relaxed', 70, 20], ['Content', 68, 36], ['Secure', 62, 30], ['Satisfied', 62, 42], ['Grateful', 80, 42],
  ['Ecstatic', 97, 97], ['Elated', 92, 92], ['Thrilled', 88, 88], ['Enthusiastic', 84, 82], ['Inspired', 82, 76],
  ['Excited', 78, 80], ['Motivated', 74, 72], ['Happy', 72, 66], ['Proud', 80, 68], ['Pleasant', 60, 58]
];

// Maps a Mood Meter position to the closest emotion in EJ.EMOTIONS.
EJ.emotionFromMood = function (pleasure, energy) {
  let best = null;
  let bestDist = Infinity;
  Object.entries(EJ.EMOTIONS).forEach(([key, e]) => {
    const d = Math.hypot(e.valence - pleasure, e.energy - energy);
    if (d < bestDist) { bestDist = d; best = key; }
  });
  return best;
};

EJ.moodWord = function (pleasure, energy) {
  let best = EJ.MOOD_WORDS[0];
  let bestDist = Infinity;
  EJ.MOOD_WORDS.forEach((w) => {
    const d = Math.hypot(w[1] - pleasure, w[2] - energy);
    if (d < bestDist) { bestDist = d; best = w; }
  });
  return best[0];
};
