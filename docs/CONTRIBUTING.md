# Contributing

How to add or change content without breaking the guide. Read
[STYLE-GUIDE.md](./STYLE-GUIDE.md) for the conventions themselves; this file is
the workflow.

---

## Before you write anything

**Re-fetch the skills-measured outline and diff it.** SC-500 is recent and
Microsoft revises these lists after general availability. The snapshot in
`docs/SKILLS-MEASURED-SNAPSHOT.md` is the drift baseline:

```powershell
$url = 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500?accept=text/markdown'
(Invoke-WebRequest -Uri $url -UseBasicParsing).Content |
    Set-Content -Path '.\docs\SKILLS-MEASURED-SNAPSHOT.new.md' -Encoding utf8

Compare-Object (Get-Content .\docs\SKILLS-MEASURED-SNAPSHOT.md) `
               (Get-Content .\docs\SKILLS-MEASURED-SNAPSHOT.new.md)
```

If the diff is empty, delete the `.new` file. If it is not, the outline moved:
update the affected module's `sub_objectives`, `manifest.json`, `docs/SYLLABUS.md`,
and the snapshot together, in one commit.

**Then re-verify the product documentation for the module you are touching.** Not
the study guide — the actual product pages. Several things in this guide changed
between the scaffold and the writing: authentication method management, Key Vault
defaults, NSG flow logs, Entra Permissions Management, the Sentinel portal
retirement date. Assume something has moved.

---

## Authoring a module

1. **Copy an existing module of similar shape.** 02-01 for a service-hardening
   module, 03-04 for a many-bullet one, 03-02 for a preview-heavy one.
2. **Write the front matter first**, all eighteen keys. It drives the site's field
   card, so an empty `licensing` or a wrong `lab_cost_estimate` is visible to the
   reader.
3. **Write `Why this exists` before opening any portal.** If you cannot explain the
   threat without naming a product, you do not understand the control yet.
4. **Write the lab second**, and actually run it. Every cmdlet in this repository
   was either executed or explicitly flagged as version-sensitive.
5. **Add the AZ-500 divergence note**, and mirror it into `content/appendix/a5-*`.
6. **Add the quiz** at `quizzes/<id>.json`. Scenario questions, one deciding
   constraint each, tagged with a verbatim `sub_skill`. Every question in the
   repository carries `why_not`: one note per wrong option, `null` for correct ones,
   restating what the explanation or the module already says. `difficulty`,
   `concept` and `misconception` are optional. Write every question from the
   documentation. Never use exam dumps or recalled exam questions.
7. **Add a diagram only where it beats a paragraph** - decision order, two paths
   that are easy to confuse, a pipeline. Use a ` ```mermaid ` flowchart:
   - put `accTitle:` and `accDescr:` on its first lines;
   - use `:::d01` to `:::d04` for domain colour, and keep a text label on every
     node;
   - draw nothing the lesson text does not already say;
   - prefer top-down; left-to-right diagrams become unreadable on a phone.
8. **If an objective heading changes**, update `content/official-training.json` in
   the same commit. It joins Microsoft's learning paths and labs to objectives by
   heading text.
9. **Update `content/manifest.json` and `docs/SYLLABUS.md`** if the module is new.
10. **Tear down your own lab** before committing. Then run the sweep from
   `content/appendix/a2-licensing-and-lab-cost-matrix.md` §6.

---

## Validate before every commit

```powershell
.\tools\Test-GuideContent.ps1
```

Checks front-matter schema, `domain_weight` and `status` values, `last_verified`
format and age, internal relative links, the presence of `## Teardown` in every
lab, and that `manifest.json` points at files that exist.

Weekly, or before a release:

```powershell
.\tools\Test-GuideContent.ps1 -CheckExternalLinks
```

This HEADs roughly 120 Microsoft Learn URLs. A 404 usually means a page moved
rather than a claim being wrong — find the new page and update the Sources block.
A redirect chain is fine.

### Accessibility, when you touch the site

```text
npm install --no-save playwright@1.56.0 axe-core@4.13.0
npx playwright install chromium
python -m http.server 8080 &
node tools/a11y-check.js
```

