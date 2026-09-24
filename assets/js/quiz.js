/* quiz.js - SC-500 guide
   Knowledge checks.

   Quiz data lives in quizzes/<module-id>.json, deliberately separate from the
   prose: editing a question never touches content, and rewriting a module never
   invalidates its questions silently - the sub_skill field is the join.

   v2 (certification-first redesign):

   - Each question is answered and explained on its own, immediately, rather
     than all at once at the end. Feedback is structured the same way every
     time: CORRECT ANSWER, WHY, WHY NOT THE OTHERS (when the question file
     provides per-option notes), and the OBJECTIVE being tested.
   - Every answer is recorded per question (progress.js recordAnswer), which is
     what lets the dashboard report "knowledge checked" per official
     sub-objective and lets Exam prep replay only the questions you got wrong.
   - The renderer is exported, so the domain review and Exam prep mode reuse
     exactly this component for mixed-question sets.

   Optional question fields, rendered only when present - nothing is inferred:

     why_not        array aligned with options (null for the correct ones), or
                    an object keyed by option index: why each distractor fails
     difficulty     "foundation" | "applied" | "scenario"
     concept        short label, e.g. "Conditional Access evaluation"
     misconception  the wrong belief the question is built to expose

   Options stay in file order on the lesson page, because several explanations
   refer to options by position. Exam prep shuffles only questions that set
   "fixed_options": false explicitly - the mock exam in practice.js keeps its
   own rules. */

