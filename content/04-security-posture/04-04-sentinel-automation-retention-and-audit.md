---
objective: "Implement activity and event collection in Microsoft Sentinel"
sub_objectives:
  - "Implement automation rules and playbooks in Microsoft Sentinel"
  - "Implement data retention in Microsoft Sentinel data stores"
  - "Query Microsoft Purview Audit in Defender XDR"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-02", "01-01", "04-02", "04-03"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/purview/audit-search"
  - "https://learn.microsoft.com/purview/audit-premium"
  - "https://learn.microsoft.com/azure/sentinel/billing-reduce-costs"
  - "https://learn.microsoft.com/azure/sentinel/best-practices"
last_verified: "2026-09-17"
portal: "Microsoft Defender portal > Sentinel > Automation; Microsoft Defender portal > Audit"
powershell_module: "Az.SecurityInsights, Az.LogicApp, ExchangeOnlineManagement"
az_cli_command: ""
kql_tables:
  - "AuditLogs"
  - "CloudAppEvents"
  - "OfficeActivity"
  - "SecurityIncident"
licensing: "Sentinel retention is billed by tier and duration. Microsoft Purview Audit (Standard) is included with E3/E5 and retains 180 days; Audit (Premium) adds one-year retention, retention policies and high-value events, and is licensed per user."
azure_resources: ["Microsoft.SecurityInsights/automationRules", "Microsoft.Logic/workflows"]
lab_cost_estimate: "Low - Logic Apps on consumption cost pennies at lab volume. Note that restoring archived data and running search jobs carry their own charges with minimums."
free_practice_available: false
forensic_relevance: "This is the most directly investigative module in the guide. MailItemsAccessed is the event that tells you which messages a compromised account actually accessed - before it existed, investigators could establish only that a mailbox had been signed into. It is an Audit (Premium) event and it is licensed per user, which means the answer to 'what did the attacker read' depends on a licensing decision made months earlier. Retention decides the same question for Sentinel: archived data is recoverable through a search job, deleted data is not."
---

# Sentinel Automation, Retention, and Purview Audit

> **Objective:** Implement activity and event collection in Microsoft Sentinel
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Implement automation rules and playbooks in Microsoft Sentinel
- Implement data retention in Microsoft Sentinel data stores
- Query Microsoft Purview Audit in Defender XDR

## Why this exists

Three loosely-related bullets, joined by one idea: **a SOC is constrained by analyst time and
by what it can still see.**

Automation addresses the first. An analyst who spends the first eight minutes of every incident
assigning it, tagging it, and looking up whether the user is in the finance group is spending
most of their day on work that is entirely mechanical.

Retention and audit address the second. An investigation that starts today asks questions about
last month, and the answer is decided by decisions made before anyone knew there would be an
investigation - what you retained, in which tier, and whether the right audit events were being
generated at all.

## How it works under the hood

### Automation rules versus playbooks

These are separate objects and the exam tests the boundary.

| | Automation rule | Playbook |
| --- | --- | --- |
| What it is | A rule in Sentinel: trigger, conditions, actions | A **Logic App** workflow |
| Lives in | Microsoft Sentinel | Azure Logic Apps |
| Can do | Change status, severity, owner; add tags; **suppress**; run a playbook | Anything Logic Apps can reach - ticketing, Teams, Entra, third-party APIs |
| Ordering | Rules run in a defined **order**, and can have an **expiration date** | Called by a rule, or run manually |
| Who can author | Microsoft Sentinel Contributor | **Logic App permissions**, not a Sentinel role |

The relationship in one sentence: **automation rules are the routing layer, playbooks are the
action layer.** The rule decides *whether* and *when*; the playbook does the work.

**Triggers** are incident created, incident updated, and alert created. A playbook's own trigger
type must match how it will be invoked - an incident-trigger playbook cannot be attached to an
alert-created rule.

Two permission facts that cause real deployments to fail:

- **Sentinel needs permission to run your playbook.** The **Microsoft Sentinel Automation
  Contributor** role is granted on the playbook's resource group, to the Sentinel service. This
  is the role from 04-02 that is assigned to a service rather than to a person, and this is why
  it exists.
- **A playbook authenticates as itself.** It uses a managed identity or a connection, and it
  needs its own permissions on whatever it touches. A playbook that disables a user account
  needs directory permissions - and that makes it a privileged object worth protecting, because
  anything that can trigger it inherits that reach.

