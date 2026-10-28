# Objective validation

This file records how the Academy's curriculum was checked against Microsoft's
official SC-500 study guide, and what was found. It is the reviewable record that
the [project brief](BUILD-PROMPT.md) requires before major curriculum work: what
Microsoft currently measures, how the Academy maps to it, and every place where the
Academy's content was corrected, softened or flagged because Microsoft's sources
disagreed or could not be found.

**The study guide determines what is measured. Microsoft Learn determines what is
true. The Academy determines how it is taught.**

## 1. The controlling source

| | |
|---|---|
| Study guide | [Study guide for Exam SC-500](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500) |
| Retrieved | 2026-10-07, through the Microsoft Learn MCP server |
| Page `ms.date` | 2026-04-26 |
| Page `updated_at` | 2026-07-31 |
| Source commit | `d6217921a64c7c6fb4d7e02fb930891fbf89a320` |
| Stored capture | [`docs/SKILLS-MEASURED-SNAPSHOT.md`](SKILLS-MEASURED-SNAPSHOT.md) |
| Structured manifest | [`content/skills-measured.json`](../content/skills-measured.json) |

The study guide does not publish a separate "skills measured as of" date or an
upcoming-changes section for SC-500 at the time of retrieval. The effective outline
is therefore the one on the page.

## 2. Result of the comparison

The `## Skills measured` section retrieved on 2026-10-07 is **identical** to the
stored snapshot: no added, removed, reworded or regrouped bullets, and no weight
changes.

| Domain | Weight | Objectives | Bullets |
|---|---|---|---|
| 1. Manage identity, access, and governance | 20–25% | 3 | 22 |
| 2. Secure storage, databases, and networking | 25–30% | 3 | 16 |
| 3. Secure compute | 20–25% | 3 | 29 |
| 4. Manage and monitor security posture | 20–25% | 3 | 20 |
| **Total** | | **12** | **87** |

Every one of the 87 bullets is preserved verbatim in `content/skills-measured.json`
and claimed, verbatim, by exactly one exam lesson's `sub_objectives`. The validator
(`tools/Test-GuideContent.ps1`) fails the build if any of that stops being true.

> **About the ids.** Microsoft does not number objectives or bullets. Ids such as
> `2.3.6` are positions in the outline (domain.objective.bullet), assigned by the
> Academy for navigation. If Microsoft reorders the outline, the ids move with it.

## 3. Objective map

Which lessons teach each objective, and which Module 0A foundation primers support
it. A primer never claims an objective; it names the objectives it supports in
`supports_objectives`.

| Id | Objective | Bullets | Lessons | Foundation primers |
|---|---|---|---|---|
| 1.1 | Secure access to resources by using Microsoft Entra ID | 6 | 00-02, 01-01 | 0A-02, 0A-04, 0A-05, 0A-06, 0A-17 |
| 1.2 | Secure secrets and keys by using Azure Key Vault | 7 | 01-02 | 0A-01, 0A-05, 0A-07, 0A-08 |
| 1.3 | Implement governance to enforce security and regulatory compliance | 9 | 01-03 | 0A-01, 0A-03, 0A-04, 0A-05, 0A-12, 0A-17 |
| 2.1 | Implement security for storage accounts | 4 | 02-01 | 0A-05, 0A-07, 0A-08, 0A-09 |
| 2.2 | Implement security for databases | 3 | 02-02 | 0A-05, 0A-08, 0A-09, 0A-11 |
| 2.3 | Implement security for Azure network services | 9 | 02-03, 02-04 | 0A-07, 0A-08, 0A-17 |
| 3.1 | Implement security for AI | 11 | 03-01, 03-02, 03-03 | 0A-02, 0A-04, 0A-10, 0A-13, 0A-14, 0A-15, 0A-16 |
| 3.2 | Implement security for servers and virtual machines (VMs) | 9 | 03-04 | 0A-01, 0A-06, 0A-13 |
| 3.3 | Implement security for application platform services | 9 | 03-05, 03-06 | 0A-01, 0A-06, 0A-10, 0A-13 |
| 4.1 | Manage security posture by using Defender for Cloud | 6 | 04-01 | 0A-01, 0A-03, 0A-11, 0A-12, 0A-13, 0A-17 |
| 4.2 | Implement activity and event collection in Microsoft Sentinel | 10 | 04-02, 04-03, 04-04 | 0A-02, 0A-03, 0A-11, 0A-17 |
| 4.3 | Implement Microsoft Security Copilot | 4 | 04-05 | 0A-02, 0A-16 |

