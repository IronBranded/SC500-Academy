---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/powershell/azure/"
  - "https://learn.microsoft.com/powershell/microsoftgraph/"
last_verified: "2026-09-17"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "Almost every teardown verification in this guide is a PowerShell query rather than a portal click, because a query returns a list you can diff and a blade returns a view you have to remember. The same habit is what makes an environment auditable later."
---

# PowerShell and Microsoft Graph Module Reference

> **What this is.** Every module, cmdlet family, and Graph scope used across the 22 labs, in one
> place - plus the cmdlets this guide has flagged as version-sensitive, so you check `-Syntax`
> before wasting a lab session.
>
> **The exam does not test cmdlet syntax.** It tests which tool does what. This reference exists
> so the lab work does not stall, not because you need to memorise parameter names.

## 1. Install once

```powershell
# Azure - the full Az module is large; install what you need or take the lot
Install-Module Az -Scope CurrentUser -Repository PSGallery

# Microsoft Graph
Install-Module Microsoft.Graph -Scope CurrentUser

# Microsoft 365 workloads
Install-Module ExchangeOnlineManagement          -Scope CurrentUser
Install-Module Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
Install-Module PnP.PowerShell                    -Scope CurrentUser
Install-Module SqlServer                         -Scope CurrentUser   # Invoke-Sqlcmd

# Azure CLI is used directly in 03-05 - AKS is a CLI-first service
# az aks install-cli   provides kubectl
```

```powershell
Connect-AzAccount
Get-AzContext | Format-List Name, Subscription, Tenant
Set-AzContext -Subscription '<subscription-id>'     # half of all lab mistakes are the wrong context
```

## 2. Module by module

| Az module | Used for | Modules |
| --- | --- | --- |
| `Az.Accounts` | Context, authentication | all |
| `Az.Resources` | Resource groups, role assignments, role definitions, policy assignments and definitions, locks | 01-01, 01-03, all teardowns |
| `Az.Security` | Defender for Cloud plans, pricing tiers | 01-02 onward, every teardown |
| `Az.PolicyInsights` | Compliance state, remediation tasks | 01-03 |
| `Az.KeyVault` | Vaults, secrets, keys, certificates, network rules | 01-02 |
| `Az.Storage` | Storage accounts, network rules, SAS, stored access policies, blob service properties | 02-01 |
| `Az.Sql` | Logical servers, databases, firewall rules, Entra admin, auditing, ATP | 02-02 |
| `Az.Network` | VNets, NSGs, ASGs, route tables, private endpoints, private DNS, firewall policies, app gateways, Virtual Network Manager | 02-03, 02-04, 03-06 |
| `Az.Compute` | VMs, disks, extensions, security profile | 02-03, 03-04, 04-01 |
| `Az.ConnectedMachine` | Azure Arc-enabled servers | 03-04 |
| `Az.ManagedServiceIdentity` | User-assigned managed identities | 01-01 |
| `Az.Aks` | AKS (CLI preferred - see the note below) | 03-05 |
| `Az.ContainerRegistry` | ACR | 03-05 |
| `Az.Websites` / `Az.Functions` | App Service, Function Apps, access restrictions | 03-06 |
| `Az.ApiManagement` | API Management service, APIs, policies | 03-03, 03-06 |
| `Az.CognitiveServices` | Microsoft Foundry / AI Services accounts | 03-03 |
| `Az.Monitor` | Diagnostic settings, action groups, data collection rules | 00-01, 04-03 |
| `Az.OperationalInsights` | Log Analytics workspaces, KQL queries, deleted workspaces | 02-02, 04-02, 04-03 |
| `Az.SecurityInsights` | Sentinel onboarding, analytics rules, incidents, automation rules | 04-02, 04-04 |
| `Az.LogicApp` | Playbooks | 04-04 |
| `Az.Automation` | Automation accounts, runbooks, webhooks | 00-01 |
| `Az.Billing` | Consumption budgets | 00-01 |
| `Az.RecoveryServices` | Recovery Services vaults, soft delete | 01-03 |
| `Az.DataProtection` | Resource Guards for multi-user authorization | 01-03 |

| Other module | Used for | Modules |
| --- | --- | --- |
| `Microsoft.Graph` | PIM, Conditional Access, authentication methods, app registrations, consent, Entra custom roles, agent identities | 00-02, 01-01, 01-03, 03-02 |
| `ExchangeOnlineManagement` | Unified audit log, mailbox auditing | 04-04 |
| `Microsoft.Online.SharePoint.PowerShell` | Tenant sharing settings, DAG reports, RCD, RAC | 03-01 |
| `PnP.PowerShell` | SharePoint site operations | 03-01 |
| `SqlServer` | `Invoke-Sqlcmd` with an Entra access token | 02-02 |