The most underused automation rule action is **suppression**: closing incidents matching a
condition, with an expiration date. It handles known-benign noise without deleting a detection,
and the expiry means the suppression gets revisited rather than becoming permanent.

### Retention in Sentinel's data stores

Retention has two numbers and they are frequently confused:

- **Interactive retention** - data queryable at full speed with full KQL, available to
  analytics rules. The expensive one.
- **Total retention** - how long data is kept at all, including the long-term or archive tier
  beyond the interactive period.

Data past interactive retention is **not queryable directly**. To use it you run a **search
job** - a query against long-term data that writes results into a new table - or **restore** a
time range back into interactive tier for a period. Both are deliberate, both take time, and
**both carry their own charges, typically with minimums.** This is the difference between "we
have the data" and "we can query the data," and the exam tests that you know it.

Retention is configurable **per table**, which is the lever that makes cost manageable: high-value
detection tables retained long in interactive tier, verbose supporting tables retained short
interactively and long in archive. Alongside this sit the table plans from 04-03 and the
**Microsoft Sentinel data lake** as the cheap long-horizon store.

The framing to carry: retention is not a storage decision, it is a decision about **which
questions you will be able to answer**, made in advance of knowing the questions.

### Microsoft Purview Audit in the Defender portal

The unified audit log records activity across Microsoft 365 - Exchange, SharePoint, Teams,
Entra ID, and more - and is searchable from the Defender portal, through the Audit Search Graph
API, and with `Search-UnifiedAuditLog` in Exchange Online PowerShell.

**Two tiers, and the difference is investigative, not cosmetic:**

| Capability | Audit (Standard) | Audit (Premium) |
| --- | --- | --- |
| Enabled by default | Yes | Yes |
| Thousands of searchable events, CSV export, Graph API, `Search-UnifiedAuditLog` | Yes | Yes |
| **180-day retention** | Yes | Yes |
| **Up to 1-year retention** | No | **Yes** |
| **10-year retention** (add-on) | No | **Yes** |
| **Audit log retention policies** | No | **Yes** |
| **High-value events / intelligent insights** | No | **Yes** |
| Higher bandwidth to the Management Activity API | No | Yes |

Note the retention history, because it is a plausible exam detail: **the Audit (Standard)
default changed from 90 days to 180 days.** Records generated before 17 October 2023 are kept
90 days; records generated on or after that date follow the 180-day default.

**The high-value Audit (Premium) events are the reason this bullet is in a security exam:**

- **MailItemsAccessed** - a mailbox auditing action triggered when mail data is accessed by a
  mail protocol or client. Critically, it fires **even when there is no explicit signal that
  messages were read**, and it records the access type - bind or sync. This is what lets an
  investigator determine the **scope of a mailbox compromise**: not merely that an account was
  signed into, but which messages were exposed.
- **Send** - with richer metadata than the standard event.
- **SearchQueryInitiated** for Exchange and SharePoint - what a threat actor searched for inside
  a compromised account, which is often the clearest statement of what they were after.

Two configuration facts:

- **Audit (Premium) events are generated only for users who hold the licence.** It is per-user,
  so an unlicensed user's mailbox produces no MailItemsAccessed records. The decision about who
  holds the licence is made long before the incident and determines whether the question can be
  answered at all.
- `SearchQueryInitiated` requires enabling on the mailbox, and the default Audit (Premium)
  retention policy keeps Exchange, SharePoint and Entra records for **one year**, with custom
  retention policies available for specific workloads, record types and users.

And one that belongs in every teardown-minded engineer's memory: unified audit log ingestion can
be turned **off** tenant-wide with `Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled
$false`. If audit search returns nothing for everything, check that before anything else -
including whether an attacker ran it.