00-02 (PIM for lab access) practises bullet 1.1.1 alongside 01-01, which owns it.
The live, per-bullet version of this table - with comparisons, labs and question
counts - is the site's **Objective coverage** page (`#/coverage`).

## 4. Classification of Academy material

| Class | Meaning | Material |
|---|---|---|
| **Current** | Aligned with the current outline | All 18 exam lessons, their labs and knowledge checks; the 19 structured comparisons; appendices A2, A3, A6, A8–A11 |
| **Foundation** | Not measured, but needed to understand measured material | Module 0A (17 primers) |
| **Project prerequisite** | Not exam content; required before any billable lab | Module 0B (00-00 to 00-03 and labs 00-01, 00-02) |
| **Beyond the exam** | Useful, clearly labelled, not represented as measured | Each lesson's collapsed investigation note; appendix A7 (related topics with no skills-measured bullet); appendix A5 (AZ-500 delta, for people moving from AZ-500) |
| **Needs update** | Relevant but known to need change | None open. Section 6 lists what was corrected in this pass. |
| **Obsolete** | No longer accurate or useful | None retained. Content describing retired products was rewritten, not kept (for example, Microsoft Entra Permissions Management in 01-03). |

## 5. Scope rules applied

- A comparison must map to at least one official bullet (`objectives` in
  `content/comparisons.json`); the validator rejects one that does not.
- A primer must name at least one official objective it supports and must not claim
  a bullet.
- No question, scenario or distractor comes from exam dumps, recalled exam items or
  any protected examination material. Every knowledge-check answer carries the
  scenario clue that points to it, why each alternative is wrong, and the objective.

## 6. Verification log

Product claims were checked against Microsoft Learn through the MCP server during
the beginner-first redesign (October 2026). Where sources disagreed, the Academy
teaches the more specific or more authoritative page, explains any legacy state,
and records the conflict here rather than choosing silently.

### 6.1 Flagged: Microsoft sources disagree

