---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/ddos-protection/"
  - "https://learn.microsoft.com/azure/application-gateway/"
  - "https://learn.microsoft.com/azure/frontdoor/"
  - "https://learn.microsoft.com/azure/firewall-manager/"
  - "https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoint-policies-overview"
  - "https://learn.microsoft.com/azure/storage/files/"
  - "https://learn.microsoft.com/azure/security/develop/threat-modeling-tool"
  - "https://learn.microsoft.com/azure/azure-monitor/"
last_verified: "2026-09-20"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: true
forensic_relevance: "The gap between 'what the outline enumerates' and 'what the platform actually puts in the path' is where real incidents live too. A control nobody wrote down is a control nobody reviews."
---

# Related Topics With No Skills-Measured Bullet

> **Read the coverage rule first.** This guide's contract is the **87 verbatim sub-objectives**,
> each owned by exactly one exam module and checked by the validator. **Nothing in this appendix counts
> toward that contract, and nothing here may be cited as covering an objective.** It exists
> because of one sentence Microsoft puts on the study guide itself:
>
> > The bullets that follow each of the skills measured are intended to illustrate how we are
> > assessing that skill. Related topics may be covered in the exam.
>
> Everything below is a service **Microsoft links from the SC-500 study guide's own documentation
> table** while giving it no bullet. That is the line this appendix draws, and it is drawn there
> deliberately: it is the only defensible definition of "adjacent" that is not guesswork.

## A caution about the source of this list

The study guide's documentation table is partly inherited. Its "Find a video" row still points at
the Exam Readiness Zone **filtered to AZ-500**, which tells you the page was built from the AZ-500
one rather than assembled from scratch. So treat the linked-documentation table as a weak signal
in both directions: some entries are genuine adjacency, some are legacy that nobody pruned.

Study these **after** the 87, never instead of them, and at recognition depth - enough to identify
the service in a stem and know what distinguishes it - not at lab depth.

---

## 1. Azure DDoS Protection

**Adjacent to 02-03.** The highest-probability item in this appendix, because DDoS is the only
control in the network chapter with a whole documentation set linked and no bullet at all.

- **Two paid SKUs**: **Network Protection**, enabled per virtual network and covering all public
  IPs in it; **IP Protection**, enabled per public IP address, for a small number of addresses.
- **DDoS Infrastructure Protection** is always on for the platform at no cost, but it protects
  Azure, not your application's availability thresholds.
- Paid tiers add adaptive tuning to your traffic, attack telemetry and mitigation reports,
  and access to the rapid response team.
- It is an L3/L4 volumetric control. It does not read HTTP, which is where WAF starts.

**Recognise it by:** "volumetric", "availability", "flood", "per virtual network".

## 2. Azure Application Gateway

**Adjacent to 02-03 and 03-06.** The regional L7 load balancer that **hosts** one of the two WAF
deployments the outline does test.

- WAF is a feature *on* Application Gateway (regional) or *on* Front Door (global). The WAF bullet
  is in scope; choosing between the two hosts is the adjacency.
- Terminates TLS, so it is where end-to-end TLS, listener certificates, and Key Vault certificate
  integration appear.
- Back-end pool health probes and rewrite rules explain a lot of "why is the app broken after
  enabling WAF" behaviour.

**Recognise it by:** "regional", "in front of VMs or an App Service in one region", "path-based
routing".

## 3. Azure Front Door and CDN

**Adjacent to 02-04 and 03-06.**

- Global entry point with its own WAF. **Premium** adds Private Link origins, which is how a web
  app is published to the internet while the origin keeps `Public network access: Disabled`.
- That Private Link origin pattern is the one genuinely exam-shaped idea here, because it sits
  exactly on the seam between the perimeter and private-access objectives.

**Recognise it by:** "global", "multi-region", "origin must not be publicly reachable".

## 4. Azure Firewall Manager

**Adjacent to 02-03.**

- Central management of firewall policies and of secured virtual hubs across many VNets and
  Virtual WAN hubs, plus DDoS plan and WAF policy association.
- **Policy inheritance** is the testable idea: a child policy inherits parent rule collection
  groups, and inherited rules are processed before the child's own.

**Recognise it by:** "consistent rules across hubs", "central policy with local exceptions".

## 5. Service endpoint policies

**Adjacent to 02-01 and 02-04.** Linked by name in the study guide, specifically for Storage.

