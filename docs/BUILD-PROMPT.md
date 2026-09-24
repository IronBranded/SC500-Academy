# Build Prompt

The standing brief for anyone - human or model - adding to this repository. It
**replaces the original master prompt**, whose Sections 5.3, 5.4 and 6 described a
twelve-file layout and a scaffold-script workflow that this repository moved past
months ago, and whose Phases 0 to 5 are all complete.

Read this, then [STYLE-GUIDE.md](./STYLE-GUIDE.md) for conventions and
[CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow. This file is the *why*;
those two are the *how*.

---

## 1. Mission

A dependency-free, self-hosted, interactive study guide for **Exam SC-500:
Implementing End-to-End Security Controls for Cloud and AI Workloads**
(Microsoft Certified: Cloud and AI Security Engineer Associate), taking a reader
with no prior Azure or Microsoft 365 security experience to first-principles
mastery of everything the exam covers.

**Comprehension outranks memorisation, and the structure enforces it.** Every
control is explained as an answer to a threat before it is named as a product.
If a module cannot explain why the control exists without using a Microsoft
product name, the module is not finished.

The reader is assumed to be capable and starting from zero **on the specific
control being taught**, whatever their background elsewhere.

---

## 2. Current state

| Thing | Count | Where |
| --- | --- | --- |
| Exam modules, each a content + lab pair | 22 | `content/NN-domain/`, `labs/NN-domain/` |
| Lab-safety modules, run before anything billable | Module 0 | `content/00-lab-safety/` |
| Appendices, including two case studies | A1 to A10 | `content/appendix/` |
| Verbatim sub-objectives, each owned by exactly one module | 87 | `docs/SKILLS-MEASURED-SNAPSHOT.md` |
| Quizzes | one per module | `quizzes/<id>.json` |
| Site | plain HTML/CSS/JS, no build step | `index.html`, `assets/` |
| Derived views | dashboard, cost, readiness, exam, cards, review | `assets/js/views.js`, `assets/js/practice.js` |
| Flashcard deck | 65 distinction cards | `flashcards/deck.json` |
| Validator | PowerShell 7, cross-platform | `tools/Test-GuideContent.ps1` |

**`content/manifest.json` is the only file that defines site structure.** It is
patched by hand, never generated.

**Twenty-two modules, not the twelve in the original prompt.** Three
sub-headings carry nine to eleven bullets each and were split. Every one of the
87 bullets lands in exactly one file, and the validator enforces that.

---

## 3. Non-negotiables

1. **Microsoft Learn is the only source of factual content.** Third-party
   material may be used to sanity-check emphasis and never as the source of a
   claim. Four prep sites contradicted each other and Microsoft on this exam's
   basic facts while A4 was being written; that is the failure mode this rule
   prevents.
2. **Every module ends with a Sources block** naming the pages actually read.
   A padded Sources block launders unverified claims and is worse than a short
   one.
3. **The coverage contract is the 87 verbatim bullets.** Appendix A7 exists for
   adjacent topics precisely so that adjacency never gets counted as coverage.
4. **Every lab ends in a mandatory `## Teardown`**, in the six buckets, naming
   what the teardown script cannot see.
5. **Every module states cost and time** before the reader creates anything.
6. **Name uncertainty rather than filling it.** Where Microsoft does not publish
   a fact, say so. Where a feature is preview, mark `status: Preview` and tell
   the reader to re-verify.
7. **Flag AZ-500 divergence in every module**, and mirror it into A5. AZ-500
   retired on 31 August 2026 and a large body of its material is still in
   circulation, some of it describing operations the platform now refuses.
8. **No content is written from cached knowledge about a moving surface.**
   Re-read the product documentation for the module being touched. Assume
   something has moved, because in this product set something usually has.

---

## 4. Shape of the material

The split that makes the guide work, and the one most likely to be eroded by a
careless contribution:

| File | Answers | Never contains |
| --- | --- | --- |
| `content/…` | Why this control exists, how it works, how it is tested | Numbered configuration steps |
| `labs/…` | How to configure it, prove it, remove it | The conceptual explanation |

A reader on a review pass reads content. A reader at a terminal reads the lab.
Required sections, the eighteen front-matter keys, and the cost-chip vocabulary
are all specified in STYLE-GUIDE.md and enforced by the validator.

**Quizzes test reasoning, not recall.** A question whose answer is a cmdlet name
or a menu path does not belong in this repository. Questions carry the verbatim
`sub_skill` they test, which is the join back to the outline.

---

## 5. Lab environment and budget

- A dedicated Microsoft 365 E5 tenant with Global Administrator access, plus a
  companion Azure subscription. E5 alone cannot cover Domains 2 to 4.
- **$400/month covers everything**, tenant and Azure consumption together.
- **Module 0 runs first**: budget and spending alerts before any billable
  resource, PIM-based just-in-time role activation instead of standing Global
  Administrator, and the teardown checklist template every lab then follows.
- **`rg-sc500-core` is never torn down.** It holds the budget, action group,
  brake runbook and `law-sc500`.
- Known budget risks, in order: **Security Copilot** (SCUs - smallest capacity,
  short bursts, deprovision immediately), **Sentinel** ingestion, **Defender for
  Cloud paid plans** (per resource per hour - enable only the plan being taught,
  disable after), and **anything with an hourly meter** - Firewall, Bastion,
  AKS, VPN gateways.
- Prefer the free path where one exists and say so, while still teaching what
  the paid tier adds, because the exam tests the paid tier.
- Where licensing makes a lab impossible, **say so plainly and give a written
  deliverable instead**. Three objectives are in this position today. None is
  skipped.

---

## 6. Delivery protocol

This repository is maintained by one person who pushes from PowerShell.

- Content is delivered as **package folders mirroring the repo tree**, copied
  into a local clone and pushed by hand.
- **No `.ps1` files are handed over.** Tooling in `tools/` is owner-maintained.
- **The manifest is patched by hand**, from an explicit patch note, never
  automatically.
- Every delivery includes the PowerShell commands to place and push it.
- **One module per commit**, content and lab together, using the commit scopes in
  CONTRIBUTING.md.
- `tools/Test-GuideContent.ps1` runs before every commit. It is currently the
  only gate, by choice.

---

## 7. Standing verification ritual

Before writing, and again before an exam sitting:

1. Re-fetch the skills-measured outline and diff it against
   `docs/SKILLS-MEASURED-SNAPSHOT.md`. If it moved, update the module's
   `sub_objectives`, the manifest, `docs/SYLLABUS.md` and the snapshot in one
   commit.
2. Re-read the product docs for the module being touched.
3. Check the certification page for the **practice assessment** and for the
   **"Prepare for the exam"** section. As of 2026-09-20 the practice assessment
   was listed as unavailable. Correction (2026-09-22): Microsoft *had* published
   Course SC-500T00-A with self-paced learning paths - its page was updated
   2026-07-30 - so the earlier "no learning path" statement was wrong. The
   outline-drift workflow watches the certification page, not the training
   catalogue, which is how it was missed.
4. Bump `last_verified` when you re-checked the documentation, not when you
   edited prose.

**Outline status: verified unchanged on 2026-09-20.** Live page last updated
2026-07-31; snapshot captured 2026-09-15; all 87 bullets identical.

---

## 8. Backlog

**Shipped, and worth knowing about before adding to it:**

- **Mock exam** at `#/exam`. Samples every `quizzes/<id>.json`, weights the mix
  to the official domain percentages, runs a clock at roughly 2.5 minutes a
  question capped at 120, supports mark-for-review and a review screen, and
  reports by domain with the missed sub-objectives named. It needs no new data,
  so a new module's quiz joins the pool automatically.
- **Option shuffling** in the mock exam, with a per-question `"fixed_options":
  true` opt-out for any explanation that refers to an option by position.
- **Case studies** as appendices A9 and A10: a scenario read once, then
  questions that cut across modules, with collapsed answers. This is the only
  place the guide tests control *selection*, which module-local quizzes
  structurally cannot.
- **A6**, the decision layer: fourteen comparison tables, each ending in the
  attractive wrong answer rather than the right one.
- **A7**, adjacent topics Microsoft links with no bullet - explicitly outside
  the coverage contract.
- **A8**, timed portal drills for the interactive components the duration
  implies.
- **Flashcards** at `#/cards`, Leitner-boxed at 1, 3, 7, 16 and 35 days, and
  **`#/review`**, which marks a module decayed if its quiz is older than 21 days
  or scored under 80%.

**Still open:**

- **Audits.** Confirm every analytical bullet ("evaluate", "identify",
  "analyze") ends in a written judgement rather than a click path, and confirm
  the minimum KQL needed to *configure* DCR transformations, table plans and
  Purview Audit queries survived the decision to drop hunting content.
- **04-04 against the current tier model.** Sentinel now has Analytics and Data
  Lake tiers, with Basic and Auxiliary being folded in. If the module still
  teaches Analytics/Basic/Auxiliary/Archive it is describing a model that no
  longer exists.
- **Quiz depth.** The mock exam is only as good as the pool it samples. Three to
  five questions a module is thin for a 60-question attempt; the mix repeats.

**Deferred by decision, not oversight:** CI, automated outline-drift checking,
staggered `last_verified` cadence, a preview watchlist view, and an offline
service worker.

---

## 9. What not to "fix"

The list in CONTRIBUTING.md under *Things that are deliberate* is binding.
Beyond it: the theory/lab split, the verbatim sub-objective mapping, the
six-bucket teardown, `rg-sc500-core` surviving teardown, and the habit of
naming uncertainty instead of filling it. Those are the reasons this reads
better than the commercial material.
