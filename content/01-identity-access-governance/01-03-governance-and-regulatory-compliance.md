---
objective: "Implement governance to enforce security and regulatory compliance"
sub_objectives:
  - "Implement and configure security controls by using Azure Policy, including built-in and custom policy definitions"
  - "Evaluate regulatory compliance by using Microsoft Defender for Cloud"
  - "Implement and configure security controls in Defender for Cloud, including security standards and recommendations"
  - "Implement resource locks"
  - "Manage Azure built-in role assignments"
  - "Manage custom roles, including Azure roles and Microsoft Entra roles"
  - "Evaluate and remediate overprivileged access assignments by using Azure role-based access control (RBAC)"
  - "Configure security controls for backup protection by using Azure Backup security features"
  - "Implement and configure security controls by using infrastructure as code"
domain: "Manage identity, access, and governance"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > Policy; Defender for Cloud > Regulatory compliance"
powershell_module: "Az.PolicyInsights, Az.Resources"
az_cli_command: ""
kql_tables: []
licensing: "Defender CSPM plan"
azure_resources: []
lab_cost_estimate: "Low"
free_practice_available: false
forensic_relevance: ""
---

# Governance and Regulatory Compliance

> **Objective:** Implement governance to enforce security and regulatory compliance
> **Domain:** Manage identity, access, and governance (20-25%)

## Sub-objectives covered

- Implement and configure security controls by using Azure Policy, including built-in and custom policy definitions
- Evaluate regulatory compliance by using Microsoft Defender for Cloud
- Implement and configure security controls in Defender for Cloud, including security standards and recommendations
- Implement resource locks
- Manage Azure built-in role assignments
- Manage custom roles, including Azure roles and Microsoft Entra roles
- Evaluate and remediate overprivileged access assignments by using Azure role-based access control (RBAC)
- Configure security controls for backup protection by using Azure Backup security features
- Implement and configure security controls by using infrastructure as code

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

See [01-03 lab](../../labs/01-identity-access-governance/01-03-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->