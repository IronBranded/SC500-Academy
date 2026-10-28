/* compare.js - SC-500 guide
   The structured comparison component, and the #/compare view.

   SC-500 is built on controls that sound alike: managed identity or service
   principal, PIM or Conditional Access, Azure RBAC or Azure Policy, private
   endpoint or service endpoint. Appendix A6 already records the traps in
   prose and tables. This component asks every option the SAME questions, in
   the same order, so the difference is visible at a glance:

     security problem   what goes wrong without it
     purpose            what it is for
     layer              identity, network, data, governance, monitoring...
     scope              where it applies
     use it when        the requirement that selects it
     major difference   the one fact that separates it from the others
     limitation         what it does NOT solve
     depends on         what must already be true for it to work
     how to validate    how you prove it produced the outcome

   and then, for the comparison as a whole: the SC-500 takeaway, the trap, and
   the scenario clues that point to each option.

   Data: content/comparisons.json, loaded by curriculum.js and joined to the
   lessons each comparison names. Rendered inside lessons (Distinguish stage),
   in domain reviews, and on #/compare. */

(function (global) {
  'use strict';

  var FIELDS = [
    ['security_problem', 'Security problem it solves'],
    ['purpose', 'Purpose'],
    ['layer', 'Layer'],
    ['scope', 'Scope'],
    ['when_to_use', 'Use it when'],
    ['major_difference', 'Major difference'],
    ['limitation', 'Limitation'],
    ['dependency', 'Depends on'],
    ['validation', 'How to validate it']
  ];

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(text, href, cls) { var a = node('a', cls || null, text); a.href = href; return a; }
  function D() { return global.SC500Domains; }
  function C() { return global.SC500Curriculum; }

  function domainOf(x, model) {
    var l = (x.lessons || []).map(function (id) { return model.lessons[id]; }).filter(Boolean)[0];
    return l ? l.domainId : '00';
  }

  /* The side-by-side matrix: one row per question, one column per option.
     Below 640 px, learn.css turns it into one card per question with each
     option labelled, which is how you compare on a phone. */
  function matrix(x) {
    var wrap = node('div', 'table-scroll');
    var t = node('table', 'cmpx__table');
    var thead = node('thead'), hr = node('tr');
    var corner = node('th', null, '');
    corner.setAttribute('scope', 'col');
    corner.appendChild(node('span', 'visually-hidden', 'Question'));
    hr.appendChild(corner);
    x.options.forEach(function (o) {
      var th = node('th', null, o.name);
      th.setAttribute('scope', 'col');
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = node('tbody');
    FIELDS.forEach(function (f) {
      if (!x.options.some(function (o) { return o[f[0]]; })) return;
      var tr = node('tr');
      var th = node('th', null, f[1]);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      x.options.forEach(function (o) {
        var td = node('td', null, o[f[0]] || '—');
        td.dataset.label = o.name;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    t.dataset.stack = 'true';
    wrap.appendChild(t);
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Comparison: ' + x.title);
    return wrap;
  }

  function clues(x, level) {
    if (!Array.isArray(x.clues) || !x.clues.length) return null;
    var box = node('div', 'cmpx__clues');
    box.appendChild(node(level || 'h4', 'cmpx__h', 'Scenario clues'));
    var ul = node('ul');
    x.clues.forEach(function (c) {
      var li = node('li');
      li.appendChild(node('span', 'cmpx__clue', '“' + c.clue + '”'));
      li.appendChild(document.createTextNode(' → '));
      li.appendChild(node('strong', null, c.points_to));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  /* One comparison. opts.lessonId hides the "also in" link back to the
     current lesson; opts.full renders everything open (the #/compare page). */
  function card(x, model, opts) {
    opts = opts || {};
    var art = node('article', 'cmpx');
    var dom = domainOf(x, model);
    if (D()) D().paint(art, dom);
    art.id = 'cmp-' + x.id;

    var head = node('header', 'cmpx__head');
    var h = node(opts.full ? 'h1' : 'h3', 'cmpx__title', x.title);
    head.appendChild(h);
    if (x.question) head.appendChild(node('p', 'cmpx__question', x.question));
    var meta = node('p', 'cmpx__meta');
    (x.objectives || []).forEach(function (bid) {
      var b = model.bulletById[bid];
      var chip = node('span', 'obj-chip', bid);
      chip.title = b ? 'Objective ' + bid + ': ' + b.text : 'Objective ' + bid;
      meta.appendChild(chip);
      meta.appendChild(document.createTextNode(' '));
    });
    var others = (x.lessons || []).filter(function (id) { return id !== opts.lessonId && model.lessons[id]; });
    if (others.length) {
      meta.appendChild(document.createTextNode(opts.lessonId ? 'Also in ' : 'Taught in '));
      others.forEach(function (id, i) {
        if (i) meta.appendChild(document.createTextNode(', '));
        var a = link(id, '#/module/' + id, 'dom-link');
        a.title = model.lessons[id].title;
        if (D()) D().paint(a, model.lessons[id].domainId);
        meta.appendChild(a);
      });
    }
    head.appendChild(meta);
    art.appendChild(head);

    if (x.takeaway) {
      var tk = node('div', 'cmpx__takeaway');
      tk.appendChild(node('strong', null, 'SC-500 takeaway. '));
      tk.appendChild(document.createTextNode(x.takeaway));
      art.appendChild(tk);
    }

    var more = node('details', 'cmpx__more');
    more.open = !!opts.full || !!opts.open;
    more.appendChild(node('summary', null, 'Compare ' + x.options.map(function (o) { return o.name; }).join(' vs ') + ' side by side'));
    var body = node('div', 'cmpx__body');
    body.appendChild(matrix(x));
    var cl = clues(x, opts.full ? 'h2' : 'h4');
    if (cl) body.appendChild(cl);
    more.appendChild(body);
    art.appendChild(more);

    if (x.trap) {
      var trap = node('p', 'cmpx__trap');
      trap.appendChild(node('strong', null, 'The trap. '));
      trap.appendChild(document.createTextNode(x.trap));
      art.appendChild(trap);
    }

    var foot = node('p', 'cmpx__foot');
    if (!opts.full) foot.appendChild(link('Open this comparison on its own →', '#/compare/' + x.id));
    if (Array.isArray(x.sources) && x.sources.length) {
      var src = node('span', 'cmpx__sources');
      src.appendChild(document.createTextNode((opts.full ? '' : ' · ') + 'Microsoft Learn: '));
      x.sources.forEach(function (u, i) {
        if (i) src.appendChild(document.createTextNode(', '));
        var a = link(String(i + 1), u);
        a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', 'Source ' + (i + 1) + ' for ' + x.title);
        src.appendChild(a);
      });
      foot.appendChild(src);
    }
    art.appendChild(foot);
    return art;
  }

  /* ------------------------------------------------------------- the view */

  function view(root, manifest, id) {
    var wait = node('p', 'loading', 'Loading the comparisons…');
    root.appendChild(wait);
    C().load().then(function (model) {
      wait.remove();
      var head = node('header', 'view-head');
      root.appendChild(head);
      if (!model.comparisons.length) {
        head.appendChild(node('h1', null, 'Compare controls'));
        root.appendChild(node('div', 'empty', 'content/comparisons.json could not be read.'));
        return;
      }
      if (id) {
        var x = model.comparisonById[id];
        if (!x) {
          head.appendChild(node('h1', null, 'Compare controls'));
          root.appendChild(node('div', 'empty', 'There is no comparison called ' + id + '.'));
          return;
        }
        head.appendChild(link('← All comparisons', '#/compare', 'btn btn--small'));
        document.title = x.title + ' · SC500 Academy';
        root.appendChild(card(x, model, { full: true }));
        return;
      }
      head.appendChild(node('h1', null, 'Compare controls'));
      head.appendChild(node('p', 'view-head__sub',
        'The pairs SC-500 is built to confuse, each answered on the same nine questions: the security problem, purpose, layer, scope, when to use it, the major difference, its limitation, what it depends on, and how to validate it. Each ends with the SC-500 takeaway and the trap.'));

      /* Grouped by domain, in outline order. */
      var groups = {};
      model.comparisons.forEach(function (x) {
        var d = domainOf(x, model);
        (groups[d] = groups[d] || []).push(x);
      });
      var order = ['0A', '00'].concat(model.domains.map(function (d) { return d.id; }));
      var toc = node('nav', 'cmpx-toc');
      toc.setAttribute('aria-label', 'Comparisons');
      var tocList = node('ul');
      toc.appendChild(tocList);
      root.appendChild(toc);
      order.forEach(function (d) {
        if (!groups[d]) return;
        var sec = node('section', 'view-sec');
        if (D()) D().paint(sec, d);
        var h = node('h2', 'cov-dom__title');
        if (D()) { h.appendChild(D().icon(d, 18)); h.appendChild(node('span', null, D().info(d).short)); }
        sec.appendChild(h);
        groups[d].forEach(function (x) {
          sec.appendChild(card(x, model, {}));
          var li = node('li');
          li.appendChild(link(x.title, '#/compare/' + x.id));
          tocList.appendChild(li);
        });
        root.appendChild(sec);
      });
    }).catch(function (e) {
      wait.textContent = 'Could not load the curriculum: ' + (e && e.message || e);
    });
  }

  global.SC500Compare = { card: card, FIELDS: FIELDS };
  global.SC500Views = global.SC500Views || {};
  global.SC500Views.compare = view;
})(window);
