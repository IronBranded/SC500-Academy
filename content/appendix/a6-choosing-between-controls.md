---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview"
  - "https://learn.microsoft.com/azure/virtual-network-manager/concept-security-admins"
  - "https://learn.microsoft.com/azure/firewall/rule-processing"
  - "https://learn.microsoft.com/azure/private-link/private-endpoint-overview"
  - "https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview"
  - "https://learn.microsoft.com/azure/key-vault/general/rbac-access-policy"
  - "https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management"
  - "https://learn.microsoft.com/azure/storage/common/authorize-data-access"
  - "https://learn.microsoft.com/azure/azure-monitor/essentials/data-collection-rule-overview"
  - "https://learn.microsoft.com/azure/sentinel/manage-data-overview"
  - "https://learn.microsoft.com/azure/defender-for-cloud/ai-threat-protection"
  - "https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities"
last_verified: "2026-09-20"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "An investigation almost never asks 'was Azure Firewall configured'. It asks 'which of the six controls in this path should have stopped this, and why did none of them'. The tables below are the same tables you build in your head during a triage call, written down before you need them."
---

# Choosing Between Overlapping Controls

> **Why this appendix exists.** The skills-measured outline is organised by *service*, so this
> guide is too: one module per objective, each teaching its own control properly. The exam is
> organised by *choice*. A question stem describes a requirement and offers four controls that
> could all plausibly satisfy something near it, and the mark goes to the one that satisfies
> exactly it.
>
> That layer lives nowhere in a service-shaped guide, because it is not about any single service.
> It is here.
>
> **This appendix is a cross-reference, not a source.** Every claim below is taught properly, with
> its Microsoft Learn citation, in the module named beside it. If this appendix and a module
> disagree, the module is right and this file has drifted - fix it here.

## How to read each section

Each one is a question the exam asks in disguise. You get the comparison table, then **the trap**:
the wrong answer that is attractive because it is *nearly* right. The traps are the point. Anyone
can learn what Azure Firewall does; the marks are in knowing why it is not the answer to an
inbound HTTP question.

Read this once after Domain 2, then again in the week before the exam. It is also the fastest
review pass in the repository: cover the right-hand column and explain each row out loud.

---

## 1. Network path: which control blocks this traffic?

**Modules 02-03, 02-04.**

| Control | Sits where | Understands | Choose it when |
| --- | --- | --- | --- |
| **NSG** | subnet or NIC | 5-tuple, service tags, ASGs | Default east-west filtering inside a VNet; per-NIC exceptions |
| **ASG** | a grouping construct referenced *by* NSG rules | NIC membership | You want rules written by role (`web`, `db`) rather than by IP range |
| **Virtual Network Manager security admin rules** | a management scope above many VNets | the same 5-tuple grammar as an NSG | A rule a subscription owner **must not be able to override** with their own NSG |
| **Azure Firewall** | centrally, usually a hub VNet or Virtual WAN hub | L3-L7: FQDNs, FQDN tags, web categories, threat intelligence; IDPS and TLS inspection on Premium | Egress control, FQDN filtering, one logging point for many VNets |
| **Web Application Firewall** | in front of one web front end, on Application Gateway or Front Door | HTTP: managed rule sets, custom rules, bot rules | Inbound attacks against a web application |
| **DDoS Protection** | public IP or VNet | traffic volume and shape | Volumetric availability attacks |

Three facts the stems turn on:

- **NSG defaults.** Inbound: VNet traffic allowed, Azure Load Balancer allowed, everything else
  denied. Outbound: VNet and internet allowed, everything else denied. Rules are evaluated by
  priority, lowest number first, and the first match wins.
- **Security admin rules are evaluated before NSGs.** That ordering is the entire reason the
  feature exists. `Allow` lets the NSG still have its say; `Deny` and `AlwaysAllow` do not.
- **Azure Firewall rule order** is DNAT, then network rules, then application rules, within rule
  collection groups ordered by priority. **A network rule match means application rules are never
  evaluated** - which is why a broad network rule silently defeats a carefully written FQDN rule.

