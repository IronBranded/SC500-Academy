/* drills.js - SC-500 guide
   The #/drills view: paper break-fix drills.

   A ticket, the environment, and simplified evidence: an effective-routes
   table, a sign-in log, an activity log, a policy assignment. The learner
   first picks the one line of evidence that proves the cause, then answers
   three questions in order: cause, fix, and how to prove the fix worked.
   Each step opens after the previous one is checked, so the fix is never
   chosen before the cause.

   Nothing here touches Azure. The evidence is simplified for teaching and
   is labelled so; it is not a verbatim product screen.

   Answers are recorded as drill:<id>:<step> (src 'drill'), plus
   drill:<id> once the last step is checked: correct only if every step's
   latest answer was correct. */

(function (global) {
  'use strict';

  var P = function () { return global.SC500Progress; };
  var D = function () { return global.SC500Domains; };
  var data = null, job = null, seq = 0;
  var STEP_TITLES = { proof: 'Find the proof', cause: 'Name the cause', fix: 'Choose the fix', validate: 'Prove it worked' };

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
    job = fetch('content/drills.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' for content/drills.json'); return r.json(); })
      .then(function (j) { data = j; job = null; return j; });
    return job;
  }

  function lessonTitle(manifest, id) {
    var t = null;
    (manifest && manifest.domains || []).forEach(function (d) {
      d.modules.forEach(function (m) { if (m.id === id) t = m.title; });
    });
    return t;
  }

  function state(d) {
    var a = P() && P().answer ? P().answer('drill:' + d.id) : null;
    if (!a) {
      var any = ['proof', 'cause', 'fix', 'validate'].some(function (s) { return P() && P().answer && P().answer('drill:' + d.id + ':' + s); });
      return any ? 'started' : 'new';
    }
    return a.ok ? 'solved' : 'review';
  }
  var STATE_TEXT = { 'new': 'Not started', started: 'In progress', solved: 'Solved: every step right on your latest attempt', review: 'Finished with at least one step wrong' };

  /* ----------------------------------------------------------------- list */

  function listView(root) {
    root.appendChild(node('h1', null, 'Break-fix drills'));
    root.appendChild(node('p', 'lede',
      'Something is configured, and it is not doing what someone expected. Each drill gives you the ticket and the evidence an engineer would pull: ' +
      'routes, rules, logs, a policy assignment. Find the line that proves the cause, then choose the cause, the fix, and how you would prove the fix worked.'));
    root.appendChild(node('p', 'field__note',
      'On paper: nothing here touches Azure or costs money. The evidence is simplified for teaching and labelled so; the behaviour behind it was checked against Microsoft Learn.'));
    var wait = node('p', 'loading', 'Loading the drills…');
    root.appendChild(wait);
    load().then(function (j) {
      wait.remove();
      var grid = node('div', 'dgrid scen-grid');
      j.drills.forEach(function (d) {
        var card = node('article', 'dcard scen-card');
        if (D()) D().paint(card, d.domains[0]);
        var head = node('header', 'dcard__head');
        var h = node('h2', 'dcard__title');
        h.appendChild(link(d.title, '#/drills/' + d.id));
        head.appendChild(h);
        var oc = node('span', 'obj-chip', d.objective);
        oc.title = 'Objective ' + d.objective + ': ' + d.sub_skill;
        head.appendChild(oc);
        card.appendChild(head);
        card.appendChild(node('p', null, d.ticket.text));
        var meta = node('p', 'scen-card__meta');
        if (D()) meta.appendChild(D().badge(d.domains[0], { compact: true }));
        meta.appendChild(node('span', null, d.artifacts.length + ' pieces of evidence · about ' + d.minutes + ' minutes'));
        card.appendChild(meta);
        var st = state(d);
        var sp = node('p', 'scen-card__state', STATE_TEXT[st]);
        sp.dataset.state = st;
        card.appendChild(sp);
        var act = node('div', 'dcard__actions');
        act.appendChild(link(st === 'new' ? 'Start' : 'Open', '#/drills/' + d.id, 'btn' + (st === 'new' ? ' btn--primary' : '')));
        card.appendChild(act);
        grid.appendChild(card);
      });
      root.appendChild(grid);
    }).catch(function (e) { wait.textContent = 'The drills could not load: ' + (e && e.message || e); });
  }

  /* ------------------------------------------------------------- evidence */

  /* Every row and line carries a radio button in one group, so picking the
     proof works by keyboard and is announced with the row's text. */
  function evidence(d, group) {
    var wrap = node('div', 'drill-evidence');
    d.artifacts.forEach(function (a) {
      var fig = node('figure', 'drill-art');
      fig.dataset.kind = a.kind;
      var cap = node('figcaption', 'drill-art__cap');
      cap.appendChild(node('span', 'drill-art__title', a.title));
      if (a.note) cap.appendChild(node('span', 'drill-art__note', a.note));
      fig.appendChild(cap);

      if (a.kind === 'table') {
        var scroll = node('div', 'table-scroll');
        scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region');
        scroll.setAttribute('aria-label', a.title);
        var t = node('table', 'drill-table');
        var thead = node('thead');
        var hr = node('tr');
        var pickTh = node('th', 'drill-pick');
        pickTh.appendChild(node('span', 'visually-hidden', 'Select as proof'));
        pickTh.scope = 'col';
        hr.appendChild(pickTh);
        a.columns.forEach(function (col) { var th = node('th', null, col); th.scope = 'col'; hr.appendChild(th); });
        thead.appendChild(hr);
        t.appendChild(thead);
        var tb = node('tbody');
        a.rows.forEach(function (row, r) {
          var tr = node('tr', 'drill-line');
          tr.dataset.ref = a.id + ':' + r;
          var td0 = node('td', 'drill-pick');
          td0.appendChild(radio(group, a, r, a.title + ', row ' + (r + 1) + ': ' + row.filter(Boolean).join(', ')));
          tr.appendChild(td0);
          row.forEach(function (cell, ci) { var td = node('td', null, cell); td.dataset.label = a.columns[ci]; tr.appendChild(td); });
          tb.appendChild(tr);
        });
        t.appendChild(tb);
        scroll.appendChild(t);
        fig.appendChild(scroll);
      } else {
        var ol = node('ol', 'drill-log');
        a.lines.forEach(function (line, r) {
          var li = node('li', 'drill-line');
          li.dataset.ref = a.id + ':' + r;
          var r1 = radio(group, a, r, a.title + ', line ' + (r + 1) + ': ' + line);
          li.appendChild(r1);
          var code = node('code', null, line);
          li.appendChild(code);
          ol.appendChild(li);
        });
        fig.appendChild(ol);
      }
      wrap.appendChild(fig);
    });
    return wrap;
  }

  function radio(group, a, r, label) {
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = group;
    input.value = a.id + ':' + r;
    input.setAttribute('aria-label', label);
    return input;
  }

  /* ------------------------------------------------------------------ steps */

  function feedback() {
    var fb = node('div', 'kc__feedback');
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');
    fb.hidden = true;
    return fb;
  }

  function verdict(fb, ok) {
    fb.textContent = '';
    fb.hidden = false;
    delete fb.dataset.kind;
    fb.appendChild(node('p', 'kc__verdict', ok ? '✓ Correct' : '✗ Not quite'));
  }

  function hint(fb, text) {
    fb.hidden = false;
    fb.textContent = text;
    fb.dataset.kind = 'hint';
  }

  function stepShell(d, n, sid) {
    var sec = node('section', 'kc drill-step');
    sec.dataset.state = 'open';
    sec.id = 'drill-' + sid;
    if (D()) D().paint(sec, d.domains[0]);
    var head = node('header', 'kc__head');
    head.appendChild(node('span', 'kc__num', 'Step ' + n + ' of 4'));
    sec.appendChild(head);
    var h = node('h2', 'drill-step__title', STEP_TITLES[sid]);
    h.tabIndex = -1;
    sec.appendChild(h);
    return sec;
  }

  function proofStep(d, onDone) {
    var sec = stepShell(d, 1, 'proof');
    var group = 'dp' + (++seq);
    var fs = document.createElement('fieldset');
    fs.className = 'kc__set';
    fs.appendChild(node('legend', 'kc__prompt', d.proof.prompt));
    var ev = evidence(d, group);
    fs.appendChild(ev);
    sec.appendChild(fs);

    var actions = node('div', 'kc__actions');
    var check = node('button', 'btn btn--primary', 'Check answer');
    check.type = 'button';
    actions.appendChild(check);
    sec.appendChild(actions);
    var fb = feedback();
    sec.appendChild(fb);

    var accept = d.proof.accept.map(function (x) { return x.a + ':' + x.r; });
    check.addEventListener('click', function () {
      var pick = ev.querySelector('input:checked');
      if (!pick) return hint(fb, 'Select a row or line in the evidence first.');
      var ok = accept.indexOf(pick.value) !== -1;
      sec.dataset.state = ok ? 'correct' : 'incorrect';
      ev.querySelectorAll('input').forEach(function (i) { i.disabled = true; });
      ev.querySelectorAll('.drill-line').forEach(function (line) {
        var ref = line.dataset.ref;
        /* In a table the word opens the first data cell (a span cannot be
           a child of a row); in a log it follows the line. */
        var tag = null;
        if (accept.indexOf(ref) !== -1) { line.dataset.mark = 'correct'; tag = node('span', 'drill-line__tag', 'Proof'); }
        else if (ref === pick.value) { line.dataset.mark = 'picked-wrong'; tag = node('span', 'drill-line__tag', 'Your pick'); }
        if (tag) {
          if (line.tagName === 'TR') line.children[1].insertBefore(tag, line.children[1].firstChild);
          else line.appendChild(tag);
        }
      });
      verdict(fb, ok);
      fb.appendChild(node('p', null, d.proof.explanation));
      check.hidden = true;
      if (P() && P().recordAnswer) P().recordAnswer('drill:' + d.id + ':proof', ok, { src: 'drill' });
      onDone(ok);
    });
    return sec;
  }

  function choiceStep(d, n, st, onDone) {
    var sec = stepShell(d, n, st.id);
    var uid = 'ds' + (++seq);
    var fs = document.createElement('fieldset');
    fs.className = 'kc__set';
    fs.appendChild(node('legend', 'kc__prompt', st.prompt));
    var opts = node('div', 'kc__options');
    st.options.forEach(function (o, oi) {
      var row = node('div', 'kc__opt');
      row.dataset.index = String(oi);
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = uid;
      input.value = String(oi);
      input.id = uid + 'o' + oi;
      var label = document.createElement('label');
      label.htmlFor = input.id;
      label.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + oi)));
      label.appendChild(node('span', 'kc__text', o));
      row.appendChild(input);
      row.appendChild(label);
      opts.appendChild(row);
    });
    fs.appendChild(opts);
    sec.appendChild(fs);
    var actions = node('div', 'kc__actions');
    var check = node('button', 'btn btn--primary', 'Check answer');
    check.type = 'button';
    actions.appendChild(check);
    sec.appendChild(actions);
    var fb = feedback();
    sec.appendChild(fb);

    check.addEventListener('click', function () {
      var pick = opts.querySelector('input:checked');
      if (!pick) return hint(fb, 'Choose an answer first.');
      var v = parseInt(pick.value, 10), ok = v === st.answer;
      sec.dataset.state = ok ? 'correct' : 'incorrect';
      opts.querySelectorAll('input').forEach(function (i) { i.disabled = true; });
      opts.querySelectorAll('.kc__opt').forEach(function (r) {
        var oi = parseInt(r.dataset.index, 10);
        if (oi === st.answer) r.dataset.mark = 'correct';
        else if (oi === v) r.dataset.mark = 'picked-wrong';
      });
      verdict(fb, ok);
      fb.appendChild(node('h3', 'kc__h', 'Why'));
      fb.appendChild(node('p', null, st.explanation));
      var notes = [];
      st.options.forEach(function (o, oi) { if (oi !== st.answer && st.why_not[oi]) notes.push([oi, st.why_not[oi]]); });
      if (notes.length) {
        fb.appendChild(node('h3', 'kc__h', 'Why not the others'));
        var wl = node('ul', 'kc__whynot');
        notes.forEach(function (x) {
          var li = node('li');
          li.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + x[0])));
          li.appendChild(document.createTextNode(' ' + x[1]));
          wl.appendChild(li);
        });
        fb.appendChild(wl);
      }
      check.hidden = true;
      if (P() && P().recordAnswer) P().recordAnswer('drill:' + d.id + ':' + st.id, ok, { src: 'drill' });
      onDone(ok);
    });
    return sec;
  }

  /* ------------------------------------------------------------- one drill */

  function drillView(root, manifest, id) {
    var wait = node('p', 'loading', 'Loading the drill…');
    root.appendChild(wait);
    load().then(function (j) {
      wait.remove();
      var d = null;
      j.drills.forEach(function (x) { if (x.id === id) d = x; });
      if (!d) {
        root.appendChild(node('h1', null, 'Drill not found'));
        var p = node('p', null, 'There is no drill called "' + id + '". ');
        p.appendChild(link('See all drills', '#/drills'));
        root.appendChild(p);
        return;
      }
      document.title = d.title + ' · SC500 Academy';
      render(root, manifest, j, d);
    }).catch(function (e) { wait.textContent = 'The drill could not load: ' + (e && e.message || e); });
  }

  function render(root, manifest, j, d) {
    root.textContent = '';
    var crumb = node('p', 'crumb');
    crumb.appendChild(link('Break-fix drills', '#/drills'));
    root.appendChild(crumb);
    root.appendChild(node('h1', null, d.title));
    var meta = node('p', 'scen-meta');
    if (D()) meta.appendChild(D().badge(d.domains[0], { compact: true }));
    var oc = node('span', 'obj-chip', d.objective);
    oc.title = 'Objective ' + d.objective + ': ' + d.sub_skill;
    meta.appendChild(oc);
    meta.appendChild(node('span', null, d.sub_skill));
    root.appendChild(meta);

    var ticket = node('section', 'drill-ticket');
    ticket.setAttribute('aria-labelledby', 'drill-ticket-h');
    var th = node('h2', null, 'The ticket');
    th.id = 'drill-ticket-h';
    ticket.appendChild(th);
    var from = node('p', 'drill-ticket__from');
    from.appendChild(node('strong', null, 'From: '));
    from.appendChild(document.createTextNode(d.ticket.from));
    ticket.appendChild(from);
    ticket.appendChild(node('blockquote', 'drill-ticket__text', d.ticket.text));
    if (d.environment && d.environment.length) {
      ticket.appendChild(node('h3', null, 'What you know'));
      var ul = node('ul');
      d.environment.forEach(function (e) { ul.appendChild(node('li', null, e)); });
      ticket.appendChild(ul);
    }
    root.appendChild(ticket);

    var steps = node('div', 'kc-set drill-steps');
    root.appendChild(steps);
    var results = {};
    var order = ['proof'].concat(d.steps.map(function (s) { return s.id; }));

    function finish() {
      var all = order.every(function (s) { return results[s]; });
      if (P() && P().recordAnswer) P().recordAnswer('drill:' + d.id, all, { src: 'drill' });
      var done = node('section', 'drill-done');
      done.setAttribute('aria-labelledby', 'drill-done-h');
      var h = node('h2', null, all ? 'Solved' : 'Done: review the steps marked wrong');
      h.id = 'drill-done-h';
      h.tabIndex = -1;
      done.appendChild(h);
      var right = order.filter(function (s) { return results[s]; }).length;
      done.appendChild(node('p', null, right + ' of ' + order.length + ' steps right.'));
      var tk = node('p', 'drill-done__takeaway');
      tk.appendChild(node('strong', null, 'Remember: '));
      tk.appendChild(document.createTextNode(d.takeaway));
      done.appendChild(tk);
      if (d.beyond) {
        var det = node('details', 'beyond');
        det.appendChild(node('summary', null, 'Beyond the exam'));
        det.appendChild(node('p', null, d.beyond));
        done.appendChild(det);
      }
      if (d.lessons && d.lessons.length) {
        done.appendChild(node('h3', null, 'Where this is taught'));
        var ll = node('ul');
        d.lessons.forEach(function (lid) {
          var li = node('li');
          li.appendChild(link(lid + ' ' + (lessonTitle(manifest, lid) || ''), '#/module/' + lid));
          ll.appendChild(li);
        });
        done.appendChild(ll);
      }
      done.appendChild(node('h3', null, 'Microsoft Learn sources'));
      var sl = node('ul', 'scen-sources__list');
      d.sources.forEach(function (u) {
        var li = node('li');
        var a = link(u.replace(/^https:\/\/learn\.microsoft\.com\//, ''), u);
        a.target = '_blank';
        a.rel = 'noopener';
        li.appendChild(a);
        sl.appendChild(li);
      });
      done.appendChild(sl);
      done.appendChild(node('p', 'field__note', 'Checked against Microsoft Learn on ' + j.checked + '. Evidence simplified for teaching.'));
      var acts = node('div', 'dcard__actions');
      var again = node('button', 'btn', 'Start this drill again');
      again.type = 'button';
      again.addEventListener('click', function () { render(root, manifest, j, d); window.scrollTo(0, 0); });
      acts.appendChild(again);
      var next = null;
      for (var i = 0; i < j.drills.length; i++) if (j.drills[i].id === d.id && j.drills[i + 1]) next = j.drills[i + 1];
      if (next) acts.appendChild(link('Next drill: ' + next.title, '#/drills/' + next.id, 'btn btn--primary'));
      done.appendChild(acts);
      root.appendChild(done);
      h.focus();
    }

    /* Each step opens only after the previous one is checked. */
    function open(i) {
      var sid = order[i];
      var el = i === 0
        ? proofStep(d, function (ok) { results.proof = ok; open(1); })
        : choiceStep(d, i + 1, d.steps[i - 1], function (ok) {
          results[sid] = ok;
          if (i + 1 < order.length) open(i + 1); else finish();
        });
      steps.appendChild(el);
      if (i > 0) {
        var h = el.querySelector('.drill-step__title');
        if (h) h.focus();
      }
    }
    open(0);
  }

  function view(root, manifest, id) {
    if (id) drillView(root, manifest, id);
    else listView(root);
  }

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.drills = view;
  global.SC500Drills = { load: load, state: state };
})(window);
