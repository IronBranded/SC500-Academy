/* frontmatter.js - SC-500 guide
   A deliberately small YAML front matter parser.

   It does NOT implement YAML. It implements exactly the subset that
   tools/Test-GuideContent.ps1 enforces on this repository:

     key: "quoted scalar"
     key: bare scalar
     key: ["inline", "list"]
     key:
       - "block list item"
     key: []

   Anything outside that subset is returned as a raw string rather than guessed
   at. If the schema grows, extend this and the PowerShell validator together. */

(function (global) {
  'use strict';

  var FM = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

  function stripQuotes(v) {
    v = v.trim();
    if (v.length > 1) {
      var a = v.charAt(0), b = v.charAt(v.length - 1);
      if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
        return v.slice(1, -1).replace(/\\"/g, '"');
      }
    }
    return v;
  }

  function coerce(v) {
    if (v === '') return '';
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '~') return null;
    return stripQuotes(v);
  }

  function parseInlineList(v) {
    var inner = v.slice(1, -1).trim();
    if (!inner) return [];
    var out = [], buf = '', quote = null;
    for (var i = 0; i < inner.length; i++) {
      var c = inner.charAt(i);
      if (quote) {
        /* The closing quote ends the item's text and is not part of it. The
           previous version fell through here and appended it, which turned
           prerequisites: ["00-00"] into the broken route #/module/00-00". */
        if (c === quote && inner.charAt(i - 1) !== '\\') { quote = null; continue; }
        buf += c; continue;
      } else if (c === '"' || c === "'") { quote = c; continue; }
      else if (c === ',') { out.push(coerce(buf)); buf = ''; continue; }
      buf += c;
    }
    if (buf.trim() !== '') out.push(coerce(buf));
    return out;
  }

  /* Split a document into { data, body }. A file with no front matter returns
     an empty data object and the whole file as body - that is a content bug,
     not a parser bug, and the validator catches it. */
  function parse(text) {
    var m = FM.exec(text);
    if (!m) return { data: {}, body: text, hasFrontMatter: false };

    var data = {};
    var lines = m[1].split(/\r?\n/);
    var key = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line.trim() || /^\s*#/.test(line)) continue;

      var item = /^\s+-\s+(.*)$/.exec(line);
      if (item && key) {
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(coerce(item[1]));
        continue;
      }

      var pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
      if (!pair) continue;

      key = pair[1];
      var raw = pair[2].replace(/\s+#.*$/, '').trim();   // trailing comment

      if (raw === '') { data[key] = []; }               // block list follows, or empty
      else if (raw.charAt(0) === '[') { data[key] = parseInlineList(raw); }
      else { data[key] = coerce(raw); }
    }

    return { data: data, body: text.slice(m[0].length), hasFrontMatter: true };
  }

  /* Map lab_cost_estimate prose to a signal level.

     Read the LEADING token only. The estimates are written for humans and
     routinely mention later that something is set "back to Free in teardown" -
     scanning the whole string would let that word downgrade a paid lab to $0,
     which is the one direction a cost signal must never fail in. */
  function costLevel(estimate) {
    var s = String(estimate || '').toLowerCase();
    if (!s) return 'low';

    /* Everything before the first dash, em dash or full stop: by convention the
       estimate opens with its level. See docs/STYLE-GUIDE.md section 6. */
    var head = s.split(/\s[-\u2013\u2014]\s|\.\s/)[0].slice(0, 40);

    if (head.indexOf('highest') !== -1) return 'max';
    if (head.indexOf('high') !== -1) return 'high';      // includes "medium-high"
    if (head.indexOf('medium') !== -1) return 'mid';
    if (head.indexOf('low') !== -1) return 'low';
    if (head.indexOf('$0') !== -1 || head.indexOf('free') !== -1) return 'none';

    /* Nothing recognisable at the front - fall back to the whole string, but
       keep 'low' ahead of '$0' for the same reason as above. */
    if (s.indexOf('highest') !== -1) return 'max';
    if (s.indexOf('high') !== -1) return 'high';
    if (s.indexOf('medium') !== -1) return 'mid';
    if (s.indexOf('low') !== -1) return 'low';
    if (s.indexOf('$0') !== -1) return 'none';
    return 'low';
  }

  /* The short label on the chip. The full sentence stays in the card below it. */
  function costLabel(estimate) {
    return ({ none: '$0', low: 'Low', mid: 'Medium', high: 'HIGH', max: 'HIGHEST' })[costLevel(estimate)];
  }

  global.SC500FrontMatter = {
    parse: parse,
    costLevel: costLevel,
    costLabel: costLabel
  };
})(window);