> **The trap.** *"Only allow outbound traffic to `*.contoso.com`"* is never an NSG answer. An NSG
> has no idea what a hostname is; it filters addresses and service tags. Equally, *"block SQL
> injection against the public site"* is never an NSG or Azure Firewall answer, even with Premium
> IDPS - it is WAF. Match the layer the requirement is written in.

---

## 2. Reaching a PaaS resource privately

**Module 02-04.**

| Control | What it actually is | Private IP in your VNet | Scoped to | Works from on-premises |
| --- | --- | --- | --- | --- |
| **Service endpoint** | Your subnet's identity is extended to the service over the Azure backbone; the service firewall then allows that subnet | No | subnet → a service, regionally | No |
| **Private endpoint** | A NIC in your subnet holding a private IP that maps to **one specific resource** | Yes | a resource, or a sub-resource such as `blob` | Yes, over VPN or ExpressRoute |
| **Private Link service** | The mirror image: you publish *your own* service behind a Standard Load Balancer so other people's private endpoints can reach it | consumer side gets one | your service, across tenants | n/a |
| **Entra Private Access** | Identity-centric access to private apps for users, through connectors, as part of Global Secure Access | No | user → application | Yes, that is the point |

> **The trap, and it is the most common one in this domain.** A service endpoint **does not give
> you a private IP and does not remove the public endpoint**. Traffic still goes to the service's
> public endpoint; it is simply sourced from a recognised subnet. Any stem containing *"from
> on-premises"*, *"a private IP address"*, or *"resolve to a private address"* is a private
> endpoint question.
>
> Second trap: creating a private endpoint **does not disable the public endpoint**. That is a
> separate setting (`Public network access`). A stem saying *"traffic must not be reachable from
> the internet"* needs both.
>
> Third: private endpoints need DNS. Without the `privatelink` zone linked to the VNet, the name
> still resolves publicly and nothing appears broken until traffic goes the wrong way.

---

## 3. Administrative access to a VM

**Modules 03-04, 02-04.**

| Control | Removes the public IP | Removes the open port | Requires an agent | Costs while idle |
| --- | --- | --- | --- | --- |
| **Azure Bastion** | Yes - browser RDP/SSH over TLS to a private IP | Yes | No | **Yes - hourly, per host** |
| **Just-in-time VM access** | No | Only outside the approved window; the NSG/firewall rule is opened on request and closed after | Defender for Servers | Plan cost only |
| **Entra Private Access** | For user access to internal apps and, with Quick Access, RDP/SSH to private hosts | Yes, from the internet's point of view | Connector | Licensing |
| **Public IP + NSG source restriction** | No | No, just narrows it | No | Trivial |

> **The trap.** JIT and Bastion solve *different halves* of the same problem and the exam tests
> that they compose. Bastion removes the public IP; JIT removes the standing allow rule. A stem
> requiring both "no public IP" and "time-bound approved access with an audit trail" wants both
> controls, and the JIT half is what produces the approval record.

---

## 4. Key Vault: who can read this secret?

**Module 01-02.**

| Question | Answer |
| --- | --- |
| Which permission model? | **Azure RBAC** for new work. It is the current recommendation, it is scopable down to an individual secret, it is auditable through the same activity log as everything else in ARM, and it is what PIM can make eligible. Access policies remain supported, are vault-wide, and are per-principal lists |
| Can I run both? | No. The vault has one permission model at a time, and switching it changes who has access immediately |
| Who can read secrets by default? | Nobody, by virtue of being subscription Owner. Management-plane roles do not grant data-plane access - though an Owner can grant themselves one |
| How do I keep a deleted vault recoverable? | **Soft delete is always on and cannot be turned off.** Purge protection is opt-in, and **once enabled it cannot be disabled** |
| How do I restrict the network? | Firewall with selected networks, trusted Microsoft services exception, or a private endpoint plus `Public network access: Disabled` |
| How do I find secrets *outside* the vault? | **Defender CSPM secrets scanning** - it inspects VM disks and code for plaintext credentials |
| How do I detect abuse *of* the vault? | **Defender for Key Vault**, a workload protection plan producing alerts on anomalous access |