| Topic | The disagreement | What the Academy does |
|---|---|---|
| Licensing for Conditional Access for agents | The Conditional Access agent-identity page states the Microsoft Agent 365 licence requirement as current; the autonomous agents policy page says it "will soon be required". | States the requirement and flags it in 03-02 and its lab. |
| Broad MFA policies and agents | Best-practice guidance says to audit broad MFA policies for agents; the Conditional Access page says All users policies do not include agents' user accounts. | Teaches the explicit statement; the lab still asks you to check. |
| Copilot Studio real-time protection | The Defender "Enable security for AI agents" page lists Agent 365 onboarding as a prerequisite; the Agent 365 transition page says Copilot Studio real-time protection through Defender for Cloud Apps remains unchanged for tenants that keep using it. | Presents both in 03-02 and tells you to verify which experience your tenant uses. |
| Foundry agent alerts | A February 2026 release note announced Defender for AI Services threat protection for Foundry agents (preview); the Agent 365 transition page moves agent-specific alerts to Agent 365 from 1 July 2026. | Teaches the transition in 03-03. |
| Sentinel analytics retention | Different pages describe the analytics-tier default as 30 days and as 90 days. | A watch note in 04-02 teaches what is consistent (Microsoft Sentinel solution tables can keep 90 days at no extra storage charge) and tells you to check each important table; 04-04 sets retention per table. |
| Copilot Studio real-time protection: block or audit | The setup page says a detection blocks the response; the real-time protection page says the built-in Default rule only audits and custom rules block. | 03-02 and poster 3 teach the rules experience (Default audits, custom rules block) and keep the older Defender for Cloud Apps path as the alternative to verify. |
| Copilot Studio real-time protection without Agent 365 | The Agent 365 transition page says the Defender for Cloud Apps path continues for tenants that keep it; the setup page lists Agent 365 onboarding as a prerequisite. | Poster 3 marks this **needs verification**; 03-02 tells you to check your tenant. |
| Adding a regulatory standard: roles | One page names Owner or Policy Contributor; another names Resource Policy Contributor plus Security Admin. | Poster 4 states both and notes that Owner satisfies either. |
| Sentinel onboarding to the Defender portal: roles | The prerequisites table lists Security Administrator for onboarding; its footnote says Security Administrator is needed only with more than one Sentinel workspace. | 04-02 and poster 4 follow the table: Security Administrator plus Owner (unconditional) or User Access Administrator with Microsoft Sentinel Contributor. |
| Default malware-scanning cap in Defender for Storage | The portal documentation gives 10,000 GB a month; the infrastructure-as-code documentation gives `-1` (unlimited) as the template default. | Poster 4 says scanning stops at the monthly cap and gives no default figure. |
| Which plans unlock regulatory compliance standards | The assignment page excludes Defender for Servers Plan 1; the Servers feature table ticks compliance assessment for Plan 1. | The Academy follows the assignment page, the most specific source. |
| Deny assignments | The concept page says customer-managed deny assignments are in private preview and cannot be created directly; `az role deny-assignment create` and `New-AzDenyAssignment` are documented. | Poster 2 states the generally available behaviour and notes the private preview. |
| Restricted Content Discovery and recently opened files | One page says recently interacted files are hidden too; another says they still surface. | 03-01 teaches the cautious reading: people can still find content they own or recently interacted with. |
| Virtual WAN Forced Tunnel with no default route | The routing intent page says internet traffic is blocked; the same page's table says Azure Firewall with a public IP sends it out through that IP. | 02-03, its lab and quiz teach the table (no public IP: dropped; public IP: leaves directly, never via on-premises). |

### 6.2 Could not be verified: removed or softened

| Claim | Outcome |
|---|---|
| Foundational CSPM becomes opt-in for new subscriptions from 27 October 2026 | Not found in Defender for Cloud release notes, upcoming changes or plan documentation (checked 2026-10-07). Removed from 04-01, lab 04-01, A2, A3 and A5. |
| Defender for AI Services "suspicious prompt evidence" is off by default | Not stated by Microsoft Learn. The Academy now states only the documented behaviour: without it, prompt content in alerts is masked. |
| "Topic restriction" and "automated evaluations" as Foundry guardrail controls | Not found as guardrail controls. Replaced with the documented risks and intervention points. |
| Defender for Containers is billed "per vCore-hour" | Microsoft Learn defers to the pricing page and gives no unit; the page could not be read during this pass. 03-05, lab 03-05 and A2 now say it bills for the cluster capacity it protects and point to the pricing page for the unit. |

### 6.3 Corrected: Academy content conflicted with Microsoft Learn

