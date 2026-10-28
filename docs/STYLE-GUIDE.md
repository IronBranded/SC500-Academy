# Style Guide

The conventions this repository actually follows. Every rule here is descriptive
rather than aspirational — it was extracted from the modules and appendices after
they were written, and updated for the beginner-first redesign
(`docs/BEGINNER-FIRST-REDESIGN.md`), so a new module that follows this guide will
look like the existing ones.

If you disagree with a rule, change it here first, then change the content. A
convention that lives only in one author's head is not a convention.

---

## 1. Sourcing

**Microsoft Learn is the only source of factual content.** Product documentation,
the SC-500 study guide, and Microsoft Learn training modules. Nothing else.

Third-party material — courses, blogs, practice-question vendors, forum posts —
may be used **only** to sanity-check structure and emphasis: *is this topic
weighted the way I think it is?* It is never the source of a claim. While writing
appendix A4, four prep sites were found contradicting each other and the official
page on this exam's duration and question count. That is the failure mode this
rule exists to prevent.

**Every module ends with a Sources block** listing the specific pages it draws
from, as inline autolinks:

```markdown
## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/...>
- Azure Firewall rule processing logic: <https://learn.microsoft.com/azure/firewall/rule-processing>
```

Only list pages you actually read. A Sources block padded with plausible URLs is
worse than a short one, because it launders unverified claims.

**Locale-less URLs are acceptable** (`learn.microsoft.com/azure/...`). If you only
ever saw a page in another locale, use the locale-less form rather than
constructing an `en-us` URL you have not opened.

### Verbatim quoting limits

- **Sub-objectives are quoted verbatim** from the skills-measured outline, in
  `sub_objectives` and in the `## Sub-objectives covered` list. They are the
  literal thing the exam is built from, and paraphrasing them loses the mapping.
- **Everything else is written in our own words.** Do not reproduce paragraphs of
  Microsoft documentation. Explain the mechanism, then cite the page.
- Short exact strings that matter — a cmdlet, a plan name, an alert name such as
  `AI.Azure_CredentialTheftAttempt`, a policy element — are quoted as code.

---

## 2. Structure

### Two files per objective

| File | Answers |
| --- | --- |
| `content/<domain>/<id>-<slug>.md` | Why this control exists and how it works |
| `labs/<domain>/<id>-lab.md` | How to configure it, prove it, and remove it |

Theory never contains numbered configuration steps. Labs never contain the
conceptual explanation. A reader doing a review pass reads content; a reader at a
terminal reads the lab.

### Required sections, in order

The order is the teaching sequence: **what needs protection, why, which control,
how Microsoft implements it, how to validate it, and SC-500 reasoning last.** The
validator checks that every section exists and that they appear in this order.

**Exam lesson** (`content/01-*` to `content/04-*`):

1. Front matter
2. `# Title`, then a blockquote with objective and domain
3. `## Sub-objectives covered` — verbatim bullets
4. `## The security problem` — the requirement or exposure, in plain language,
   **before any Microsoft product name appears**
5. `## In plain English` — the idea without terminology
6. `## Words you need to know` — a short table of the terms this lesson depends on
7. `## Mental model` — the simplest useful picture, labelled as a teaching model
8. `## How it works under the hood` — mechanism, not menu paths; Microsoft's
   terminology arrives here
9. `## Why security cares` — what changes in exposure, privilege or visibility,
   and what the control does **not** solve; cause-and-effect diagrams belong here
10. `## Configuration surface` — a table of setting / default / set it to / why
11. `## Common failure modes`
12. `## Hands-on` — one line linking the lab
13. `## Validate the security outcome` — how to prove the control achieved its
    purpose, not that the steps were followed
14. `## How this is tested` — exam phrasing table, a `### What SC-500 expects you to
    do` subsection, and an **AZ-500 divergence** paragraph
15. `## Check yourself` — 5 reasoning questions, not recall
16. `## Teach it back` — prompts that make the learner explain the control
17. `## Key takeaways`
18. `## Sources`

**Foundation primer** (`content/00a-foundations/0A-*`):

