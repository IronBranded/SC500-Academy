---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data"
  - "https://learn.microsoft.com/azure/sentinel/billing-reduce-costs"
  - "https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management"
last_verified: "2026-09-17"
portal: "Cost Management + Billing > Cost analysis"
powershell_module: "Az.Security, Az.Billing"
az_cli_command: "az consumption budget list"
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "Cost anomalies are a detection signal, not only a budgeting one. A subscription whose daily run rate rises without a corresponding deployment is either an orphan you forgot or a resource you did not create, and both are worth knowing about. This matrix exists so that the first of those two explanations can be ruled out quickly."
---

# Licensing and Lab Cost Matrix

> **The three rules this whole guide is built on**, restated once:
>
> 1. **Azure pay-as-you-go has no spending cap.** A budget is a notification. The only thing that
>    stops spend is you, or the brake runbook from
>    [00-01](../00-lab-safety/00-01-cost-guardrails-and-budgets.md).
> 2. **Cost data lags by hours.** By the time an alert fires, the money is spent - so teardown
>    discipline is the control and the brake is a backstop.
> 3. **Deleting a resource group does not stop everything.** Defender plans, policy assignments,
>    connectors and Copilot capacity all live somewhere else.

## 1. The hourly meters - things that bill whether or not you use them

These are the resources that turn a forgotten lab into a real bill. Every one of them charges
from the moment provisioning completes, independent of traffic, queries or prompts.

| Resource | Module | Notes |
| --- | --- | --- |
| **Security Copilot SCUs** | [04-05](../04-security-posture/04-05-security-copilot.md) | **Highest in the guide by a wide margin.** Bills hourly while provisioned, used or not |
| **Azure Firewall** | [02-04](../02-storage-databases-networking/02-04-private-access-and-perimeter.md) | Hourly plus per-GB data processing |
| **Application Gateway WAF v2** | [03-06](../03-secure-compute/03-06-app-platform-serverless-web-and-apis.md) | Hourly plus capacity units |
| **Azure Bastion** | [03-04](../03-secure-compute/03-04-servers-and-virtual-machines.md) | Hourly per host plus outbound data |
| **AKS node pool** | [03-05](../03-secure-compute/03-05-app-platform-containers.md) | Control plane may be free on your tier; **the node VMs are not** |
| **API Management** | [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md), [03-06](../03-secure-compute/03-06-app-platform-serverless-web-and-apis.md) | By tier. Use a **v2 tier** - minutes to deploy rather than 30-45 |
| **Virtual WAN hub / VPN gateway** | [02-03](../02-storage-databases-networking/02-03-network-segmentation-and-connectivity.md) | Walkthrough-only in this guide for exactly this reason |
| **Virtual machines while allocated** | 02-03, 03-04, 03-05, 04-01, 04-03 | Stopped is not deallocated |
| **Public IP addresses** | several | Bill separately and survive the resource they were attached to |
| **Defender EASM** | [04-01](../04-security-posture/04-01-defender-for-cloud-posture.md) | **Per asset in inventory** - a broad seed can return thousands |

## 2. Subscription-scope settings that survive resource group deletion

The most common surprise bill in a security lab. `Remove-AzResourceGroup` does nothing to any of
these.

| Setting | Turn it off with |
| --- | --- |
| Every Defender for Cloud plan | `Set-AzSecurityPricing -Name <plan> -PricingTier 'Free'` |
| Azure Policy assignments (including ones that **re-enable Defender plans**) | `Remove-AzPolicyAssignment` - **remove the assignment before the plans, or policy turns them back on** |
| Sentinel data connectors | Disconnect in the Defender portal; a connector left on keeps ingesting |
| Orphaned role assignments | `Get-AzRoleAssignment ... | Where-Object { -not $_.DisplayName }` |
| Diagnostic settings pointing at a deleted destination | Per resource |

```powershell
# The one-line check to run at the end of every session
Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard' | Select-Object Name, SubPlan
```

## 3. Things that hold a name or survive deletion

Not costs, but they will block a re-run and occasionally keep charging.

