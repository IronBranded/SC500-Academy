/* nav.js - SC-500 guide
   Builds the sidebar from content/manifest.json. The manifest is the single
   source of truth for structure; this file never hardcodes a module. */

(function (global) {
  'use strict';

  var el;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function moduleLink(mod, kind) {
    var a = node('a', 'nav-link');
    a.href = '#/' + kind + '/' + mod.id;
    a.dataset.moduleId = mod.id;
    a.dataset.kind = kind;
    a.appendChild(node('span', 'nav-link__id', mod.id));

    var t = node('span', 'nav-link__title');
    t.appendChild(document.createTextNode(mod.title));
    if (kind === 'lab') t.appendChild(node('span', 'nav-sub', 'Lab'));
    a.appendChild(t);
    return a;
  }

  var OPEN_KEY = 'sc500:nav:v1';

  function openState(id) {
    try {
      var raw = localStorage.getItem(OPEN_KEY);
      if (!raw) return true;                 // first visit: everything open
      var map = JSON.parse(raw);
      return map[id] !== false;
    } catch (e) { return true; }
  }
  function saveState(id, open) {
    try {
      var map = JSON.parse(localStorage.getItem(OPEN_KEY) || '{}');
      map[id] = open;
      localStorage.setItem(OPEN_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function render(manifest) {
    el.textContent = '';

    var home = node('a', 'nav-link');
    home.href = '#/';
    home.dataset.kind = 'dashboard';
    home.appendChild(node('span', 'nav-link__id', '—'));
    home.appendChild(node('span', 'nav-link__title', 'Dashboard'));
    var homeWrap = node('div', 'nav-group');
    homeWrap.appendChild(home);

    /* Derived views: what can I afford, and what should I study next. */
    [['cost', 'Cost planner', '#/cost'], ['readiness', 'Readiness', '#/readiness']].forEach(function (v) {
      var a = node('a', 'nav-link');
      a.href = v[2];
      a.dataset.kind = v[0];
      a.appendChild(node('span', 'nav-link__id', '—'));
      a.appendChild(node('span', 'nav-link__title', v[1]));
      homeWrap.appendChild(a);
    });

    el.appendChild(homeWrap);

    /* Accordions. With 22 modules and five appendices the flat tree is longer
       than a laptop screen, so domains collapse and remember their state. The
       domain containing the current page is always opened. */
    manifest.domains.forEach(function (domain) {
      var group = node('details', 'nav-group');
      group.dataset.domain = domain.id;
      group.style.setProperty('--domain-tint', 'var(--domain-' + domain.id + ')');
      group.open = openState(domain.id);
      group.addEventListener('toggle', function () { saveState(domain.id, group.open); });

      var head = document.createElement('summary');
      head.className = 'nav-group__head';

      var top = node('div', 'nav-group__top');
      top.appendChild(node('span', 'nav-group__name', domain.name));
      if (domain.weight && domain.weight !== 'n/a') {
        top.appendChild(node('span', 'nav-group__weight', domain.weight));
      }
      head.appendChild(top);

      /* A thin progress bar per domain: momentum without leaving the nav. */
      var bar = node('div', 'nav-group__bar');
      var fill = node('span', 'nav-group__fill');
      fill.dataset.domain = domain.id;
      bar.appendChild(fill);
      head.appendChild(bar);

      group.appendChild(head);

      var list = node('ul', 'nav-list');
      domain.modules.forEach(function (mod) {
        var li = document.createElement('li');
        li.appendChild(moduleLink(mod, 'module'));
        if (mod.lab) li.appendChild(moduleLink(mod, 'lab'));
        list.appendChild(li);
      });
      group.appendChild(list);
      el.appendChild(group);
    });

    if (manifest.appendix && manifest.appendix.length) {
      var apx = node('section', 'nav-group');
      apx.appendChild(node('div', 'nav-group__head')).appendChild(
        node('span', 'nav-group__name', 'Appendices')
      );
      var alist = node('ul', 'nav-list');
      manifest.appendix.forEach(function (item, i) {
        var li = document.createElement('li');
        var a = node('a', 'nav-link');
        a.href = '#/appendix/' + i;
        a.dataset.kind = 'appendix';
        a.appendChild(node('span', 'nav-link__id', 'A' + (i + 1)));
        a.appendChild(node('span', 'nav-link__title', item.title));
        li.appendChild(a);
        alist.appendChild(li);
      });
      apx.appendChild(alist);
      el.appendChild(apx);
    }

    markProgress();
  }

  /* Struck-through titles for completed modules. Progress is optional - the nav
     works without progress.js loaded. */
  function markProgress() {
    if (!global.SC500Progress || !global.SC500Progress.isComplete) return;

    var links = el.querySelectorAll('.nav-link[data-module-id]');
    var tally = {};
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var done = global.SC500Progress.isComplete(a.dataset.kind, a.dataset.moduleId);
      a.dataset.done = done ? 'true' : 'false';

      var group = a.closest('.nav-group');
      var d = group && group.dataset.domain;
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
      if (head) head.dataset.complete = pct === 100 ? 'true' : 'false';
    }
  }

  function setCurrent(kind, id) {
    var links = el.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var simple = kind === 'dashboard' || kind === 'cost' || kind === 'readiness';
      var match = a.dataset.kind === kind &&
                  (simple || String(a.dataset.moduleId || a.href.split('/').pop()) === String(id));
      if (match) {
        a.setAttribute('aria-current', 'page');
        var grp = a.closest('.nav-group');
        if (grp && grp.tagName === 'DETAILS') grp.open = true;
        a.scrollIntoView({ block: 'nearest' });
      } else { a.removeAttribute('aria-current'); }
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
      });
    }

    /* On narrow screens, choosing a page closes the drawer. */
    el.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link') && window.matchMedia('(max-width: 860px)').matches) {
        el.dataset.open = 'false';
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  global.SC500Nav = {
    mount: mount,
    setCurrent: setCurrent,
    refreshProgress: markProgress
  };
})(window);
