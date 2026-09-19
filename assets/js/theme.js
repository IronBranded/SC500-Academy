/* theme.js - SC-500 guide
   Theme control: dark (default), light, or follow the OS.

   Loaded FIRST and applied synchronously, before the stylesheets paint, so a
   reader on light mode never sees a dark flash and vice versa. That is the only
   reason this file exists rather than living in app.js. */

(function (global) {
  'use strict';

  var KEY = 'sc500:theme:v1';
  var ORDER = ['dark', 'light', 'system'];
  var LABEL = { dark: 'Dark', light: 'Light', system: 'System' };
  var GLYPH = { dark: '\u25D0', light: '\u25CB', system: '\u25D1' };

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) !== -1 ? v : 'dark';
    } catch (e) { return 'dark'; }
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = GLYPH[theme] + ' ' + LABEL[theme];
      btn.setAttribute('aria-label', 'Theme: ' + LABEL[theme] + '. Click to change.');
      btn.title = 'Theme: ' + LABEL[theme] + ' (click to cycle)';
    }
  }

  /* Run immediately - the <html> element exists by the time this script does. */
  apply(read());

  function next() {
    var i = ORDER.indexOf(read());
    apply(ORDER[(i + 1) % ORDER.length]);
  }

  function mount() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    apply(read());
    btn.addEventListener('click', next);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  global.SC500Theme = { get: read, set: apply, cycle: next };
})(window);
