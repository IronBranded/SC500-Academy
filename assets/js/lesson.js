/* lesson.js - SC-500 guide
   Lesson anatomy and lab mode.

   Every exam module is written to the same skeleton (Sub-objectives covered,
   Why this exists, How it works under the hood, Configuration surface, Common
   failure modes, How this is tested, Hands-on, Check yourself, Sources). This
   file re-presents that skeleton as the certification learning sequence

     ORIENT -> LEARN -> (VISUALIZE) -> DISTINGUISH -> PRACTICE -> CHECK -> REVIEW

   without editing a single content file. Sections are MOVED into stages, never
   rewritten; a heading this file does not recognise lands in LEARN, in its
   original order, so new content can never disappear because of this layer.

   What it adds, all derived from existing data:

   - a topic header: domain (colour + icon + name), the official objective and
     its position in the outline, lab availability, status, verification date,
     and the three learning states (studied / practised / knowledge checked)
   - "You are here" breadcrumbs
   - WHAT YOU NEED TO KNOW: the verbatim sub-objectives with their outline ids
     and a per-objective knowledge-check state, plus the lesson's prerequisites
     with whether each has been studied
   - IMPORTANT DISTINCTIONS: the appendix A6 comparisons that name this module,
     rendered inline with the trap visible and the full table one click away
   - the SC-500 EXAM LENS: "How this is tested", framed as one recognisable
     component
   - a PRACTICE card for the lab, or an explicit "no lab for this objective"
   - NEXT STEP: previous, recommended next, related, and the domain review
   - the investigation note (forensic_relevance) moved from the top of the page
     to a collapsed "Beyond the exam" panel at the end: useful, not measured

   Labs get a separate, visibly different LAB MODE header and a part tracker. */