> **The trap.** "Scan for secrets by using Defender CSPM" and "Implement Defender for Key Vault"
> are two separate bullets in the same objective and they do opposite things. CSPM secrets
> scanning is *posture*: find the credential someone pasted into a script. Defender for Key Vault
> is *runtime*: alert when an unusual principal enumerates the vault. If the stem is about
> hardcoded credentials, it is CSPM. If it is about unusual access patterns, it is the plan.
>
> Second trap: Managed HSM is a different resource with its own local RBAC and its own security
> domain, not a Key Vault SKU toggle.

---

## 5. Which identity should this workload use?

**Modules 01-01, 03-02.**

| Identity | Credential you manage | Lives where | Use when |
| --- | --- | --- | --- |
| **System-assigned managed identity** | none | tied to one resource, deleted with it | One resource needs access to another and nothing else should inherit it |
| **User-assigned managed identity** | none | its own resource, reusable | Several resources share an identity, or the identity must survive redeployment |
| **App registration + client secret** | a secret you rotate | directory | Last resort. Something outside Azure, with no federation option |
| **App registration + certificate** | a certificate you rotate | directory | Same, where a secret is unacceptable |
| **Workload identity federation** | none | directory, trusting an external issuer | GitHub Actions, AKS, another cloud - external workloads without a stored secret |
| **Entra Agent ID** | platform-managed | directory, as a first-class agent identity | An AI agent that must be governed like a user: Conditional Access, lifecycle, blast-radius analysis |

> **The trap.** Managed identities only exist for Azure resources. A stem describing a pipeline in
> GitHub or a workload in another cloud is a **workload identity federation** question, and the
> attraction of "create an app registration and store the secret in Key Vault" is exactly what the
> question is testing you to reject: you have not removed the secret, you have moved it.
>
> Also know the three-way distinction the outline names directly: an **app registration** is the
> application object in its home tenant; an **enterprise application** is the service principal
> instance in a tenant; **consent and permission grants** are what that service principal is
> allowed to do on a user's behalf.

---

## 6. Which authorization system is the question about?

**Modules 01-01, 01-03, 04-02.**

| System | Governs | Assigned at | Under PIM |
| --- | --- | --- | --- |
| **Microsoft Entra roles** | the directory: users, groups, apps, tenant settings | tenant, or administrative unit | Yes |
| **Azure RBAC** | ARM: subscriptions, resource groups, resources | management group → resource | Yes, as Azure resource roles |
| **Data-plane RBAC** | contents: blobs, secrets, queues | the resource or below | Through the Azure role assignment |
| **Microsoft Sentinel roles** | the Sentinel workspace: Reader, Responder, Contributor | workspace resource, as Azure RBAC | Via the Azure resource role |
| **Defender for Cloud roles** | posture and plans: Security Reader, Security Admin | subscription | Via the Azure resource role |
| **Purview / Defender XDR roles** | compliance and XDR workloads | their own portals | Varies by workload |

> **The trap.** Global Administrator grants **no** access to Azure resources. The bridge is the
> *elevate access* toggle, which assigns User Access Administrator at the root scope - and that is
> the answer to "an administrator cannot see any subscriptions", not "assign them Owner".
>
> Second trap, specific to Sentinel: workspace access is Azure RBAC on the workspace resource, so
> a Log Analytics Contributor can do things a Sentinel Responder cannot. Least privilege here
> means picking the Sentinel-specific role, not the generic one.

---

## 7. Governance: which control actually stops the change?

**Module 01-03.**

| Requirement | Control | Why not the others |
| --- | --- | --- |
| This resource type may never be created without encryption | **Azure Policy**, `deny` effect | RBAC can only remove the ability to create *anything* |
| Report on non-compliance without blocking | Azure Policy, `audit` | |
| Fix drift automatically | Azure Policy, `deployIfNotExists` or `modify` | |
| This person may not do this at all | **Azure RBAC** | Policy does not know who is asking |
| Nobody may delete this resource, including its owner | **Resource lock** (`CanNotDelete`) | RBAC can be changed by whoever holds the rights to change it |
| Nobody may change this resource | Resource lock (`ReadOnly`) - carefully | It blocks far more than people expect, including some read operations implemented as POST |
| Backups must survive a malicious administrator | **Immutable vault + soft delete + multi-user authorization** via a Resource Guard | Locks do not reach backup policy semantics |

