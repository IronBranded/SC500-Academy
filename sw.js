/* sw.js - SC-500 guide service worker
   ---------------------------------------------------------------------------
   Offline capability has been a stated constraint of this project since the
   first version of the build prompt, and the site has never actually had it:
   Markdown is fetched at runtime, so a reader on a train gets a shell and no
   content.

   This fixes that without changing how the site works. On install it reads
   content/manifest.json and caches every module, lab, appendix and quiz, so the
   guide is complete offline after one visit rather than only the pages you
   happened to open.

   Deliberate choices, and their costs:

   - Individual cache.add per file rather than cache.addAll, because addAll
     rejects the whole install if any single file 404s. One missing lab should
     not mean no offline support.
   - skipWaiting + clients.claim, so a new deployment takes effect on the next
     load rather than after every tab is closed. The cost is that a very long
     session could see assets swap under it; for a static study site that is
     acceptable, and the alternative is readers stuck on a stale version they
     have no way to notice.
   - Cache-first for content, with a background revalidate. Study material that
     loads instantly and is a day stale beats material that waits for a network
     round trip.
   - Navigations fall back to the cached shell, because the site is a hash
     router - every route is index.html.

   Bump CACHE_VERSION whenever the shell changes. Old caches are deleted on
   activate. */

var CACHE_VERSION = 'sc500-v1';
var SHELL = [
  './',
  'index.html',
  'content/manifest.json',
  'flashcards/deck.json',
  'assets/css/tokens.css',
  'assets/css/layout.css',
  'assets/css/components.css',
  'assets/css/practice.css',
  'assets/js/theme.js',
  'assets/js/vendor/marked.min.js',
  'assets/js/vendor/mermaid.min.js',
  'assets/js/frontmatter.js',
  'assets/js/nav.js',
  'assets/js/tabs.js',
  'assets/js/sections.js',
  'assets/js/highlight.js',
  'assets/js/outline.js',
  'assets/js/objectives.js',
  'assets/js/progress.js',
  'assets/js/quiz.js',
  'assets/js/search.js',
  'assets/js/views.js',
  'assets/js/practice.js',
  'assets/js/watchlist.js',
  'assets/js/palette.js',
  'assets/js/app.js'
];

/* Add one URL, and do not let a single failure abort the batch. */
function addSafely(cache, url) {
  return cache.add(new Request(url, { cache: 'reload' })).catch(function () {
    /* A file listed in SHELL that does not exist - mermaid is optional, for
       instance - is not a reason to have no offline support at all. */
  });
}

function contentUrls(manifest) {
  var out = [];
  (manifest.domains || []).forEach(function (d) {
    (d.modules || []).forEach(function (m) {
      if (m.content) out.push(m.content);
      if (m.lab) out.push(m.lab);
      out.push('quizzes/' + m.id + '.json');
    });
  });
  (manifest.appendix || []).forEach(function (a) {
    if (a.content) out.push(a.content);
  });
  return out;
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return Promise.all(SHELL.map(function (u) { return addSafely(cache, u); }))
        .then(function () {
          /* Then the whole guide, driven by the manifest so this never needs
             editing when a module is added. */
          return fetch('content/manifest.json', { cache: 'reload' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (manifest) {
              if (!manifest) return;
              var urls = contentUrls(manifest);
              return Promise.all(urls.map(function (u) { return addSafely(cache, u); }));
            })
            .catch(function () { /* offline at install time - runtime caching still applies */ });
        });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;

  /* Only same-origin GETs. Never interfere with anything else - a cached POST
     or a cached cross-origin font is a bug waiting to be reported as one. */
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  /* Hash routing means every navigation is index.html. */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match('index.html').then(function (hit) {
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });

      /* Cache first, refresh behind. A reader gets the page instantly and the
         next visit gets whatever changed. */
      return hit || network;
    })
  );
});
