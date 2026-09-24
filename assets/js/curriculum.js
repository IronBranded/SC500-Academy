/* curriculum.js - SC-500 guide
   The objective coverage model, derived at runtime from files that already
   exist. There is no second mapping file to maintain.

     docs/SKILLS-MEASURED-SNAPSHOT.md   the official outline: domain -> objective
                                        -> bullet. This is the authority.
     content/manifest.json              lessons, labs and their order
     module front matter                sub_objectives (verbatim bullets),
                                        prerequisites, status, last_verified
     quizzes/<id>.json                  questions, each tagged with sub_skill
     appendix A6                        comparison sections, each naming the
                                        modules it belongs to
     content/official-training.json     Microsoft Learn learning paths and
                                        Microsoft's own labs, per objective

   The chain the redesign brief asks for - Objective -> Lesson -> Visual ->
   Lab -> Knowledge check -> Review - is assembled here by joining those
   sources on verbatim text. Nothing is typed twice, so nothing can drift
   silently: a bullet Microsoft renames stops matching, and the coverage view
   reports it as Missing on one side and Unmapped on the other.

   OBJECTIVE IDS. Microsoft's study guide does not number its objectives. The
   ids used here (1.1, 1.1.3) are positions in the snapshot, assigned when the
   snapshot is parsed. They are stable for as long as the snapshot is, and the
   outline-drift workflow already turns any snapshot change into a reviewable
   issue. They are a navigation aid, not an official identifier, and the UI
   says so where it shows them. */