> **The trap.** Locks are management-plane only. A `CanNotDelete` lock on a storage account does
> nothing whatsoever to the blobs inside it - that is versioning, soft delete for blobs, or an
> immutability policy. Any stem about protecting *data* rather than *the resource object* is not a
> lock question.
>
> Backup's multi-user authorization is the exam's favourite answer to "prevent a compromised
> Backup admin from shortening retention", because it is the only one that requires a second
> principal in a different directory scope to approve.

---

## 8. Defender for Cloud: which layer is being described?

**Modules 04-01, 01-03.**

| Layer | Costs | Produces | Stem language |
| --- | --- | --- | --- |
| **Foundational CSPM** | free, on by default | recommendations, secure score, asset inventory, regulatory compliance against the default standard | "identify misconfigurations", "secure score" |
| **Defender CSPM** | paid | attack paths, cloud security explorer, agentless scanning, **secrets scanning**, data-aware posture, governance rules | "attack path", "which internet-facing VM can reach the storage account", "find exposed secrets" |
| **Workload protection plans** | paid, per resource per hour | **alerts** - runtime detections for Servers, Storage, Databases, Containers, Key Vault, AI services | "detect", "alert when", "someone is attacking" |
| **Defender Vulnerability Management** | with Defender for Servers | CVE findings on machines, software inventory | "vulnerability assessment on the VM" |
| **External Attack Surface Management** | separate resource, paid | internet-facing assets **you did not know you owned** | "discover unmanaged/unknown assets", "from the attacker's view" |

> **The trap.** Recommendation, attack path, and alert are three different objects from three
> different price points, and the stem always contains exactly one of them. A *recommendation* is
> free. An *attack path* requires Defender CSPM. An *alert* requires the workload plan for that
> resource type. If you can classify the noun, you have the answer without knowing anything else.
>
> EASM's distinguishing word is always **unknown or unmanaged**. Defender CSPM sees your
> inventory; EASM finds what is not in it.

---

## 9. Storage: "restrict access" has six different answers

**Module 02-01.**

| Requirement | Control |
| --- | --- |
| Identity-based access with Entra roles and full audit | **Azure RBAC data roles**, e.g. Storage Blob Data Reader, and `AllowSharedKeyAccess = false` to force it |
| Short-lived delegated access, revocable, tied to an identity | **User delegation SAS** - signed with Entra credentials, revoked by revoking the delegation key |
| Delegated access signed with the account key | Service or account SAS - and see the trap |
| Ability to revoke an issued service SAS without rotating account keys | **Stored access policy**, which the SAS references |
| No anonymous reads anywhere in the account | Disable anonymous blob public access at account level |
| Only reachable from my subnet | Storage firewall with selected networks, plus resource instance rules or the trusted services exception |
| Only reachable from a private IP | **Private endpoint** plus `Public network access: Disabled` |
| Detect exfiltration, malware upload, anomalous access | **Defender for Storage** |

> **The trap.** *"Revoke the SAS token immediately"* is a **stored access policy** question, every
> time, unless the SAS is a user delegation SAS. A service SAS with no stored access policy cannot
> be revoked except by rotating the account key, which invalidates everything else signed with it.
> That difference is precisely why the stored access policy exists and precisely why it is tested.

---

## 10. Azure SQL: four controls that all sound like "protect the data"

**Module 02-02.**

| Control | Protects against | Encrypted where | Can the DBA see the data |
| --- | --- | --- | --- |
| **Transparent Data Encryption** | theft of files, backups, or the underlying media | at rest, transparent to queries | Yes |
| **TDE with customer-managed key** | the same, plus you hold the key in Key Vault and can revoke it | at rest | Yes |
| **Always Encrypted** | anyone with database access, including administrators | client side, keys never reach the engine | **No** |
| **Dynamic data masking** | casual overexposure in query results | nowhere - it masks presentation | Yes, and can often infer the rest |

