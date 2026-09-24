/* views.js - SC-500 guide
   Two derived views that answer questions the module pages cannot.

     #/cost       What can I afford to run this month?
     #/readiness  What should I study next?

   Both are computed from data that already exists - front matter and quiz
   history - so neither needs anything new from the reader. */

(function (global) {
  'use strict';

  var FM = global.SC500FrontMatter;
  var cache = null;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function load(manifest) {
    if (cache) return Promise.resolve(cache);
    var jobs = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        jobs.push(fetch(m.content, { cache: 'force-cache' })
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (t) {
            if (!t) return null;
            var data = FM.parse(t).data || {};
            return { id: m.id, title: m.title, hasLab: !!m.lab, domain: d, data: data };
          }).catch(function () { return null; }));
      });
    });
    return Promise.all(jobs).then(function (rows) {
      cache = rows.filter(Boolean);
      return cache;
    });
  }

  var ORDER = { none: 0, low: 1, mid: 2, high: 3, max: 4 };

  /* Hourly meters are named in the labs and in appendix A2. Flagging them here
     matters more than the level chip: a Low lab you forget costs nothing, and a
     HIGH one costs by the hour whether or not you are looking at it. */
  var METERED = {
    '02-04': 'Azure Firewall',
    '03-03': 'API Management',
    '03-04': 'Bastion + Defender for Servers',
    '03-05': 'AKS node pool',
    '03-06': 'Application Gateway WAF',
    '04-05': 'Security Copilot SCUs'
  };

  /* ------------------------------------------------------------ cost view */

  function costView(root, manifest) {
    root.appendChild(node('h1', null, 'Cost planner'));
    root.appendChild(node('p', null,
      'Every lab, ordered by what it will cost you to run. Azure pay-as-you-go has no spending cap, ' +
      'so this is a planning tool rather than a guarantee — the control is teardown discipline.'));

    var wrap = node('div', 'plan');
    root.appendChild(wrap);

    load(manifest).then(function (rows) {
      var labs = rows.filter(function (r) { return r.hasLab; });
      labs.sort(function (a, b) {
        var d = ORDER[FM.costLevel(b.data.lab_cost_estimate)] - ORDER[FM.costLevel(a.data.lab_cost_estimate)];
        return d || a.id.localeCompare(b.id);
      });

      var buckets = { max: [], high: [], mid: [], low: [], none: [] };
      labs.forEach(function (r) { buckets[FM.costLevel(r.data.lab_cost_estimate)].push(r); });

      var LABEL = {
        max:  ['Highest', 'Run once, deprovision in the same session.'],
        high: ['High', 'Hourly meters. Build the free parts first, start a timer when the meter lands.'],
        mid:  ['Medium', 'Real but contained. Same-day teardown.'],
        low:  ['Low', 'Pennies, but Defender plans here bill at subscription scope.'],
        none: ['No Azure cost', 'Microsoft 365 E5 only, or no billable resource.']
      };

      ['max', 'high', 'mid', 'low', 'none'].forEach(function (lvl) {
        if (!buckets[lvl].length) return;

        var group = node('section', 'plan__group');
        var head = node('div', 'plan__head');
        var chip = node('span', 'cost', LABEL[lvl][0]);
        chip.dataset.level = lvl;
        head.appendChild(chip);
        head.appendChild(node('span', 'plan__note', LABEL[lvl][1]));
        head.appendChild(node('span', 'plan__count', buckets[lvl].length + ' labs'));
        group.appendChild(head);

        buckets[lvl].forEach(function (r) {
          var row = node('a', 'plan__row');
          row.href = '#/lab/' + r.id;
          row.appendChild(node('span', 'drill__id', r.id));

          var body = node('span', 'plan__body');
          body.appendChild(node('span', 'plan__title', r.title));
          body.appendChild(node('span', 'plan__est', String(r.data.lab_cost_estimate || '')));
          row.appendChild(body);

          if (METERED[r.id]) {
            var m = node('span', 'plan__meter', 'hourly · ' + METERED[r.id]);
            row.appendChild(m);
          }
          group.appendChild(row);
        });

        wrap.appendChild(group);
      });

      var total = labs.length;
      var paid = labs.filter(function (r) { return FM.costLevel(r.data.lab_cost_estimate) !== 'none'; }).length;
      root.appendChild(node('p', 'field__note',
        total + ' labs, of which ' + (total - paid) + ' cost nothing in Azure and ' +
        Object.keys(METERED).length + ' carry an hourly meter. ' +
        'The six meters are the only ones that can run away while you are not watching.'));
    });
  }

  /* ------------------------------------------------------- readiness view */

  function readinessView(root, manifest) {
    root.appendChild(node('h1', null, 'Readiness'));
    root.appendChild(node('p', null,
      'What to study next, ranked by exam weight and by what your quiz answers actually got wrong. ' +
      'Nothing here is self-reported — it is derived from your progress and attempts.'));

    var wrap = node('div', 'ready');
    root.appendChild(wrap);

    var P = global.SC500Progress;
    if (!P) { wrap.appendChild(node('div', 'empty', 'Progress tracking is unavailable.')); return; }

    load(manifest).then(function (rows) {
      /* Weakest sub-objectives first: every quiz attempt records which sub_skill
         a wrong answer belonged to. */
      var weak = {};
      rows.forEach(function (r) {
        var q = P.readQuiz({ kind: 'module', moduleId: r.id });
        if (q && q.weak) q.weak.forEach(function (w) {
          weak[w] = weak[w] || { count: 0, module: r.id, domain: r.domain.name };
          weak[w].count++;
        });
      });

      var weakList = Object.keys(weak).map(function (k) {
        return { sub: k, count: weak[k].count, module: weak[k].module, domain: weak[k].domain };
      }).sort(function (a, b) { return b.count - a.count; });

      var s1 = node('section', 'ready__block');
      s1.appendChild(node('h2', null, 'Missed in a knowledge check'));
      if (!weakList.length) {
        s1.appendChild(node('div', 'empty',
          'No quiz attempts recorded yet. Take a knowledge check and this fills in with the exact sub-objectives you missed.'));
      } else {
        weakList.forEach(function (w) {
          var a = node('a', 'ready__row');
          a.href = '#/module/' + w.module;
          a.dataset.weight = 'high';
          a.appendChild(node('span', 'drill__id', w.module));
          var b = node('span', 'plan__body');
          b.appendChild(node('span', 'plan__title', w.sub));
          b.appendChild(node('span', 'plan__est', w.domain));
          a.appendChild(b);
          a.appendChild(node('span', 'chip', 'missed ×' + w.count));
          s1.appendChild(a);
        });
      }
      wrap.appendChild(s1);

      /* Untouched modules, heaviest exam domain first. Study time should follow
         exam weight - the same argument as the dashboard bars. */
      function mid(w) {
        var m = /(\d+)\s*-\s*(\d+)/.exec(String(w || ''));
        return m ? (+m[1] + +m[2]) / 2 : 0;
      }
      var todo = rows.filter(function (r) { return !P.isComplete('module', r.id); })
        .sort(function (a, b) {
          return mid(b.domain.weight) - mid(a.domain.weight) || a.id.localeCompare(b.id);
        });

      var s2 = node('section', 'ready__block');
      s2.appendChild(node('h2', null, 'Not yet read, heaviest domains first'));
      if (!todo.length) {
        s2.appendChild(node('div', 'empty', 'Every module is marked read. Work through the knowledge checks next.'));
      } else {
        todo.forEach(function (r) {
          var a = node('a', 'ready__row');
          a.href = '#/module/' + r.id;
          a.appendChild(node('span', 'drill__id', r.id));
          var b = node('span', 'plan__body');
          b.appendChild(node('span', 'plan__title', r.title));
          b.appendChild(node('span', 'plan__est',
            r.domain.name + (r.domain.weight !== 'n/a' ? ' · ' + r.domain.weight : '')));
          a.appendChild(b);
          if (r.data.status === 'Preview') {
            var st = node('span', 'status', 'Preview');
            st.dataset.status = 'Preview';
            a.appendChild(st);
          }
          s2.appendChild(a);
        });
      }
      wrap.appendChild(s2);

      /* Labs left undone on modules already read - the gap between having read
         about a control and having configured one. */
      var gap = rows.filter(function (r) {
        return r.hasLab && P.isComplete('module', r.id) && !P.isComplete('lab', r.id);
      });
      if (gap.length) {
        var s3 = node('section', 'ready__block');
        s3.appendChild(node('h2', null, 'Read, but the lab is unfinished'));
        gap.forEach(function (r) {
          var st = P.pageStats({ kind: 'lab', moduleId: r.id });
          var a = node('a', 'ready__row');
          a.href = '#/lab/' + r.id;
          a.appendChild(node('span', 'drill__id', r.id));
          var b = node('span', 'plan__body');
          b.appendChild(node('span', 'plan__title', r.title));
          b.appendChild(node('span', 'plan__est', String(r.data.lab_cost_estimate || '')));
          a.appendChild(b);
          var c = node('span', 'chip', st.total ? st.done + '/' + st.total + ' steps' : 'not started');
          c.dataset.on = 'false';
          a.appendChild(c);
          s3.appendChild(a);
        });
        wrap.appendChild(s3);
      }
    });
  }

  /* Merge rather than assign, so load order between the view files never
     matters (practice.js, watchlist.js and review.js register here too). */
  global.SC500Views = global.SC500Views || {};
  global.SC500Views.cost = costView;
  global.SC500Views.readiness = readinessView;
})(window);
