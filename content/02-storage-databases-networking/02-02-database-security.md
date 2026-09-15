---
objective: "Implement security for databases"
sub_objectives:
  - "Implement platform-level security configurations in Azure SQL"
  - "Configure database auditing for Azure SQL Database and Azure SQL Managed Instance"
  - "Configure Defender for Databases protection across Azure database services"
domain: "Secure storage, databases, and networking"
domain_weight: "25-30%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > SQL databases"
powershell_module: "Az.Sql"
az_cli_command: ""
kql_tables: []
licensing: "Defender for Databases plan"
azure_resources: []
lab_cost_estimate: "Medium - avoid SQL Managed Instance; use Azure SQL Database serverless"
free_practice_available: false
forensic_relevance: ""
---

# Database Security

> **Objective:** Implement security for databases
> **Domain:** Secure storage, databases, and networking (25-30%)

## Sub-objectives covered

- Implement platform-level security configurations in Azure SQL
- Configure database auditing for Azure SQL Database and Azure SQL Managed Instance
- Configure Defender for Databases protection across Azure database services

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

See [02-02 lab](../../labs/02-storage-databases-networking/02-02-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->