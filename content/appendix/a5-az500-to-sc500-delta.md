---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/network-watcher/nsg-flow-logs-migrate"
  - "https://learn.microsoft.com/en-us/entra/permissions-management/how-to-offboard-permissions-management"
  - "https://learn.microsoft.com/en-us/azure/key-vault/general/access-control-default"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/tutorial-enable-cspm-plan"
  - "https://learn.microsoft.com/unified-secops/whats-new"
  - "https://learn.microsoft.com/purview/audit-search"
  - "https://learn.microsoft.com/entra/identity/authentication/how-to-authentication-methods-manage"
last_verified: "2026-09-17"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: false
forensic_relevance: "Outdated prep material is its own risk surface. Several items below are not 'renamed' but 'gone' - operations the platform will now refuse - and following a confident walkthrough into one of them wastes exam preparation and, in a production tenant, produces a control someone believes exists."
---

# AZ-500 to SC-500 Delta

> **Why this appendix exists.** AZ-500 retired on 31 August 2026 with no automatic credential
> upgrade path, and a large body of AZ-500 study material remains in circulation - courses,
> videos, blog walkthroughs, and practice questions. Most of it is still broadly useful. Some of
> it is actively wrong in ways that cost you marks, and a smaller set describes operations the
> platform no longer permits at all.
>
> This appendix collects every divergence flagged in the 22 modules of this guide into one
> reference. Read it once before you start, and again in the week before the exam.

## How to use this

Three categories, in descending order of risk:

1. **Dead content** - features retired, or operations the platform now refuses. Following these
   wastes time and, in production, creates a control that does not exist.
2. **Changed defaults** - the feature still exists, but the correct answer to "what happens if I
   do nothing" has changed. These are the highest-value exam items because the question stem
   often turns on the default.
3. **Genuinely new** - no AZ-500 ancestor at all, which means no second-hand material to
   cross-check and no accumulated folklore to unlearn.

## 1. Dead content - do not follow these walkthroughs

| Thing | What happened | Use instead | Module |
| --- | --- | --- | --- |
| **Legacy MFA and SSPR policies for authentication methods** | Method management stopped functioning **30 September 2025** | Authentication methods policy | [01-01](../01-identity-access-governance/01-01-entra-id-secure-access.md) |
| **Microsoft Entra Permissions Management** (standalone CIEM) | **Retired 1 October 2025**; support ended 1 November 2025 | CIEM capabilities inside **Defender CSPM**; PIM access reviews; Azure RBAC enumeration | [01-03](../01-identity-access-governance/01-03-governance-and-regulatory-compliance.md) |
| **NSG flow logs** | **No new ones creatable since 30 June 2025**; full retirement **30 September 2027** | **Virtual network flow logs** | [02-03](../02-storage-databases-networking/02-03-network-segmentation-and-connectivity.md) |
| **Log Analytics agent (MMA)** | Retired. Any walkthrough installing MMA, or configuring collection under workspace *Agents configuration*, is describing a dead path | **Azure Monitor Agent** with data collection rules | [04-03](../04-security-posture/04-03-sentinel-data-connectors-and-collection.md) |
| **File integrity monitoring on MMA or AMA** | Migrated to **Defender for Endpoint** | FIM on Defender for Endpoint, enabled after Defender for Servers Plan 2 | [03-04](../03-secure-compute/03-04-servers-and-virtual-machines.md) |
| **Microsoft Entra pod identity** (AKS) | Superseded | **Azure Workload Identity** | [03-05](../03-secure-compute/03-05-app-platform-containers.md) |
| **Restricted SharePoint Search** | Retiring; **new enablement blocked from 31 July 2026** | **Restricted Content Discovery** | [03-01](../03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md) |
| **Defender for Storage (classic)** | Legacy, per-transaction, no malware scanning; no new capability will ship to it | The current per-storage-account plan | [02-01](../02-storage-databases-networking/02-01-storage-account-security.md) |
| **SQL vulnerability assessment (classic)** | Legacy; requires a storage account; reverting to it needs the plan disabled and PowerShell | **Express configuration** | [02-02](../02-storage-databases-networking/02-02-database-security.md) |
| **Microsoft Sentinel in the Azure portal** | Retires **31 March 2027** - extended from the originally announced 1 July 2026 | Sentinel in the **Microsoft Defender portal** | [04-02](../04-security-posture/04-02-sentinel-workspace-roles-and-content.md) |

> **One-glance tests.** If a Defender for Cloud configuration pane asks you for a **storage
> account** for SQL scan results, you are on classic. If a Sentinel walkthrough opens the
> **Azure** portal, it is on a countdown. If an EASM- or CIEM-flavoured task sends you to a
> **Permissions Management** blade, that blade is gone.