Around them: Entra-only authentication, server-level versus database-level firewall rules, private
endpoint, **auditing** to Log Analytics, storage, or Event Hubs, and **Defender for Databases**
for vulnerability assessment and runtime alerts.

> **The trap.** Dynamic data masking is not a security boundary and the exam knows it. A stem
> saying *"the DBA must not be able to read the column"* is **Always Encrypted**. A stem saying
> *"support staff should not see full card numbers in the application"* is masking. A stem about
> stolen backup files is TDE.

---

## 11. Telemetry: how does this log reach the workspace?

**Module 04-03.**

| Source | Mechanism |
| --- | --- |
| Azure resource platform logs and metrics | **Diagnostic settings** to the workspace. No agent |
| Azure activity | The Azure Activity connector |
| Windows or Linux events from a machine you control | **Azure Monitor Agent + data collection rule** |
| Windows events from machines you cannot put an agent on | **Windows Event Forwarding** to a collector that runs AMA, with a DCR reading `ForwardedEvents` |
| Syslog from appliances | AMA on a Linux forwarder, DCR selecting facilities and severities |
| CEF | The same forwarder pattern, parsed as CEF |
| Microsoft 365, Entra, Defender XDR | First-party connectors. No DCR, no agent |
| Anything with no connector | **Logs Ingestion API** with a DCR and a custom `_CL` table, or Logstash |

> **The trap.** The Log Analytics agent is retired. Any answer option that installs it, or that
> configures data collection in the workspace's legacy *Agents configuration* blade, is dead
> content - see [A5](./a5-az500-to-sc500-delta.md). Post-migration, **what is collected is
> defined in the DCR**, not on the agent and not in the workspace.
>
> Second trap: "create a custom log table" is a DCR-era task with a `_CL` suffix, and the newer
> table tiers in section 12 only work for DCR-based tables.

---

## 12. Retention: where does this log live, and for how long?

**Module 04-04.** This is the fastest-moving area in Domain 4 - re-verify before the exam.

| Tier | Queryable how | Analytics rules and hunting | Use for |
| --- | --- | --- | --- |
| **Analytics** | full KQL, immediately, at speed | Yes | Detection, investigation, anything a rule runs against |
| **Data lake** | KQL and Spark jobs, summary rules, search jobs - not real-time | **No** | Cheap long-horizon retention, compliance, historical investigation |
| **XDR default** | advanced hunting | Advanced hunting only | Defender XDR hunting data, 30 days, included |
| **Basic / Auxiliary (legacy)** | limited single-table KQL | No | Being folded into the data lake model. Viewable in the Defender portal, still managed from the Log Analytics workspace |

Facts worth holding:

- The analytics tier has **two numbers**: *analytics retention*, the hot state, and *total
  retention*, which is how long the data is kept at all. The default is **30 days**; Microsoft
  Sentinel solution tables can be extended to **90 days at no charge**, and any table to **two
  years** at a prorated long-term retention charge.
- **Data in the analytics tier is mirrored to the data lake by default**, for the same period.
  Extending beyond analytics retention - up to **12 years** - is what costs extra.
- **Switching a table from Analytics to Data Lake stops real-time analytics and hunting queries
  on it.** That is the sentence to remember: it is the cost-versus-detection trade-off the
  objective is really about, and it also limits parsers, watchlists, workbooks and playbooks.
- **Shortening total retention has a 30-day grace period** before data is removed, so a mistake
  is recoverable. Increasing it applies to data already ingested and not yet removed. Changing
  *analytics* retention takes effect immediately.
- **Search jobs run against both tiers. Restore is analytics-tier only** - lake data is promoted
  back by KQL or notebook jobs instead. Both leave something behind that costs money.
- A **Basic Logs table cannot move straight to the lake**: change the plan to Analytics first.

