# Changelog

Notable changes to SC500 Academy, newest first. Content corrections that change a
factual claim are listed here with the lesson id. Routine `last_verified` bumps are
not.

## [Unreleased] - certification-first redesign

The whole site was reorganised around one question: what does a learner need, right
now, to pass SC-500? `docs/UX-REDESIGN.md` has the full record: what maps to what,
the verification run, and the backlog.

### Added

- **Learning dashboard.** It shows a Continue-learning recommendation, and per-domain
  Studied, Practised and Knowledge-checked counts per official sub-objective, with an
  objective status table. There is deliberately no readiness percentage.
- **Consistent lesson stages:** Orient, Learn, Visualize, Distinguish, Practice,
  Check, Review. Each lesson also gets:
  - breadcrumbs and a stage rail;
  - "What you need to know", listing the verbatim sub-objectives with their outline
    positions;
  - prerequisites marked with whether each one has been studied;
  - the SC-500 Exam Lens;
  - the A6 comparisons shown inline;
  - a lab card;
  - a Next-step block.
- **Knowledge checks answered one question at a time.** After each answer the site
  shows the correct answer, why, why not each other option, and the objective. Every
  answer is recorded per question.
- **Domain review** (`#/domain/<id>`), **Exam prep** (`#/prep`), including "Review
  later" bookmarks and "Needs review", and **Objective coverage** (`#/coverage`),
  derived live from the skills snapshot.
- **Lab mode.** A distinct header showing cost, time, resources created and the
  teardown requirement, plus a part tracker you can resume from.
- **Domain colour system.** Four exam-domain colours, contrast-checked in both
  themes, always paired with an icon shape and a text label.
- **Thirteen new questions,** closing every untested sub-objective. There are now 109
  questions, and every one carries per-option `why_not` notes.
- **Seven diagrams:** 00-02 (the PIM activation path), 01-01, 01-02, 02-03, 02-04
  (twice, including Azure Firewall's rule-processing order) and 04-03. They are
  domain-coloured, screen-reader labelled and legible on phones.
- **Official Microsoft training mapped to every objective**
  (`content/official-training.json`). It covers Course SC-500T00-A's 12 learning paths
  and Microsoft's 16 labs, all verified against Microsoft's own sources.
- **Official training at module level.**
  - All 63 Microsoft Learn modules of SC-500T00-A are mapped to the lessons they
    serve, and so are Microsoft's 16 labs.
  - Each lesson lists its own modules and labs, not the whole objective's.
  - The drift poll compares exact module lists.
- **New CI:** an accessibility gate (`.github/workflows/a11y.yml`), and a third
  outline-drift poll that watches the linked official training.
- **README rewritten for learners.** It now covers purpose, how to use the Academy
  with Microsoft Learn and Course SC-500T00-A, a table of contents linking every
  lesson, lab, appendix and study tool, a study plan, and a short guide to the labs.
  Repository layout and CI moved to `docs/CONTRIBUTING.md`.
- **Repository housekeeping:** issue forms, a pull request template, this changelog,
  and `SECURITY.md`.

### Changed

- The investigation note (`forensic_relevance`) moved from the top of each lesson to
  a collapsed "Beyond the exam" panel. It is useful, but not measured.
- Mermaid loads only on pages that contain a diagram, rather than on every visit
  (3.5 MB). Measured on a first visit over simulated slow 4G, gzipped as on GitHub
  Pages:
  - the dashboard is ready in 3.2 s instead of 7.5 s;
  - a lesson is ready in 2.0 s instead of 7.8 s;
  - about 70% less is downloaded.

  See `docs/UX-REDESIGN.md` section 13.
- Below 1180 px, the field card now sits below the lesson instead of above it.
- Search results show their domain and objective, and match common acronyms.
- **Domain colours are now exclusive.** Orange means Domain 4 and nothing else.
  - The three other oranges beside it - Medium cost, Preview status, Needs review -
    become one "caution" amber: `#efd36b` dark, `#4f3c00` light.
  - Low cost moves from `#0078d4`, identical to Domain 1 in light mode, to neutral
    grey.
  - Values were chosen by measurement (tokens.css, RESERVED HUES). Normal-vision
    distance from Domain 4 is now 32.7 / 28.7 CIEDE2000, up from 17.7 / 11.5.
  - Worst case under simulated protanopia or deuteranopia is 14.5 / 7.1, up from
    9.7 / 0.2.
- 01-03-q5 rewritten. The old premise put `Microsoft.KeyVault/vaults/secrets/read` in
  NotActions. That is a control-plane action which views a secret's properties, not
  its value, so the likeliest explanation was missing from the options.
  - The new version excludes the data action that returns the value,
    `secrets/getSecret/action`, in NotDataActions. It keeps both original
    explanations as the correct answers.
  - The old premise becomes a wrong option, with a why-not note.
  - Lesson 01-03's matching self-check and its RBAC paragraph were aligned. Two
    Sources entries were added: Azure role definitions, and the built-in roles for
    Security.
  - All of this was checked against Microsoft's role and permission reference.
- 01-02-q1: option C now names a CanNotDelete lock. "A resource lock" also covered
  ReadOnly, which would have made the option arguably correct.

### Fixed

- The mock exam, flashcards, retention review, verification watchlist and offline
  support, all committed in 364e215, were never loaded or routed. They are now
  reachable.
- Appendices A6-A11 were missing from the manifest. They are now listed, and A7 is
  kept by the maintainer's decision.
- Prerequisite links were broken: the front-matter parser kept the closing quote, so
  links went to `#/module/00-00"`.
- 129 internal links resolved to the dashboard. Relative links are now resolved
  against the file that contains them.
- `404.html` redirected to the domain root instead of the Academy.
- Light-mode Preview badge contrast was 3.96:1, below the AA minimum of 4.5:1; it
  is now 10.1:1. The accessibility gate missed it because none of its pages showed
  a Preview badge. The gate now also covers a Preview lesson (03-02), the
  verification watchlist and the cost planner.
- The verification watchlist table had an empty header cell (axe
  `empty-table-header`). It now has a screen-reader name.
- README: removed the claim that Microsoft had published no learning path. Course
  SC-500T00-A has existed since at least 2026-07-30.
- README: removed the claim that every sub-objective maps to exactly one module. PIM
  is also practised in Module 0.

- The validator failed `main` with 29 false-positive errors, so CI was red on every
  push. Three rules in `tools/Test-GuideContent.ps1` were corrected:
  - Module 0 is no longer held to the exam-lesson section skeleton.
  - Module 0 no longer "owns" a sub-objective. That rule had blocked any PIM
    question in 01-01.
  - The snapshot parser counts only bullets under an objective heading.

  It now passes with no issues. The last warning was lab 00-01 having no numbered
  part. Its two methods now sit under `## Part 1`, headings only, which also gives
  that lab its part tracker.

### Removed

- `assets/js/objectives.js`, superseded by the coverage view.

## Earlier history

Before this changelog existed, changes were recorded only in commit messages.
Run `git log --oneline` from `3c564ed` (the scaffold, outline verified 2026-09-15)
onwards to see them.
