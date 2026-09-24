/* practice.js - SC-500 guide
   Three derived views that the module-local knowledge checks cannot provide.

     #/exam     a weighted, timed mock exam sampled across every quiz file
     #/cards    flashcards over the distinctions the exam tests, Leitner-boxed
     #/review   what has decayed, and what to re-test, per module

   Why this exists: a reader can score full marks on 22 module quizzes without
   once being asked to choose between controls taught in different files, which
   is most of what the exam does. The mock exam mixes the pool, so a question
   from 02-04 arrives next to one from 04-01 with no heading to prime you.

   No new data is required. The pool is quizzes/<module-id>.json, which already
   exist, and the domain weighting comes from content/manifest.json. Options are
   shuffled unless a question sets "fixed_options": true, so an explanation that
   refers to an option by position can opt out.

   Loads after views.js and before app.js; registers three views and does not
   touch anything else. */

(function (global) {
  'use strict';

  var EXAM_KEY = 'sc500:exam:v1';
  var CARD_KEY = 'sc500:cards:v1';
  var RETEST_DAYS = 21;
  var BOX_DAYS = [1, 3, 7, 16, 35];
  var DAY = 86400000;

  var pool = null, poolJob = null;
  var deck = null, deckJob = null;
  var exam = null;

  /* ---------------------------------------------------------------- utils */

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function btn(label, variant) {
    var b = node('button', 'btn', label);
    b.type = 'button';
    if (variant) b.dataset.variant = variant;
    return b;
  }

  function link(label, href, cls) {
    var a = node('a', cls || 'btn', label);
    a.href = href;
    return a;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* "25-30%" -> 27.5, "20-25%" -> 22.5, "n/a" -> 0. Module 0 carries n/a and is
     excluded from the exam, which is correct: lab safety is not exam content. */
  function weightMid(w) {
    var s = String(w || '');
    var range = s.match(/(\d+)\s*[-\u2013\u2014]\s*(\d+)/);
    if (range) return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
    var one = s.match(/(\d+)/);
    return one ? parseInt(one[1], 10) : 0;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    return a.slice().sort().join('|') === b.slice().sort().join('|');
  }

  function emptyBox(host, title, detail) {
    var box = node('div', 'empty');
    box.appendChild(node('strong', null, title));
    box.appendChild(document.createTextNode(' ' + detail));
    host.appendChild(box);
  }

  /* ----------------------------------------------------------- the pool --- */

  function loadPool(manifest) {
    if (pool) return Promise.resolve(pool);
    if (poolJob) return poolJob;

    var items = [];
    var jobs = [];

    manifest.domains.forEach(function (d) {
      var mid = weightMid(d.weight);
      if (!mid) return;
      d.modules.forEach(function (m) {
        jobs.push(fetch('quizzes/' + m.id + '.json', { cache: 'force-cache' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (q) {
            if (!q || !Array.isArray(q.questions)) return;
            q.questions.forEach(function (item) {
              if (!item || !item.prompt || !Array.isArray(item.options)) return;
              items.push({
                q: item,
                moduleId: m.id,
                moduleTitle: m.title,
                domainId: d.id,
                domainName: d.name,
                weight: d.weight,
                mid: mid
              });
            });
          })
          .catch(function () { /* a module with no quiz is not an error */ }));
      });
    });

    poolJob = Promise.all(jobs).then(function () {
      pool = items;
      poolJob = null;
      return pool;
    });
    return poolJob;
  }

  /* Sample n questions across domains in proportion to the official weights,
     not in proportion to how many questions each module happens to have. */
  function sample(items, n) {
    var byDomain = {}, order = [], mids = {}, total = 0;

    items.forEach(function (e) {
      if (!byDomain[e.domainId]) {
        byDomain[e.domainId] = [];
        order.push(e.domainId);
        mids[e.domainId] = e.mid;
        total += e.mid;
      }
      byDomain[e.domainId].push(e);
    });

    var counts = {}, sum = 0;
    order.forEach(function (d) {
      counts[d] = Math.round(n * (mids[d] / total));
      sum += counts[d];
    });

    /* Rounding rarely lands on n exactly. Walk the domains until it does. */
    var guard = 0;
    while (sum !== n && order.length && guard < 1000) {
      var d = order[guard % order.length];
      if (sum < n) { counts[d]++; sum++; }
      else if (counts[d] > 0) { counts[d]--; sum--; }
      guard++;
    }

    var picked = [], spare = [];
    order.forEach(function (d) {
      var bag = shuffle(byDomain[d].slice());
      picked = picked.concat(bag.slice(0, counts[d]));
      spare = spare.concat(bag.slice(counts[d]));
    });

    /* A domain short of its quota borrows from the rest rather than short-changing
       the attempt. */
    if (picked.length < n) picked = picked.concat(shuffle(spare).slice(0, n - picked.length));

    return shuffle(picked);
  }

  function prepare(entry) {
    var q = entry.q;
    var order = [];
    for (var i = 0; i < q.options.length; i++) order.push(i);
    if (!q.fixed_options) shuffle(order);

    var answers = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(function (a) {
      return order.indexOf(a);
    });

    return {
      id: q.id || '',
      prompt: q.prompt,
      subSkill: q.sub_skill || '',
      explanation: q.explanation || '',
      options: order.map(function (i) { return q.options[i]; }),
      answers: answers,
      multi: answers.length > 1,
      moduleId: entry.moduleId,
      moduleTitle: entry.moduleTitle,
      domainId: entry.domainId,
      domainName: entry.domainName,
      weight: entry.weight,
      chosen: [],
      marked: false
    };
  }

  /* ------------------------------------------------------------ the clock - */

  function paintClock() {
    if (!exam || !exam.clockEl) return;
    var left = Math.max(0, exam.endsAt - Date.now());
    var m = Math.floor(left / 60000);
    var s = Math.floor((left % 60000) / 1000);
    exam.clockEl.textContent = m + ':' + (s < 10 ? '0' : '') + s + ' left';
    exam.clockEl.dataset.low = left < 300000 ? 'true' : 'false';
  }

  function stopClock() {
    if (exam && exam.timer) { clearInterval(exam.timer); exam.timer = null; }
  }

  /* --------------------------------------------------------- exam screens - */

  function mountExam(root, manifest) {
    clear(root);
    root.appendChild(node('h1', null, 'Mock exam'));
    var host = node('div', 'pr');
    root.appendChild(host);
    host.appendChild(node('p', 'loading', 'Loading the question pool\u2026'));

    loadPool(manifest).then(function (items) {
      clear(host);
      if (!items.length) {
        return emptyBox(host, 'No questions found.',
          'The exam samples quizzes/<module-id>.json for every module in the manifest. If you opened this from the file system, serve it instead: python -m http.server 8080');
      }
      if (exam && !exam.done) questionScreen(host);
      else startScreen(host, items);
    });
  }

  function startScreen(host, items) {
    clear(host);
    exam = null;

    var intro = node('div', 'field');
    intro.appendChild(node('h2', 'field__title', 'Before you start'));
    var ul = node('ul', 'pr__list');
    [
      'Questions are sampled across every module and weighted to the official domain percentages, so the mix matches the exam rather than the repository.',
      'Options are shuffled unless a question opts out, so a retake tests reasoning rather than a layout you remember.',
      'The clock runs at about two and a half minutes a question, capped at the exam\u2019s 120 minutes, and submits automatically at zero.',
      'Mark questions for review and come back to them, as you can in the real interface.',
      'Leaving this page ends the attempt. Nothing is recorded until you submit.'
    ].forEach(function (t) { ul.appendChild(node('li', null, t)); });
    intro.appendChild(ul);
    host.appendChild(intro);

    var counts = {}, order = [];
    items.forEach(function (e) {
      if (!counts[e.domainId]) { counts[e.domainId] = { n: 0, name: e.domainName, weight: e.weight }; order.push(e.domainId); }
      counts[e.domainId].n++;
    });

    var tbl = node('table', 'pr__table');
    var thead = node('thead');
    var hr = node('tr');
    ['Domain', 'Weight', 'Questions available'].forEach(function (h) { hr.appendChild(node('th', null, h)); });
    thead.appendChild(hr);
    tbl.appendChild(thead);
    var tb = node('tbody');
    order.forEach(function (d) {
      var tr = node('tr');
      tr.appendChild(node('td', null, d + ' \u00b7 ' + counts[d].name));
      tr.appendChild(node('td', null, counts[d].weight));
      tr.appendChild(node('td', null, String(counts[d].n)));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    host.appendChild(tbl);

    var pick = node('div', 'field__links');
    var lengths = [20, 40, 60].filter(function (n) { return n <= items.length; });
    if (!lengths.length) lengths = [items.length];

    lengths.forEach(function (n) {
      var b = btn(n + ' questions');
      b.addEventListener('click', function () { startExam(host, items, n); });
      pick.appendChild(b);
    });
    host.appendChild(pick);

    if (items.length < 40) {
      host.appendChild(node('p', 'field__note',
        'Only ' + items.length + ' questions exist in the pool, so a full-length attempt will repeat. Add questions before treating a score as meaningful.'));
    }

    history(host);
  }

  function history(host) {
    var h = readJson(EXAM_KEY, { v: 1, attempts: [] });
    if (!h.attempts || !h.attempts.length) return;

    var wrap = node('div', 'field');
    wrap.appendChild(node('h2', 'field__title', 'Previous attempts'));

    var tbl = node('table', 'pr__table');
    var thead = node('thead'), hr = node('tr');
    ['Date', 'Length', 'Score', 'Weakest domain'].forEach(function (t) { hr.appendChild(node('th', null, t)); });
    thead.appendChild(hr); tbl.appendChild(thead);

    var tb = node('tbody');
    h.attempts.slice(-8).reverse().forEach(function (a) {
      var tr = node('tr');
      tr.appendChild(node('td', null, String(a.at).slice(0, 10)));
      tr.appendChild(node('td', null, a.total + ' q'));
      tr.appendChild(node('td', null, a.pct + '%'));
      tr.appendChild(node('td', null, a.weakest || '\u2014'));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    wrap.appendChild(tbl);

    var wipe = btn('Clear exam history', 'danger');
    var armed = false;
    wipe.addEventListener('click', function () {
      if (!armed) { armed = true; wipe.textContent = 'Click again to erase'; return; }
      writeJson(EXAM_KEY, { v: 1, attempts: [] });
      wipe.textContent = 'Cleared';
      wipe.disabled = true;
    });
    var row = node('div', 'field__links');
    row.appendChild(wipe);
    wrap.appendChild(row);

    host.appendChild(wrap);
  }

  function startExam(host, items, n) {
    var minutes = Math.min(120, Math.max(15, Math.round(n * 2.5)));
    exam = {
      qs: sample(items, n).map(prepare),
      idx: 0,
      minutes: minutes,
      startedAt: Date.now(),
      endsAt: Date.now() + minutes * 60000,
      done: false,
      host: host,
      clockEl: null,
      timer: null
    };
    exam.timer = setInterval(function () {
      paintClock();
      if (exam && !exam.done && Date.now() >= exam.endsAt) submit(exam.host);
    }, 1000);
    questionScreen(host);
  }

  function questionScreen(host) {
    if (!exam) return;
    exam.host = host;
    clear(host);

    var q = exam.qs[exam.idx];

    var bar = node('div', 'pr__bar');
    bar.appendChild(node('span', 'pr__pos', 'Question ' + (exam.idx + 1) + ' of ' + exam.qs.length));
    exam.clockEl = node('span', 'pr__clock', '');
    bar.appendChild(exam.clockEl);
    host.appendChild(bar);
    paintClock();

    var track = node('div', 'bar');
    var fill = node('span', 'bar__fill');
    fill.style.width = pct(exam.idx, exam.qs.length) + '%';
    track.appendChild(fill);
    host.appendChild(track);

    var card = node('section', 'pr__q');
    if (q.marked) card.dataset.marked = 'true';
    card.appendChild(node('p', 'pr__meta', q.domainName));
    card.appendChild(node('p', 'pr__prompt', q.prompt));
    if (q.multi) card.appendChild(node('p', 'field__note', 'Select all that apply.'));

    var list = node('ul', 'pr__opts');
    q.options.forEach(function (opt, oi) {
      var li = document.createElement('li');
      var id = 'x' + exam.idx + 'o' + oi;

      var input = document.createElement('input');
      input.type = q.multi ? 'checkbox' : 'radio';
      input.name = 'x' + exam.idx;
      input.id = id;
      input.value = String(oi);
      input.checked = q.chosen.indexOf(oi) !== -1;
      input.addEventListener('change', function () {
        if (q.multi) {
          var at = q.chosen.indexOf(oi);
          if (input.checked && at === -1) q.chosen.push(oi);
          else if (!input.checked && at !== -1) q.chosen.splice(at, 1);
        } else {
          q.chosen = [oi];
        }
      });

      var label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = ' ' + opt;

      li.appendChild(input);
      li.appendChild(label);
      list.appendChild(li);
    });
    card.appendChild(list);
    host.appendChild(card);

    var actions = node('div', 'field__links');

    var prev = btn('Previous');
    prev.disabled = exam.idx === 0;
    prev.addEventListener('click', function () { exam.idx--; questionScreen(host); });

    var next = btn('Next');
    next.disabled = exam.idx >= exam.qs.length - 1;
    next.addEventListener('click', function () { exam.idx++; questionScreen(host); });

    var mark = btn(q.marked ? 'Unmark' : 'Mark for review');
    mark.addEventListener('click', function () { q.marked = !q.marked; questionScreen(host); });

    var rev = btn('Review and submit');
    rev.addEventListener('click', function () { reviewScreen(host); });

    [prev, next, mark, rev].forEach(function (b) { actions.appendChild(b); });
    host.appendChild(actions);
  }

  function reviewScreen(host) {
    if (!exam) return;
    clear(host);

    var bar = node('div', 'pr__bar');
    bar.appendChild(node('span', 'pr__pos', 'Review'));
    exam.clockEl = node('span', 'pr__clock', '');
    bar.appendChild(exam.clockEl);
    host.appendChild(bar);
    paintClock();

    var unanswered = 0, marked = 0;
    var grid = node('div', 'pr__grid');
    exam.qs.forEach(function (q, i) {
      var b = btn(String(i + 1));
      b.className = 'pr__cell';
      var state = q.chosen.length ? 'answered' : 'blank';
      if (q.marked) { state = 'marked'; marked++; }
      if (!q.chosen.length) unanswered++;
      b.dataset.state = state;
      b.title = q.domainName + (q.chosen.length ? ' \u00b7 answered' : ' \u00b7 not answered') + (q.marked ? ' \u00b7 marked' : '');
      b.addEventListener('click', function () { exam.idx = i; questionScreen(host); });
      grid.appendChild(b);
    });
    host.appendChild(grid);

    host.appendChild(node('p', 'field__note',
      unanswered + ' unanswered, ' + marked + ' marked for review. Unanswered questions score zero, exactly as they would on the day.'));

    var actions = node('div', 'field__links');
    var back = btn('Back to questions');
    back.addEventListener('click', function () { questionScreen(host); });

    var send = btn('Submit', 'danger');
    var armed = false;
    send.addEventListener('click', function () {
      if (unanswered && !armed) { armed = true; send.textContent = 'Submit with ' + unanswered + ' blank'; return; }
      submit(host);
    });

    actions.appendChild(back);
    actions.appendChild(send);
    host.appendChild(actions);
  }

  function submit(host) {
    if (!exam || exam.done) return;
    exam.done = true;
    stopClock();

    var byDomain = {}, order = [], correct = 0, missed = [];

    exam.qs.forEach(function (q) {
      if (!byDomain[q.domainId]) {
        byDomain[q.domainId] = { name: q.domainName, weight: q.weight, c: 0, t: 0 };
        order.push(q.domainId);
      }
      byDomain[q.domainId].t++;
      /* Feed every answered mock-exam question into the per-question record,
         so Exam prep's "answered incorrectly" and the dashboard's knowledge-
         checked counts include mock-exam work. Unanswered ones are skipped. */
      if (q.chosen && q.chosen.length && global.SC500Progress && global.SC500Progress.recordAnswer && q.id) {
        global.SC500Progress.recordAnswer(q.id, sameSet(q.chosen, q.answers), { lesson: q.moduleId || null, src: 'mock-exam' });
      }
      if (sameSet(q.chosen, q.answers)) {
        correct++;
        byDomain[q.domainId].c++;
      } else {
        missed.push(q);
      }
    });

    var overall = pct(correct, exam.qs.length);

    var weakest = null, weakestPct = 101;
    order.forEach(function (d) {
      var p = pct(byDomain[d].c, byDomain[d].t);
      if (p < weakestPct) { weakestPct = p; weakest = byDomain[d].name; }
    });

    var h = readJson(EXAM_KEY, { v: 1, attempts: [] });
    if (!Array.isArray(h.attempts)) h.attempts = [];
    h.attempts.push({
      at: new Date().toISOString(),
      total: exam.qs.length,
      correct: correct,
      pct: overall,
      minutes: exam.minutes,
      weakest: weakest
    });
    if (h.attempts.length > 50) h.attempts = h.attempts.slice(-50);
    writeJson(EXAM_KEY, h);

    resultsScreen(host, { correct: correct, overall: overall, byDomain: byDomain, order: order, missed: missed });
  }

  function resultsScreen(host, r) {
    clear(host);

    var head = node('div', 'field');
    head.appendChild(node('h2', 'field__title',
      r.correct + ' of ' + exam.qs.length + ' correct \u00b7 ' + r.overall + '%'));
    head.appendChild(node('p', 'field__note',
      'This is a raw percentage. The exam is scaled, a pass is 700 of 1000, and questions are not worth equal marks \u2014 so do not read this as a predicted score. Read it as which domains held up.'));
    host.appendChild(head);

    var tbl = node('table', 'pr__table');
    var thead = node('thead'), hr = node('tr');
    ['Domain', 'Weight', 'Correct', 'Score'].forEach(function (t) { hr.appendChild(node('th', null, t)); });
    thead.appendChild(hr); tbl.appendChild(thead);

    var tb = node('tbody');
    r.order.forEach(function (d) {
      var row = r.byDomain[d];
      var p = pct(row.c, row.t);
      var tr = node('tr');
      tr.dataset.weak = p < 70 ? 'true' : 'false';
      tr.appendChild(node('td', null, d + ' \u00b7 ' + row.name));
      tr.appendChild(node('td', null, row.weight));
      tr.appendChild(node('td', null, row.c + ' / ' + row.t));
      tr.appendChild(node('td', null, p + '%'));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    host.appendChild(tbl);

    if (r.missed.length) {
      var miss = node('div', 'field');
      miss.appendChild(node('h2', 'field__title', 'What to re-read'));
      miss.appendChild(node('p', 'field__note',
        'Each line names the sub-objective the question tested, not the question. That is what you go back to.'));

      var ul = node('ul', 'pr__list');
      r.missed.forEach(function (q) {
        var li = document.createElement('li');
        li.appendChild(document.createTextNode(q.subSkill || q.prompt.slice(0, 80)));
        li.appendChild(document.createTextNode(' \u2014 '));
        li.appendChild(link(q.moduleId, '#/module/' + q.moduleId, 'pr__ref'));
        var why = node('details', 'depth');
        why.appendChild(node('summary', null, 'Why'));
        var body = node('div');
        body.appendChild(node('p', null, q.prompt));
        body.appendChild(node('p', null, 'Correct: ' + q.answers.map(function (i) { return q.options[i]; }).join('; ')));
        if (q.explanation) body.appendChild(node('p', null, q.explanation));
        why.appendChild(body);
        li.appendChild(why);
        ul.appendChild(li);
      });
      miss.appendChild(ul);
      host.appendChild(miss);
    }

    var actions = node('div', 'field__links');
    var again = btn('New attempt');
    again.addEventListener('click', function () {
      exam = null;
      loadPool(global.SC500App.getManifest()).then(function (items) { startScreen(host, items); });
    });
    actions.appendChild(again);
    actions.appendChild(link('What to study next', '#/review'));
    actions.appendChild(link('Dashboard', '#/'));
    host.appendChild(actions);
  }

  /* ------------------------------------------------------------ flashcards */

  function loadDeck() {
    if (deck) return Promise.resolve(deck);
    if (deckJob) return deckJob;
    deckJob = fetch('flashcards/deck.json', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { deck = (j && Array.isArray(j.cards)) ? j.cards : []; deckJob = null; return deck; })
      .catch(function () { deck = []; deckJob = null; return deck; });
    return deckJob;
  }

  function cardState() { return readJson(CARD_KEY, { v: 1, cards: {} }); }

  function dueCards(cards, filter) {
    var st = cardState(), now = Date.now();
    return cards.filter(function (c) {
      if (filter && filter !== 'all' && c.domain !== filter) return false;
      var s = st.cards[c.id];
      return !s || !s.due || s.due <= now;
    });
  }

  function gradeCard(id, knew) {
    var st = cardState();
    var s = st.cards[id] || { box: 0 };
    s.box = knew ? Math.min(BOX_DAYS.length - 1, (s.box || 0) + 1) : 0;
    s.due = Date.now() + BOX_DAYS[s.box] * DAY;
    s.at = new Date().toISOString();
    st.cards[id] = s;
    writeJson(CARD_KEY, st);
  }

  function mountCards(root) {
    clear(root);
    root.appendChild(node('h1', null, 'Flashcards'));
    var host = node('div', 'pr');
    root.appendChild(host);
    host.appendChild(node('p', 'loading', 'Loading the deck\u2026'));

    loadDeck().then(function (cards) {
      clear(host);
      if (!cards.length) {
        return emptyBox(host, 'No deck found.',
          'Expected flashcards/deck.json. Serve the site rather than opening it from the file system.');
      }
      deckScreen(host, cards, 'all');
    });
  }

  function deckScreen(host, cards, filter) {
    clear(host);

    var intro = node('div', 'field');
    intro.appendChild(node('h2', 'field__title', 'How this works'));
    intro.appendChild(node('p', 'field__note',
      'A card you knew moves up a box and comes back later - after 1, 3, 7, 16 then 35 days. A card you missed goes back to the first box and returns tomorrow. Progress is stored in this browser only and is separate from module progress.'));
    host.appendChild(intro);

    var domains = ['all'];
    cards.forEach(function (c) { if (c.domain && domains.indexOf(c.domain) === -1) domains.push(c.domain); });

    var row = node('div', 'field__links');
    domains.forEach(function (d) {
      var b = btn(d === 'all' ? 'All domains' : 'Domain ' + d);
      b.dataset.variant = d === filter ? 'on' : '';
      b.addEventListener('click', function () { deckScreen(host, cards, d); });
      row.appendChild(b);
    });
    host.appendChild(row);

    var due = dueCards(cards, filter);
    var scope = filter === 'all' ? cards : cards.filter(function (c) { return c.domain === filter; });

    host.appendChild(node('p', 'pr__count', due.length + ' of ' + scope.length + ' due'));

    if (!due.length) {
      emptyBox(host, 'Nothing due.', 'Come back when a box expires, or switch domain.');
      return;
    }

    var start = btn('Review ' + due.length);
    start.addEventListener('click', function () { cardScreen(host, cards, filter, shuffle(due.slice()), 0, { knew: 0, missed: 0 }); });
    var row2 = node('div', 'field__links');
    row2.appendChild(start);
    host.appendChild(row2);
  }

  function cardScreen(host, cards, filter, queue, i, tally) {
    clear(host);

    if (i >= queue.length) {
      var done = node('div', 'field');
      done.appendChild(node('h2', 'field__title', 'Session complete'));
      done.appendChild(node('p', null, tally.knew + ' knew, ' + tally.missed + ' to revisit.'));
      host.appendChild(done);
      var back = btn('Back to the deck');
      back.addEventListener('click', function () { deckScreen(host, cards, filter); });
      var r = node('div', 'field__links');
      r.appendChild(back);
      host.appendChild(r);
      return;
    }

    var c = queue[i];

    var bar = node('div', 'pr__bar');
    bar.appendChild(node('span', 'pr__pos', (i + 1) + ' of ' + queue.length));
    bar.appendChild(node('span', 'pr__clock', c.domain ? 'Domain ' + c.domain : ''));
    host.appendChild(bar);

    var card = node('section', 'pr__card');
    card.appendChild(node('p', 'pr__front', c.front));

    var backP = node('p', 'pr__back', c.back);
    backP.hidden = true;
    card.appendChild(backP);
    host.appendChild(card);

    var actions = node('div', 'field__links');

    var show = btn('Show answer');
    show.addEventListener('click', function () {
      backP.hidden = false;
      show.hidden = true;
      knew.hidden = false;
      missed.hidden = false;
    });

    var knew = btn('Knew it');
    knew.hidden = true;
    knew.addEventListener('click', function () {
      gradeCard(c.id, true);
      tally.knew++;
      cardScreen(host, cards, filter, queue, i + 1, tally);
    });

    var missed = btn('Missed it', 'danger');
    missed.hidden = true;
    missed.addEventListener('click', function () {
      gradeCard(c.id, false);
      tally.missed++;
      cardScreen(host, cards, filter, queue, i + 1, tally);
    });

    actions.appendChild(show);
    actions.appendChild(knew);
    actions.appendChild(missed);
    host.appendChild(actions);

    if (c.module) {
      var refs = node('p', 'field__note');
      refs.appendChild(document.createTextNode('Taught in '));
      refs.appendChild(link(c.module, '#/module/' + c.module, 'pr__ref'));
      host.appendChild(refs);
    }
  }

  /* ------------------------------------------------------------- review --- */

  function moduleVerdict(id) {
    var P = global.SC500Progress;
    var q = (P && P.readQuiz) ? P.readQuiz({ kind: 'module', moduleId: id }) : null;

    if (!q || !q.at) return { rank: 0, label: 'Never tested', score: null };
    if (q.pct < 80) return { rank: 1, label: 'Re-test \u2014 scored ' + q.pct + '%', score: q.pct, at: q.at };

    var age = Math.floor((Date.now() - Date.parse(q.at)) / DAY);
    if (isNaN(age)) return { rank: 1, label: 'Re-test', score: q.pct };
    if (age >= RETEST_DAYS) return { rank: 2, label: 'Overdue by ' + (age - RETEST_DAYS) + ' d', score: q.pct, at: q.at, over: age - RETEST_DAYS };
    return { rank: 3, label: 'Due in ' + (RETEST_DAYS - age) + ' d', score: q.pct, at: q.at };
  }

  function mountReview(root, manifest) {
    clear(root);
    root.appendChild(node('h1', null, 'What to study next'));

    var host = node('div', 'pr');
    root.appendChild(host);

    var P = global.SC500Progress;
    if (!P || !P.readQuiz) {
      emptyBox(host, 'Progress tracking is unavailable.', 'assets/js/progress.js did not load, so there is nothing to compute decay from.');
      return;
    }

    host.appendChild(node('p', 'field__note',
      'A module counts as retained if its knowledge check scored 80% or better within the last ' + RETEST_DAYS + ' days. Anything older has decayed on paper, whatever it feels like. Ordering puts never-tested first, then overdue, then heaviest domain.'));

    var rows = [];
    manifest.domains.forEach(function (d) {
      var mid = weightMid(d.weight);
      if (!mid) return;
      d.modules.forEach(function (m) {
        var v = moduleVerdict(m.id);
        rows.push({
          id: m.id, title: m.title, domain: d.name, weight: d.weight, mid: mid,
          read: P.isComplete ? P.isComplete('module', m.id) : false,
          lab: (P.isComplete && m.lab) ? P.isComplete('lab', m.id) : false,
          v: v
        });
      });
    });

    rows.sort(function (a, b) {
      if (a.v.rank !== b.v.rank) return a.v.rank - b.v.rank;
      if (a.mid !== b.mid) return b.mid - a.mid;
      return a.id < b.id ? -1 : 1;
    });

    var dueNow = rows.filter(function (r) { return r.v.rank <= 2; }).length;

    var summary = node('div', 'field');
    summary.appendChild(node('h2', 'field__title', dueNow + ' of ' + rows.length + ' modules need attention'));
    var links = node('div', 'field__links');
    links.appendChild(link('Take a mock exam', '#/exam'));
    links.appendChild(link('Flashcards', '#/cards'));
    summary.appendChild(links);
    host.appendChild(summary);

    var tbl = node('table', 'pr__table');
    var thead = node('thead'), hr = node('tr');
    ['Module', 'Domain', 'Weight', 'Read', 'Lab', 'Status'].forEach(function (t) { hr.appendChild(node('th', null, t)); });
    thead.appendChild(hr); tbl.appendChild(thead);

    var tb = node('tbody');
    rows.forEach(function (r) {
      var tr = node('tr');
      tr.dataset.rank = String(r.v.rank);

      var td = node('td');
      td.appendChild(link(r.id, '#/module/' + r.id, 'pr__ref'));
      td.appendChild(document.createTextNode(' ' + r.title));
      tr.appendChild(td);

      tr.appendChild(node('td', null, r.domain));
      tr.appendChild(node('td', null, r.weight));
      tr.appendChild(node('td', null, r.read ? '\u2713' : '\u2014'));
      tr.appendChild(node('td', null, r.lab ? '\u2713' : '\u2014'));
      tr.appendChild(node('td', 'pr__status', r.v.label));

      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    host.appendChild(tbl);
  }

  /* --------------------------------------------------------------- wiring - */

  /* An attempt in progress must not keep ticking once the reader navigates
     away. app.js re-renders #content on hashchange; this drops the timer. */
  global.addEventListener('hashchange', function () {
    if (exam && exam.timer && location.hash.indexOf('#/exam') !== 0) {
      stopClock();
      exam = null;
    }
  });

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.exam = mountExam;
  global.SC500Views.cards = mountCards;
  global.SC500Views.review = mountReview;

  global.SC500Practice = { loadPool: loadPool, loadDeck: loadDeck };
})(window);