> **The trap.** "Reduce ingestion cost without losing the detection" and "reduce retention cost
> without losing the data" are different questions with different answers. The first is a
> transformation in the DCR, or a different table plan for a noisy source. The second is tiering
> and retention. Moving a table that an analytics rule depends on is the wrong answer to both.

---

## 13. AI security: four products that all sound like the same product

**Modules 03-01, 03-02, 03-03.** This section has no AZ-500 ancestor and no accumulated folklore,
which makes it the highest-value table in this appendix.

| Product | Plane | The question it answers | Configured in |
| --- | --- | --- | --- |
| **Purview DSPM for AI** | data | *What sensitive data are people putting into AI, what is coming back, and which sites overshare to Copilot?* | Purview portal |
| **Defender for AI services** (a Defender for Cloud workload plan) | runtime, on the Azure model APIs | *Is someone jailbreaking, poisoning, or exfiltrating through our models - and can I investigate it with everything else?* | Defender for Cloud → Environment settings → plan toggle |
| **Foundry guardrails** - content filters, Prompt Shields, blocklists | model and inference | *Should this specific prompt or response be blocked at all?* | Foundry, per deployment |
| **AI gateway in API Management** | network and API | *Who may call the model, how much may they spend, and is every call inspected, cached and logged in one place?* | APIM policies |

How they relate, which is the part that gets tested: **Defender for AI services builds on Azure AI
Content Safety Prompt Shields plus Microsoft threat intelligence**, and sends its alerts into
Defender XDR. So Foundry guardrails *block*, and Defender *alerts and correlates* - frequently
about the same event. They are not alternatives.

The APIM policies worth recognising by name: `llm-token-limit` (TPM or a quota per consumer),
`llm-emit-token-metric` (token metrics to Application Insights), `llm-content-safety` (forward
prompts to Content Safety for evaluation at the gateway), and
`llm-semantic-cache-lookup` / `llm-semantic-cache-store` (reuse completions for semantically
similar prompts, which needs a RediSearch-compatible cache).

The rest of the AI surface:

| Requirement | Control |
| --- | --- |
| Find SharePoint sites overexposing content to Copilot | Purview DSPM for AI, with SharePoint oversharing and data access governance reporting |
| Stop a Copilot Studio agent from emitting sensitive content in the moment | **Real-time protection for Copilot Studio agents** |
| Give an agent a governed identity | **Entra Agent ID** |
| Apply Conditional Access to an agent | Conditional Access targeting Agent ID - **check the licensing gate**, it is not Entra ID P2 alone |
| Work out what a compromised agent could have reached | **Blast radius analysis in Defender XDR** |
| Inventory and lifecycle for agents across the tenant | **Microsoft 365 admin center** |
| One board showing AI posture and AI alerts together | **Data and AI security dashboard** in Defender for Cloud |

> **The trap.** Four different products can each be described as "protect the AI app", so read for
> the verb. *Block* is guardrails. *Alert and investigate* is Defender. *Limit, meter, or inspect
> centrally across many apps* is the APIM gateway. *Discover what data is exposed* is Purview.
>
> Second trap: user prompt evidence in Defender for AI services is **opt-in**, because it surfaces
> portions of real prompts. Expect at least one privacy-flavoured stem about who can see that.

---

## 14. The chokepoint test - one idea behind five objectives

**Modules 02-04, 03-03, 03-05, 03-06.**

Five separate objectives, in four modules, are the same sentence wearing different
clothes:

> **A control placed in front of an endpoint is only as good as the guarantee that
> nothing reaches the endpoint another way.**

| The control | How it is bypassed | What restores the guarantee |
| --- | --- | --- |
| API Management policies - `validate-jwt`, rate limits, IP filtering | The backend is directly reachable, so the gateway is advisory | Access restrictions or a private endpoint so the backend accepts traffic only from the gateway |
| `validate-jwt` at the gateway, protecting an app | The app is reached directly | App Service authentication, which validates at the platform in front of the code and cannot be routed around |
| The AI gateway in API Management - token limits, content safety, logging | Applications call the model endpoint directly | The gateway holds the model credentials and the model resource refuses public network access |
| Entra integration and Azure RBAC on an AKS cluster | The local admin credential, enabled by default, bypasses both and is not auditable | Disable local accounts - which on an existing cluster means rotating cluster certificates |
| A private endpoint on a PaaS resource | The public endpoint is still enabled | `Public network access: Disabled`, separately from creating the endpoint |

