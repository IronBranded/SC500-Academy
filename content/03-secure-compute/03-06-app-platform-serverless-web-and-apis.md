---
objective: "Implement security for application platform services"
sub_objectives:
  - "Implement and configure security controls for Azure Functions, including authentication and network access"
  - "Implement and configure security controls for Azure Logic Apps"
  - "Implement and configure security controls for Azure App Service"
  - "Implement and configure Azure Web Application Firewall"
  - "Implement security policies for back-end API protection by using API Management"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > App Services / Function App / Front Door and WAF"
powershell_module: "Az.Websites, Az.Functions, Az.Network, Az.ApiManagement"
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: "Medium - WAF requires Application Gateway or Front Door Premium"
free_practice_available: false
forensic_relevance: ""
---

# Serverless, Web, and API Security

> **Objective:** Implement security for application platform services
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Implement and configure security controls for Azure Functions, including authentication and network access
- Implement and configure security controls for Azure Logic Apps
- Implement and configure security controls for Azure App Service
- Implement and configure Azure Web Application Firewall
- Implement security policies for back-end API protection by using API Management

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

See [03-06 lab](../../labs/03-secure-compute/03-06-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->