**How this connects to Sentinel:** audit data reaches the workspace through connectors -
`OfficeActivity`, `AuditLogs`, `CloudAppEvents` - so the same events are queryable in KQL
alongside everything else. Audit search in the Defender portal is the investigative surface;
Sentinel is the correlation and detection surface. Knowing which to reach for is the practical
skill.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| Automation rule order | creation order | Deliberate - suppression before enrichment | Rules run in order |
| Suppression rules | none | With an **expiration date** | Otherwise noise suppression becomes permanent and invisible |
| Sentinel Automation Contributor | not granted | Granted on the playbook's resource group | Sentinel cannot run playbooks without it |
| Playbook identity | connection | Managed identity, least privilege | The playbook is a privileged object |
| Interactive retention | workspace default | Long for detection tables, short for verbose ones | Per-table configuration is the cost lever |
| Total retention | equals interactive | Longer, in archive or the data lake | Keeping is cheap; querying is not |
| Audit log search | on | Confirm it is on | Can be disabled tenant-wide |
| Audit (Premium) licences | not assigned | Assigned to users whose activity you would need to reconstruct | Per-user; no licence, no high-value events |
| `SearchQueryInitiated` | off | Enabled on relevant mailboxes | Needs mailbox-level configuration |
| Audit retention policies | one-year default with Premium | Per workload and record type as required | Standard cannot be extended |

## Common failure modes

**A playbook that never runs.** Sentinel lacks Automation Contributor on the playbook's resource
group. The rule looks correct and does nothing.

**Trigger mismatch.** An incident-trigger playbook attached to an alert-created rule.

**Automation rule ordering ignored.** An enrichment rule runs after a closing rule, so the
enrichment never happens.

**Suppression without an expiry.** A year later, a real detection is being closed automatically
and nobody knows why.

**Playbook over-permissioned.** Given Global Administrator "so it works," it becomes the most
privileged object in the tenant, invokable by a rule.

**Retention set once at the workspace and never per table.** Either you pay interactive prices
for verbose telemetry, or you lose detection data early. Per-table configuration avoids both.

**Archive treated as queryable.** It is not. A search job or restore is required, both take time
and both cost money.

**Discovering at incident time that the compromised user had no Audit (Premium) licence.** You
can establish that the mailbox was accessed and not which messages were exposed.

**Assuming 90-day audit retention.** The Standard default is 180 days for records generated on
or after 17 October 2023.

**Audit search returning nothing and being read as "no activity."** Check that unified audit log
ingestion is enabled.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "automatically assign and tag new incidents" | Automation rule |
| "post to Teams / create a ticket / disable an account" | Playbook, called by an automation rule |
| "close known-benign incidents for 30 days" | Suppression with an expiration date |
| "playbook does not run" | Microsoft Sentinel Automation Contributor on the playbook's resource group |
| "keep data two years, query the last 90 days" | Interactive retention short, total retention long |
| "query data past interactive retention" | Search job, or restore |
| "different retention per data type" | Table-level retention |
| "which emails did the attacker read" | **MailItemsAccessed**, Audit (Premium) |
| "what did they search for in the mailbox" | `SearchQueryInitiated`, Audit (Premium) |
| "audit records for one year" | Audit (Premium) |
| "ten-year retention" | Audit (Premium) plus the add-on |
| "only some users produce these events" | Audit (Premium) is per-user |
| "audit search returns nothing at all" | Unified audit log ingestion disabled |

**AZ-500 divergence.** Audit search lives in the Defender portal alongside Sentinel rather than
in a separate compliance portal, and the Audit (Standard) retention default moved from 90 to 180
days. Sentinel's retention model has also gained the cheaper tiers and the data lake, so "set
retention on the workspace" is no longer the whole answer.

## Hands-on

See [04-04 lab](../../labs/04-security-posture/04-04-lab.md).

## Check yourself

1. An automation rule is configured to run a playbook on incident creation. Incidents are
   created and the playbook never runs, with no error in the rule. Give the most likely cause
   and where you would look.
2. Distinguish an automation rule from a playbook by describing one task that only a rule can do
   and one that only a playbook can do.
3. Your workspace has 90-day interactive retention and two-year total retention. An investigation
   needs data from 14 months ago. Describe exactly what you do, what it costs you, and how long
   it takes.
4. An account is compromised. You need to know which emails were accessed. Describe what you can
   determine if the user held an Audit (Premium) licence, and what you can determine if they did
   not.
5. A suppression rule was created 18 months ago with no expiry. Describe the failure mode, how
   you would detect it, and what you would change.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Search the audit log: <https://learn.microsoft.com/purview/audit-search>
- Microsoft Purview Audit (Premium): <https://learn.microsoft.com/purview/audit-premium>
- Reduce costs for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/billing-reduce-costs>
- Best practices for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/best-practices>
