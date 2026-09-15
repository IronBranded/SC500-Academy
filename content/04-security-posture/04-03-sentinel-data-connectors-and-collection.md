---
objective: "Implement activity and event collection in Microsoft Sentinel"
sub_objectives:
  - "Configure and use Microsoft data connectors for Azure resources"
  - "Implement and configure syslog and Common Event Format (CEF) event collections"
  - "Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)"
  - "Create custom log tables in the workspace to store ingested data"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Defender portal > Sentinel > Data connectors; Azure Monitor > Data collection rules"
powershell_module: "Az.Monitor, Az.SecurityInsights"
az_cli_command: ""
kql_tables:
  - "Custom_CL"
  - "SecurityEvent"
  - "Syslog"
  - "CommonSecurityLog"
licensing: "Sentinel ingestion-based"
azure_resources: []
lab_cost_estimate: "Medium - ingestion is the cost driver; cap with a daily quota"
free_practice_available: false
forensic_relevance: ""
---

# Sentinel Data Connectors and Event Collection

> **Objective:** Implement activity and event collection in Microsoft Sentinel
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Configure and use Microsoft data connectors for Azure resources
- Implement and configure syslog and Common Event Format (CEF) event collections
- Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)
- Create custom log tables in the workspace to store ingested data

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

See [04-03 lab](../../labs/04-security-posture/04-03-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->