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
  function rewriteLinks(root) {
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
      var clean = href.split('#')[0].replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
      var hit = byPath[clean];
      if (hit) { a.setAttribute('href', hit); continue; }

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
  function tacticalCallout(root, data) {
    if (!data || !data.forensic_relevance) return;
    var q = document.createElement('blockquote');
    q.dataset.callout = 'tactical';
    q.dataset.label = 'In an investigation';
    var p = document.createElement('p');
    p.textContent = String(data.forensic_relevance);
    q.appendChild(p);

    var anchor = root.querySelector('h1');
    var after = anchor ? anchor.nextSibling : root.firstChild;
    /* Sit below the progress strip if one is already there. */
    var strip = root.querySelector('.progress-strip');
    if (strip && strip.nextSibling) after = strip.nextSibling;
    root.insertBefore(q, after);
  }

  /* Mermaid is optional. Vendor assets/js/vendor/mermaid.min.js and diagrams
     render; leave it out and a ```mermaid fence stays a readable code block.
     Progressive enhancement rather than a hard dependency, because offline
     capability is a stated constraint of this project. */
  function renderDiagrams(root) {
    var fences = root.querySelectorAll('pre > code.language-mermaid');
    if (!fences.length) return;

    if (!global.mermaid) {
      for (var i = 0; i < fences.length; i++) {
        var pre = fences[i].parentNode;
        pre.dataset.diagram = 'unrendered';
        pre.title = 'Vendor assets/js/vendor/mermaid.min.js to render this as a diagram';
      }
      return;
    }

    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    try {
      global.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: dark ? 'dark' : 'neutral',
        fontFamily: getComputedStyle(document.body).getPropertyValue('--face-ui')
      });
    } catch (e) { return; }

    for (var j = 0; j < fences.length; j++) {
      (function (code, n) {
        var host = document.createElement('div');
        host.className = 'diagram';
        code.parentNode.replaceWith(host);
        try {
          global.mermaid.render('mmd-' + n + '-' + Date.now(), code.textContent)
            .then(function (out) { host.innerHTML = out.svg; })
            .catch(function () { host.textContent = code.textContent; host.dataset.failed = 'true'; });
        } catch (e) {
          host.textContent = code.textContent;
          host.dataset.failed = 'true';
        }
      })(fences[j], j);
    }
  }

  function wrapTables(root) {
    var tables = root.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (t.parentNode.classList && t.parentNode.classList.contains('table-scroll')) continue;
      var wrap = node('div', 'table-scroll');
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    }
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

  function parseRoute() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { kind: 'dashboard' };
    if (parts[0] === 'module' || parts[0] === 'lab') return { kind: parts[0], moduleId: parts[1] };
    if (parts[0] === 'appendix') return { kind: 'appendix', idx: parseInt(parts[1], 10) };
    if (parts[0] === 'cost') return { kind: 'cost' };
    if (parts[0] === 'readiness') return { kind: 'readiness' };
    return { kind: 'dashboard' };
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
      rewriteLinks(contentEl);
      wrapTables(contentEl);
      enhanceCode(contentEl);
      buildField(parsed.data, route);

      /* Optional layers. Each is absent until its own file is written, and the
         page must not break in the meantime. */
      if (global.SC500Tabs && global.SC500Tabs.mount) global.SC500Tabs.mount(contentEl);
      if (global.SC500Sections && global.SC500Sections.mount) global.SC500Sections.mount(contentEl);
      if (global.SC500Highlight && global.SC500Highlight.mount) global.SC500Highlight.mount(contentEl);
      if (global.SC500Progress && global.SC500Progress.mountPage) global.SC500Progress.mountPage(contentEl, route);
      renderDiagrams(contentEl);
      tacticalCallout(contentEl, parsed.data);
      if (global.SC500Outline && global.SC500Outline.mount) global.SC500Outline.mount(contentEl, metaEl);
      if (global.SC500Quiz && global.SC500Quiz.mount) global.SC500Quiz.mount(contentEl, route);

      if (global.SC500Nav) {
        global.SC500Nav.setCurrent(route.kind, route.moduleId != null ? route.moduleId : route.idx);
        global.SC500Nav.refreshProgress();
      }

      document.title = (contentEl.querySelector('h1') || {}).textContent
        ? contentEl.querySelector('h1').textContent + ' · SC500 Academy'
        : 'SC500 Academy';

      contentEl.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }).catch(function (err) {
      fail('That page did not load.', String(err.message || err) +
        '. If you opened this from the file system, serve it instead: python -m http.server 8080');
    });
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

  function showView(kind) {
    contentEl.textContent = '';
    metaEl.textContent = '';
    if (!global.SC500Views || !global.SC500Views[kind]) {
      return fail('That view is unavailable.',
        'assets/js/views.js did not load. Check the script tag in index.html.');
    }
    global.SC500Views[kind](contentEl, manifest);
    if (global.SC500Nav) global.SC500Nav.setCurrent(kind);
    document.title = (kind === 'cost' ? 'Cost planner' : 'Readiness') + ' · SC500 Academy';
    window.scrollTo(0, 0);
  }

  function route() {
    var r = parseRoute();
    if (r.kind === 'dashboard') showDashboard();
    else if (r.kind === 'cost' || r.kind === 'readiness') showView(r.kind);
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
      window.addEventListener('hashchange', route);
      route();
    }).catch(function (err) {
      fail('The guide could not load its manifest.',
        String(err.message || err) +
        '. The site fetches Markdown at runtime, so file:// will not work. Serve the folder: python -m http.server 8080');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.SC500App = { reroute: route, getManifest: function () { return manifest; } };
})(window);
