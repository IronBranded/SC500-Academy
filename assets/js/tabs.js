/* tabs.js - SC-500 guide
   Collapsible depth.

   The brief asks for first-principles explanations and exam tips to be visually
   distinct and collapsible, so the same page serves a first pass (concept and
   lab) and a review pass (exam tips and self-check).

   This works on the section headings the content actually uses. If a module
   renames one of these headings, it simply stops folding - no error, no gap. */

(function (global) {
  'use strict';

  /* heading text (lowercased) -> behaviour */
  var SECTIONS = {
    'why this exists':          { role: 'concept', label: 'First principles' },
    'how it works under the hood': { role: 'concept', label: 'Mechanism' },
    'configuration surface':    { role: 'concept', label: 'Configuration' },
    'common failure modes':     { role: 'review',   label: 'Failure modes' },
    'how this is tested':       { role: 'review',   label: 'Exam tips' },
    'check yourself':           { role: 'review',   label: 'Self-check' }
  };

  var MODE_KEY = 'sc500:readmode:v1';

  function textOf(h) { return (h.textContent || '').trim().toLowerCase(); }

  /* Collect everything between this h2 and the next h2. */
  function sectionNodes(h2) {
    var out = [], n = h2.nextSibling;
    while (n && !(n.nodeType === 1 && n.tagName === 'H2')) {
      out.push(n);
      n = n.nextSibling;
    }
    return out;
  }

  function fold(h2, meta) {
    var body = sectionNodes(h2);
    if (!body.length) return null;

    var details = document.createElement('details');
    details.className = 'depth';
    details.dataset.role = meta.role;

    var summary = document.createElement('summary');
    summary.textContent = h2.textContent;
    details.appendChild(summary);

    var holder = document.createElement('div');
    body.forEach(function (n) { holder.appendChild(n); });
    details.appendChild(holder);

    h2.parentNode.replaceChild(details, h2);
    return details;
  }

  function apply(mode, panels) {
    panels.forEach(function (d) {
      if (mode === 'review') d.open = d.dataset.role === 'review';
      else d.open = true;
    });
  }

  function mount(root) {
    var heads = root.querySelectorAll('h2');
    var panels = [];

    /* Snapshot first: folding mutates the DOM as we go. */
    var targets = [];
    for (var i = 0; i < heads.length; i++) {
      var meta = SECTIONS[textOf(heads[i])];
      if (meta) targets.push({ h2: heads[i], meta: meta });
    }
    targets.forEach(function (t) {
      var d = fold(t.h2, t.meta);
      if (d) panels.push(d);
    });

    if (!panels.length) return;

    var saved = 'full';
    try { saved = localStorage.getItem(MODE_KEY) || 'full'; } catch (e) {}
    apply(saved, panels);

    var strip = root.querySelector('.progress-strip');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = saved === 'review' ? 'Show everything' : 'Review pass';
    btn.title = 'Review pass collapses the explanation and leaves failure modes, exam tips and self-check open';
    btn.addEventListener('click', function () {
      saved = saved === 'review' ? 'full' : 'review';
      try { localStorage.setItem(MODE_KEY, saved); } catch (e) {}
      apply(saved, panels);
      btn.textContent = saved === 'review' ? 'Show everything' : 'Review pass';
    });

    if (strip) strip.appendChild(btn);
    else root.insertBefore(btn, root.firstChild);
  }

  global.SC500Tabs = { mount: mount };
})(window);
