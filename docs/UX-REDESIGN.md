# Certification-first UX redesign

Status record for the redesign brief ("SC500 Academy Certification-First UX
Redesign"). It says what was built, where it lives, what was deliberately not
done, and what the content backlog is. Update it when an item moves.

Last updated: 2026-09-22 (second pass: 13 questions added)

---

## 1. What the learner now sees

| Question the brief asks the learner to be able to answer | Where it is answered |
| --- | --- |
| What am I studying? | Lesson header: official objective with its outline position (e.g. `1.1`), and "What you need to know" listing the verbatim sub-objectives |
| Where am I? | Breadcrumbs (SC-500 › domain › objective › lesson) and the domain mark: colour + icon + name, identical everywhere |
| What do I need to know? | Orient stage: the sub-objectives in Microsoft's wording, plus "Recommended before this lesson" |
| How does it fit together? | Learn stage; diagrams where one exists (Visualize link in the stage rail) |
| What could I confuse? | Distinguish stage: the A6 comparisons that name this lesson, with the trap visible, plus Common failure modes |
| Can I apply it? | SC-500 Exam Lens, the lab card (Practice), the knowledge check |
| Did I understand it? | Per-question knowledge check with Correct answer / Why / Why not the others / Objective |
| What did I get wrong? | Needs review (per sub-objective) and Answered incorrectly (per question), in Exam prep |
| What should I do next? | Next step block at the end of every lesson; Continue learning on the dashboard |
| How much have I covered? | Dashboard domain cards and the objective status table: Studied / Practised / Knowledge checked |

## 2. Learning model

### Progress states (assets/js/progress.js)

Tracked separately. Opening or scrolling a page never counts as any of them.

| State | Set when | Unit on the dashboard |
| --- | --- | --- |
| Studied | the lesson is marked studied, or its checklist is complete | official sub-objectives whose lesson is studied |
| Practised | every checklist item on the lab page is ticked. The checklist includes teardown, so a lab that is still billing is not practised | labs completed / labs in the domain |
| Knowledge checked | every question on the sub-objective was answered correctly on its latest attempt | sub-objectives, out of those that have questions |

- A lesson with no lab is reported as "No lab" and left out of lab totals.
- A sub-objective with no questions is reported as "No questions yet", never as unchecked.
- A lesson counts as checked at 80% correct with every question answered (unchanged threshold). A single sub-objective is strict: all of its questions correct.
- "Needs review" = the latest answer to any of its questions was wrong. It clears when you answer correctly. Mock exam answers count too.
- There is no readiness percentage and no pass prediction anywhere, by design.

Storage stays under `sc500:progress:v1`. The redesign only added keys
(`answers`, `marks`, `last`). Old exports import into the new build; new
exports import into the old build (extra keys ignored). Old whole-quiz records
are still honoured as a fallback until per-question answers exist.

### Lesson anatomy (assets/js/lesson.js)

Built from the headings the modules already use. No content file was
restructured. A heading the layer does not recognise goes to LEARN in its
original order, so content cannot disappear.

| Stage | Source in the module |
| --- | --- |
| Orient | `## Sub-objectives covered` (verbatim bullets), front-matter `prerequisites` |
| Learn | `## Why this exists`, `## How it works under the hood`, `## Configuration surface`, anything unrecognised |
| Visualize | first ` ```mermaid ` block, linked from the stage rail; the diagram stays in place |
| Distinguish | A6 sections that name the module, `## Common failure modes`, `## How this is tested` (rendered as the SC-500 Exam Lens) |
| Practice | lab card built from the manifest and front matter; replaces `## Hands-on` |
| Check | quiz file, then `## Check yourself` as "Explain it yourself" |
| Review | `## Takeaways` if present, Next step, `## Sources`, `forensic_relevance` as a collapsed "Beyond the exam" panel |

### Domain identity (assets/js/domains.js, assets/css/tokens.css)

| Domain | Colour | Icon | Label |
| --- | --- | --- | --- |
| 01 | `#0078D4` | person | Identity, Access & Governance |
| 02 | `#008272` | stacked layers | Storage, Databases & Networking |
| 03 | `#8661C5` | chip | Compute Security |
| 04 | `#D83B01` | shield | Security Posture & Monitoring |
| 00 | neutral | hexagon | Lab Safety (not an exam domain) |

Tokens per domain: `--d-NN` (borders, indicators, fills; >= 3:1 on every
surface in both themes), `--d-NN-ink` (text; >= 4.5:1), `--d-NN-tint`
(backgrounds). `--domain-NN` remains as an alias. Contrast was measured, not
estimated.

### Coverage model (assets/js/curriculum.js)

Derived at page load; nothing is maintained by hand.

- Authority: `docs/SKILLS-MEASURED-SNAPSHOT.md` (domain › objective › bullet).
- Join: verbatim text, normalised for whitespace and dashes.
  - lesson front matter `sub_objectives` → bullet
  - quiz `sub_skill` → bullet
  - A6 `**Module(s) NN-NN.**` line → lesson
- Objective ids (`2.3.4`) are positions in the snapshot, assigned by the site.
  Microsoft does not number objectives; the coverage page says so.
- Status per bullet:
  - Covered: a lesson teaches it and at least one question tests it.
  - Partial: a lesson teaches it, but no question tests it yet.
  - Missing: no lesson lists it.
- Lab availability is shown beside the status, never folded into it.
- Freshness: a lesson sub-objective that no longer matches the snapshot, or a
  question whose `sub_skill` matches nothing, is listed under "Needs maintainer
  review" on `#/coverage`.

## 3. Routes

| Route | View | File |
| --- | --- | --- |
| `#/` | Dashboard | dashboard.js |
| `#/module/<id>` | Lesson | lesson.js |
| `#/module/<id>/check` | Lesson, scrolled to a stage | app.js |
| `#/lab/<id>` | Lab mode | lesson.js |
| `#/domain/<01-04>` | Domain review | review.js |
| `#/coverage` | Objective coverage | review.js |
| `#/prep` | Exam prep overview | review.js |
| `#/prep/<filter>` | `needs-review`, `incorrect`, `unanswered`, `later`, `mixed`, `domain/<id>`, `objective/<id>` | review.js |
| `#/exam`, `#/cards`, `#/review` | Mock exam, flashcards, retention | practice.js (existed, now routed) |
| `#/preview` | Verification watchlist | watchlist.js (existed, now routed) |
| `#/appendix/<n>` or `#/appendix/a6` | Appendix, by position or by file prefix | app.js |
| `#/cost`, `#/readiness` | Unchanged | views.js |

## 4. Authoring conventions introduced

### Optional quiz fields

Rendered only when present; nothing is inferred when they are absent.

```json
{
  "why_not": [null, "Why option B fails", "Why option C fails", null],
  "difficulty": "scenario",
  "concept": "Conditional Access evaluation",
  "misconception": "Policies are evaluated in priority order"
}
```

- `why_not`: an array aligned with `options` (use `null` for correct options),
  or an object keyed by option index.
- `difficulty`: `foundation`, `applied` or `scenario`.
- All four fields are optional.
- The validator does not check them yet.

### Diagrams

A ` ```mermaid ` flowchart in any lesson renders, and the lesson gains a
Visualize link. Mermaid loads only on pages that contain a diagram.

- Put `accTitle:` and `accDescr:` on the first lines of the diagram. Mermaid
  writes them into the SVG as its accessible name.
- Give a node a domain colour with `:::d01` to `:::d04` (or `:::d00`).
  Always keep a text label on the node as well.
- Only draw what the lesson text already states. The exemplar in 01-01
  restates the five Conditional Access rules and labels each box with its rule
  number.

### Comparisons

The comparison component is any A6 section that follows the existing pattern:

1. `## N. Question-shaped title`
2. `**Module(s) NN-NN.**`
3. A table whose first column names the options.
4. A `> **The trap.**` blockquote.

A section in that shape appears automatically in every lesson it names and in
that domain's review. Every table with three or more columns becomes one card
per row on narrow screens, with no content changes.

## 5. Fixed while doing this

| Problem | Effect before | Fix |
| --- | --- | --- |
| practice.js, watchlist.js, practice.css and sw.js were committed in 364e215 but never loaded or routed | Mock exam, flashcards, retention and watchlist fell back to the dashboard; offline mode never registered | index.html, app.js routes, nav |
| A6-A11 not in the manifest | Unreachable; validator orphan warnings | Added to `content/manifest.json` (A7 kept by decision, section 14) |
| frontmatter.js kept the closing quote of inline list items | Every prerequisite link was `#/module/00-00"` | parser fix |
| Relative links resolved by stripping `../` | 129 internal links pointed at the dashboard | resolve against the containing file, as GitHub does |
| Links to scripts/*.ps1 rewritten to the dashboard | Unreachable | sent to the file on GitHub |
| Domains 03 and 04 in near-identical purples | Domain colour could not identify the domain | new palette with icons |
| Mermaid (3.5 MB) loaded on every page, used by none | First-visit weight | lazy-loaded on demand |
| Unlabelled scroll regions, blank table header cells, unnamed progress bar | axe-core violations | named regions, visually hidden header text, labels |
| The field card sat above the lesson below 1180 px | First phone screen of every lesson was metadata | moved below content |
| Validator failed main with 29 errors | CI red on every push, so real regressions were invisible | Three rules corrected in `tools/Test-GuideContent.ps1` |

## 6. Verification performed

- All 69 routes on the current manifest (75 with the A6-A11 patch) loaded
  with no JS errors and no unresolved internal links. This was a headless
  Chromium sweep, including a pre-redesign progress blob in localStorage.
- axe-core (WCAG 2.0/2.1 A and AA plus best practice) was run on the
  dashboard, lessons, labs, domain review, coverage, exam prep, mock exam and
  an appendix, in both themes. There were zero violations after fixes.
- Screenshots were checked at 1400 px and 390 px, in light and dark.
- `tools/Test-GuideContent.ps1` was run under PowerShell 7.4.6:
  - on `main` before this work: FAIL, 29 false-positive errors;
  - with the three validator rules corrected: PASS, 7 warnings;
  - with A6-A11 in the manifest as well: PASS, 1 warning (lab 00-01 had no
    numbered part);
  - with lab 00-01's methods under `## Part 1` (headings only): PASS, no issues.

## 7. Status against the brief

### P0: certification learning foundation

| Item | Status |
| --- | --- |
| Domain colour system | Done |
| Dashboard redesign | Done |
| Objective-based progress | Done |
| Consistent lesson anatomy | Done, as a rendering layer |
| Contextual navigation | Done: breadcrumbs, previous, recommended next, related |
| Exam Lens component | Done |
| Knowledge-check redesign | Done. All 109 questions carry per-option `why_not` notes |
| Comparison component | Done (A6 pattern plus responsive tables) |
| Domain review | Done |
| Coverage matrix | Done |

### P1: learning effectiveness

| Item | Status |
| --- | --- |
| Visual explanations | Done: 7 diagrams (00-02, 01-01, 01-02, 02-03, 02-04 x2, 04-03). Legible on phones |
| Prerequisite system | Done, from existing front matter. No primers written |
| Weak-area / review tracking | Done |
| Bookmarks | Done ("Review later") |
| Exam Prep mode | Done |
| Lab UX redesign | Done: lab mode header, part tracker with resume, completion section |
| Search | Done: domain + objective context, acronym matching |
| Progressive disclosure | Partial: comparisons, "Beyond the exam", Review pass. Learn-stage H3s stay visible because they are exam-critical |

### P2: product polish (not started, per brief)

- Freshness automation beyond what the coverage page and outline-drift
  workflow already do.
- Retiring `#/readiness`, which Exam prep now supersedes.

## 8. Content backlog

These are content gaps, which the brief says not to fabricate. They are listed
so they can be written from Microsoft Learn deliberately.

### 1. Sub-objectives with no knowledge-check question - closed 2026-09-22

Thirteen questions were added, one per untested sub-objective, so the coverage
view now reports 87 of 87 as Covered. Each was written from the module's own
text, and the claims each depends on were checked against Microsoft Learn on
that date. That covers Bastion subnet naming and size and Premium session
recording, the plans that provide machine secrets scanning, name reuse for
soft-deleted Key Vault objects, and Arc auto-provisioning through the AWS
connector. Each question has `why_not`, `difficulty`, `concept` and
`misconception`.

| Question | Sub-objective |
| --- | --- |
| 01-01-q6 | 1.1.1 PIM |
| 01-02-q6 | 1.2.1 Deploy Key Vault |
| 01-02-q7 | 1.2.5 Keys, secrets and certificates |
| 01-02-q8 | 1.2.6 Secret scanning with Defender CSPM |
| 01-03-q6 | 1.3.2 Regulatory compliance |
| 01-03-q7 | 1.3.3 Standards and recommendations |
| 01-03-q8 | 1.3.5 Built-in role assignments |
| 01-03-q9 | 1.3.9 Security controls by IaC |
| 02-03-q6 | 2.3.3 Virtual WAN |
| 02-04-q6 | 2.3.7 Private Link services |
| 03-04-q7 | 3.2.2 Bastion |
| 03-04-q8 | 3.2.4 Azure Arc |
| 03-04-q9 | 3.2.5 Defender for Servers onboarding |

**01-01-q6 depends on the validator patch.** The current validator gives each
bullet a single owner module. For PIM that owner is 00-02, which comes first,
so a PIM question in 01-01 fails the check - and 00-02, as Module 0, has no
quiz. That rule is the likely reason 1.1.1 was the one Domain 1 bullet with no
question. The corrected rule gives Module 0 no ownership, which resolves it.

Question count per domain after this change, against sub-objectives:

| Domain | Questions | Sub-objectives |
| --- | --- | --- |
| 1 | 23 | 22 |
| 2 | 22 | 16 |
| 3 | 36 | 29 |
| 4 | 28 | 20 |

### 2. Other content gaps

- `why_not` notes: done for all 109 questions (2026-09-22).
  - For the original 96, each note restates the question's own explanation or
    its module. No new product claims were introduced.
  - Where neither covered a distractor, the note explains why it fails the
    stated requirement rather than asserting new behaviour.
- Question review. Two existing questions had wording problems, found while
  writing the notes:
  - **01-02-q1** — fixed. Option C said "a resource lock". A ReadOnly lock
    would in fact stop a Contributor adding an access policy, because
    Contributor cannot remove locks, which made that option arguably correct.
    It now names a CanNotDelete lock, which does not block the write.
  - **01-03-q5** — rewritten 2026-09-22.
    - The premise now uses `NotDataActions: Microsoft.KeyVault/vaults/secrets/getSecret/action`,
      the data action that returns a secret's value.
    - The two keyed explanations are unchanged: another assignment grants the
      action, or the vault uses access policies.
    - The old `secrets/read` premise is now a distractor.
    - Verified against Microsoft's role and permission reference: `secrets/read`
      "view the properties of a secret, but not its value"; `getSecret/action`
      "gets the value of a secret"; NotDataActions "is not a deny rule"; Key
      Vault data roles "only work for key vaults that use the Azure role-based
      access control permission model".
    - The lesson's self-check item 3 was aligned to the same premise.
- Official course. Course SC-500T00-A is published on Microsoft Learn; its page
  was updated 2026-07-30. The README said no learning path existed; corrected.
  Now mapped - see section 9.
- Takeaways: no lesson has a `## Takeaways` section. The Review stage shows
  one when it exists.
- Diagrams: 5 of 18 lessons. Added 2026-09-22:
  - Key Vault's two planes (01-02)
  - inbound evaluation order for security admin rules and NSGs (02-03)
  - service endpoint versus private endpoint (02-04)
  - the Sentinel collection pipeline (04-03)

  Each restates its lesson's own text and carries `accTitle`/`accDescr`.
  04-03's diagram replaces an ASCII sketch of the same pipeline and adds the two
  routes its own sections describe. Left-to-right layouts were turned top-down
  after a phone-width check. Below 640 px a diagram keeps a minimum width and
  scrolls sideways in a named, keyboard-focusable container.

  Added 2026-09-23:
  - Azure Firewall rule-processing order (02-04). Threat intelligence first; then
    the DNAT, network and application passes; the network-match stop; the
    infrastructure collection; the default deny.
  - The PIM activation path (00-02). Eligible, then a `selfActivate` request, then
    the role management policy, then a new active assignment, then back to the
    unchanged eligibility, with an audit record for every request.

  Both restate their lesson's own numbered steps and sections. Identity nodes are
  in Domain 1 blue and network nodes in Domain 2 teal.
- Prerequisite primers (short foundational explainers): none written.

## 9. Official Microsoft training (added 2026-09-22)

The single source is `content/official-training.json`. Like everything else,
it is joined to objectives on the heading text in the skills snapshot.

| What | Source it was verified against | Result |
| --- | --- | --- |
| Course SC-500T00-A | learn.microsoft.com course page (updated 2026-07-30) | 12 syllabus entries |
| 12 learning paths | `github.com/MicrosoftDocs/learn`, `learn-pr/paths/<slug>/index.yml`: exact titles and module counts | One per official objective; 63 modules in total, matching the course |
| 16 labs | `github.com/MicrosoftLearning/mslearn-sec-identity` at commit `612f838` (2026-08-12): titles and descriptions from each lab file | 11 of 12 objectives have at least one |

- **Discovery.** The path links were first found through a third-party study
  guide; every one was then verified against Microsoft's own source. Nothing
  from that guide's exam-experience section was used.
- **Lab mapping.** Assigning each lab to an objective is this repository's
  judgement, based on each lab's own description. Objective 3.2 (servers and
  VMs) has no Microsoft lab; its lessons say so rather than implying one.
- **Where it shows:**
  - each lesson's Orient stage ("Official Microsoft training for this
    objective");
  - the domain review summary;
  - the coverage page (per objective, plus a summary line);
  - entries that no longer match an objective are listed under "Needs
    maintainer review".
- **Safety.** Microsoft's labs deploy real resources too. The lesson note tells
  learners to apply Module 0's budget and teardown rules to them.
- **Freshness.** `.github/workflows/outline-drift.yml` has a third poll, run
  weekly. It re-fetches every path definition and checks its title and module
  count, checks that every lab file still exists, and raises the drift issue
  on any change.
  - Tested locally under PowerShell 7.4.6 against the live sources. A clean
    run reports no change; a negative test with four injected faults reported
    all four.
  - On its first run, it found that one module uid uses a different prefix
    (`learn-wwl.`). The count is therefore taken from the `modules:` list
    itself rather than from a prefix.

## 10. Accessibility gate (added 2026-09-22)

`.github/workflows/a11y.yml` runs `tools/a11y-check.js` on every push to
`main` and on every pull request.

- **What it checks.** One page of every kind in both themes: dashboard, a
  lesson with a diagram, a lab, a domain review, coverage, exam prep, the mock
  exam and an appendix. Each gets axe-core against WCAG 2.0/2.1 A and AA plus
  best practice.
- **What fails the run.** Any violation, or any JavaScript error while a page
  renders.
- **Dependencies.** Playwright 1.56.0 and axe-core 4.13.0 are pinned and
  installed in CI only; nothing is added to the site.
- **Verified locally:**
  - clean on all 18 page loads;
  - a negative test that injected an image without alt text failed on all 18,
    as it should.

## 11. Repository housekeeping (added 2026-09-22)

- **README** now answers seven questions:
  - what the Academy is;
  - who it is for;
  - how to launch it, online or locally;
  - how it is organised for studying;
  - how content maps to SC-500;
  - how content is checked;
  - how to contribute.

  Two false claims were removed from it (see CHANGELOG).
- **`docs/CONTRIBUTING.md`** gains:
  - the quiz conventions (`why_not` on every question), diagram rules, and the
    `official-training.json` rule;
  - how to run the accessibility check locally, and the `CACHE_VERSION` rule;
  - three new "deliberate" decisions;
  - corrected descriptions of the duplicate-ownership rule and of CI strictness.
- **New files:**
  - `.github/ISSUE_TEMPLATE/`: content error (needs a Microsoft Learn source; no
    exam content), lab problem (teardown confirmation required; secrets must be
    redacted), site problem, and `config.yml`, which routes security reports to
    SECURITY.md;
  - `.github/PULL_REQUEST_TEMPLATE.md`;
  - `SECURITY.md`, whose scope includes labs that leave something exposed or
    billing;
  - `CHANGELOG.md`.
- **`404.html`** now keeps the `/<repo>/` segment on `*.github.io`, and uses the
  root on a custom domain. Tested both ways.
- **`index.html`** gains Open Graph title and description. There is no share image.
- **`sw.js`** now also caches `content/official-training.json` offline.

### Repository settings to set by hand (not stored in files)

- **Description:** Certification-first interactive study guide for Microsoft Exam
  SC-500 (Cloud and AI Security Engineer Associate): lessons, labs with mandatory
  teardown, and knowledge checks mapped to every official objective.
- **Website:** https://ironbranded.github.io/SC500-Academy/
- **Topics:** `sc-500`, `microsoft-certification`, `azure-security`, `study-guide`,
  `microsoft-learn`, `microsoft-entra-id`, `defender-for-cloud`,
  `microsoft-sentinel`, `ai-security`, `static-site`
- **Labels** used by the issue forms: `content`, `lab`, `site`. They are already
  in use by `outline-drift`. GitHub silently skips a label that does not exist, so
  create these first.
- **Private vulnerability reporting:** Settings → Code security → enable. SECURITY.md
  assumes it is on.

## 12. Exclusive domain colours (added 2026-09-22)

Four meanings shared orange: Domain 4 (`#D83B01`, from the brief), Medium lab cost,
Preview status, and Needs review. The last was introduced by this redesign. In light
mode, "Low cost" was `#0078d4`, identical to Domain 1.

**Measurements, before the change:**
- Needs review against Domain 4's text colour, light mode, simulated protanopia:
  **CIEDE2000 0.2** - indistinguishable.
- Light-mode Preview badge contrast: **3.96:1**, failing AA.

**Resolution (`assets/css/tokens.css`, "RESERVED HUES" in its header):**
- The three caution meanings share one amber: `#efd36b` dark, `#4f3c00` light.
- Low cost is neutral grey: `#a19f9d` dark, `#605e5c` light.
- Values were chosen by constrained search:
  - text and chip contrast at least 4.6:1;
  - hue kept in the amber band (40-54 degrees);
  - lightness and saturation bounded so the result is calm, not neon;
  - maximising the worst-case CIEDE2000 distance from Domain 4 under simulated
    protanopia and deuteranopia (Machado et al. 2009, severity 1.0).
- The unconstrained optimum was neon yellow in dark mode and near-black in light
  mode, both rejected.

| | Dark | Light |
| --- | --- | --- |
| Text contrast | 10.5:1 (was 7.5) | 10.1:1 (was 6.6; Preview 3.96) |
| Distance from Domain 4, normal vision | 32.7 (was 17.7) | 28.7 (was 11.5) |
| Worst case, protanopia or deuteranopia | 14.5 (was 9.7) | 7.1 (was 0.2) |

**Limit, stated plainly.** In light mode, every dark, warm, AA-compliant text
colour stays within reach of Domain 4's dark orange for protanopes. Hue cannot
separate them fully without failing contrast. That is why every state keeps its
glyph and word, and every domain mark keeps its icon and label.

**Deliberately unchanged:**
- The interactive accent (links, buttons, focus) stays Azure blue, by convention.
- Syntax-highlight colours apply only inside code blocks.

**Accessibility gate.** It now includes a Preview lesson (03-02), the verification
watchlist and the cost planner. Run against the old colours, it failed on the
Preview badge, which confirms the gap is closed. It also caught an empty header
cell in the watchlist table, now fixed.

## 13. Performance, measured (2026-09-22)

**Method.** Each case was a first visit with an empty cache:
- a phone viewport, throttled to Lighthouse's "Slow 4G" mobile profile (150 ms
  round trip, 1.6 Mbps down, 750 kbps up) and a 4x slower CPU;
- served through a local server that gzips text responses, as GitHub Pages does;
- median of three runs per case.

"Ready" means the page's own main content has rendered: the dashboard's domain
cards, or the lesson header and body. `main` is the site before this redesign.

| Page | `main` | Redesign | Downloaded (gzip) |
| --- | --- | --- | --- |
| Dashboard `#/` | 7.5 s | **3.2 s** | 1.17 MB → 0.34 MB |
| Lesson `#/module/01-01` | 7.8 s | **2.0 s** | 1.04 MB → 0.35 MB |
| Lesson `#/module/02-03` | 7.8 s | **2.0 s** | 1.04 MB → 0.35 MB |

With no compression, the gap is wider: 21.2 s → 6.4 s for the dashboard, and
21.8 s → 3.4 s for a lesson.

**Where the difference comes from.** `main` loaded Mermaid (3.5 MB, about 0.99 MB
gzipped) on every page before rendering anything. The redesign loads it only on
the five lessons that contain a diagram, after their text has rendered. On those
five, the diagram can arrive a few seconds after the text on a slow connection.
That is the intended trade.

**What the redesign added, and what it costs.**
- The dashboard, and each lesson's enrichment, read all 22 lesson files and 18
  quiz files to compute objective-level progress. That raises the request count
  from 23-43 to 71-73. By weight it costs far less than the Mermaid bundle it
  replaced.
- On GitHub Pages this is multiplexed over HTTP/2, so request count matters less
  than it does against a local HTTP/1.1 server.
- After the first visit on the live site, the service worker serves everything
  from its cache.

**Not done, deliberately.**
- Reading only each lesson's front matter using HTTP range requests would cut
  dashboard bytes further. But a service worker cannot cache partial (206)
  responses, and the gain is under a second on slow 4G. Not worth the fragility.
- A generated index file would need a build step, which the project rules out.

## 14. Appendix A7 (decision support)

A7 covers only services that Microsoft's SC-500 study guide links in its own
documentation table without giving them a bullet. It quotes Microsoft's statement
that "related topics may be covered in the exam", and it marks itself as outside
the 87-objective contract. That is certification scope, not generic security
reading.

**Decision (maintainer, 2026-09-23): keep A7 in the manifest**, as the patch
notes list it. Its wording "owned by exactly one module" was aligned to "exactly
one exam module".

## 15. Official training at module level (added 2026-09-23)

`content/official-training.json` now records every module of the 12 learning
paths - 63 in total - with its uid, title, URL and the lesson or lessons it
serves. Each of Microsoft's 16 labs also names its lessons. A lesson's "Official
Microsoft training for this lesson" box lists its own modules first, then the whole
learning path, then only the labs that apply to it.

**Verification.**
- 61 modules were read from their source `index.yml` in `MicrosoftDocs/learn`,
  each confirmed by matching `uid`.
  - Four of those live in folders named differently from their uid, and were
    found by searching the source tree.
- The remaining two are not in the public source and were confirmed on their
  Microsoft Learn pages:
  - *Authenticate your API plugin for declarative agents with secured APIs*;
  - *Implement API backend security using Azure API Management* (its source was
    found under `implement-application-interface-security-management`, uid
    confirmed).
- The 63 recorded uids match Microsoft's live path definitions exactly; the
  drift poll's clean run confirms it.

**Mapping (this repository's judgement, from each module's title and summary, and
each lab's own task list).**
- Every exam lesson has at least one module.
- Three items serve more than one lesson:
  - the VPN and Entra Private Access module: 02-03 and 02-04;
  - Lab 2C: 02-03 (NSGs, ASGs) and 02-04 (Azure Firewall, private endpoint);
  - Lab 4E: 04-02 (workspace, Content hub), 04-03 (connectors) and 04-04
    (automation rules).
- *Evaluate regulatory compliance in Defender for Cloud* appears in both the 1.3
  and 4.1 paths, and is listed under 01-03 and 04-01 respectively.
- Lesson 03-04 has no Microsoft lab, and says so.

**Freshness.** The weekly drift poll now compares each path's **exact module
list**, not only its count. A module swapped for another of the same count is
reported by uid, as "added" and "removed". Tested:
- a clean run reports no change;
- with one uid swapped, both sides of the swap are named.

The mapping is rebuilt with the same assignment rules by the script noted in the
commit history; edit the JSON directly for one-off changes.