1. Front matter, with `supports_objectives` (see §3) and an empty `sub_objectives`
2. `# Title`, then the "Foundation primer. Not exam content." blockquote
3. `## Why this matters for security`
4. `## In plain English`
5. `## Words you need to know`
6. `## Mental model`
7. `## Microsoft cloud translation` — the generic idea mapped to Microsoft's names
8. `## How it works`
9. `## Why security cares`
10. `## Common misunderstandings`
11. `## Where SC-500 uses this` — the lessons and objectives that build on it
12. `## Teach it back`
13. `## Key takeaways`
14. `## Sources`

A primer is just-in-time background, not a prerequisite certification. Keep it to
what an SC-500 lesson actually assumes, and never let it claim an exam bullet.

**Lab file** — understand → implement → observe → validate → explain → clean up:

1. `# Lab <id> - Title`
2. Objective, cost, licensing, time, and any warning callouts
3. `## Why this lab matters` — the security problem the lab addresses
4. `## Architecture` — a ```text diagram of the identities, resources, data,
   networks and controls involved, followed by the line *A teaching model of what
   this lab builds - not a complete deployment diagram.*
5. `## Desired security outcome` — statements that will be true when the lab is
   finished. **Each one must be proven by a Validation check.**
6. `## Prerequisites` — PIM roles, modules, anything that must already exist
7. Numbered `## Part N` sections, each with **Method A - Portal** and
   **Method B - PowerShell** where both exist
8. `## Validation` — commands that prove the outcome, plus a portal equivalent
9. `## What just happened?` — the mechanism and its effect, in a few bullets
10. `## Limitations` — what the control does not solve, and what the lab simplified
11. `## Teardown` — the six buckets (below)
12. `## Completion` — two checkboxes: the outcome was validated (not just the steps
    completed), and teardown is done. A lab counts as practised only when every
    checkbox on the page is ticked.

A lab whose resources persist on purpose (00-01, 04-02) writes its abandon-the-tenant
steps as plain bullets, not checkboxes, so the page can still be completed.

---

## 3. Front matter schema

All eighteen keys below (excluding `supports_objectives`) are required on every content file; `Test-GuideContent.ps1`
fails the build otherwise. Empty is fine; missing is not.

| Key | Type | Notes |
| --- | --- | --- |
| `objective` | string | Verbatim from the study guide |
| `sub_objectives` | list | Verbatim. Empty list for appendices and primers |
| `supports_objectives` | list of objective ids | **Primers only.** The objectives (`"1.2"`, `"3.1"`) the primer supports. **Validated** against `content/skills-measured.json`; at least one is required |
| `domain` | string | Must match `manifest.json` |
| `domain_weight` | string | `20-25%`, `25-30%`, or `n/a` — **validated** |
| `status` | `GA` \| `Preview` | **Validated.** Use `Preview` if any sub-objective is preview |
| `prerequisites` | list of module ids | Rendered as links in the field card. Exam lessons list the Module 0A primers they rely on. **Validated** against the manifest |
| `ms_learn_source` | url | The study guide |
| `product_docs` | list of urls | The pages you actually read |
| `last_verified` | `YYYY-MM-DD` | **Validated**; warns after 60 days |
| `portal` | string | Where the work happens |
| `powershell_module` | string | Comma-separated; rendered as code chips |
| `az_cli_command` | string | One representative command, or empty |
| `kql_tables` | list | Tables the module teaches |
| `licensing` | string | State gaps plainly — see §7 |
| `azure_resources` | list | ARM types |
| `lab_cost_estimate` | string | Drives the cost chip — see §6 |
| `free_practice_available` | bool | Can this be practised at no cost |
| `forensic_relevance` | string | What this control means in an investigation |

`forensic_relevance` is not decoration. It is the one field that makes this guide
different from a certification cram, and it should say something an investigator
would care about — usually what evidence exists, or fails to.

---

## 4. Voice and explanation

**Beginner-first in how it explains, certification-first in what it teaches.**
Assume the reader may not know what a tenant, a workload identity or an AI agent is.
Do not assume that means shallow: add an explanatory layer rather than drop
precision. The study guide decides what is taught; this guide decides how.

**First principles before product names.** `The security problem` should be
readable by someone who has never used Azure. Name the threat or failure mode, then
the control. If the first sentence contains a Microsoft product name, rewrite it.

**Progressive precision.** Plain English, then a mental model, then Microsoft's
terminology, then the mechanism, then the security outcome, then SC-500 reasoning.
The simple version must never contradict the precise one.

