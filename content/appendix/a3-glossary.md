---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs: []
last_verified: "2026-09-17"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "Most of the entries below are pairs rather than single terms, because the exam - and an incident - turn on distinguishing two things that sound alike. Knowing that a private endpoint is inbound and VNet integration is outbound is what stops an hour being spent on the wrong half of a problem."
---

# Glossary

> **Organised by distinction, not alphabetically.** Almost every term SC-500 tests is one half of
> a pair that sounds interchangeable and is not. Learning them as pairs is how they stick, and it
> is how the questions are written.

## Identity and access

**Eligible vs active (PIM)** - *Eligible* means you are permitted to hold a role; your token
contains nothing. *Active* means you hold it now. Activation **mints a new assignment** rather
than flipping a flag, which is why both activation and deactivation are requests that leave an
audit record. → [00-02](../00-lab-safety/00-02-pim-just-in-time-lab-access.md)

**App registration vs enterprise application** - The registration is the `application` object,
the definition, existing once in the home tenant. The enterprise app is the `servicePrincipal`,
the local instance, one per tenant. They **share the `appId`** and have different object IDs. You
*request* permissions on the registration and *hold* them on the service principal. →
[01-01](../01-identity-access-governance/01-01-entra-id-secure-access.md)

**Delegated vs application permission** - Delegated: the app acts for a signed-in user, and
effective access is the **intersection** of the grant and the user's own rights. Application: no
user, so nothing to intersect with - `Mail.Read` means every mailbox. Application permissions
always require admin consent. → 01-01

**`oauth2PermissionGrant` vs `appRoleAssignment`** - The durable objects consent creates:
delegated consent produces the first, application consent the second. These are the artifacts an
investigation pulls. → 01-01

**System-assigned vs user-assigned managed identity** - System-assigned is tied to one resource
and deleted with it. User-assigned is a standalone Azure resource, attachable to many, surviving
independently. Enabling either **grants nothing** until a role is assigned. → 01-01

**Authentication strength** - A named set of acceptable authentication method combinations
(MFA, passwordless MFA, phishing-resistant MFA, or custom) that a Conditional Access grant
control can require instead of generic "require MFA". → 01-01

**Report-only vs What If** - Report-only fully evaluates a live sign-in and writes the result to
the log without enforcing. What If simulates a hypothetical sign-in with no real sign-in
occurring - and **does not evaluate service dependencies**. → 01-01

## Governance

**Exclusion vs exemption (Azure Policy)** - An exclusion removes a scope from an assignment
entirely. An **exemption** is a separate, auditable object with a justification and an expiry
that leaves the assignment in place. Questions mentioning documented justification or a time
limit want an exemption. → [01-03](../01-identity-access-governance/01-03-governance-and-regulatory-compliance.md)

**`Deny` vs `DeployIfNotExists`/`Modify`** - `Deny` blocks create and update requests and
changes nothing that already exists. `Modify` and `DeployIfNotExists` remediate existing
resources, need a **managed identity**, and require a remediation task to act. → 01-03

**`DenyAction`** - Blocks a specific *operation* rather than a property value - canonically,
deletion. → 01-03

**`NotActions`** - A **subtraction** within one role definition, **not a deny**. Another
assignment granting the same operation still grants it. → 01-03

**`CanNotDelete` vs `ReadOnly` lock** - Both are **control-plane** controls and apply to
everyone including Owner. `ReadOnly` also breaks operations implemented as POST - listing storage
account keys being the standard example - which is why it causes more outages than it prevents.
→ 01-03

**Resource Guard / multi-user authorization** - A separate Azure resource gating critical Azure
Backup operations. It only protects against attack if it lives where the vault's administrator
cannot reach it - a different subscription, ideally a different tenant. → 01-03

## Data services

**Control plane vs data plane** - The distinction behind most of Domain 2. Control plane is
Azure Resource Manager (configuration, governed by Azure RBAC, **not filtered by a resource
firewall**). Data plane is the service's own endpoint (the actual keys, secrets, blobs, rows,
and **is** filtered). → [01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md)

**Account SAS vs service SAS vs user delegation SAS** - The first two are signed with the
**account key** and die only when it is rotated - unless a service SAS references a **stored
access policy**, which can be changed to revoke it. A **user delegation SAS** is signed with an
Entra-issued key, is attributable, cannot exceed the principal's own RBAC, and lives at most
seven days. → [02-01](../02-storage-databases-networking/02-01-storage-account-security.md)

