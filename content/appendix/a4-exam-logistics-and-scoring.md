---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/"
  - "https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience"
  - "https://learn.microsoft.com/en-us/credentials/support/retake-policy"
  - "https://learn.microsoft.com/en-us/credentials/certifications/accommodations"
  - "https://learn.microsoft.com/en-us/credentials/support/certification-exam-candidate-agreement"
last_verified: "2026-09-17"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "Third-party prep sites currently contradict each other and the official page on this exam's basic facts - duration and question count both. That is worth noticing for its own sake: a confident, well-designed page is not a source. Everything below comes from Microsoft's own certification and support pages, and where Microsoft declines to publish something, this appendix says so rather than filling the gap."
---

# Exam Logistics and Scoring

> **Sourcing note, which matters here more than anywhere else in this guide.** While writing this
> appendix, third-party prep sites were found stating **100 minutes** and **120 minutes**, and
> **40-60 questions** and **68 questions**, for the same exam. Some of those pages look
> authoritative. **Microsoft's own certification page states 120 minutes.** Everything below is
> taken from official Microsoft pages, and where Microsoft does not publish a figure, this
> appendix says so instead of guessing.

## 1. The official facts

| Item | Official value |
| --- | --- |
| Exam code | **SC-500** |
| Exam title | Implementing End-to-End Security Controls for Cloud and AI Workloads |
| Certification earned | **Microsoft Certified: Cloud and AI Security Engineer Associate** |
| Level | Intermediate / Associate, role-based |
| Role | Security Engineer |
| **Duration** | **120 minutes** |
| Languages | **English** |
| Delivery | Proctored; **"You may have interactive components to complete as part of this exam"** |
| Scheduling | **Pearson VUE** |
| Price | Varies by the country or region in which the exam is proctored |
| Retakes | 24 hours after the first attempt; **for subsequent retakes the interval varies** - see the retake policy |
| Practice Assessment | **Not currently available.** Microsoft notes these usually appear within 8 weeks of an exam going out of beta and generally available |
| Certification page last updated | 2026-07-24 |

**Assessed domains**, as listed on the certification page:

- Manage identity, access, and governance
- Secure storage, databases, and networking
- Secure compute
- Manage and monitor security posture

## 2. The 120 minutes is telling you something

This is the most useful inference in this appendix, and it comes from putting two official pages
side by side.

Microsoft's **exam duration** table:

| Exam type | Duration | Seat time |
| --- | --- | --- |
| Fundamentals | 45 min | 65 min |
| **Associate and expert role-based exams *without* labs** | **100 min** | 120 min |
| **Associate and expert role-based exams that *may contain* labs** | **120 min** | **140 min** |

**SC-500 is listed at 120 minutes.** On Microsoft's own classification, that places it in the
row for exams that **may contain labs** - which is consistent with the certification page's
wording that you *may have interactive components to complete*.

Two caveats, stated plainly:

- **Microsoft does not publish a list of exams with labs**, because labs can be removed at any
  time for operational reasons. The duration you are given at registration is authoritative.
- **You are told when you launch the exam.** The overview pages before the questions state
  whether labs are present. Read them.

**Book 140 minutes of seat time**, not 120. Seat time includes reading instructions, accepting
the candidate agreement, and leaving comments.

**And prepare accordingly.** This guide's labs were built for that possibility: every module has
a hands-on component, and the ones that are walkthrough-only say so and explain why.

## 3. Question types

Microsoft deliberately does not identify the exact format of a given exam in advance. It does
publish the types you may encounter across role-based exams, with demonstration videos:

- Multiple choice
- Active screen
- Build list
- Drag and drop
- Hot area
- **Case studies**
- **Labs**
- Plus the interface mechanics: mark for review, review screen, navigation and timer

**Use the exam sandbox.** It is free, it uses the real exam interface, and it includes the same
introductory screens, instructions, help information and candidate agreement you will see on the
day. Working through it once removes an entire category of avoidable stress - and if you use
assistive devices, it is where you learn how they behave in that interface.

> Sandbox: <https://aka.ms/examdemo>

## 4. Breaks - the rules that cost people marks

You may take unscheduled breaks without requesting them in advance. The details are unforgiving
and worth knowing **before** you need one:

- **Five minutes of break time is built into the exam duration**, and Microsoft removed questions
  to accommodate it.
- **The exam clock keeps running during your break.** You may take as long as you want and as
  many breaks as you want; if time expires while you are away, the exam is scored on what you
  completed. No adjustments.
- **Once a break starts, you cannot return to any question you have already viewed** - even
  unanswered ones, even ones marked for review. The break screen tells you how many fall into
  each category first. Answer them before you go.
- You **cannot** break in the middle of a lab, or inside a problem-solution question set - before
  or after, not during.
- You **can** break during a case study, but the same no-return rule applies.
- You must initiate the break through the exam interface before leaving camera view, or **your
  exam will be revoked**.
- Accessing any unauthorised material during a break also revokes the exam.

**Practical reading:** treat a break as a one-way door. Finish and review everything in front of
you first.

## 5. Microsoft Learn during the exam

Associate and expert role-based exams give you access to **Microsoft Learn** inside the exam
interface. This is real, it is official, and it is widely misunderstood.

What you get:

- Everything on the `learn.microsoft.com` domain **except** Q&A, Practice Assessments, and your
  profile (you cannot sign in)
