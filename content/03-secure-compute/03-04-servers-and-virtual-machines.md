---
objective: "Implement security for servers and virtual machines (VMs)"
sub_objectives:
  - "Implement and configure disk encryption"
  - "Plan and implement Azure Bastion"
  - "Enable and enforce use of just-in-time (JIT) VM access"
  - "Extend security controls to hybrid and multicloud servers by using Azure Arc"
  - "Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios"
  - "Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)"
  - "Implement and manage agentless scanning for VMs in Defender for Servers"
  - "Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type"
  - "Enforce security configuration of Azure-managed servers by using Azure Machine Configuration"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-15"
portal: "Azure portal > Virtual machines; Defender for Cloud > Environment settings"
powershell_module: "Az.Compute, Az.ConnectedMachine"
az_cli_command: ""
kql_tables: []
licensing: "Defender for Servers Plan 2"
azure_resources: []
lab_cost_estimate: "HIGH - Bastion and Defender for Servers P2 both bill hourly per resource"
free_practice_available: false
forensic_relevance: ""
---

# Server and Virtual Machine Security

> **Objective:** Implement security for servers and virtual machines (VMs)
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Implement and configure disk encryption
- Plan and implement Azure Bastion
- Enable and enforce use of just-in-time (JIT) VM access
- Extend security controls to hybrid and multicloud servers by using Azure Arc
- Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios
- Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)
- Implement and manage agentless scanning for VMs in Defender for Servers
- Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type
- Enforce security configuration of Azure-managed servers by using Azure Machine Configuration

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

See [03-04 lab](../../labs/03-secure-compute/03-04-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500
- <!-- product documentation URLs -->