- A service endpoint says "traffic from this subnet may reach this service". A **service endpoint
  policy** narrows that to "…and only to *these specific storage accounts*".
- That is the exfiltration control: without it, a compromised VM in an allowed subnet can write to
  *any* storage account over the service endpoint, including the attacker's.

**Recognise it by:** "prevent data exfiltration to an unauthorised storage account".

## 6. Azure Files

**Adjacent to 02-01.** Storage security in the outline is written around blobs; Files has its own
identity model.

- **Identity-based authentication** over SMB using on-premises AD DS, Microsoft Entra Domain
  Services, or Microsoft Entra Kerberos for hybrid identities.
- NTFS ACLs at the file and directory level layered under Azure RBAC share-level roles - a
  two-layer model blob storage does not have.
- Encryption in transit via SMB 3.x, and the option to require secure transfer.

**Recognise it by:** "SMB share", "NTFS permissions", "domain-joined clients".

## 7. Microsoft Threat Modeling Tool

**Adjacent to the whole guide, owned by none of it.**

- Free STRIDE-based tool for producing a data-flow diagram and enumerating threats per element
  and trust boundary.
- No bullet, but the *mindset* is the one this guide teaches in every "Why this exists" section:
  name the threat before choosing the control.
- If a stem ever asks where in the development lifecycle a control decision belongs, this is the
  vocabulary it will use.

**Recognise it by:** "STRIDE", "data-flow diagram", "trust boundary", "design phase".

## 8. Azure Monitor

**Adjacent to 00-01, 04-03, 04-04.** The outline never names it, and then depends on it
repeatedly.

- **Diagnostic settings** are the collection path for every Azure resource log in Domain 4.
- **Data collection rules and endpoints** are Azure Monitor objects, not Sentinel objects.
- **Alert rules and action groups** are how the budget alerting in Module 0 actually fires.
- **Workbooks** are Azure Monitor, surfaced in Sentinel.

Treat Azure Monitor as the plumbing beneath three tested objectives rather than a topic of its
own - but know which portal each object really lives in, because that distinction shows up in
"where would you configure this" stems.

---

## Adjacent by mechanism rather than by link

Not in the study guide's table, but relied upon by bullets that *are* in scope. Listed so the
dependency is explicit, not to expand scope.

| Topic | The in-scope bullet that leans on it | Depth needed |
| --- | --- | --- |
| **Sensitivity labels and DLP in Purview** | "Identify overexposure of data in SharePoint"; DSPM for AI findings are only as good as the classification underneath | What a label and a policy are, and that DSPM reports on them |
| **Defender XDR unified RBAC** | "Analyze blast radius… by using Defender XDR"; "Query Microsoft Purview Audit in Defender XDR" | That XDR has its own role model separate from Azure RBAC |
| **Log Analytics workspace design** | Every Sentinel bullet | One workspace per what, and who can read it |
| **Conditional Access authentication context and token protection** | "Implement conditional access policies" | Recognition only |
| **Administrative units** | "Manage custom roles, including… Microsoft Entra roles" | That Entra role scope is not only tenant-wide |

---

## What to do with this appendix

1. Finish the 87 first. All of them.
2. Read this once, at recognition depth. An hour, not a weekend.
3. If you meet any of these in a stem, you will be choosing between it and something you *have*
   studied properly - which is what [A6](./a6-choosing-between-controls.md) is for.
4. If Microsoft ever adds a bullet for one of these, it leaves this appendix and becomes a module.
   That is what the outline diff in `docs/CONTRIBUTING.md` is for.

## Sources

- Microsoft Learn - SC-500 study guide, including its linked documentation table: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Azure DDoS Protection documentation: <https://learn.microsoft.com/azure/ddos-protection/>
- Azure Application Gateway documentation: <https://learn.microsoft.com/azure/application-gateway/>
- Azure Front Door and CDN documentation: <https://learn.microsoft.com/azure/frontdoor/>
- Azure Firewall Manager documentation: <https://learn.microsoft.com/azure/firewall-manager/>
- Virtual network service endpoint policies for Azure Storage: <https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoint-policies-overview>
- Azure Files documentation: <https://learn.microsoft.com/azure/storage/files/>
- Microsoft Threat Modeling Tool overview: <https://learn.microsoft.com/azure/security/develop/threat-modeling-tool>
- Azure Monitor documentation: <https://learn.microsoft.com/azure/azure-monitor/>