**`AllowSharedKeyAccess = false`** - Disables shared key **and** account and service SAS, because
both are signed with the account key. Leaves Entra authorisation and user delegation SAS. Also
closes the `listKeys` path that makes Contributor a data-plane role. → 02-01

**Key Vault Reader vs Key Vault Secrets User** - Reader sees that a secret exists; Secrets User
sees what is in it. A favourite exam pairing. → 01-02

**Dynamic Data Masking vs Always Encrypted** - DDM masks values in the result set and is **not a
security boundary** - a `WHERE` clause recovers the value one predicate at a time. Always
Encrypted keeps keys client-side so the server never sees plaintext, which is what protects data
from the database administrator. → [02-02](../02-storage-databases-networking/02-02-database-security.md)

**Server-level vs database-level auditing** - A server policy covers every database including
future ones. A database policy on top runs **side by side**, producing duplicate records and
duplicate ingestion cost. → 02-02

**Express vs classic (SQL vulnerability assessment)** - Express needs no storage account,
applies baselines without rescanning, and is enabled automatically with the plan. **If the
configuration pane asks for a storage account, you are on classic.** → 02-02

## Networking

**Service endpoint vs private endpoint** - A service endpoint is a route; the service keeps its
public IP and the whole service in a region is reachable. A **private endpoint** is a network
interface in your subnet with a private IP, pointing at **one named resource**, reachable from
on-premises over VPN or ExpressRoute. → [02-04](../02-storage-databases-networking/02-04-private-access-and-perimeter.md)

**Private endpoint vs VNet integration (App Service)** - Private endpoint is **inbound**; VNet
integration is **outbound**. Routinely conflated. → [03-06](../03-secure-compute/03-06-app-platform-serverless-web-and-apis.md)

**Security admin rule vs NSG rule** - Security admin rules come from Azure Virtual Network
Manager, apply at the **virtual network** level, and are **evaluated before NSGs**. Actions:
`Allow` (NSGs still evaluated), `AlwaysAllow` (NSGs cannot deny), `Deny` (no NSG can permit). →
[02-03](../02-storage-databases-networking/02-03-network-segmentation-and-connectivity.md)

**Azure Firewall rule processing** - Threat intelligence first, then **DNAT → network →
application**, always in that order regardless of priority or policy inheritance. A network rule
match **stops processing**, which silently bypasses FQDN filtering. → 02-04

**Detection vs prevention (WAF)** - Policies start in **Detection**, which logs and blocks
nothing. "Configured but attacks succeeded" is usually this. → 03-06

**WAF exclusion vs disabling a rule** - An exclusion omits one request attribute from
evaluation; disabling stops the rule protecting everything. **Changing rule set version resets
all enabled/disabled customisations.** → 03-06

## Compute

**Encryption at host vs Azure Disk Encryption** - Encryption at host runs on the host before data
reaches storage, covers temp disks and caches, needs no in-guest agent, and requires the VM to be
**deallocated** to enable. ADE runs inside the guest (BitLocker/DM-Crypt) and requires a Key
Vault. → [03-04](../03-secure-compute/03-04-servers-and-virtual-machines.md)

**Secure Boot vs vTPM vs integrity monitoring** - Secure Boot **prevents** unsigned boot
components loading. The vTPM **measures** the boot chain. Integrity monitoring **attests** those
measurements remotely and raises a Defender for Cloud alert on failure. Detection questions want
the third. Together they are the VM's **security type** - trusted launch, now the **default for
new Gen2 VMs**. → 03-04

**Agentless vs agent-based scanning** - Agentless snapshots the disk through cloud APIs: no
agent, no connectivity, no performance impact, and **no real-time behavioural signal**. The agent
provides EDR. Complementary, not alternatives. → 03-04

**Defender for Servers Plan 1 vs Plan 2** - Plan 1 is **EDR**. Plan 2 adds agentless scanning,
file integrity monitoring, OS configuration assessment, and **just-in-time VM access**. FIM is the
one Plan 2 feature **not enabled by default**. → 03-04

**Bastion vs JIT** - Bastion removes the public IP. JIT keeps the port closed until requested and
closes it automatically. Complementary; the strongest answer usually uses both. → 03-04

**Binary drift** - A process running inside a container that did not come from its image. A
near-definitional compromise signal in a container, unlike on a VM. Detection and **blocking** are
separate settings. → [03-05](../03-secure-compute/03-05-app-platform-containers.md)

**AKS local accounts** - Enabled by default; `--admin` is a **non-auditable backdoor even with
Entra integration and RBAC enabled**. Disabling on an existing cluster requires **rotating cluster
certificates**. → 03-05

