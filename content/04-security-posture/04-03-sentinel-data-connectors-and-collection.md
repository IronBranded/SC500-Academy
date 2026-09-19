---
objective: "Implement activity and event collection in Microsoft Sentinel"
sub_objectives:
  - "Configure and use Microsoft data connectors for Azure resources"
  - "Implement and configure syslog and Common Event Format (CEF) event collections"
  - "Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)"
  - "Create custom log tables in the workspace to store ingested data"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "03-04", "04-02"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/sentinel/cef-syslog-ama-overview"
  - "https://learn.microsoft.com/azure/sentinel/best-practices"
  - "https://learn.microsoft.com/azure/sentinel/billing-reduce-costs"
last_verified: "2026-09-17"
portal: "Microsoft Defender portal > Sentinel > Data connectors; Azure Monitor > Data collection rules"
powershell_module: "Az.Monitor, Az.SecurityInsights, Az.OperationalInsights"
az_cli_command: "az monitor data-collection rule create"
kql_tables:
  - "Syslog"
  - "CommonSecurityLog"
  - "SecurityEvent"
  - "AzureActivity"
  - "Usage"
  - "Custom_CL"
licensing: "Sentinel ingestion-based. Some sources are free, most are not - check before connecting."
azure_resources: ["Microsoft.Insights/dataCollectionRules", "Microsoft.Insights/dataCollectionEndpoints"]
lab_cost_estimate: "Medium - ingestion is the cost driver and this is the module where it can run away. Cap the workspace with a daily quota before enabling any connector."
free_practice_available: false
forensic_relevance: "Collection design decides what an investigation can ever answer. A DCR that filters Windows Security events down to a minimal set to save money also removes the event IDs that reconstruct a logon chain, and the decision is invisible afterwards - the table simply has no rows. The same applies to transformations, which drop or reshape data before it is ever stored. What you chose not to collect is not recoverable later, which makes these decisions unlike almost every other setting in this guide."
---

# Sentinel Data Connectors and Event Collection

> **Objective:** Implement activity and event collection in Microsoft Sentinel
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Configure and use Microsoft data connectors for Azure resources
- Implement and configure syslog and Common Event Format (CEF) event collections
- Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)
- Create custom log tables in the workspace to store ingested data

## Why this exists

Every previous module produced signal. This one decides which of it you keep.

That framing matters because collection decisions are **asymmetric in a way almost nothing else
in this guide is**. Turn off a Defender plan and you can turn it back on. Get a firewall rule
wrong and you fix it. But data you chose not to collect on Tuesday does not exist on Friday,
and no amount of budget or privilege recovers it. The table is simply empty, and nothing about
the query result tells you whether that means "nothing happened" or "we never collected this."

Against that sits the constraint from 04-02: you pay by the gigabyte, and the highest-volume
sources are frequently the lowest-value ones. Full Windows Security event collection from a
few hundred servers will dwarf everything else in the workspace and consist mostly of events
nobody will ever query.

So this objective is one engineering problem stated four ways: **collect what an investigation
will actually need, filter as early as possible, and know which of the two failure modes you
are risking.**

## How it works under the hood

### One agent, and the shape of modern collection

The Log Analytics agent (MMA) is retired. Everything agent-based now runs on the **Azure
Monitor Agent (AMA)**, and AMA is configured entirely by **data collection rules**.

The pipeline is the same for every source:

```
  source → AMA (or a direct API) → DCR → [transformation] → table in the workspace
                                    │                          │
                          what to collect,            Analytics / Basic /
                          filters applied              Auxiliary tier
                          BEFORE ingestion
```

Two properties of that diagram do most of the work:

- **Filtering happens in the DCR, before ingestion.** Data filtered out is never billed. This
  is the difference between an affordable Sentinel and an unaffordable one.
- **A DCR is a resource, associated with machines.** Change the DCR and collection changes
  everywhere it is associated - which is the good and the dangerous property at once.

**Data collection endpoints (DCEs)** provide the ingestion endpoint some scenarios require -
custom logs and certain network configurations in particular.

### Microsoft connectors for Azure resources

The straightforward half. Azure Activity, Microsoft Entra ID logs, Defender XDR, Azure
resource diagnostics - all connect through the Content hub solution's connector page with no
agent involved.

Three things worth carrying:

- **Check what is free.** A subset of sources carry no ingestion charge. Most do. Check before
  connecting rather than after.
- **The Defender XDR connector supersedes the individual product connectors.** Enabling both
  ingests the same data twice, bills twice, and returns duplicate rows - the point made in
  04-02 and the most common avoidable Sentinel cost.
- **Azure resource logs arrive through diagnostic settings**, which is the mechanism you met in
  02-02 with SQL audit and again with Azure Firewall in 02-04. Sentinel does not collect them;
  the resource sends them.

### Syslog and CEF

The **Syslog via AMA** and **Common Event Format (CEF) via AMA** connectors ingest messages
from Linux machines and from network and security appliances. They install the Azure Monitor
Agent on **any Linux machine** - which may be the originator of the messages, or a **forwarder**
collecting from other devices that cannot run an agent themselves. A firewall, a switch, and an
appliance all speak syslog and none of them will ever run AMA; the forwarder pattern is how
they reach Sentinel.

The connector sends the agent instructions based on **DCRs you define**, specifying which
systems to monitor, which facilities and severities to collect, and **filters applied before
ingestion**.

Two facts and two tables:

| | Format | Lands in |
| --- | --- | --- |
| **Syslog** | RFC 3164 (BSD) and RFC 5424 (IETF), over UDP, TCP or TLS | `Syslog` |
| **CEF** | A structured, key-value extension of syslog used by security vendors | `CommonSecurityLog` |

CEF is the richer of the two because it is structured - vendor, product, event class, and
named fields - which is why security appliances use it and why `CommonSecurityLog` is worth
parsing properly.

The facility and severity filters in the DCR are the cost control here. Collecting every
facility at every severity from a busy forwarder is one of the two ways to exhaust a budget
overnight.

### Windows Security events, and WEF

The **Windows Security Events via AMA** connector collects the Security log, and the DCR offers
**predefined event sets** plus custom filtering:

| Set | What it collects |
| --- | --- |
| **All events** | Everything in the Security log. Enormous |
| **Common** | A standard subset covering most detection needs |
| **Minimal** | A small set for the highest-value events only |
| **Custom** | Your own **XPath** queries against the event log |

**Custom XPath filtering is the exam-relevant option** because it is how you express "collect
these specific event IDs and nothing else." It is also where the asymmetry bites: filter to
save money and you may remove the event IDs that reconstruct a logon chain, and nobody
discovers that until the investigation.

**Windows Event Forwarding** is the other half. Rather than putting an agent on every endpoint,
Windows machines forward events to a **collector** using WEF, and the events land in the
collector's **ForwardedEvents** channel. AMA on the collector then ships them. The design
argument is the same as the syslog forwarder: one machine carries the agent, many machines
contribute events, and the endpoints need no Azure connectivity.

Note that WEF collection is configured as its own connector and channel rather than as part of
the Security log connector - collecting both without thinking gives you the same events twice.

### Custom log tables

For anything without a connector - a line-of-business application, an appliance with a text
log, an API - you create a **custom table**.

The current mechanism is DCR-based: define the table and its schema, define a DCR (with a data
collection endpoint) that describes the incoming format, and send data either with AMA reading
a text file or by posting to the **Logs Ingestion API**. Custom table names carry the **`_CL`**
suffix.

**Transformations** are the capability worth understanding. A DCR can carry a KQL
transformation applied **at ingestion time**: drop columns you do not need, filter rows below a
threshold, normalise a field, or split one stream into two tables. The data is reshaped before
it is stored, so you pay for what you keep rather than what arrived - and, symmetrically, what
the transformation drops is gone.

**Table plans** decide cost and capability, and the exam tests the trade-off:

| Plan | Query | Typical use |
| --- | --- | --- |
| **Analytics** | Full KQL, full speed, available to analytics rules | Detection-relevant data |
| **Basic / Auxiliary** | Reduced query capability, much cheaper ingestion | High-volume, low-value telemetry kept for search and compliance |
| **Long-term retention / data lake** | Archive-style access | Data kept for years for compliance |