(function (global) {
  'use strict';

  var SNAPSHOT = 'docs/SKILLS-MEASURED-SNAPSHOT.md';
  /* A6 is looked up in the manifest first. The fallback path exists only
     because A6 predates its manifest entry; see MANIFEST_PATCH_NOTES. */
  var A6_FALLBACK = 'content/appendix/a6-choosing-between-controls.md';

  var model = null, job = null;

  /* ---------------------------------------------------------------- utils */

  function norm(s) {
    return String(s || '')
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function getText(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .catch(function () { return ''; });
  }

  function getJson(url) {
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ------------------------------------------------------ snapshot parser */

  /* Mirrors the PowerShell validator's reading of the snapshot: only the
     "## Skills measured" section, "### Domain (weight)", "#### Objective",
     "- bullet", with wrapped bullet lines rejoined. */
  function parseSnapshot(md) {
    var start = md.indexOf('## Skills measured');
    if (start === -1) return null;
    var end = md.indexOf('## Study resources', start);
    var lines = md.slice(start, end === -1 ? md.length : end).split(/\r?\n/);

    var domains = [], d = null, o = null, lastBullet = null;
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var dm = /^###\s+(.+?)\s*\((\d+)\s*[-\u2013]\s*(\d+)%\)\s*$/.exec(line);
      if (dm) {
        d = { name: dm[1].trim(), weight: dm[2] + '-' + dm[3] + '%', objectives: [] };
        domains.push(d); o = null; lastBullet = null;
        return;
      }
      if (/^###\s/.test(line)) { d = null; o = null; return; }   // audience, at-a-glance
      var om = /^####\s+(.+)$/.exec(line);
      if (om && d) {
        o = { text: om[1].trim(), bullets: [] };
        d.objectives.push(o); lastBullet = null;
        return;
      }
      var bm = /^[-*]\s+(.+)$/.exec(line);
      if (bm && o) { lastBullet = bm[1].trim(); o.bullets.push(lastBullet); return; }
      if (/^\s{2,}\S/.test(raw) && o && lastBullet !== null) {
        o.bullets[o.bullets.length - 1] += ' ' + raw.trim();
        lastBullet = o.bullets[o.bullets.length - 1];
      }
    });
    return domains.length ? domains : null;
  }

  /* ------------------------------------------------------------ A6 parser */

  /* Each "## N. Title" section opens with "**Module(s) 01-01, 03-02.**". That
     line is the join; a section without it is general and belongs to no
     lesson. The section's own markdown is kept so a lesson can render it. */
  function parseDistinctions(md) {
    if (!md) return [];
    var body = global.SC500FrontMatter ? global.SC500FrontMatter.parse(md).body : md;
    var parts = body.split(/^## /m).slice(1);
    var out = [];
    parts.forEach(function (chunk) {
      var nl = chunk.indexOf('\n');
      var title = chunk.slice(0, nl).trim();
      var m = /^(\d+)\.\s+(.+)$/.exec(title);
      if (!m) return;
      var text = chunk.slice(nl + 1).replace(/\n-{3,}\s*$/, '').trim();
      var refs = /\*\*Modules?\s+([0-9,\s-]+?)\.\*\*/.exec(text);
      var modules = refs ? refs[1].split(/\s*,\s*/).filter(function (x) { return /^\d\d-\d\d$/.test(x); }) : [];
      var trap = /^>\s*\*\*The trap[^*]*\*\*/m.test(text);
      out.push({
        n: parseInt(m[1], 10),
        title: m[2].trim(),
        modules: modules,
        hasTrap: trap,
        markdown: text
      });
    });
    return out;
  }

  /* ---------------------------------------------------------------- build */

  function build(manifest, snapshotMd, lessonTexts, quizzes, a6Md, a6Index, training) {
    var FM = global.SC500FrontMatter;
    var snap = parseSnapshot(snapshotMd || '');

    var upd = /^updated_at:\s*(\S+)/m.exec(snapshotMd || '');
    var m = {
      manifest: manifest,
      snapshotOk: !!snap,
      snapshotDate: upd ? upd[1].slice(0, 10) : null,
      domains: [],          // exam domains in snapshot order, joined to manifest
      domainById: {},       // '01' -> domain
      objectives: [],       // { id:'1.1', domainId, text, bulletIds, lessonIds }
      objectiveById: {},
      bullets: [],          // { id:'1.1.3', objectiveId, domainId, text, lessonIds, questionIds }
      bulletById: {},
      bulletByNorm: {},
      lessons: {},          // '01-01' -> lesson
      order: [],            // lesson ids in manifest (study) order, Module 0 included
      questions: {},        // qid -> question with lessonId, bulletId, domainId
      distinctions: parseDistinctions(a6Md),
      a6Index: a6Index,     // index into manifest.appendix, or -1
      unmapped: []          // front-matter sub-objectives that match no official bullet
    };

    /* Manifest domains by normalised name, so the snapshot can find its id. */
    var manByName = {};
    manifest.domains.forEach(function (d) { manByName[norm(d.name)] = d; });

    (snap || []).forEach(function (sd, di) {
      var md = manByName[norm(sd.name)];
      var id = md ? md.id : ('0' + (di + 1));
      var dom = {
        id: id, num: di + 1, name: sd.name, weight: sd.weight,
        objectiveIds: [], bulletIds: [], lessonIds: []
      };
      sd.objectives.forEach(function (so, oi) {
        var oid = (di + 1) + '.' + (oi + 1);
        var obj = { id: oid, domainId: id, text: so.text, bulletIds: [], lessonIds: [] };
        so.bullets.forEach(function (bt, bi) {
          var bid = oid + '.' + (bi + 1);
          var b = { id: bid, objectiveId: oid, domainId: id, text: bt, lessonIds: [], questionIds: [] };
          m.bullets.push(b);
          m.bulletById[bid] = b;
          m.bulletByNorm[norm(bt)] = b;
          obj.bulletIds.push(bid);
          dom.bulletIds.push(bid);
        });
        m.objectives.push(obj);
        m.objectiveById[oid] = obj;
        dom.objectiveIds.push(oid);
      });
      m.domains.push(dom);
      m.domainById[id] = dom;
    });

    var objByNorm = {};
    m.objectives.forEach(function (o) { objByNorm[norm(o.text)] = o; });

    /* Lessons, in manifest order. */
    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (mod) {
        var text = lessonTexts[mod.id] || '';
        var parsed = FM ? FM.parse(text) : { data: {}, body: text };
        var fm = parsed.data || {};
        var body = parsed.body || '';
        var obj = objByNorm[norm(fm.objective || mod.objective)] || null;

        var lesson = {
          id: mod.id,
          title: mod.title,
          domainId: d.id,
          domainName: d.name,
          weight: d.weight,
          exam: !!(d.weight && d.weight !== 'n/a'),
          content: mod.content,
          lab: mod.lab || null,
          hasLab: !!mod.lab,
          objectiveId: obj ? obj.id : null,
          objectiveText: fm.objective || mod.objective || '',
          fm: fm,
          bulletIds: [],
          questionIds: [],
          distinctionNs: [],
          hasVisual: /```mermaid/.test(body) || /<svg[\s>]/i.test(body),
          hasTakeaways: /^##\s+(key\s+)?takeaways\s*$/im.test(body),
          prerequisites: Array.isArray(fm.prerequisites) ? fm.prerequisites : [],
          prev: null,
          next: null
        };

        (Array.isArray(fm.sub_objectives) ? fm.sub_objectives : []).forEach(function (s) {
          var b = m.bulletByNorm[norm(s)];
          if (b) {
            lesson.bulletIds.push(b.id);
            if (b.lessonIds.indexOf(mod.id) === -1) b.lessonIds.push(mod.id);
          } else {
            m.unmapped.push({ lessonId: mod.id, text: s });
          }
        });

        if (obj && lesson.exam && obj.lessonIds.indexOf(mod.id) === -1) obj.lessonIds.push(mod.id);
        if (m.domainById[d.id] && lesson.exam) m.domainById[d.id].lessonIds.push(mod.id);

        m.lessons[mod.id] = lesson;
        m.order.push(mod.id);
      });
    });

    /* Study order links. */
    for (var i = 0; i < m.order.length; i++) {
      var L = m.lessons[m.order[i]];
      L.prev = i > 0 ? m.order[i - 1] : null;
      L.next = i < m.order.length - 1 ? m.order[i + 1] : null;
    }

    /* Questions. sub_skill is required by the validator to quote a bullet
       from the module's own front matter, so a miss here is a content bug. */
    Object.keys(quizzes).forEach(function (lid) {
      var q = quizzes[lid];
      if (!q || !Array.isArray(q.questions)) return;
      var lesson = m.lessons[lid];
      q.questions.forEach(function (item, qi) {
        if (!item || !item.prompt || !Array.isArray(item.options)) return;
        var qid = item.id || (lid + '-q' + (qi + 1));
        var b = m.bulletByNorm[norm(item.sub_skill)];
        var rec = {
          id: qid, lessonId: lid, domainId: lesson ? lesson.domainId : null,
          bulletId: b ? b.id : null, data: item
        };
        m.questions[qid] = rec;
        if (lesson) lesson.questionIds.push(qid);
        if (b) b.questionIds.push(qid);
      });
    });

    /* Distinctions, joined to lessons. */
    m.distinctions.forEach(function (x) {
      x.modules.forEach(function (lid) {
        if (m.lessons[lid]) m.lessons[lid].distinctionNs.push(x.n);
      });
    });

    /* Official training, joined on the objective heading text. An entry
       that matches no objective is reported, not dropped. */
    m.training = training && training.course ? training : null;
    m.trainingUnmapped = [];
    if (m.training) {
      (training.paths || []).forEach(function (p) {
        var o = objByNorm[norm(p.objective)];
        if (o) o.path = p; else m.trainingUnmapped.push(p.title);
        /* Module-level: each module names the lesson(s) it serves. A lesson id
           that does not exist is reported, not silently dropped. */
        (p.module_list || []).forEach(function (mod) {
          (mod.lessons || []).forEach(function (lid) {
            var L = m.lessons[lid];
            if (L) (L.officialModules = L.officialModules || []).push(mod);
            else m.trainingUnmapped.push(mod.title + ' (lesson ' + lid + ' not found)');
          });
        });
      });
      (training.labs || []).forEach(function (l) {
        var o = objByNorm[norm(l.objective)];
        if (o) (o.officialLabs = o.officialLabs || []).push(l); else { m.trainingUnmapped.push(l.title); return; }
        /* Per lesson when the lab names its lessons; otherwise every lesson of
           its objective. */
        (l.lessons || o.lessonIds).forEach(function (lid) {
          var L = m.lessons[lid];
          if (L) (L.officialLabs = L.officialLabs || []).push(l);
          else m.trainingUnmapped.push(l.title + ' (lesson ' + lid + ' not found)');
        });
      });
    }

    return m;
  }

  /* ------------------------------------------------------------- coverage */

  /* Coverage is about what the GUIDE provides for each official bullet, not
     about the learner. Learner state lives in progress.js.

       covered  - a lesson teaches it, and at least one question tests it
       partial  - a lesson teaches it, but nothing tests it yet
       missing  - no lesson lists it in sub_objectives

     Lab applicability is reported beside the status rather than folded into
     it: several objectives legitimately have no billable resource to deploy,
     and the brief is explicit that this must not read as a gap. */
  function coverage(m, bullet) {
    var lessons = bullet.lessonIds.map(function (id) { return m.lessons[id]; }).filter(Boolean);
    var hasLab = lessons.some(function (l) { return l.hasLab; });
    var visual = lessons.some(function (l) { return l.hasVisual; });
    var distinctions = lessons.some(function (l) { return l.distinctionNs.length > 0; });
    var status = !lessons.length ? 'missing' : (bullet.questionIds.length ? 'covered' : 'partial');
    return {
      status: status,
      lessons: lessons,
      lab: hasLab ? 'available' : 'n/a',
      visual: visual,
      distinctions: distinctions,
      questions: bullet.questionIds.length
    };
  }

  /* ----------------------------------------------------------------- load */

  function load(manifest) {
    if (model) return Promise.resolve(model);
    if (job) return job;
    if (!manifest && global.SC500App) manifest = global.SC500App.getManifest();
    if (!manifest) return Promise.reject(new Error('manifest not loaded'));

    var ids = [], texts = {}, quizzes = {};
    var tasks = [];

    manifest.domains.forEach(function (d) {
      d.modules.forEach(function (mod) {
        ids.push(mod.id);
        tasks.push(getText(mod.content).then(function (t) { texts[mod.id] = t; }));
        /* Module 0 has no knowledge check by design; do not request one. */
        if (d.weight && d.weight !== 'n/a') {
          tasks.push(getJson('quizzes/' + mod.id + '.json').then(function (q) { if (q) quizzes[mod.id] = q; }));
        }
      });
    });

    var a6Index = -1;
    (manifest.appendix || []).forEach(function (a, i) {
      if (/\/a6-[^/]+\.md$/.test(a.content)) a6Index = i;
    });
    var a6Path = a6Index >= 0 ? manifest.appendix[a6Index].content : A6_FALLBACK;

    var snapshot = '', a6 = '', training = null;
    tasks.push(getJson('content/official-training.json').then(function (t) { training = t; }));
    tasks.push(getText(SNAPSHOT).then(function (t) { snapshot = t; }));
    tasks.push(getText(a6Path).then(function (t) { a6 = t; }));

    job = Promise.all(tasks).then(function () {
      model = build(manifest, snapshot, texts, quizzes, a6, a6Index, training);
      model.a6Path = a6Path;
      job = null;
      return model;
    });
    return job;
  }

  global.SC500Curriculum = {
    load: load,
    coverage: coverage,
    norm: norm,
    get: function () { return model; },
    /* exposed for tests and for the coverage view's self-check */
    _parseSnapshot: parseSnapshot,
    _parseDistinctions: parseDistinctions
  };
})(window);
