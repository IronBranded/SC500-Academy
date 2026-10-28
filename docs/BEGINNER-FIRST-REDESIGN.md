# Beginner-first redesign

> **Beginner-first in how it explains cloud and AI security. Certification-first in
> what it teaches.**

This is the record of the October 2026 redesign: the teaching model, where each part
of it lives in the files and on the site, what was verified, and what is still open.
`docs/UX-REDESIGN.md` records the earlier certification-first redesign this builds
on; `docs/OBJECTIVE-VALIDATION.md` records the outline check and every factual
correction.

## 1. The problem it solves

The Academy already covered all 87 official bullets. It assumed the reader knew what
a tenant, a workload identity, a private endpoint or an AI agent was, and it often
introduced a Microsoft product before the reader understood the requirement the
product meets. A learner new to Azure met unexplained vocabulary on the first screen.

The redesign keeps the scope exactly where it was - the study guide decides what is
taught - and changes how it is taught, so a learner can move from "I do not
understand this technology" to "I can select the right control in an SC-500
scenario" without leaving the Academy.

## 2. The teaching sequence

Every exam lesson now follows one sequence. Each step is a required section, checked
by the validator, and moved into a stage by `assets/js/lesson.js`.

| Step | Section in the lesson file | Site stage |
|---|---|---|
| What SC-500 measures here | `Sub-objectives covered` | Orient |
| Security problem | `The security problem` | Understand |
| Plain English | `In plain English` | Understand |
| Vocabulary | `Words you need to know` | Understand |
| Mental model | `Mental model` (labelled as a teaching model) | Understand |
| Microsoft terminology and mechanism | `How it works under the hood` | Learn |
| Cause and effect, limits | `Why security cares` | Learn |
| Configuration | `Configuration surface` | Learn |
| Distinguish | structured comparisons, `Common failure modes` | Distinguish |
| Implement | `Hands-on` and the lab card | Practice |
| Validate | `Validate the security outcome` | Practice |
| SC-500 exam lens | `How this is tested` (with *What SC-500 expects you to do*) | Exam lens |
| Knowledge check | `quizzes/<id>.json`, `Check yourself` | Check |
| Teach it back | `Teach it back` (with a private notepad on the site) | Check |
| Review | `Key takeaways`, `Sources` | Review |

The investigation note (`forensic_relevance`) stays in a collapsed **Beyond the
exam** panel: useful, not measured.

## 3. Foundations: Module 0A and Module 0B

**Module 0A · Before we secure the cloud** - 17 primers in `content/00a-foundations/`:
cloud computing; Azure and Microsoft 365; tenants, subscriptions and resources;
users, accounts and identities; authentication and authorization; applications and
workloads; networks; public and private connectivity; storage and databases; APIs;
logs and telemetry; control types; shared responsibility; generative AI; models,
prompts and outputs; AI agents and tools; and how the pieces fit together.

- Each primer follows its own twelve-section anatomy and names the official
  objectives it supports (`supports_objectives`). None claims an exam bullet.
- Exam lessons list the primers they rely on in `prerequisites`; the site shows them
  as "foundations" separately from earlier lessons.
- The dashboard asks "new to cloud or AI?" and routes accordingly. Nothing is
  locked; the choice only changes the recommendation.

**Module 0B · Safe lab foundations** is the original Module 0 (00-00 to 00-03 and labs
00-01, 00-02): budget guardrails, PIM-based just-in-time access, and the teardown
template. It is unchanged in purpose and still comes before any billable lab.

## 4. AI scaffolding

AI lessons (03-01 to 03-03, 04-05) build on primers 0A-14 to 0A-16, which move from a
traditional application (input → logic → result) to generative AI (prompt → model →
output) to an agent (request → reasoning → tool or action → files, databases,
applications, external systems). Before an AI control is introduced, the lesson
names the asset, the data, the identity, the action, the trust boundary, the
exposure and the desired outcome. AI content is the most change-sensitive in the
Academy, so it was re-verified against Microsoft Learn in this pass - including the
1 July 2026 move of agent security to Microsoft Agent 365.

## 5. The comparison component

`content/comparisons.json` holds 19 structured comparisons rendered by
`assets/js/compare.js`. Every option answers the same nine questions - security
problem, purpose, layer, scope, when to use it, major difference, limitation,
dependency, how to validate it - and each comparison ends with the SC-500 takeaway,
scenario clues and the trap.

They appear inside the lessons they name, on each domain review, on the
`#/compare` page, in search and in the command palette, and on the coverage page
against the bullets they serve. Each must map to at least one official bullet; the
validator rejects one that does not. Appendix A6 remains as long-form reference.

## 6. Labs

Every lab now follows **understand → implement → observe → validate → explain →
clean up**:

