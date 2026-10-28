/* posters.js - SC-500 guide
   The #/posters view: five two-sided study posters, each a tabloid
   (17 x 11 in) PDF with its own header colour.

   The posters are generated pages in posters/ (HTML + poster.css), rendered
   to posters/pdf/ and to small previews in posters/preview/ by
   tools/render-posters.js. This view shows the previews and links the PDFs;
   it does not load the PDFs. Every claim on them was checked against Microsoft
   Learn on the date in CHECKED - see docs/OBJECTIVE-VALIDATION.md. */

(function (global) {
  'use strict';

  var CHECKED = '20 October 2026';

  var POSTERS = [
    {
      n: 1, slug: '01-which-control', colour: '#8a1c6e', title: 'Which control?',
      front: 'Nineteen decisions SC-500 is built around. Each panel gives the question the control answers, the scenario words that select it, and the wrong answer the question is written to tempt.',
      back: 'A decoder for every domain: the phrase in a question, and the control it points to. Cover the answers and test yourself.',
      ids: 'All four domains'
    },
    {
      n: 2, slug: '02-who-wins', colour: '#4a6713', title: 'Who wins?',
      front: 'Evaluation order and precedence for identity, governance and data: Conditional Access, PIM, RBAC, Azure Policy effects, locks, Key Vault, storage and SAS, Azure SQL.',
      back: 'The path a packet, a request or an alert takes: NSGs, Virtual Network Manager, Azure Firewall, routing, WAF, API Management, AI controls, Sentinel, and which controls block versus only alert.',
      ids: 'All four domains'
    },
    {
      n: 3, slug: '03-ai-security-stack', colour: '#a3142e', title: 'The AI security stack',
      front: 'Where each security-for-AI control acts, from who asks to what data is read; one indirect prompt injection with five places to stop it; licence gates and the dates that changed the answers.',
      back: 'How each control behaves: AI gateway policies, Foundry guardrails, Copilot Studio real-time protection, Conditional Access for agents, Agent ID, DSPM, SharePoint oversharing, Defender for AI Services.',
      ids: 'Objective 3.1'
    },
    {
      n: 4, slug: '04-posture-and-monitoring', colour: '#8a5e00', title: 'Posture and monitoring',
      front: 'Defender for Cloud: foundational CSPM against Defender CSPM, workload protection plans, regulatory compliance, attack paths, multicloud, Defender for Servers Plan 1 or 2.',
      back: 'Sentinel ingestion, tables, retention, automation and cost; Microsoft Purview Audit; Security Copilot capacity, roles and agents.',
      ids: 'Domain 4'
    },
    {
      n: 5, slug: '05-operate-it', colour: '#2e3138', title: 'Operate it',
      front: 'Where things live: nine portals, which PowerShell module talks to what, and the portal path beside the command that does the same job - create and modify, by area.',
      back: 'Contain and clean up: the fastest way to revoke, disable or isolate each thing, what that action leaves running, what you cannot undo, and how to prove it worked.',
      ids: 'All four domains'
    }
  ];

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function link(cls, href, text, download) {
    var a = node('a', cls, text);
    a.href = href;
    if (download) a.setAttribute('download', '');
    return a;
  }

  function view(root) {
    root.appendChild(node('h1', null, 'Study posters'));
    root.appendChild(node('p', 'lede',
      'Five two-sided study posters, built only from SC-500 objectives. ' +
      'Each prints on tabloid paper (17 × 11 in, landscape), front and back, or scales down to A3 or Letter. ' +
      'Every claim was checked against Microsoft Learn on ' + CHECKED + '; products change, so the dates on the posters matter.'));

    var all = node('p', 'posters__all');
    all.appendChild(link('btn btn--primary', 'posters/pdf/sc500-posters-all.pdf', 'Download all five (PDF, 10 pages)', true));
    root.appendChild(all);

    var grid = node('div', 'dgrid posters');
    POSTERS.forEach(function (p) {
      var card = node('article', 'dcard poster-card');
      card.style.setProperty('--d', p.colour);

      var head = node('div', 'dcard__head');
      var h = node('h2', 'dcard__title');
      var sw = node('span', 'poster-card__swatch');
      sw.style.background = p.colour;
      sw.setAttribute('aria-hidden', 'true');
      h.appendChild(sw);
      h.appendChild(document.createTextNode(p.n + '. ' + p.title));
      head.appendChild(h);
      head.appendChild(node('span', 'dcard__weight poster-card__scope', p.ids));
      card.appendChild(head);

      /* Both sides at a glance. Each preview opens the full-size page. */
      var previews = node('div', 'poster-card__previews');
      ['front', 'back'].forEach(function (side) {
        var fig = node('figure', 'poster-card__preview');
        var a = link('poster-card__thumb', 'posters/' + p.slug + '.html', null);
        a.target = '_blank';
        a.rel = 'noopener';
        var img = node('img');
        img.src = 'posters/preview/' + p.slug + '-' + side + '.jpg';
        img.width = 800;
        img.height = 518;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = (side === 'front' ? 'Front' : 'Back') + ' of poster ' + p.n + ', ' + p.title + ': open it full size';
        a.appendChild(img);
        fig.appendChild(a);
        fig.appendChild(node('figcaption', null, side === 'front' ? 'Front' : 'Back'));
        previews.appendChild(fig);
      });
      card.appendChild(previews);

      var dl = node('dl', 'poster-card__sides');
      dl.appendChild(node('dt', null, 'Front'));
      dl.appendChild(node('dd', null, p.front));
      dl.appendChild(node('dt', null, 'Back'));
      dl.appendChild(node('dd', null, p.back));
      card.appendChild(dl);

      var actions = node('div', 'dcard__actions');
      actions.appendChild(link('btn btn--small', 'posters/pdf/' + p.slug + '.pdf', 'PDF', true));
      var open = link('btn btn--small', 'posters/' + p.slug + '.html', 'Open to print');
      open.target = '_blank';
      open.rel = 'noopener';
      actions.appendChild(open);
      card.appendChild(actions);
      grid.appendChild(card);
    });
    root.appendChild(grid);

    root.appendChild(node('h2', null, 'Printing'));
    var ul = node('ul');
    [
      'Use the PDFs. Each is two pages, front then back, with the page size set to 17 × 11 in.',
      'For A3 or Letter, choose "fit to page" in the print dialog. Body text is about 8 to 10 pt on tabloid; Letter shrinks it to roughly two thirds, so A3 is the better fallback.',
      'Print double-sided, flipping on the short edge, to get one sheet per poster.',
      '"Open to print" shows the source page; print it with background graphics on if you want to scale it yourself.'
    ].forEach(function (t) { ul.appendChild(node('li', null, t)); });
    root.appendChild(ul);

    root.appendChild(node('p', 'field__note',
      'The posters summarise; the lessons teach. Objective numbers on each panel, such as 3.1.7, are the Academy\'s positions in the official skills outline - Microsoft does not number them.'));
  }

  global.SC500Views = global.SC500Views || {};
  global.SC500Views.posters = view;
})(window);