## 2. Changed defaults - the answer moved without the feature moving

These are the highest-yield exam items in this appendix, because scenario questions frequently
turn on what happens when nobody configures anything.

| Setting | Was | Is now | Module |
| --- | --- | --- | --- |
| **Key Vault permission model** for new vaults | Access policies | **Azure RBAC** (API version 2026-02-01 and later). Access policies remain supported - legacy, not retired | [01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md) |
| **Trusted services bypass** on Key Vault | A simple exception | Still applies when public access is Disabled, but is **overridden by a Network Security Perimeter** association | [01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md) |
| **Trusted launch** on new Gen2 VMs | Opt-in enhancement | **Default.** Secure Boot and vTPM are a baseline to verify, not a feature to add | [03-04](../03-secure-compute/03-04-servers-and-virtual-machines.md) |
| **Container vulnerability assessment engine** | A third-party engine | **Microsoft Defender Vulnerability Management** - different findings, scoring and portal experience | [03-05](../03-secure-compute/03-05-app-platform-containers.md) |
| **Audit (Standard) retention** | 90 days | **180 days** for records generated on or after 17 October 2023 | [04-04](../04-security-posture/04-04-sentinel-automation-retention-and-audit.md) |
| **Foundational CSPM** | Enabled by default on every onboarded subscription | **Opt-in for new Azure subscriptions from 27 October 2026.** Still free; existing enabled subscriptions unaffected | [04-01](../04-security-posture/04-01-defender-for-cloud-posture.md) |
| **Defender for Cloud posture capability** | "Defender for Cloud is enabled" implied attack paths, explorer, governance | Those are **Defender CSPM (paid)**; free tier is assessment, recommendations, secure score, MCSB | [04-01](../04-security-posture/04-01-defender-for-cloud-posture.md) |
| **WAF managed rule sets** | CRS only | **DRS 2.1 alongside CRS 3.2**, plus a separate **Bot Manager** rule set; Front Door managed rules require **Premium** | [03-06](../03-secure-compute/03-06-app-platform-serverless-web-and-apis.md) |
| **Azure Firewall configuration model** | Classic rules | **Firewall Policy** and Firewall Manager, with Premium features (IDPS, TLS inspection, URL filtering) weighted far more heavily | [02-04](../02-storage-databases-networking/02-04-private-access-and-perimeter.md) |
| **Sentinel content delivery** | Per-item galleries | **Content hub** solutions | [04-02](../04-security-posture/04-02-sentinel-workspace-roles-and-content.md) |

## 3. Genuinely new - no AZ-500 ancestor

Roughly a third of SC-500 has no predecessor. There is no second-hand material to cross-check
against, which cuts both ways: nothing to unlearn, and nothing to fall back on when the
documentation is thin.

| Area | What it covers | Module |
| --- | --- | --- |
| **AI data exposure and Purview DSPM for AI** | SharePoint oversharing discovery, Restricted Content Discovery and Restricted Access Control, DSPM for AI reports, collection policies for Copilot interactions | [03-01](../03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md) |
| **Microsoft Entra Agent ID** | Agent identity blueprints, agent identities and agent users; Conditional Access for agents; agent risk in Identity Protection; agent governance and sponsorship | [03-02](../03-secure-compute/03-02-ai-agent-identity-and-governance.md) |
| **Copilot Studio runtime protection** | Built-in XPIA/UPIA defences; advanced real-time protection through an external threat detection system | [03-02](../03-secure-compute/03-02-ai-agent-identity-and-governance.md) |
| **AI Gateway in API Management** | Token limits and quotas, semantic caching, content safety at the gateway, credential management for model backends | [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md) |
| **Microsoft Foundry guardrails** | Content filters, Prompt Shields, groundedness detection, blocklists | [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md) |
| **Defender for Cloud AI workloads plan** | Threat protection for AI workloads, suspicious prompt evidence, Data and AI security dashboard | [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md), [04-01](../04-security-posture/04-01-defender-for-cloud-posture.md) |
| **Microsoft Entra Private Access** | Per-application private access through Global Secure Access, published as enterprise applications so Conditional Access applies | [02-04](../02-storage-databases-networking/02-04-private-access-and-perimeter.md) |
| **Azure Virtual Network Manager security admin rules** | Organisation-wide rules **evaluated before NSGs**, which application teams cannot override | [02-03](../02-storage-databases-networking/02-03-network-segmentation-and-connectivity.md) |
| **Defender CSPM secret scanning** | Agentless discovery of credentials sitting outside the vault | [01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md) |
| **Agentless scanning for machines** | Disk-snapshot assessment with no agent, no connectivity, no performance cost | [03-04](../03-secure-compute/03-04-servers-and-virtual-machines.md) |
| **Defender sensor, binary drift detection and blocking** | eBPF-based container runtime detection of processes that did not come from the image | [03-05](../03-secure-compute/03-05-app-platform-containers.md) |
| **Microsoft Security Copilot** | Workspaces, SCU capacity, Copilot owner/contributor roles, plugins, Microsoft and Security Store agents | [04-05](../04-security-posture/04-05-security-copilot.md) |
| **Sentinel data lake and table plans** | Cheap long-horizon storage; Analytics vs Basic/Auxiliary tiers; DCR transformations | [04-03](../04-security-posture/04-03-sentinel-data-connectors-and-collection.md) |