- A split-screen pane you can resize, or expand to full screen
- Multiple tabs
- **Ctrl+F / Command+F within a Learn page**, with match counts and next/previous navigation
- Navigation outside the Learn domain is blocked

What you do **not** get:

- **Extra time. The exam timer continues the entire time you are reading.**

Microsoft's own framing is that it is intended for questions where you may need to look something
up - **not** for answering every question, and that if you use it that way *you will not finish,
and that is by design*.

**How to actually use it.** The value is in looking up **one specific fact you know exists** -
a plan name, a role name, whether a default is on or off. That is a thirty-second lookup if you
know which page you are heading for, and a five-minute loss if you are browsing.

Which is a direct argument for how this guide is written: every module's **Sources** block names
the exact pages its claims come from. Working through those pages during study is what makes
in-exam lookup fast rather than expensive. The pages worth knowing your way around by the end:

- The SC-500 study guide itself
- Defender for Cloud plan and CSPM documentation
- Key Vault RBAC vs access policies
- Azure Firewall rule processing
- Sentinel roles and content hub
- Purview Audit (Standard vs Premium)

## 6. Scoring

Microsoft's certification page for SC-500 **does not publish a question count or a numeric
passing score**, and neither does the exam duration and experience page. What is published:

- Most Microsoft certification exams **typically contain between 40 and 60 questions**, though
  the number varies by exam and is subject to change
- Scoring is scaled, and the score report you receive shows performance by skill area

The commonly cited **700 out of 1000** figure for role-based exams is the standard Microsoft
scoring model rather than something stated on the SC-500 page itself. Treat it as the working
assumption and confirm on Microsoft's scoring documentation - and be sceptical of any site that
quotes a **pass rate percentage**, which Microsoft does not publish at all.

**What the scaled score means in practice:** questions are not worth equal marks, so a domain's
weight is a better guide to study effort than a question count would be.

| Domain | Weight | Modules |
| --- | --- | --- |
| Manage identity, access, and governance | 20-25% | 01-01 to 01-03 |
| **Secure storage, databases, and networking** | **25-30%** | 02-01 to 02-04 |
| Secure compute | 20-25% | 03-01 to 03-06 |
| Manage and monitor security posture | 20-25% | 04-01 to 04-05 |

Domain 2 carries the most weight. Domain 3 contains the AI material with **no AZ-500
precedent** - see [A5](./a5-az500-to-sc500-delta.md) - which makes it the most likely place for
an AZ-500 veteran to be caught out despite the similar weighting.

## 7. Registration, retakes, and accommodations

**Register with a personal Microsoft account.** Microsoft's own recommendation, and the reason is
sharp: if you register with an organisational (work or school) account, **your exam records are
lost if you leave that organisation, and they are unrecoverable.** For anyone certifying while
employed, this is the single highest-consequence five-second decision in the whole process.

**Retakes.** You can retake 24 hours after a first failure. For subsequent attempts the interval
varies - check the retake policy rather than assuming, as the specifics have changed over time.

**Accommodations.** A range is available, and they must be **requested before you register**.
This includes anything involving assistive devices: the secure browser used during a real exam
blocks third-party applications, including assistive devices, without prior approval. The sandbox
does not enable the secure browser, so it will not reveal this problem.

**Exam Replay** offers exist and can reduce the cost of a second attempt. Check current
availability before booking the first one.

## 8. A study sequence for this guide

Assuming you are working through this repository:

1. **Module 0 first**, entirely. Budget guardrails, PIM, teardown discipline. It is not exam
   content; it is what makes the rest survivable.
2. **Domains in order**, 1 → 4, lowest-cost labs first within each. The guide is built so later
   modules reference earlier ones.
3. **[A5](./a5-az500-to-sc500-delta.md) early** if you have AZ-500 background. The dead-content
   table will save you from studying retired features.
4. **[A3](./a3-glossary.md) as a review pass.** It is organised by the distinctions the exam
   tests rather than alphabetically, which makes it a self-test: cover the right-hand side and
   explain the difference.
5. **The exam sandbox** at least a week before, not the night before.
6. **The live skills-measured page** the week of the exam, diffed against
   `docs/SKILLS-MEASURED-SNAPSHOT.md`. This exam is recent enough that the outline still changes.

## 9. What not to trust

- **Any site quoting a pass-rate percentage.** Microsoft does not publish one.
- **Any site quoting a question count as fact.** Microsoft publishes a typical range and says it
  varies.
- **Braindumps.** Beyond the ethics, they violate the Certification Exam Candidate Agreement you
  accept at the start of the exam, and the penalty is loss of certification.
- **AZ-500-era walkthroughs for portal paths.** See [A5](./a5-az500-to-sc500-delta.md).
- **This appendix, eventually.** It was verified on the date in its front matter. The
  certification page carries its own last-updated date - check it.

## Sources

- Microsoft Certified: Cloud and AI Security Engineer Associate: <https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/>
- Exam SC-500 study guide: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Exam duration and exam experience: <https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience>
- Exam retake policy: <https://learn.microsoft.com/en-us/credentials/support/retake-policy>
- Accommodations: <https://learn.microsoft.com/en-us/credentials/certifications/accommodations>
- Certification exam candidate agreement: <https://learn.microsoft.com/en-us/credentials/support/certification-exam-candidate-agreement>
- Exam sandbox: <https://aka.ms/examdemo>