**Kubernetes RBAC vs Azure RBAC for Kubernetes** - The first defines permissions in cluster
manifests, disconnected from Entra. The second expresses them as **Azure role assignments**,
subject to PIM and Conditional Access, and they disappear when the person leaves. → 03-05

## AI security

**XPIA vs UPIA** - **Cross-prompt injection**: malicious instructions inside content the agent
*reads* (a document, a page). **User prompt injection**: the same trick from the person talking to
it. Neither compromises a credential, and no Domain 1 control addresses either. →
[03-02](../03-secure-compute/03-02-ai-agent-identity-and-governance.md)

**Blast radius (Agent ID)** - What an agent could reach **if its instructions were subverted** -
its permissions, tools and connectors, grounding sources, and for on-behalf-of agents the
delegated user's permissions. Not credential compromise. → 03-02

**Agent identity blueprint vs agent identity vs agent user** - The blueprint is the definition and
**cannot act**; the agent identity performs agentic tasks; the agent user is a user-shaped
identity. Policy applied at the blueprint is inherited. → 03-02

**On-behalf-of vs autonomous agent** - OBO acts with the signed-in user's identity and
permissions; autonomous has no user context, so whatever the agent identity holds is the whole of
its reach. → 03-02

**Prompt Shields vs content filters** - Prompt Shields detects an **attack**; content filters
govern **content**. An indirect injection in a retrieved document is not a harm-category problem.
→ [03-03](../03-secure-compute/03-03-ai-platform-and-workload-protection.md)

**Restricted Content Discovery vs Restricted Access Control** - RCD stops a site surfacing in
Copilot and org-wide search and **changes no permissions**. RAC limits a site to named groups and
**overrides existing permissions and sharing links**. → [03-01](../03-secure-compute/03-01-ai-data-exposure-and-purview-dspm.md)

**Collection policy** - The Purview policy without which **no Copilot prompt or response content
is recorded**. Off by default. Its Azure equivalent is Defender's **suspicious prompt evidence**
extension. → 03-01, 03-03

## Posture and operations

**Recommendation vs attack path** - A recommendation is one finding. An **attack path** is a
chain - exposure plus vulnerability plus identity plus permission - assembled from the security
graph, and it is what turns a list into a priority. Requires **Defender CSPM**. →
[04-01](../04-security-posture/04-01-defender-for-cloud-posture.md)

**Foundational vs Defender CSPM** - Foundational is free: assessment, recommendations, secure
score, MCSB. Defender CSPM adds attack paths, cloud security explorer, agentless scanning,
governance rules, and additional compliance standards. **Foundational becomes opt-in for new
subscriptions from 27 October 2026.** → 04-01

**Automation rule vs playbook** - The rule is the **routing layer** (trigger, conditions, order,
suppression). The playbook is the **action layer** - a Logic App. Sentinel needs **Microsoft
Sentinel Automation Contributor** on the playbook's resource group to run it. →
[04-04](../04-security-posture/04-04-sentinel-automation-retention-and-audit.md)

**Sentinel Reader / Responder / Contributor** - Reader views. **Responder** manages incidents.
Contributor edits rules and content. Analysts get Responder. → [04-02](../04-security-posture/04-02-sentinel-workspace-roles-and-content.md)

**Resource-context vs table-level RBAC** - Resource-context: a workload owner sees rows about
their own resources. Table-level: access to specific tables. → 04-02

**Interactive vs total retention** - Interactive is queryable at full speed and available to
analytics rules. Total includes long-term storage, which is **retained but not queryable** - a
**search job** or **restore** is required, and both cost money. → 04-04

**Solution vs active rule (content hub)** - Installing a solution delivers analytics rule
**templates**. Nothing detects anything until you create an **active rule** from one. → 04-02

**MailItemsAccessed** - An Audit (Premium) mailbox action recording that mail data was accessed,
**even with no explicit signal messages were read**, with bind or sync access type. It is what
scopes a mailbox compromise, and it is generated **only for licensed users**. → 04-04

**Copilot owner vs Copilot contributor** - Platform roles, **not Entra ID roles**. Every user in
the tenant is a **Copilot contributor by default**. Neither grants access to underlying security
data - the user still needs the service role for each plugin. →
[04-05](../04-security-posture/04-05-security-copilot.md)

**SCU (Security Compute Unit)** - Security Copilot's capacity unit, provisioned as an Azure
resource and **billed hourly while provisioned, used or not**. → 04-05

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Definitions throughout are drawn from the product documentation cited in each module's own
  Sources block.
