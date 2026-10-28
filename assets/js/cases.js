/* cases.js - SC-500 guide
   The #/cases view: multi-requirement case scenarios.

   One organisation, its environment and a numbered list of requirements, then
   several questions about the same design. The requirements interact, so a
   choice that satisfies one can quietly break another. After answering, the
   learner reviews the whole design: conflict rules in content/cases.json
   check the combination of answers, not each answer alone.

   Answers are recorded per question as case:<case>:<question> with src
   'case', so a correct one counts as applied (progress.js). Scenarios are
   written for this Academy; they are not exam questions. */

(function (global) {
  'use strict';

  var P = function () { return global.SC500Progress; };
  var D = function () { return global.SC500Domains; };
  var data = null, job = null, seq = 0;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(text, href, cls) { var a = node('a', cls || null, text); a.href = href; return a; }

  function load() {
    if (data) return Promise.resolve(data);
    if (job) return job;
    job = fetch('content/cases.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' for content/cases.json'); return r.json(); })
      .then(function (j) { data = j; job = null; return j; });
    return job;
  }

  function key(c, q) { return 'case:' + c.id + ':' + q.id; }

  function caseScore(c) {
    var answered = 0, right = 0;
    c.questions.forEach(function (q) {
      var a = P() && P().answer ? P().answer(key(c, q)) : null;
      if (!a) return;
      answered++;
      if (a.ok) right++;
    });
    return { answered: answered, right: right, total: c.questions.length };
  }

  function lessonTitle(manifest, id) {
    var t = null;
    (manifest && manifest.domains || []).forEach(function (d) {
      d.modules.forEach(function (m) { if (m.id === id) t = m.title; });
    });
    return t;
  }

  function badges(ids) {
    var wrap = node('span', 'case-badges');
    (ids || []).forEach(function (id) { if (D()) wrap.appendChild(D().badge(id, { compact: true })); });
    return wrap;
  }

  /* ----------------------------------------------------------------- list */

  function listView(root, manifest) {
    root.appendChild(node('h1', null, 'Case studies'));
    root.appendChild(node('p', 'lede',
      'Each case is one organisation: its environment, a numbered list of requirements, and several questions about the same design. ' +
      'The requirements interact, so a choice that satisfies one can break another. Answer every question, then review your whole design: ' +
      'the review checks your answers against each other, the way a real design gets checked.'));
    root.appendChild(node('p', 'field__note',
      'Written for SC500 Academy from Microsoft Learn documentation, with fictional organisations. These are practice scenarios, not exam questions.'));

    var wait = node('p', 'loading', 'Loading the cases…');
    root.appendChild(wait);
    load().then(function (j) {
      wait.remove();
      var grid = node('div', 'dgrid scen-grid');
      j.cases.forEach(function (c) {
        var card = node('article', 'dcard scen-card');
        if (D()) D().paint(card, c.domains[0]);
        var head = node('header', 'dcard__head');
        var h = node('h2', 'dcard__title');
        h.appendChild(link(c.title, '#/cases/' + c.id));
        head.appendChild(h);
        card.appendChild(head);
        card.appendChild(node('p', null, c.summary));
        var meta = node('p', 'scen-card__meta');
        meta.appendChild(badges(c.domains));
        meta.appendChild(node('span', null, c.requirements.length + ' requirements · ' + c.questions.length + ' questions · about ' + c.minutes + ' minutes'));
        card.appendChild(meta);
        var s = caseScore(c);
        card.appendChild(node('p', 'scen-card__state',
          s.answered ? (s.right + ' of ' + s.total + ' correct on your latest answers' + (s.answered < s.total ? ' (' + (s.total - s.answered) + ' unanswered)' : '')) : 'Not started'));
        var act = node('div', 'dcard__actions');
        act.appendChild(link(s.answered ? 'Continue' : 'Start', '#/cases/' + c.id, 'btn' + (s.answered ? '' : ' btn--primary')));
        card.appendChild(act);
        grid.appendChild(card);
      });
      root.appendChild(grid);
      root.appendChild(node('p', 'field__note',
        'Prefer evidence over design? The break-fix drills give you a broken configuration and the logs to find out why.'));
      root.lastChild.appendChild(document.createTextNode(' '));
      root.lastChild.appendChild(link('Open the drills', '#/drills'));
    }).catch(function (e) { wait.textContent = 'The cases could not load: ' + (e && e.message || e); });
  }

  /* -------------------------------------------------------------- case file */

  /* The exam presents a case in tabs; so does this. Arrow keys move between
     tabs (WAI-ARIA tabs pattern, manual activation not needed for three). */
  function caseFile(c) {
    var wrap = node('section', 'case-file');
    wrap.setAttribute('aria-label', 'Case file');
    var list = node('div', 'case-file__tabs');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Case file');
    var uid = 'cf' + (++seq);

    var panes = [
      ['Overview', function (p) { p.appendChild(node('p', null, c.overview)); }],
      ['Environment', function (p) {
        var ul = node('ul', 'case-file__list');
        c.environment.forEach(function (e) { ul.appendChild(node('li', null, e)); });
        p.appendChild(ul);
      }],
      ['Requirements', function (p) {
        var dl = node('dl', 'case-reqs');
        c.requirements.forEach(function (r) {
          dl.appendChild(node('dt', null, r[0]));
          dl.appendChild(node('dd', null, r[1]));
        });
        p.appendChild(dl);
      }]
    ];

    var tabs = [], panels = [];
    panes.forEach(function (pane, i) {
      var t = node('button', 'case-file__tab', pane[0]);
      t.type = 'button';
      t.id = uid + 't' + i;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', uid + 'p' + i);
      var p = node('div', 'case-file__panel');
      p.id = uid + 'p' + i;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', t.id);
      p.tabIndex = 0;
      pane[1](p);
      tabs.push(t); panels.push(p);
      list.appendChild(t);
    });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n != null) { e.preventDefault(); select(n, true); }
      });
    });
    wrap.appendChild(list);
    panels.forEach(function (p) { wrap.appendChild(p); });
    select(0);
    return wrap;
  }

  /* --------------------------------------------------------------- question */

  function reqText(c, rid) {
    for (var i = 0; i < c.requirements.length; i++) if (c.requirements[i][0] === rid) return c.requirements[i][1];
    return '';
  }

  /* Returns { el, value() } where value() is the learner's current choice:
     an index (single), an array of indices (multi), or an array with one
     index or null per slot (dropdowns). */
  function questionCard(c, q, i, model) {
    var uid = 'cq' + (++seq);
    var card = node('article', 'kc case-q');
    card.dataset.state = 'open';
    card.id = 'case-' + q.id;
    if (D()) D().paint(card, c.domains[0]);

    var head = node('header', 'kc__head');
    head.appendChild(node('span', 'kc__num', 'Question ' + (i + 1) + ' of ' + c.questions.length));
    var bullet = model && model.bulletByNorm ? model.bulletByNorm[global.SC500Curriculum.norm(q.sub_skill)] : null;
    var oc = node('span', 'obj-chip', bullet ? bullet.id : q.objective);
    oc.title = 'Objective ' + (bullet ? bullet.id : q.objective) + ': ' + q.sub_skill;
    head.appendChild(oc);
    card.appendChild(head);

    var reqs = node('ul', 'case-q__reqs');
    reqs.setAttribute('aria-label', 'Requirements this question tests');
    q.requirements.forEach(function (rid) {
      var li = node('li');
      li.appendChild(node('strong', null, rid + ' '));
      li.appendChild(document.createTextNode(reqText(c, rid)));
      reqs.appendChild(li);
    });
    card.appendChild(reqs);

    var fs = document.createElement('fieldset');
    fs.className = 'kc__set';
    fs.appendChild(node('legend', 'kc__prompt', q.prompt));
    var body = node('div', q.type === 'dropdowns' ? 'case-q__slots' : 'kc__options');
    var selects = [];

    if (q.type === 'dropdowns') {
      q.slots.forEach(function (s, si) {
        var row = node('div', 'case-slot');
        var id = uid + 's' + si;
        var lab = node('label', 'case-slot__label', s.label);
        lab.htmlFor = id;
        var sel = document.createElement('select');
        sel.id = id;
        sel.className = 'case-slot__select';
        var blank = node('option', null, 'Select…');
        blank.value = '';
        sel.appendChild(blank);
        s.options.forEach(function (o, oi) {
          var opt = node('option', null, o);
          opt.value = String(oi);
          sel.appendChild(opt);
        });
        row.appendChild(lab);
        row.appendChild(sel);
        body.appendChild(row);
        selects.push(sel);
      });
    } else {
      if (q.type === 'multi') fs.appendChild(node('p', 'kc__hint', 'Choose ' + (q.choose === 2 ? 'two' : q.choose) + '. Each correct answer is part of the solution.'));
      q.options.forEach(function (opt, oi) {
        var id = uid + 'o' + oi;
        var row = node('div', 'kc__opt');
        row.dataset.index = String(oi);
        var input = document.createElement('input');
        input.type = q.type === 'multi' ? 'checkbox' : 'radio';
        input.name = uid;
        input.value = String(oi);
        input.id = id;
        var label = document.createElement('label');
        label.htmlFor = id;
        label.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + oi)));
        label.appendChild(node('span', 'kc__text', opt));
        row.appendChild(input);
        row.appendChild(label);
        body.appendChild(row);
      });
    }
    fs.appendChild(body);
    card.appendChild(fs);

    var actions = node('div', 'kc__actions');
    var check = node('button', 'btn btn--primary', 'Check answer');
    check.type = 'button';
    var retry = node('button', 'btn', 'Try again');
    retry.type = 'button';
    retry.hidden = true;
    actions.appendChild(check);
    actions.appendChild(retry);
    var prev = P() && P().answer ? P().answer(key(c, q)) : null;
    if (prev) actions.appendChild(node('span', 'kc__prev', 'Last answered ' + String(prev.at).slice(0, 10) + ': ' + (prev.ok ? 'correct' : 'incorrect')));
    card.appendChild(actions);

    var fb = node('div', 'kc__feedback');
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');
    fb.hidden = true;
    card.appendChild(fb);

    function value() {
      if (q.type === 'dropdowns') return selects.map(function (s) { return s.value === '' ? null : parseInt(s.value, 10); });
      var out = [];
      body.querySelectorAll('input:checked').forEach(function (inp) { out.push(parseInt(inp.value, 10)); });
      return q.type === 'single' ? (out.length ? out[0] : null) : out;
    }

    function hint(text) {
      fb.hidden = false;
      fb.textContent = text;
      fb.dataset.kind = 'hint';
    }

    check.addEventListener('click', function () {
      var v = value(), ok;
      if (q.type === 'single') {
        if (v === null) return hint('Choose an answer first.');
        ok = v === q.answer;
      } else if (q.type === 'multi') {
        if (v.length !== q.choose) return hint('Choose exactly ' + (q.choose === 2 ? 'two' : q.choose) + ' answers.');
        ok = v.slice().sort().join() === q.answer.slice().sort().join();
      } else {
        if (v.some(function (x) { return x === null; })) return hint('Make a choice in every list first.');
        ok = q.slots.every(function (s, si) { return v[si] === s.answer; });
      }
      reveal(ok, v);
      if (P() && P().recordAnswer) P().recordAnswer(key(c, q), ok, { src: 'case' });
    });

    retry.addEventListener('click', function () {
      card.dataset.state = 'open';
      body.querySelectorAll('input, select').forEach(function (el) { el.disabled = false; if (el.type === 'radio' || el.type === 'checkbox') el.checked = false; });
      selects.forEach(function (s) { s.value = ''; delete s.parentNode.dataset.mark; });
      body.querySelectorAll('.kc__opt').forEach(function (r) { delete r.dataset.mark; });
      fb.hidden = true;
      fb.textContent = '';
      check.hidden = false;
      retry.hidden = true;
      var first = body.querySelector('input, select');
      if (first) first.focus();
    });

    function reveal(ok, v) {
      card.dataset.state = ok ? 'correct' : 'incorrect';
      body.querySelectorAll('input, select').forEach(function (el) { el.disabled = true; });
      fb.textContent = '';
      fb.hidden = false;
      delete fb.dataset.kind;
      fb.appendChild(node('p', 'kc__verdict', ok ? '✓ Correct' : '✗ Not quite'));

      if (q.type === 'dropdowns') {
        fb.appendChild(node('h3', 'kc__h', 'Each choice'));
        var ul = node('ul', 'case-q__slotfb');
        q.slots.forEach(function (s, si) {
          var right = v[si] === s.answer;
          selects[si].parentNode.dataset.mark = right ? 'correct' : 'picked-wrong';
          var li = node('li');
          li.dataset.mark = right ? 'correct' : 'wrong';
          li.appendChild(node('strong', null, s.label + ': '));
          li.appendChild(document.createTextNode((right ? '✓ ' : '✗ You chose "' + s.options[v[si]] + '". Correct: ') + s.options[s.answer] + '. '));
          if (s.why) li.appendChild(node('span', 'case-q__why', s.why));
          ul.appendChild(li);
        });
        fb.appendChild(ul);
      } else {
        var exp = q.type === 'multi' ? q.answer : [q.answer];
        var pick = q.type === 'multi' ? v : [v];
        body.querySelectorAll('.kc__opt').forEach(function (r) {
          var oi = parseInt(r.dataset.index, 10);
          if (exp.indexOf(oi) !== -1) r.dataset.mark = 'correct';
          else if (pick.indexOf(oi) !== -1) r.dataset.mark = 'picked-wrong';
        });
        fb.appendChild(node('h3', 'kc__h', exp.length > 1 ? 'Correct answers' : 'Correct answer'));
        var al = node('ul', 'kc__answers');
        exp.forEach(function (oi) {
          var li = node('li');
          li.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + oi)));
          li.appendChild(document.createTextNode(' ' + q.options[oi]));
          al.appendChild(li);
        });
        fb.appendChild(al);
        var notes = [];
        q.options.forEach(function (o, oi) { if (exp.indexOf(oi) === -1 && q.why_not && q.why_not[oi]) notes.push([oi, q.why_not[oi]]); });
        if (q.explanation) { fb.appendChild(node('h3', 'kc__h', 'Why')); fb.appendChild(node('p', null, q.explanation)); }
        if (notes.length) {
          fb.appendChild(node('h3', 'kc__h', 'Why not the others'));
          var wl = node('ul', 'kc__whynot');
          notes.forEach(function (n) {
            var li = node('li');
            li.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + n[0])));
            li.appendChild(document.createTextNode(' ' + n[1]));
            wl.appendChild(li);
          });
          fb.appendChild(wl);
        }
      }
      if (q.type === 'dropdowns' && q.explanation) { fb.appendChild(node('h3', 'kc__h', 'Why')); fb.appendChild(node('p', null, q.explanation)); }

      if (q.scenario_clue) {
        var sc = node('div', 'kc__clue');
        sc.appendChild(node('h3', 'kc__h', 'Scenario clue'));
        sc.appendChild(node('p', null, q.scenario_clue));
        fb.appendChild(sc);
      }
      var obj = node('p', 'kc__objective');
      obj.appendChild(node('strong', null, 'Objective: '));
      obj.appendChild(document.createTextNode((bullet ? bullet.id : q.objective) + ' · ' + q.sub_skill));
      if (bullet && bullet.lessonIds && bullet.lessonIds.length) {
        obj.appendChild(document.createTextNode(' — study it in '));
        bullet.lessonIds.forEach(function (lid, li) {
          if (li) obj.appendChild(document.createTextNode(', '));
          obj.appendChild(link(lid, '#/module/' + lid));
        });
      }
      fb.appendChild(obj);
      check.hidden = true;
      retry.hidden = false;
    }

    return { el: card, value: value, q: q };
  }

  /* ---------------------------------------------------------- design check */

  function matches(cond, values) {
    var v = values[cond.q];
    if (v === undefined || v === null) return false;
    if (cond.has != null) return Array.isArray(v) && v.indexOf(cond.has) !== -1;
    if (cond.slot != null) return Array.isArray(v) && v[cond.slot] === cond.is;
    return v === cond.is;
  }

  function designReview(c, cards) {
    var sec = node('section', 'case-design');
    sec.setAttribute('aria-labelledby', 'case-design-h');
    var h = node('h2', null, 'Review your design');
    h.id = 'case-design-h';
    sec.appendChild(h);
    sec.appendChild(node('p', 'lede',
      'Each question was marked on its own. This checks your answers against each other, using whatever is selected now, checked or not.'));
    var btn = node('button', 'btn btn--primary', 'Review my design');
    btn.type = 'button';
    sec.appendChild(btn);
    var out = node('div', 'case-design__out');
    out.setAttribute('role', 'status');
    out.setAttribute('aria-live', 'polite');
    sec.appendChild(out);

    btn.addEventListener('click', function () {
      out.textContent = '';
      var values = {}, blank = 0;
      cards.forEach(function (k) {
        var v = k.value();
        values[k.q.id] = v;
        var empty = v === null || (Array.isArray(v) && (!v.length || (k.q.type === 'dropdowns' && v.every(function (x) { return x === null; }))));
        if (empty) blank++;
      });
      var hits = (c.conflicts || []).filter(function (cf) {
        return cf.when.every(function (cond) { return matches(cond, values); });
      });
      var s = caseScore(c);
      out.appendChild(node('p', 'case-design__score',
        s.right + ' of ' + s.total + ' questions correct on your latest checked answers.' + (blank ? ' ' + blank + ' question' + (blank > 1 ? 's have' : ' has') + ' nothing selected.' : '')));
      if (hits.length) {
        out.appendChild(node('h3', null, hits.length === 1 ? 'One conflict in your design' : hits.length + ' conflicts in your design'));
        var ul = node('ul', 'case-design__conflicts');
        hits.forEach(function (cf) { ul.appendChild(node('li', null, cf.message)); });
        out.appendChild(ul);
      } else {
        out.appendChild(node('p', null, blank === cards.length
          ? 'Nothing is selected yet, so there is nothing to compare.'
          : 'No conflicts found between the answers you gave. That is not the same as every answer being right: check the questions marked incorrect.'));
      }
      var det = node('details', 'case-design__ref');
      det.appendChild(node('summary', null, 'Show the reference design'));
      var rl = node('ul');
      c.design.forEach(function (d) { rl.appendChild(node('li', null, d)); });
      det.appendChild(rl);
      out.appendChild(det);
    });
    return sec;
  }

  /* -------------------------------------------------------------- one case */

  function caseView(root, manifest, id) {
    var wait = node('p', 'loading', 'Loading the case…');
    root.appendChild(wait);
    var C = global.SC500Curriculum;
    Promise.all([load(), C ? C.load(manifest).catch(function () { return null; }) : Promise.resolve(null)]).then(function (res) {
      wait.remove();
      var j = res[0], model = res[1];
      var c = null;
      j.cases.forEach(function (x) { if (x.id === id) c = x; });
      if (!c) {
        root.appendChild(node('h1', null, 'Case not found'));
        var p = node('p', null, 'There is no case called "' + id + '". ');
        p.appendChild(link('See all case studies', '#/cases'));
        root.appendChild(p);
        return;
      }
      document.title = c.title + ' · SC500 Academy';
      var crumb = node('p', 'crumb');
      crumb.appendChild(link('Case studies', '#/cases'));
      root.appendChild(crumb);
      root.appendChild(node('h1', null, c.title));
      var meta = node('p', 'scen-meta');
      meta.appendChild(badges(c.domains));
      meta.appendChild(node('span', null, c.requirements.length + ' requirements · ' + c.questions.length + ' questions · about ' + c.minutes + ' minutes'));
      root.appendChild(meta);
      root.appendChild(node('p', 'lede', 'Read the case file first. Each question repeats the requirements it tests; the others still apply.'));
      root.appendChild(caseFile(c));

      var qh = node('h2', null, 'Questions');
      root.appendChild(qh);
      var cards = [];
      var list = node('div', 'kc-set');
      c.questions.forEach(function (q, i) {
        var k = questionCard(c, q, i, model);
        cards.push(k);
        list.appendChild(k.el);
      });
      root.appendChild(list);
      root.appendChild(designReview(c, cards));

      var more = node('section', 'scen-sources');
      more.appendChild(node('h2', null, 'Where this is taught'));
      var ll = node('ul');
      (c.lessons || []).forEach(function (lid) {
        var li = node('li');
        li.appendChild(link(lid + ' ' + (lessonTitle(manifest, lid) || ''), '#/module/' + lid));
        ll.appendChild(li);
      });
      more.appendChild(ll);
      more.appendChild(node('h3', null, 'Microsoft Learn sources'));
      var sl = node('ul', 'scen-sources__list');
      (c.sources || []).forEach(function (u) {
        var li = node('li');
        var a = link(u.replace(/^https:\/\/learn\.microsoft\.com\//, ''), u);
        a.target = '_blank';
        a.rel = 'noopener';
        li.appendChild(a);
        sl.appendChild(li);
      });
      more.appendChild(sl);
      more.appendChild(node('p', 'field__note', 'Checked against Microsoft Learn on ' + j.checked + '. Features marked preview can change.'));
      root.appendChild(more);
    }).catch(function (e) { wait.textContent = 'The case could not load: ' + (e && e.message || e); });
  }

  function view(root, manifest, id) {
    if (id) caseView(root, manifest, id);
    else listView(root, manifest);
  }

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.cases = view;
  global.SC500Cases = { load: load, key: key, score: caseScore };
})(window);
