---
objective: "Manage security posture by using Defender for Cloud"
sub_objectives:
  - "Identify security risks by using Defender CSPM"
  - "Evaluate compliance against security frameworks by using Defender for Cloud"
  - "Enable and configure Defender for Cloud workload protection plans"
  - "Connect hybrid cloud and multicloud environments to Defender for Cloud, including Amazon Web Services (AWS) and Google Cloud Platform (GCP)"
  - "Configure Microsoft Defender Vulnerability Management settings for Azure VMs"
  - "Discover unprotected assets and vulnerabilities by using Microsoft Defender External Attack Surface Management (EASM)"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-03", "03-04", "03-05"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/tutorial-enable-cspm-plan"
  - "https://learn.microsoft.com/azure/external-attack-surface-management"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-servers-overview"
last_verified: "2026-09-17"
portal: "Defender for Cloud > Environment settings"
powershell_module: "Az.Security"
az_cli_command: "az security pricing create"
kql_tables: []
licensing: "Foundational CSPM is free. Defender CSPM is billed per billable resource. Workload protection plans are billed per plan. Defender EASM is billed separately, per asset in inventory."
azure_resources: ["Microsoft.Security/pricings", "Microsoft.Security/securityConnectors", "Microsoft.Easm/workspaces"]
lab_cost_estimate: "Medium, with one sharp edge - Defender EASM bills per asset in inventory, and a discovery run against a real domain can find thousands of assets. Scope the seed narrowly or treat EASM as a walkthrough."
free_practice_available: false
forensic_relevance: "Attack path analysis is the closest thing Defender for Cloud has to an attacker's own planning document: it enumerates the chains of exposure, permission and vulnerability that actually connect an internet-facing asset to something worth reaching. Cloud security explorer queries the same graph, which makes it a genuine hunting surface rather than a report. And EASM answers the question no internal inventory can - what is reachable from outside that nobody in the organisation knows about."
---

# Security Posture with Defender for Cloud

> **Objective:** Manage security posture by using Defender for Cloud
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Identify security risks by using Defender CSPM
- Evaluate compliance against security frameworks by using Defender for Cloud
- Enable and configure Defender for Cloud workload protection plans
- Connect hybrid cloud and multicloud environments to Defender for Cloud, including Amazon Web Services (AWS) and Google Cloud Platform (GCP)
- Configure Microsoft Defender Vulnerability Management settings for Azure VMs
- Discover unprotected assets and vulnerabilities by using Microsoft Defender External Attack Surface Management (EASM)

> **Changing default, dated.** From **27 October 2026**, Foundational CSPM moves to an
> **opt-in model** and is **no longer enabled by default for new Azure subscriptions**. It
> remains free and can be enabled at any time; existing subscriptions with it enabled stay
> enabled. Verify the state of this before the exam - it is the kind of detail a
> recently-updated question will use.

## Why this exists

You have spent three domains enabling individual controls. This module is about the
question that only appears once you have a lot of them: **which of the thousands of things
that are wrong actually matter?**

A mature Azure estate generates an enormous number of true findings. Every one is real.
Almost none of them are urgent. A storage account without soft delete, a VM missing a patch,
an over-broad role assignment - individually these are items on a list, and a list of
four thousand items is functionally the same as no list at all.

Defender for Cloud's answer has three layers, and they are the three things this objective
tests:

1. **Assess everything** - continuous evaluation against a benchmark, expressed as
   recommendations and a secure score. This is the list.
2. **Find the chains** - attack path analysis and the security graph, which connect findings
   into the routes an attacker could actually walk. This is what turns a list into a
   priority.
3. **Protect and detect** - workload protection plans, the per-service Defender plans you
   have been enabling and disabling since 01-02.

The distinction between layers 1 and 2 is the conceptual core. "This VM has a critical CVE"
is a finding. "This VM has a critical CVE, is reachable from the internet, and holds a
managed identity with Contributor on the subscription" is an **attack path** - and it is the
same three facts, assembled.

## How it works under the hood

### Two CSPM plans, and what each one buys

| Capability | Foundational CSPM (free) | Defender CSPM (paid) |
| --- | --- | --- |
| Continuous assessment of configuration | Yes | Yes |
| Security recommendations | Yes | Yes |
| Secure score | Yes | Yes |
| Asset inventory | Yes | Yes |
| Microsoft cloud security benchmark | Yes | Yes |
| **Regulatory compliance standards** beyond MCSB | No | **Yes** |
| **Governance rules** | No | **Yes** |
| **Cloud security explorer** | No | **Yes** |
| **Attack path analysis** | No | **Yes** |
| **Agentless scanning for machines** | No | **Yes** |
| **Risk prioritisation**, AI security posture | No | **Yes** |
| Advanced DevOps posture (PR annotations, code-to-cloud mapping) | Basic recommendations only | **Yes** |

Coverage spans **Azure, AWS, and GCP**, plus on-premises through **Azure Arc**. Billing is
based on specific billable resources rather than a flat rate.

