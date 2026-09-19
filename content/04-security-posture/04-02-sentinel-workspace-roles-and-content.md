---
objective: "Implement activity and event collection in Microsoft Sentinel"
sub_objectives:
  - "Create and connect workspaces in Microsoft Sentinel"
  - "Assign roles in Microsoft Sentinel"
  - "Implement and use content hub solutions"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-03", "04-01"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/sentinel/best-practices"
  - "https://learn.microsoft.com/azure/sentinel/whats-new"
  - "https://learn.microsoft.com/unified-secops/whats-new"
  - "https://learn.microsoft.com/azure/sentinel/billing-reduce-costs"
last_verified: "2026-09-17"
portal: "Microsoft Defender portal > Microsoft Sentinel"
powershell_module: "Az.OperationalInsights, Az.SecurityInsights"
az_cli_command: "az sentinel onboarding-state create"
kql_tables:
  - "Usage"
  - "Operation"
licensing: "Microsoft Sentinel is billed on data ingestion and retention, through pay-as-you-go or commitment tiers. The workspace itself carries no separate licence."
azure_resources: ["Microsoft.OperationalInsights/workspaces", "Microsoft.SecurityInsights/onboardingStates"]
lab_cost_estimate: "Low if ingestion is kept minimal. The cost driver is data volume, not the workspace - set a daily cap before connecting anything."
free_practice_available: false
forensic_relevance: "Workspace design decides what an investigation can see. A workspace per subscription means a lateral movement that crosses subscriptions is invisible in any single query, and retention shorter than the median dwell time means the earliest evidence expired before anyone noticed. Role design decides who can look: Microsoft Sentinel Reader and Responder are the difference between an analyst who can investigate and one who can also close an incident."
---

# Sentinel Workspace, Roles, and Content Hub

> **Objective:** Implement activity and event collection in Microsoft Sentinel
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Create and connect workspaces in Microsoft Sentinel
- Assign roles in Microsoft Sentinel
- Implement and use content hub solutions

> **Portal transition, with a moving date.** Microsoft Sentinel is generally available in the
> **Microsoft Defender portal**, including for customers without Defender XDR or an E5
> licence, and new tenants have been onboarded there by default since July 2025. The Azure
> portal experience for Sentinel is being **retired on 31 March 2027** - a date that was
> **extended from the originally announced 1 July 2026**. Some Microsoft Learn pages still
> carry the older July 2026 wording. Assume the Defender portal for anything you build now,
> and check the retirement timeline page before the exam.

## Why this exists

Three domains of controls have been generating signal. This one is about where it goes and
who may look at it - and the decisions here are unusually hard to reverse.

A SIEM is not primarily an analytics problem. It is a **design** problem with three questions
that each cost real money to get wrong:

1. **How many workspaces, and where?** A workspace is a data boundary. Data in two workspaces
   can be queried together, but not by default, not as conveniently, and not by every feature.
2. **How long do you keep what?** Retention is the difference between an investigation and an
   apology. It is also the second-largest line on the bill.
3. **Who can see and do what?** A SOC analyst, a workload owner, and an auditor need different
   access to the same table.

And underneath all three is the constraint that shapes every Sentinel decision: **you pay by
the gigabyte.** Ingest everything and the bill is unmanageable. Ingest too little and the
investigation fails. Nearly every design pattern in Sentinel exists to resolve that tension.

## How it works under the hood

### Workspaces

Microsoft Sentinel is a solution **on top of a Log Analytics workspace**. That remains true
after the Defender portal transition: **Log Analytics workspaces are still the primary data
store** for ingestion, KQL, analytics rules, retention, and billing. The Defender portal
changes where you work, not where the data lives.

The workspace decision:

| Approach | Advantages | Costs |
| --- | --- | --- |
| **Single workspace** | One query surface, one set of analytics rules, incidents that correlate across everything | Coarse access control, all data in one region |
| **Multiple workspaces** | Data residency, per-tenant or per-business-unit separation, delegated ownership | Cross-workspace queries, duplicated rules, more to manage |

Drivers for multiple workspaces are usually **regulatory** (data must stay in a region),
**organisational** (an MSSP serving many tenants, or a group with genuinely separate SOCs), or
**contractual**. Drivers for a single workspace are analytical: correlation is easy inside a
workspace and awkward across them.

