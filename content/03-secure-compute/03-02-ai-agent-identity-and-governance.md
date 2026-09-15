---
objective: "Implement security for AI"
sub_objectives:
  - "Enable and configure real-time protection for Microsoft Copilot Studio agents"
  - "Implement conditional access for Microsoft Entra Agent ID"
  - "Analyze blast radius for security risks related to Entra Agent ID by using Defender XDR"
  - "Manage Entra Agent ID access"
  - "Manage agents in Microsoft 365 admin center"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Entra admin center > Agent ID; Defender portal; M365 admin center"
powershell_module: "Microsoft.Graph"
az_cli_command: ""
kql_tables: []
licensing: "Microsoft Entra ID P2; Copilot Studio capacity"
azure_resources: []
lab_cost_estimate: "Low - verify Preview status per bullet before writing"
free_practice_available: false
forensic_relevance: ""
---

# AI Agent Identity and Governance

> **Objective:** Implement security for AI
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Enable and configure real-time protection for Microsoft Copilot Studio agents
- Implement conditional access for Microsoft Entra Agent ID
- Analyze blast radius for security risks related to Entra Agent ID by using Defender XDR
- Manage Entra Agent ID access
- Manage agents in Microsoft 365 admin center

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

See [03-02 lab](../../labs/03-secure-compute/03-02-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->