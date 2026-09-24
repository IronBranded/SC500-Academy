/* domains.js - SC-500 guide
   The domain identity system, in one place.

   Every surface that names an exam domain - dashboard cards, the sidebar, the
   lesson header, search results, review results, the coverage matrix - builds
   its domain mark here, so the four domains look identical everywhere and a
   change is made once.

   A domain mark is always three things together, never colour alone:

     colour   var(--d-NN)       tokens.css, contrast-checked per theme
     icon     a distinct SHAPE   person / layers / chip / shield
     text     the short name     "Identity, Access & Governance"

   The shapes differ in silhouette (round, horizontal, square, pointed) so the
   domains stay distinguishable in greyscale, under colour-vision deficiency,
   and in Windows high-contrast mode where the colour is thrown away.

   Official domain names still come from content/manifest.json. This file only
   adds the short learner-facing label and the icon; it never invents weights. */

(function (global) {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';

  /* 16x16 viewBox, stroked with currentColor. */
  var ICONS = {
    '00': 'M8 1.5 14 5v6l-6 3.5L2 11V5z',                                   // hexagon - lab safety
    '01': 'M8 2.2a2.8 2.8 0 1 1 0 5.6a2.8 2.8 0 0 1 0-5.6zM2.6 14c.5-2.9 2.7-4.4 5.4-4.4s4.9 1.5 5.4 4.4', // person
    '02': 'M2 4.5 8 2l6 2.5L8 7zM2 8l6 2.5L14 8M2 11.5 8 14l6-2.5',           // stacked layers
    '03': 'M4 4h8v8H4zM6.5 6.5h3v3h-3zM6 1.5V4M10 1.5V4M6 12v2.5M10 12v2.5M1.5 6H4M1.5 10H4M12 6h2.5M12 10h2.5', // chip
    '04': 'M8 1.8 13.5 4v4c0 3.2-2.3 5.4-5.5 6.3C4.8 13.4 2.5 11.2 2.5 8V4zM5.6 8.2l1.7 1.7 3.2-3.4'        // shield + check
  };

  var DOMAINS = {
    '00': { short: 'Lab Safety',                      abbr: 'LAB', exam: false },
    '01': { short: 'Identity, Access & Governance',   abbr: 'IAG', exam: true },
    '02': { short: 'Storage, Databases & Networking', abbr: 'SDN', exam: true },
    '03': { short: 'Compute Security',                abbr: 'CMP', exam: true },
    '04': { short: 'Security Posture & Monitoring',   abbr: 'POS', exam: true }
  };

  function info(id) {
    var key = String(id || '').padStart ? String(id).padStart(2, '0') : String(id);
    return DOMAINS[key] || { short: 'Appendix', abbr: 'REF', exam: false };
  }

  function icon(id, size) {
    var key = DOMAINS[id] ? id : '00';
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 16 16');
    s.setAttribute('width', String(size || 16));
    s.setAttribute('height', String(size || 16));
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.setAttribute('class', 'dom-icon');
    var p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', ICONS[key]);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '1.4');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    s.appendChild(p);
    return s;
  }

  /* Paint an element with a domain: sets data-domain and the --d custom
     properties every learn.css component reads. */
  function paint(el, id) {
    var key = DOMAINS[id] ? id : '00';
    el.dataset.domain = key;
    el.style.setProperty('--d', 'var(--d-' + key + ')');
    el.style.setProperty('--d-ink', 'var(--d-' + key + '-ink)');
    el.style.setProperty('--d-tint', 'var(--d-' + key + '-tint)');
    return el;
  }

  /* The standard badge: [icon] Short name  (optional weight).
     opts.weight  - '20-25%' string from the manifest, shown as given
     opts.compact - abbreviation instead of the short name (still has a
                    title and an accessible name carrying the full label) */
  function badge(id, opts) {
    opts = opts || {};
    var d = info(id);
    var b = document.createElement('span');
    b.className = 'dom-badge';
    paint(b, id);
    b.appendChild(icon(id, opts.size || 14));

    var label = document.createElement('span');
    label.className = 'dom-badge__label';
    label.textContent = opts.compact ? d.abbr : d.short;
    b.appendChild(label);

    if (opts.compact) {
      b.title = d.short;
      label.setAttribute('aria-label', d.short);
    }
    if (opts.weight && opts.weight !== 'n/a') {
      var w = document.createElement('span');
      w.className = 'dom-badge__weight';
      w.textContent = String(opts.weight).replace('-', '\u2013');
      b.appendChild(w);
    }
    return b;
  }

  global.SC500Domains = {
    info: info,
    icon: icon,
    paint: paint,
    badge: badge,
    ids: function () { return Object.keys(DOMAINS); }
  };
})(window);