> **AKS is CLI-first.** `Az.Aks` lags `az aks` on newer flags, and the exam's own examples use
> the CLI. [03-05](../03-secure-compute/03-05-app-platform-containers.md) uses `az` throughout
> for that reason.

## 3. Defender for Cloud plan names

The single most reused command in this guide is `Set-AzSecurityPricing`, and the plan **name**
is the part people get wrong. Do not guess it - list it:

```powershell
Get-AzSecurityPricing | Select-Object Name, PricingTier, SubPlan | Sort-Object Name
```

| Plan area | Name as it appears | Module |
| --- | --- | --- |
| Foundational / Defender CSPM | `CloudPosture` | 01-02, 01-03, 04-01 |
| Servers (Plan 1 / Plan 2 via `-SubPlan`) | `VirtualMachines` | 03-04 |
| Storage | `StorageAccounts` | 02-01 |
| Azure SQL database servers | `SqlServers` | 02-02 |
| SQL servers on machines | `SqlServerVirtualMachines` | 02-02 |
| Open-source relational databases | `OpenSourceRelationalDatabases` | 02-02 |
| Azure Cosmos DB | `CosmosDbs` | 02-02 |
| Key Vault | `KeyVaults` | 01-02 |
| Containers | `Containers` | 03-05 |
| AI workloads | verify - the identifier has moved | 03-03 |

```powershell
# The end-of-session sweep, and the command every teardown in this guide ends with
Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard' | Select-Object Name, SubPlan
```

## 4. Microsoft Graph scopes

Scopes used across the labs. Request the narrowest set the task needs - and note that several
PIM operations require a session in which **MFA was actually performed**, not merely an
MFA-capable account.

```powershell
Connect-MgGraph -Scopes @(
    # PIM - 00-02
    'RoleManagement.ReadWrite.Directory'
    'RoleAssignmentSchedule.ReadWrite.Directory'
    'RoleEligibilitySchedule.ReadWrite.Directory'
    'RoleManagementPolicy.ReadWrite.Directory'

    # Conditional Access and authentication methods - 01-01, 03-02
    'Policy.ReadWrite.ConditionalAccess'
    'Policy.ReadWrite.AuthenticationMethod'
    'Policy.Read.All'

    # Applications and consent - 01-01
    'Application.ReadWrite.All'
    'AppRoleAssignment.ReadWrite.All'
    'DelegatedPermissionGrant.ReadWrite.All'
    'Policy.ReadWrite.Authorization'
    'Policy.ReadWrite.PermissionGrant'

    # Directory reads
    'Directory.Read.All'
    'User.Read.All'
    'Group.ReadWrite.All'
)
Get-MgContext | Format-List Account, Scopes
```

## 5. Recurring patterns

### Resolve identifiers at runtime, never hardcode GUIDs

```powershell
# Directory role template IDs by display name - 01-01
Get-AzDirectoryRoleTemplate -All | Where-Object DisplayName -in $roleNames

# Built-in authentication strengths - 01-01
Get-MgPolicyAuthenticationStrengthPolicy -All | Where-Object DisplayName -eq 'Phishing-resistant MFA'

# Microsoft Graph permission definitions - 01-01
$graphSp = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
$scope   = $graphSp.Oauth2PermissionScopes | Where-Object Value -eq 'User.Read.All'
$role    = $graphSp.AppRoles               | Where-Object Value -eq 'User.Read.All'

# Built-in Azure role definition IDs - 01-03
(Get-AzRoleDefinition -Name 'Storage Account Contributor').Id
```

The Microsoft Graph application ID `00000003-0000-0000-c000-000000000000` is the one constant
worth memorising.

### Test a VM without a session

Used in 02-03, 02-04 and 03-04 to avoid Bastion, a public IP, and an open management port:

```powershell
Invoke-AzVMRunCommand -ResourceGroupName $Rg -VMName $Vm `
    -CommandId 'RunShellScript' -ScriptString 'curl -s -o /dev/null -w "%{http_code}" https://example.com'
```

### Query a workspace from the shell

```powershell
$law = Get-AzOperationalInsightsWorkspace -ResourceGroupName 'rg-sc500-core' -Name 'law-sc500'
Invoke-AzOperationalInsightsQuery -WorkspaceId $law.CustomerId -Query 'Usage | take 10' |
    Select-Object -ExpandProperty Results | Format-Table -AutoSize