| Thing | Behaviour | Module |
| --- | --- | --- |
| **Key vault** | Soft-deleted 7-90 days; **name reserved for the whole period**. Purge protection cannot be undone | [01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md) |
| **Log Analytics workspace** | Soft-deleted **14 days**; recreating the same name in the same RG and region **recovers the old one, data and all** | [02-02](../02-storage-databases-networking/02-02-database-security.md), [04-02](../04-security-posture/04-02-sentinel-workspace-roles-and-content.md) |
| **Microsoft Sentinel** | Removing Sentinel does **not** delete the workspace, which keeps charging for retained data | [04-02](../04-security-posture/04-02-sentinel-workspace-roles-and-content.md) |
| **Cognitive Services / Foundry** | Soft-deleted, holds its name | [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md) |
| **AKS node resource group** (`MC_*`) | A second resource group; does not always disappear cleanly | [03-05](../03-secure-compute/03-05-app-platform-containers.md) |
| **SharePoint sites** | Recycle bin **93 days**, sharing links still live | [03-01](../03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md) |
| **App registrations** | Deleted applications recoverable 30 days. Easy Auth creates one **named after the web app** | [03-06](../03-secure-compute/03-06-app-platform-serverless-web-and-apis.md) |
| **Search job result tables** | Persist in the workspace and count against retention | [04-04](../04-security-posture/04-04-sentinel-automation-retention-and-audit.md) |

## 4. Per-module cost profile

| Module | Cost | Dominant driver |
| --- | --- | --- |
| 00-01 Cost guardrails | **$0** | Budgets, action groups, Automation free tier |
| 00-02 PIM | **$0** | Entra ID P2 from E5 |
| 00-03 Teardown checklist | **$0** | - |
| 01-01 Entra ID secure access | **$0** | Managed identity objects are free; reuses the 00-01 Automation account |
| 01-02 Key Vault | Low | Defender for Key Vault + Defender CSPM, subscription scope |
| 01-03 Governance | Low | Defender CSPM if enabled; empty Recovery Services vault is free |
| 02-01 Storage | Low | **Defender for Storage, per storage account per month** |
| 02-02 Databases | Medium | SQL serverless with auto-pause; Defender per server per month |
| 02-03 Segmentation | Low (Parts 1-2) | Two B1s VMs; AVNM is free. Parts 3-4 walkthrough |
| 02-04 Perimeter | **HIGH** | **Azure Firewall, hourly** |
| 03-01 AI data exposure | **$0** | M365 E5 only |
| 03-02 Agent governance | **$0** | Licensing-gated, not cost-gated |
| 03-03 AI platform | Medium-HIGH | **API Management, hourly**; AI workloads plan |
| 03-04 Servers and VMs | **HIGH** | **Bastion + Defender for Servers P2 + VM, three meters** |
| 03-05 Containers | Medium-HIGH | **AKS node pool, continuous**; Defender for Containers per vCore-hour |
| 03-06 Serverless, web, APIs | Medium | **Application Gateway WAF v2**; APIM |
| 04-01 Defender for Cloud posture | Medium | Defender CSPM; **EASM per asset** |
| 04-02 Sentinel workspace | Low | Ingestion only - **set the daily cap first** |
| 04-03 Connectors and collection | Medium | **Ingestion. The module where cost can run away** |
| 04-04 Automation, retention, audit | Low | Logic Apps consumption; **search jobs and restores have minimums** |
| 04-05 Security Copilot | **HIGHEST** | **SCUs, hourly while provisioned** |

## 5. Licensing - what Microsoft 365 E5 does and does not cover

E5 covers the identity, governance and compliance half of this exam well. It does not cover the
Azure half at all, and there are three specific gaps that block objectives rather than merely
making them expensive.

### Covered by Microsoft 365 E5

| Capability | Used in |
| --- | --- |
| Microsoft Entra ID P2 - PIM, Conditional Access, Identity Protection, access reviews | 00-02, 01-01 |
| Microsoft Purview compliance and DSPM for AI | 03-01 |
| Microsoft Purview Audit (Standard **and** Premium, including `MailItemsAccessed`) | 04-04 |
| Defender for Cloud Apps, Defender for Office 365 | 03-02 |
| Defender XDR | 03-02, 04-02 |

### **Not** covered by E5 - verify before planning around them

| Capability | Requires | Blocks |
| --- | --- | --- |
| **Microsoft Entra Private Access** | Microsoft Entra Suite or standalone Global Secure Access | One of five sub-objectives in [02-04](../02-storage-databases-networking/02-04-private-access-and-perimeter.md) |
| **Conditional Access for agents** | **Microsoft Agent 365** per user, plus Entra ID P1/P2 | Part of [03-02](../03-secure-compute/03-02-ai-agent-identity-and-governance.md) |
| **Network controls for agents** | Microsoft Entra Internet Access | Part of 03-02 |
| **SharePoint permission-state snapshot reports, RCD, RAC** | **SharePoint Advanced Management** - unlocked automatically if **anyone** in the tenant holds a Microsoft 365 Copilot licence, otherwise a paid add-on | Parts of [03-01](../03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md) |
| **Everything in Domains 2, 3 (Azure) and 4** | A companion **Azure subscription** | Most of the guide |