**Why it earns its own section.** Each of those lives in a different module and is
taught as a property of a different product, so it is easy to learn five facts and
not the shape. A stem that describes a well-configured control producing no effect -
policies that never fire, a WAF that logs nothing, an identity system that someone
walked past - is nearly always this. The question is not "is the control configured"
but "is it in the path".

> **The trap.** The attractive wrong answer is always to strengthen the control that
> was bypassed: a stricter policy, a tighter rule, a better token. None of it matters
> to traffic that never arrives. Look for the alternate path first.

---

## 15. Keyword to control, for the last hour before the exam

| If the stem says | Reach for |
| --- | --- |
| "from on-premises", "a private IP" | Private endpoint |
| "the subnet must be allowed", no mention of private addressing | Service endpoint |
| "by FQDN", "to `*.example.com`" | Azure Firewall application rule |
| "SQL injection", "OWASP", "bot" | WAF |
| "cannot be overridden by the subscription owner" | Virtual Network Manager security admin rule |
| "time-bound", "approval", "port only when needed" | JIT VM access |
| "no public IP", "browser-based RDP" | Bastion |
| "revoke the SAS without rotating keys" | Stored access policy |
| "the DBA must not see it" | Always Encrypted |
| "stolen backup file" | TDE |
| "attack path", "internet-exposed and can reach" | Defender CSPM |
| "assets we did not know we had" | EASM |
| "alert when someone", "detect at runtime" | The workload protection plan for that resource |
| "hardcoded credential in code or on a disk" | Defender CSPM secrets scanning |
| "prevent deletion even by an owner" | Resource lock |
| "prevent creation unless compliant" | Azure Policy deny |
| "a second approver for backup changes" | Multi-user authorization with a Resource Guard |
| "collect Windows Security events" | AMA and a data collection rule |
| "keep it for seven years, we rarely query it" | Data lake tier |
| "block the prompt" | Foundry guardrails and Prompt Shields |
| "alert on the jailbreak, investigate in XDR" | Defender for AI services |
| "one app is consuming all the tokens" | APIM `llm-token-limit` |
| "which SharePoint sites overshare to Copilot" | Purview DSPM for AI |

---

## Sources

- Microsoft Learn - SC-500 study guide: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Network security groups overview: <https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview>
- Virtual Network Manager security admin rules: <https://learn.microsoft.com/azure/virtual-network-manager/concept-security-admins>
- Azure Firewall rule processing logic: <https://learn.microsoft.com/azure/firewall/rule-processing>
- Private endpoint overview: <https://learn.microsoft.com/azure/private-link/private-endpoint-overview>
- Virtual network service endpoints: <https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview>
- Key Vault RBAC versus access policies: <https://learn.microsoft.com/azure/key-vault/general/rbac-access-policy>
- Cloud security posture management in Defender for Cloud: <https://learn.microsoft.com/azure/defender-for-cloud/concept-cloud-security-posture-management>
- Authorize access to data in Azure Storage: <https://learn.microsoft.com/azure/storage/common/authorize-data-access>
- Data collection rules in Azure Monitor: <https://learn.microsoft.com/azure/azure-monitor/essentials/data-collection-rule-overview>
- Manage data tiers and retention in Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/manage-data-overview>
- AI threat protection in Defender for Cloud: <https://learn.microsoft.com/azure/defender-for-cloud/ai-threat-protection>
- Enable threat protection for AI services: <https://learn.microsoft.com/azure/defender-for-cloud/ai-onboarding>
- Manage compliance and security in Microsoft Foundry: <https://learn.microsoft.com/azure/foundry/control-plane/how-to-manage-compliance-security>
- Generative AI gateway capabilities in API Management: <https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities>