This is the same check CI runs on every push. It loads every page type in both
themes and fails on any WCAG 2.0/2.1 A or AA violation.

**If you changed any file under `assets/`, bump `CACHE_VERSION` in `sw.js`.** The
live site serves its code cache-first for offline use, so an unbumped version
means returning visitors run stale code alongside new content.

### Serve the site and click through

```powershell
python -m http.server 8080
```

The site fetches Markdown at runtime, so `file://` will not work. Clicking through
is a second link check the PowerShell validator cannot do: **an internal link the
site cannot resolve renders with a dotted underline and a tooltip naming the bad
path.**

---

## What the validator checks

All eight gaps previously logged here are now closed. `tools/Test-GuideContent.ps1`
requires **PowerShell 7** and is cross-platform. Each check below was
negative-tested - broken on purpose, confirmed to fire, then restored.

| Check | Catches |
| --- | --- |
| Front-matter schema | Any of the 18 keys missing; bad `domain_weight` or `status`; malformed or stale `last_verified` |
| Required sections | A content file missing any of the nine required `##` sections |
| Lab schema | A lab missing `## Prerequisites`, `## Validation` or `## Teardown`, or with no numbered parts |
| Outline diff | A bullet in `SKILLS-MEASURED-SNAPSHOT.md` that no module covers, or a `sub_objective` not in the captured outline |
| Front matter vs body | `sub_objectives` disagreeing with the `## Sub-objectives covered` list |
| Duplicate ownership | The same sub-objective claimed by two **exam** modules. Module 0 may list one it also practises, as 00-02 does for PIM |
| Cost parity | A module's `lab_cost_estimate` level disagreeing with its lab's `**Estimated cost:**` header |
| Quizzes | Malformed JSON, an `answer` index out of range, a `sub_skill` that is not a verbatim sub-objective, duplicate options or ids, fewer than three options, a missing explanation |
| Manifest | Module *and appendix* paths that do not resolve; a module with no lab or no quiz |
| Orphans | Markdown on disk that no manifest entry references |
| Links | Unresolved relative links; with `-CheckExternalLinks`, every `learn.microsoft.com` URL |

Module 0 is exempt from the exam-module rules, since `domain_weight: n/a` marks it
as lab safety rather than an exam domain: it needs no `sub_objectives`, no lab on
every file, and no knowledge check.

```powershell
.\tools\Test-GuideContent.ps1                       # per commit
.\tools\Test-GuideContent.ps1 -CheckExternalLinks   # weekly
.\tools\Test-GuideContent.ps1 -FailOn Warning       # strict: warnings fail too (CI uses the default)
```

Exit code is 0 on pass, 1 on failure, so it drops straight into a pre-commit hook
or a workflow step.

### Previously logged gaps, for the record

| Gap | Why it matters |
| --- | --- |
| **Required sections are not checked.** Only front matter and links are. | A module missing `## Sources` or `## How this is tested` passes. |
| **Lab files are not schema-checked at all** — only for `## Teardown`. | A lab with no `## Validation` or no `## Prerequisites` passes. |
| **`sub_objectives` are not diffed against the snapshot.** | The whole point of keeping a verbatim baseline is undone by not comparing it. |
| **Quiz files are unvalidated.** | A `sub_skill` that does not match any `sub_objective`, an `answer` index out of range, or malformed JSON fails silently in the browser. |
| **`manifest.json` appendix paths are not checked.** | The loop only walks `domains`. The nav now depends on `appendix`. |
| **Windows path separators are assumed** (`content\manifest.json`, `-replace '/','\'`). | Fails on PowerShell 7 on Linux or macOS. |
| **No check that every module has a quiz**, or that `lab` paths in the manifest resolve for modules that declare one. | Silent coverage gaps. |
| **No orphan check**: files on disk that no manifest entry references. | A renamed file leaves an unreachable page. |

---

## When to bump `last_verified`

Bump it when you **re-checked the product documentation**, not when you edited
prose. The field answers "when was this last known to be true", and the site shows
a day count past 60 to match the validator's warning. Fixing a typo does not make
a claim fresher.

