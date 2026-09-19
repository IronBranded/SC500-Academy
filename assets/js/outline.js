/* outline.js - SC-500 guide
   In-page navigation for long modules.

   03-04 carries nine sub-objectives and runs to a dozen sections; 03-05's lab
   has seven parts. Scrolling to find "Teardown" is the most repeated action in
   the whole guide, so it gets a permanent affordance.

   Also gives every heading a stable id and a hover anchor, so a reader can link
   a colleague straight to "Common failure modes" in 02-04. */

(function (global) {
  'use strict';

  var spy = null;

  function slug(text) {
    return String(text).toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }

  function anchorHeadings(root) {
    var heads = root.querySelectorAll('h2, h3');
    var seen = {};

    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];

      /* tabs.js may have folded an h2 into a <summary>; handle both. */
      var label = h.textContent.trim();
      var id = slug(label) || 'section-' + i;
      if (seen[id]) { id = id + '-' + (++seen[id]); } else { seen[id] = 1; }
      h.id = id;

      if (h.querySelector('.anchor')) continue;
      var a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + id;
      a.setAttribute('aria-label', 'Link to ' + label);
      a.textContent = '§';
      a.addEventListener('click', function (e) {
        /* Keep the route in the hash; scroll manually rather than letting the
           browser replace #/module/xx with #section. */
        e.preventDefault();
        var target = document.getElementById(this.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      h.appendChild(a);
    }
  }

  /* tabs.js replaces some h2 elements with <details><summary>. Give those an id
     too, so the outline can reach a folded section - and open it on the way. */
  function anchorFolded(root) {
    var panels = root.querySelectorAll('details.depth > summary');
    for (var i = 0; i < panels.length; i++) {
      var s = panels[i];
      if (s.id) continue;
      s.id = slug(s.textContent) || 'panel-' + i;
    }
  }

  function collect(root) {
    var items = [];
    var walk = root.querySelectorAll('h2, h3, details.depth > summary');
    for (var i = 0; i < walk.length; i++) {
      var n = walk[i];
      var isSummary = n.tagName === 'SUMMARY';
      items.push({
        id: n.id,
        text: n.textContent.replace(/§$/, '').trim(),
        depth: isSummary ? 2 : parseInt(n.tagName.charAt(1), 10),
        el: n
      });
    }
    return items.filter(function (i) { return i.id && i.text; });
  }

  function build(items) {
    var nav = document.createElement('nav');
    nav.className = 'outline';
    nav.setAttribute('aria-label', 'On this page');

    var h = document.createElement('h2');
    h.className = 'field__title';
    h.textContent = 'On this page';
    nav.appendChild(h);

    var ul = document.createElement('ul');
    ul.className = 'outline__list';

    items.forEach(function (item) {
      var li = document.createElement('li');
      li.dataset.depth = String(item.depth);
      var a = document.createElement('a');
      a.className = 'outline__link';
      a.href = '#' + item.id;
      a.textContent = item.text;
      a.dataset.target = item.id;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(item.id);
        if (!target) return;
        var fold = target.closest ? target.closest('details.depth') : null;
        if (fold) fold.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
  }

  /* Highlight the section currently in view. rootMargin biases towards the top
     of the viewport so the active item changes when a heading reaches the
     reading position, not when it leaves the screen. */
  function watch(items) {
    if (spy) { spy.disconnect(); spy = null; }
    if (!('IntersectionObserver' in window)) return;

    var links = {};
    document.querySelectorAll('.outline__link').forEach(function (a) {
      links[a.dataset.target] = a;
    });

    var visible = {};

    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });

      var current = null;
      for (var i = 0; i < items.length; i++) {
        if (visible[items[i].id]) { current = items[i].id; break; }
      }
      Object.keys(links).forEach(function (id) {
        if (id === current) links[id].setAttribute('aria-current', 'true');
        else links[id].removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });

    items.forEach(function (i) { spy.observe(i.el); });
  }

  function mount(root, metaEl) {
    anchorFolded(root);
    anchorHeadings(root);

    var items = collect(root);
    if (items.length < 3 || !metaEl) return;   // short pages do not need one

    metaEl.appendChild(build(items));
    watch(items);
  }

  global.SC500Outline = { mount: mount };
})(window);
