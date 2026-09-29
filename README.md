# Emotion Journal

*Notice what happened. Notice what repeats.*

**An AI-assisted emotional journal that helps people notice recurring patterns in their reactions while keeping interpretation in human hands.**

This repository holds a static portfolio demo (the site at the root) and the original working prototype (in [`prototype/`](prototype/)).

## Concept

Emotion Journal is a reflective journal for quickly documenting emotional reactions to events and discovering patterns across time. You write what happened and what you felt. A quiet “second reader” offers one possible reading of the entry. You decide whether it fits.

The guiding principle is **AI suggests. You decide.**

## Design question

The question is not *how can AI tell someone what they are feeling?*

It is: **how can AI help someone notice patterns in their own experience while preserving their authority over interpretation?**

So the AI is framed as a hypothesis generator, not an authority. Its language stays tentative (“I noticed…”, “This may be connected to…”, “One possible reading…”), and it never offers diagnosis, therapy or instructions.

## Interaction flow

**Capture → Interpret → Confirm → Compare → Reflect**

Journal, History and Patterns are sections of one continuous page, so the whole loop reads top to bottom. About is a separate view that explains the concept and what is simulated.

1. **Capture.** Describe what happened, when, and optionally its context. If the feeling is hard to name, the Mood Meter lets you locate it on pleasure and energy instead.
2. **Interpret.** A margin note proposes a possible emotion, possible trigger, intensity and a short observation.
3. **Confirm.** You answer *Feels accurate*, *Partly accurate* or *Not how I see it*. Every label stays editable, and you can add your own words.
4. **Compare.** The Patterns section looks across entries for possible recurring relationships. It also keeps the original prototype's two visualisations, rebuilt in D3: a monthly calendar where each day is a set of concentric ink-blot rings (one per entry), and a daily view that places each entry in a two-hour column by how pleasant it felt.
5. **Reflect.** Instead of reassurance, each entry ends with one specific question to sit with.

## AI concept architecture

The AI has three responsibilities, each kept in its own file under [`assets/js/ai/`](assets/js/ai/):

| Role | What it does | File |
| --- | --- | --- |
| **Interpreter** | Reads one entry and proposes a possible emotion, trigger, intensity and observation. | `interpreter.js` |
| **Pattern Finder** | Looks across confirmed entries for recurring relationships: emotion + trigger, emotion + event category, time of day, what tends to follow a harder day, and intensity over time. | `patternFinder.js` |
| **Reflection Layer** | Turns an interpretation into a short question. It never says what to feel, suggests a diagnosis or recommends an action. | `reflection.js` |

The vocabulary they draw on (emotions, triggers, keywords, observations and questions) lives in [`assets/js/lexicon.js`](assets/js/lexicon.js).

## Human-in-the-loop design

- Every reading is framed as a suggestion and can be confirmed, partly accepted or rejected.
- Changing any label counts as a revision. The user’s version is what gets stored.
- History shows the user’s version first, and where they corrected the AI it also keeps what the AI originally suggested.
- The Pattern Finder reads only the user’s confirmed version, so corrections change which patterns appear.
- Each pattern is put back to the user as a question (“Does this connection feel meaningful to you?”) with *Yes*, *Maybe* or *No*. Patterns marked *No* are set aside.

## Privacy

Personal journal content should remain private whenever possible. The demo runs entirely in the browser: entries are kept in `localStorage` and never sent anywhere. The original prototype explored the same principle by running language models locally, so journal text never had to go to a third-party AI service.

## Portfolio demo: what is simulated

**The AI in this demo is simulated.** There is no language model and no API call. The Interpreter uses transparent keyword matching against the lexicon, the Reflection Layer picks from curated questions, and the Pattern Finder uses simple counts and thresholds. The same entry always gets the same reading.

The sample journal is fictional. It is generated on first visit with dates relative to today, and can be restored from the About page.

## Original technical exploration

The [`prototype/`](prototype/) folder holds the earlier working version:

- A Node/Express web app (`prototype/server.js`, `prototype/public/`) that sent entries to a local model in **LM Studio** (`localhost:1234`) for emotion categorisation, sentiment scoring and responses, stored entries in a JSON file, and visualised them with p5.js and D3.
- An earlier command-line version (`prototype/index.js`) that used **Ollama** for the same analysis. Its original README is at [`prototype/README.md`](prototype/README.md).

The prototype needs Node.js and a local model server to run; it is kept for reference and is not part of the published demo.

## Running the demo

There is no build step and no dependencies to install. Serve the repository root with any static file server, for example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

D3 is vendored in `assets/vendor/`, so the demo works offline apart from the web fonts.

## GitHub Pages deployment

1. In the repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder, then save.
4. The site will be published at `https://<username>.github.io/Emotion-Journal/`.

All paths in the site are relative, so it works from that sub-path without changes. The empty `.nojekyll` file tells Pages to serve the files as they are.

## Project structure

```
index.html              the single-page demo
assets/css/styles.css   visual design
assets/js/
  util.js               shared helpers
  lexicon.js            emotions, triggers, Mood Meter words
  ai/                   simulated Interpreter, Pattern Finder, Reflection Layer
  seed.js               fictional sample journal
  store.js              localStorage persistence
  moodMeter.js          pleasure/energy picker
  views/                Journal, History and Patterns sections
  app.js                page navigation (one scroll plus About)
assets/vendor/d3.min.js D3 v7 (ISC licence)
prototype/              original LM Studio / Ollama prototype
```
