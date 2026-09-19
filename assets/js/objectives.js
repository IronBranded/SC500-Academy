/* objectives.js - SC-500 guide
   Coverage across the 87 verbatim sub-objectives.

   The exam is built from a fixed, enumerable list. That makes a coverage matrix
   the honest hero for the dashboard: one glance answers "which of the 87 have I
   actually done", which no progress percentage can.

   Coverage is DERIVED, not separately tracked. A sub-objective inherits the
   state of the module that teaches it:

     read      - the module page is marked read or fully checked
     practised - its lab is complete
     tested    - its quiz was answered at 80% or better

   Deriving it means there is nothing extra for the reader to maintain, and no
   second source of truth to drift. */

(function (global) {
  'use strict';

  var cache = null;          // moduleId -> { objective, sub_objectives[] }
  var loading = null;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------- loading */

  function load(manifest) {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;

    var mods = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) { mods.push({ id: m.id, path: m.content, domain: d }); });
    });

    loading = Promise.all(mods.map(function (m) {
      return fetch(m.path, { cache: 'force-cache' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (text) {
          if (!text) return null;
          var fm = global.SC500FrontMatter.parse(text).data || {};
          return {
            id: m.id,
            domain: m.domain,
            objective: fm.objective || '',
            subs: Array.isArray(fm.sub_objectives) ? fm.sub_objectives : []
          };
        })
        .catch(function () { return null; });
    })).then(function (rows) {
      cache = rows.filter(Boolean);
      loading = null;
      return cache;
    });

    return loading;
  }

  /* ---------------------------------------------------------------- state */

  function moduleState(id) {
    var P = global.SC500Progress;
    if (!P) return { read: false, practised: false, tested: false, score: null };

    var quiz = P.readQuiz ? P.readQuiz({ kind: 'module', moduleId: id }) : null;
    return {
      read: P.isComplete('module', id),
      practised: P.isComplete('lab', id),
      tested: !!(quiz && quiz.pct >= 80),
      score: quiz ? quiz.pct : null
    };
  }

  /* A single word for the strongest state reached. Order matters: tested implies
     the module was worth testing on, so it outranks practised. */
  function level(st) {
    if (st.tested) return 'tested';
    if (st.practised) return 'practised';
    if (st.read) return 'read';
    return 'none';
  }

  var LABELS = {
    none: 'Not started',
    read: 'Read',
    practised: 'Lab complete',
    tested: 'Quiz passed'
  };

  /* ------------------------------------------------------------ rendering */

  function cell(sub, st, moduleId) {
    var a = document.createElement('a');
    a.className = 'cov__cell';
    a.href = '#/module/' + moduleId;
    a.dataset.level = level(st);
    a.setAttribute('aria-label', sub + ' — ' + LABELS[level(st)]);
    a.title = sub + '\n' + LABELS[level(st)] + (st.score != null ? ' · quiz ' + st.score + '%' : '');
    return a;
  }

  function moduleRow(row) {
    var st = moduleState(row.id);
    var det = node('details', 'cov__module');
    det.dataset.level = level(st);

    var sum = document.createElement('summary');
    sum.className = 'cov__summary';

    sum.appendChild(node('span', 'cov__id', row.id));
    sum.appendChild(node('span', 'cov__obj', row.objective));

    var cells = node('span', 'cov__cells');
    row.subs.forEach(function (s) { cells.appendChild(cell(s, st, row.id)); });
    sum.appendChild(cells);

    sum.appendChild(node('span', 'cov__count', row.subs.length));
    det.appendChild(sum);

    /* Drilldown: the individual objectives, verbatim, each linking to the module
       that teaches it. */
    var body = node('div', 'cov__body');

    var chips = node('div', 'chips');
    [['Module', st.read, '#/module/' + row.id],
     ['Lab', st.practised, '#/lab/' + row.id],
     ['Quiz' + (st.score != null ? ' ' + st.score + '%' : ''), st.tested, '#/module/' + row.id]
    ].forEach(function (c) {
      var a = document.createElement('a');
      a.className = 'chip';
      a.href = c[2];
      a.dataset.on = c[1] ? 'true' : 'false';
      a.textContent = c[0];
      chips.appendChild(a);
    });
    body.appendChild(chips);

    var ul = node('ul', 'cov__list');
    row.subs.forEach(function (s) {
      var li = document.createElement('li');
      li.dataset.level = level(st);
      li.appendChild(node('span', 'cov__dot'));
      li.appendChild(document.createTextNode(s));
      ul.appendChild(li);
    });
    body.appendChild(ul);

    det.appendChild(body);
    return det;
  }

  function domainBlock(domain, rows) {
    var mine = rows.filter(function (r) { return r.domain.id === domain.id; });
    var subs = mine.reduce(function (n, r) { return n + r.subs.length; }, 0);
    if (!subs) return null;

    var covered = 0;
    mine.forEach(function (r) { if (level(moduleState(r.id)) !== 'none') covered += r.subs.length; });

    var det = node('details', 'cov__domain');
    det.style.setProperty('--domain-tint', 'var(--domain-' + domain.id + ')');

    var sum = document.createElement('summary');
    sum.className = 'cov__dsummary';
    sum.appendChild(node('span', 'cov__dname', domain.name));
    sum.appendChild(node('span', 'cov__dmeta',
      (domain.weight && domain.weight !== 'n/a' ? domain.weight + ' · ' : '') +
      covered + ' of ' + subs + ' objectives'));
    det.appendChild(sum);

    var body = node('div', 'cov__dbody');
    mine.forEach(function (r) { body.appendChild(moduleRow(r)); });
    det.appendChild(body);

    return det;
  }

  function legend() {
    var wrap = node('div', 'cov__legend');
    ['none', 'read', 'practised', 'tested'].forEach(function (l) {
      var item = node('span', 'cov__legenditem');
      var sw = node('span', 'cov__cell');
      sw.dataset.level = l;
      item.appendChild(sw);
      item.appendChild(node('span', null, LABELS[l]));
      wrap.appendChild(item);
    });
    return wrap;
  }

  function mount(root, manifest) {
    var section = node('section', 'cov');
    var head = node('div', 'cov__head');
    head.appendChild(node('h2', null, 'Objective coverage'));
    var totalEl = node('p', 'cov__total', 'Loading the outline…');
    head.appendChild(totalEl);
    section.appendChild(head);
    section.appendChild(legend());

    var body = node('div', 'cov__grid');
    section.appendChild(body);
    root.appendChild(section);

    load(manifest).then(function (rows) {
      var total = 0, covered = 0;
      rows.forEach(function (r) {
        total += r.subs.length;
        if (level(moduleState(r.id)) !== 'none') covered += r.subs.length;
      });

      totalEl.textContent = covered + ' of ' + total +
        ' sub-objectives touched. Open a domain to see the individual objectives and which module teaches each one.';

      manifest.domains.forEach(function (d) {
        var block = domainBlock(d, rows);
        if (block) body.appendChild(block);
      });

      if (!total) {
        body.appendChild(node('div', 'empty',
          'No sub-objectives were found in the content front matter. Check that sub_objectives is populated.'));
      }
    }).catch(function (e) {
      totalEl.textContent = 'The outline could not be read: ' + (e.message || e);
    });
  }

  global.SC500Objectives = { mount: mount };
})(window);
