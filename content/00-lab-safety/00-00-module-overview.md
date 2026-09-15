---
objective: "(Project prerequisite - not an SC-500 exam objective)"
sub_objectives: []
domain: "Lab Safety and Environment Setup"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access"
  - "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview"
last_verified: "2026-09-15"
portal: "Azure portal > Subscriptions; Microsoft Entra admin center"
powershell_module: "Az.Accounts, Microsoft.Graph.Authentication"
az_cli_command: "az account show"
kql_tables: []
licensing: "Microsoft Entra ID P2 (PIM); Azure subscription with a payment method"
azure_resources: []
lab_cost_estimate: "$0"
free_practice_available: true
forensic_relevance: "Lab tenant hygiene determines whether your own audit log is readable later. A tenant full of orphaned test objects produces noise that looks exactly like the anomalies you are trying to learn to spot."
---

# Module 0 Overview: Lab Topology and Conventions

> **Read this before you create a single resource.**

## Why this module exists first

Everything else in this guide creates billable Azure resources or privileged
Microsoft Entra objects. Two failure modes wreck a self-funded lab, and both are
silent:

1. **Spend you didn't notice.** Several SC-500 objectives ride on services that
   bill by the hour for *existing*, not *used*. Azure Firewall, Azure Bastion,
   an AKS node pool, a Virtual WAN hub, and Security Copilot compute units all
   charge you while you sleep. A forgotten Azure Firewall costs more over a
   quiet weekend than most people expect to spend on the entire certification.
2. **Privilege you left behind.** A lab that grants Owner at subscription scope
   and never revokes it is not a lab, it's a permanent misconfiguration you
   built yourself. Worse, it teaches your hands the opposite of what the exam
   tests.

Module 0 is the control plane for both. It is not exam content. It is what makes
the exam content survivable.

## The mental model: blast radius and time

Every lab in this guide is designed around two questions:

- **What is the blast radius of this change?** A resource group is disposable.
  A subscription-scope Azure Policy assignment is not. An Entra ID conditional
  access policy applies to your entire tenant including the account you are
  signed in with.
- **How long does it persist?** A VM stops when you stop it. A Defender plan
  keeps billing at subscription scope long after the resource group is gone.
  A Key Vault with purge protection enabled cannot be fully deleted for 90 days
  and the setting cannot be turned off.

Scope and persistence, not the portal blade, are what determine whether a lab is
safe. The teardown checklist in
[00-03](./00-03-teardown-checklist-template.md) is organised the same way.

## Lab topology

```
Microsoft Entra tenant  (sc500lab.onmicrosoft.com)
│
├── break-glass-01@…          Permanent Global Administrator
│                             Excluded from all CA policies. Password offline.
│                             Never used for lab work. Never signs in except
│                             to recover the tenant.
│
├── break-glass-02@…          Second emergency account, different auth method
│
├── you@…                     Your working account.
│                             NO standing privileged roles.
│                             PIM-ELIGIBLE for the roles each lab needs.
│                             This is the account you use all the way through.
│
└── sp-sc500-automation       Optional. Service principal for scripted teardown
                              so a scheduled brake does not depend on your
                              interactive session.

Azure subscription
│
├── rg-sc500-core             Long-lived. Survives teardown.
│   ├── ag-sc500-budget-brake      Action group
│   ├── law-sc500                  Log Analytics workspace (created in 04-02)
│   └── kv-sc500-core              Key vault, purge protection OFF
│
├── rg-sc500-lab-01-01        One resource group per lab. Disposable.
├── rg-sc500-lab-02-04        Created at lab start, deleted at teardown.
└── rg-sc500-lab-…
```

Two emergency access accounts is Microsoft's own guidance, not a lab
convention: it is how you avoid locking yourself out of your own tenant with a
conditional access policy you wrote in module 01-01. You will write such a
policy. Set these up first.

## Naming convention

| Thing | Pattern | Example |
| --- | --- | --- |
| Lab resource group | `rg-sc500-lab-<moduleId>` | `rg-sc500-lab-02-04` |
| Long-lived resource group | `rg-sc500-core` | — |
| Resource | `<abbrev>-sc500-<moduleId>-<n>` | `vm-sc500-03-04-1` |
| Entra object | `sc500-<moduleId>-<purpose>` | `sc500-01-01-app-reg` |
| Policy assignment | `sc500-<moduleId>-<policy>` | `sc500-01-03-require-https` |
| Tag on every lab resource | `sc500-module = <moduleId>` | `sc500-module = 02-04` |

The tag is what makes an orphan hunt possible later. Resource group names cover
resources; the tag covers the ones that end up somewhere unexpected.

```powershell
# Find anything you created that is no longer in a lab resource group
Get-AzResource -TagName 'sc500-module' |
    Where-Object ResourceGroupName -notlike 'rg-sc500-lab-*' |
    Select-Object Name, ResourceType, ResourceGroupName, @{n='Module';e={$_.Tags['sc500-module']}}
```

## The one thing Global Administrator does not give you

A brand new tenant admin usually trips over this in the first hour: **Global
Administrator is an Entra ID role and grants no access to Azure resources.**
The two are separate authorization systems. Global Admin controls the
directory; Azure RBAC controls subscriptions and everything in them.

If your subscription was created under a different account, you can grant
yourself access from the directory side with the "Access management for Azure
resources" elevation, which temporarily gives your Global Admin account User
Access Administrator at root scope (`/`):

```powershell
# Portal: Entra admin center > Roles & admins > (your account) > toggle
# "Access management for Azure resources" to Yes, then sign out and back in.

# Verify what you actually hold at subscription scope
Get-AzRoleAssignment -SignInName (Get-AzContext).Account.Id |
    Select-Object RoleDefinitionName, Scope
```

Turn the elevation off again once you have granted yourself a normal Azure role.
It is root-scope access; leaving it on is exactly the kind of overprivileged
assignment objective 01-03 asks you to find and remediate.

## Order of operations

Do these in order. Each one depends on the one before it.

1. Create the two emergency access accounts and store their credentials
   outside the tenant.
2. **[00-01 - Cost guardrails](./00-01-cost-guardrails-and-budgets.md).**
   Budget, action group, and the emergency brake script. Before any billable
   resource exists.
3. **[00-02 - PIM just-in-time access](./00-02-pim-just-in-time-lab-access.md).**
   Strip standing roles from your working account, make it eligible instead.
   This is also hands-on practice for the first bullet of objective 01-01.
4. **[00-03 - Teardown checklist](./00-03-teardown-checklist-template.md).**
   Read it now so you recognise the pattern when every later lab ends with it.

Only then start Domain 1.

## Check yourself

1. You delete `rg-sc500-lab-03-04` after a Defender for Servers lab. Name three
   things that keep costing money or keep granting access.
2. Why does a budget alert not prevent overspend? What is the minimum you have
   to add to make it actually stop something?
3. Your conditional access policy in 01-01 requires a compliant device. You have
   no compliant devices. Which account gets you back in, and what did you have
   to do beforehand for it to work?
4. You hold Global Administrator. `Get-AzResource` returns nothing. What is
   wrong, and what are the two different ways to fix it?

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Manage emergency access accounts in Microsoft Entra ID: <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-emergency-access>
- Elevate access to manage all Azure subscriptions and management groups: <https://learn.microsoft.com/en-us/azure/role-based-access-control/elevate-access-global-admin>
