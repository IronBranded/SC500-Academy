# SC500 Academy

<h3 align="center">
  <a href="https://ironbranded.github.io/SC500-Academy/" target="_blank" rel="noopener noreferrer">
    🟢 TRY THE ACADEMY🟢
  </a>
</h3>

____
A dependency-free, static interactive study guide for **Exam SC-500: Implementing
End-to-End Security Controls for Cloud and AI Workloads** (Microsoft Certified:
Cloud and AI Security Engineer Associate).

Every concept is sourced from official Microsoft Learn documentation. Non-Microsoft
material appears only as clearly labelled optional supplemental reading.

**It is not a replacement for the documentation.** It is a map of it, plus the
decisions the documentation does not make for you: which control answers which
requirement, what each lab costs, what to tear down, and what the exam actually
asks. Section *Using this with Microsoft Learn* below explains how the two fit
together, and it matters more than it sounds - Microsoft Learn is available to you
during most role-based exams, so knowing which page to open is itself a graded
skill.

## Scope

| Domain | Weight |
| --- | --- |
| Manage identity, access, and governance | 20-25% |
| Secure storage, databases, and networking | 25-30% |
| Secure compute | 20-25% |
| Manage and monitor security posture | 20-25% |

Skills-measured outline captured 2026-09-15 from <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>.
The verbatim snapshot lives in `docs/SKILLS-MEASURED-SNAPSHOT.md` so outline drift is
diffable, and a scheduled workflow diffs it weekly.

**All 87 sub-objectives are mapped to exactly one module each**, and the validator
fails the build if that stops being true.

---

## What is in here

| | |
| --- | --- |
| `content/` | 22 module files - four in **Module 0** (lab safety) and 18 mapped to the exam objectives. Theory only: why a control exists, how it works, how it is tested |
| `labs/` | One lab per exam module. Numbered steps, portal **and** PowerShell, validation, and a mandatory teardown |
| `content/appendix/` | Eleven appendices, including three case studies - see below |
| `quizzes/` | One knowledge check per module. Reasoning questions, not recall; each is tagged with the sub-objective it tests |
| `flashcards/` | A deck of the distinctions the exam turns on |
| `tools/`, `docs/` | The validator, and the conventions it enforces |

**The split between `content/` and `labs/` is deliberate.** Theory files contain no
numbered configuration steps; labs contain no conceptual explanation. Someone doing a
review pass reads `content/`. Someone at a terminal reads `labs/`.

### The appendices, and when each becomes useful

| | |
| --- | --- |
| **A1** PowerShell and Graph reference | When a lab stalls on a module or a cmdlet |
| **A2** Licensing and lab cost matrix | Before you enable anything metered |
| **A3** Glossary | As a review pass - it is organised by the distinctions the exam tests, so covering the right-hand column makes it a self-test |
| **A4** Exam logistics and scoring | Once, early, and again the week before |
| **A5** AZ-500 to SC-500 delta | Early, if you have AZ-500 background. It lists features that are gone, not merely renamed |
| **A6** Choosing between overlapping controls | **After Domain 2, and again in the final week.** Fifteen sections of "which of these does the stem actually want", each ending in the attractive wrong answer |
| **A7** Related topics with no bullet | Late, at recognition depth only. Services Microsoft links from the study guide without assessing them directly |
| **A8** Timed portal drills | A week *after* the labs, portal-only, documentation closed |
| **A9, A10, A11** Case studies | Near the end. Scenario read once, then questions that cut across modules |

A6 and the case studies exist for one reason: a module can only ever test the controls
inside it, and the exam tests choosing between controls taught in different modules.

---

## Using this with Microsoft Learn

**There is no official learning path for SC-500.** As of 2026-09-20 the certification
page's *Prepare for the exam* section is empty and the practice assessment is not yet
available. The official study surface is the study guide plus the product
documentation - which is exactly what this repository is built from and points back at.

**Every module ends in a Sources block naming the specific pages it draws from.** Those
are not decoration and they are not padding; a padded Sources block launders unverified
claims, so only pages that were actually read are listed. Work them:

1. Read the module's *Why this exists* and *How it works under the hood*.
2. **Open the two to four pages in its Sources block and read them.** The module tells
   you what matters in them and why; the page tells you the detail.
3. Do the lab.
4. Come back to *How this is tested* and the knowledge check.

**Why step 2 pays off twice.** Microsoft permits access to Microsoft Learn during most
role-based exams. Looking up one fact you know exists is a thirty-second operation if
you know which page you are heading for, and a five-minute loss if you are browsing.
The pages worth knowing your way around by the end are listed in **A4 §5**.

