/* progress.js - SC-500 guide
   Client-side progress. No backend, no account, no telemetry.

   State lives in one localStorage key so export is a single JSON blob and
   "Reset all progress" is a single delete.

   Checkbox identity is a hash of the item's own text, not its position. Adding a
   step to a teardown checklist therefore does not silently un-tick everything
   below it; only editing an item's wording resets that one item. */

(function (global) {
  'use strict';

  var KEY = 'sc500:progress:v1';
  var state = null;

  /* ----------------------------------------------------------- persistence */

  function blank() { return { v: 1, items: {}, pages: {}, quiz: {} }; }

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : blank();
      if (!state || state.v !== 1) state = blank();
      state.items = state.items || {};
      state.pages = state.pages || {};
      state.quiz = state.quiz || {};
    } catch (e) {
      state = blank();
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(load())); }
    catch (e) { /* private browsing, quota - progress is best effort */ }
  }

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function pageKey(route) {
    return route.kind + ':' + (route.moduleId != null ? route.moduleId : route.idx);
  }

  /* ------------------------------------------------------------- querying */

  function pageStats(route) {
    var s = load();
    var prefix = pageKey(route) + ':';
    var total = 0, done = 0;
    for (var k in s.items) {
      if (k.indexOf(prefix) === 0) { total++; if (s.items[k]) done++; }
    }
    return { total: total, done: done, marked: !!s.pages[pageKey(route)] };
  }

  /* A page counts as complete when every checkbox on it is ticked, or - for
     pages with no checkboxes - when the reader marks it read. */
  function isComplete(kind, moduleId) {
    var route = { kind: kind, moduleId: moduleId };
    var st = pageStats(route);
    if (st.total > 0) return st.done === st.total;
    return st.marked;
  }

  function pagePercent(route) {
    var st = pageStats(route);
    if (st.total > 0) return Math.round((st.done / st.total) * 100);
    return st.marked ? 100 : 0;
  }

  /* -------------------------------------------------------- page controls */

  function mountPage(root, route) {
    var boxes = root.querySelectorAll('input[type="checkbox"]');
    var s = load();
    var key = pageKey(route);

    /* marked renders task lists disabled. Enable them and bind to storage. */
    for (var i = 0; i < boxes.length; i++) {
      (function (box) {
        var li = box.closest('li') || box.parentNode;
        var label = (li ? li.textContent : '').trim().slice(0, 160);
        var id = key + ':' + hash(label);

        box.disabled = false;
        box.checked = !!s.items[id];
        box.setAttribute('aria-label', label);
        if (li && li.classList) li.classList.add('task-list-item');

        box.addEventListener('change', function () {
          load().items[id] = box.checked;
          save();
          paintStrip(route);
          if (global.SC500Nav) global.SC500Nav.refreshProgress();
        });
      })(boxes[i]);
    }

    buildStrip(root, route, boxes.length);
  }

  function buildStrip(root, route, boxCount) {
    var strip = document.createElement('div');
    strip.className = 'progress-strip';
    strip.id = 'page-progress';

    var label = document.createElement('span');
    label.id = 'page-progress-label';
    strip.appendChild(label);

    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-labelledby', 'page-progress-label');
    var fill = document.createElement('span');
    fill.className = 'bar__fill';
    fill.id = 'page-progress-fill';
    bar.appendChild(fill);
    strip.appendChild(bar);

    /* Pages with no checklist get a read toggle instead. */
    if (!boxCount) {
      var mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'btn';
      mark.id = 'page-mark';
      mark.addEventListener('click', function () {
        var s = load(), k = pageKey(route);
        s.pages[k] = !s.pages[k];
        save();
        paintStrip(route);
        if (global.SC500Nav) global.SC500Nav.refreshProgress();
      });
      strip.appendChild(mark);
    }

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn';
    reset.dataset.variant = 'danger';
    reset.textContent = 'Reset this page';
    armConfirm(reset, 'Reset this page', 'Confirm reset', function () {
      var s = load(), k = pageKey(route), prefix = k + ':';
      Object.keys(s.items).forEach(function (id) { if (id.indexOf(prefix) === 0) delete s.items[id]; });
      delete s.pages[k];
      delete s.quiz[k];
      save();
      if (global.SC500App) global.SC500App.reroute();
      if (global.SC500Nav) global.SC500Nav.refreshProgress();
    });
    strip.appendChild(reset);

    var h1 = root.querySelector('h1');
    if (h1 && h1.nextSibling) h1.parentNode.insertBefore(strip, h1.nextSibling);
    else root.insertBefore(strip, root.firstChild);

    paintStrip(route);
  }

  function paintStrip(route) {
    var st = pageStats(route);
    var pct = pagePercent(route);
    var label = document.getElementById('page-progress-label');
    var fill = document.getElementById('page-progress-fill');
    var mark = document.getElementById('page-mark');
    var bar = fill ? fill.parentNode : null;

    if (label) label.textContent = st.total ? st.done + ' of ' + st.total + ' steps' : (st.marked ? 'Read' : 'Not read');
    if (fill) fill.style.width = pct + '%';
    if (bar) {
      bar.setAttribute('aria-valuenow', String(pct));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
    }
    if (mark) mark.textContent = st.marked ? 'Mark as unread' : 'Mark as read';
  }

  /* Two clicks, no dialog box. The second click is the confirmation. */
  function armConfirm(btn, idle, armed, action) {
    var timer = null;
    btn.addEventListener('click', function () {
      if (btn.dataset.confirm === 'armed') {
        clearTimeout(timer);
        delete btn.dataset.confirm;
        btn.textContent = idle;
        action();
        return;
      }
      btn.dataset.confirm = 'armed';
      btn.textContent = armed;
      timer = setTimeout(function () {
        delete btn.dataset.confirm;
        btn.textContent = idle;
      }, 4000);
    });
  }

  /* ------------------------------------------------------------ dashboard */

  function weightMid(weight) {
    var m = /(\d+)\s*-\s*(\d+)/.exec(String(weight || ''));
    if (m) return (parseInt(m[1], 10) + parseInt(m[2], 10)) / 2;
    var one = /(\d+)/.exec(String(weight || ''));
    return one ? parseInt(one[1], 10) : 0;
  }

  function domainStats(domain) {
    var pages = 0, done = 0;
    domain.modules.forEach(function (m) {
      pages++; if (isComplete('module', m.id)) done++;
      if (m.lab) { pages++; if (isComplete('lab', m.id)) done++; }
    });
    return { pages: pages, done: done, pct: pages ? Math.round((done / pages) * 100) : 0 };
  }

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* One line per module inside an expanded domain: the first drilldown level.
     Each chip is both a state indicator and a link, so the row is navigable
     rather than decorative. */
  function moduleLine(m) {
    var line = node('div', 'drill__row');

    var id = node('a', 'drill__id', m.id);
    id.href = '#/module/' + m.id;
    line.appendChild(id);

    var title = node('a', 'drill__title', m.title);
    title.href = '#/module/' + m.id;
    line.appendChild(title);

    var chips = node('div', 'chips');

    var modChip = node('a', 'chip', 'Module');
    modChip.href = '#/module/' + m.id;
    modChip.dataset.on = isComplete('module', m.id) ? 'true' : 'false';
    chips.appendChild(modChip);

    if (m.lab) {
      var st = pageStats({ kind: 'lab', moduleId: m.id });
      var labChip = node('a', 'chip', st.total ? 'Lab ' + st.done + '/' + st.total : 'Lab');
      labChip.href = '#/lab/' + m.id;
      labChip.dataset.on = isComplete('lab', m.id) ? 'true' : 'false';
      chips.appendChild(labChip);
    }

    var q = load().quiz['module:' + m.id];
    var qChip = node('a', 'chip', q ? 'Quiz ' + q.pct + '%' : 'Quiz');
    qChip.href = '#/module/' + m.id;
    qChip.dataset.on = (q && q.pct >= 80) ? 'true' : 'false';
    chips.appendChild(qChip);

    line.appendChild(chips);
    return line;
  }

  function mountDashboard(root, manifest) {
    var totalPages = 0, totalDone = 0;

    var overallWrap = node('div', 'progress-strip');
    var overallLabel = node('span', null, '');
    overallWrap.appendChild(overallLabel);
    var oBar = node('div', 'bar');
    var oFill = node('span', 'bar__fill');
    oBar.appendChild(oFill);
    overallWrap.appendChild(oBar);
    root.appendChild(overallWrap);

    var dash = node('div', 'dash');

    /* Row width encodes the exam weight; fill encodes your completion. Study
       time should follow exam weight, so both facts share one shape. Opening a
       row drills into its modules. */
    var maxWeight = 0;
    manifest.domains.forEach(function (d) { maxWeight = Math.max(maxWeight, weightMid(d.weight)); });

    manifest.domains.forEach(function (d) {
      var st = domainStats(d);
      totalPages += st.pages;
      totalDone += st.done;

      var row = node('details', 'dash__row');
      row.style.setProperty('--domain-tint', 'var(--domain-' + d.id + ')');

      var sum = document.createElement('summary');
      sum.className = 'dash__summary';

      var lab = node('div', 'dash__label');
      lab.appendChild(node('span', null, d.name));
      var w = node('span', 'dash__weight',
        (d.weight && d.weight !== 'n/a' ? d.weight + ' of the exam · ' : 'Prerequisite · ') +
        st.done + '/' + st.pages + ' pages');
      lab.appendChild(w);
      sum.appendChild(lab);

      var track = node('div', 'dash__track');
      var weightBar = node('div', 'dash__weightbar');
      var share = maxWeight ? (weightMid(d.weight) / maxWeight) * 100 : 100;
      weightBar.style.width = (d.weight === 'n/a' ? 100 : Math.max(share, 8)) + '%';

      var fill = node('div', 'dash__fill');
      fill.style.width = st.pct + '%';
      weightBar.appendChild(fill);
      track.appendChild(weightBar);
      sum.appendChild(track);

      row.appendChild(sum);

      var body = node('div', 'drill');
      d.modules.forEach(function (m) { body.appendChild(moduleLine(m)); });
      row.appendChild(body);

      dash.appendChild(row);
    });

    root.appendChild(dash);

    var pct = totalPages ? Math.round((totalDone / totalPages) * 100) : 0;
    overallLabel.textContent = totalDone + ' of ' + totalPages + ' pages complete';
    oFill.style.width = pct + '%';
    oBar.setAttribute('role', 'progressbar');
    oBar.setAttribute('aria-valuenow', String(pct));

    /* The second drilldown: coverage across the 87 sub-objectives. Optional -
       the dashboard still works if objectives.js is absent. */
    if (global.SC500Objectives) global.SC500Objectives.mount(root, manifest);

    root.appendChild(controls(manifest));
  }

  /* ----------------------------------------------- export / import / wipe */

  function controls(manifest) {
    var wrap = node('div', 'field');
    wrap.appendChild(node('h2', 'field__title', 'Your progress'));
    wrap.appendChild(node('p', 'field__note',
      'Progress is stored in this browser only. Clearing site data erases it, so export before you switch machines.'));

    var row = node('div', 'field__links');
    row.style.gap = 'var(--s-3)';

    var out = node('button', 'btn', 'Download progress');
    out.type = 'button';
    out.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sc500-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    row.appendChild(out);

    var file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';
    file.style.display = 'none';
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      f.text().then(function (txt) {
        var incoming = JSON.parse(txt);
        if (!incoming || incoming.v !== 1) throw new Error('Unrecognised file version');
        /* Merge rather than replace: importing on a machine that already has
           progress should never lose work. */
        var s = load();
        Object.keys(incoming.items || {}).forEach(function (k) { if (incoming.items[k]) s.items[k] = true; });
        Object.keys(incoming.pages || {}).forEach(function (k) { if (incoming.pages[k]) s.pages[k] = true; });
        Object.keys(incoming.quiz || {}).forEach(function (k) { s.quiz[k] = s.quiz[k] || incoming.quiz[k]; });
        save();
        if (global.SC500App) global.SC500App.reroute();
      }).catch(function (e) {
        window.alert('That file could not be read as SC500 progress: ' + e.message);
      });
      file.value = '';
    });

    var inBtn = node('button', 'btn', 'Import progress');
    inBtn.type = 'button';
    inBtn.addEventListener('click', function () { file.click(); });
    row.appendChild(inBtn);
    row.appendChild(file);

    var wipe = node('button', 'btn', 'Reset all progress');
    wipe.type = 'button';
    wipe.dataset.variant = 'danger';
    armConfirm(wipe, 'Reset all progress', 'Erase everything?', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = null;
      if (global.SC500App) global.SC500App.reroute();
      if (global.SC500Nav) global.SC500Nav.refreshProgress();
    });
    row.appendChild(wipe);

    wrap.appendChild(row);
    return wrap;
  }

  /* ---------------------------------------------------------- quiz bridge */

  function recordQuiz(route, result) {
    var s = load();
    s.quiz[pageKey(route)] = result;
    save();
  }
  function readQuiz(route) { return load().quiz[pageKey(route)] || null; }

  global.SC500Progress = {
    mountPage: mountPage,
    mountDashboard: mountDashboard,
    isComplete: isComplete,
    pagePercent: pagePercent,
    pageStats: pageStats,
    recordQuiz: recordQuiz,
    readQuiz: readQuiz
  };
})(window);