**Cause and effect, and limits.** For every important control say what risk exists
without it, what it changes, what it does not solve, and how to verify it. Never
imply one control removes all risk.

**AI without anthropomorphism.** Explain AI systems in terms of assets, data,
identities, actions and trust boundaries. Models do not "want" or "decide"; agents
call tools with permissions someone granted.

**One analogy at most, and only if it pays its way.** An analogy that needs its own
explanation is worse than the plain mechanism. Most modules have none.

**Say the thing.** Prefer "the exam will use this" to "it is worth being aware
that". No "in this module we will explore". No filler transitions.

**Bold carries load.** Bold the claim a reader must not miss — typically one per
section. If a page has thirty bold phrases, none of them work.

**Tables over prose for comparisons.** Any "X versus Y" gets a table. The glossary
(A3) is organised entirely this way because the exam is.

**Second person for instructions, third for mechanism.** "You assign the role";
"the firewall evaluates DNAT rules first".

---

## 5. GUI and PowerShell parity

Every lab part that can be done both ways shows both:

```markdown
### Method A - Portal
### Method B - PowerShell
```

**Portal-only is acceptable in exactly two cases**, and you must say which:

1. **The cmdlet surface is unstable.** Recovery Services immutability, Defender
   plan extensions, Foundry model deployment. Say so and tell the reader to check
   `-Syntax`:

   > Immutability state and MUA wiring are portal-driven above because the cmdlet
   > surface for them moves between `Az.RecoveryServices` and `Az.DataProtection`
   > versions.

2. **No cmdlet exists.** Sample alerts, some Defender configuration.

**Never invent a cmdlet.** If you are not certain a parameter exists, either verify
it or route the step through the portal and say why. Every such flag is also logged
in appendix A1 §6.

**Resolve identifiers at runtime.** No hardcoded GUIDs for role definitions,
permission scopes, or authentication strengths — look them up by display name. The
only literal GUID in this repository is the Microsoft Graph application ID.

---

## 6. Cost

**Every lab states its cost in the header**, and the `lab_cost_estimate` front
matter drives the colour chip on the site. The parser reads the prose, so use these
words:

| Contains | Chip | Use for |
| --- | --- | --- |
| `$0` or `free` | green `$0` | M365-only, or no billable resource |
| `Low` | muted green | Pennies |
| `Medium` | ochre | Real but small |
| `HIGH` (incl. `Medium-HIGH`) | brick | Hourly meters |
| `HIGHEST` | deep brick | Security Copilot |

**Anything that bills hourly gets a clock.** State it in the header, tell the
reader to start a timer when provisioning completes, and build the free parts
first:

> **Start a timer when the firewall finishes deploying.** Deployment takes 10-20
> minutes and billing starts the moment it lands, not when you start testing.

**Build cheap things first.** Firewall policies, VNets, storage — then the metered
resource last, so its clock runs for the shortest possible time.

### Teardown: the six buckets

Every lab's `## Teardown` uses this structure, from `content/00-lab-safety/00-03`:

1. **Resources** — the resource group, and anything expensive deleted *first*
2. **Subscription scope** — Defender plans, policy assignments, role assignments
3. **Directory scope** — app registrations, CA policies, groups, consent grants
4. **Soft-deleted remains** — vaults, workspaces, sites, app registrations
5. **Access** — deactivate PIM, discard credentials
6. **Verify** — commands that prove it, plus a Cost Management check

**Name what the teardown script cannot see.** It knows nothing about Bastion hosts,
Azure Firewalls, `MC_*` node resource groups, orphaned disks, Sentinel connectors,
or Security Copilot capacity. If your lab creates one, bucket 1 or 6 says so
explicitly.

---

## 7. Preview status and licensing gaps

**Set `status: Preview`** if any sub-objective depends on a preview feature, and
open the module with a callout telling the reader to re-verify. 03-02 is the
worked example.

**State licensing gaps plainly and give a written deliverable instead.** Three
objectives cannot be fully built on the stated M365 E5 lab tenant. None of them is
skipped or glossed:

> **Licensing gate.** Conditional Access for agents requires **Microsoft Agent 365**
> licensing per user on top of Entra ID P1/P2. Microsoft 365 E5 provides neither.

