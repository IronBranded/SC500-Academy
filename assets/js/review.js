/* review.js - SC-500 guide
   Three views built on the curriculum model:

     #/domain/<id>     End-of-domain review: summary, distinctions, a mixed
                       knowledge check, what needs review, where to go back to
     #/coverage        The objective coverage matrix: what the GUIDE provides
                       for every official sub-objective (content, not learner)
     #/prep[/<filter>] Exam prep: measured SC-500 material only, reviewable by
                       domain, objective, needs-review, incorrect, unanswered,
                       Review later, or a mixed-domain set

   No view here predicts a result. The exam is scaled, questions are not worth
   equal marks, and a question pool this size cannot estimate a pass
   probability honestly - so the pages show counts and states, never odds. */

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
  function C() { return global.SC500Curriculum; }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function withModel(root, fn) {
    var wait = node('p', 'loading', 'Loading the curriculum\u2026');
    root.appendChild(wait);
    return C().load().then(function (model) { wait.remove(); fn(model); })
      .catch(function (e) { wait.textContent = 'Could not load the curriculum: ' + (e && e.message || e); });
  }

  /* Questions for a set, least-certain first: never answered, then answered
     wrong, then answered right longest ago. */
  function prioritise(qids) {
    return qids.slice().sort(function (a, b) {
      var x = P().answer(a), y = P().answer(b);
      var rx = !x ? 0 : (!x.ok ? 1 : 2), ry = !y ? 0 : (!y.ok ? 1 : 2);
      if (rx !== ry) return rx - ry;
      return String(x && x.at || '').localeCompare(String(y && y.at || ''));
    });
  }

  function recs(model, qids) { return qids.map(function (q) { return model.questions[q]; }).filter(Boolean); }

  /* ======================================================= domain review */

  function domainView(root, manifest, id) {
    withModel(root, function (model) {
      var dom = model.domainById[id];
      if (!dom) {
        root.appendChild(node('div', 'empty', 'There is no exam domain with id ' + id + '.'));
        return;
      }
      var info = D().info(id);
      var head = node('header', 'view-head');
      D().paint(head, id);
      head.appendChild(D().badge(id, { weight: dom.weight }));
      head.appendChild(node('h1', null, 'Domain review: ' + info.short));
      head.appendChild(node('p', 'view-head__sub',
        'Official domain: ' + dom.name + ' (' + dom.weight.replace('-', '\u2013') + ' of the exam). A review, not a re-read: what the domain contains, what is easy to confuse, a mixed check, and where to go back to.'));
      root.appendChild(head);
      document.title = 'Domain review \u00b7 ' + info.short + ' \u00b7 SC500 Academy';

      /* Summary */
      var s1 = section(root, 'Domain summary', 'dr-summary');
      var ul = node('ul', 'dr-objectives');
      dom.objectiveIds.forEach(function (oid) {
        var o = model.objectiveById[oid];
        var li = node('li');
        li.appendChild(node('span', 'obj-chip', o.id));
        li.appendChild(node('strong', null, ' ' + o.text));
        var lessons = node('span', 'dr-objectives__lessons');
        o.lessonIds.forEach(function (lid, i) {
          if (i) lessons.appendChild(document.createTextNode(' \u00b7 '));
          lessons.appendChild(link(lid + ' ' + model.lessons[lid].title, '#/module/' + lid));
        });
        li.appendChild(lessons);
        li.appendChild(node('span', 'dr-objectives__count', o.bulletIds.length + ' sub-objectives'));
        if (o.path) {
          var off = node('span', 'dr-objectives__official');
          off.appendChild(document.createTextNode('Microsoft Learn: '));
          var pa = link(o.path.title, o.path.url); pa.target = '_blank'; pa.rel = 'noopener';
          off.appendChild(pa);
          if (o.officialLabs) off.appendChild(document.createTextNode(' \u00b7 ' + o.officialLabs.length + (o.officialLabs.length === 1 ? ' official lab' : ' official labs')));
          li.appendChild(off);
        }
        ul.appendChild(li);
      });
      s1.appendChild(ul);
      if (global.SC500Dashboard) {
        var det = node('details', 'dr-table');
        det.appendChild(node('summary', null, 'Objective status: learn, lab, check'));
        det.appendChild(global.SC500Dashboard.objectiveTable(model, id));
        det.open = true;
        s1.appendChild(det);
      }

      /* Distinctions */
      var ds = model.distinctions.filter(function (x) {
        return x.modules.some(function (m) { return dom.lessonIds.indexOf(m) !== -1; });
      });
      if (ds.length && global.SC500Lesson) {
        var s2 = section(root, 'Important distinctions', 'dr-dist');
        s2.appendChild(node('p', 'lede', 'The comparisons from appendix A6 that involve this domain\u2019s lessons. Read the trap; open the table if the trap does not feel obvious.'));
        var list = node('div', 'distinctions__list');
        ds.forEach(function (x) { list.appendChild(global.SC500Lesson.distinction(x, model)); });
        s2.appendChild(list);
      }

      /* Mixed knowledge check */
      var s3 = section(root, 'Knowledge check', 'dr-check');
      var all = [];
      dom.lessonIds.forEach(function (lid) { all = all.concat(model.lessons[lid].questionIds); });
      var size = Math.min(10, all.length);
      s3.appendChild(node('p', 'lede', size + ' questions mixed from across the domain, the ones you are least sure of first (never answered, then answered wrong). ' + all.length + ' in the domain in total.'));
      var host = node('div');
      s3.appendChild(host);
      function draw() {
        host.textContent = '';
        var pick = prioritise(shuffle(all.slice())).slice(0, size);
        global.SC500Quiz.renderSet(host, recs(model, pick), { model: model, showLesson: true, src: 'domain-review' });
      }
      draw();
      var again = node('button', 'btn', 'New set');
      again.type = 'button';
      again.addEventListener('click', function () { draw(); s3.scrollIntoView({ block: 'start' }); });
      s3.appendChild(again);

      /* Needs review + recommendations */
      var s4 = section(root, 'Needs review', 'dr-weak');
      var weak = dom.bulletIds.map(function (b) { return model.bulletById[b]; }).filter(function (b) {
        return P().bulletCheck(b.questionIds, b.lessonIds, b.text) === 'review';
      });
      if (!weak.length) {
        s4.appendChild(node('p', 'empty', 'Nothing in this domain is marked for review. A sub-objective appears here when the latest answer to one of its questions was wrong, and leaves when you answer it correctly.'));
      } else {
        var wl = node('ul', 'weak-list');
        weak.forEach(function (b) {
          var li = node('li');
          li.appendChild(node('span', 'obj-chip', b.id));
          li.appendChild(document.createTextNode(' ' + b.text + ' '));
          b.lessonIds.filter(function (l) { return model.lessons[l].exam; }).forEach(function (lid) {
            li.appendChild(link('re-read ' + lid, '#/module/' + lid, 'weak-list__go'));
          });
          wl.appendChild(li);
        });
        s4.appendChild(wl);
        s4.appendChild(link('Retry only these questions', '#/prep/needs-review', 'btn'));
      }

      var s5 = section(root, 'Review recommendations', 'dr-recs');
      var recsList = node('ul', 'recs');
      dom.lessonIds.forEach(function (lid) {
        var l = model.lessons[lid];
        var items = [];
        if (!P().isComplete('module', lid)) items.push(['Study the lesson', '#/module/' + lid]);
        var c = P().lessonCheck(lid, l.questionIds);
        if (c === 'review') items.push(['Re-take the knowledge check', '#/module/' + lid + '/check']);
        else if (c === 'none' || c === 'partial') items.push(['Take the knowledge check', '#/module/' + lid + '/check']);
        if (l.hasLab && !P().isComplete('lab', lid)) items.push(['Do the lab', '#/lab/' + lid]);
        if (!items.length) return;
        var li = node('li');
        li.appendChild(node('span', 'recs__lesson', lid + ' \u00b7 ' + l.title));
        var acts = node('span', 'recs__acts');
        items.forEach(function (it) { acts.appendChild(link(it[0], it[1], 'chip')); });
        li.appendChild(acts);
        recsList.appendChild(li);
      });
      if (recsList.children.length) s5.appendChild(recsList);
      else s5.appendChild(node('p', 'empty', 'Every lesson in this domain is studied, practised where a lab exists, and checked.'));
    });
  }

  function section(root, title, cls) {
    var s = node('section', 'view-sec ' + (cls || ''));
    var id = 'sec-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var h = node('h2', null, title);
    h.id = id;
    s.setAttribute('aria-labelledby', id);
    s.appendChild(h);
    root.appendChild(s);
    return s;
  }

  /* ========================================================== coverage */

  var STATUS_TEXT = { covered: 'Covered', partial: 'Partial', missing: 'Missing' };
  var STATUS_TITLE = {
    covered: 'A lesson teaches it and at least one question tests it',
    partial: 'A lesson teaches it; no knowledge-check question tests it yet',
    missing: 'No lesson lists this sub-objective'
  };

  function coverageView(root) {
    withModel(root, function (model) {
      var head = node('header', 'view-head');
      head.appendChild(node('h1', null, 'Objective coverage'));
      head.appendChild(node('p', 'view-head__sub',
        'What this guide provides for every official SC-500 sub-objective. This page is about the content, not your progress. It is derived at load time from the skills snapshot, lesson front matter, the quiz files and appendix A6, so it cannot drift from them.'));
      root.appendChild(head);

      if (!model.snapshotOk) {
        root.appendChild(node('div', 'empty', 'The skills snapshot could not be parsed, so there is nothing to measure coverage against.'));
        return;
      }

      var counts = { covered: 0, partial: 0, missing: 0 }, labN = 0, distN = 0;
      model.bullets.forEach(function (b) {
        var c = C().coverage(model, b);
        counts[c.status]++;
        if (c.lab === 'available') labN++;
        if (c.distinctions) distN++;
      });

      var sum = node('div', 'cov-sum');
      [['covered', counts.covered, 'Covered', 'lesson + questions'],
       ['partial', counts.partial, 'Partial', 'lesson, no questions yet'],
       ['missing', counts.missing, 'Missing', 'no lesson lists it'],
       ['info', labN, 'With a lab', 'the rest: lab not applicable'],
       ['info', distN, 'With an A6 comparison', 'via one of their lessons']
      ].forEach(function (x) {
        var d = node('div', 'cov-sum__item');
        d.dataset.status = x[0];
        d.appendChild(node('span', 'cov-sum__n', String(x[1])));
        d.appendChild(node('span', 'cov-sum__label', x[2]));
        d.appendChild(node('span', 'cov-sum__desc', x[3]));
        sum.appendChild(d);
      });
      root.appendChild(sum);
      root.appendChild(node('p', 'field__note',
        model.bullets.length + ' official sub-objectives in the snapshot' +
        (model.snapshotDate ? ' (Microsoft page updated ' + model.snapshotDate + ')' : '') +
        '. Ids such as 2.3.4 are positions in that outline, assigned by this site for navigation - Microsoft does not number objectives.'));

      if (model.training) {
        var withPath = model.objectives.filter(function (o) { return o.path; }).length;
        var withLab = model.objectives.filter(function (o) { return o.officialLabs; }).length;
        var ot = node('p', 'field__note');
        ot.appendChild(document.createTextNode('Official training: ' + withPath + ' of ' + model.objectives.length +
          ' objectives map to a learning path in '));
        var ca = link('Course ' + model.training.course.code, model.training.course.url); ca.target = '_blank'; ca.rel = 'noopener';
        ot.appendChild(ca);
        ot.appendChild(document.createTextNode(', and ' + withLab + ' have at least one Microsoft lab (mapping verified ' + model.training.verified + ').'));
        root.appendChild(ot);
      }

      /* Stale or unmapped content - the freshness signal. */
      var orphanQ = Object.keys(model.questions).filter(function (q) { return !model.questions[q].bulletId; });
      if (model.unmapped.length || orphanQ.length || (model.trainingUnmapped && model.trainingUnmapped.length)) {
        var warn = node('div', 'cov-warn');
        warn.appendChild(node('h2', null, 'Needs maintainer review'));
        if (model.unmapped.length) {
          warn.appendChild(node('p', null, 'Lesson sub-objectives that match no bullet in the snapshot (renamed or removed by Microsoft?):'));
          var u = node('ul');
          model.unmapped.forEach(function (x) { u.appendChild(node('li', null, x.lessonId + ': ' + x.text)); });
          warn.appendChild(u);
        }
        if (model.trainingUnmapped && model.trainingUnmapped.length) {
          warn.appendChild(node('p', null, 'Official training entries whose objective matches no heading in the snapshot: ' + model.trainingUnmapped.join('; ')));
        }
        if (orphanQ.length) {
          warn.appendChild(node('p', null, orphanQ.length + ' question(s) whose sub_skill matches no official bullet: ' + orphanQ.join(', ')));
        }
        root.appendChild(warn);
      }

      model.domains.forEach(function (dom) {
        var sec = node('section', 'cov-dom');
        D().paint(sec, dom.id);
        var h = node('h2', 'cov-dom__title');
        h.appendChild(D().icon(dom.id, 18));
        h.appendChild(node('span', null, D().info(dom.id).short));
        h.appendChild(node('span', 'cov-dom__weight', dom.weight.replace('-', '\u2013')));
        sec.appendChild(h);

        var wrap = node('div', 'table-scroll');
        var t = node('table', 'covtable');
        t.dataset.stack = 'true';
        var thead = node('thead'), hr = node('tr');
        ['Sub-objective', 'Lessons', 'Comparison', 'Lab', 'Questions', 'Status'].forEach(function (x) {
          var th = node('th', null, x); th.setAttribute('scope', 'col'); hr.appendChild(th);
        });
        thead.appendChild(hr); t.appendChild(thead);
        var tb = node('tbody');
        dom.objectiveIds.forEach(function (oid) {
          var o = model.objectiveById[oid];
          var gr = node('tr', 'objtable__group');
          var gh = node('th', null, '');
          gh.setAttribute('colspan', '6');
          gh.setAttribute('scope', 'rowgroup');
          gh.appendChild(node('span', 'obj-chip', o.id));
          gh.appendChild(document.createTextNode(' ' + o.text));
          if (o.path) {
            var op = node('span', 'cov-official');
            var pa = link('Microsoft Learn path', o.path.url); pa.target = '_blank'; pa.rel = 'noopener';
            op.appendChild(pa);
            op.appendChild(document.createTextNode(o.officialLabs ? ' \u00b7 ' + o.officialLabs.length + ' official lab' + (o.officialLabs.length === 1 ? '' : 's') : ' \u00b7 no official lab'));
            gh.appendChild(op);
          }
          gr.appendChild(gh);
          tb.appendChild(gr);
          o.bulletIds.forEach(function (bid) {
            var b = model.bulletById[bid];
            var c = C().coverage(model, b);
            var tr = node('tr');
            tr.dataset.status = c.status;
            var th = node('th');
            th.setAttribute('scope', 'row');
            th.appendChild(node('span', 'obj-chip', b.id));
            th.appendChild(document.createTextNode(' ' + b.text));
            tr.appendChild(th);

            var tdL = node('td'); tdL.dataset.label = 'Lessons';
            c.lessons.forEach(function (l, i) {
              if (i) tdL.appendChild(document.createTextNode(' '));
              var a = link(l.id, '#/module/' + l.id); a.title = l.title; tdL.appendChild(a);
            });
            if (!c.lessons.length) tdL.textContent = '\u2014';
            tr.appendChild(tdL);

            var tdD = node('td', null, c.distinctions ? 'Yes' : '\u2014'); tdD.dataset.label = 'Comparison'; tr.appendChild(tdD);
            var tdB = node('td', null, c.lab === 'available' ? 'Available' : 'n/a'); tdB.dataset.label = 'Lab'; tr.appendChild(tdB);
            var tdQ = node('td', null, String(c.questions)); tdQ.dataset.label = 'Questions'; tr.appendChild(tdQ);
            var tdS = node('td'); tdS.dataset.label = 'Status';
            var st = node('span', 'cov-status', STATUS_TEXT[c.status]);
            st.dataset.status = c.status;
            st.title = STATUS_TITLE[c.status];
            tdS.appendChild(st);
            tr.appendChild(tdS);
            tb.appendChild(tr);
          });
        });
        t.appendChild(tb);
        wrap.appendChild(t);
        sec.appendChild(wrap);
        root.appendChild(sec);
      });

      var fresh = node('p', 'field__note');
      var nVis = Object.keys(model.lessons).filter(function (k) { return model.lessons[k].hasVisual; }).length;
      fresh.appendChild(document.createTextNode('Visual explanations: ' + nVis +
        (nVis === 1 ? ' lesson contains a diagram' : ' lessons contain a diagram') + '. Verification dates and preview status: see the '));
      fresh.appendChild(link('verification watchlist', '#/preview'));
      fresh.appendChild(document.createTextNode('.'));
      root.appendChild(fresh);
    });
  }

  /* ========================================================== exam prep */

  var PAGE = 12;

  function prepView(root, manifest, filter, arg) {
    withModel(root, function (model) {
      var head = node('header', 'view-head');
      head.appendChild(node('h1', null, 'Exam prep'));
      head.appendChild(node('p', 'view-head__sub',
        'Measured SC-500 material only: every question here is tagged to an official sub-objective. Results are counts of what you answered, not a prediction - the exam is scaled and questions are not equally weighted.'));
      root.appendChild(head);

      var qids = Object.keys(model.questions).filter(function (q) {
        var l = model.lessons[model.questions[q].lessonId];
        return l && l.exam;
      });
      var wrong = qids.filter(function (q) { var a = P().answer(q); return a && !a.ok; });
      var fresh = qids.filter(function (q) { return !P().answer(q); });
      var weakBullets = model.bullets.filter(function (b) { return P().bulletCheck(b.questionIds, b.lessonIds, b.text) === 'review'; });
      var marks = P().marks();

      /* Filter bar */
      var bar = node('nav', 'prep-filters');
      bar.setAttribute('aria-label', 'Review by');
      function f(label, n, href, key) {
        var a = link('', href, 'pfilter');
        if (key === (filter || 'home') + (arg ? ':' + arg : '')) a.setAttribute('aria-current', 'page');
        a.appendChild(node('span', 'pfilter__label', label));
        if (n != null) a.appendChild(node('span', 'pfilter__n', String(n)));
        bar.appendChild(a);
        return a;
      }
      f('Overview', null, '#/prep', 'home');
      f('Needs review', weakBullets.length, '#/prep/needs-review', 'needs-review');
      f('Answered incorrectly', wrong.length, '#/prep/incorrect', 'incorrect');
      f('Not answered yet', fresh.length, '#/prep/unanswered', 'unanswered');
      f('Review later', marks.length, '#/prep/later', 'later');
      f('Mixed set', null, '#/prep/mixed', 'mixed');
      model.domains.forEach(function (d) {
        var a = f(D().info(d.id).short, null, '#/prep/domain/' + d.id, 'domain:' + d.id);
        D().paint(a, d.id);
        a.classList.add('pfilter--domain');
        a.insertBefore(D().icon(d.id, 14), a.firstChild);
      });
      root.appendChild(bar);

      /* Objective picker */
      var pick = node('div', 'prep-objective');
      var lab = node('label', null, 'Review one objective ');
      lab.htmlFor = 'prep-obj';
      var sel = node('select');
      sel.id = 'prep-obj';
      sel.appendChild(node('option', null, 'Choose an objective\u2026')).value = '';
      model.objectives.forEach(function (o) {
        var opt = node('option', null, o.id + '  ' + o.text);
        opt.value = o.id;
        if (filter === 'objective' && arg === o.id) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () { if (sel.value) location.hash = '#/prep/objective/' + sel.value; });
      pick.appendChild(lab);
      pick.appendChild(sel);
      root.appendChild(pick);

      var body = node('section', 'prep-body');
      root.appendChild(body);

      if (!filter) return prepHome(body, model, qids, wrong, fresh, weakBullets, marks);

      var set = [], title = '', note = '';
      if (filter === 'needs-review') {
        title = 'Needs review';
        note = 'Sub-objectives where the latest answer to at least one question was wrong. Answer them correctly and they leave this list.';
        weakBullets.forEach(function (b) { set = set.concat(b.questionIds); });
        if (weakBullets.length) body.appendChild(weakList(model, weakBullets));
      } else if (filter === 'incorrect') {
        title = 'Answered incorrectly'; note = 'Every question whose latest answer was wrong, oldest first.'; set = wrong;
      } else if (filter === 'unanswered') {
        title = 'Not answered yet'; note = 'Questions you have never answered, in study order.'; set = fresh;
      } else if (filter === 'later') {
        title = 'Review later';
        note = 'Lessons you bookmarked, and their questions.';
        body.appendChild(laterList(model, marks));
        marks.forEach(function (mk) {
          var id = mk.key.replace(/^module:/, '');
          if (model.lessons[id]) set = set.concat(model.lessons[id].questionIds);
        });
      } else if (filter === 'domain' && model.domainById[arg]) {
        title = D().info(arg).short;
        note = 'Every question in the domain, least certain first.';
        model.domainById[arg].lessonIds.forEach(function (l) { set = set.concat(model.lessons[l].questionIds); });
        set = prioritise(set);
      } else if (filter === 'objective' && model.objectiveById[arg]) {
        var o = model.objectiveById[arg];
        title = o.id + ' ' + o.text;
        note = 'Questions tagged to this objective\u2019s sub-objectives.';
        o.bulletIds.forEach(function (b) { set = set.concat(model.bulletById[b].questionIds); });
        set = prioritise(set);
      } else if (filter === 'mixed') {
        title = 'Mixed set';
        note = 'Twelve questions across all four domains, weighted by exam weight, least certain first within each domain. For a timed attempt use the mock exam.';
        set = mixed(model, 12);
      } else {
        body.appendChild(node('div', 'empty', 'Unknown review filter.'));
        return;
      }

      var h = node('h2', null, title);
      body.insertBefore(h, body.firstChild);
      body.insertBefore(node('p', 'lede', note), h.nextSibling);
      if (!set.length) {
        body.appendChild(node('p', 'empty', 'Nothing here right now.'));
        return;
      }
      paged(body, model, set);
    });
  }

  function paged(body, model, set) {
    var host = node('div');
    body.appendChild(host);
    var start = 0;
    var more = node('button', 'btn', '');
    more.type = 'button';
    function draw() {
      var chunk = set.slice(start, start + PAGE);
      var block = node('div', 'prep-page');
      global.SC500Quiz.renderSet(block, recs(model, chunk), { model: model, showLesson: true, src: 'prep' });
      host.appendChild(block);
      start += chunk.length;
      more.hidden = start >= set.length;
      more.textContent = 'Next ' + Math.min(PAGE, set.length - start) + ' of ' + (set.length - start) + ' remaining';
    }
    more.addEventListener('click', draw);
    draw();
    body.appendChild(more);
  }

  function mixed(model, n) {
    var total = 0, pools = [];
    model.domains.forEach(function (d) {
      var w = /(\d+)-(\d+)/.exec(d.weight); var mid = w ? (+w[1] + +w[2]) / 2 : 0;
      var q = [];
      d.lessonIds.forEach(function (l) { q = q.concat(model.lessons[l].questionIds); });
      pools.push({ w: mid, q: prioritise(shuffle(q)) });
      total += mid;
    });
    var out = [];
    pools.forEach(function (p) { out = out.concat(p.q.slice(0, Math.max(1, Math.round(n * p.w / total)))); });
    return shuffle(out).slice(0, n);
  }

  function weakList(model, bullets) {
    var ul = node('ul', 'weak-list');
    bullets.forEach(function (b) {
      var li = node('li');
      D().paint(li, b.domainId);
      li.appendChild(D().icon(b.domainId, 14));
      li.appendChild(node('span', 'obj-chip', b.id));
      li.appendChild(document.createTextNode(' ' + b.text + ' '));
      b.lessonIds.filter(function (l) { return model.lessons[l].exam; }).forEach(function (lid) {
        li.appendChild(link('re-read ' + lid, '#/module/' + lid, 'weak-list__go'));
      });
      ul.appendChild(li);
    });
    return ul;
  }

  function laterList(model, marks) {
    if (!marks.length) return node('p', 'empty', 'Nothing bookmarked. Use \u201cReview later\u201d in any lesson header.');
    var ul = node('ul', 'later-list');
    marks.forEach(function (mk) {
      var li = node('li');
      if (mk.domain) { D().paint(li, mk.domain); li.appendChild(D().icon(mk.domain, 14)); }
      li.appendChild(link(mk.title, mk.href || '#/'));
      var rm = node('button', 'btn btn--small', 'Remove');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + mk.title + ' from Review later');
      rm.addEventListener('click', function () { P().toggleMark(mk.key); li.remove(); });
      li.appendChild(rm);
      ul.appendChild(li);
    });
    return ul;
  }

  function prepHome(body, model, qids, wrong, fresh, weak, marks) {
    body.appendChild(node('h2', null, 'Where you stand'));
    var grid = node('div', 'prep-grid');
    var answered = qids.length - fresh.length;
    [['Questions answered', answered + ' / ' + qids.length],
     ['Latest answer wrong', String(wrong.length)],
     ['Sub-objectives needing review', String(weak.length)],
     ['Lessons in Review later', String(marks.length)]
    ].forEach(function (x) {
      var d = node('div', 'prep-stat');
      d.appendChild(node('span', 'prep-stat__n', x[1]));
      d.appendChild(node('span', 'prep-stat__l', x[0]));
      grid.appendChild(d);
    });
    body.appendChild(grid);

    var t = node('table', 'prep-domains');
    t.dataset.stack = 'true';
    var thead = node('thead'), hr = node('tr');
    ['Domain', 'Weight', 'Answered', 'Correct (latest)', 'Needs review'].forEach(function (h) { hr.appendChild(node('th', null, h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = node('tbody');
    model.domains.forEach(function (d) {
      var q = [];
      d.lessonIds.forEach(function (l) { q = q.concat(model.lessons[l].questionIds); });
      var a = 0, c = 0;
      q.forEach(function (id) { var r = P().answer(id); if (r) { a++; if (r.ok) c++; } });
      var nr = d.bulletIds.filter(function (b) { var x = model.bulletById[b]; return P().bulletCheck(x.questionIds, x.lessonIds, x.text) === 'review'; }).length;
      var tr = node('tr');
      var th = node('th'); th.setAttribute('scope', 'row');
      var al = link('', '#/prep/domain/' + d.id, 'dom-link');
      D().paint(al, d.id);
      al.appendChild(D().icon(d.id, 14));
      al.appendChild(document.createTextNode(' ' + D().info(d.id).short));
      th.appendChild(al);
      tr.appendChild(th);
      [['Weight', d.weight.replace('-', '\u2013')], ['Answered', a + ' / ' + q.length], ['Correct (latest)', a ? c + ' / ' + a : '\u2013'], ['Needs review', String(nr)]]
        .forEach(function (x) { var td = node('td', null, x[1]); td.dataset.label = x[0]; tr.appendChild(td); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var wrap = node('div', 'table-scroll');
    wrap.appendChild(t);
    body.appendChild(wrap);

    body.appendChild(node('h2', null, 'Other ways to review'));
    var tools = node('div', 'tools-row');
    [['Mock exam', '#/exam', 'Timed and weighted like the real outline. Raw score only.'],
     ['Flashcards', '#/cards', 'The distinctions deck, on a spaced-repetition schedule.'],
     ['Retention', '#/review', 'Which knowledge checks are due for a re-test.'],
     ['Choosing between controls', model.a6Index >= 0 ? '#/appendix/' + model.a6Index : '#/coverage', 'Appendix A6: fifteen comparisons and their traps.']
    ].forEach(function (x) {
      var a = link('', x[1], 'tool');
      a.appendChild(node('span', 'tool__name', x[0]));
      a.appendChild(node('span', 'tool__desc', x[2]));
      tools.appendChild(a);
    });
    body.appendChild(tools);
  }

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.domain = domainView;
  global.SC500Views.coverage = coverageView;
  global.SC500Views.prep = prepView;
})(window);