| Where | Was | Now |
|---|---|---|
| 01-03, 04-01, A3, lab 01-03, quiz 04-01 | Regulatory compliance standards need Defender CSPM | Any Defender for Cloud plan except Defender for Servers Plan 1 or Defender for APIs Plan 1 |
| 03-05, lab 03-05, quiz 03-05 | ACR admin account enabled on creation | Disabled by default |
| 03-06, lab 03-06, quiz 03-06 | WAF rule set upgrade resets customisations; exclusions survive | Overrides and exclusions must be reapplied after a version change |
| 03-03, quiz 03-03, lab 03-03 | AI discovery comes from the Defender for AI Services plan | AI discovery and AI posture come from Defender CSPM |
| 03-04, 03-05, A5 | (missing) | Azure Disk Encryption retires 15 September 2028; Docker Content Trust is removed 31 March 2028 |
| 04-01, quiz 04-01 | Defender EASM bills every discovered asset | Only Approved Inventory assets are billable after the trial |
| 04-04, lab 04-04, quiz 04-04, A3, A11 | MailItemsAccessed requires Audit (Premium) | Part of Audit (Standard) mailbox auditing for E3/E5 users; Premium adds the SensitivityLabel property and the SearchQueryInitiated insight |
| 04-05, lab 04-05, quiz 04-05, A3, A11 | All users are Security Copilot contributors by default | New instances default to the Recommended Microsoft Security roles group; Everyone is the legacy default and cannot be re-added once removed |
| 04-05, 00-01, A2, lab 04-05 | (missing) | Microsoft 365 E5/E7 include Security Copilot capacity: 400 SCUs a month per 1,000 licences, up to 10,000, as a Default Security Copilot Capacity that is not billed hourly |
| 04-03, lab 04-03, quiz 04-03 | (missing) | Windows Event Forwarding data lands in WindowsEvent, not SecurityEvent; built-in rules may not see it |
| 04-03, lab 04-03 | Basic / Auxiliary table plans | Analytics tier and data lake tier, per current Sentinel documentation |
| 02-04, lab 02-04 | Private Access needs "Global Secure Access licensing", which E5 lacks | It needs a Microsoft Entra Private Access or Microsoft Entra Suite licence. E5's Entra ID P2 does include Internet Access for Microsoft services, which is also Global Secure Access |
| 03-01, lab 03-01, comparison | Restricted Content Discovery removes a site from Copilot and search | It stops the site surfacing there, but people still find content they own or recently interacted with, and search inside the site still works |
| Lab 01-03 | Only an exemption "leaves an audit trail" | An exemption keeps the resource in compliance results as Exempted; an excluded scope is still recorded on the assignment but disappears from compliance |
| Lab 03-03, comparison | Guardrails annotate or block at every intervention point | Agents support only annotate-and-block, and the tool call and tool response points are preview, for tools that support them |
| Lab 04-02 | Recreating a deleted workspace's name recovers it | Only with the same name, subscription, resource group and region, and installed solutions such as Sentinel are not recovered |
| Lab 03-06 Part 5.4 | Backend restricted to the `ApiManagement` service tag | That tag lists API Management control-plane addresses, and Basic v2 has no fixed outbound IP. The backend is now closed with the gateway's managed identity (`authentication-managed-identity`) and App Service authentication restricted to that client application and identity |
| 02-03, lab 02-03, quiz 02-03 (q6) | Forced Tunnel is "an internet routing policy in Forced Tunnel mode" | Forced Tunnel is a **private** routing policy with `0.0.0.0/0` in additional prefixes and **no** internet routing policy; an internet policy always means Direct Access |
| 04-02, 04-03, 04-04, labs 04-03 and 04-04 | Defender portal table settings under **Data management → Tables** | **Microsoft Sentinel → Configuration → Tables** |
| Lab 02-02 | Enabling Entra-only before setting an Entra admin "locks you out" | Azure refuses that order: the command fails until an Entra admin exists |
| Lab 03-06 | `-ScmSiteUseMainSiteRestrictionConfig $true` | It is a switch parameter and takes no value |
| 03-03 | "Enable threat protection for AI workloads" and "Configure Microsoft Defender threat protection for AI Services" presented as the same remediation | The first enables the plan; the second keeps new plan capabilities switched on |
| 03-02 | Blast radius prerequisites: Exposure Management read only | Also needs the Microsoft Sentinel data lake |
| 04-01, quiz 04-01 (q5) | Declining Arc auto-provisioning leaves AWS machines with no Defender for Servers coverage | Agentless scanning still covers them; without Arc, Defender for Cloud cannot deploy the Defender for Endpoint and vulnerability assessment extensions |
| 02-01, lab 02-01, quiz 02-01 (q1) | The SAS expiration policy only recommends and reports | Its action is **Log** (default) or **Block**, which denies out-of-policy SAS (not service SAS bound to a stored access policy) |
| 03-03, lab 03-03, quiz 03-03 (q2) | `estimate-prompt-tokens` guarantees over-limit prompts never reach the model | It estimates before forwarding, which *can* stop requests once the limit is already exceeded; concurrent requests can still overshoot |
| 02-02, quiz 02-02 (q4) | Each Defender for Databases type must be switched on separately | Switching the Databases plan on activates all four types; **Select types** turns individual ones off or on |
| 04-02, 04-04, comparison | 90 days of analytics retention included for Sentinel-enabled workspaces | 30 days by default; Microsoft Sentinel solution tables can keep 90 days at no extra storage charge |
| 04-02 | Defender portal onboarding needs Owner or User Access Administrator | Security Administrator, plus Owner (unconditional, subscription) or User Access Administrator with Microsoft Sentinel Contributor; Lighthouse still enables `workspace()` queries |
| 04-02 | Commitment tiers cannot be lowered within the 31-day period | Correct, except within 6 hours of a change |
| 03-04 | Defender for Servers Plan 2 free ingestion: 500 MB per day | 500 MB per machine per day, pooled across machines, eligible security tables, with Plan 2 enabled on the workspace |
| Lab 03-06 | Platform authentication always runs before the app's code | With **Require authentication**; it authenticates, and authorisation stays the app's job |
| 01-01 | Deleting an app registration cleans up nothing elsewhere | It deletes the home-tenant service principal; service principals in other tenants remain |
| 04-02, 04-03, labs 04-02 and 04-03, quiz 04-03 (q1) | Leaving the individual Defender product connectors on beside the Defender XDR connector ingests and bills the same data twice | Enabling the XDR connector disconnects them automatically; Defender XDR alerts and incidents are free. The trap is duplicate incidents: turn off Microsoft incident creation rules |
| 04-01, quiz 04-01 (q3), A11 | Secure score measures benchmark compliance, not risk | True of the classic secure score in the Azure portal; the Cloud Secure Score in the Defender portal is risk-based (asset risk factors and criticality). Neither chains findings into attack paths |
| 04-03, lab 04-03 | Data filtered in the DCR is never billed | What the agent never collects is never billed. Transformation filtering is free for Analytics tables in Sentinel workspaces; Basic tables are charged above 50% filtered, data lake-only tables are charged data processing |
| 04-05 | Create an agent identity for any Security Copilot agent | Agent identity is currently offered for Microsoft-built agents only |
| 03-06, lab 03-06, quiz 03-06 (q3), A3 | Overrides and exclusions must be reapplied after a WAF rule set version change | The portal resets rule-state, rule-action and rule-level exclusion customisations; PowerShell, CLI, REST or a template can carry them across. Custom rules, policy settings and global exclusions are kept |
| Comparison (managed identity vs service principal), flashcard c107 | GitHub Actions needs a service principal with workload identity federation | Workload identity federation works on an app registration or a user-assigned managed identity |
| Comparison (AI gateway vs guardrails vs Defender) | Blocking is guardrails or the gateway | Also Defender real-time protection for agents (preview), which blocks risky actions before they run |