Where multiple workspaces are unavoidable, the tools are **cross-workspace queries**, the
**workspace manager** for pushing content centrally from one workspace to members, and **Azure
Lighthouse** for managing workspaces in other tenants.

**Retention and tiers** are where cost design happens:

- **Interactive retention** - queryable at full speed, the default and the expensive one
- **Cheaper ingestion and storage tiers** for high-volume, low-value telemetry that you need to
  have but rarely query
- **Long-term retention** for compliance, priced for storage rather than for querying
- The **Microsoft Sentinel data lake**, which offers affordable long-term storage with a
  unified query experience, and is the current answer to "keep everything for years without
  paying analytics prices"

**Pricing** is pay-as-you-go or **commitment tiers**, billed daily. The asymmetry matters
operationally: you can **increase** a commitment tier at any time, which **restarts the 31-day
commitment period**, but to move down a tier or back to pay-as-you-go you must **wait out the
31 days**. Commit cautiously in a lab and in a new deployment.

One more, which saves real money and appears as a scenario: after enabling the **Defender XDR
connector**, disable the individual Defender product connectors. Otherwise you ingest the same
data twice and pay for it twice.

### Roles

Sentinel uses Azure RBAC, and the built-in roles are scoped to the workspace's resource group
in practice:

| Role | Can |
| --- | --- |
| **Microsoft Sentinel Reader** | View data, incidents, workbooks, and other resources |
| **Microsoft Sentinel Responder** | Everything Reader can, plus manage incidents - assign, change severity, close |
| **Microsoft Sentinel Contributor** | Everything Responder can, plus create and edit analytics rules, workbooks, and other content |
| **Microsoft Sentinel Playbook Operator** | List, view, and manually run playbooks |
| **Microsoft Sentinel Automation Contributor** | Allows Sentinel itself to add playbooks to automation rules - assigned to the service, **not to people** |

Two things these roles do **not** cover, and both are exam-relevant:

- **Playbooks are Logic Apps.** Creating and editing them needs Logic App permissions, not
  Sentinel ones. Playbook Operator lets someone *run* a playbook; it does not let them build
  one.
- **Data access is layered.** Log Analytics roles govern the workspace's data plane, and
  finer-grained control is available through **table-level RBAC** (access to specific tables)
  and **resource-context RBAC** (a workload owner sees rows about their own resources without
  seeing the rest of the workspace). Resource-context is the right answer when the question
  says an application team should investigate their own servers without SOC-level access.

The least-privilege pattern is straightforward once you see the shape: analysts get
**Responder**, engineers who write detections get **Contributor**, workload owners get
**resource-context** access, and auditors get **Reader**.

The **content hub** has its own requirement worth memorising: installing, updating, and
deleting solutions or standalone content needs **Microsoft Sentinel Contributor at the
resource group level.** Configuring a data connector needs read and write on the workspace.

### Content hub

Content hub is the single catalogue of packaged content. A **solution** is a bundle for a
product or scenario, typically containing some mixture of:

- Data connectors
- Analytics rule templates
- Workbooks
- Hunting queries
- Playbooks
- Parsers and watchlists

The mechanic people get wrong: **installing a solution does not enable its content.** Installing
puts analytics rule *templates* in your workspace; you then create **active rules** from those
templates, tuning thresholds and entity mappings as you go. A tenant with forty solutions
installed and no active rules has a full catalogue and no detections.

Solutions are **versioned and updated** independently, and an update does not silently overwrite
the rules you created from a template - which is good, and also means your active rules do not
automatically benefit from an improved template. Reviewing updates is a periodic task, not a
one-off.

The **deployment order** that avoids wasted effort: create the workspace → onboard Sentinel →
connect Sentinel to the Defender portal → install content hub solutions → configure their data
connectors → enable analytics rules from the templates. Installing solutions before deciding
what you will ingest produces a catalogue matched to nothing.

## Configuration surface