**The gotcha that produces silent failure:** agentless scanning requires the **Subscription
Owner** to enable the Defender CSPM plan. Someone with lower authorisation *can* enable the
plan, but the agentless scanner will not turn on, because the permissions it needs are only
available to an Owner. And because the scanner is off, **attack path analysis and cloud
security explorer do not populate with vulnerabilities.** The plan shows as enabled, the
features exist, and the most valuable thing about them is missing. If your attack paths are
empty, check who enabled the plan.

### The security graph, attack paths, and the explorer

Defender CSPM builds a graph of your cloud: resources, their configurations, their network
exposure, their identities and permissions, and their vulnerabilities - from agentless
scanning, from MDVM, from container image scanning, from secrets scanning.

**Attack path analysis** walks that graph looking for chains that lead somewhere: an
internet-exposed resource, with a vulnerability, holding an identity, with permissions on
something sensitive. Each path is a single prioritised item that replaces several
unprioritised findings.

**Cloud security explorer** queries the same graph directly. It is the difference between
reading a report and hunting: "show me internet-facing VMs with a critical vulnerability that
have a managed identity with write access to a storage account containing sensitive data" is
one query. The building blocks come from work you did earlier in the guide - agentless
machine scanning from 03-04, container findings from 03-05, secrets from 01-02, data
classification from 02-01.

**Risk prioritisation** orders recommendations by the risk they actually represent - the
exploitability and business impact of what they sit on - rather than by a flat severity. This
is the answer to the four-thousand-item list.

### Compliance standards

Covered mechanically in
[01-03](../01-identity-access-governance/01-03-governance-and-regulatory-compliance.md), and
worth restating in one line because it is the thing people forget: **for Azure, the standards
are Azure Policy initiatives**, so a compliance control maps to recommendations, which map to
policy definitions. MCSB is applied by default and drives the secure score; **additional
frameworks require Defender CSPM.**

Custom standards and custom recommendations let internal requirements live in the same
dashboard as the regulatory ones.

### Workload protection plans

These are the per-service plans you have been switching on and off throughout the guide:

| Plan | Covered in |
| --- | --- |
| Key Vault | 01-02 |
| Storage | 02-01 |
| Databases (four sub-plans) | 02-02 |
| AI workloads | 03-03 |
| Servers, Plan 1 and Plan 2 | 03-04 |
| Containers | 03-05 |
| App Service, Resource Manager, DNS | 03-06 and posture |

Three properties they all share, and all three are exam-relevant:

- **Enabled at subscription scope** (with some resource-level overrides), which is why they
  survive resource group deletion - the point made in 00-01 and enforced by every teardown in
  this guide.
- **Off by default.** Enabling Defender for Cloud does not enable them.
- **Best deployed by policy**, not by hand, so new subscriptions inherit them - the 01-03
  governance pattern.

CSPM tells you what is wrong; workload protection plans tell you what is happening. An
organisation with excellent CSPM and no workload plans has good hygiene and no detection.

### Multicloud and hybrid

**AWS and GCP** connect through **security connectors** created in Environment settings. The
connector establishes read access to the cloud account, discovers resources, and applies the
equivalent assessments - and it can auto-provision **Azure Arc** onto discovered machines so
Defender for Servers covers them too.

**On-premises** machines arrive through Arc directly, as in 03-04.

The conceptual point: once connected, an AWS EC2 instance and an Azure VM appear in the same
inventory, the same recommendations list, the same secure score, and the same **attack
paths** - including paths that cross cloud boundaries. That last capability is most of the
argument for multicloud CSPM.

### Microsoft Defender Vulnerability Management for Azure VMs

MDVM is the vulnerability assessment engine across this guide - Defender for Servers in
03-04, container images in 03-05, and here. For Azure VMs it arrives two ways:

- **With the Defender for Endpoint extension**, enabled by default on machines carrying it
  when a Servers plan is on
- **Agentlessly**, through disk snapshot scanning with Defender for Servers Plan 2 or Defender
  CSPM

Settings worth knowing: which machines are in scope, exclusions, and the premium MDVM
capabilities available with Defender for Servers Plan 2 - things like software inventory
depth and broader assessment coverage. Findings feed the security graph, so a vulnerability
becomes part of an attack path rather than a standalone row.

### Defender EASM

Everything above assesses resources **you know about**. EASM assesses what an attacker sees,
which is not the same set.

It works from **seeds** - domains, IP blocks, hosts, email contacts, ASNs, WHOIS
organisations - and runs recursive discovery from them, using Microsoft's own crawling
infrastructure and threat intelligence, to build an inventory of internet-facing assets
associated with your organisation. The output includes assets nobody in the organisation
remembers: a marketing microsite, a forgotten test environment, a subsidiary's infrastructure,
an expired-but-still-resolving hostname.

Discovered assets land in states you triage - approved inventory, candidates requiring
investigation, dismissed - and EASM surfaces vulnerabilities and misconfigurations on them,
including things no internal scanner would see because nobody knew to point it there.

