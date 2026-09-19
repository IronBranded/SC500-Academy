/* highlight.js - SC-500 guide
   Syntax highlighting, written rather than imported.

   Roughly 40% of this guide is code, across PowerShell, bash, KQL, JSON, Bicep,
   XML and YAML. A general-purpose library would pull a dependency and still not
   do the thing that matters most here:

     DESTRUCTIVE AND BILLABLE TOKENS ARE MARKED IN THE COST COLOUR.

   -Force, Remove-*, --yes, -PricingTier 'Standard', az group delete. A reader
   skimming a teardown block should see the irreversible parts before they read
   the line, and a reader skimming a lab should see what starts the meter. */

(function (global) {
  'use strict';

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Tokens that delete, overwrite, or begin billing. Matched after the normal
     pass so they win. */
  var DANGER = new RegExp([
    '\\bRemove-Az[A-Za-z]*', '\\bRemove-Mg[A-Za-z]*', '\\bRemove-SPO[A-Za-z]*',
    '\\bStop-AzVM\\b', '\\bClear-\\w+', '\\bReset-\\w+',
    '-Force\\b', '-Confirm:\\$false', '-WhatIf\\b',
    '--yes\\b', '--force\\b', '\\bdelete\\b',
    '-InRemovedState\\b', '-PurgeKeyVaults\\b',
    "-PricingTier\\s+'Standard'", '--tier\\s+Standard\\b',
    '\\bNew-AzFirewall\\b', '\\bNew-AzBastion\\b', '\\bNew-AzApiManagement\\b',
    '\\baz\\s+aks\\s+create\\b', '\\bpurge\\b'
  ].join('|'), 'g');

  var LANGS = {
    powershell: {
      comment: /#[^\n]*/g,
      string: /@'[\s\S]*?'@|@"[\s\S]*?"@|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g,
      keyword: /\b(?:if|else|elseif|foreach|for|while|do|switch|function|return|try|catch|finally|param|begin|process|end|in|break|continue|throw)\b/gi,
      fn: /\b(?:[A-Z][a-z]+)-[A-Za-z0-9]+\b/g,
      variable: /\$[A-Za-z_][\w:]*/g,
      param: /(?:^|\s)-[A-Za-z][\w]*/g,
      number: /\b\d+(?:\.\d+)?\b/g
    },
    bash: {
      comment: /#[^\n]*/g,
      string: /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g,
      keyword: /\b(?:if|then|fi|for|do|done|while|case|esac|function|export|local|return|echo)\b/g,
      fn: /\b(?:az|kubectl|curl|git|python3?|sudo|helm|openssl)\b/g,
      param: /(?:^|\s)--?[A-Za-z][\w-]*/g,
      variable: /\$\{?[A-Za-z_]\w*\}?/g,
      number: /\b\d+(?:\.\d+)?\b/g
    },
    kusto: {
      comment: /\/\/[^\n]*/g,
      string: /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g,
      keyword: /\b(?:where|summarize|project|project-away|extend|join|union|let|order|sort|by|take|top|count|distinct|render|make-series|mv-expand|parse|on|asc|desc|and|or|not|has|contains|startswith|in)\b/g,
      fn: /\b(?:ago|now|todatetime|tostring|toint|bin|strcat|split|iff|case|arg_max|arg_min|dcount|sum|avg|min|max|round)\b(?=\s*\()/g,
      number: /\b\d+(?:\.\d+)?[dhms]?\b/g,
      table: /^\s*([A-Z]\w+)(?=\s*$|\s*\|)/gm
    },
    json: {
      key: /"(?:[^"\\]|\\.)*"(?=\s*:)/g,
      string: /"(?:[^"\\]|\\.)*"/g,
      keyword: /\b(?:true|false|null)\b/g,
      number: /-?\b\d+(?:\.\d+)?\b/g
    },
    bicep: {
      comment: /\/\/[^\n]*/g,
      string: /'(?:[^'\\]|\\.)*'/g,
      keyword: /\b(?:param|var|resource|output|module|targetScope|existing|if|for|in)\b/g,
      fn: /\b(?:resourceGroup|subscription|union|concat|toLower|uniqueString|guid)\b(?=\s*\()/g,
      number: /\b\d+\b/g
    },
    xml: {
      comment: /<!--[\s\S]*?-->/g,
      string: /"(?:[^"\\]|\\.)*"/g,
      tag: /<\/?[\w-]+|\/?>/g,
      attr: /\b[\w-]+(?==)/g
    },
    yaml: {
      comment: /#[^\n]*/g,
      key: /^\s*[\w-]+(?=:)/gm,
      string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
      number: /\b\d+(?:\.\d+)?\b/g
    }
  };

  var ALIAS = {
    ps: 'powershell', ps1: 'powershell', pwsh: 'powershell',
    sh: 'bash', shell: 'bash', console: 'bash',
    kql: 'kusto', kusto: 'kusto',
    js: 'json', json: 'json',
    bicep: 'bicep', xml: 'xml', html: 'xml',
    yml: 'yaml', yaml: 'yaml'
  };

  /* Build a single mask array so tokens cannot overlap: first match wins, which
     is why comments and strings are registered before keywords. */
  function tokenize(src, rules) {
    var marks = new Array(src.length);
    var order = ['comment', 'string', 'key', 'table', 'tag', 'attr', 'keyword', 'fn', 'param', 'variable', 'number'];

    order.forEach(function (kind) {
      var re = rules[kind];
      if (!re) return;
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(src)) !== null) {
        if (m[0] === '') { re.lastIndex++; continue; }
        var start = m.index + (m[0].length - m[0].replace(/^\s+/, '').length);
        var end = m.index + m[0].length;
        var free = true;
        for (var i = start; i < end; i++) if (marks[i]) { free = false; break; }
        if (free) for (var j = start; j < end; j++) marks[j] = kind;
      }
    });

    DANGER.lastIndex = 0;
    var d;
    while ((d = DANGER.exec(src)) !== null) {
      for (var k = d.index; k < d.index + d[0].length; k++) marks[k] = 'danger';
    }

    var out = '', cur = null, buf = '';
    function flush() {
      if (!buf) return;
      out += cur ? '<span class="t-' + cur + '">' + esc(buf) + '</span>' : esc(buf);
      buf = '';
    }
    for (var p = 0; p < src.length; p++) {
      if (marks[p] !== cur) { flush(); cur = marks[p]; }
      buf += src[p];
    }
    flush();
    return out;
  }

  function highlightEl(code) {
    if (code.dataset.hl === 'done') return;
    var m = /language-([\w-]+)/.exec(code.className || '');
    var lang = m ? ALIAS[m[1].toLowerCase()] : null;
    code.dataset.hl = 'done';
    if (!lang || !LANGS[lang]) return;
    code.dataset.lang = lang === 'kusto' ? 'kql' : lang;
    code.innerHTML = tokenize(code.textContent, LANGS[lang]);
  }

  function mount(root) {
    var blocks = root.querySelectorAll('pre > code');
    for (var i = 0; i < blocks.length; i++) highlightEl(blocks[i]);
  }

  global.SC500Highlight = { mount: mount };
})(window);
