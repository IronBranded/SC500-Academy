---
objective: "Implement activity and event collection in Microsoft Sentinel"
sub_objectives:
  - "Implement automation rules and playbooks in Microsoft Sentinel"
  - "Implement data retention in Microsoft Sentinel data stores"
  - "Query Microsoft Purview Audit in Defender XDR"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Defender portal > Sentinel > Automation; Purview portal > Audit"
powershell_module: "Az.SecurityInsights, Az.LogicApp"
az_cli_command: ""
kql_tables:
  - "AuditLogs"
  - "CloudAppEvents"
  - "OfficeActivity"
licensing: "Sentinel; Purview Audit (Standard/Premium)"
azure_resources: []
lab_cost_estimate: "Low"
free_practice_available: false
forensic_relevance: ""
---

# Sentinel Automation, Retention, and Purview Audit

> **Objective:** Implement activity and event collection in Microsoft Sentinel
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Implement automation rules and playbooks in Microsoft Sentinel
- Implement data retention in Microsoft Sentinel data stores
- Query Microsoft Purview Audit in Defender XDR

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

See [04-04 lab](../../labs/04-security-posture/04-04-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->