---
objective: "Implement security for application platform services"
sub_objectives:
  - "Detect misconfigurations and runtime risks in container workloads by using Defender for Containers"
  - "Implement and configure security controls for Azure Kubernetes Service (AKS)"
  - "Implement and configure security controls for Azure Container Registry"
  - "Implement and configure security controls for Azure Container Instances and Azure Container Apps"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > Kubernetes services / Container registries"
powershell_module: "Az.Aks, Az.ContainerRegistry"
az_cli_command: ""
kql_tables: []
licensing: "Defender for Containers plan"
azure_resources: []
lab_cost_estimate: "Medium-HIGH - AKS node pool bills continuously; tear down same day"
free_practice_available: false
forensic_relevance: ""
---

# Container Platform Security

> **Objective:** Implement security for application platform services
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Detect misconfigurations and runtime risks in container workloads by using Defender for Containers
- Implement and configure security controls for Azure Kubernetes Service (AKS)
- Implement and configure security controls for Azure Container Registry
- Implement and configure security controls for Azure Container Instances and Azure Container Apps

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

See [03-05 lab](../../labs/03-secure-compute/03-05-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->