```

Note it takes the workspace's **`CustomerId`** (the workspace GUID), not its resource ID.

### Find orphaned role assignments

An orphaned assignment shows an empty `DisplayName` - the principal or scope no longer resolves.
This is generated every time a resource with a system-assigned identity is deleted, and it is
also the exact artifact objective 01-03 asks you to find and remediate.

```powershell
Get-AzRoleAssignment -Scope "/subscriptions/$SubId" |
    Where-Object { [string]::IsNullOrWhiteSpace($_.DisplayName) }
```

## 6. Version-sensitive cmdlets - check `-Syntax` first

Every item here was flagged in the lab that uses it. Check before you burn session time,
particularly in the metered labs.

| Cmdlet or area | What moves | Module |
| --- | --- | --- |
| `New-AzPolicyDefinition`, `New-AzPolicyAssignment` | Parameter shapes changed across recent Az major versions | 01-03, 04-01 |
| `Get-AzAccessToken` | Returns a **SecureString** by default in newer versions; `-AsPlainText` availability varies | 02-02 |
| `Set-AzStorageAccount -SasExpirationPeriod` | Parameter name and availability vary by `Az.Storage` version | 02-01 |
| `Update-AzPolicyAuthorizationPolicy -DefaultUserRolePermissions` | Complex type - confirm whether partial updates merge or replace | 01-01 |
| `Set-AzSqlServerAudit` | Parameter set has shifted | 02-02 |
| `*-AzNetworkManager*` | Virtual Network Manager cmdlets have changed name and shape more than once | 02-03 |
| Recovery Services **immutability** and **MUA** | Move between `Az.RecoveryServices` and `Az.DataProtection`; portal-driven in this guide | 01-03 |
| `Set-AzSecurityPricing` plan names and `-SubPlan` | Identifiers change as plans are restructured | 03-03, 03-04 |
| Foundry / Cognitive Services **model deployment** | Deployment cmdlet surface moves; portal-driven in this guide | 03-03 |
| Defender for Storage / Containers **extension** configuration | Extension syntax varies; portal-driven in this guide | 02-01, 03-05 |
| SharePoint **DAG**, **RCD**, **RAC** cmdlets | Names and parameters have changed; some capabilities are licence-gated | 03-01 |

```powershell
# The habit
Get-Command Set-AzSecurityPricing -Syntax
Get-Command -Module Az.Network *NetworkManager*
```

## 7. Teardown one-liners

Collected from every lab. The full checklist is in
[00-03](../00-lab-safety/00-03-teardown-checklist-template.md); the cost-focused version is in
[A2](./a2-licensing-and-lab-cost-matrix.md).

```powershell
# Defender plans back to Free - the most important line in this file
Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard' |
    ForEach-Object { Set-AzSecurityPricing -Name $_.Name -PricingTier 'Free' }

# Locks must come off before a resource group will delete
Get-AzResourceLock -ResourceGroupName $Rg |
    ForEach-Object { Remove-AzResourceLock -LockId $_.LockId -Force }

# Policy assignments first, THEN definitions - and before the plans, or policy re-enables them
Get-AzPolicyAssignment -Scope "/subscriptions/$SubId" | Where-Object Name -like 'sc500-*' |
    ForEach-Object { Remove-AzPolicyAssignment -Id $_.Id }

# Key vaults holding a name hostage
Get-AzKeyVault -InRemovedState | Where-Object VaultName -like '*sc500*' |
    Format-Table VaultName, Location, DeletionDate, PurgeProtectionEnabled

# Soft-deleted workspaces - recreating the same name recovers the old one
Get-AzOperationalInsightsDeletedWorkspace | Select-Object Name, ResourceGroupName

# Tagged resources that escaped their lab resource group
Get-AzResource -TagName 'sc500-module' |
    Where-Object ResourceGroupName -notlike 'rg-sc500-lab-*' |
    Format-Table Name, ResourceType, ResourceGroupName

# PIM roles still active on your account
Get-MgRoleManagementDirectoryRoleAssignmentSchedule `
    -Filter "principalId eq '$myId'" -ExpandProperty RoleDefinition |
    Where-Object AssignmentType -eq 'Activated' |
    Select-Object @{n='Role';e={$_.RoleDefinition.DisplayName}}, EndDateTime
```

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Azure PowerShell documentation: <https://learn.microsoft.com/powershell/azure/>
- Microsoft Graph PowerShell documentation: <https://learn.microsoft.com/powershell/microsoftgraph/>
