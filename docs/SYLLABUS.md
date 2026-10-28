# SC-500 Syllabus Map

How the Academy's files map to the official SC-500 skills measured. Outline verified
2026-10-07 against the [study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500)
through the Microsoft Learn MCP server; it was unchanged from the stored snapshot.
The full record, including the per-objective map and the verification log, is
[`docs/OBJECTIVE-VALIDATION.md`](OBJECTIVE-VALIDATION.md). The structured outline is
[`content/skills-measured.json`](../content/skills-measured.json).

## Module 0A · Before we secure the cloud (foundation, not exam content)

Each primer supports the official objectives listed. None claims an exam bullet.

| Primer | Title | File | Supports objectives |
| --- | --- | --- | --- |
| 0A-01 | What the Cloud Is | `content/00a-foundations/0A-01-cloud-computing.md` | 1.2, 1.3, 3.2, 3.3, 4.1 |
| 0A-02 | Azure and Microsoft 365 | `content/00a-foundations/0A-02-azure-and-microsoft-365.md` | 1.1, 3.1, 4.2, 4.3 |
| 0A-03 | Tenants, Subscriptions, and Resources | `content/00a-foundations/0A-03-tenants-subscriptions-resources.md` | 1.3, 4.1, 4.2 |
| 0A-04 | Users, Accounts, and Identities | `content/00a-foundations/0A-04-users-accounts-identities.md` | 1.1, 1.3, 3.1 |
| 0A-05 | Authentication and Authorization | `content/00a-foundations/0A-05-authentication-and-authorization.md` | 1.1, 1.2, 1.3, 2.1, 2.2 |
| 0A-06 | Applications and Workloads | `content/00a-foundations/0A-06-applications-and-workloads.md` | 1.1, 3.2, 3.3 |
| 0A-07 | Networks: Addresses, Subnets, Routing, DNS, and Firewalls | `content/00a-foundations/0A-07-networks.md` | 2.3, 1.2, 2.1 |
| 0A-08 | Public and Private Connectivity | `content/00a-foundations/0A-08-public-and-private-connectivity.md` | 2.3, 1.2, 2.1, 2.2 |
| 0A-09 | Storage and Databases | `content/00a-foundations/0A-09-storage-and-databases.md` | 2.1, 2.2 |
| 0A-10 | APIs | `content/00a-foundations/0A-10-apis.md` | 3.3, 3.1 |
| 0A-11 | Logs and Telemetry | `content/00a-foundations/0A-11-logs-and-telemetry.md` | 4.2, 2.2, 4.1 |
| 0A-12 | Preventive, Detective, Corrective, and Governance Controls | `content/00a-foundations/0A-12-control-types.md` | 1.3, 4.1 |
| 0A-13 | Shared Responsibility | `content/00a-foundations/0A-13-shared-responsibility.md` | 4.1, 3.1, 3.2, 3.3 |
| 0A-14 | Generative AI | `content/00a-foundations/0A-14-generative-ai.md` | 3.1 |
| 0A-15 | AI Models, Prompts, and Outputs | `content/00a-foundations/0A-15-models-prompts-outputs.md` | 3.1 |
| 0A-16 | AI Agents and Connected Tools | `content/00a-foundations/0A-16-ai-agents-and-tools.md` | 3.1, 4.3 |
| 0A-17 | How Microsoft Cloud Security Fits Together | `content/00a-foundations/0A-17-how-it-fits-together.md` | 1.1, 1.3, 2.3, 4.1, 4.2 |

## Module 0B · Safe lab foundations (project prerequisite)

| Module | Title | Objective | File | Lab |
| --- | --- | --- | --- | --- |
| 00-00 | Module Overview: Lab Topology and Conventions | (Project prerequisite - not an SC-500 exam objective) | `content/00-lab-safety/00-00-module-overview.md` | — |
| 00-01 | Cost Guardrails and Budget Alerts | (Project prerequisite - not an SC-500 exam objective) | `content/00-lab-safety/00-01-cost-guardrails-and-budgets.md` | `labs/00-lab-safety/00-01-lab.md` |
| 00-02 | PIM-Based Just-in-Time Lab Access | (Project prerequisite - doubles as practice for 01-01) | `content/00-lab-safety/00-02-pim-just-in-time-lab-access.md` | `labs/00-lab-safety/00-02-lab.md` |
| 00-03 | Reusable Teardown Checklist | (Project prerequisite - not an SC-500 exam objective) | `content/00-lab-safety/00-03-teardown-checklist-template.md` | — |

## SC-500 exam lessons

