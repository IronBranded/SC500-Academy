/* dashboard.js - SC-500 guide
   The home page, as a learning dashboard rather than a table of contents.

   It answers, in this order:
     1. What should I study next?            Continue learning
     2. How much of each domain have I done? Domain cards
     3. What needs another look?             Review queue counts

   Every number on this page is an observable count - sub-objectives studied,
   labs completed, sub-objectives whose questions you answered correctly. There
   is deliberately no single readiness percentage and no pass prediction: a
   blended score would hide exactly the gaps the counts expose.

   Units:
     Studied            official sub-objectives whose lesson is marked studied
     Practised          labs completed / labs that exist in the domain
     Knowledge checked  sub-objectives whose questions were all answered
                        correctly on their latest attempt, out of those that
                        have questions (the rest are reported, not hidden) */

(function (global) {
  'use strict';

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(text, href, cls) { var a = node('a', cls || null, text); a.href = href; return a; }
  function D() { return global.SC500Domains; }
  function P() { return global.SC500Progress; }

  /* ------------------------------------------------------------ measures */

  function bulletState(model, b) {
    var lessons = b.lessonIds.map(function (id) { return model.lessons[id]; }).filter(Boolean);
    var studied = lessons.some(function (l) { return P().isComplete('module', l.id); });
    var labLessons = lessons.filter(function (l) { return l.hasLab && l.exam; });
    var lab = !labLessons.length ? 'na' : (labLessons.some(function (l) { return P().isComplete('lab', l.id); }) ? 'done' : 'todo');
    return {
      studied: studied,
      lab: lab,
      check: P().bulletCheck(b.questionIds, b.lessonIds, b.text),
      lessons: lessons
    };
  }

  function domainMeasures(model, dom) {
    var m = { bullets: dom.bulletIds.length, studied: 0, checked: 0, review: 0, withQ: 0, noQ: 0, labs: 0, labsDone: 0 };
    dom.bulletIds.forEach(function (bid) {
      var b = model.bulletById[bid];
      var st = bulletState(model, b);
      if (st.studied) m.studied++;
      if (st.check === 'noq') m.noQ++; else m.withQ++;
      if (st.check === 'checked') m.checked++;
      if (st.check === 'review') m.review++;
    });
    dom.lessonIds.forEach(function (id) {
      var l = model.lessons[id];
      if (l && l.hasLab) { m.labs++; if (P().isComplete('lab', id)) m.labsDone++; }
    });
    return m;
  }

  function lessonLeft(model, l) {
    var left = [];
    if (!P().isComplete('module', l.id)) left.push('lesson');
    if (l.hasLab && !P().isComplete('lab', l.id)) left.push('lab');
    var c = P().lessonCheck(l.id, l.questionIds);
    if (c !== 'checked' && c !== 'noq') left.push(c === 'review' ? 'review' : 'check');
    return left;
  }

  /* The single recommendation. Last-visited first, so a learner returning to
     the site lands where they stopped; then study order. */
  function recommend(model) {
    var last = P().lastVisit();
    if (last && model.lessons[last.id]) {
      var l = model.lessons[last.id];
      var left = lessonLeft(model, l);
      if (left.length) return { lesson: l, kind: 'continue', left: left, via: last.kind };
    }
    for (var i = 0; i < model.order.length; i++) {
      var x = model.lessons[model.order[i]];
      if (!P().isComplete('module', x.id)) return { lesson: x, kind: 'next', left: lessonLeft(model, x) };
    }
    for (var j = 0; j < model.order.length; j++) {
      var y = model.lessons[model.order[j]];
      var c = P().lessonCheck(y.id, y.questionIds);
      if (c === 'none' || c === 'partial' || c === 'review') return { lesson: y, kind: 'check', left: lessonLeft(model, y) };
    }
    return null;
  }

  var LEFT_TEXT = {
    lesson: 'Lesson not marked studied',
    lab: 'Lab not complete',
    check: 'Knowledge check not passed yet',
    review: 'Knowledge check has answers to review'
  };

  /* ------------------------------------------------------------- pieces */

  function meter(label, done, total, note) {
    var row = node('div', 'meter-row');
    var top = node('div', 'meter-row__top');
    top.appendChild(node('span', 'meter-row__label', label));
    top.appendChild(node('span', 'meter-row__val', total ? done + ' / ' + total : '\u2013'));
    row.appendChild(top);
    var bar = node('div', 'meter-row__bar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', label);
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(total || 0));
    bar.setAttribute('aria-valuenow', String(done));
    var fill = node('span', 'meter-row__fill');
    fill.style.width = (total ? Math.round((done / total) * 100) : 0) + '%';
    bar.appendChild(fill);
    row.appendChild(bar);
    if (note) row.appendChild(node('p', 'meter-row__note', note));
    return row;
  }

  function cellState(kind, st) {
    var map = {
      learn: { true: ['done', '\u2713', 'Studied'], false: ['todo', '\u25cb', 'Not yet'] },
      lab: { done: ['done', '\u2713', 'Complete'], todo: ['todo', '\u25cb', 'Not yet'], na: ['na', '\u2013', 'No lab'] },
      check: {
        checked: ['done', '\u2713', 'Checked'], review: ['review', '!', 'Review'], partial: ['todo', '\u25d0', 'In progress'],
        none: ['todo', '\u25cb', 'Not yet'], noq: ['na', '\u2013', 'No questions']
      }
    };
    var v = map[kind][String(st)];
    var s = node('span', 'cell-state');
    s.dataset.state = v[0];
    s.appendChild(node('span', 'cell-state__mark', v[1]));
    s.appendChild(document.createTextNode(' ' + v[2]));
    return s;
  }

  /* The objective-level status table. Used here and on the domain review. */
  function objectiveTable(model, domainId) {
    var dom = model.domainById[domainId];
    var wrap = node('div', 'table-scroll');
    var t = node('table', 'objtable');
    t.dataset.stack = 'true';
    var thead = node('thead'), hr = node('tr');
    ['Objective', 'Learn', 'Lab', 'Check'].forEach(function (h) { hr.appendChild(node('th', null, h)); });
    hr.firstChild.setAttribute('scope', 'col');
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = node('tbody');
    dom.objectiveIds.forEach(function (oid) {
      var o = model.objectiveById[oid];
      var gr = node('tr', 'objtable__group');
      var gh = node('th', null, '');
      gh.setAttribute('colspan', '4');
      gh.setAttribute('scope', 'rowgroup');
      gh.appendChild(node('span', 'obj-chip', o.id));
      gh.appendChild(document.createTextNode(' ' + o.text));
      gr.appendChild(gh);
      tb.appendChild(gr);
      o.bulletIds.forEach(function (bid) {
        var b = model.bulletById[bid];
        var st = bulletState(model, b);
        var tr = node('tr');
        var th = node('th');
        th.setAttribute('scope', 'row');
        th.appendChild(node('span', 'obj-chip', b.id));
        var lesson = st.lessons.filter(function (l) { return l.exam; })[0] || st.lessons[0];
        th.appendChild(document.createTextNode(' '));
        if (lesson) th.appendChild(link(b.text, '#/module/' + lesson.id));
        else th.appendChild(document.createTextNode(b.text));
        tr.appendChild(th);
        [['Learn', cellState('learn', st.studied)], ['Lab', cellState('lab', st.lab)], ['Check', cellState('check', st.check)]]
          .forEach(function (c) { var td = node('td'); td.dataset.label = c[0]; td.appendChild(c[1]); tr.appendChild(td); });
        tb.appendChild(tr);
      });
    });
    t.appendChild(tb);
    wrap.appendChild(t);
    return wrap;
  }

  function continueCard(model) {
    var sec = node('section', 'continue');
    sec.setAttribute('aria-labelledby', 'continue-title');
    var r = recommend(model);
    var h = node('h2', null, r && r.kind === 'continue' ? 'Continue learning' : r && r.kind === 'check' ? 'Check what you studied' : 'Start here');
    h.id = 'continue-title';
    sec.appendChild(h);

    if (!r) {
      var done = node('div', 'continue__card');
      done.appendChild(node('p', 'continue__title', 'Every lesson is studied and every knowledge check passed.'));
      done.appendChild(link('Go to Exam prep', '#/prep', 'btn btn--primary'));
      sec.appendChild(done);
      return sec;
    }

    var l = r.lesson;
    var card = node('div', 'continue__card');
    D().paint(card, l.domainId);
    var top = node('div', 'continue__top');
    top.appendChild(D().badge(l.domainId, { weight: l.weight }));
    if (l.objectiveId) top.appendChild(node('span', 'obj-chip', l.objectiveId));
    card.appendChild(top);
    card.appendChild(node('p', 'continue__title', l.title));
    if (l.objectiveText && l.exam) card.appendChild(node('p', 'continue__obj', l.objectiveText));
    else if (!l.exam) card.appendChild(node('p', 'continue__obj', 'Module 0 \u00b7 project prerequisite, not exam content. Do it before any billable lab.'));

    if (r.left.length) {
      var ul = node('ul', 'continue__left');
      ul.setAttribute('aria-label', 'Still to do in this lesson');
      r.left.forEach(function (k) { ul.appendChild(node('li', null, LEFT_TEXT[k])); });
      card.appendChild(ul);
    }

    var href = '#/module/' + l.id;
    if (r.via === 'lab' && r.left.indexOf('lab') !== -1) href = '#/lab/' + l.id;
    else if (r.left[0] === 'check' || r.left[0] === 'review') href = '#/module/' + l.id + '/check';
    var go = link(r.kind === 'continue' ? 'Continue' : r.kind === 'check' ? 'Take the knowledge check' : 'Start', href, 'btn btn--primary');
    card.appendChild(go);
    sec.appendChild(card);

    /* Review queue, as counts with a destination. */
    var queue = node('div', 'continue__queue');
    var review = 0;
    model.bullets.forEach(function (b) { if (P().bulletCheck(b.questionIds, b.lessonIds, b.text) === 'review') review++; });
    var later = P().marks().length;
    queue.appendChild(queueItem(review, review === 1 ? 'sub-objective needs review' : 'sub-objectives need review', '#/prep/needs-review'));
    queue.appendChild(queueItem(later, 'in Review later', '#/prep/later'));
    sec.appendChild(queue);
    return sec;
  }

  function queueItem(n, text, href) {
    var a = link('', href, 'queue-item');
    a.dataset.empty = n ? 'false' : 'true';
    a.appendChild(node('span', 'queue-item__n', String(n)));
    a.appendChild(node('span', 'queue-item__t', text));
    return a;
  }

  function domainCard(model, dom) {
    var m = domainMeasures(model, dom);
    var card = node('article', 'dcard');
    D().paint(card, dom.id);
    card.setAttribute('aria-labelledby', 'dcard-' + dom.id);

    var head = node('header', 'dcard__head');
    var h = node('h3', 'dcard__title');
    h.id = 'dcard-' + dom.id;
    h.appendChild(D().icon(dom.id, 18));
    h.appendChild(node('span', null, D().info(dom.id).short));
    head.appendChild(h);
    head.appendChild(node('span', 'dcard__weight', dom.weight.replace('-', '\u2013') + ' of the exam'));
    card.appendChild(head);
    card.appendChild(node('p', 'dcard__official', 'Official: ' + dom.name + ' \u00b7 ' + dom.objectiveIds.length + ' objectives, ' + dom.bulletIds.length + ' sub-objectives'));

    card.appendChild(meter('Studied', m.studied, m.bullets));
    card.appendChild(meter('Practised', m.labsDone, m.labs, m.labs ? null : 'No labs in this domain.'));
    var notes = [];
    if (m.review) notes.push(m.review + ' need review');
    if (m.noQ) notes.push(m.noQ + ' have no questions yet');
    card.appendChild(meter('Knowledge checked', m.checked, m.withQ, notes.join(' \u00b7 ') || null));

    var actions = node('div', 'dcard__actions');
    actions.appendChild(link('Domain review', '#/domain/' + dom.id, 'btn'));
    var nextL = null;
    for (var i = 0; i < dom.lessonIds.length; i++) {
      if (!P().isComplete('module', dom.lessonIds[i])) { nextL = model.lessons[dom.lessonIds[i]]; break; }
    }
    if (nextL) {
      var a = link('Next: ' + nextL.id, '#/module/' + nextL.id, 'btn');
      a.title = nextL.title;
      actions.appendChild(a);
    }
    card.appendChild(actions);

    var det = node('details', 'dcard__detail');
    det.appendChild(node('summary', null, 'Objective status'));
    det.addEventListener('toggle', function once() {
      if (det.open && !det.dataset.built) { det.dataset.built = '1'; det.appendChild(objectiveTable(model, dom.id)); }
    });
    card.appendChild(det);
    return card;
  }

  function moduleZero(model) {
    var ids = model.order.filter(function (id) { return id.indexOf('00-') === 0; });
    if (!ids.length) return null;
    var studied = ids.filter(function (id) { return P().isComplete('module', id); }).length;
    var labs = ids.filter(function (id) { return model.lessons[id].hasLab; });
    var labsDone = labs.filter(function (id) { return P().isComplete('lab', id); }).length;
    var done = studied === ids.length && labsDone === labs.length;

    var box = node('section', 'm0');
    D().paint(box, '00');
    box.dataset.done = done ? 'true' : 'false';
    var h = node('h2', 'm0__title');
    h.appendChild(D().icon('00', 16));
    h.appendChild(node('span', null, 'Module 0 \u00b7 Lab safety'));
    box.appendChild(h);
    box.appendChild(node('p', null, done
      ? 'Budget guardrails, just-in-time access and the teardown template are in place.'
      : 'Not exam content, and not optional: budget alerts, PIM-based access and the teardown template come before any billable lab.'));
    box.appendChild(node('p', 'm0__counts', studied + ' / ' + ids.length + ' lessons studied \u00b7 ' + labsDone + ' / ' + labs.length + ' labs complete'));
    if (!done) {
      var first = ids.filter(function (id) { return !P().isComplete('module', id); })[0] || ids[0];
      box.appendChild(link('Open Module 0', '#/module/' + first, 'btn'));
    }
    return box;
  }

  function toolsRow() {
    var nav = node('nav', 'tools-row');
    nav.setAttribute('aria-label', 'Study tools');
    [['Exam prep', '#/prep', 'Review by domain, objective, wrong answers and bookmarks'],
     ['Mock exam', '#/exam', 'Timed, weighted, mixed across every quiz'],
     ['Flashcards', '#/cards', 'Distinctions, spaced repetition'],
     ['Coverage', '#/coverage', 'Every official sub-objective and what teaches it'],
     ['Cost planner', '#/cost', 'Every lab by what it will cost']
    ].forEach(function (t) {
      var a = link('', t[1], 'tool');
      a.appendChild(node('span', 'tool__name', t[0]));
      a.appendChild(node('span', 'tool__desc', t[2]));
      nav.appendChild(a);
    });
    return nav;
  }

  /* ----------------------------------------------------------------- mount */

  function mount(root, manifest) {
    root.textContent = '';
    var head = node('header', 'dash-head');
    head.appendChild(node('h1', null, 'SC500 Academy'));
    head.appendChild(node('p', 'dash-head__sub',
      'Certification-first study for Exam SC-500: Implementing End-to-End Security Controls for Cloud and AI Workloads. Built from Microsoft Learn documentation, mapped to the official skills outline.'));
    root.appendChild(head);

    var loading = node('p', 'loading', 'Loading the curriculum\u2026');
    root.appendChild(loading);

    return global.SC500Curriculum.load(manifest).then(function (model) {
      loading.remove();
      if (!model.snapshotOk) {
        root.appendChild(node('div', 'empty',
          'docs/SKILLS-MEASURED-SNAPSHOT.md could not be read, so objective-level progress is unavailable. Lessons still work from the sidebar.'));
      }
      root.appendChild(continueCard(model));
      var m0 = moduleZero(model);

      var ds = node('section', 'domains');
      ds.setAttribute('aria-labelledby', 'domains-title');
      var h2 = node('h2', null, 'SC-500 domains');
      h2.id = 'domains-title';
      ds.appendChild(h2);
      ds.appendChild(node('p', 'lede',
        'Counts are observable: a sub-objective is studied when its lesson is marked studied, practised when its lab (teardown included) is complete, and checked when every question on it was answered correctly on the latest attempt.'));
      var grid = node('div', 'dgrid');
      model.domains.forEach(function (d) { grid.appendChild(domainCard(model, d)); });
      ds.appendChild(grid);

      /* Module 0 sits above the domains until it is done - unless the
         Continue card is already pointing into it, which says the same. */
      var r = recommend(model);
      var zeroFirst = m0 && m0.dataset.done !== 'true' && !(r && !r.lesson.exam);
      if (zeroFirst) root.appendChild(m0);
      root.appendChild(ds);
      if (m0 && !zeroFirst) root.appendChild(m0);
      root.appendChild(toolsRow());
      root.appendChild(P().controls(manifest));
    }).catch(function (e) {
      loading.textContent = 'The dashboard could not load: ' + (e && e.message || e);
    });
  }

  global.SC500Dashboard = {
    mount: mount,
    objectiveTable: objectiveTable,
    bulletState: bulletState,
    domainMeasures: domainMeasures
  };
})(window);
