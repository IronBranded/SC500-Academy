/* nav.js - SC-500 guide
   Builds the sidebar from content/manifest.json. The manifest is the single
   source of truth for structure; this file never hardcodes a module.

   Certification-first layout (redesign):

     Study        Dashboard, Exam prep, Coverage
     4 domains    colour + icon + short name + exam weight; each lesson is one
                  row with its lab as a small link on the same row (the old
                  tree listed every title twice); ends with the domain review
     Module 0     lab safety, neutral colour, visibly not an exam domain
     Practice     mock exam, flashcards, retention, cost, watchlist
     Appendices

   Completed lessons show a check mark and a hidden "(studied)" for screen
   readers, rather than the strike-through the old tree used - struck text is
   harder to read, and these are pages learners come back to. */

(function (global) {
  'use strict';

  var el;
  var OPEN_KEY = 'sc500:nav:v1';

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function D() { return global.SC500Domains; }

  function openState(id, dflt) {
    try {
      var raw = localStorage.getItem(OPEN_KEY);
      if (!raw) return dflt;
      var map = JSON.parse(raw);
      return map[id] === undefined ? dflt : map[id] !== false;
    } catch (e) { return dflt; }
  }
  function saveState(id, open) {
    try {
      var map = JSON.parse(localStorage.getItem(OPEN_KEY) || '{}');
      map[id] = open;
      localStorage.setItem(OPEN_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function simpleLink(kind, label, href, id) {
    var a = node('a', 'nav-link');
    a.href = href;
    a.dataset.kind = kind;
    if (id) a.dataset.viewArg = id;
    a.appendChild(node('span', 'nav-link__title', label));
    return a;
  }

  function lessonRow(mod) {
    var li = node('li', 'nav-item');
    var a = node('a', 'nav-link');
    a.href = '#/module/' + mod.id;
    a.dataset.moduleId = mod.id;
    a.dataset.kind = 'module';
    a.appendChild(node('span', 'nav-link__id', mod.id));
    var t = node('span', 'nav-link__title', mod.title);
    a.appendChild(t);
    var sr = node('span', 'visually-hidden nav-done-sr', '');
    a.appendChild(sr);
    li.appendChild(a);

    if (mod.lab) {
      var lab = node('a', 'nav-lab', 'Lab');
      lab.href = '#/lab/' + mod.id;
      lab.dataset.moduleId = mod.id;
      lab.dataset.kind = 'lab';
      lab.setAttribute('aria-label', 'Lab ' + mod.id + ': ' + mod.title);
      li.appendChild(lab);
    }
    return li;
  }

  function group(domain, exam) {
    var g = node('details', 'nav-group');
    g.dataset.domain = domain.id;
    if (D()) D().paint(g, domain.id);
    g.style.setProperty('--domain-tint', 'var(--d-' + domain.id + ')');
    g.open = openState(domain.id, exam);
    g.addEventListener('toggle', function () { saveState(domain.id, g.open); });

    var head = node('summary', 'nav-group__head');
    var top = node('div', 'nav-group__top');
    var name = node('span', 'nav-group__name');
    if (D()) name.appendChild(D().icon(domain.id, 15));
    name.appendChild(node('span', null, exam && D() ? D().info(domain.id).short : (D() ? 'Module 0 \u00b7 Lab safety' : domain.name)));
    top.appendChild(name);
    if (exam) top.appendChild(node('span', 'nav-group__weight', String(domain.weight).replace('-', '\u2013')));
    head.appendChild(top);

    var bar = node('div', 'nav-group__bar');
    bar.setAttribute('aria-hidden', 'true');
    var fill = node('span', 'nav-group__fill');
    fill.dataset.domain = domain.id;
    bar.appendChild(fill);
    head.appendChild(bar);
    g.appendChild(head);

    var list = node('ul', 'nav-list');
    domain.modules.forEach(function (mod) { list.appendChild(lessonRow(mod)); });
    if (exam) {
      var li = node('li', 'nav-item nav-item--review');
      var r = simpleLink('domain', 'Domain review', '#/domain/' + domain.id, domain.id);
      r.classList.add('nav-link--review');
      li.appendChild(r);
      list.appendChild(li);
    }
    g.appendChild(list);
    return g;
  }

  function section(title, links) {
    var s = node('div', 'nav-group nav-group--plain');
    s.appendChild(node('p', 'nav-section', title));
    var ul = node('ul', 'nav-list');
    links.forEach(function (l) { var li = node('li'); li.appendChild(l); ul.appendChild(li); });
    s.appendChild(ul);
    return s;
  }

  function render(manifest) {
    el.textContent = '';

    el.appendChild(section('Study', [
      simpleLink('dashboard', 'Dashboard', '#/'),
      simpleLink('prep', 'Exam prep', '#/prep'),
      simpleLink('coverage', 'Objective coverage', '#/coverage')
    ]));

    var zero = null;
    manifest.domains.forEach(function (domain) {
      var exam = domain.weight && domain.weight !== 'n/a';
      var g = group(domain, exam);
      if (exam) el.appendChild(g); else zero = g;
    });
    if (zero) el.appendChild(zero);

    el.appendChild(section('Practice', [
      simpleLink('exam', 'Mock exam', '#/exam'),
      simpleLink('cards', 'Flashcards', '#/cards'),
      simpleLink('review', 'Retention review', '#/review'),
      simpleLink('readiness', 'Readiness', '#/readiness'),
      simpleLink('cost', 'Cost planner', '#/cost'),
      simpleLink('preview', 'Verification watchlist', '#/preview')
    ]));

    if (manifest.appendix && manifest.appendix.length) {
      var links = manifest.appendix.map(function (item, i) {
        var a = node('a', 'nav-link');
        a.href = '#/appendix/' + i;
        a.dataset.kind = 'appendix';
        a.dataset.viewArg = String(i);
        var m = /\/(a\d+)-/.exec(item.content);
        a.appendChild(node('span', 'nav-link__id', m ? m[1].toUpperCase() : 'A' + (i + 1)));
        a.appendChild(node('span', 'nav-link__title', item.title));
        return a;
      });
      var apx = section('Appendices', links);
      el.appendChild(apx);
    }

    markProgress();
  }

  function markProgress() {
    if (!el || !global.SC500Progress || !global.SC500Progress.isComplete) return;
    var P = global.SC500Progress;

    var links = el.querySelectorAll('[data-module-id]');
    var tally = {};
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var done = P.isComplete(a.dataset.kind, a.dataset.moduleId);
      a.dataset.done = done ? 'true' : 'false';
      var sr = a.querySelector('.nav-done-sr');
      if (sr) sr.textContent = done ? ' (studied)' : '';
      if (a.dataset.kind === 'lab') { a.textContent = done ? 'Lab \u2713' : 'Lab'; continue; }
      var g = a.closest('.nav-group');
      var d = g && g.dataset.domain;
      if (d) {
        tally[d] = tally[d] || { total: 0, done: 0 };
        tally[d].total++;
        if (done) tally[d].done++;
      }
    }
    var fills = el.querySelectorAll('.nav-group__fill');
    for (var f = 0; f < fills.length; f++) {
      var t = tally[fills[f].dataset.domain];
      var pct = t && t.total ? Math.round((t.done / t.total) * 100) : 0;
      fills[f].style.width = pct + '%';
      var head = fills[f].closest('.nav-group__head');
      if (head) {
        head.dataset.complete = pct === 100 ? 'true' : 'false';
        head.title = t ? t.done + ' of ' + t.total + ' lessons studied' : '';
      }
    }
  }

  function setCurrent(kind, id) {
    if (!el) return;
    var links = el.querySelectorAll('a[data-kind]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var match = false;
      if (a.dataset.kind === kind) {
        if (a.dataset.moduleId) match = String(a.dataset.moduleId) === String(id);
        else if (a.dataset.viewArg) match = String(a.dataset.viewArg) === String(id);
        else match = true;
      }
      if (match) {
        a.setAttribute('aria-current', 'page');
        var grp = a.closest('details.nav-group');
        if (grp) grp.open = true;
        a.scrollIntoView({ block: 'nearest' });
      } else {
        a.removeAttribute('aria-current');
      }
    }
  }

  function mount(manifest) {
    el = document.getElementById('sidebar');
    if (!el) return;
    render(manifest);

    var toggle = document.getElementById('nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = el.dataset.open === 'true';
        el.dataset.open = open ? 'false' : 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!open) { var first = el.querySelector('a'); if (first) first.focus(); }
      });
    }

    /* On narrow screens, choosing a page closes the drawer. Escape closes it
       too and returns focus to the button that opened it. */
    el.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.matchMedia('(max-width: 860px)').matches) {
        el.dataset.open = 'false';
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.dataset.open === 'true') {
        el.dataset.open = 'false';
        if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
      }
    });
  }

  global.SC500Nav = {
    mount: mount,
    setCurrent: setCurrent,
    refreshProgress: markProgress
  };
})(window);