Each of those is handled in its module as a licence-gated walkthrough with a written
deliverable, rather than being skipped or pretended around.

### Free tiers worth preferring

| Instead of | Use | Where |
| --- | --- | --- |
| Defender CSPM | **Foundational CSPM** - free, but **opt-in for new subscriptions from 27 Oct 2026** | 04-01 |
| A dedicated Bastion host | The lowest Bastion tier available in your region | 03-04 |
| General-purpose VM SKUs | **B-series burstable**, one node, smallest size | 02-03, 03-04, 03-05 |
| SQL Managed Instance | **Azure SQL Database serverless with auto-pause.** Never deploy MI in a self-funded lab | 02-02 |
| Front Door Premium | Application Gateway WAF v2, time-boxed | 03-06 |
| A Windows VM | **Ubuntu Gen2** - trusted launch, MDE, FIM and machine configuration all work, no Windows licensing | 03-04 |
| Bastion or a public IP for testing | **`Invoke-AzVMRunCommand`** - no session, no open port, no cost | 02-03, 03-04, 02-04 |
| Classic API Management tiers | **v2 tiers** - minutes to deploy instead of 30-45 billable ones | 03-03, 03-06 |

## 6. The end-of-session checklist

Run this after every study session, regardless of which labs you did.

```powershell
# 1. Anything still running
Get-AzVM -Status | Where-Object PowerState -eq 'VM running' | Select-Object Name, ResourceGroupName

# 2. Defender plans still billing
Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard' | Select-Object Name, SubPlan

# 3. The expensive singletons the teardown script does not check
Get-AzFirewall                 | Select-Object Name, ResourceGroupName
Get-AzBastion                  | Select-Object Name, ResourceGroupName
Get-AzApplicationGateway       | Select-Object Name, ResourceGroupName
Get-AzApiManagement            | Select-Object Name, ResourceGroupName
Get-AzAksCluster               | Select-Object Name, ResourceGroupName
Get-AzResource | Where-Object ResourceType -like '*SecurityCopilot*'
Get-AzResource | Where-Object ResourceType -like '*Easm*'

# 4. Orphans that cost money or grant access
Get-AzPublicIpAddress | Where-Object { -not $_.IpConfiguration } | Select-Object Name
Get-AzDisk            | Where-Object DiskState -eq 'Unattached'  | Select-Object Name
Get-AzResourceGroup -Name 'MC_*' | Select-Object ResourceGroupName

# 5. Lab resource groups still standing
Get-AzResourceGroup -Name 'rg-sc500-lab-*' | Select-Object ResourceGroupName
```

And two that are not resources at all:

```powershell
# 6. Sentinel ingestion - run this the DAY AFTER a 04-03 session
$law = Get-AzOperationalInsightsWorkspace -ResourceGroupName 'rg-sc500-core' -Name 'law-sc500'
Invoke-AzOperationalInsightsQuery -WorkspaceId $law.CustomerId -Query @"
Usage | where TimeGenerated > ago(1d)
| summarize GB = round(sum(Quantity)/1000,3) by DataType | order by GB desc
"@ | Select-Object -ExpandProperty Results
```

- [ ] **Cost Management → Cost analysis**, daily granularity, grouped by **Service name**. A
      service appearing that you did not expect is the signal. Check it the **next** day, not
      the same one.

## 7. What the brake runbook does not stop

The emergency brake from 00-01 sets Defender plans to Free and deallocates tagged VMs. It says
so itself in its own output, and the list is worth repeating because it is exactly the list of
things above:

> Azure Firewall, Bastion, VPN and ExpressRoute gateways, Virtual WAN hubs, AKS node pools, App
> Service plans, provisioned Security Copilot SCUs, and Log Analytics data retention.

These need **resource deletion**, not a tier change. Which is the point the guide made in Module
0 and has not stopped making since: **per-lab teardown discipline is the real control.**

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Understand Cost Management data (latency): <https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data>
- Reduce costs for Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/billing-reduce-costs>
- Cloud security posture management in Defender for Cloud: <https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management>
