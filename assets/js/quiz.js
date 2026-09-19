/* quiz.js - SC-500 guide
   Knowledge check at the end of a module.

   Quiz data lives in quizzes/<module-id>.json, deliberately separate from the
   prose: editing a question never touches content, and rewriting a module never
   invalidates its questions silently - the sub_skill field is the join.

   A module with no quiz file simply has no quiz. That is not an error, and the
   page says nothing about it. */

(function (global) {
  'use strict';

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function shuffleStable(arr, seed) {
    /* Options are presented in file order. Randomising them would make the
       explanations ("the third option is the trap") impossible to write. */
    return arr;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var s = a.slice().sort().join('|');
    return s === b.slice().sort().join('|');
  }

  function render(root, route, quiz) {
    var wrap = node('section', 'quiz');
    wrap.id = 'knowledge-check';

    var h2 = node('h2', null, 'Knowledge check');
    wrap.appendChild(h2);

    var intro = node('p', null,
      quiz.questions.length + ' exam-style questions. Answers are scored in this browser and stored with your progress.');
    wrap.appendChild(intro);

    var form = document.createElement('div');
    form.className = 'quiz__form';

    quiz.questions.forEach(function (q, qi) {
      var multi = Array.isArray(q.answer) && q.answer.length > 1;
      var block = node('details', 'depth');
      block.open = true;
      block.dataset.qid = q.id || String(qi);

      var sum = node('summary', null, 'Question ' + (qi + 1));
      block.appendChild(sum);

      var body = document.createElement('div');
      body.appendChild(node('p', null, q.prompt));
      if (multi) body.appendChild(node('p', 'field__note', 'Select all that apply.'));

      var list = node('ul', 'nav-list');
      list.style.paddingLeft = '0';

      q.options.forEach(function (opt, oi) {
        var li = document.createElement('li');
        li.style.listStyle = 'none';
        var id = 'q' + qi + 'o' + oi;

        var input = document.createElement('input');
        input.type = multi ? 'checkbox' : 'radio';
        input.name = 'q' + qi;
        input.value = String(oi);
        input.id = id;

        var label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = ' ' + opt;

        li.appendChild(input);
        li.appendChild(label);
        list.appendChild(li);
      });

      body.appendChild(list);

      var verdict = node('p', 'field__note', '');
      verdict.dataset.role = 'verdict';
      verdict.hidden = true;
      body.appendChild(verdict);

      block.appendChild(body);
      form.appendChild(block);
    });

    wrap.appendChild(form);

    var actions = node('div', 'field__links');
    actions.style.gap = 'var(--s-3)';

    var check = node('button', 'btn', 'Check answers');
    check.type = 'button';
    actions.appendChild(check);

    var retry = node('button', 'btn', 'Clear answers');
    retry.type = 'button';
    retry.addEventListener('click', function () {
      form.querySelectorAll('input').forEach(function (i) { i.checked = false; i.disabled = false; });
      form.querySelectorAll('[data-role="verdict"]').forEach(function (v) { v.hidden = true; v.textContent = ''; });
      result.textContent = '';
    });
    actions.appendChild(retry);

    var result = node('p', null, '');
    result.style.fontWeight = '600';

    check.addEventListener('click', function () {
      var correct = 0;
      var weak = {};

      quiz.questions.forEach(function (q, qi) {
        var chosen = [];
        form.querySelectorAll('input[name="q' + qi + '"]:checked').forEach(function (i) {
          chosen.push(parseInt(i.value, 10));
        });

        var expected = Array.isArray(q.answer) ? q.answer : [q.answer];
        var ok = sameSet(chosen, expected);
        if (ok) correct++;
        else if (q.sub_skill) weak[q.sub_skill] = (weak[q.sub_skill] || 0) + 1;

        var block = form.children[qi];
        var verdict = block.querySelector('[data-role="verdict"]');
        verdict.hidden = false;
        verdict.textContent = (ok ? 'Correct. ' : 'Not quite. ') + (q.explanation || '');
        verdict.style.color = ok ? 'var(--cost-none)' : 'var(--cost-high)';
        block.open = !ok;   /* leave the ones you got wrong open */
      });

      var pct = Math.round((correct / quiz.questions.length) * 100);
      result.textContent = correct + ' of ' + quiz.questions.length + ' correct (' + pct + '%).';

      /* Point back at the sub-skill rather than at a score. A wrong answer is
         useful only if it names what to re-read. */
      var missed = Object.keys(weak);
      if (missed.length) {
        result.textContent += ' Re-read: ' + missed.join('; ') + '.';
      }

      if (global.SC500Progress && global.SC500Progress.recordQuiz) {
        global.SC500Progress.recordQuiz(route, {
          correct: correct, total: quiz.questions.length, pct: pct,
          at: new Date().toISOString(), weak: missed
        });
      }
    });

    wrap.appendChild(actions);
    wrap.appendChild(result);

    /* Previous attempt, if any. */
    if (global.SC500Progress && global.SC500Progress.readQuiz) {
      var prev = global.SC500Progress.readQuiz(route);
      if (prev) {
        var note = node('p', 'field__note',
          'Last attempt: ' + prev.correct + '/' + prev.total + ' on ' + prev.at.slice(0, 10) +
          (prev.weak && prev.weak.length ? ' · weakest: ' + prev.weak.join('; ') : ''));
        wrap.insertBefore(note, form);
      }
    }

    root.appendChild(wrap);
  }

  function mount(root, route) {
    if (route.kind !== 'module' || !route.moduleId) return;

    fetch('quizzes/' + route.moduleId + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (quiz) {
        if (!quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) return;
        render(root, route, quiz);
      })
      .catch(function () { /* no quiz for this module yet - say nothing */ });
  }

  global.SC500Quiz = { mount: mount };
})(window);
