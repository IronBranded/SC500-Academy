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
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Defender for Cloud > Environment settings"
powershell_module: "Az.Security"
az_cli_command: ""
kql_tables: []
licensing: "Defender CSPM; Defender EASM billed separately"
azure_resources: []
lab_cost_estimate: "Medium - EASM bills per asset inventory"
free_practice_available: false
forensic_relevance: ""
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

See [04-01 lab](../../labs/04-security-posture/04-01-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->