| Setting | Default | Set it to | Why |
| --- | --- | --- | --- |
| Portal | Azure portal for older deployments | **Defender portal** | Azure portal retires 31 March 2027 |
| Workspace count | one | One, unless residency or tenancy forces more | Correlation is easy inside a workspace |
| Workspace region | your choice | Where the data is required to live | Not changeable afterwards |
| Daily cap | none | **Set one before connecting anything** | The only hard stop on ingestion spend |
| Pricing tier | pay-as-you-go | Commitment tier once volume is known | Increases restart the 31-day period; decreases must wait it out |
| Retention | workspace default | Interactive short, long-term or data lake for the rest | Retention is the second-largest bill line |
| Defender XDR connector | off | On - **and disable the individual product connectors** | Otherwise you pay twice for the same data |
| Analyst access | none | Microsoft Sentinel **Responder** | Read plus incident management |
| Detection engineer access | none | Microsoft Sentinel **Contributor** | Create and edit rules |
| Workload owner access | none | **Resource-context RBAC** | Their own resources, not the whole workspace |
| Playbook authors | none | Logic App permissions, not a Sentinel role | Playbooks are Logic Apps |
| Content hub installation rights | none | Sentinel Contributor at **resource group** scope | Documented requirement |

## Common failure modes

**A workspace per subscription, because it seemed tidy.** Every cross-subscription
investigation now requires cross-workspace queries, and analytics rules must be duplicated and
maintained in each.

**Region chosen without thinking.** Workspace region is not changeable after creation; moving
means a new workspace and a migration.

**No daily cap.** A misconfigured syslog or WEF collector - the exact scenario in 04-03 - can
ingest far more than intended before anyone notices, and the cost pipeline lag from 00-01 means
you learn about it late.

**Commitment tier raised to "save money" in a new deployment.** The 31-day period restarts on
every increase and you cannot come back down until it completes.

**Defender XDR connector plus individual product connectors.** Duplicate ingestion, duplicate
bill, duplicate rows in every query.

**Solutions installed, no active rules created.** Templates are not detections.

**Contributor handed to analysts.** They can edit and delete detection logic. Responder is the
analyst role.

**Playbook Operator granted to someone expected to build playbooks.** They can run them and not
create them.

**Retention set to 30 days because it is the default.** Median attacker dwell time is
comfortably longer than that, so the earliest evidence expires before the investigation starts.

**Building in the Azure portal now.** It works until it does not, and the deadline is fixed.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "analyst must triage and close incidents, not edit rules" | Microsoft Sentinel Responder |
| "must create and modify analytics rules" | Microsoft Sentinel Contributor |
| "run a playbook manually, nothing else" | Microsoft Sentinel Playbook Operator |
| "Sentinel must attach playbooks to automation rules" | Microsoft Sentinel Automation Contributor, assigned to the service |
| "team sees only logs from their own servers" | Resource-context RBAC |
| "restrict access to one table" | Table-level RBAC |
| "data must remain in a specific country" | Separate workspace in that region |
| "manage workspaces in a customer tenant" | Azure Lighthouse |
| "push content to multiple workspaces centrally" | Workspace manager |
| "install a vendor's connectors, rules and workbooks together" | Content hub solution |
| "install solutions" | Sentinel Contributor at resource group scope |
| "reduce cost for high-volume, rarely queried logs" | Cheaper tier, long-term retention, or the data lake |
| "avoid paying twice for Defender data" | Disable individual product connectors after enabling the XDR connector |

**AZ-500 divergence.** The portal moved. Sentinel is GA in the Defender portal and the Azure
portal experience retires on **31 March 2027** - extended from 1 July 2026, and some
documentation still shows the old date. Content hub also replaced the older per-item galleries
as the way content is delivered, and the data lake is new as a cost-management answer. An
AZ-500-era walkthrough will navigate a portal that is on a countdown.

## Hands-on

See [04-02 lab](../../labs/04-security-posture/04-02-lab.md).

## Check yourself

1. Your organisation has 12 subscriptions in one tenant, all in one country, one SOC. A
   colleague proposes a workspace per subscription for "isolation." Give the strongest argument
   for their design and then the case against it, in operational terms.
2. An analyst says they cannot close an incident. They hold Microsoft Sentinel Reader. Name the
   role they need and one role you would **not** give them, with the reason.
3. A team installs 40 content hub solutions in an afternoon and reports that Sentinel is
   "deployed." What is missing, and what would you check first to confirm?
4. Explain what happens to your bill when you enable the Defender XDR connector while individual
   Defender product connectors remain enabled.
5. You set a commitment tier too high in week one. Describe precisely what you can and cannot
   do about it, and when.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Best practices for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/best-practices>
- What's new in Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/whats-new>
- What's new in unified security operations: <https://learn.microsoft.com/unified-secops/whats-new>
- Reduce costs for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/billing-reduce-costs>