(function (global) {
  'use strict';

  var P = function () { return global.SC500Progress; };
  var D = function () { return global.SC500Domains; };
  var seq = 0;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    return a.slice().sort().join('|') === b.slice().sort().join('|');
  }

  function expected(q) {
    return (Array.isArray(q.answer) ? q.answer : [q.answer]).map(function (x) { return parseInt(x, 10); });
  }

  function whyNot(q, oi) {
    var w = q.why_not;
    if (!w) return null;
    if (Array.isArray(w)) return w[oi] || null;
    return w[oi] || w[String(oi)] || null;
  }

  function fmtDate(iso) { return String(iso || '').slice(0, 10); }

  /* ------------------------------------------------------- one question -- */

  /* rec: { id, data, lessonId, bulletId, domainId } - a curriculum question
     record. opts: { index, total, showLesson, model, onAnswer } */
  function questionCard(rec, opts) {
    opts = opts || {};
    var q = rec.data;
    var model = opts.model;
    var multi = expected(q).length > 1;
    var uid = 'kc' + (++seq);

    var card = node('article', 'kc');
    card.dataset.qid = rec.id;
    card.dataset.state = 'open';
    if (rec.domainId && D()) D().paint(card, rec.domainId);

    /* Header: position, objective, optional tags. */
    var head = node('header', 'kc__head');
    head.appendChild(node('span', 'kc__num',
      'Question ' + (opts.index + 1) + (opts.total ? ' of ' + opts.total : '')));

    var bullet = model && rec.bulletId ? model.bulletById[rec.bulletId] : null;
    if (opts.showLesson && rec.domainId && D()) head.appendChild(D().badge(rec.domainId, { compact: true }));
    if (bullet) {
      var oc = node('span', 'obj-chip', bullet.id);
      oc.title = 'Objective ' + bullet.id + ': ' + bullet.text;
      head.appendChild(oc);
    }
    if (q.difficulty) head.appendChild(node('span', 'tag', q.difficulty));
    if (q.concept) head.appendChild(node('span', 'tag', q.concept));
    card.appendChild(head);

    /* The question: a real fieldset, so screen readers announce the prompt
       with each option and arrow keys move within a radio group. */
    var fs = document.createElement('fieldset');
    fs.className = 'kc__set';
    var legend = node('legend', 'kc__prompt', q.prompt);
    fs.appendChild(legend);
    if (multi) fs.appendChild(node('p', 'kc__hint', 'Select all that apply (' + expected(q).length + ' answers).'));

    var optsWrap = node('div', 'kc__options');
    q.options.forEach(function (opt, oi) {
      var id = uid + 'o' + oi;
      var row = node('div', 'kc__opt');
      row.dataset.index = String(oi);
      var input = document.createElement('input');
      input.type = multi ? 'checkbox' : 'radio';
      input.name = uid;
      input.value = String(oi);
      input.id = id;
      var label = document.createElement('label');
      label.htmlFor = id;
      label.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + oi)));
      label.appendChild(node('span', 'kc__text', opt));
      row.appendChild(input);
      row.appendChild(label);
      optsWrap.appendChild(row);
    });
    fs.appendChild(optsWrap);
    card.appendChild(fs);

    var actions = node('div', 'kc__actions');
    var check = node('button', 'btn btn--primary', 'Check answer');
    check.type = 'button';
    var retry = node('button', 'btn', 'Try again');
    retry.type = 'button';
    retry.hidden = true;
    actions.appendChild(check);
    actions.appendChild(retry);

    var prev = P() && P().answer ? P().answer(rec.id) : null;
    if (prev) {
      actions.appendChild(node('span', 'kc__prev',
        'Last answered ' + fmtDate(prev.at) + ': ' + (prev.ok ? 'correct' : 'incorrect')));
    }
    card.appendChild(actions);

    var fb = node('div', 'kc__feedback');
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');
    fb.hidden = true;
    card.appendChild(fb);

    function chosen() {
      var out = [];
      optsWrap.querySelectorAll('input:checked').forEach(function (i) { out.push(parseInt(i.value, 10)); });
      return out;
    }

    check.addEventListener('click', function () {
      var pick = chosen();
      if (!pick.length) {
        fb.hidden = false;
        fb.textContent = 'Choose an answer first.';
        fb.dataset.kind = 'hint';
        return;
      }
      var exp = expected(q);
      var ok = sameSet(pick, exp);
      reveal(ok, pick, exp);
      if (P() && P().recordAnswer) P().recordAnswer(rec.id, ok, { lesson: rec.lessonId, src: opts.src || 'check' });
      if (opts.onAnswer) opts.onAnswer(rec, ok);
    });

    retry.addEventListener('click', function () {
      card.dataset.state = 'open';
      optsWrap.querySelectorAll('input').forEach(function (i) { i.checked = false; i.disabled = false; });
      optsWrap.querySelectorAll('.kc__opt').forEach(function (r) { delete r.dataset.mark; });
      fb.hidden = true;
      fb.textContent = '';
      check.hidden = false;
      retry.hidden = true;
      var first = optsWrap.querySelector('input');
      if (first) first.focus();
    });

    function reveal(ok, pick, exp) {
      card.dataset.state = ok ? 'correct' : 'incorrect';
      optsWrap.querySelectorAll('input').forEach(function (i) { i.disabled = true; });
      optsWrap.querySelectorAll('.kc__opt').forEach(function (r) {
        var i = parseInt(r.dataset.index, 10);
        var isRight = exp.indexOf(i) !== -1, isPicked = pick.indexOf(i) !== -1;
        /* Text markers, not only colour: the label gains a word. */
        if (isRight) r.dataset.mark = 'correct';
        else if (isPicked) r.dataset.mark = 'picked-wrong';
      });

      fb.textContent = '';
      fb.hidden = false;
      delete fb.dataset.kind;

      var verdict = node('p', 'kc__verdict', ok ? '\u2713 Correct' : '\u2717 Not quite');
      fb.appendChild(verdict);

      fb.appendChild(node('h4', 'kc__h', 'Correct answer'));
      var ul = node('ul', 'kc__answers');
      exp.forEach(function (i) {
        var li = node('li');
        li.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + i)));
        li.appendChild(document.createTextNode(' ' + q.options[i]));
        ul.appendChild(li);
      });
      fb.appendChild(ul);

      if (q.explanation) {
        fb.appendChild(node('h4', 'kc__h', 'Why'));
        fb.appendChild(node('p', null, q.explanation));
      }

      var notes = [];
      q.options.forEach(function (opt, i) {
        if (exp.indexOf(i) !== -1) return;
        var w = whyNot(q, i);
        if (w) notes.push({ i: i, text: w });
      });
      if (notes.length) {
        fb.appendChild(node('h4', 'kc__h', 'Why not the others'));
        var wl = node('ul', 'kc__whynot');
        notes.forEach(function (n) {
          var li = node('li');
          li.appendChild(node('span', 'kc__letter', String.fromCharCode(65 + n.i)));
          li.appendChild(document.createTextNode(' ' + n.text));
          wl.appendChild(li);
        });
        fb.appendChild(wl);
      }

      if (q.misconception) {
        var mc = node('p', 'kc__misconception');
        mc.appendChild(node('strong', null, 'Misconception tested: '));
        mc.appendChild(document.createTextNode(q.misconception));
        fb.appendChild(mc);
      }

      var obj = node('p', 'kc__objective');
      obj.appendChild(node('strong', null, 'Objective: '));
      if (bullet) {
        obj.appendChild(document.createTextNode(bullet.id + ' \u00b7 ' + bullet.text));
      } else {
        obj.appendChild(document.createTextNode(q.sub_skill || 'not mapped'));
      }
      if (opts.showLesson && rec.lessonId) {
        obj.appendChild(document.createTextNode(' \u2014 '));
        var a = node('a', null, 'study it in ' + rec.lessonId);
        a.href = '#/module/' + rec.lessonId;
        obj.appendChild(a);
      }
      fb.appendChild(obj);

      check.hidden = true;
      retry.hidden = false;
    }

    return card;
  }

  /* ------------------------------------------------------- a question set */

  /* Renders a list of curriculum question records with a live tally.
     Returns the container. */
  function renderSet(host, recs, opts) {
    opts = opts || {};
    var wrap = node('div', 'kc-set');
    var tally = node('p', 'kc-set__tally');
    tally.setAttribute('aria-live', 'polite');
    var answered = {}, right = 0, count = 0;

    function paint() {
      tally.textContent = count
        ? count + ' of ' + recs.length + ' answered \u00b7 ' + right + ' correct'
        : recs.length + (recs.length === 1 ? ' question' : ' questions') + '. Each one is explained as soon as you answer it.';
    }

    recs.forEach(function (rec, i) {
      wrap.appendChild(questionCard(rec, {
        index: i, total: recs.length, model: opts.model, showLesson: opts.showLesson, src: opts.src,
        onAnswer: function (r, ok) {
          if (!(r.id in answered)) count++;
          else if (answered[r.id]) right--;
          answered[r.id] = ok;
          if (ok) right++;
          paint();
          if (opts.onAnswer) opts.onAnswer(r, ok, { count: count, right: right, total: recs.length });
        }
      }));
    });
    paint();
    host.appendChild(tally);
    host.appendChild(wrap);
    return wrap;
  }

  /* ------------------------------------------------------- lesson mount -- */

  function mount(root, route) {
    if (route.kind !== 'module' || !route.moduleId) return;
    var C = global.SC500Curriculum;

    var ready = C ? C.load().catch(function () { return null; }) : Promise.resolve(null);
    ready.then(function (model) {
      if (model && model.lessons[route.moduleId]) {
        var lesson = model.lessons[route.moduleId];
        var recs = lesson.questionIds.map(function (id) { return model.questions[id]; });
        if (!recs.length) return noQuiz(root, route);
        return render(root, route, recs, model);
      }
      /* No curriculum model: load the file directly. */
      return fetch('quizzes/' + route.moduleId + '.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (quiz) {
          if (!quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) return noQuiz(root, route);
          var recs = quiz.questions.map(function (q, i) {
            return { id: q.id || route.moduleId + '-q' + (i + 1), data: q, lessonId: route.moduleId, bulletId: null, domainId: null };
          });
          render(root, route, recs, null);
        });
    }).catch(function () { /* a lesson with no quiz says nothing */ });
  }

  /* Module 0 and appendices have no quiz by design. Say nothing there. For an
     exam lesson with no questions yet, the coverage view reports the gap. */
  function noQuiz() {}

  function slot(root) {
    /* lesson.js leaves a placeholder in the Check stage; use it if present. */
    var s = root.querySelector('[data-slot="knowledge-check"]');
    if (s) return s;
    var sec = node('section', 'quiz');
    root.appendChild(sec);
    return sec;
  }

  function render(root, route, recs, model) {
    var host = slot(root);
    host.id = 'knowledge-check';
    if (!host.querySelector('h2, h3')) host.appendChild(node('h2', null, 'Knowledge check'));

    var prevRec = P() && P().readQuiz ? P().readQuiz(route) : null;
    if (prevRec && prevRec.at) {
      host.appendChild(node('p', 'field__note',
        'Previous full attempt: ' + prevRec.correct + '/' + prevRec.total + ' on ' + fmtDate(prevRec.at) + '.'));
    }

    var summary = node('div', 'kc-summary');
    summary.hidden = true;

    renderSet(host, recs, {
      model: model,
      onAnswer: function (rec, ok, t) {
        if (global.SC500Lesson && global.SC500Lesson.refresh) global.SC500Lesson.refresh();
        if (t.count < t.total) return;
        /* Everything answered once: store the whole-quiz record the older
           views (Readiness, practice review) still read. */
        var weak = [];
        host.querySelectorAll('.kc[data-state="incorrect"]').forEach(function (c) {
          var r = recs.filter(function (x) { return x.id === c.dataset.qid; })[0];
          if (r && r.data.sub_skill && weak.indexOf(r.data.sub_skill) === -1) weak.push(r.data.sub_skill);
        });
        var pct = Math.round((t.right / t.total) * 100);
        if (P() && P().recordQuiz) {
          P().recordQuiz(route, { correct: t.right, total: t.total, pct: pct, at: new Date().toISOString(), weak: weak });
        }
        summary.hidden = false;
        summary.textContent = '';
        summary.appendChild(node('p', 'kc-summary__score', t.right + ' of ' + t.total + ' correct.'));
        if (weak.length) {
          summary.appendChild(node('p', null, 'Added to Needs review: ' + weak.join('; ') + '.'));
        } else {
          summary.appendChild(node('p', null, 'Knowledge check complete for this lesson.'));
        }
        if (global.SC500Nav) global.SC500Nav.refreshProgress();
        if (global.SC500Lesson && global.SC500Lesson.refresh) global.SC500Lesson.refresh();
      }
    });
    host.appendChild(summary);
  }

  global.SC500Quiz = { mount: mount, renderSet: renderSet, questionCard: questionCard };
})(window);
