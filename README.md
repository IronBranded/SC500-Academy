# SC500 Academy

<h3 align="center">
  <a href="https://ironbranded.github.io/SC500-Academy/" target="_blank" rel="noopener noreferrer">
    🟢 TRY THE ACADEMY 🟢
  </a>
</h3>

---

**A free, certification-first study companion for Microsoft Exam SC-500:
Implementing End-to-End Security Controls for Cloud and AI Workloads** (Microsoft
Certified: Cloud and AI Security Engineer Associate).

Its one purpose is to help you pass SC-500. Everything in it maps to the official
skills outline:

- a lesson for every exam objective;
- a hands-on lab with its cost stated up front and a mandatory cleanup;
- a knowledge check that explains every answer;
- the comparisons the exam is built on;
- a dashboard that shows what you have studied, practised and checked, and what to
  do next.

It is built from Microsoft Learn and is meant to be used **with** it, not instead of
it.

**Who it is for.** Security engineers preparing for SC-500 who already work with
Azure: compute, networking, storage and Microsoft Entra ID. It is not an introduction
to Azure. Lessons that depend on foundational knowledge say so. If you prepared for
AZ-500, appendix A5 shows what changed.

## Contents

- [Using it with Microsoft Learn](#using-it-with-microsoft-learn)
- [Table of contents](#table-of-contents)
  - [Start here: Module 0](#start-here-module-0--lab-safety)
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
   Microsoft's wording.
2. Work through the **Microsoft Learn modules** listed for the lesson.
3. Read the lesson. It explains the mechanism, the distinctions that matter, and what
   the exam looks for (**SC-500 Exam Lens**).
4. Do the **lab** in your test tenant, including its cleanup.
5. Take the **knowledge check**. Every answer is explained, including why the wrong
   options are wrong.
6. Open two or three of the lesson's **Sources** pages and learn your way around them.

**Why step 6 pays off.** Microsoft permits access to Microsoft Learn during most
role-based exams. Finding one fact takes thirty seconds when you know which page to
open, and five minutes when you are browsing. Appendix A4 lists the pages worth
knowing.

**When sources disagree, trust Microsoft Learn.** Where this guide differs from older
AZ-500 material, every lesson says so in an *AZ-500 divergence* note, and appendix A5
collects them all.

---

## Table of contents

Every link opens the live Academy.

### Start here: Module 0 · Lab safety

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
| A6 | [Choosing between overlapping controls](https://ironbranded.github.io/SC500-Academy/#/appendix/a6) | After Domain 2, and again in the final week. Fifteen "which control does the question want?" comparisons, each with its trap |
| A7 | [Related topics with no skills bullet](https://ironbranded.github.io/SC500-Academy/#/appendix/a7) | Late, at recognition depth. Services Microsoft links from the study guide without a bullet of their own |
| A8 | [Timed portal drills](https://ironbranded.github.io/SC500-Academy/#/appendix/a8) | A week after the labs, against the clock, documentation closed |
| A9 | [Case study 1: Northwind Logistics](https://ironbranded.github.io/SC500-Academy/#/appendix/a9) | Near the end. Scenarios that cut across lessons |
| A10 | [Case study 2: Contoso Manufacturing](https://ironbranded.github.io/SC500-Academy/#/appendix/a10) | Near the end |
| A11 | [Case study 3: Meridian Trust](https://ironbranded.github.io/SC500-Academy/#/appendix/a11) | Near the end |

### Study tools

| Tool | What it is for |
| --- | --- |
| [Dashboard](https://ironbranded.github.io/SC500-Academy/#/) | What to study next, and how much of each domain you have **studied**, **practised** and **knowledge-checked**, per official objective |
| [Domain reviews](https://ironbranded.github.io/SC500-Academy/#/domain/01) | End-of-domain summary, key comparisons, a mixed question set, and what needs another look |
| [Exam prep](https://ironbranded.github.io/SC500-Academy/#/prep) | Questions by domain or objective, the ones you got wrong, the ones you have not tried, and lessons you marked *Review later* |
| [Mock exam](https://ironbranded.github.io/SC500-Academy/#/exam) | Timed and weighted across all four domains |
| [Flashcards](https://ironbranded.github.io/SC500-Academy/#/cards) | The distinctions the exam turns on, on a spaced-repetition schedule |
| [Objective coverage](https://ironbranded.github.io/SC500-Academy/#/coverage) | Every official sub-objective, and the lesson, lab and questions that cover it |
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
| **0** | Module 0, all of it. Skim A2 and A4. Read A5 early if you know AZ-500 |
| **1** | Domains 1 to 4 in order, following the lesson routine above. Do the cheapest labs first within each domain |
| **2** | Each **domain review**, the lessons in **Review pass** mode, then A6 and A3 |
| **3** | **Exam prep**: wrong answers first, then unanswered questions. Then the case studies, the **mock exam**, and the A8 drills |
| **4** | The week before: A5 and A6 again, Microsoft's exam sandbox, and a final check that the skills outline has not changed |

---

## About the labs

- **Every lab states its cost before you create anything.** Several services bill by
  the hour whether you use them or not: Security Copilot, Azure Firewall, Bastion,
  Defender for Servers, AKS, API Management and Application Gateway. The cost planner
  shows them all.
- **Every lab ends in a mandatory cleanup.** A lab only counts as practised on your
  dashboard once its cleanup checklist is ticked.
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
  changed and when is in [CHANGELOG.md](CHANGELOG.md).

Please never share exam dumps or questions recalled from the live exam. Every question
here is written from the documentation.

## Licence

MIT for code, CC BY 4.0 for lessons and labs.

Microsoft product names, documentation excerpts and the SC-500 skills outline remain the
property of Microsoft Corporation and are used for educational reference. This project
is not affiliated with or endorsed by Microsoft.

Maintained by IronBranded.
