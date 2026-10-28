# SC500 Academy

<h3 align="center">
  <a href="https://ironbranded.github.io/SC500-Academy/" target="_blank" rel="noopener noreferrer">
    🟢 TRY THE ACADEMY 🟢
  </a>
</h3>

---

**A free study companion for Microsoft Exam SC-500: Implementing End-to-End Security
Controls for Cloud and AI Workloads** (Microsoft Certified: Cloud and AI Security
Engineer Associate).

**Beginner-first in how it explains cloud and AI security. Certification-first in
what it teaches.** Its one purpose is to help you pass SC-500, by understanding the
security requirement behind each control rather than memorising product names.
Everything maps to the official skills outline:

- **seventeen short foundation primers** for anyone new to cloud, identity, networks
  or AI - not exam content, just what the lessons assume;
- **a lesson for every exam objective** that starts from the security problem, then
  plain English, a mental model, Microsoft's terminology, how it works, what it does
  and does not solve, and how SC-500 tests it;
- **a hands-on lab** with its cost stated up front, a desired security outcome you
  prove in Validation, and a mandatory cleanup;
- **knowledge checks** that explain every answer: why, why not each alternative, the
  scenario clue, and the misconception being tested;
- **nineteen structured comparisons** of the controls the exam is built to confuse;
- **a dashboard** that shows what you have studied, practised, checked, applied and
  retained, and what to do next.

It is built from Microsoft Learn and is meant to be used **with** it, not instead of
it.

**Who it is for.** Anyone preparing for SC-500 - including people with limited
exposure to Azure, Microsoft 365, Entra ID, networking or AI. If those are new, start
with **Module 0A**; every lesson also links the primers it relies on, just in time.
If you already work with Azure, go straight to Module 0B and Domain 1. If you prepared
for AZ-500, appendix A5 shows what changed.

## Contents