The seven rows from the Defender XDR connector down came from a second fact-check of
the five posters on 2026-10-20 (one reviewer per poster, about 740 claims in all). Sources:
[Microsoft Defender XDR integration with Microsoft Sentinel](https://learn.microsoft.com/azure/sentinel/microsoft-365-defender-sentinel-integration),
[Connect Defender XDR to Sentinel](https://learn.microsoft.com/azure/sentinel/connect-microsoft-365-defender),
[Secure score in Defender for Cloud](https://learn.microsoft.com/azure/defender-for-cloud/secure-score-security-controls),
[Custom data ingestion and transformation in Sentinel](https://learn.microsoft.com/azure/sentinel/data-transformation),
[Security Copilot agents overview](https://learn.microsoft.com/copilot/security/agents-overview),
[Application Gateway WAF rule groups: changing ruleset version](https://learn.microsoft.com/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules),
[Workload identity federation](https://learn.microsoft.com/entra/workload-id/workload-identity-federation),
[Protect AI agents in real time](https://learn.microsoft.com/defender-xdr/security-for-ai/ai-agent-real-time-protection).

The rows from Forced Tunnel down came from an independent fact-check of the five
study posters (three separate reviewers), which surfaced these errors in the Academy
text as well. Sources:
[Virtual WAN routing intent and internet traffic](https://learn.microsoft.com/azure/virtual-wan/about-internet-routing),
[Configure table settings in Microsoft Sentinel](https://learn.microsoft.com/azure/sentinel/manage-table-tiers-retention),
[Azure SQL Microsoft Entra-only authentication](https://learn.microsoft.com/azure/azure-sql/database/authentication-azure-ad-only-authentication),
[Defender for Servers support matrix](https://learn.microsoft.com/azure/defender-for-cloud/support-matrix-defender-for-servers),
[SAS expiration policy](https://learn.microsoft.com/azure/storage/common/sas-expiration-policy),
[llm-token-limit policy](https://learn.microsoft.com/azure/api-management/llm-token-limit-policy),
[Enable the Databases plan](https://learn.microsoft.com/azure/defender-for-cloud/tutorial-enable-databases-plan),
[Manage data tiers and retention](https://learn.microsoft.com/azure/sentinel/manage-data-overview),
[Connect Microsoft Sentinel to the Defender portal](https://learn.microsoft.com/azure/sentinel/microsoft-sentinel-onboard),
[Azure Monitor Logs commitment tiers](https://learn.microsoft.com/azure/azure-monitor/logs/cost-logs#commitment-tiers),
[Defender for Servers data ingestion benefit](https://learn.microsoft.com/azure/defender-for-cloud/data-ingestion-benefit),
[Blast radius analysis](https://learn.microsoft.com/defender-xdr/investigate-incidents#attack-story),
[Protect AI agents in real time](https://learn.microsoft.com/defender-xdr/security-for-ai/ai-agent-real-time-protection).

The five rows above lab 03-06 came from an independent fact-check of the new lab text
(a separate reviewer, checking about 45 claims against Microsoft Learn). Sources:
[Global Secure Access licensing](https://learn.microsoft.com/entra/global-secure-access/overview-what-is-global-secure-access#licensing-overview),
[Restricted Content Discovery](https://learn.microsoft.com/sharepoint/restricted-content-discovery),
[Azure Policy scope](https://learn.microsoft.com/azure/governance/policy/concepts/scope),
[Foundry guardrail intervention points](https://learn.microsoft.com/azure/foundry/guardrails/intervention-points),
[Delete and recover a Log Analytics workspace](https://learn.microsoft.com/azure/azure-monitor/logs/delete-workspace).

Sources for 6.3, lab 03-06: [IP addresses in API Management](https://learn.microsoft.com/azure/api-management/api-management-howto-ip-addresses),
[API Management virtual network reference](https://learn.microsoft.com/azure/api-management/virtual-network-reference),
[authentication-managed-identity policy](https://learn.microsoft.com/azure/api-management/authentication-managed-identity-policy),
[App Service Microsoft Entra sign-in: additional checks](https://learn.microsoft.com/azure/app-service/configure-authentication-provider-aad).
The other corrections cite their sources in the lessons' Sources sections.

## 7. Keeping this current

1. **Weekly, automatically.** `.github/workflows/outline-drift.yml` diffs the live
   `## Skills measured` section against the snapshot and opens an issue on any
   change.
2. **On a change.** Replace `docs/SKILLS-MEASURED-SNAPSHOT.md` with the new capture,
   then regenerate the structured manifest:

   ```powershell
   ./tools/Update-SkillsManifest.ps1
   ```

3. **Re-map.** Run `./tools/Test-GuideContent.ps1`. It reports every outline bullet
   no lesson claims, every lesson bullet that is no longer in the outline, and every
   comparison, primer or prerequisite that points at something that moved.
4. **Classify** affected material as Current, Needs update, Foundation, Beyond the
   exam or Obsolete (section 4), make the changes reviewable in one pull request, and
   add a row to section 6 for every factual correction.
5. **AI content first.** Microsoft Foundry, agents, guardrails and Security Copilot
   change fastest. Re-verify 03-01 to 03-03 and 04-05 against Microsoft Learn on
   every outline change, even if their bullets did not move.
