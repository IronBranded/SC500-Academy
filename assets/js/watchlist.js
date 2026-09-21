/* watchlist.js - SC-500 guide
   #/preview - the verification watchlist.

   Two facts already live in every module's front matter and are invisible
   unless you open the file: whether it depends on a preview feature, and when
   its claims were last checked against the product documentation.

   Preview surfaces move. This guide's AI modules are half preview, and a module
   verified in September describing a feature that changed in October looks
   exactly like one that is still correct. The only defence is knowing which
   files to re-read first, which is what this view answers.

   Windows match the validator: the GA window is 90 days, preview is half of it
   with a floor of 30. Change one and change the other. */

(function (global) {
  'use strict';

  var GA_WINDOW = 90;
  var DAY = 86400000;
  var rows = null, job = null;

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function windowFor(status) {
    return status === 'Preview' ? Math.max(30, Math.round(GA_WINDOW / 2)) : GA_WINDOW;
  }

  function ageOf(dateStr) {
    var t = Date.parse(dateStr);
    if (isNaN(t)) return null;
    return Math.floor((Date.now() - t) / DAY);
  }

  /* Front matter for every module and appendix, read once. */
  function load(manifest) {
    if (rows) return Promise.resolve(rows);
    if (job) return job;

    var targets = [];
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (m) {
        targets.push({ id: m.id, title: m.title, domain: d.name, path: m.content, kind: 'module' });
      });
    });
    (manifest.appendix || []).forEach(function (a, i) {
      targets.push({ id: 'A' + (i + 1), title: a.title, domain: 'Appendix', path: a.content, kind: 'appendix', idx: i });
    });

    job = Promise.all(targets.map(function (t) {
      return fetch(t.path, { cache: 'force-cache' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (text) {
          if (!text) return null;
          var d = (global.SC500FrontMatter.parse(text).data) || {};
          t.status = d.status || 'GA';
          t.verified = d.last_verified || '';
          t.age = ageOf(t.verified);
          t.window = windowFor(t.status);
          t.over = (t.age == null) ? null : (t.age - t.window);
          t.subs = Array.isArray(d.sub_objectives) ? d.sub_objectives : [];
          return t;
        })
        .catch(function () { return null; });
    })).then(function (out) {
      rows = out.filter(Boolean);
      job = null;
      return rows;
    });

    return job;
  }

  /* Preview first, then the most overdue, then everything else. */
  function rank(r) {
    if (r.status === 'Preview') return 0;
    if (r.over != null && r.over > 0) return 1;
    return 2;
  }

  function href(r) {
    return r.kind === 'appendix' ? '#/appendix/' + r.idx : '#/module/' + r.id;
  }

  function table(host, list) {
    var tbl = node('table', 'pr__table');
    var thead = node('thead'), hr = node('tr');
    ['', 'Title', 'Status', 'Verified', 'Age', 'Window'].forEach(function (h) {
      hr.appendChild(node('th', null, h));
    });
    thead.appendChild(hr);
    tbl.appendChild(thead);

    var tb = node('tbody');
    list.forEach(function (r) {
      var tr = node('tr');
      tr.dataset.rank = String(rank(r));

      var idCell = node('td');
      var a = node('a', 'pr__ref', r.id);
      a.href = href(r);
      idCell.appendChild(a);
      tr.appendChild(idCell);

      tr.appendChild(node('td', null, r.title));
      tr.appendChild(node('td', null, r.status));
      tr.appendChild(node('td', null, r.verified || '\u2014'));
      tr.appendChild(node('td', null, r.age == null ? '\u2014' : r.age + ' d'));
      tr.appendChild(node('td', 'pr__status',
        r.over != null && r.over > 0 ? 'over by ' + r.over + ' d' : r.window + ' d'));

      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    host.appendChild(tbl);
  }

  function mount(root, manifest) {
    clear(root);
    root.appendChild(node('h1', null, 'Verification watchlist'));

    var host = node('div', 'pr');
    root.appendChild(host);
    host.appendChild(node('p', 'loading', 'Reading front matter\u2026'));

    load(manifest).then(function (list) {
      clear(host);
      if (!list.length) {
        var box = node('div', 'empty');
        box.appendChild(node('strong', null, 'Nothing to read.'));
        box.appendChild(document.createTextNode(' Serve the site rather than opening it from the file system.'));
        host.appendChild(box);
        return;
      }

      var sorted = list.slice().sort(function (a, b) {
        var ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        var oa = (a.over == null) ? -9999 : a.over;
        var ob = (b.over == null) ? -9999 : b.over;
        if (oa !== ob) return ob - oa;
        return a.id < b.id ? -1 : 1;
      });

      var preview = sorted.filter(function (r) { return r.status === 'Preview'; });
      var overdue = sorted.filter(function (r) { return r.status !== 'Preview' && r.over > 0; });

      var summary = node('div', 'field');
      summary.appendChild(node('h2', 'field__title',
        preview.length + ' preview, ' + overdue.length + ' past its window'));
      summary.appendChild(node('p', 'field__note',
        'Preview modules are listed first whatever their age, because a preview feature that changed last week looks identical to one that did not. ' +
        '"Verified" is the date someone re-read the product documentation - not the date the prose was last edited.'));
      host.appendChild(summary);

      if (preview.length) {
        var pb = node('div', 'field');
        pb.appendChild(node('h2', 'field__title', 'What the preview modules claim'));
        pb.appendChild(node('p', 'field__note',
          'These are the sub-objectives whose behaviour is most likely to have moved. Re-read these bullets against Microsoft Learn before trusting a lab step.'));
        var ul = node('ul', 'pr__list');
        preview.forEach(function (r) {
          r.subs.forEach(function (s) {
            var li = document.createElement('li');
            li.appendChild(document.createTextNode(s + ' \u2014 '));
            var a = node('a', 'pr__ref', r.id);
            a.href = href(r);
            li.appendChild(a);
            ul.appendChild(li);
          });
        });
        pb.appendChild(ul);
        host.appendChild(pb);
      }

      table(host, sorted);

      host.appendChild(node('p', 'field__note',
        'Bumping last_verified records a verification. Editing prose does not. If you re-check and nothing has changed, bump it anyway \u2014 that is the verification you want recorded.'));
    });
  }

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.preview = mount;
})(window);