The pattern that works: detection-grade data in Analytics, verbose supporting telemetry in the
cheaper tiers, everything else in long-term retention. The pattern that does not: everything in
Analytics because it was the default.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| Daily cap | none | **Set before the first connector** | The only hard stop on ingestion spend |
| Defender XDR connector | off | On, **and disable individual product connectors** | Otherwise double ingestion and duplicate rows |
| Syslog facilities and severities | broad | The narrowest set that supports your detections | Filtered in the DCR, never billed |
| CEF forwarder | none | One or more Linux forwarders | Appliances cannot run an agent |
| Windows Security events | none | **Common**, or custom XPath | "All events" is rarely defensible |
| WEF collection | separate connector | Only alongside, never duplicating, the Security log connector | Same events twice |
| DCR transformations | none | Drop and filter at ingestion | Pay for what you keep |
| Custom table plan | Analytics | Basic or Auxiliary for high-volume, low-value data | Large cost difference |
| Data collection endpoint | none | Where custom logs or network constraints require one | Ingestion will fail without it |

## Common failure modes

**No daily cap, and a misconfigured collector.** A forwarder pointed at the wrong facility set,
or "All events" on a fleet of Windows servers, can ingest orders of magnitude more than
intended. Cost data lags by hours, so you find out the next day.

**Filtering to save money, without checking what the detections need.** The analytics rules you
enabled in 04-02 depend on specific event IDs. Removing them makes the rules silently produce
nothing.

**"All events" chosen because it feels safer.** It is the most expensive option and it makes the
table slower to query, so it degrades investigations as well as budgets.

**Both the Security log connector and WEF collection, unreviewed.** Duplicate events, duplicate
cost, and every count in every query is wrong.

**Assuming AMA on an appliance.** Network devices do not run agents. The forwarder pattern is
mandatory, not stylistic.

**One forwarder as a single point of failure.** Everything through one VM that nobody monitors.

**Custom table created without a data collection endpoint** where one is required. Ingestion
fails quietly.

**Everything in the Analytics plan.** The most common cost mistake after over-collection.

**A transformation written and never reviewed.** It drops a field a future detection needs, and
the gap is invisible because the column simply does not exist.

**No usage monitoring.** The `Usage` table answers "what is costing me money" in one query, and
almost nobody runs it until the invoice arrives.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "network appliance cannot run an agent" | Linux forwarder with Syslog/CEF via AMA |
| "structured vendor security events" | CEF, `CommonSecurityLog` |
| "collect only these event IDs" | Custom **XPath** in the Windows Security Events DCR |
| "endpoints must not connect to Azure directly" | Windows Event Forwarding to a collector, AMA on the collector |
| "reduce cost before data is stored" | DCR filtering and transformations |
| "drop a column at ingestion" | DCR transformation |
| "high volume, rarely queried, must be retained" | Basic or Auxiliary table plan |
| "must be usable by analytics rules" | Analytics plan |
| "application with no connector" | Custom table + DCR + Logs Ingestion API |
| "avoid duplicate Defender data" | Disable individual product connectors |
| "stop runaway ingestion" | Daily cap |
| "find what is driving cost" | `Usage` table |

**AZ-500 divergence.** The Log Analytics agent is retired, so every AZ-500-era walkthrough that
installs MMA or configures collection in workspace **Agents configuration** is describing a path
that no longer exists. Collection is DCR-based on AMA, filtering moved into the DCR, and
transformations and table plans are new cost levers with no older equivalent.

## Hands-on

See [04-03 lab](../../labs/04-security-posture/04-03-lab.md).

## Check yourself

1. Your analytics rule for suspicious logons returns nothing for three weeks. The rule is
   enabled and the query is correct. Give the collection-side explanations, in the order you
   would check them.
2. A firewall vendor asks how to send logs to Sentinel. Describe the architecture, name the
   table the data lands in, and explain why the appliance itself is not the thing that gets an
   agent.
3. Compare filtering in a DCR against filtering in a KQL query at analysis time, in terms of
   cost, recoverability, and risk. When is each correct?
4. You need to keep twelve months of verbose application logs for compliance, and to run
   detections against a small subset. Describe the table and plan design.
5. An engineer enables both the Windows Security Events connector and WEF collection on the same
   collector. Describe every consequence, including for a query that counts failed logons.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Syslog and CEF via AMA connectors: <https://learn.microsoft.com/azure/sentinel/cef-syslog-ama-overview>
- Best practices for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/best-practices>
- Reduce costs for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/billing-reduce-costs>
