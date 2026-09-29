/*
 * Fictional sample journal. Dates are relative to the visitor's "today" so
 * the demo always looks recent. The AI suggestion for each entry is
 * produced by the same simulated Interpreter the visitor uses; the
 * `confirmed` fields are what the fictional writer settled on, including a
 * few entries where they corrected the AI.
 */
window.EJ = window.EJ || {};

EJ.seed = (function () {
  const SAMPLES = [
    { d: 33, h: 14, category: 'Work', accuracy: 'accurate', intensity: 'High',
      text: "The client moved the deadline up by a week, and nobody told me until the meeting. I'm so frustrated that all the prep I did for the old timeline is wasted.",
      answer: 'Mostly that nobody told me. I could have adjusted if I had known a day earlier.' },
    { d: 31, h: 22, category: 'Relationships', accuracy: 'accurate', intensity: 'Moderate–high',
      text: 'Texted Sam about the weekend two days ago and still no reply. I keep rereading the message wondering if I said something wrong. Anxious and a bit silly about it.' },
    { d: 30, h: 8, category: 'Leisure', accuracy: 'accurate', intensity: 'Low',
      mood: { pleasure: 76, energy: 24 },
      text: 'Took a long walk by the river before work. The air was cold and everything felt slow and quiet.',
      answer: 'My body first. My thoughts caught up about halfway along.' },
    { d: 27, h: 16, category: 'Work', accuracy: 'accurate', intensity: 'High',
      text: 'Our team lead switched the project priorities for the third time this month. I had already told the designers what to build first. Ugh.' },
    { d: 26, h: 20, category: 'Study', accuracy: 'partly', intensity: 'Moderate',
      override: { emotion: 'anxiety' },
      note: 'It was less about the feedback and more that I don’t know if “safe” was a criticism.',
      text: "Feedback on my presentation was mostly positive but one comment keeps looping in my head. Not sure what they meant by 'safe choices'." },
    { d: 25, h: 13, category: 'Family', accuracy: 'accurate', intensity: 'Moderate–high',
      text: 'Lunch with my sister. We laughed about the stupid game we used to play as kids and I forgot about everything else for an hour.' },
    { d: 23, h: 18, category: 'Work', accuracy: 'accurate', intensity: 'High',
      text: "Three deadlines landed in the same week and I'm behind on all of them. It feels like too much." },
    { d: 22, h: 7, category: 'Leisure', accuracy: 'accurate', intensity: 'Low',
      text: 'Walked to the park early and sat in the sun with coffee. Felt calm for the first time in days.' },
    { d: 20, h: 21, category: 'Work', accuracy: 'accurate', intensity: 'Moderate',
      text: "Asked my manager twice what 'done' means for this project and got a vague answer both times. I'm worried I'll get it wrong and not find out until the review.",
      answer: 'The uncertainty. If someone said “this is the bar” I would be fine.' },
    { d: 18, h: 15, category: 'Work', accuracy: 'accurate', intensity: 'Moderate–high',
      text: 'They cancelled the launch meeting an hour before and moved it to Friday. Rescheduled my whole afternoon for nothing. Frustrating.' },
    { d: 16, h: 11, category: 'Study', accuracy: 'accurate', intensity: 'Moderate–high',
      text: 'Finally figured out the bug that has been blocking me all week. Proud of sticking with it.' },
    { d: 14, h: 19, category: 'Relationships', accuracy: 'accurate', intensity: 'Moderate',
      text: "Dinner with friends I haven't seen since spring. I'm grateful we still pick up right where we left off." },
    { d: 12, h: 23, category: 'Relationships', accuracy: 'not', intensity: 'Moderate',
      override: { emotion: 'anxiety' },
      note: 'Not relief at all. The reply made it worse.',
      text: "Sam finally replied but just said 'we'll see'. I don't know what that means and I can't stop thinking about it." },
    { d: 11, h: 9, category: 'Leisure', accuracy: 'accurate', intensity: 'Low',
      text: 'Slow morning. Walked around the garden and did nothing in particular. Calm.' },
    { d: 8, h: 14, category: 'Health', accuracy: 'accurate', intensity: 'Moderate',
      text: 'Got the test results back and everything is fine. Relieved. Such a relief after a week of worrying.' },
    { d: 6, h: 17, category: 'Work', accuracy: 'partly', intensity: 'Moderate',
      note: 'Less intense than it would have been a month ago.',
      text: 'Workload is piling up before the holidays. Too much at once, but I made a list and it feels a bit more manageable.' },
    { d: 4, h: 12, category: 'Work', accuracy: 'accurate', intensity: 'Moderate',
      text: 'Presented the new flow to the team and it went well. People asked good questions. Proud of how far it has come.' },
    { d: 2, h: 16, category: 'Work', accuracy: 'partly', intensity: 'High',
      override: { trigger: 'changing_expectations' },
      note: 'It’s about losing control of my own schedule, not just the change.',
      question: 'Was the strongest part of the frustration the change itself, or not having enough time to adjust?',
      text: 'My manager changed the plan again today after I had already organized my schedule around what we agreed on. I was more upset than I expected.' },
    // A few second and third entries on the same day, so the calendar's
    // concentric rings have something to show.
    { d: 30, h: 19, category: 'Family', accuracy: 'accurate', intensity: 'Moderate',
      text: 'Called my mom on the way home. She told her favourite story about the dog and I laughed anyway.' },
    { d: 22, h: 20, category: 'Leisure', accuracy: 'accurate', intensity: 'Low',
      text: 'Quiet evening. Cooked something slow and read for an hour. Settled.' },
    { d: 12, h: 9, category: 'Work', accuracy: 'accurate', intensity: 'Moderate',
      text: 'Finished the draft I have been avoiding for days. Relieved it is over with.' },
    { d: 4, h: 20, category: 'Relationships', accuracy: 'accurate', intensity: 'Moderate',
      text: 'Dinner with friends after the presentation. Grateful for people who ask how things went.' },
    { d: 2, h: 9, category: 'Health', accuracy: 'accurate', intensity: 'Low',
      text: 'Slow walk before work, the sun was out. Felt calm.' },
    { d: 2, h: 21, category: 'Family', accuracy: 'partly', intensity: 'Moderate',
      note: 'Lighter, not fully relieved yet.',
      text: 'Talked it through with my sister and felt a bit lighter. Relieved I said something.' }
  ];

  function build() {
    const now = new Date();
    return SAMPLES.map((s, i) => {
      const when = new Date(now);
      when.setDate(now.getDate() - s.d);
      when.setHours(s.h, (i * 17) % 60, 0, 0);

      const suggested = EJ.ai.interpret({ text: s.text, mood: s.mood });
      const confirmed = Object.assign(
        { emotion: suggested.emotion, trigger: suggested.trigger, intensity: s.intensity, note: s.note || '' },
        s.override || {}
      );
      const question = s.question || EJ.ai.reflect(s.text, confirmed);

      return {
        id: 'sample-' + (i + 1),
        sample: true,
        createdAt: when.toISOString(),
        eventTime: when.toISOString(),
        text: s.text,
        category: s.category,
        mood: s.mood || null,
        suggested,
        accuracy: s.accuracy,
        confirmed,
        reflection: { question, answer: s.answer || '' }
      };
    });
  }

  return { build };
})();
