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

  function render(manifest) {
    el.textContent = '';

    var home = node('a', 'nav-link');
    home.href = '#/';
    home.dataset.kind = 'dashboard';
    home.appendChild(node('span', 'nav-link__id', '—'));
    home.appendChild(node('span', 'nav-link__title', 'Dashboard'));
    var homeWrap = node('div', 'nav-group');
    homeWrap.appendChild(home);
    el.appendChild(homeWrap);

    manifest.domains.forEach(function (domain) {
      var group = node('section', 'nav-group');
      group.style.setProperty('--domain-tint', 'var(--domain-' + domain.id + ')');

      var head = node('div', 'nav-group__head');
      head.appendChild(node('span', 'nav-group__name', domain.name));
      if (domain.weight && domain.weight !== 'n/a') {
        head.appendChild(node('span', 'nav-group__weight', domain.weight));
      }
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
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.dataset.done = global.SC500Progress.isComplete(a.dataset.kind, a.dataset.moduleId) ? 'true' : 'false';
    }
  }

  function setCurrent(kind, id) {
    var links = el.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var match = a.dataset.kind === kind &&
                  (kind === 'dashboard' || String(a.dataset.moduleId || a.href.split('/').pop()) === String(id));
      if (match) { a.setAttribute('aria-current', 'page'); }
      else { a.removeAttribute('aria-current'); }
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
