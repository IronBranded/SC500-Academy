/* palette.js - SC-500 guide
   Command palette, opened with Ctrl/Cmd+K.

   Indexes three different kinds of thing, because they are three different
   questions a reader has:

     modules and labs   "take me to 02-04"
     sub-objectives     "which module covers just-in-time VM access?"
     actions            "reset this page", "jump to teardown", "review pass"

   Headings on the current page are added live, so "teardown" reaches the
   teardown section of whichever lab is open. */

(function (global) {
  'use strict';

  var manifest = null, entries = [], loaded = false;
  var el, input, list, active = 0, results = [];

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Subsequence match: "02fw" finds "02-04 ... Firewall". Score rewards
     contiguity and early matches so exact prefixes win. */
  function fuzzy(needle, hay) {
    var n = needle.toLowerCase(), h = hay.toLowerCase();
    if (!n) return 0;
    var hi = 0, score = 0, streak = 0;
    for (var i = 0; i < n.length; i++) {
      var c = n.charAt(i);
      if (c === ' ') { streak = 0; continue; }
      var at = h.indexOf(c, hi);
      if (at === -1) return -1;
      streak = (at === hi) ? streak + 1 : 0;
      score += 10 + streak * 6 - Math.min(at - hi, 12);
      hi = at + 1;
    }
    if (h.indexOf(n) === 0) score += 60;
    else if (h.indexOf(n) !== -1) score += 30;
    return score;
  }

  /* ---------------------------------------------------------------- index */

  function baseEntries() {
    var out = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        out.push({ kind: 'Module', label: m.id + '  ' + m.title, sub: d.name, href: '#/module/' + m.id });
        if (m.lab) out.push({ kind: 'Lab', label: m.id + '  ' + m.title + ' — lab', sub: d.name, href: '#/lab/' + m.id });
      });
    });
    (manifest.appendix || []).forEach(function (a, i) {
      out.push({ kind: 'Appendix', label: a.title, sub: 'Reference', href: '#/appendix/' + i });
    });
    out.push({ kind: 'View', label: 'Dashboard', sub: 'Progress and coverage', href: '#/' });
    out.push({ kind: 'View', label: 'Cost planner', sub: 'What can I afford to run', href: '#/cost' });
    out.push({ kind: 'View', label: 'Readiness', sub: 'What to study next', href: '#/readiness' });
    return out;
  }

  /* The 87 sub-objectives, so you can search by what the exam actually asks. */
  function loadObjectives() {
    if (loaded) return Promise.resolve();
    loaded = true;
    var jobs = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        jobs.push(fetch(m.content, { cache: 'force-cache' })
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (t) {
            if (!t) return;
            var fmData = global.SC500FrontMatter.parse(t).data || {};
            (fmData.sub_objectives || []).forEach(function (s) {
              entries.push({ kind: 'Objective', label: s, sub: m.id + ' · ' + d.name, href: '#/module/' + m.id });
            });
          }).catch(function () {}));
      });
    });
    return Promise.all(jobs);
  }

  function pageEntries() {
    var out = [];
    document.querySelectorAll('#content h2, #content h3, #content details.depth > summary').forEach(function (h) {
      var text = h.textContent.replace(/§$/, '').trim();
      if (!text || !h.id) return;
      out.push({ kind: 'On this page', label: text, sub: 'Current page', jump: h.id });
    });
    return out;
  }

  function actions() {
    return [
      { kind: 'Action', label: 'Reset this page', sub: 'Clears checkboxes and quiz answers', run: function () {
          var b = document.querySelector('#page-progress .btn[data-variant="danger"]');
          if (b) { b.click(); b.focus(); }
        } },
      { kind: 'Action', label: 'Toggle review pass', sub: 'Collapse explanation, keep exam tips', run: function () {
          var b = Array.prototype.find.call(document.querySelectorAll('#page-progress .btn'),
            function (x) { return /review|show everything/i.test(x.textContent); });
          if (b) b.click();
        } },
      { kind: 'Action', label: 'Download progress', sub: 'Export as JSON', run: function () {
          location.hash = '#/';
          setTimeout(function () {
            var b = Array.prototype.find.call(document.querySelectorAll('.btn'),
              function (x) { return x.textContent === 'Download progress'; });
            if (b) b.click();
          }, 300);
        } }
    ];
  }

  /* -------------------------------------------------------------- render */

  function render(q) {
    var pool = entries.concat(pageEntries(), actions());
    results = pool
      .map(function (e) { return { e: e, s: q ? fuzzy(q, e.label + ' ' + (e.sub || '')) : 0 }; })
      .filter(function (r) { return q ? r.s > 0 : true; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, q ? 14 : 8)
      .map(function (r) { return r.e; });

    list.textContent = '';
    active = 0;

    if (!results.length) {
      list.appendChild(node('li', 'pal__empty', 'Nothing matches “' + q + '”.'));
      return;
    }

    results.forEach(function (e, i) {
      var li = node('li', 'pal__item');
      li.dataset.active = i === 0 ? 'true' : 'false';
      li.appendChild(node('span', 'pal__kind', e.kind));
      var body = node('span', 'pal__body');
      body.appendChild(node('span', 'pal__label', e.label));
      if (e.sub) body.appendChild(node('span', 'pal__sub', e.sub));
      li.appendChild(body);
      li.addEventListener('click', function () { go(e); });
      list.appendChild(li);
    });
  }

  function move(delta) {
    var items = list.querySelectorAll('.pal__item');
    if (!items.length) return;
    items[active].dataset.active = 'false';
    active = (active + delta + items.length) % items.length;
    items[active].dataset.active = 'true';
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function go(e) {
    close();
    if (e.run) return e.run();
    if (e.jump) {
      var t = document.getElementById(e.jump);
      if (t) {
        var fold = t.closest ? t.closest('details.depth') : null;
        if (fold) fold.open = true;
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    location.hash = e.href;
  }

  var restoreFocus = null;

  function open() {
    restoreFocus = document.activeElement;
    el.hidden = false;
    input.value = '';
    render('');
    input.focus();
    loadObjectives().then(function () { if (!el.hidden) render(input.value); });
  }

  function close() {
    if (el.hidden) return;
    el.hidden = true;
    input.blur();
    /* Put the reader back where they were, rather than on <body>. */
    if (restoreFocus && restoreFocus.focus) { try { restoreFocus.focus(); } catch (e) {} }
    restoreFocus = null;
  }

  function build() {
    el = node('div', 'pal');
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Command palette');

    var box = node('div', 'pal__box');
    input = document.createElement('input');
    input.className = 'pal__input';
    input.type = 'text';
    input.placeholder = 'Go to a module, an objective, or run a command…';
    input.setAttribute('aria-label', 'Command palette search');
    box.appendChild(input);

    list = node('ul', 'pal__list');
    box.appendChild(list);

    var hint = node('div', 'pal__hint');
    hint.appendChild(node('span', null, '↑↓ move'));
    hint.appendChild(node('span', null, '⏎ open'));
    hint.appendChild(node('span', null, 'esc close'));
    box.appendChild(hint);

    el.appendChild(box);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    document.body.appendChild(el);

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) go(results[active]); }
      /* Escape is handled globally at capture phase - see mount(). */
    });
  }

  function mount(m) {
    manifest = m;
    entries = baseEntries();
    build();

    /* Escape is handled first, at capture phase, so it works regardless of
       where focus currently sits and cannot be swallowed by a child handler.
       It closes whatever is open, in the order a reader would expect. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;

      if (!el.hidden) { e.preventDefault(); e.stopPropagation(); close(); return; }

      var results = document.getElementById('search-results');
      if (results && !results.hidden) {
        e.preventDefault();
        results.hidden = true;
        results.textContent = '';
        var box = document.getElementById('search');
        if (box) { box.value = ''; box.blur(); }
        return;
      }

      var drawer = document.getElementById('sidebar');
      if (drawer && drawer.dataset.open === 'true') {
        e.preventDefault();
        drawer.dataset.open = 'false';
        var toggle = document.getElementById('nav-toggle');
        if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
        return;
      }

      /* Nothing open: drop focus out of the search box if that is where it is. */
      if (document.activeElement && document.activeElement.id === 'search') {
        document.activeElement.value = '';
        document.activeElement.blur();
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        el.hidden ? open() : close();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      /* Vim-ish navigation, because this is read at a terminal. */
      if (e.key === 'j') window.scrollBy({ top: 120, behavior: 'smooth' });
      else if (e.key === 'k') window.scrollBy({ top: -120, behavior: 'smooth' });
      else if (e.key === 'g') {
        var once = function (ev) {
          document.removeEventListener('keydown', once, true);
          if (ev.key === 'd') { ev.preventDefault(); location.hash = '#/'; }
          if (ev.key === 'c') { ev.preventDefault(); location.hash = '#/cost'; }
          if (ev.key === 'r') { ev.preventDefault(); location.hash = '#/readiness'; }
          if (ev.key === 't') {
            ev.preventDefault();
            var t = document.getElementById('teardown');
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
        document.addEventListener('keydown', once, true);
      }
    });
  }

  global.SC500Palette = { mount: mount, open: open };
})(window);
