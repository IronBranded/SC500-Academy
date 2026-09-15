---
objective: "(Project prerequisite - not an SC-500 exam objective)"
sub_objectives: []
domain: "Lab Safety and Environment Setup"
domain_weight: "n/a"
status: GA
prerequisites: ["00-00"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview"
  - "https://learn.microsoft.com/en-us/azure/azure-monitor/logs/delete-workspace"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/enable-enhanced-security"
last_verified: "2026-09-15"
portal: "Azure portal > Resource groups; Defender for Cloud > Environment settings"
powershell_module: "Az.Resources, Az.Security, Az.KeyVault, Microsoft.Graph"
az_cli_command: "az group delete"
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: "$0"
free_practice_available: true
forensic_relevance: "Orphaned objects are indistinguishable from attacker persistence when you come back to the tenant months later. A clean teardown is what keeps your own lab from teaching you to ignore anomalies."
---

# Reusable Teardown Checklist

> Every lab in this guide ends with a `## Teardown` section that inherits from
> this template. Read it once, here, so the pattern is familiar later.

## Why deleting the resource group is not enough

The instinct is `Remove-AzResourceGroup -Force` and move on. That handles most
resources and none of the expensive or dangerous ones, because the resource
group is only one of several scopes a lab touches.

Sort everything you create into four buckets:

| Bucket | Lives at | Survives RG deletion? |
| --- | --- | --- |
| **Resources** | Resource group | No — deleted with it |
| **Subscription-scope config** | Subscription | **Yes** — Defender plans, policy assignments, role assignments, diagnostic settings |
| **Directory objects** | Entra tenant | **Yes** — app registrations, service principals, CA policies, PIM assignments, groups |
| **Soft-deleted remains** | Varies | **Yes** — key vaults, Log Analytics workspaces, recovery services items |

The checklist is organised in that order, widest blast radius last, because the
things that persist are the things that cost money or grant access.

## The traps, specifically

**Defender for Cloud plans.** Enabled per plan at **subscription** scope. Delete
every resource and the plan stays `Standard`, billing again the moment a matching
resource appears. Check with `Get-AzSecurityPricing`, not by looking at the
resource group.

**Key Vault soft delete and purge protection.** Soft delete is on by default and
cannot be turned off. A deleted vault is recoverable for the retention period
(7–90 days, default 90) and **its name stays reserved for that whole period** —
so re-running a lab with the same vault name fails until you purge it. Worse,
**purge protection cannot be disabled once enabled**, on the vault or the
subscription. If you turn it on in a lab, that vault name is unusable for the
retention period with no override. Leave purge protection off in labs unless the
lab is specifically about purge protection.

```powershell
Get-AzKeyVault -InRemovedState
Remove-AzKeyVault -VaultName 'kv-sc500-01-02' -Location 'canadacentral' -InRemovedState -Force
```

**Log Analytics workspaces.** Soft-deleted for 14 days after deletion. Creating a
workspace with the same name in the same resource group and region during that
window *recovers the old one*, data and all, rather than creating a fresh one.
Convenient when intentional, confusing when not.

**Microsoft Sentinel.** Removing Sentinel from a workspace does not delete the
workspace, and the workspace keeps charging for retained data. Two separate
teardown steps.

**Azure Policy assignments.** Usually scoped to the subscription or a management
group, not the resource group. They keep evaluating and can block later labs
with denials you have forgotten the source of.

**Role assignments.** Deleting a resource leaves role assignments that reference
it as orphaned entries showing an unresolved principal or scope. Clean them; they
are also the exact artefact objective 01-03 asks you to find and remediate.

**Entra app registrations and service principals.** Never in a resource group.
Each one is a credential-bearing identity you created. Consent grants persist too.

**Conditional access policies.** Tenant-wide, instantly effective, and able to
lock you out. Disable before delete so there is a moment to verify nothing broke.

**Diagnostic settings.** Attached to resources but reference a destination. Some
survive as configuration on subscription-level activity log settings.

**Defender EASM.** Bills per discovered asset and lives as its own resource with
its own inventory.

## The template

Copy this into any new lab file. Delete the lines that do not apply; keep the
section headings so the shape is consistent across every lab.

```markdown
## Teardown

**Mandatory.** Run before closing the session.

### 1. Resources
- [ ] Delete the lab resource group `rg-sc500-lab-<moduleId>`
- [ ] Confirm no tagged resources remain outside it

### 2. Subscription scope
- [ ] Set any Defender plan enabled for this lab back to `Free`
- [ ] Remove Azure Policy assignments created by this lab
- [ ] Remove role assignments created by this lab
- [ ] Remove subscription-level diagnostic settings created by this lab

### 3. Directory scope
- [ ] Delete app registrations / service principals created by this lab
- [ ] Revoke OAuth consent grants created by this lab
- [ ] Disable, verify, then delete conditional access policies created by this lab
- [ ] Delete groups created by this lab

### 4. Soft-deleted remains
- [ ] Purge soft-deleted key vaults (if the name is needed again)
- [ ] Note any soft-deleted Log Analytics workspace and its 14-day window

### 5. Access
- [ ] Deactivate the PIM roles activated for this lab

### 6. Verify
- [ ] `Get-AzResource -TagName 'sc500-module'` returns nothing for this module
- [ ] `Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard'` is empty
      (or matches only plans you intend to keep)
- [ ] Cost Management shows no new daily run rate tomorrow
```

## The verification sweep

Run this at the end of any study session, regardless of which labs you did.
Teardown you believe you did and teardown you verified are different things.

```powershell
# 1. Anything tagged but homeless
Get-AzResource -TagName 'sc500-module' |
    Where-Object ResourceGroupName -notlike 'rg-sc500-lab-*' |
    Format-Table Name, ResourceType, ResourceGroupName

# 2. Defender plans still on
Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard' |
    Format-Table Name, PricingTier, SubPlan

# 3. Lab resource groups still standing
Get-AzResourceGroup -Name 'rg-sc500-lab-*' | Format-Table ResourceGroupName, Location

# 4. Key vaults in the graveyard holding a name hostage
Get-AzKeyVault -InRemovedState | Format-Table VaultName, Location, DeletionDate, PurgeProtectionEnabled

# 5. Policy assignments below management group scope
Get-AzPolicyAssignment -Scope "/subscriptions/$((Get-AzContext).Subscription.Id)" |
    Where-Object { $_.Name -like 'sc500-*' } | Format-Table Name, Scope

# 6. Roles you are still holding active
Get-MgRoleManagementDirectoryRoleAssignmentSchedule `
    -Filter "principalId eq '$((Get-MgContext).Account)'" -ExpandProperty RoleDefinition |
    Where-Object AssignmentType -eq 'Activated' |
    Select-Object @{n='Role';e={$_.RoleDefinition.DisplayName}}, EndDateTime
```

Scripted version:
[`scripts/teardown/Remove-LabResourceGroup.ps1`](../../scripts/teardown/Remove-LabResourceGroup.ps1).

## The weekly habit

Teardown per lab handles the lab. Once a week, run the sweep above against the
whole subscription and reconcile against Cost Management's daily view. Anything
you cannot account for is either an orphan you missed or something you did not
create, and both are worth knowing about.

## Check yourself

1. You ran `Remove-AzResourceGroup` on a lab that used Defender for Storage and
   a key vault. Name everything still present and where it lives.
2. Why does re-running a key vault lab with the same name fail a week later?
3. You enabled purge protection during a lab because it sounded like good
   practice. What is your recovery path?
4. A conditional access policy from a previous lab is blocking a current one.
   Why is disabling it a better first step than deleting it?
5. Which items in the verification sweep would a resource-group-scoped teardown
   never catch?

## Sources

- Azure Key Vault soft-delete overview: <https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview>
- Delete and recover an Azure Monitor Log Analytics workspace: <https://learn.microsoft.com/en-us/azure/azure-monitor/logs/delete-workspace>
- Enable Defender for Cloud plans: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/enable-enhanced-security>
