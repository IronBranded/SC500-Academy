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
   - Network first for everything, the cache only when the network fails or
     is slow (NETWORK_TIMEOUT_MS). The site used to serve its cache first and
     refresh behind, which meant the first load after every deploy showed the
     new index.html running the old scripts and lessons: a deploy looked like
     it had not happened (the posters and flowcharts "missing") until a second
     or third reload. Online, the reader now always gets one consistent
     version; offline, the precache still serves the whole guide.
   - Navigations fall back to the cached shell, because the site is a hash
     router - every route is index.html.

   Bump CACHE_VERSION whenever the shell changes. Old caches are deleted on
   activate. */

/* Bump on every deploy, so the precache is rebuilt and old caches are deleted.
   Online readers get the network copy either way. */
var CACHE_VERSION = 'sc500-v9';
/* Past this, a slow network (a train, a captive portal) gets the cached copy. */
var NETWORK_TIMEOUT_MS = 4000;
var SHELL = [
  './',
  'index.html',
  'content/manifest.json',
  'flashcards/deck.json',
  'assets/css/tokens.css',
  'assets/css/layout.css',
  'assets/css/components.css',
  'assets/css/practice.css',
  'assets/css/learn.css',
  'assets/css/beginner.css',
  'assets/css/scenarios.css',
  'docs/SKILLS-MEASURED-SNAPSHOT.md',
  'content/official-training.json',
  'content/comparisons.json',
  'content/cases.json',
  'content/drills.json',
  'content/skills-measured.json',
  'assets/js/theme.js',
  'assets/js/vendor/marked.min.js',
  'assets/js/frontmatter.js',
  'assets/js/domains.js',
  'assets/js/curriculum.js',
  'assets/js/nav.js',
  'assets/js/tabs.js',
  'assets/js/sections.js',
  'assets/js/highlight.js',
  'assets/js/outline.js',
  'assets/js/progress.js',
  'assets/js/quiz.js',
  'assets/js/search.js',
  'assets/js/views.js',
  'assets/js/practice.js',
  'assets/js/watchlist.js',
  'assets/js/compare.js',
  'assets/js/posters.js',
  'assets/js/cases.js',
  'assets/js/drills.js',
  'map/index.html',
  'flowcharts/index.html',
  'assets/js/lesson.js',
  'assets/js/dashboard.js',
  'assets/js/review.js',
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

  event.respondWith(networkFirst(req));
});

function fromCache(req) {
  return caches.match(req).then(function (hit) {
    if (hit || req.mode !== 'navigate') return hit;
    /* Hash routing means every navigation is index.html. */
    return caches.match('index.html').then(function (shell) {
      return shell || caches.match('./');
    });
  });
}

function networkFirst(req) {
  var network = fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') {
      var copy = res.clone();
      caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  var slow = new Promise(function (resolve) {
    setTimeout(function () { resolve('slow'); }, NETWORK_TIMEOUT_MS);
  });
  return Promise.race([network, slow]).then(function (res) {
    if (res !== 'slow') return res;
    /* Slow: answer from the cache if we can, otherwise keep waiting. */
    return fromCache(req).then(function (hit) { return hit || network; });
  }, function () {
    /* Offline or the request failed outright. */
    return fromCache(req).then(function (hit) { return hit || Response.error(); });
  });
}