If a warning fires and you re-check and nothing changed, bump it anyway — that is
a verification, and it is the one you want recorded.

---

## Commit conventions

```
content(02-04): private access and network perimeter module and lab
docs(appendix): AZ-500 delta and licensing/cost matrix
feat(site): progress tracking, collapsible depth, search and quiz engine
fix(01-02): correct Key Vault default permission model
```

Scope is the module id, `appendix`, `site`, `docs`, or `tools`. One module per
commit — content and lab together, since they are written as a pair.

---

## Repository layout

The README is written for learners. This is the map for maintainers.

| Path | What it holds |
| --- | --- |
| `content/` | 22 lesson files: four in Module 0 (lab safety) and 18 mapped to the exam objectives. Theory only - why a control exists, how it works, how it is tested |
| `labs/` | One lab per exam lesson: numbered steps, portal and PowerShell, validation, and a mandatory teardown |
| `content/appendix/` | Eleven appendices, including three case studies |
| `content/manifest.json` | The only file that defines the site's structure. Patched by hand |
| `content/official-training.json` | Course SC-500T00-A: learning paths, the 63 modules and Microsoft's 16 labs, mapped to lessons |
| `quizzes/` | One knowledge check per exam lesson, each question tagged with the official sub-objective it tests |
| `flashcards/` | The distinctions deck |
| `assets/` | The site: dependency-free HTML, CSS and JavaScript, no build step |
| `tools/`, `.github/workflows/` | The validator, the accessibility check, and the CI that runs them |
| `docs/` | This guide, the style guide, the skills-outline snapshot, the syllabus, and `UX-REDESIGN.md`, which records how the site is structured |

**The split between `content/` and `labs/` is deliberate.** Theory files contain no
numbered configuration steps; labs contain no conceptual explanation. A review pass
reads `content/`; someone at a terminal reads `labs/`.

## Automated checks

| Check | When | What fails it |
| --- | --- | --- |
| **Validate** (`tools/Test-GuideContent.ps1`) | Every push and pull request; weekly with external links | Front-matter schema, required sections, lab structure including teardown, objective mapping against the snapshot, quiz integrity, manifest and orphans, broken internal links. The weekly run also checks every Microsoft Learn URL |
| **Outline drift** | Weekly | The live skills outline differing from `docs/SKILLS-MEASURED-SNAPSHOT.md`, the practice-assessment status changing, or a linked learning path, its module list, or a Microsoft lab changing. Any of these opens an issue |
| **Accessibility** (`tools/a11y-check.js`) | Every push and pull request | Any WCAG 2.0/2.1 A or AA violation, or a script error, on any page type in either theme |

## Things that are deliberate

Do not "fix" these without discussing them first:

- **22 modules, not the 12 in the master prompt.** Three sub-headings were split
  because they carry 9-11 bullets each. Every one of the 87 sub-objectives lands
  in exactly one exam module. Sections 5.3 and 6 of the master prompt are stale as a
  result and still need rewriting.
- **Walkthrough-only labs.** Virtual WAN, VPN gateways, Front Door Premium, and
  parts of Entra Private Access and Agent ID. Each says why, and each ends in a
  written deliverable so the objective still maps to lab work.
- **Portal-only steps** where the cmdlet surface is unstable. See STYLE-GUIDE §5.
- **`rg-sc500-core` is never torn down.** It holds the budget, action group, brake
  runbook, and `law-sc500`. Labs 00-01, 00-02 and 04-02 have deliberately different
  teardown sections for this reason.
- **No readiness percentage, no pass prediction.** The dashboard reports
  observable counts per official sub-objective. Do not add a blended score.
- **Objective ids such as `2.3.4` are positions in the snapshot.** Microsoft does
  not number objectives; the site says so where it shows them.
- **Investigation notes (`forensic_relevance`) are collapsed** into a "Beyond the
  exam" panel at the end of each lesson. They are useful, and not measured.
- **The guide names its own uncertainty.** Where Microsoft does not publish a fact
  — SC-500's question count and passing score — appendix A4 says so instead of
  repeating a third-party number. Keep that habit.
