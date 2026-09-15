---
objective: "Implement security for Azure network services"
sub_objectives:
  - "Implement and configure Microsoft Entra Private Access"
  - "Configure Azure private endpoints to secure access to Azure platform as a service (PaaS) resources"
  - "Configure Azure Private Link services to secure access to network resources"
  - "Implement and configure Azure Firewall"
  - "Evaluate effective security rules by using Azure Network Watcher diagnostics"
domain: "Secure storage, databases, and networking"
domain_weight: "25-30%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > Firewalls / Private Link / Network Watcher"
powershell_module: "Az.Network"
az_cli_command: ""
kql_tables: []
licensing: "Microsoft Entra Suite or Global Secure Access licensing for Private Access"
azure_resources: []
lab_cost_estimate: "HIGH - Azure Firewall bills hourly plus data processing regardless of traffic"
free_practice_available: false
forensic_relevance: ""
---

# Private Access and Network Perimeter

> **Objective:** Implement security for Azure network services
> **Domain:** Secure storage, databases, and networking (25-30%)

## Sub-objectives covered

- Implement and configure Microsoft Entra Private Access
- Configure Azure private endpoints to secure access to Azure platform as a service (PaaS) resources
- Configure Azure Private Link services to secure access to network resources
- Implement and configure Azure Firewall
- Evaluate effective security rules by using Azure Network Watcher diagnostics

## Why this exists

<!-- First-principles framing. What problem does this control solve, and what
     goes wrong without it? Analogy goes here, before any portal blade is named. -->

## How it works under the hood

<!-- Mechanism, not menu path. Trust boundaries, token flow, evaluation order,
     where the control actually sits in the request path. -->

## Configuration surface

<!-- What is configurable, what the defaults are, and which defaults are unsafe. -->

## Common failure modes

<!-- Misconfigurations that pass a checklist but fail in practice. -->

## Check yourself

<!-- 3-5 self-check questions. Reasoning questions, not recall. -->

## Hands-on

See [02-04 lab](../../labs/02-storage-databases-networking/02-04-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->