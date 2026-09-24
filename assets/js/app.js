/* app.js - SC-500 guide
   Router and page builder. Fetches Markdown at runtime, renders it, and builds
   the field card from the file's own front matter.

   Loads last, so it can use whatever else is present and degrade when something
   is still a stub. */

(function (global) {
  'use strict';

  var FM = global.SC500FrontMatter;
  var manifest = null;
  var index = {};                 // moduleId -> { module, domain }
  var contentEl, metaEl;

  /* ---------------------------------------------------------------- utils */

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fail(title, detail) {
    contentEl.textContent = '';
    var box = node('div', 'empty');
    box.appendChild(node('strong', null, title));
    box.appendChild(document.createElement('br'));
    box.appendChild(document.createTextNode(detail));
    contentEl.appendChild(box);
    metaEl.textContent = '';
  }

  function get(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText + ' for ' + url);
      return r;
    });
  }

  /* ------------------------------------------------------------- manifest */

  function buildIndex() {
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) { index[m.id] = { module: m, domain: d }; });
    });
  }

  /* --------------------------------------------------------------- render */

  function renderMarkdown(md) {
    if (!global.marked) {
      return null;   // handled by the caller with a real instruction
    }
    var parse = global.marked.parse || global.marked;
    return parse(md, { mangle: false, headerIds: true });
  }

  /* Rewrite the repository's relative .md links into hash routes, so the
     cross-references written in the content actually navigate. */
  /* Resolve a Markdown link the way GitHub does: relative to the file that
     contains it. The previous version stripped leading "../" and looked the
     remainder up as a repository path, which only worked for links written
     from labs/ (../../content/...). Links between lessons - ../00-lab-safety/
     from content/01-.../, or ./a5-... within the appendix - all fell through
     to "unresolved" and pointed at the dashboard. */
  function resolvePath(href, basePath) {
    try {
      var u = new URL(href, 'https://repo.invalid/' + (basePath || ''));
      return decodeURIComponent(u.pathname.replace(/^\//, ''));
    } catch (e) {
      return href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
    }
  }

  var REPO = 'https://github.com/IronBranded/SC500-Academy/blob/main/';

  function rewriteLinks(root, basePath) {
    var byPath = {};
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        byPath[m.content] = '#/module/' + m.id;
        if (m.lab) byPath[m.lab] = '#/lab/' + m.id;
      });
    });
    (manifest.appendix || []).forEach(function (a, i) { byPath[a.content] = '#/appendix/' + i; });

    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], href = a.getAttribute('href');
      if (/^https?:|^#|^mailto:/.test(href)) {
        if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        continue;
      }
      var clean = resolvePath(href.split('#')[0], basePath);
      var hit = byPath[clean];
      if (hit) { a.setAttribute('href', hit); continue; }

      /* Scripts and docs are real files in the repository but not pages of
         the site: send them to GitHub rather than to a 404. */
      if (/^(scripts|tools|docs|quizzes|flashcards)\//.test(clean) || /\.(ps1|json|yml)$/i.test(clean)) {
        a.setAttribute('href', REPO + clean);
        a.target = '_blank';
        a.rel = 'noopener';
        continue;
      }

      /* A relative link we cannot resolve is a content bug. Say so rather than
         leaving a link that silently 404s. */
      a.setAttribute('href', '#/');
      a.title = 'Unresolved link in source: ' + href;
      a.style.textDecorationStyle = 'dotted';
    }
  }

  function enhanceCode(root) {
    var pres = root.querySelectorAll('pre');
    for (var i = 0; i < pres.length; i++) {
      (function (pre) {
        /* The labs mix PowerShell, bash, KQL, Bicep, XML and JSON, often in one
           page. Naming the language is the cheapest way to stop someone pasting
           a Bicep block into a PowerShell prompt. */
        var codeEl = pre.querySelector('code[class*="language-"]');
        if (codeEl) {
          var m = /language-([\w-]+)/.exec(codeEl.className);
          if (m) codeEl.dataset.lang = m[1];
        }

        var btn = node('button', 'copy-btn', 'Copy');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          var code = pre.querySelector('code');
          var text = code ? code.textContent : pre.textContent;
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = 'Copied';
            btn.dataset.state = 'copied';
            setTimeout(function () { btn.textContent = 'Copy'; delete btn.dataset.state; }, 1600);
          }, function () {
            btn.textContent = 'Press Ctrl+C';
          });
        });
        pre.appendChild(btn);
      })(pres[i]);
    }
  }

  /* forensic_relevance has been in the front matter of all 27 files since the
     first module and has never been shown anywhere. It is the one field that
     separates this guide from a cram sheet, so it gets a callout of its own,
     directly under the title. */
  /* Certification-first redesign: the note moved from directly under the
     title to a collapsed panel at the end. It is useful context and it is not
     measured by SC-500, so it no longer sits between the learner and the
     objective. Lessons get the same panel from lesson.js. */
  function tacticalCallout(root, data) {
    if (!data || !data.forensic_relevance) return;
    var d = document.createElement('details');
    d.className = 'beyond';
    d.appendChild(node('summary', null, 'Beyond the exam: how this shows up in an investigation'));
    d.appendChild(node('p', 'field__note', 'Not measured by SC-500. Kept for context.'));
    d.appendChild(node('p', null, String(data.forensic_relevance)));
    root.appendChild(d);
  }

  /* Mermaid is 3.5 MB and no content file currently contains a diagram, so it
     is loaded on first use instead of on every page. */
  var mermaidJob = null;
  function loadMermaid() {
    if (global.mermaid) return Promise.resolve(global.mermaid);
    if (mermaidJob) return mermaidJob;
    mermaidJob = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'assets/js/vendor/mermaid.min.js';
      s.onload = function () { resolve(global.mermaid || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return mermaidJob;
  }

  /* Domain colours for diagrams. A node written with ":::d01" (or class d01)
     in a mermaid block takes domain 01's colour, so diagrams share the
     dashboard's vocabulary. Colour is never the only label: nodes keep text. */
  function domainClassDefs() {
    var cs = getComputedStyle(document.documentElement);
    return ['00', '01', '02', '03', '04'].map(function (id) {
      var c = cs.getPropertyValue('--d-' + id).trim() || '#888';
      var t = cs.getPropertyValue('--d-' + id + '-tint').trim() || 'transparent';
      return 'classDef d' + id + ' stroke:' + c + ',stroke-width:2px,fill:' + t + ';';
    }).join('\n');
  }

  /* Mermaid is optional. Vendor assets/js/vendor/mermaid.min.js and diagrams
     render; leave it out and a ```mermaid fence stays a readable code block.
     Progressive enhancement rather than a hard dependency, because offline
     capability is a stated constraint of this project. */
  function renderDiagrams(root) {
    var fences = root.querySelectorAll('pre > code.language-mermaid');
    if (!fences.length) return;
    if (!global.mermaid) {
      loadMermaid().then(function (m) { if (m) renderDiagrams(root); else markUnrendered(fences); });
      return;
    }
    drawDiagrams(fences);
  }

  function markUnrendered(fences) {
    {
      for (var i = 0; i < fences.length; i++) {
        var pre = fences[i].parentNode;
        pre.dataset.diagram = 'unrendered';
        pre.title = 'Vendor assets/js/vendor/mermaid.min.js to render this as a diagram';
      }
    }
  }

  function drawDiagrams(fences) {
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    try {
      global.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: dark ? 'dark' : 'neutral',
        /* Mermaid's dark edge-label background (#585858) gives 4.4:1 with its
           label text - just under AA. Use the page's raised surface instead. */
        themeVariables: dark ? { edgeLabelBackground: '#252423' } : {},
        fontFamily: getComputedStyle(document.body).getPropertyValue('--face-ui')
      });
    } catch (e) { return; }

    for (var j = 0; j < fences.length; j++) {
      (function (code, n) {
        var host = document.createElement('div');
        host.className = 'diagram';
        if (code.parentNode.id) host.id = code.parentNode.id;   // keeps #stage-visualize working
        code.parentNode.replaceWith(host);
        try {
          var src = code.textContent;
          if (/^\s*(flowchart|graph)\b/.test(src)) src = src.replace(/\s*$/, '\n' + domainClassDefs() + '\n');
          /* Accessible name: write accTitle / accDescr in the mermaid source and
             Mermaid puts them on the SVG as <title> and <desc>. */
          global.mermaid.render('mmd-' + n + '-' + Date.now(), src)
            .then(function (out) {
              host.innerHTML = out.svg;
              /* On a phone the diagram keeps a readable minimum width and
                 scrolls sideways, so the container must be reachable by
                 keyboard and carry a name (the diagram's own accTitle). */
              var t = host.querySelector('svg title');
              host.setAttribute('tabindex', '0');
              host.setAttribute('role', 'region');
              host.setAttribute('aria-label', 'Diagram: ' + (t ? t.textContent : 'illustration') + '. Scroll sideways on small screens.');
            })
            .catch(function () { host.textContent = code.textContent; host.dataset.failed = 'true'; });
        } catch (e) {
          host.textContent = code.textContent;
          host.dataset.failed = 'true';
        }
      })(fences[j], j);
    }
  }

  /* Every table scrolls inside its own box. Tables of three or more columns
     also get data-label on each cell, which learn.css uses to turn them into
     one card per row on narrow screens - that is the comparison component's
     mobile layout, and it applies to every comparison table in the content
     without the content changing. */
  var tableSeq = 0;
  function wrapTables(root) {
    var tables = root.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      var heads = t.querySelectorAll('thead th');
      /* A comparison table's corner cell is often blank in the Markdown; give
         it a name for screen readers without changing what is displayed. */
      if (heads[0] && !heads[0].textContent.trim()) {
        heads[0].appendChild(node('span', 'visually-hidden', 'Option'));
      }
      if (!(t.parentNode.classList && t.parentNode.classList.contains('table-scroll'))) {
        var wrap = node('div', 'table-scroll');
        /* Scrollable regions must be keyboard reachable, and a named region
           must have a unique name: use the table's own column headers. */
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('role', 'region');
        tableSeq++;
        var cols = Array.prototype.map.call(heads, function (h) { return h.textContent.trim(); }).filter(Boolean).slice(0, 3);
        wrap.setAttribute('aria-label', 'Table ' + tableSeq + (cols.length ? ': ' + cols.join(', ') : ''));
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      }
      if (heads.length < 3) continue;
      var labels = Array.prototype.map.call(heads, function (h) { return h.textContent.trim(); });
      t.dataset.stack = 'true';
      var rows = t.querySelectorAll('tbody tr');
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].children;
        for (var c = 0; c < cells.length; c++) {
          if (labels[c] && !cells[c].dataset.label) cells[c].dataset.label = labels[c];
        }
      }
    }
  }

  /* Links and tables for HTML rendered outside the page pipeline (A6
     distinctions inside a lesson, for instance). */
  function enhance(root, basePath) {
    rewriteLinks(root, basePath);
    wrapTables(root);
  }

  /* ----------------------------------------------------------- field card */

  function fieldRow(card, key, valueNode) {
    if (valueNode == null) return;
    var row = node('div', 'field__row');
    row.appendChild(node('span', 'field__key', key));
    var val = node('span', 'field__val');
    if (typeof valueNode === 'string') val.textContent = valueNode;
    else val.appendChild(valueNode);
    row.appendChild(val);
    card.appendChild(row);
  }

  function codeList(items) {
    var frag = document.createDocumentFragment();
    items.forEach(function (item, i) {
      if (i) frag.appendChild(document.createTextNode(' '));
      frag.appendChild(node('code', null, item));
    });
    return frag;
  }

  function buildField(data, ctx) {
    metaEl.textContent = '';
    if (!data || !Object.keys(data).length) return;

    var card = node('aside', 'field');
    card.appendChild(node('h2', 'field__title', ctx.kind === 'lab' ? 'Lab at a glance' : 'Module at a glance'));

    if (data.domain) fieldRow(card, 'Domain', data.domain + (data.domain_weight && data.domain_weight !== 'n/a' ? ' · ' + data.domain_weight : ''));

    if (data.status) {
      var st = node('span', 'status', data.status);
      st.dataset.status = data.status;
      fieldRow(card, 'Status', st);
    }

    if (data.lab_cost_estimate) {
      var level = FM.costLevel(data.lab_cost_estimate);
      var wrap = document.createDocumentFragment();

      var chip = node('span', 'cost', FM.costLabel(data.lab_cost_estimate));
      chip.dataset.level = level;
      wrap.appendChild(chip);

      /* Five steps, so HIGHEST reads as the top of a scale rather than as one
         more word. Cost is the only thing in this guide that compounds while
         you are not looking at it. */
      var meter = node('span', 'meter');
      meter.dataset.level = level;
      meter.setAttribute('role', 'img');
      meter.setAttribute('aria-label', 'Cost level: ' + FM.costLabel(data.lab_cost_estimate) + ' of 5');
      for (var s = 0; s < 5; s++) meter.appendChild(node('span', 'meter__step'));
      wrap.appendChild(meter);

      fieldRow(card, 'Cost', wrap);
    }

    if (data.licensing) fieldRow(card, 'Licensing', String(data.licensing));
    if (data.portal) fieldRow(card, 'Portal', String(data.portal));

    if (data.powershell_module) {
      var mods = String(data.powershell_module).split(/,\s*/).filter(Boolean);
      if (mods.length) fieldRow(card, 'PowerShell', codeList(mods));
    }
    if (data.az_cli_command) fieldRow(card, 'Azure CLI', node('code', null, String(data.az_cli_command)));

    if (Array.isArray(data.kql_tables) && data.kql_tables.length) {
      fieldRow(card, 'KQL tables', codeList(data.kql_tables));
    }

    if (Array.isArray(data.prerequisites) && data.prerequisites.length) {
      var frag = document.createDocumentFragment();
      data.prerequisites.forEach(function (id, i) {
        if (i) frag.appendChild(document.createTextNode(', '));
        var a = document.createElement('a');
        a.href = '#/module/' + id;
        a.textContent = id;
        frag.appendChild(a);
      });
      fieldRow(card, 'Prerequisites', frag);
    }

    if (data.last_verified) fieldRow(card, 'Verified', String(data.last_verified) + staleness(data.last_verified));

    if (data.lab_cost_estimate) {
      card.appendChild(node('p', 'field__note', String(data.lab_cost_estimate)));
    }

    /* Jump between a module and its lab without going back to the sidebar. */
    var mod = ctx.moduleId && index[ctx.moduleId];
    if (mod) {
      var links = node('div', 'field__links');
      if (ctx.kind === 'module' && mod.module.lab) {
        var toLab = document.createElement('a');
        toLab.href = '#/lab/' + ctx.moduleId;
        toLab.textContent = 'Go to the lab';
        links.appendChild(toLab);
      } else if (ctx.kind === 'lab') {
        var toMod = document.createElement('a');
        toMod.href = '#/module/' + ctx.moduleId;
        toMod.textContent = 'Back to the module';
        links.appendChild(toMod);
      }
      if (links.childNodes.length) card.appendChild(links);
    }

    metaEl.appendChild(card);
  }

  /* The validator warns at 60 days; the reader deserves the same warning. */
  function staleness(dateStr) {
    var d = Date.parse(dateStr);
    if (isNaN(d)) return '';
    var days = Math.floor((Date.now() - d) / 86400000);
    return days > 60 ? ' · ' + days + ' days old' : '';
  }

  /* --------------------------------------------------------------- routes */

  /* Views registered by views.js, practice.js, watchlist.js and review.js.
     A view listed here but missing at runtime shows a clear message instead
     of silently falling back to the dashboard - which is what #/exam,
     #/cards, #/review and #/preview did before this list existed. */
  var VIEWS = {
    cost: 'Cost planner', readiness: 'Readiness', exam: 'Mock exam', cards: 'Flashcards',
    review: 'Retention review', preview: 'Verification watchlist', coverage: 'Objective coverage',
    prep: 'Exam prep', domain: 'Domain review'
  };

  function parseRoute() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { kind: 'dashboard' };
    if (parts[0] === 'module' || parts[0] === 'lab') return { kind: parts[0], moduleId: parts[1], anchor: parts[2] || null };
    if (parts[0] === 'appendix') return { kind: 'appendix', idx: appendixIndex(parts[1]) };
    if (VIEWS[parts[0]]) return { kind: 'view', view: parts[0], arg1: parts[1] || null, arg2: parts[2] || null };
    return { kind: 'dashboard' };
  }

  /* #/appendix/5 (position) keeps working; #/appendix/a6 (file prefix) is
     stable when appendices are reordered. */
  function appendixIndex(key) {
    if (/^\d+$/.test(String(key))) return parseInt(key, 10);
    var list = (manifest && manifest.appendix) || [];
    for (var i = 0; i < list.length; i++) {
      if (new RegExp('/' + key + '-[^/]*\\.md$', 'i').test(list[i].content)) return i;
    }
    return -1;
  }

  function pathFor(route) {
    if (route.kind === 'appendix') {
      var a = (manifest.appendix || [])[route.idx];
      return a ? a.content : null;
    }
    var entry = index[route.moduleId];
    if (!entry) return null;
    return route.kind === 'lab' ? entry.module.lab : entry.module.content;
  }

  function showPage(route) {
    var path = pathFor(route);
    if (!path) { return fail('Page not found', 'Nothing in content/manifest.json matches this address. Check the link, or return to the dashboard.'); }

    contentEl.innerHTML = '<p class="loading">Loading…</p>';

    get(path).then(function (r) { return r.text(); }).then(function (text) {
      var parsed = FM.parse(text);
      var html = renderMarkdown(parsed.body);

      if (html === null) {
        return fail(
          'The Markdown renderer is missing.',
          'Drop a single-file Markdown parser at assets/js/vendor/marked.min.js and reload. ' +
          'See assets/js/vendor/README.md for the pinning convention.'
        );
      }

      contentEl.innerHTML = html;
      rewriteLinks(contentEl, path);
      wrapTables(contentEl);
      enhanceCode(contentEl);

      /* Labs have no front matter of their own; they borrow the module's so
         the lab header can show cost, licensing and resources created. */
      var fmReady = Promise.resolve(parsed.data);
      if (route.kind === 'lab' && index[route.moduleId]) {
        fmReady = get(index[route.moduleId].module.content)
          .then(function (r) { return r.text(); })
          .then(function (t) { return FM.parse(t).data; })
          .catch(function () { return {}; });
      }
      buildField(parsed.data, route);

      var L = global.SC500Lesson;
      var S = global.SC500Sections;
      var asLesson = route.kind === 'module' && L && L.mountModule(contentEl, route, parsed.data);

      /* Optional layers. Each is absent until its own file is written, and the
         page must not break in the meantime. Lesson pages are structured by
         lesson.js, so the older fold-and-wrap layers only tag callouts and
         tables there; labs and appendices keep the original treatment. */
      if (asLesson) {
        if (S && S.tagCallouts) S.tagCallouts(contentEl);
        if (S && S.tagTables) S.tagTables(contentEl);
      } else {
        if (global.SC500Tabs && global.SC500Tabs.mount) global.SC500Tabs.mount(contentEl);
        if (S && S.mount) S.mount(contentEl);
      }
      if (global.SC500Highlight && global.SC500Highlight.mount) global.SC500Highlight.mount(contentEl);
      if (global.SC500Progress && global.SC500Progress.mountPage) global.SC500Progress.mountPage(contentEl, route);
      renderDiagrams(contentEl);
      if (!asLesson) tacticalCallout(contentEl, parsed.data);
      if (route.kind === 'lab' && L && L.mountLab) {
        fmReady.then(function (fm) { if (parseRoute().moduleId === route.moduleId) L.mountLab(contentEl, route, fm); });
      }
      if (global.SC500Outline && global.SC500Outline.mount) global.SC500Outline.mount(contentEl, metaEl);
      if (global.SC500Quiz && global.SC500Quiz.mount) global.SC500Quiz.mount(contentEl, route);
      if (asLesson && L.enrich) L.enrich();
      if (global.SC500Progress && global.SC500Progress.recordVisit) global.SC500Progress.recordVisit(route);

      if (global.SC500Nav) {
        global.SC500Nav.setCurrent(route.kind, route.moduleId != null ? route.moduleId : route.idx);
        global.SC500Nav.refreshProgress();
      }

      document.title = (contentEl.querySelector('h1') || {}).textContent
        ? contentEl.querySelector('h1').textContent + ' · SC500 Academy'
        : 'SC500 Academy';

      contentEl.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      if (route.anchor) jumpTo(route.anchor);
    }).catch(function (err) {
      fail('That page did not load.', String(err.message || err) +
        '. If you opened this from the file system, serve it instead: python -m http.server 8080');
    });
  }

  /* #/module/01-01/check and friends: scroll to a stage once it exists. The
     knowledge check is filled asynchronously, so retry briefly. */
  function jumpTo(anchor) {
    var id = /^(orient|learn|visualize|distinguish|practice|check|review)$/.test(anchor) ? 'stage-' + anchor : anchor;
    var tries = 0;
    (function attempt() {
      var el = document.getElementById(id);
      if (el) { el.scrollIntoView({ block: 'start' }); return; }
      if (++tries < 20) setTimeout(attempt, 100);
    })();
  }

  function showDashboard() {
    contentEl.textContent = '';
    metaEl.textContent = '';

    var h1 = node('h1', null, 'SC500 Academy');
    contentEl.appendChild(h1);
    contentEl.appendChild(node('p', null,
      'Twenty-two modules and labs for Exam SC-500, built from Microsoft Learn documentation. ' +
      'Start with Module 0 - budget guardrails and just-in-time access - before creating any billable resource.'));

    if (global.SC500Progress && global.SC500Progress.mountDashboard) {
      global.SC500Progress.mountDashboard(contentEl, manifest);
    } else {
      var box = node('div', 'empty');
      box.appendChild(node('strong', null, 'Progress tracking is not wired up yet.'));
      box.appendChild(document.createTextNode(
        ' assets/js/progress.js is still a stub, so the domain dashboard has nothing to draw. Pick a module from the sidebar to start reading.'));
      contentEl.appendChild(box);
    }

    if (global.SC500Nav) global.SC500Nav.setCurrent('dashboard');
    document.title = 'SC500 Academy';
  }

  function showView(r) {
    var kind = r.view;
    contentEl.textContent = '';
    metaEl.textContent = '';
    if (!global.SC500Views || !global.SC500Views[kind]) {
      return fail('That view is unavailable.',
        'The script that provides ' + VIEWS[kind] + ' did not load. Check the script tags in index.html.');
    }
    document.title = VIEWS[kind] + ' · SC500 Academy';
    global.SC500Views[kind](contentEl, manifest, r.arg1, r.arg2);
    if (global.SC500Nav) global.SC500Nav.setCurrent(kind, r.arg1);
    contentEl.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function route() {
    var r = parseRoute();
    if (r.kind === 'dashboard') showDashboard();
    else if (r.kind === 'view') showView(r);
    else showPage(r);
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    contentEl = document.getElementById('content');
    metaEl = document.getElementById('meta');
    if (!contentEl) return;

    get('content/manifest.json').then(function (r) { return r.json(); }).then(function (json) {
      manifest = json;
      buildIndex();
      if (global.SC500Nav) global.SC500Nav.mount(manifest);
      if (global.SC500Search && global.SC500Search.mount) global.SC500Search.mount(manifest);
      if (global.SC500Palette && global.SC500Palette.mount) global.SC500Palette.mount(manifest);
      window.addEventListener('hashchange', function () {
        /* In-page anchors (#part-3, #stage-check) are not routes. */
        if (location.hash === '' || location.hash.indexOf('#/') === 0) route();
      });
      route();
      registerWorker();
    }).catch(function (err) {
      fail('The guide could not load its manifest.',
        String(err.message || err) +
        '. The site fetches Markdown at runtime, so file:// will not work. Serve the folder: python -m http.server 8080');
    });
  }

  /* Offline support (sw.js) existed but was never registered. It is skipped on
     localhost so that local preview always shows the files as edited. */
  function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    if (location.protocol !== 'https:') return;
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline is best effort */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.SC500App = { reroute: route, getManifest: function () { return manifest; }, enhance: enhance };
})(window);