## 4. Renamed or relocated

Lower risk, but enough to make a search return nothing:

| Old name or location | Current |
| --- | --- |
| Azure AI Foundry | **Microsoft Foundry** |
| Guest Configuration | **Azure Machine Configuration** |
| Azure AD / Azure Active Directory | **Microsoft Entra ID** (and Azure AD roles → Microsoft Entra roles) |
| Compliance portal audit search | **Audit** in the Microsoft Defender portal |
| Sentinel, in the Azure portal | **Sentinel, in the Microsoft Defender portal** |
| SharePoint Advanced Management | Branded **Microsoft SharePoint Premium - SharePoint Advanced Management**, and unlocked automatically if anyone in the tenant holds a Microsoft 365 Copilot licence |

## 5. The dated timeline

One table, because dates are what make a change checkable rather than arguable.

| Date | Change |
| --- | --- |
| 17 Oct 2023 | Audit (Standard) default retention changes 90 → **180 days** |
| 30 Jun 2025 | **No new NSG flow logs** can be created |
| 1 Jul 2025 | New Sentinel tenants onboarded to the **Defender portal** by default |
| 30 Sep 2025 | Authentication method management in **legacy MFA and SSPR policies stops functioning** |
| 1 Oct 2025 | **Entra Permissions Management retired** (support ended 1 Nov 2025) |
| Feb 2026 | Sentinel Azure portal retirement **extended** from 1 Jul 2026 to 31 Mar 2027 |
| Key Vault API **2026-02-01** | New vaults default to the **Azure RBAC** permission model |
| 31 Jul 2026 | **Restricted SharePoint Search**: new enablement blocked |
| 31 Aug 2026 | **AZ-500 retires**, no automatic credential upgrade path |
| **27 Oct 2026** | **Foundational CSPM becomes opt-in** for new Azure subscriptions |
| 31 Mar 2027 | **Microsoft Sentinel in the Azure portal retires** |
| 30 Sep 2027 | **NSG flow logs retire** completely |

> **Verify the last three before the exam.** They are the ones still in the future at the time
> this appendix was written, and dates in this space have moved before - the Sentinel retirement
> moved by nine months.

## 6. Using AZ-500 material safely

If you are working from an AZ-500 course or video series, it is still worth its time for the
Azure fundamentals - networking, RBAC, Key Vault mechanics, VM hardening concepts. Apply three
rules:

1. **Never trust a portal path.** Blade names and navigation have changed across most of the
   surfaces in this exam. Use the material for the *concept*, then find the blade yourself.
2. **Check every default against this appendix.** A walkthrough that says "by default X" is the
   most likely place for it to be silently wrong.
3. **Skip nothing in Domain 3's AI block.** No AZ-500 course covers it. It is roughly a third of
   the Secure compute domain and it is the part where a candidate coming from AZ-500 is most
   likely to be unpleasantly surprised.

And the general principle this guide has applied throughout: where third-party material
conflicts with Microsoft Learn, the documentation wins - and where the documentation conflicts
with itself, the more recently updated page usually wins, but check both.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Migrate to virtual network flow logs: <https://learn.microsoft.com/azure/network-watcher/nsg-flow-logs-migrate>
- Offboard Microsoft Entra Permissions Management: <https://learn.microsoft.com/en-us/entra/permissions-management/how-to-offboard-permissions-management>
- Default access control model for new key vaults: <https://learn.microsoft.com/en-us/azure/key-vault/general/access-control-default>
- Enable the Defender CSPM plan: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/tutorial-enable-cspm-plan>
- What's new in unified security operations: <https://learn.microsoft.com/unified-secops/whats-new>
- Search the audit log: <https://learn.microsoft.com/purview/audit-search>
- Manage authentication methods (migration): <https://learn.microsoft.com/entra/identity/authentication/how-to-authentication-methods-manage>