- [Using it with Microsoft Learn](#using-it-with-microsoft-learn)
- [Table of contents](#table-of-contents)
  - [Module 0A: Before we secure the cloud](#module-0a--before-we-secure-the-cloud)
  - [Module 0B: Safe lab foundations](#module-0b--safe-lab-foundations)
  - [Domain 1: Identity, Access & Governance](#domain-1--identity-access--governance-2025-of-the-exam)
  - [Domain 2: Storage, Databases & Networking](#domain-2--storage-databases--networking-2530-of-the-exam)
  - [Domain 3: Compute Security](#domain-3--compute-security-2025-of-the-exam)
  - [Domain 4: Security Posture & Monitoring](#domain-4--security-posture--monitoring-2025-of-the-exam)
  - [Appendices](#appendices)
  - [Study tools](#study-tools)
- [A study plan that works](#a-study-plan-that-works)
- [About the labs](#about-the-labs)
- [Before exam day](#before-exam-day)
- [Feedback and contributing](#feedback-and-contributing)

---

## Using it with Microsoft Learn

Microsoft publishes the official course for this exam, **[Course SC-500T00-A: Implement
end-to-end security controls for cloud and AI workloads](https://learn.microsoft.com/en-us/training/courses/sc-500t00)**.
It is a self-paced set of learning paths on Microsoft Learn, one per exam objective.
Microsoft's **[SC-500 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500)**
lists the skills the exam measures. The Academy follows both.

**How the two fit together.**
- **Microsoft Learn** teaches the products, in depth, in Microsoft's own words.
- **The Academy** keeps you pointed at the exam:
  - which official objective you are on;
  - which controls are easy to confuse;
  - how a question is likely to frame a requirement;
  - whether you can actually apply it.

**Every lesson links its official training.** Each lesson starts with *Official
Microsoft training for this lesson*: the exact Microsoft Learn modules that cover it,
the full learning path for its objective, and any of Microsoft's own lab exercises that
apply. Each lesson also ends with the Microsoft Learn documentation pages it was built
from.

**A routine for each lesson:**

1. Open the lesson and read **What you need to know**: the official sub-objectives, in
   Microsoft's wording, and any foundation primers it relies on.
2. Read **The security problem** and **In plain English** before anything else. If a
   term is unfamiliar, it is in **Words you need to know**.
3. Work through the **Microsoft Learn modules** listed for the lesson.
4. Read the rest of the lesson: the mechanism, why security cares, the comparisons
   that matter, and what the exam looks for (**SC-500 Exam Lens**).
5. Do the **lab** in your test tenant. Prove the desired security outcome in
   Validation, then clean up.
6. Take the **knowledge check**, then **Teach it back**: explain the control in your
   own words.
7. Open two or three of the lesson's **Sources** pages and learn your way around them.

**Why step 7 pays off.** Microsoft permits access to Microsoft Learn during most
role-based exams. Finding one fact takes thirty seconds when you know which page to
open, and five minutes when you are browsing. Appendix A4 lists the pages worth
knowing.

**When sources disagree, trust Microsoft Learn.** Where this guide differs from older
AZ-500 material, every lesson says so in an *AZ-500 divergence* note, and appendix A5
collects them all.

---

## Table of contents

Every link opens the live Academy.

### Module 0A · Before we secure the cloud

Not exam content. Seventeen short primers on what the lessons assume: the cloud,
tenants and subscriptions, identity, networks, data, logs, control types, shared
responsibility, generative AI and AI agents. Each names the official objectives it
supports. Read them in order if you are new; dip in from a lesson's prerequisites if
you are not.

| # | Primer | Supports objectives |
| --- | --- | --- |
| 0A-01 | [What the Cloud Is](https://ironbranded.github.io/SC500-Academy/#/module/0A-01) | 1.2, 1.3, 3.2, 3.3, 4.1 |
| 0A-02 | [Azure and Microsoft 365](https://ironbranded.github.io/SC500-Academy/#/module/0A-02) | 1.1, 3.1, 4.2, 4.3 |
| 0A-03 | [Tenants, Subscriptions, and Resources](https://ironbranded.github.io/SC500-Academy/#/module/0A-03) | 1.3, 4.1, 4.2 |
| 0A-04 | [Users, Accounts, and Identities](https://ironbranded.github.io/SC500-Academy/#/module/0A-04) | 1.1, 1.3, 3.1 |
| 0A-05 | [Authentication and Authorization](https://ironbranded.github.io/SC500-Academy/#/module/0A-05) | 1.1, 1.2, 1.3, 2.1, 2.2 |
| 0A-06 | [Applications and Workloads](https://ironbranded.github.io/SC500-Academy/#/module/0A-06) | 1.1, 3.2, 3.3 |
| 0A-07 | [Networks: Addresses, Subnets, Routing, DNS, and Firewalls](https://ironbranded.github.io/SC500-Academy/#/module/0A-07) | 2.3, 1.2, 2.1 |
| 0A-08 | [Public and Private Connectivity](https://ironbranded.github.io/SC500-Academy/#/module/0A-08) | 2.3, 1.2, 2.1, 2.2 |
| 0A-09 | [Storage and Databases](https://ironbranded.github.io/SC500-Academy/#/module/0A-09) | 2.1, 2.2 |
| 0A-10 | [APIs](https://ironbranded.github.io/SC500-Academy/#/module/0A-10) | 3.3, 3.1 |
| 0A-11 | [Logs and Telemetry](https://ironbranded.github.io/SC500-Academy/#/module/0A-11) | 4.2, 2.2, 4.1 |
| 0A-12 | [Preventive, Detective, Corrective, and Governance Controls](https://ironbranded.github.io/SC500-Academy/#/module/0A-12) | 1.3, 4.1 |
| 0A-13 | [Shared Responsibility](https://ironbranded.github.io/SC500-Academy/#/module/0A-13) | 4.1, 3.1, 3.2, 3.3 |
| 0A-14 | [Generative AI](https://ironbranded.github.io/SC500-Academy/#/module/0A-14) | 3.1 |
| 0A-15 | [AI Models, Prompts, and Outputs](https://ironbranded.github.io/SC500-Academy/#/module/0A-15) | 3.1 |
| 0A-16 | [AI Agents and Connected Tools](https://ironbranded.github.io/SC500-Academy/#/module/0A-16) | 3.1, 4.3 |
| 0A-17 | [How Microsoft Cloud Security Fits Together](https://ironbranded.github.io/SC500-Academy/#/module/0A-17) | 1.1, 1.3, 2.3, 4.1, 4.2 |

### Module 0B · Safe lab foundations

Not exam content, and not optional. It sets a budget with spending alerts, replaces
standing administrator access with just-in-time access through PIM, and gives you the
cleanup checklist every later lab uses. Do it before creating anything billable.

| # | Lesson | Practice |
| --- | --- | --- |
| 00-00 | [Module Overview: Lab Topology and Conventions](https://ironbranded.github.io/SC500-Academy/#/module/00-00) | — |
| 00-01 | [Cost Guardrails and Budget Alerts](https://ironbranded.github.io/SC500-Academy/#/module/00-01) | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/00-01) |
| 00-02 | [PIM-Based Just-in-Time Lab Access](https://ironbranded.github.io/SC500-Academy/#/module/00-02) | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/00-02) |
| 00-03 | [Reusable Teardown Checklist](https://ironbranded.github.io/SC500-Academy/#/module/00-03) | — |

### Domain 1 · Identity, Access & Governance (20–25% of the exam)

*Official: Manage identity, access, and governance.* [Domain review →](https://ironbranded.github.io/SC500-Academy/#/domain/01)

| # | Lesson | Official objective | Practice |
| --- | --- | --- | --- |
| 01-01 | [Secure Access with Microsoft Entra ID](https://ironbranded.github.io/SC500-Academy/#/module/01-01) | Secure access to resources by using Microsoft Entra ID | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/01-01) |
| 01-02 | [Secrets and Keys with Azure Key Vault](https://ironbranded.github.io/SC500-Academy/#/module/01-02) | Secure secrets and keys by using Azure Key Vault | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/01-02) |
| 01-03 | [Governance and Regulatory Compliance](https://ironbranded.github.io/SC500-Academy/#/module/01-03) | Implement governance to enforce security and regulatory compliance | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/01-03) |

### Domain 2 · Storage, Databases & Networking (25–30% of the exam)

*Official: Secure storage, databases, and networking.* [Domain review →](https://ironbranded.github.io/SC500-Academy/#/domain/02)

| # | Lesson | Official objective | Practice |
| --- | --- | --- | --- |
| 02-01 | [Storage Account Security](https://ironbranded.github.io/SC500-Academy/#/module/02-01) | Implement security for storage accounts | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/02-01) |
| 02-02 | [Database Security](https://ironbranded.github.io/SC500-Academy/#/module/02-02) | Implement security for databases | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/02-02) |
| 02-03 | [Network Segmentation and Connectivity](https://ironbranded.github.io/SC500-Academy/#/module/02-03) | Implement security for Azure network services | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/02-03) |
| 02-04 | [Private Access and Network Perimeter](https://ironbranded.github.io/SC500-Academy/#/module/02-04) | Implement security for Azure network services | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/02-04) |

### Domain 3 · Compute Security (20–25% of the exam)

*Official: Secure compute.* [Domain review →](https://ironbranded.github.io/SC500-Academy/#/domain/03)

| # | Lesson | Official objective | Practice |
| --- | --- | --- | --- |
| 03-01 | [AI Data Exposure and Purview DSPM](https://ironbranded.github.io/SC500-Academy/#/module/03-01) | Implement security for AI | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-01) |
| 03-02 | [AI Agent Identity and Governance](https://ironbranded.github.io/SC500-Academy/#/module/03-02) | Implement security for AI | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-02) |
| 03-03 | [AI Platform and Workload Protection](https://ironbranded.github.io/SC500-Academy/#/module/03-03) | Implement security for AI | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-03) |
| 03-04 | [Server and Virtual Machine Security](https://ironbranded.github.io/SC500-Academy/#/module/03-04) | Implement security for servers and virtual machines (VMs) | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-04) |
| 03-05 | [Container Platform Security](https://ironbranded.github.io/SC500-Academy/#/module/03-05) | Implement security for application platform services | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-05) |
| 03-06 | [Serverless, Web, and API Security](https://ironbranded.github.io/SC500-Academy/#/module/03-06) | Implement security for application platform services | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/03-06) |

### Domain 4 · Security Posture & Monitoring (20–25% of the exam)

*Official: Manage and monitor security posture.* [Domain review →](https://ironbranded.github.io/SC500-Academy/#/domain/04)

| # | Lesson | Official objective | Practice |
| --- | --- | --- | --- |
| 04-01 | [Security Posture with Defender for Cloud](https://ironbranded.github.io/SC500-Academy/#/module/04-01) | Manage security posture by using Defender for Cloud | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/04-01) |
| 04-02 | [Sentinel Workspace, Roles, and Content Hub](https://ironbranded.github.io/SC500-Academy/#/module/04-02) | Implement activity and event collection in Microsoft Sentinel | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/04-02) |
| 04-03 | [Sentinel Data Connectors and Event Collection](https://ironbranded.github.io/SC500-Academy/#/module/04-03) | Implement activity and event collection in Microsoft Sentinel | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/04-03) |
| 04-04 | [Sentinel Automation, Retention, and Purview Audit](https://ironbranded.github.io/SC500-Academy/#/module/04-04) | Implement activity and event collection in Microsoft Sentinel | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/04-04) |
| 04-05 | [Microsoft Security Copilot](https://ironbranded.github.io/SC500-Academy/#/module/04-05) | Implement Microsoft Security Copilot | [Lab](https://ironbranded.github.io/SC500-Academy/#/lab/04-05) |

### Appendices

| | Appendix | When to use it |
| --- | --- | --- |
| A1 | [PowerShell and Microsoft Graph reference](https://ironbranded.github.io/SC500-Academy/#/appendix/a1) | When a lab stalls on a module or a cmdlet |
| A2 | [Licensing and lab cost matrix](https://ironbranded.github.io/SC500-Academy/#/appendix/a2) | Before you enable anything that is billed |
| A3 | [Glossary](https://ironbranded.github.io/SC500-Academy/#/appendix/a3) | As a review pass. It is organised by the distinctions the exam tests |
| A4 | [Exam logistics and scoring](https://ironbranded.github.io/SC500-Academy/#/appendix/a4) | Once early, and again the week before |
| A5 | [AZ-500 to SC-500 delta](https://ironbranded.github.io/SC500-Academy/#/appendix/a5) | Early, if you know AZ-500. It lists what is gone, not just renamed |
| A6 | [Choosing between overlapping controls](https://ironbranded.github.io/SC500-Academy/#/appendix/a6) | After Domain 2, and again in the final week. Long-form "which control does the question want?" tables, each with its trap. The shorter structured versions are in **Compare controls** |
| A7 | [Related topics with no skills bullet](https://ironbranded.github.io/SC500-Academy/#/appendix/a7) | Late, at recognition depth. Services Microsoft links from the study guide without a bullet of their own |
| A8 | [Timed portal drills](https://ironbranded.github.io/SC500-Academy/#/appendix/a8) | A week after the labs, against the clock, documentation closed |
| A9 | [Case study 1: Northwind Logistics](https://ironbranded.github.io/SC500-Academy/#/appendix/a9) | Near the end. Scenarios that cut across lessons |
| A10 | [Case study 2: Contoso Manufacturing](https://ironbranded.github.io/SC500-Academy/#/appendix/a10) | Near the end |
| A11 | [Case study 3: Meridian Trust](https://ironbranded.github.io/SC500-Academy/#/appendix/a11) | Near the end |

### Study tools

| Tool | What it is for |
| --- | --- |
| [Dashboard](https://ironbranded.github.io/SC500-Academy/#/) | What to study next, and how much of each domain you have **studied**, **practised** and **knowledge-checked**, per official objective - plus questions **applied** in mixed sets and **retained** a week later |
| [Compare controls](https://ironbranded.github.io/SC500-Academy/#/compare) | Nineteen comparisons of the controls SC-500 is built to confuse. Every option answers the same nine questions, with scenario clues and the trap |
| [Domain reviews](https://ironbranded.github.io/SC500-Academy/#/domain/01) | End-of-domain summary, key comparisons, a mixed question set, and what needs another look |
| [Exam prep](https://ironbranded.github.io/SC500-Academy/#/prep) | Questions by domain or objective, the ones you got wrong, the ones you have not tried, and lessons you marked *Review later* |
| [Mock exam](https://ironbranded.github.io/SC500-Academy/#/exam) | Timed and weighted across all four domains |
| [Flashcards](https://ironbranded.github.io/SC500-Academy/#/cards) | The distinctions the exam turns on, on a spaced-repetition schedule |
| [Control map](https://ironbranded.github.io/SC500-Academy/map/) | Every SC-500 control on one map, from who is asking to who responds. Nine walkthroughs show the controls working together on a real request (an admin change, an app reading a secret, an AI agent using a tool, an alert becoming an incident); Explore shows what each control solves, what it doesn't, what it connects to, and its official objectives |
| [Flowcharts](https://ironbranded.github.io/SC500-Academy/flowcharts/) | Twenty flowcharts of the controls working together: nine requests step by step with yes/no decisions (an admin change, an app reading a secret, a request through WAF and API Management, VM egress through Azure Firewall, an AI agent calling a tool), four *which control?* decision trees, and five *who wins?* evaluation orders (Conditional Access, NSGs, Azure Policy, Azure Firewall, Key Vault and Storage data access). Each lists what to remember and the lessons that teach it, and 17 of them also appear inside those lessons |
| [Case studies](https://ironbranded.github.io/SC500-Academy/#/cases) | Four organisations, each with an environment, numbered requirements and several exam-style questions about one design (single answer, choose two, drop-down lists). **Review my design** shows where your answers conflict with each other |
| [Break-fix drills](https://ironbranded.github.io/SC500-Academy/#/drills) | Eight broken configurations on paper: read the ticket and the evidence, pick the line that proves the cause, then choose the cause, the fix and how to prove it worked |
| [Study posters](https://ironbranded.github.io/SC500-Academy/#/posters) | Five two-sided tabloid posters (17 × 11 in), each with its own header colour: which control, who wins, the AI security stack, posture and monitoring, and the portal paths and PowerShell to build, revoke, disable and clean up. PDFs in `posters/pdf/` |
| [Objective coverage](https://ironbranded.github.io/SC500-Academy/#/coverage) | Every official sub-objective, and the lesson, comparisons, lab, questions and foundation primers that cover it |
| [Cost planner](https://ironbranded.github.io/SC500-Academy/#/cost) | Every lab, ordered by what it costs to run |
| [Verification watchlist](https://ironbranded.github.io/SC500-Academy/#/preview) | Lessons covering preview features, or due for a fresh check against the documentation |

The Academy works offline after your first visit. Your progress stays in your browser
only, so export it from the dashboard before you switch devices. Nothing on the site
predicts a pass. It shows what you have actually done, because the exam is scaled, and
a single percentage would hide exactly the gaps you need to see.

---

## A study plan that works

| Pass | What you do |
| --- | --- |
| **0** | Module 0A if cloud, identity, networking or AI are new to you. Then Module 0B, all of it. Skim A2 and A4. Read A5 early if you know AZ-500 |
| **1** | Domains 1 to 4 in order, following the lesson routine above. Do the cheapest labs first within each domain |
| **2** | Each **domain review**, the lessons in **Review pass** mode, then **Compare controls**, A6 and A3 |
| **3** | **Exam prep**: wrong answers first, then unanswered questions. Then the case studies, the **mock exam**, and the A8 drills |
| **4** | The week before: A5 and A6 again, Microsoft's exam sandbox, and a final check that the skills outline has not changed |

---

## About the labs

- **Every lab states its cost before you create anything.** Several services bill by
  the hour whether you use them or not: Security Copilot, Azure Firewall, Bastion,
  Defender for Servers, AKS, API Management and Application Gateway. The cost planner
  shows them all.
- **Every lab is built around an outcome, not a list of clicks.** It explains why the
  lab matters, shows the architecture, and states the **desired security outcome**
  first. Validation proves each statement; *What just happened?* and *Limitations*
  explain the mechanism and what the control does not solve.
- **Every lab ends in a mandatory cleanup.** A lab only counts as practised on your
  dashboard once its cleanup checklist and its completion confirmations are ticked.
- **Most tasks are shown two ways**, in the Azure portal and in PowerShell. Do the
  portal first, because that is what the exam shows you. Then do PowerShell, because
  that is what you will reuse.
- **Some features need licences a Microsoft 365 E5 tenant does not include**: agent
  identities, network controls for agents, and Microsoft Entra Private Access. Their
  labs split into *build it if you are licensed* and *design it if you are not*. The
  design exercise is the same reasoning the exam asks for.

---

## Before exam day

SC-500 is recent, and its outline still changes. The Academy checks the official
outline every week, and every lesson shows when it was last verified against the
documentation. Before you book your exam:

- compare the [study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500)
  with the lessons you rely on;
- read appendix A4 for the logistics;
- check the certification page for Microsoft's practice assessment.

---

## Feedback and contributing

- **Found something wrong or out of date?** Open an issue with the *Content is wrong
  or out of date* form, and include the Microsoft Learn page that shows the correct
  behaviour.
- **A lab left something running or exposed?** Report it through
  [SECURITY.md](SECURITY.md).
- **Want to contribute?** See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). What
  changed and when is in [CHANGELOG.md](CHANGELOG.md). How the curriculum was checked
  against the official outline is in
  [docs/OBJECTIVE-VALIDATION.md](docs/OBJECTIVE-VALIDATION.md).

Please never share exam dumps or questions recalled from the live exam. Every question
here is written from the documentation.

## Licence

MIT for code, CC BY 4.0 for lessons and labs.

Microsoft product names, documentation excerpts and the SC-500 skills outline remain the
property of Microsoft Corporation and are used for educational reference. This project
is not affiliated with or endorsed by Microsoft.

Maintained by IronBranded.
