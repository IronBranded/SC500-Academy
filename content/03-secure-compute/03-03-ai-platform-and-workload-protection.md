---
objective: "Implement security for AI"
sub_objectives:
  - "Configure and deploy AI Gateway in Azure API Management for Microsoft Foundry"
  - "Configure guardrails for agent security in Foundry"
  - "Enable Defender for AI Service in Cloud Workload Protection in Defender for Cloud"
  - "Monitor AI security by using the Data and AI security dashboard in Defender for Cloud"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > API Management / Microsoft Foundry; Defender for Cloud"
powershell_module: "Az.ApiManagement, Az.CognitiveServices"
az_cli_command: ""
kql_tables: []
licensing: "Defender for AI Service plan"
azure_resources: []
lab_cost_estimate: "Medium - APIM tier choice dominates; model inference billed per token"
free_practice_available: false
forensic_relevance: ""
---

# AI Platform and Workload Protection

> **Objective:** Implement security for AI
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Configure and deploy AI Gateway in Azure API Management for Microsoft Foundry
- Configure guardrails for agent security in Foundry
- Enable Defender for AI Service in Cloud Workload Protection in Defender for Cloud
- Monitor AI security by using the Data and AI security dashboard in Defender for Cloud

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

See [03-03 lab](../../labs/03-secure-compute/03-03-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->