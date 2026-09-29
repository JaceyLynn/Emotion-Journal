/*
 * Voice input for the entry box, using the browser's own speech
 * recognition (Web Speech API) where it exists. Speech is added to
 * whatever is already written. If the browser has no speech recognition,
 * or the microphone is blocked, the button explains that instead.
 */
window.EJ = window.EJ || {};

EJ.VoiceInput = function (textarea, button, say) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let base = '';
  let finalText = '';
  let failed = false;

  function setListening(on) {
    button.classList.toggle('is-listening', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Stop voice input' : 'Speak your entry');
    button.querySelector('.voice-label').textContent = on ? 'Listening… tap to stop' : 'Speak';
  }

  function stop() { if (rec) rec.stop(); }

  function start() {
    if (!Recognition) {
      say('This browser doesn’t offer voice input. Try Chrome, Edge or Safari, or type instead.');
      return;
    }
    base = textarea.value.trim();
    finalText = '';
    failed = false;
    rec = new Recognition();
    rec.lang = document.documentElement.lang || navigator.language || 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      const spoken = (finalText + interim).trim();
      textarea.value = (base ? base + ' ' : '') + spoken.charAt(0).toUpperCase() + spoken.slice(1);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = (ev) => {
      failed = true;
      const messages = {
        'not-allowed': 'The microphone is blocked for this page. Allow it in the browser, or type instead.',
        'service-not-allowed': 'The microphone is blocked for this page. Allow it in the browser, or type instead.',
        'no-speech': 'Didn’t catch anything. Tap Speak and try again.',
        'audio-capture': 'No microphone was found.',
        network: 'Voice input needs a connection to the browser’s speech service.'
      };
      say(messages[ev.error] || 'Voice input stopped. You can try again or type instead.');
    };
    rec.onend = () => { setListening(false); rec = null; if (!failed) say(''); };

    try {
      rec.start();
      setListening(true);
      say('Listening. Say what happened and how it felt.');
    } catch (err) {
      say('Voice input couldn’t start here. You can type instead.');
    }
  }

  button.addEventListener('click', () => (rec ? stop() : start()));
  setListening(false);

  return { stop, get supported() { return !!Recognition; } };
};
