/* search.js - SC-500 guide
   Search across modules by keyword, domain or service.

   Two tiers, so the first keystroke is instant:
     1. Manifest tier - id, title, objective, domain. Available immediately.
     2. Deep tier - sub-objectives, headings and front-matter fields, fetched
        once in the background on first use.

   No index file to build, no search library. */

(function (global) {
  'use strict';

  var manifest = null;
  var shallow = [];      // always available
  var deep = null;       // Map: moduleId+kind -> extra searchable text
  var deepState = 'idle';
  var input, panel;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildShallow() {
    shallow = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        shallow.push({
          id: m.id, kind: 'module', title: m.title, domain: d.name,
          weight: d.weight, path: m.content,
          hay: [m.id, m.title, m.objective, d.name].join(' ').toLowerCase()
        });
        if (m.lab) {
          shallow.push({
            id: m.id, kind: 'lab', title: m.title + ' — lab', domain: d.name,
            weight: d.weight, path: m.lab,
            hay: [m.id, m.title, 'lab', m.objective, d.name].join(' ').toLowerCase()
          });
        }
      });
    });
    (manifest.appendix || []).forEach(function (a, i) {
      shallow.push({
        id: String(i), kind: 'appendix', title: a.title, domain: 'Appendix',
        weight: '', path: a.content,
        hay: [a.title, 'appendix'].join(' ').toLowerCase()
      });
    });
  }

  /* Fetch every content file once and keep the searchable parts. 27 small files
     on a local server; deliberately not done at page load. */
  function buildDeep() {
    if (deepState !== 'idle') return;
    deepState = 'loading';
    deep = {};

    var jobs = shallow.map(function (entry) {
      return fetch(entry.path, { cache: 'force-cache' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (text) {
          if (!text) return;
          var parsed = global.SC500FrontMatter.parse(text);
          var bits = [];

          var d = parsed.data || {};
          ['objective', 'domain', 'licensing', 'portal', 'powershell_module',
           'az_cli_command', 'status'].forEach(function (k) {
            if (d[k]) bits.push(String(d[k]));
          });
          ['sub_objectives', 'kql_tables', 'azure_resources'].forEach(function (k) {
            if (Array.isArray(d[k])) bits.push(d[k].join(' '));
          });

          /* Headings carry most of the signal without indexing whole prose. */
          var heads = parsed.body.match(/^#{2,4}\s+.*$/gm);
          if (heads) bits.push(heads.join(' '));

          deep[entry.kind + ':' + entry.id] = bits.join(' ').toLowerCase();
        })
        .catch(function () { /* one unreadable file should not break search */ });
    });

    Promise.all(jobs).then(function () {
      deepState = 'ready';
      if (input && input.value.trim()) run(input.value);
    });
  }

  function score(entry, terms) {
    var hay = entry.hay;
    var extra = deep ? (deep[entry.kind + ':' + entry.id] || '') : '';
    var total = 0;

    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var inTitle = entry.title.toLowerCase().indexOf(t) !== -1;
      var inShallow = hay.indexOf(t) !== -1;
      var inDeep = extra.indexOf(t) !== -1;
      if (!inShallow && !inDeep) return 0;          // every term must appear
      total += (inTitle ? 6 : 0) + (inShallow ? 3 : 0) + (inDeep ? 1 : 0);
    }
    if (entry.id.toLowerCase().indexOf(terms[0]) === 0) total += 8;   // "02-04"
    return total;
  }

  function run(query) {
    var q = query.trim().toLowerCase();
    if (!q) return close();

    var terms = q.split(/\s+/).filter(Boolean);
    var hits = shallow
      .map(function (e) { return { e: e, s: score(e, terms) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.e.id.localeCompare(b.e.id); })
      .slice(0, 12);

    open(hits, q);
  }

  function open(hits, q) {
    panel.textContent = '';
    panel.hidden = false;

    if (!hits.length) {
      var e = node('div', 'empty');
      e.appendChild(node('strong', null, 'No module matches “' + q + '”.'));
      e.appendChild(document.createTextNode(
        deepState === 'ready'
          ? ' Try a service name, a plan name, or a module number such as 02-04.'
          : ' Full-text search is still loading; try again in a moment.'));
      panel.appendChild(e);
      return;
    }

    var list = node('ul', 'nav-list');
    hits.forEach(function (h) {
      var li = document.createElement('li');
      var a = node('a', 'nav-link');
      a.href = '#/' + h.e.kind + '/' + h.e.id;
      a.appendChild(node('span', 'nav-link__id', h.e.kind === 'appendix' ? 'A' + (Number(h.e.id) + 1) : h.e.id));
      var t = node('span', 'nav-link__title');
      t.appendChild(document.createTextNode(h.e.title));
      t.appendChild(node('span', 'nav-sub', h.e.domain + (h.e.weight && h.e.weight !== 'n/a' ? ' · ' + h.e.weight : '')));
      a.appendChild(t);
      a.addEventListener('click', close);
      li.appendChild(a);
      list.appendChild(li);
    });
    panel.appendChild(list);
  }

  function close() {
    if (!panel) return;
    panel.hidden = true;
    panel.textContent = '';
  }

  function mount(m) {
    manifest = m;
    input = document.getElementById('search');
    if (!input) return;
    buildShallow();

    /* The results panel is created here rather than in index.html, so the
       markup stays about structure and this file owns its own UI. */
    panel = document.createElement('div');
    panel.id = 'search-results';
    panel.className = 'field';
    panel.hidden = true;
    panel.style.cssText = 'position:absolute;right:var(--s-4);top:calc(var(--h-topbar) - var(--s-2));' +
                          'z-index:50;width:min(28rem,90vw);max-height:70vh;overflow:auto;';
    document.body.appendChild(panel);

    var t = null;
    input.addEventListener('input', function () {
      buildDeep();
      clearTimeout(t);
      t = setTimeout(function () { run(input.value); }, 90);
    });
    input.addEventListener('focus', buildDeep);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; close(); input.blur(); }
      if (e.key === 'Enter') {
        var first = panel.querySelector('.nav-link');
        if (first) { first.click(); input.value = ''; }
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target !== input && !panel.contains(e.target)) close();
    });

    /* "/" focuses search, as in most documentation sites. */
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input &&
          !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  global.SC500Search = { mount: mount };
})(window);