`Why this lab matters` → `Architecture` (a labelled text diagram) → `Desired security
outcome` → `Prerequisites` → `Part 1..n` → `Validation` → `What just happened?` →
`Limitations` → `Teardown` → `Completion`.

- The desired outcome is framed on the site as the lab's contract: each statement
  must be proven by a Validation check, not by having followed the steps.
- `Completion` asks for two explicit confirmations: the outcome was validated, and
  teardown is done. A lab counts as **practised** only when every checkbox on the
  page is ticked, so a lab that is still billing is not finished.
- Labs whose resources persist by design (00-01's guardrails, 04-02's workspace)
  write their abandon-the-tenant steps as plain bullets so the page can be completed.

## 7. Knowledge checks

All 112 questions carry:

- the correct answer and the reasoning;
- `why_not` for every alternative;
- `scenario_clue` - the words in the scenario that point to the answer, and why;
- the official objective (`sub_skill`, verbatim);
- `misconception` where there is a real one (109 of 112).

Questions are original scenarios written from Microsoft documentation. No exam dumps,
recalled items or protected exam content were used.

## 8. Progress and dashboard

The dashboard answers one question: *which SC-500 objective should I study next?*
Progress is tracked as observable states, never as a pass probability:

| State | Means |
|---|---|
| Studied | The lesson was marked studied |
| Practised | The lab's checklist is complete, including outcome validation and teardown |
| Knowledge checked | Every question on the sub-objective was answered correctly on the latest attempt |
| Applied | A question answered correctly outside its home lesson (domain review, exam prep, mock exam) |
| Retained | Answered correctly again at least seven days after the first correct answer |

Needs review and Review later feed Exam prep. The coverage page reports, per
official bullet, its lessons, structured comparisons, lab, question count and the
primers that support its objective.

## 9. Verification in this pass

- The study guide was retrieved through the Microsoft Learn MCP server on
  2026-10-07 and compared with the snapshot: unchanged (see
  `docs/OBJECTIVE-VALIDATION.md`).
- Lesson, lab, quiz and comparison claims touched in this pass were checked against
  current Microsoft Learn pages. Corrections, removals and unresolved conflicts are
  logged in `docs/OBJECTIVE-VALIDATION.md` §6.
- `tools/Test-GuideContent.ps1` passes with no errors or warnings, and each new check
  was negative-tested.
- `tools/a11y-check.js` is clean on 18 page types in both themes, including a primer,
  the comparison pages and a lab with the new anatomy.
- Every page type was checked at 390 px for horizontal overflow.

**Not done in this pass: labs were not re-run end to end in a live tenant.**
Procedures were checked against Microsoft documentation, and the one procedure
found to be wrong (lab 03-06 Part 5.4) was rewritten. Run a lab before relying on
an exact portal path, and report anything that has moved.

## 10. Status against the brief's priorities

| Priority | Item | Status |
|---|---|---|
| P0 | Objective validation | Done - `docs/OBJECTIVE-VALIDATION.md`, `content/skills-measured.json`, validator check |
| P0 | Beginner foundations | Done - Module 0A, 17 primers |
| P0 | Security-problem-first lessons, lesson anatomy | Done - 18 lessons, validator-enforced order |
| P0 | Dashboard, objective-based progress | Done - five observable states, no readiness score |
| P0 | Contextual navigation | Done - breadcrumbs, stage rail, next step, primer links |
| P0 | SC-500 Exam Lens | Done - its own stage in every lesson |
| P0 | Comparison component | Done - 19 comparisons, nine questions each |
| P0 | Knowledge-check explanations | Done - why, why not, clue, objective, misconception |
| P0 | Coverage matrix | Done - per bullet, with comparisons and foundations |
| P1 | Cause-and-effect visuals, AI scaffolding, outcome validation | Done in lessons and labs |
| P1 | Needs review, Review later, domain reviews, exam prep | Done |
| P1 | Lab UX | Done - lab mode, anatomy, completion |
| P1 | Search, mobile | Done - comparisons searchable; 390 px overflow fixed |
| P2 | Accessibility automation | Done - routes extended for new page types |
| P2 | Freshness automation | Existing weekly outline-drift poll; `Update-SkillsManifest.ps1` added |
| P2 | Optional advanced content | Open - no break/fix or misconfiguration challenges yet; when added, label them **Advanced Challenge** or **Beyond the Exam** |

## 11. Backlog

1. Re-run every lab end to end in a test tenant and record the date in each lab.
2. Advanced Challenge exercises (deliberate misconfiguration, break/fix) for the
   highest-weight domain, Domain 2, clearly labelled and outside the core path.
3. A short `Example` section in each exam lesson, where the existing scenarios in
   `How this is tested` do not already serve.
4. `tools/New-Module.ps1` is still a stub; make it emit the lesson, primer and lab
   anatomy from `docs/STYLE-GUIDE.md` §2.
