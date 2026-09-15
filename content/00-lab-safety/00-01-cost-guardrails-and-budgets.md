---
objective: "(Project prerequisite - not an SC-500 exam objective)"
sub_objectives: []
domain: "Lab Safety and Environment Setup"
domain_weight: "n/a"
status: GA
prerequisites: ["00-00"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets"
  - "https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups"
  - "https://learn.microsoft.com/en-us/powershell/module/az.billing/new-azconsumptionbudget"
  - "https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data"
last_verified: "2026-09-15"
portal: "Cost Management + Billing > Budgets; Monitor > Alerts > Action groups"
powershell_module: "Az.Billing, Az.Monitor, Az.Security"
az_cli_command: "az consumption budget create"
kql_tables: []
licensing: "None. Cost Management is free for Azure resource usage."
azure_resources: ["Microsoft.Consumption/budgets", "microsoft.insights/actionGroups", "Microsoft.Automation/automationAccounts"]
lab_cost_estimate: "$0 - budgets, action groups, and an Automation account free tier cost nothing"
free_practice_available: true
forensic_relevance: "Cost anomalies are a detection signal. Cryptomining after a subscription compromise shows up in Cost Management hours before it shows up anywhere else if nobody is watching compute metrics."
---

# Cost Guardrails and Budget Alerts

> **Objective:** (Project prerequisite - not an SC-500 exam objective)
> **Run this before creating any billable resource.**

## Why this exists

Azure pay-as-you-go has **no spending cap**. There is no setting anywhere that
says "stop at $200." The only subscription type with a hard cap is a free trial
or a credit-based offer such as Visual Studio benefits, and those stop by
disabling the subscription entirely, which is not a control you designed.

So the guardrail has to be something you build. And the first thing to
internalise is the part most people get wrong:

> **A budget is a notification. It does not spend-limit anything.**

You can set a $50 budget, spend $900, and Azure will email you about it the
whole way down. The budget object has no enforcement semantics. It has a
threshold and a list of people to tell.

That single fact drives the entire design of this module.

## How it works under the hood

Three separate things are involved, and they are often conflated:

**1. The cost pipeline.** Azure meters emit usage records. Those records are
rated and aggregated into the cost data that Cost Management queries. This is
not real time. Usage data typically appears within hours, and there is
additional lag before a budget evaluation runs against it. Microsoft documents
the latency in
[Understand Cost Management data](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data).

The consequence matters more than the number: **by the time a budget alert
fires, the money is already spent.** An hourly resource left running Friday
night can burn through a weekend before the first notification lands.

**2. The budget.** A `Microsoft.Consumption/budgets` object scoped to a
subscription, resource group, or management group. It has an amount, a time
grain (monthly, quarterly, annual), and one or more notifications. Each
notification has:

- a **threshold**, expressed as a whole-number percentage of the amount
- a **threshold type**: `Actual` (cost already incurred) or `Forecasted`
  (Azure's projection of where the period will land)
- **contactEmails**, **contactRoles**, and **contactGroups** (action group
  resource IDs)

Forecasted alerts are the useful ones for a lab. Actual-at-90% tells you the
month is nearly gone. Forecasted-at-90% tells you on day 4 that your current
run rate will blow the month, which is when you can still do something.

**3. The action group.** An `microsoft.insights/actionGroups` resource. This is
the only part that can *do* anything. An action group holds receivers: email,
SMS, push, and — the ones that matter here — **webhook, Azure Function,
Logic App, and Automation runbook**. A budget notification with a
`contactGroups` entry fires the action group, and the action group runs your
code.

That chain is the whole trick:

```
meters → cost pipeline → budget threshold → action group → runbook → Set-AzSecurityPricing -PricingTier Free
         (hours of lag)   (notification)    (the only part that acts)
```

## Configuration surface

| Setting | Default | What to use for this lab | Why |
| --- | --- | --- | --- |
| Scope | — | Subscription | Resource-group-scoped budgets behave inconsistently outside Enterprise Agreements. Subscription scope is reliable. |
| Amount | — | Your real monthly ceiling | Not aspirational. The number that would actually hurt. |
| Time grain | Monthly | Monthly | Aligns to the billing period. |
| Threshold type | Actual | **One Forecasted + two Actual** | Forecasted at 80% is your warning. Actual at 100% is your brake. |
| Notification thresholds | — | 80 forecasted, 90 actual, 100 actual | Whole numbers. See the gotcha below. |
| contactGroups | empty | Your action group resource ID | Without this, the budget can only email. |
| Start date | — | First day of the current month | Monthly budgets reject mid-month start dates. |

### Recommended three-notification layout

| Key | Type | Threshold | Action |
| --- | --- | --- | --- |
| `warn-forecast-80` | Forecasted | 80 | Email only. "Your run rate is wrong." |
| `warn-actual-90` | Actual | 90 | Email + push. "Finish and tear down today." |
| `brake-actual-100` | Actual | 100 | Action group → runbook that disables every Defender plan and stops every lab VM. |

## Common failure modes

**The threshold is a percentage, written as a whole number.** `-NotificationThreshold 90`
means 90%. Some published samples pass `0.8` intending 80%; that is read as
0.8%, which fires on the first cent of spend and trains you to ignore the alert.
The underlying API defines the value as a percentage between 0 and 1000.

**A budget alone does nothing.** Covered above, but it is worth repeating
because the portal experience actively encourages the mistake: the budget
creation wizard's default is an email recipient, and it looks finished.

**Deleting the resource group does not stop Defender plans.** Defender for
Cloud workload protection plans are enabled at **subscription** scope. Delete
every resource in the subscription and a plan stays on, ready to bill the moment
you create a new resource of that type. This is the single most common surprise
bill in a security lab, and it is why the brake script targets pricing tiers
rather than resources.

**Forecasted alerts need history.** In a brand new subscription there is not
enough data for a forecast, so the forecasted notification stays quiet for the
first days. Do not read silence as safety in week one.

**Budget scope is not RBAC scope.** A subscription budget covers everything in
the subscription, including resources created by someone else's automation. A
management-group budget covers child subscriptions. Pick the scope that matches
what you are actually afraid of.

## The emergency brake

This is the part worth building properly, because it is the only component with
teeth. Two layers:

**Layer 1 — the runbook.** An Azure Automation account (free tier covers the
minutes you need) running a PowerShell runbook under a system-assigned managed
identity holding Contributor on the subscription. The runbook:

1. Reads every Defender for Cloud pricing tier and sets any `Standard` to `Free`.
2. Deallocates every VM tagged `sc500-module`.
3. Writes what it did somewhere you will see.

**Layer 2 — you.** The runbook is the backstop for the case where you forgot.
Teardown discipline is the actual control, because of the cost pipeline latency
described above. A brake that fires six hours late has already let the spend
happen.

The runbook body is in
[`scripts/00-lab-safety/Disable-LabDefenderPlans.ps1`](../../scripts/00-lab-safety/Disable-LabDefenderPlans.ps1).

## The expensive objectives, named

You will meet these later. Plan for them now.

| Module | Service | Billing behaviour |
| --- | --- | --- |
| 04-05 | Security Copilot | Provisioned Security Compute Units bill **hourly while provisioned**, used or not. Highest spend risk in the guide by a wide margin. Provision, work, deprovision in one sitting. |
| 02-04 | Azure Firewall | Hourly deployment charge plus per-GB data processing, independent of whether traffic flows. |
| 03-04 | Azure Bastion | Hourly per host. Also Defender for Servers Plan 2, which is per-server per-hour. |
| 03-05 | AKS | The control plane may be free on the tier you pick; **the node pool VMs are not**. |
| 02-03 | Virtual WAN hub, VPN Gateway | Both bill hourly from the moment they finish provisioning. |
| 04-03 | Sentinel ingestion | Per GB ingested. A misconfigured syslog or WEF collector can ingest far more than you intended. Set a daily cap. |

## Hands-on

See [00-01 lab](../../labs/00-lab-safety/00-01-lab.md).

## Check yourself

1. Your $100 monthly budget is at 100% actual and you have received the alert.
   How much more can Azure charge you this month?
2. You delete every resource group in the subscription. Which costs can still
   accrue, and from which scope?
3. Why is `Forecasted` more useful than `Actual` for a lab, and what makes it
   unreliable in the first week?
4. A colleague sets `-NotificationThreshold 0.9` expecting an alert at 90%. What
   actually happens?
5. The brake runbook needs to disable Defender plans. What identity should it
   run as, what role does that identity need, and at what scope?

## Sources

- Tutorial: Create and manage Azure budgets: <https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets>
- Action groups: <https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups>
- Understand Cost Management data (latency): <https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data>
- `New-AzConsumptionBudget`: <https://learn.microsoft.com/en-us/powershell/module/az.billing/new-azconsumptionbudget>
- `Set-AzSecurityPricing`: <https://learn.microsoft.com/en-us/powershell/module/az.security/set-azsecuritypricing>