The lab then splits into *build-if-licensed* and *design-if-not*, where the design
output is the same prose the exam asks for anyway.

---

## 8. AZ-500 divergence

**Every content module's `## How this is tested` ends with a divergence
paragraph**, bolded as `**AZ-500 divergence.**` Say what moved, or say plainly that
the area is new. Appendix A5 aggregates all of them, so a new module's note must be
added there too — with a date if one exists.

---

## 9. Links

**Internal links are relative `.md` paths.** `assets/js/app.js` rewrites them into
hash routes using `manifest.json`, so they work both on GitHub and on the site:

```markdown
See [01-02 lab](../../labs/01-identity-access-governance/01-02-lab.md).
Covered in [00-03](../00-lab-safety/00-03-teardown-checklist-template.md).
```

A relative link the site cannot resolve renders with a dotted underline and a
tooltip naming the bad path — so serving the site is itself a link check.

**External links are autolinks** in Sources blocks (`<https://...>`) and inline
markdown links elsewhere. The site opens them in a new tab automatically.

---

## 10. Quizzes

One file per module at `quizzes/<module-id>.json`, kept separate from prose so
editing a question never touches content.

```json
{
  "module": "01-01",
  "schema": 1,
  "questions": [{
    "id": "01-01-q1",
    "sub_skill": "Implement and configure managed identities for Azure resources",
    "prompt": "...",
    "options": ["...", "..."],
    "answer": 1,
    "explanation": "Why this is right, and what the distractors are testing.",
    "why_not": ["Why option A is wrong", null, "Why C is wrong", "Why D is wrong"],
    "scenario_clue": "\"survives if any VM is rebuilt\" rules out system-assigned.",
    "misconception": "A system-assigned identity is enough whenever resources share a job"
  }]
}
```

- `sub_skill` **must quote a verbatim sub-objective** from that module's front
  matter. It is the join between a wrong answer and what to re-read.
- `why_not` is an array aligned with `options`: `null` for each correct answer, and
  for each wrong one an explanation of why it is wrong or weaker. **Validated.**
- `scenario_clue` quotes the words in the scenario that point to the answer, and
  says why. **Required and validated.**
- `misconception` names the inaccurate assumption the question tests, phrased as
  the wrong belief ("A Deny policy fixes resources that already exist"). Optional,
  but add it wherever there is a real one.
- Distractors must test genuine distinctions. An option that is wrong only because
  it describes nonsense teaches nothing.
- Never use exam dumps, recalled live questions or any protected exam material.
- `answer` is a zero-based index, or an array for multiple response.
- Options are presented in file order, never shuffled, so explanations can refer
  to them.
- `explanation` says why the correct answer is correct **and** what the distractors
  are testing. An explanation that only restates the answer is not finished.
- 3-9 questions. Reasoning, not recall.

---

## 11. Comparisons

Structured comparisons live in `content/comparisons.json` and render through
`assets/js/compare.js`: inside each lesson they name, on domain reviews, and on the
`#/compare` page. Every option answers the **same nine questions**, so the reader
compares like with like.

```json
{
  "id": "private-endpoint-vs-service-endpoint",
  "title": "Private endpoint vs service endpoint",
  "question": "One sentence that names the decision being made",
  "objectives": ["2.1.2", "2.3.6"],
  "lessons": ["02-04", "0A-08"],
  "takeaway": "The SC-500 takeaway in one or two sentences",
  "trap": "The wrong choice a scenario is built to tempt",
  "clues": [{ "clue": "words in a scenario", "points_to": "the option they point to" }],
  "sources": ["https://learn.microsoft.com/..."],
  "options": [{
    "name": "Private endpoint",
    "security_problem": "", "purpose": "", "layer": "", "scope": "",
    "when_to_use": "", "major_difference": "", "limitation": "",
    "dependency": "", "validation": ""
  }]
}
```

- `objectives` are bullet ids from `content/skills-measured.json`. A comparison that
  maps to no bullet is out of scope and the validator rejects it — do not add a
  comparison because it is technically interesting.
- `lessons` may include Module 0A primers. Every id must exist in the manifest.
- All nine option fields are required and must be non-empty.
- Appendix A6 remains as a longer-form reference; the structured comparisons are
  the primary component.
