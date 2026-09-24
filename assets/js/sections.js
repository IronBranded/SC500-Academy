/* sections.js - SC-500 guide
   Section silhouettes.

   Every module is built from the same six or seven shapes, and right now they
   are typographically identical - so the exam-phrasing table, which is the
   highest-value thing on the page, looks exactly like a settings reference.

   This tags each section and each table with what it IS, so CSS can give each
   shape a recognisable silhouette. Pages then become navigable by recognition
   rather than by reading every heading.

   Nothing here changes content. A module using a heading not listed below simply
   renders as plain prose, which is the correct failure. */

(function (global) {
  'use strict';

  /* heading text (lowercased) -> shape */
  var SHAPES = {
    'sub-objectives covered':      'objectives',
    'why this exists':             'concept',
    'how it works under the hood': 'mechanism',
    'configuration surface':       'config',
    'common failure modes':        'failure',
    'how this is tested':          'exam',
    'hands-on':                    'handoff',
    'check yourself':              'selfcheck',
    'sources':                     'sources',
    'prerequisites':               'prereq',
    'validation':                  'validation',
    'teardown':                    'teardown',
    'knowledge check':             'quiz'
  };

  /* Column-header fingerprints. The same table markup means very different
     things depending on what its first header says. */
  var TABLE_KINDS = [
    { kind: 'exam',    test: /phrase in the question|what it steers|what it points/i },
    { kind: 'config',  test: /^(setting|control)$/i },
    { kind: 'compare', test: /^$/ }          // leading blank header = a comparison
  ];

  function norm(el) {
    return (el.textContent || '').replace(/§$/, '').trim().toLowerCase();
  }

  function shapeOf(text) {
    if (SHAPES[text]) return SHAPES[text];
    /* Lab parts are numbered and varied: "Part 3 - Firewall rules". */
    if (/^part\s+\d/.test(text)) return 'part';
    return null;
  }

  /* Walk from a heading to the next heading of the same or higher rank. */
  function sectionNodes(head) {
    var stop = head.tagName === 'SUMMARY' ? null : head.tagName;
    var out = [], n = head.nextSibling;
    while (n) {
      if (n.nodeType === 1 && stop && /^H[1-6]$/.test(n.tagName) && n.tagName <= stop) break;
      out.push(n);
      n = n.nextSibling;
    }
    return out;
  }

  function tagTables(root) {
    var tables = root.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      var first = t.querySelector('thead th');
      var head = first ? first.textContent.trim() : '';
      var kind = 'data';
      for (var k = 0; k < TABLE_KINDS.length; k++) {
        if (TABLE_KINDS[k].test.test(head)) { kind = TABLE_KINDS[k].kind; break; }
      }
      t.dataset.table = kind;

      /* Cost words inside any table cell get the cost colour, so the licensing
         and plan tables read at a glance. */
      var cells = t.querySelectorAll('td');
      for (var c = 0; c < cells.length; c++) {
        var txt = cells[c].textContent;
        if (/\bHIGHEST\b/.test(txt)) cells[c].dataset.cost = 'max';
        else if (/\bHIGH\b/.test(txt)) cells[c].dataset.cost = 'high';
        else if (/\$0\b/.test(txt)) cells[c].dataset.cost = 'none';
      }
    }
  }

  /* The teardown buckets are numbered h3s. Numbering them visually turns a long
     checklist into six recognisable groups. */
  function tagTeardown(root) {
    var heads = root.querySelectorAll('h3');
    for (var i = 0; i < heads.length; i++) {
      var m = /^(\d)\.\s+(.*)$/.exec(norm(heads[i]));
      if (!m) continue;
      var inTeardown = false, p = heads[i].previousElementSibling;
      while (p) {
        if (/^H2$/.test(p.tagName) && /teardown/i.test(p.textContent)) { inTeardown = true; break; }
        if (/^H2$/.test(p.tagName)) break;
        p = p.previousElementSibling;
      }
      if (inTeardown) {
        heads[i].dataset.bucket = m[1];
        heads[i].classList.add('bucket');
      }
    }
  }

  /* Callout typing.

     The content already writes its warnings as blockquotes opening with a bold
     lead - "**Cost warning, read before clicking.**", "**Licensing gate.**",
     "**AZ-500 divergence.**". Rather than asking 27 files to adopt a new syntax,
     detect the lead and colour-code what is already there. */
  var CALLOUTS = [
    { kind: 'warn',     test: /^(cost|warning|caution|danger|licensing gate|cost gate|cost warning|cost box|mandatory|do not|never)\b/i },
    { kind: 'exam',     test: /^(az-500 divergence|exam|on the exam|changing default|dated change|naming|status:|portal transition)\b/i },
    { kind: 'tactical', test: /^(forensic|in an investigation|tactical|note that|detail worth|one-glance)\b/i }
  ];

  function tagCallouts(root) {
    var quotes = root.querySelectorAll('blockquote');
    for (var i = 0; i < quotes.length; i++) {
      var q = quotes[i];
      var lead = q.querySelector('strong');
      var text = (lead ? lead.textContent : q.textContent).trim();
      var kind = 'note';
      for (var c = 0; c < CALLOUTS.length; c++) {
        if (CALLOUTS[c].test.test(text)) { kind = CALLOUTS[c].kind; break; }
      }
      /* A cost figure anywhere in a short callout outranks the lead word. */
      if (kind === 'note' && /\b(HIGHEST|HIGH|hourly|bills? by the hour|per hour)\b/.test(q.textContent)) kind = 'warn';
      q.dataset.callout = kind;
    }
  }

  function mount(root) {
    var heads = root.querySelectorAll('h2, details.depth > summary');

    for (var i = 0; i < heads.length; i++) {
      var head = heads[i];
      var shape = shapeOf(norm(head));
      if (!shape) continue;

      head.dataset.shape = shape;

      /* Wrap the body so the shape can carry a spine, a tint, or a label
         without touching the heading itself. */
      if (head.tagName === 'SUMMARY') {
        var panel = head.parentNode;
        panel.dataset.shape = shape;
        continue;
      }

      var body = sectionNodes(head);
      if (!body.length) continue;

      var wrap = document.createElement('section');
      wrap.className = 'shape';
      wrap.dataset.shape = shape;
      head.parentNode.insertBefore(wrap, head);
      wrap.appendChild(head);
      body.forEach(function (n) { wrap.appendChild(n); });
    }

    tagTables(root);
    tagTeardown(root);
    tagCallouts(root);
  }

  global.SC500Sections = { mount: mount, shapes: SHAPES, tagCallouts: tagCallouts, tagTables: tagTables, tagTeardown: tagTeardown };
})(window);
