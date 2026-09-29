/* Small shared helpers used by every view. */
window.EJ = window.EJ || {};

EJ.util = {
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  formatDay(iso) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  },
  formatShort(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  },
  formatTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  },
  toast(message, link) {
    const el = document.getElementById('toast');
    el.innerHTML = EJ.util.esc(message) + (link ? ` <a href="${link.href}">${EJ.util.esc(link.label)}</a>` : '');
    el.hidden = false;
    clearTimeout(EJ.util._toastTimer);
    EJ.util._toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
  },
  emotionLabel(key) { return key && EJ.EMOTIONS[key] ? EJ.EMOTIONS[key].label : 'Unnamed'; },
  emotionColor(key) { return key && EJ.EMOTIONS[key] ? EJ.EMOTIONS[key].color : '#9a948a'; },
  triggerLabel(key) { return key && EJ.TRIGGERS[key] ? EJ.TRIGGERS[key].label : 'Something else'; }
};