(function (global) {
  'use strict';

  var MODE_KEY = 'sc500:readmode:v1';     // shared with tabs.js
  var LABPOS_KEY = 'sc500:labpos:v1';

  var current = null;   // { root, route, refs } for refresh()

  /* ---------------------------------------------------------------- utils */

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(text, href, cls) {
    var a = node('a', cls || null, text);
    a.href = href;
    return a;
  }
  function D() { return global.SC500Domains; }
  function P() { return global.SC500Progress; }
  function C() { return global.SC500Curriculum; }
  function key(el) { return (el.textContent || '').replace(/§$/, '').trim().toLowerCase(); }

  var STAGES = [
    { id: 'orient',      label: 'Orient' },
    { id: 'learn',       label: 'Learn' },
    { id: 'visualize',   label: 'Visualize' },
    { id: 'distinguish', label: 'Distinguish' },
    { id: 'practice',    label: 'Practice' },
    { id: 'check',       label: 'Check' },
    { id: 'review',      label: 'Review' }
  ];

  /* heading text -> where it goes. Anything else goes to LEARN. */
  var PLACE = {
    'sub-objectives covered': 'orient',
    'common failure modes':   'pitfalls',
    'the traps, specifically':'pitfalls',
    'how this is tested':     'lens',
    'hands-on':               'practice',
    'check yourself':         'selfcheck',
    'takeaways':              'takeaways',
    'key takeaways':          'takeaways',
    'sources':                'sources'
  };

  /* Split the rendered page into [intro nodes] and h2 chunks. */
  function chunks(root) {
    var intro = [], list = [], cur = null;
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === 'H2') {
        cur = { head: n, key: key(n), nodes: [] };
        list.push(cur);
      } else if (cur) {
        cur.nodes.push(n);
      } else {
        intro.push(n);
      }
    });
    return { intro: intro, list: list };
  }

  function stage(id, extraClass) {
    var s = node('section', 'stage' + (extraClass ? ' ' + extraClass : ''));
    s.id = 'stage-' + id;
    s.dataset.stage = id;
    var label = STAGES.filter(function (x) { return x.id === id; })[0];
    var head = node('div', 'stage__head');
    head.appendChild(node('span', 'stage__eyebrow', label ? label.label : id));
    s.appendChild(head);
    return s;
  }

  function append(target, chunk) {
    if (!chunk) return;
    target.appendChild(chunk.head);
    chunk.nodes.forEach(function (n) { target.appendChild(n); });
  }

  function stateLabel(st) {
    return ({
      checked: 'Checked', review: 'Needs review', partial: 'In progress',
      none: 'Not checked yet', noq: 'No questions yet'
    })[st] || st;
  }

  function stateChip(st, extra) {
    var c = node('span', 'state', stateLabel(st) + (extra || ''));
    c.dataset.state = st;
    return c;
  }

  /* ------------------------------------------------------ module lessons */

  function mountModule(root, route, fm) {
    var parts = chunks(root);
    if (!parts.list.length) return false;

    var h1 = root.querySelector('h1');
    var byPlace = {};
    var learn = [];
    /* VISUALIZE is not a section of its own: diagrams stay next to the
       explanation they illustrate. The stage rail links to the first one. */
    var firstDiagram = root.querySelector('pre > code.language-mermaid');
    if (firstDiagram) firstDiagram.parentNode.id = 'stage-visualize';
    parts.list.forEach(function (c) {
      var p = PLACE[c.key];
      if (p && !byPlace[p]) byPlace[p] = c;
      else learn.push(c);
    });

    /* The intro blockquote restates objective and domain, which the header
       now shows. Keep anything else that sits between the title and the first
       section (a few modules have a note there). */
    var introKeep = parts.intro.filter(function (n) {
      if (n === h1) return false;
      if (n.nodeType === 1 && n.tagName === 'BLOCKQUOTE' && /^\s*Objective:/.test(n.textContent)) return false;
      return !(n.nodeType === 3 && !n.textContent.trim());
    });

    root.textContent = '';

    var article = node('article', 'lesson');
    var header = node('header', 'lesson-head');
    article.appendChild(header);
    if (h1) header.appendChild(h1);

    var present = [];

    /* ORIENT */
    var orient = stage('orient');
    var outcomes = node('ol', 'outcomes');
    var need = node('h2', null, 'What you need to know');
    orient.appendChild(need);
    if (byPlace.orient) {
      orient.appendChild(node('p', 'lede',
        'After this lesson you should be able to do each of the following. The wording is Microsoft\u2019s own, from the SC-500 skills outline.'));
      orient.appendChild(outcomes);
      /* Carry over the list items verbatim, then any notes after the list. */
      var ul = byPlace.orient.nodes.filter(function (n) { return n.nodeType === 1 && (n.tagName === 'UL' || n.tagName === 'OL'); })[0];
      if (ul) {
        Array.prototype.slice.call(ul.children).forEach(function (li) {
          var item = node('li', 'outcome');
          item.dataset.text = li.textContent.trim();
          var t = node('span', 'outcome__text');
          while (li.firstChild) t.appendChild(li.firstChild);
          item.appendChild(t);
          outcomes.appendChild(item);
        });
      }
      byPlace.orient.nodes.forEach(function (n) { if (n !== ul) orient.appendChild(n); });
    } else {
      orient.appendChild(node('p', 'lede',
        route.moduleId && route.moduleId.indexOf('00-') === 0
          ? 'Module 0 is a project prerequisite rather than exam content: it makes every later lab safe and affordable. Complete it before creating any billable resource.'
          : 'This lesson has no sub-objective list.'));
    }
    introKeep.forEach(function (n) { orient.appendChild(n); });
    var prereqHost = node('div', 'prereqs');
    prereqHost.hidden = true;
    orient.appendChild(prereqHost);
    var trainingHost = node('div', 'official');
    trainingHost.hidden = true;
    orient.appendChild(trainingHost);
    article.appendChild(orient);
    present.push('orient');

    /* LEARN */
    if (learn.length) {
      var learnS = stage('learn');
      learn.forEach(function (c) { append(learnS, c); });
      var reviewNote = node('div', 'stage__collapsed');
      var showAll = node('button', 'btn', 'Show the Learn stage');
      showAll.type = 'button';
      showAll.addEventListener('click', function () { setMode('full'); });
      reviewNote.appendChild(node('span', null, 'Review pass: the explanation is folded away.'));
      reviewNote.appendChild(showAll);
      learnS.insertBefore(reviewNote, learnS.children[1] || null);
      article.appendChild(learnS);
      present.push('learn');
      if (firstDiagram) present.push('visualize');
    }

    /* DISTINGUISH */
    var dist = stage('distinguish');
    var distHost = node('div', 'distinctions');
    distHost.hidden = true;
    var distHead = node('h2', null, 'Important distinctions');
    distHost.appendChild(distHead);
    distHost.appendChild(node('p', 'lede',
      'The controls this lesson is most easily confused with. Each comparison comes from appendix A6; the trap is the nearly-right answer the exam relies on.'));
    var distList = node('div', 'distinctions__list');
    distHost.appendChild(distList);
    dist.appendChild(distHost);
    if (byPlace.pitfalls) append(dist, byPlace.pitfalls);
    if (byPlace.lens) {
      var lens = node('aside', 'exam-lens');
      lens.setAttribute('aria-labelledby', 'exam-lens-title');
      var lh = byPlace.lens.head;
      lh.id = 'exam-lens-title';
      lh.textContent = 'SC-500 Exam Lens';
      lens.appendChild(lh);
      lens.appendChild(node('p', 'exam-lens__sub',
        'How this is tested. For SC-500, make sure you can recognise the deciding constraint in a scenario and select the control it points to.'));
      byPlace.lens.nodes.forEach(function (n) { lens.appendChild(n); });
      dist.appendChild(lens);
    }
    if (byPlace.pitfalls || byPlace.lens) { article.appendChild(dist); present.push('distinguish'); }
    else { article.appendChild(dist); dist.dataset.pending = 'true'; }

    /* PRACTICE */
    var practice = stage('practice');
    practice.appendChild(node('h2', null, 'Practice'));
    var labCard = node('div', 'lab-card');
    practice.appendChild(labCard);
    if (byPlace.practice) {
      /* The original "Hands-on" section is only a link to the lab; the card
         replaces it. Keep any other prose it contains. */
      byPlace.practice.nodes.forEach(function (n) {
        if (n.nodeType === 1 && /^\s*See\s/.test(n.textContent) && n.querySelector('a')) return;
        if (n.nodeType === 1 && n.textContent.trim()) practice.appendChild(n);
      });
    }
    article.appendChild(practice);
    present.push('practice');

    /* CHECK */
    var check = stage('check');
    var slot = node('div', 'kc-slot');
    slot.dataset.slot = 'knowledge-check';
    slot.appendChild(node('h2', null, 'Knowledge check'));
    check.appendChild(slot);
    if (byPlace.selfcheck) {
      var sc = node('div', 'selfcheck');
      var h = node('h3', null, 'Explain it yourself');
      sc.appendChild(h);
      sc.appendChild(node('p', 'lede',
        'Open questions with no scoring. Answer them out loud or in writing before moving on; if one is hard, that is the section to re-read.'));
      byPlace.selfcheck.nodes.forEach(function (n) { sc.appendChild(n); });
      check.appendChild(sc);
    }
    article.appendChild(check);
    present.push('check');

    /* REVIEW */
    var review = stage('review');
    if (byPlace.takeaways) append(review, byPlace.takeaways);
    var next = node('nav', 'next-step');
    next.setAttribute('aria-label', 'Next step');
    review.appendChild(next);
    if (byPlace.sources) append(review, byPlace.sources);
    if (fm && fm.forensic_relevance) {
      var beyond = node('details', 'beyond');
      var sum = node('summary', null, 'Beyond the exam: how this shows up in an investigation');
      beyond.appendChild(sum);
      beyond.appendChild(node('p', 'field__note', 'Not measured by SC-500. Kept for context.'));
      beyond.appendChild(node('p', null, String(fm.forensic_relevance)));
      review.appendChild(beyond);
    }
    article.appendChild(review);
    present.push('review');

    root.appendChild(article);

    /* Header needs the stage list, so build it last. */
    var refs = buildHeader(header, route, fm, present, orient);
    refs.outcomes = outcomes;
    refs.prereqHost = prereqHost;
    refs.trainingHost = trainingHost;
    refs.distHost = distHost;
    refs.distList = distList;
    refs.dist = dist;
    refs.labCard = labCard;
    refs.next = next;
    refs.article = article;
    current = { root: root, route: route, fm: fm, refs: refs };

    applyMode(readMode());
    return true;
  }

  /* --------------------------------------------------------------- header */

  function buildHeader(header, route, fm, present, orient) {
    var refs = {};
    var crumbs = node('nav', 'crumbs');
    crumbs.setAttribute('aria-label', 'You are here');
    header.insertBefore(crumbs, header.firstChild);
    refs.crumbs = crumbs;

    var top = node('div', 'lesson-head__top');
    header.insertBefore(top, crumbs.nextSibling);
    refs.top = top;

    var obj = node('p', 'lesson-head__obj');
    header.appendChild(obj);
    refs.obj = obj;

    var facts = node('ul', 'facts');
    header.appendChild(facts);
    refs.facts = facts;

    var states = node('div', 'learn-states');
    states.setAttribute('aria-label', 'Your progress on this lesson');
    header.appendChild(states);
    refs.states = states;

    var actions = node('div', 'lesson-head__actions');
    header.appendChild(actions);
    refs.actions = actions;

    var rail = node('nav', 'stages');
    rail.setAttribute('aria-label', 'Lesson stages');
    var ol = node('ol');
    STAGES.forEach(function (s) {
      if (present.indexOf(s.id) === -1) return;
      var li = node('li');
      li.dataset.stage = s.id;
      li.appendChild(link(s.label, '#stage-' + s.id));
      ol.appendChild(li);
    });
    rail.appendChild(ol);
    header.appendChild(rail);
    refs.rail = rail;

    /* In-page stage links must not trigger the hash router. */
    rail.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    });

    /* Review-later toggle and read mode. */
    var mark = node('button', 'btn btn--toggle', '');
    mark.type = 'button';
    mark.addEventListener('click', function () {
      var m = C() && C().get();
      var l = m ? m.lessons[route.moduleId] : null;
      P().toggleMark('module:' + route.moduleId, {
        title: l ? l.title : route.moduleId, href: '#/module/' + route.moduleId, domain: l ? l.domainId : null
      });
      paintMark();
    });
    function paintMark() {
      var on = P() && P().isMarked('module:' + route.moduleId);
      mark.textContent = on ? '\u2605 In Review later' : '\u2606 Review later';
      mark.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    paintMark();
    actions.appendChild(mark);

    var mode = node('button', 'btn btn--toggle', '');
    mode.type = 'button';
    mode.title = 'Review pass folds the Learn stage and keeps distinctions, exam lens and checks open';
    mode.addEventListener('click', function () { setMode(readMode() === 'review' ? 'full' : 'review'); });
    actions.appendChild(mode);
    refs.modeBtn = mode;

    return refs;
  }

  function readMode() {
    try { return localStorage.getItem(MODE_KEY) || 'full'; } catch (e) { return 'full'; }
  }
  function setMode(m) {
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
    applyMode(m);
  }
  function applyMode(m) {
    if (!current) return;
    current.refs.article.dataset.mode = m;
    var b = current.refs.modeBtn;
    if (b) {
      b.textContent = m === 'review' ? 'Show full lesson' : 'Review pass';
      b.setAttribute('aria-pressed', m === 'review' ? 'true' : 'false');
    }
  }

  /* ------------------------------------------ async: needs the curriculum */

  function enrich() {
    if (!current || !C()) return;
    var cur = current;
    C().load().then(function (model) {
      if (current !== cur) return;           // navigated away meanwhile
      var L = model.lessons[cur.route.moduleId];
      if (!L) return;
      var refs = cur.refs;
      var header = refs.top.parentNode;
      /* progress.js put its strip under the h1; it belongs with the actions. */
      var strip = header.querySelector('.progress-strip');
      if (strip && strip.parentNode !== refs.actions) refs.actions.insertBefore(strip, refs.actions.firstChild);
      D().paint(header.parentNode, L.domainId);   // the whole article

      /* Breadcrumbs: SC-500 > Domain > Objective > Lesson */
      var c = refs.crumbs;
      c.textContent = '';
      c.appendChild(node('span', 'crumbs__label', 'You are here'));
      var ol = node('ol');
      function crumb(el) { var li = node('li'); li.appendChild(el); ol.appendChild(li); }
      crumb(link('SC-500', '#/'));
      if (L.exam) crumb(link(D().info(L.domainId).short, '#/domain/' + L.domainId));
      else crumb(link('Lab safety', '#/'));
      var obj = L.objectiveId ? model.objectiveById[L.objectiveId] : null;
      if (obj) crumb(node('span', null, obj.text));
      var here = node('span', null, L.title);
      here.setAttribute('aria-current', 'page');
      crumb(here);
      c.appendChild(ol);

      /* Domain badge and status */
      refs.top.textContent = '';
      refs.top.appendChild(D().badge(L.domainId, { weight: L.weight }));
      refs.top.appendChild(node('span', 'lesson-head__id', 'Lesson ' + L.id));
      if (L.fm.status) {
        var st = node('span', 'status', String(L.fm.status));
        st.dataset.status = String(L.fm.status);
        refs.top.appendChild(st);
      }

      /* Official objective */
      refs.obj.textContent = '';
      if (obj) {
        refs.obj.appendChild(node('span', 'obj-chip', obj.id));
        refs.obj.appendChild(document.createTextNode(' ' + obj.text));
      } else {
        refs.obj.textContent = L.objectiveText || '';
      }

      /* Facts row: only what is actually known */
      var f = refs.facts;
      f.textContent = '';
      function fact(text, cls) { var li = node('li', cls || null); if (typeof text === 'string') li.textContent = text; else li.appendChild(text); f.appendChild(li); }
      if (L.bulletIds.length) fact(L.bulletIds.length + (L.bulletIds.length === 1 ? ' sub-objective' : ' sub-objectives'));
      if (L.hasLab) fact(link('Lab available', '#/lab/' + L.id));
      else fact('No lab for this lesson');
      if (L.questionIds.length) fact(L.questionIds.length + '-question knowledge check');
      if (L.fm.last_verified) fact('Verified ' + L.fm.last_verified);

      paintStates(model, L);
      paintOutcomes(model, L);
      paintPrereqs(model, L);
      paintTraining(model, L);
      paintDistinctions(model, L);
      paintLabCard(model, L);
      paintNext(model, L);
    }).catch(function () { /* the page still reads without enrichment */ });
  }

  function paintStates(model, L) {
    var s = current.refs.states;
    s.textContent = '';
    var studied = P().isComplete('module', L.id);
    var practised = L.hasLab ? P().isComplete('lab', L.id) : null;
    var chk = P().lessonCheck(L.id, L.questionIds);
    function pill(name, on, text, st) {
      var p = node('span', 'lstate');
      p.dataset.state = st;
      p.appendChild(node('span', 'lstate__mark', on === true ? '\u2713' : on === 'warn' ? '!' : on === null ? '\u2013' : '\u25cb'));
      p.appendChild(node('span', 'lstate__name', name));
      p.appendChild(node('span', 'lstate__val', text));
      s.appendChild(p);
    }
    pill('Studied', studied, studied ? 'Done' : 'Not yet', studied ? 'done' : 'todo');
    if (practised === null) pill('Practised', null, 'No lab', 'na');
    else pill('Practised', practised, practised ? 'Lab complete' : 'Not yet', practised ? 'done' : 'todo');
    pill('Checked', chk === 'checked' ? true : chk === 'review' ? 'warn' : chk === 'noq' ? null : false,
      stateLabel(chk), chk === 'checked' ? 'done' : chk === 'review' ? 'review' : chk === 'noq' ? 'na' : 'todo');
  }

  function paintOutcomes(model, L) {
    var items = current.refs.outcomes.querySelectorAll('.outcome');
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var b = model.bulletByNorm[C().norm(li.dataset.text)];
      var old = li.querySelectorAll('.obj-chip, .state');
      for (var k = 0; k < old.length; k++) old[k].remove();
      if (!b) continue;
      var chip = node('span', 'obj-chip', b.id);
      chip.title = 'Position in the SC-500 skills outline';
      li.insertBefore(chip, li.firstChild);
      li.appendChild(stateChip(P().bulletCheck(b.questionIds, b.lessonIds, b.text)));
    }
  }

  function paintPrereqs(model, L) {
    var host = current.refs.prereqHost;
    host.textContent = '';
    var ids = L.prerequisites.filter(function (id) { return model.lessons[id]; });
    if (!ids.length) { host.hidden = true; return; }
    host.hidden = false;
    host.appendChild(node('h3', null, 'Recommended before this lesson'));
    var ul = node('ul', 'prereqs__list');
    ids.forEach(function (id) {
      var p = model.lessons[id];
      var done = P().isComplete('module', id);
      var li = node('li');
      li.dataset.done = done ? 'true' : 'false';
      li.appendChild(node('span', 'prereqs__mark', done ? '\u2713' : '\u25cb'));
      li.appendChild(link(p.id + ' \u00b7 ' + p.title, '#/module/' + id));
      li.appendChild(node('span', 'visually-hidden', done ? ' (studied)' : ' (not studied yet)'));
      ul.appendChild(li);
    });
    host.appendChild(ul);
  }

  /* Microsoft's own training for this lesson's objective: the Microsoft Learn
     learning path from Course SC-500T00-A, and Microsoft's lab exercises.
     From content/official-training.json; nothing here is inferred. */
  function extLink(text, href) {
    var a = link(text, href);
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  function paintTraining(model, L) {
    var host = current.refs.trainingHost;
    host.textContent = '';
    var o = L.objectiveId ? model.objectiveById[L.objectiveId] : null;
    if (!model.training || !o || (!o.path && !L.officialModules && !L.officialLabs)) { host.hidden = true; return; }
    host.hidden = false;
    host.appendChild(node('h3', null, 'Official Microsoft training for this lesson'));
    var ul = node('ul', 'official__list');
    /* The modules that cover THIS lesson come first: they are the precise
       match. The whole learning path follows, for the objective as a whole. */
    (L.officialModules || []).forEach(function (mod) {
      var li = node('li');
      li.appendChild(node('span', 'official__kind', 'Module'));
      li.appendChild(extLink(mod.title, mod.url));
      ul.appendChild(li);
    });
    if (o.path) {
      var li = node('li');
      li.appendChild(node('span', 'official__kind', 'Learning path'));
      li.appendChild(extLink(o.path.title, o.path.url));
      li.appendChild(node('span', 'official__meta', 'all ' + o.path.modules + ' modules for objective ' + o.id + ' \u00b7 Course ' + model.training.course.code));
      ul.appendChild(li);
    }
    (L.officialLabs || []).forEach(function (l) {
      var li = node('li');
      li.appendChild(node('span', 'official__kind', l.supplemental ? 'Lab (supplemental)' : 'Lab'));
      li.appendChild(extLink(l.id + ' \u00b7 ' + l.title, l.url));
      ul.appendChild(li);
    });
    host.appendChild(ul);
    var note = node('p', 'field__note',
      'Microsoft\u2019s course and this guide cover the same objective from different angles; use both. ' +
      (L.officialLabs ? 'Microsoft\u2019s labs deploy real resources too: apply this guide\u2019s Module 0 budget and teardown rules to them.' : 'Microsoft publishes no lab for this lesson\u2019s topics; this guide\u2019s lab covers them.'));
    host.appendChild(note);
  }

  function paintDistinctions(model, L) {
    var refs = current.refs;
    var list = refs.distList;
    list.textContent = '';
    var items = model.distinctions.filter(function (x) { return L.distinctionNs.indexOf(x.n) !== -1; });
    if (!items.length) {
      refs.distHost.hidden = true;
      return;
    }
    refs.distHost.hidden = false;
    if (refs.dist.dataset.pending) {
      delete refs.dist.dataset.pending;
      var li = refs.rail.querySelector('li[data-stage="learn"]');
      if (li && !refs.rail.querySelector('li[data-stage="distinguish"]')) {
        var nli = node('li'); nli.dataset.stage = 'distinguish';
        nli.appendChild(link('Distinguish', '#stage-distinguish'));
        li.parentNode.insertBefore(nli, li.nextSibling);
      }
    }
    var parse = global.marked ? (global.marked.parse || global.marked) : null;
    items.forEach(function (x) { list.appendChild(comparison(x, model, L, parse)); });
  }

  /* The comparison component. Input is one A6 section: a table whose first
     column names the options, facts, and a "> **The trap.**" blockquote.
     The trap stays visible - it is the point - and the full comparison opens
     on demand. On narrow screens the table becomes one card per option. */
  function comparison(x, model, L, parse) {
    var art = node('article', 'cmp');
    var h = node('h3', 'cmp__title', x.title);
    art.appendChild(h);

    var others = x.modules.filter(function (id) { return id !== L.id && model.lessons[id]; });
    if (others.length) {
      var also = node('p', 'cmp__also');
      also.appendChild(document.createTextNode('Also in '));
      others.forEach(function (id, i) {
        if (i) also.appendChild(document.createTextNode(', '));
        var a = link(id, '#/module/' + id);
        a.title = model.lessons[id].title;
        also.appendChild(a);
        D().paint(a, model.lessons[id].domainId);
        a.className = 'dom-link';
      });
      art.appendChild(also);
    }

    if (!parse) { art.appendChild(node('p', null, 'Open appendix A6 to read this comparison.')); return art; }

    var tmp = node('div');
    tmp.innerHTML = parse(x.markdown, { mangle: false, headerIds: false });
    /* Drop the "**Modules ...**" line; it is shown as links above. */
    var first = tmp.querySelector('p');
    if (first && /^\s*Modules?\s/.test(first.textContent)) first.remove();

    var trap = null;
    tmp.querySelectorAll('blockquote').forEach(function (q) {
      if (!trap && /^\s*The trap/i.test(q.textContent)) trap = q;
    });
    if (trap) {
      trap.dataset.callout = 'trap';
      trap.classList.add('cmp__trap');
      art.appendChild(trap);
    }

    var more = node('details', 'cmp__more');
    more.appendChild(node('summary', null, 'Compare the options side by side'));
    var body = node('div', 'cmp__body');
    while (tmp.firstChild) body.appendChild(tmp.firstChild);
    more.appendChild(body);
    art.appendChild(more);

    if (global.SC500App && global.SC500App.enhance) global.SC500App.enhance(body, model.a6Path);

    if (model.a6Index >= 0) {
      art.appendChild(link('Open in appendix A6 \u2192', '#/appendix/a6', 'cmp__src'));
    }
    return art;
  }

  function labTime(md) {
    var m = /^\*\*Time:\*\*\s*(.+)$/m.exec(md || '');
    if (!m) return null;
    var t = m[1].replace(/\*\*/g, '').trim();
    var dot = t.indexOf('. ');
    return dot > 0 ? t.slice(0, dot) : t.replace(/\.$/, '');
  }

  function paintLabCard(model, L) {
    var card = current.refs.labCard;
    card.textContent = '';
    D().paint(card, L.domainId);
    if (!L.hasLab) {
      card.dataset.lab = 'none';
      card.appendChild(node('p', 'lab-card__title', 'No lab for this lesson'));
      card.appendChild(node('p', null,
        'There is nothing to deploy for this lesson, so it is left out of your lab totals rather than counted against you.'));
      return;
    }
    card.dataset.lab = 'available';
    var practised = P().isComplete('lab', L.id);
    var stats = P().pageStats({ kind: 'lab', moduleId: L.id });

    var t = node('p', 'lab-card__title');
    t.appendChild(node('span', 'lab-card__eyebrow', 'Lab ' + L.id));
    t.appendChild(document.createTextNode(L.title));
    card.appendChild(t);

    var meta = node('ul', 'facts');
    var FM = global.SC500FrontMatter;
    if (L.fm.lab_cost_estimate && FM) {
      var li = node('li');
      var chip = node('span', 'cost', FM.costLabel(L.fm.lab_cost_estimate));
      chip.dataset.level = FM.costLevel(L.fm.lab_cost_estimate);
      li.appendChild(document.createTextNode('Cost '));
      li.appendChild(chip);
      meta.appendChild(li);
    }
    var timeLi = node('li', null, '');
    timeLi.hidden = true;
    meta.appendChild(timeLi);
    meta.appendChild(node('li', null, practised ? 'Complete, teardown included' :
      (stats.total ? stats.done + ' of ' + stats.total + ' checklist items ticked' : 'Not started')));
    card.appendChild(meta);

    if (L.fm.lab_cost_estimate) card.appendChild(node('p', 'field__note', String(L.fm.lab_cost_estimate)));
    card.appendChild(node('p', 'lab-card__safety',
      'Creates real resources in your test tenant. Module 0 first; activate roles through PIM; every lab ends in a mandatory teardown.'));
    card.appendChild(link(practised ? 'Review the lab' : 'Open the lab', '#/lab/' + L.id, 'btn btn--primary'));

    fetch(L.lab, { cache: 'force-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (md) {
      var tm = labTime(md);
      if (tm) { timeLi.textContent = 'Time ' + tm; timeLi.hidden = false; }
    }).catch(function () {});
  }

  function paintNext(model, L) {
    var nav = current.refs.next;
    nav.textContent = '';
    nav.appendChild(node('h2', null, 'Next step'));

    var row = node('div', 'next-step__row');
    function card(label, id, cls) {
      var l = model.lessons[id];
      if (!l) return;
      var a = link('', '#/module/' + id, 'next-card ' + (cls || ''));
      D().paint(a, l.domainId);
      a.appendChild(node('span', 'next-card__label', label));
      a.appendChild(node('span', 'next-card__title', l.id + ' \u00b7 ' + l.title));
      row.appendChild(a);
    }
    if (L.prev) card('\u2190 Previous', L.prev, 'next-card--prev');
    /* Recommended next: the next lesson in study order that is not studied
       yet, starting after this one; the plain next lesson if all are. */
    var rec = null;
    for (var i = model.order.indexOf(L.id) + 1; i < model.order.length; i++) {
      if (!P().isComplete('module', model.order[i])) { rec = model.order[i]; break; }
    }
    card('Recommended next \u2192', rec || L.next, 'next-card--rec');
    nav.appendChild(row);

    /* Related: shares an objective, shares a distinction, or is a prerequisite. */
    var related = [];
    function add(id, why) {
      if (id === L.id || !model.lessons[id] || id === rec) return;
      for (var r = 0; r < related.length; r++) if (related[r].id === id) return;
      related.push({ id: id, why: why });
    }
    if (L.objectiveId) model.objectiveById[L.objectiveId].lessonIds.forEach(function (id) { add(id, 'same objective'); });
    model.distinctions.forEach(function (x) {
      if (x.modules.indexOf(L.id) !== -1) x.modules.forEach(function (id) { add(id, 'compared in A6'); });
    });
    L.prerequisites.forEach(function (id) { add(id, 'prerequisite'); });

    if (related.length) {
      nav.appendChild(node('h3', null, 'Related'));
      var ul = node('ul', 'related');
      related.forEach(function (r) {
        var l = model.lessons[r.id];
        var li = node('li');
        var a = link(l.id + ' \u00b7 ' + l.title, '#/module/' + l.id, 'dom-link');
        D().paint(a, l.domainId);
        li.appendChild(a);
        li.appendChild(node('span', 'related__why', r.why));
        ul.appendChild(li);
      });
      nav.appendChild(ul);
    }

    if (L.exam) {
      var dr = link('Domain review: ' + D().info(L.domainId).short + ' \u2192', '#/domain/' + L.domainId, 'btn');
      nav.appendChild(dr);
    }
  }

  /* Called by quiz.js after answers, and by progress changes. */
  function refresh() {
    if (!current || !C() || !C().get()) return;
    var model = C().get();
    var L = model.lessons[current.route.moduleId];
    if (!L) return;
    paintStates(model, L);
    paintOutcomes(model, L);
    paintNext(model, L);
    var lc = current.refs.labCard;
    if (lc && lc.dataset.lab) paintLabCard(model, L);
  }

  /* ------------------------------------------------------------ lab mode */

  function mountLab(root, route, fm) {
    var h1 = root.querySelector('h1');
    if (!h1) return false;

    var banner = node('header', 'lab-head');
    root.insertBefore(banner, h1);
    var eyebrow = node('p', 'lab-head__mode');
    eyebrow.appendChild(node('span', 'lab-head__pill', 'LAB MODE'));
    eyebrow.appendChild(document.createTextNode(' Hands-on in your test tenant. Real resources, real cost, mandatory teardown.'));
    banner.appendChild(eyebrow);
    banner.appendChild(h1);

    var facts = node('ul', 'facts');
    banner.appendChild(facts);

    /* Parts: the lab's own "## Part N" headings, plus the fixed sections. */
    var heads = Array.prototype.slice.call(root.querySelectorAll('h2'));
    var parts = heads.filter(function (h) { return /^part\s+\d/i.test(key(h)); });
    var hasTeardown = heads.some(function (h) { return key(h) === 'teardown'; });

    var FM = global.SC500FrontMatter;
    if (fm && fm.lab_cost_estimate && FM) {
      var li = node('li');
      var chip = node('span', 'cost', FM.costLabel(fm.lab_cost_estimate));
      chip.dataset.level = FM.costLevel(fm.lab_cost_estimate);
      li.appendChild(document.createTextNode('Cost '));
      li.appendChild(chip);
      facts.appendChild(li);
    }
    var body = root.textContent;
    var tm = /Time:\s*([^\n.]+)/.exec(body);
    if (tm) facts.appendChild(node('li', null, 'Time ' + tm[1].trim()));
    if (parts.length) facts.appendChild(node('li', null, parts.length + ' parts'));
    facts.appendChild(node('li', 'facts__warn', hasTeardown ? 'Teardown required' : 'No teardown section found'));
    if (fm && fm.licensing) {
      var lic = node('p', 'lab-head__res');
      lic.appendChild(node('strong', null, 'Licensing: '));
      lic.appendChild(document.createTextNode(String(fm.licensing)));
      banner.appendChild(lic);
    }

    if (fm && Array.isArray(fm.azure_resources) && fm.azure_resources.length) {
      var res = node('p', 'lab-head__res');
      res.appendChild(node('strong', null, 'Creates: '));
      fm.azure_resources.forEach(function (r, i) {
        if (i) res.appendChild(document.createTextNode(' '));
        res.appendChild(node('code', null, r));
      });
      banner.appendChild(res);
    }

    /* Part tracker: "Part 3 of 7", with a resume link. */
    if (parts.length) {
      var tracker = node('nav', 'lab-track');
      tracker.setAttribute('aria-label', 'Lab parts');
      var where = node('p', 'lab-track__where');
      where.setAttribute('aria-live', 'polite');
      tracker.appendChild(where);
      var bar = node('div', 'lab-track__bar');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Position in the lab');
      bar.setAttribute('aria-valuemin', '1');
      bar.setAttribute('aria-valuemax', String(parts.length));
      var fill = node('span', 'lab-track__fill');
      bar.appendChild(fill);
      tracker.appendChild(bar);
      var ol = node('ol', 'lab-track__parts');
      parts.forEach(function (p, i) {
        if (!p.id) p.id = 'part-' + (i + 1);
        var li = node('li');
        li.appendChild(link(String(i + 1), '#' + p.id));
        li.firstChild.title = p.textContent.replace(/§$/, '').trim();
        li.firstChild.setAttribute('aria-label', p.textContent.replace(/§$/, '').trim());
        ol.appendChild(li);
      });
      tracker.appendChild(ol);
      banner.appendChild(tracker);

      ol.addEventListener('click', function (e) {
        var a = e.target.closest('a'); if (!a) return;
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      var saved = 0;
      try { saved = (JSON.parse(localStorage.getItem(LABPOS_KEY) || '{}')[route.moduleId]) || 0; } catch (e) {}
      function show(i) {
        where.textContent = 'Part ' + (i + 1) + ' of ' + parts.length + ' \u00b7 ' + parts[i].textContent.replace(/^part\s+\d+\s*[-\u2013\u2014:]\s*/i, '').replace(/§$/, '').trim();
        fill.style.width = Math.round(((i + 1) / parts.length) * 100) + '%';
        bar.setAttribute('aria-valuenow', String(i + 1));
        ol.querySelectorAll('li').forEach(function (li, k) { li.dataset.at = k === i ? 'true' : (k < i ? 'past' : 'false'); });
      }
      show(Math.min(saved, parts.length - 1));
      if (saved > 0 && saved < parts.length) {
        var resume = node('button', 'btn', 'Resume at Part ' + (saved + 1));
        resume.type = 'button';
        resume.addEventListener('click', function () { parts[saved].scrollIntoView({ block: 'start' }); resume.remove(); });
        tracker.appendChild(resume);
      }
      if ('IntersectionObserver' in global) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var i = parts.indexOf(en.target);
            if (i < 0) return;
            show(i);
            try {
              var map = JSON.parse(localStorage.getItem(LABPOS_KEY) || '{}');
              map[route.moduleId] = i;
              localStorage.setItem(LABPOS_KEY, JSON.stringify(map));
            } catch (e2) {}
          });
        }, { rootMargin: '0px 0px -70% 0px' });
        parts.forEach(function (p) { io.observe(p); });
        global.addEventListener('hashchange', function stop() { io.disconnect(); global.removeEventListener('hashchange', stop); });
      }
    }

    /* Completion: say plainly what "practised" means. */
    var done = node('section', 'lab-complete');
    done.id = 'lab-completion';
    done.appendChild(node('h2', null, 'Completion'));
    done.appendChild(node('p', null,
      'This lab counts as practised when every checklist item on this page is ticked. The checklist includes the teardown, on purpose: a lab that is still billing is not finished.'));
    var back = node('div', 'field__links');
    back.appendChild(link('Back to lesson ' + route.moduleId, '#/module/' + route.moduleId, 'btn'));
    back.appendChild(link('Go to the knowledge check', '#/module/' + route.moduleId + '/check', 'btn'));
    done.appendChild(back);
    root.appendChild(done);

    if (C()) {
      C().load().then(function (model) {
        var L = model.lessons[route.moduleId];
        if (!L) return;
        D().paint(banner, L.domainId);
        D().paint(done, L.domainId);
        var top = node('div', 'lesson-head__top');
        top.appendChild(D().badge(L.domainId, { weight: L.weight }));
        if (L.objectiveId) {
          var o = model.objectiveById[L.objectiveId];
          top.appendChild(node('span', 'obj-chip', o.id));
          top.appendChild(node('span', 'lab-head__obj', o.text));
        }
        banner.insertBefore(top, eyebrow.nextSibling);
      }).catch(function () {});
    }
    return true;
  }

  /* For the domain review: render one A6 distinction outside a lesson. */
  function distinction(x, model) {
    var parse = global.marked ? (global.marked.parse || global.marked) : null;
    return comparison(x, model, { id: null }, parse);
  }

  global.SC500Lesson = {
    distinction: distinction,
    mountModule: mountModule,
    mountLab: mountLab,
    enrich: enrich,
    refresh: refresh
  };
})(window);