**Where the guide deliberately disagrees with older material.** Every module ends its
*How this is tested* section with an **AZ-500 divergence** note, and **A5** aggregates
them. A large body of AZ-500 material is still in circulation, some of it describing
operations the platform now refuses. Where this guide and a third-party walkthrough
disagree, check the Microsoft Learn page and trust that.

**Re-verify before you sit.** Front matter carries `last_verified` for every file, the
site's **Verification watchlist** shows what is preview and what is past its window,
and a weekly workflow diffs the live outline against the snapshot. This exam is recent
enough that the outline still moves.

---

## Using this with the labs

### Module 0 first, entirely

`content/00-lab-safety/` sets a budget and spending alerts, moves you to **PIM-based
just-in-time role activation instead of standing Global Administrator**, and
establishes the teardown checklist every later lab follows. It is not exam content. It
is what makes the rest survivable.

Several objectives bill hourly whether or not you use them - Security Copilot, Azure
Firewall, Bastion, Defender for Servers, AKS, API Management, Application Gateway.
**Every lab states its cost before you create anything**, and the site renders that as
a coloured chip so you can see it from the module list.

### How a lab is built

- **Method A - Portal** and **Method B - PowerShell** for anything that supports both.
  Do the portal first, because that is what the exam shows you; do the PowerShell
  second, because that is what you will actually reuse.
- **Validation** - commands that prove the control works, rather than a screenshot that
  proves a blade was open.
- **Teardown** - six buckets: resources, subscription scope, directory scope,
  soft-deleted remains, access, and a verification step. It names what a teardown script
  cannot see, which is where the surprise charges live.

`rg-sc500-core` is deliberately never torn down - it holds the budget, the action group
and the shared workspace.

### Where labs cannot be built

Three objectives cannot be fully built on a Microsoft 365 E5 tenant: Conditional Access
for agent identities, network controls for agents, and Microsoft Entra Private Access.
**None of them is skipped or glossed.** Those labs split into *build-if-licensed* and
*design-if-not*, where the design output is the same written reasoning the exam asks for
anyway. The licensing gate is stated plainly at the top of each.

### Then drill

**A8** converts the cheapest parts of the labs into short, clock-bound, portal-only
tasks with the documentation closed. Run them at least a week after the lab, so you are
testing recall rather than short-term memory. SC-500 is scheduled at 120 minutes, which
on Microsoft's own duration table is the row for exams that may contain interactive
components - A4 §2 works through that reasoning.

---

## A study sequence that works

| Pass | What you do |
| --- | --- |
| **0** | Module 0, all of it. A2 and A4 once. A5 early if you know AZ-500 |
| **1** | Domains in order, 1 → 4, lowest-cost labs first within each. Module, then its Sources pages, then its lab, then its knowledge check |
| **2** | Review: *How this is tested* and the quizzes only, plus **A6** and **A3**. The site's review toggle collapses the explanation and leaves the exam tips |
| **3** | Case studies A9-A11, the **mock exam** at `#/exam`, and **A8** drills |
| **4** | The week before: A5 and A6 again, the exam sandbox, and diff the live skills-measured page against the snapshot |

The site tracks all of this. **What to study next** (`#/review`) flags modules whose
knowledge check is older than three weeks or scored under 80%, weighted by domain.
Flashcards (`#/cards`) schedule themselves. Progress lives in your browser only, so
export it before switching machines.

---

## Local preview

The site fetches Markdown at runtime, so `file://` will not work. Serve it:

```
python -m http.server 8080
```

Then open <http://localhost:8080>.

A service worker caches the whole guide on first load, so it works offline afterwards.
During development that also means a stale copy can be served after you edit a file -
tick **Update on reload** in DevTools → Application → Service Workers, or unregister:

```js
navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()));
```

## Validate before committing

```powershell
.\tools\Test-GuideContent.ps1
```

Weekly, or before a release:

```powershell
.\tools\Test-GuideContent.ps1 -CheckExternalLinks
```

Both also run in CI on every push and pull request, and a second workflow diffs the
live skills-measured outline weekly and opens an issue when it moves.
`docs/CONTRIBUTING.md` lists every check; `docs/STYLE-GUIDE.md` lists the conventions;
`docs/BUILD-PROMPT.md` is the standing brief for adding to any of it.

## Licence

MIT for code (scripts, tooling, site) / CC BY 4.0 for prose and labs

Microsoft product names, documentation excerpts, and the SC-500 skills-measured outline
remain the property of Microsoft Corporation and are used for educational reference.
This project is not affiliated with or endorsed by Microsoft.

Maintained by IronBranded.