Two practical notes. EASM is **deployed as its own Azure resource** and **billed separately
from Defender for Cloud**, per asset in inventory. And the honest framing: EASM finds shadow
IT, which is the category of asset most likely to be unpatched, unmonitored, and unowned.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| Foundational CSPM | Enabled by default - **opt-in for new subscriptions from 27 Oct 2026** | Enabled | Free, and everything else assumes it |
| Defender CSPM | Off | On where attack paths and agentless scanning are needed | The paid capabilities are the prioritisation ones |
| Who enables Defender CSPM | anyone with rights | **Subscription Owner** | Otherwise agentless scanning silently does not start |
| MCSB | Applied | Leave applied | Drives the secure score |
| Additional standards | none | Only frameworks you are held to | Each adds recommendations and noise |
| Workload protection plans | **Off** | On per service in use, enforced by Azure Policy | Off by default, subscription-scoped, survives RG deletion |
| MDVM scope | all supported machines | Confirm, with deliberate exclusions | Silence is not coverage |
| AWS / GCP connectors | none | One per account or organisation, with Arc auto-provisioning | Cross-cloud attack paths |
| Governance rules | none | Owner and due date per recommendation set | Findings without owners do not get fixed |
| EASM | not deployed | Narrow seeds first | Billed per asset discovered |

## Common failure modes

**Secure score treated as the goal.** It measures MCSB compliance, not risk. A high score with
an unaddressed attack path is worse than the reverse.

**Attack paths empty, plan enabled.** Almost always the Owner-permission problem above - the
agentless scanner never started.

**Defender CSPM enabled, workload plans left off.** Excellent posture reporting, no detection.
The two halves are sold separately for a reason and neither substitutes for the other.

**Compliance dashboard read as remediation.** A percentage is evidence. The 22% keeps running -
the point made in 01-03 and worth repeating here.

**Every available standard assigned.** The dashboard becomes unreadable and nobody can tell
which findings are contractually required.

**Plans enabled by hand, subscription by subscription.** The next subscription somebody creates
has none of them. Use policy.

**Multicloud connector created, Arc auto-provisioning declined.** AWS instances appear in
inventory with configuration assessments and no Defender for Servers coverage.

**MDVM assumed to cover machines it does not.** Check scope and exclusions rather than reading
an empty result as clean - the same error as the empty secret-scanning result in 01-02.

**EASM run against a broad seed on a real organisation.** The inventory finds thousands of
assets, each billable. Start narrow.

**EASM findings not routed anywhere.** Discovery without an owner produces a list of things
nobody has authority over - which is the same problem EASM was bought to solve, one level up.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "prioritise which findings matter" | Attack path analysis / risk prioritisation, Defender CSPM |
| "query relationships across resources" | Cloud security explorer |
| "free, out of the box" | Foundational CSPM |
| "assess against PCI-DSS / ISO" | Additional standards, requires Defender CSPM |
| "measure against Microsoft's own benchmark" | MCSB, foundational |
| "detect attacks against storage / SQL / servers" | The relevant workload protection plan |
| "the plan must apply to future subscriptions" | Azure Policy assignment at management group scope |
| "AWS EC2 instances in the same inventory" | AWS security connector, with Arc auto-provisioning |
| "vulnerability findings without installing an agent" | Agentless scanning, Defender CSPM or Servers Plan 2 |
| "assets we do not know we own" | Defender EASM |
| "assign an owner and due date to a recommendation" | Governance rules, Defender CSPM |
| "attack paths are empty" | Agentless scanner not enabled - check who enabled the plan |

**AZ-500 divergence.** Defender for Cloud has reorganised around the CSPM plan split, with the
prioritisation features - attack paths, security explorer, risk-based ordering - behind the
paid tier and the free tier reduced to assessment and secure score. Older material that treats
"Defender for Cloud is enabled" as meaning all of this is available will mislead you on both
capability and cost. Note also the **27 October 2026** change to Foundational CSPM's default.

## Hands-on

See [04-01 lab](../../labs/04-security-posture/04-01-lab.md).

## Check yourself

1. Your organisation enables Defender CSPM. Two weeks later, attack path analysis shows
   nothing and cloud security explorer returns resources but no vulnerabilities. Give the most
   likely cause and the remediation.
2. Distinguish a recommendation from an attack path using one VM as the example. What
   additional facts turn the first into the second, and where does each fact come from?
3. Your secure score is 82% and an internet-facing VM with a critical CVE holds a managed
   identity with Contributor at subscription scope. Explain what secure score is actually
   measuring and why it did not capture this.
4. A colleague argues that with Defender CSPM enabled there is no need for the individual
   workload protection plans. State the strongest version of their argument, then the rebuttal.
5. You run an EASM discovery with your organisation's primary domain as the seed and it returns
   4,000 assets. Describe the cost consequence, the triage approach, and what you would have
   done differently.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Cloud security posture management in Defender for Cloud: <https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management>
- Enable the Defender CSPM plan: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/tutorial-enable-cspm-plan>
- Defender External Attack Surface Management: <https://learn.microsoft.com/azure/external-attack-surface-management>
- Overview of Defender for Servers: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-servers-overview>