| Module | Objective (verbatim) | File | Lab | Domain | Weight | Bullets |
| --- | --- | --- | --- | --- | --- | --- |
| 01-01 | Secure access to resources by using Microsoft Entra ID | `content/01-identity-access-governance/01-01-entra-id-secure-access.md` | `labs/01-identity-access-governance/01-01-lab.md` | Manage identity, access, and governance | 20-25% | 6 |
| 01-02 | Secure secrets and keys by using Azure Key Vault | `content/01-identity-access-governance/01-02-key-vault-secrets-and-keys.md` | `labs/01-identity-access-governance/01-02-lab.md` | Manage identity, access, and governance | 20-25% | 7 |
| 01-03 | Implement governance to enforce security and regulatory compliance | `content/01-identity-access-governance/01-03-governance-and-regulatory-compliance.md` | `labs/01-identity-access-governance/01-03-lab.md` | Manage identity, access, and governance | 20-25% | 9 |
| 02-01 | Implement security for storage accounts | `content/02-storage-databases-networking/02-01-storage-account-security.md` | `labs/02-storage-databases-networking/02-01-lab.md` | Secure storage, databases, and networking | 25-30% | 4 |
| 02-02 | Implement security for databases | `content/02-storage-databases-networking/02-02-database-security.md` | `labs/02-storage-databases-networking/02-02-lab.md` | Secure storage, databases, and networking | 25-30% | 3 |
| 02-03 | Implement security for Azure network services | `content/02-storage-databases-networking/02-03-network-segmentation-and-connectivity.md` | `labs/02-storage-databases-networking/02-03-lab.md` | Secure storage, databases, and networking | 25-30% | 4 |
| 02-04 | Implement security for Azure network services | `content/02-storage-databases-networking/02-04-private-access-and-perimeter.md` | `labs/02-storage-databases-networking/02-04-lab.md` | Secure storage, databases, and networking | 25-30% | 5 |
| 03-01 | Implement security for AI | `content/03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md` | `labs/03-secure-compute/03-01-lab.md` | Secure compute | 20-25% | 2 |
| 03-02 | Implement security for AI | `content/03-secure-compute/03-02-ai-agent-identity-and-governance.md` | `labs/03-secure-compute/03-02-lab.md` | Secure compute | 20-25% | 5 |
| 03-03 | Implement security for AI | `content/03-secure-compute/03-03-ai-platform-and-workload-protection.md` | `labs/03-secure-compute/03-03-lab.md` | Secure compute | 20-25% | 4 |
| 03-04 | Implement security for servers and virtual machines (VMs) | `content/03-secure-compute/03-04-servers-and-virtual-machines.md` | `labs/03-secure-compute/03-04-lab.md` | Secure compute | 20-25% | 9 |
| 03-05 | Implement security for application platform services | `content/03-secure-compute/03-05-app-platform-containers.md` | `labs/03-secure-compute/03-05-lab.md` | Secure compute | 20-25% | 4 |
| 03-06 | Implement security for application platform services | `content/03-secure-compute/03-06-app-platform-serverless-web-and-apis.md` | `labs/03-secure-compute/03-06-lab.md` | Secure compute | 20-25% | 5 |
| 04-01 | Manage security posture by using Defender for Cloud | `content/04-security-posture/04-01-defender-for-cloud-posture.md` | `labs/04-security-posture/04-01-lab.md` | Manage and monitor security posture | 20-25% | 6 |
| 04-02 | Implement activity and event collection in Microsoft Sentinel | `content/04-security-posture/04-02-sentinel-workspace-roles-and-content.md` | `labs/04-security-posture/04-02-lab.md` | Manage and monitor security posture | 20-25% | 3 |
| 04-03 | Implement activity and event collection in Microsoft Sentinel | `content/04-security-posture/04-03-sentinel-data-connectors-and-collection.md` | `labs/04-security-posture/04-03-lab.md` | Manage and monitor security posture | 20-25% | 4 |
| 04-04 | Implement activity and event collection in Microsoft Sentinel | `content/04-security-posture/04-04-sentinel-automation-retention-and-audit.md` | `labs/04-security-posture/04-04-lab.md` | Manage and monitor security posture | 20-25% | 3 |
| 04-05 | Implement Microsoft Security Copilot | `content/04-security-posture/04-05-security-copilot.md` | `labs/04-security-posture/04-05-lab.md` | Manage and monitor security posture | 20-25% | 4 |

**Totals:** 18 exam lessons claiming 87 verbatim sub-objectives (the
whole outline), 4 lab-safety modules, 17 foundation primers,
and 19 structured comparisons in
`content/comparisons.json`.
