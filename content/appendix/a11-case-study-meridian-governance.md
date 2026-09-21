---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/entra/workload-id/workload-identity-federation"
  - "https://learn.microsoft.com/azure/defender-for-cloud/secrets-scanning"
  - "https://learn.microsoft.com/azure/backup/multi-user-authorization"
  - "https://learn.microsoft.com/purview/audit-premium"
last_verified: "2026-09-20"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: "Scenario assumes Microsoft 365 E5 and an Azure subscription. Two questions turn on licensing decisions made before the incident."
azure_resources: []
lab_cost_estimate: "$0 - reading and reasoning only"
free_practice_available: true
forensic_relevance: "This case is built backwards from a post-incident review, which is the honest shape of most governance work: every control below was available, affordable and documented, and the organisation had reasons for each decision that looked sound at the time. The questions are about which decision cost them what."
---

# Case Study 3 - Meridian Trust

> **Why a third case.** [A9](./a9-case-study-northwind-ai.md) is an AI rollout and
> [A10](./a10-case-study-contoso-landing-zone.md) is a hybrid landing zone, so between them they
> lean on Domains 2 and 3. **Domain 1 and Domain 4 are 40 to 50% of the exam between them** and
> neither case centred on either. This one does: identity, governance, and what the monitoring
> estate could and could not tell the investigators afterwards.
>
> Read the scenario once, in full. Then answer without scrolling back more than once. Open an
> answer only after committing to a choice.

---

## Scenario

**Meridian Trust** is an asset manager with 900 staff, a single Microsoft Entra tenant on
Microsoft 365 E5, and eleven Azure subscriptions. Four people run security, and they inherited
an estate rather than building one.

**Six weeks ago they were breached.** The post-incident review established the following.

**Entry.** A service principal created in 2023 for a build pipeline held a client secret. The
secret was committed to a private repository, and the repository was cloned by a contractor
whose laptop was later compromised. The secret had never been rotated. The service principal
held Contributor at subscription scope on three subscriptions.

**Escalation and persistence.** Nine people held permanent Global Administrator, a state the
team had flagged twice in internal reviews and never changed, because "someone has to be able
to fix things at 3am". The attacker added a credential to an existing app registration - an
ordinary administrative event - and it went unremarked for five weeks.

**Impact.** Backup retention on a Recovery Services vault was shortened from seven years to
thirty days on day nine of the intrusion. It was caught during an unrelated review.

**What the estate said, and did not say:**

- Defender for Cloud showed a secure score of **84%**. Foundational CSPM only; no paid CSPM
  plan. An internet-exposed VM with a critical CVE and a Contributor-holding managed identity
  had existed for four months.
- An **Azure Policy assignment with a Deny effect** requiring HTTPS-only on storage had been in
  place for a year. The compliance figure had never moved from 61%, and nobody had investigated
  why.
- **Microsoft Sentinel** was deployed, with the Azure Activity and Defender XDR connectors
  enabled. The investigators could not find the consent and credential-addition events in the
  workspace.
- **Purview audit search** returned nothing for the compromised contractor's mailbox, and
  returned results normally for everyone else.
- **Microsoft Security Copilot** was provisioned during the response, and within a day a
  portfolio manager in the finance team mentioned to IT that they had been exploring it.

---

## Question 1

Which control class would have eliminated the entry vector, and which would have found the
credential before it was used?

- A. Certificate-based authentication on the app registration; Defender for Key Vault
- B. Workload identity federation, so no secret exists to commit; Defender CSPM secrets scanning,
  which finds credentials sitting outside a vault
- C. A stored access policy on the repository; Defender for Storage
- D. Conditional Access on the service principal; Microsoft Defender for Cloud Apps

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The pipeline is a workload outside Azure, so federation is the answer that
removes the credential rather than relocating it. The second half matters as much: CSPM secrets
scanning covers code repositories and machine disks precisely because that is where credentials
that never made it into a vault end up.</p>
<p><strong>Why not the others.</strong> A certificate is still a credential you can leak, and
Defender for Key Vault watches a vault this secret was never in. C names storage controls for an
identity problem. Conditional Access can govern workload identities, but the stem's failure is
that the secret existed and was copyable, not that it was used from an unexpected place.</p>
<p><em>Modules 01-01, 01-02. The trap is picking a control that manages the secret better rather
than one that removes it.</em></p>
</details>

## Question 2

Nine permanent Global Administrators, with a stated operational reason. What is the correct
response?

- A. Accept it; emergency access requires standing privilege
- B. Reduce to two and make the rest eligible through PIM, with activation requiring approval,
  MFA and justification - which satisfies the 3am argument, because activation takes seconds
- C. Replace Global Administrator with a custom Entra role containing the same permissions
- D. Leave the assignments and add Conditional Access requiring a compliant device for those
  accounts

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The operational objection is real and PIM answers it directly: eligibility
does not slow down an incident, it removes the standing target. Two accounts remain permanent as
break-glass, excluded from Conditional Access by design and monitored loudly - see
<strong>01-01</strong> on why that exclusion is correct and what compensates for it.</p>
<p><strong>Why not the others.</strong> C reproduces Global Administrator's permissions while
losing PIM's controls over them, which is worse rather than better. D is a good additional
control and leaves nine standing assignments in place; the stem is about the assignments.</p>
<p><em>Modules 00-02, 01-01, 01-03.</em></p>
</details>

## Question 3

A Deny policy has been assigned for a year and compliance has never moved from 61%. Explain both
observations, and say what changes the number.

- A. The assignment lacks a managed identity; add one and re-evaluate
- B. Deny acts only on create and update requests, so pre-existing non-compliant accounts stay
  non-compliant and nothing fails because nobody deployed a new one; a Modify or
  DeployIfNotExists assignment plus a remediation task changes the estate
- C. The policy is in report-only mode and must be enforced
- D. Compliance data refreshes annually for Deny assignments

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> Both observations have the same cause and it is the most useful thing to
know about policy effects. The assignment was working perfectly and doing nothing, because there
was nothing new to block.</p>
<p><strong>Why not the others.</strong> A is the answer to a <em>different</em> silent failure -
a remediation task with no identity - and noticing that Deny needs no identity is how you rule
it out. Azure Policy has no report-only mode; that is Conditional Access, and the two are
routinely conflated.</p>
<p><em>Module 01-03.</em></p>
</details>

## Question 4

Backup retention was shortened by someone holding the necessary role. Which control assumes that
is the threat?

- A. A CanNotDelete lock on the Recovery Services vault
- B. Multi-user authorization through a Resource Guard, placed in a subscription the vault's
  administrators do not control
- C. Soft delete with extended retention
- D. Azure Policy denying changes to backup policies

<details class="depth">
<summary>Answer</summary>
<p><strong>B</strong>, and the second half of the option is the part people drop. Multi-user
authorization only works if the Resource Guard lives somewhere the vault's administrator cannot
reach - a different subscription, ideally a different tenant, under different people. Same owner
on both sides makes it a speed bump against accident rather than a control against attack.</p>
<p><strong>Why not the others.</strong> A lock governs deletion of the resource, not editing a
retention policy. Soft delete protects deleted backup data and does not stop retention being
shortened going forward - and enhanced soft delete set to always-on is irreversible, which is
correct in production and strands a lab.</p>
<p><em>Module 01-03.</em></p>
</details>

## Question 5

Secure score was 84% while an attack path had been open for four months. Reconcile the two, and
say what Meridian would have needed to see it.

- A. Secure score lags by up to 90 days; the figure was stale
- B. Secure score is computed from Microsoft cloud security benchmark controls - it measures what
  is assessed, not what is dangerous - and attack path analysis requires the Defender CSPM plan,
  which they did not have
- C. The attack path was suppressed by a governance rule
- D. Attack paths are only computed for subscriptions with a workload protection plan enabled

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> A high score and an open attack path coexist comfortably, because they
answer different questions. The three individual findings - internet exposure, a critical CVE, a
permissive managed identity - were each present in the free tier as unremarkable
recommendations. Assembling them into one urgent item is what the paid plan buys.</p>
<p>Worth noting the second-order effect: a team that prioritises by secure score will work the
score, and the item that would have mattered most was never on that list.</p>
<p><em>Module 04-01.</em></p>
</details>

## Question 6

The consent and credential-addition events are not in the Sentinel workspace, although Azure
Activity and Defender XDR connectors are enabled. Why?

- A. Those events are not available to Sentinel under any configuration
- B. They are Entra ID audit events, which arrive through the Microsoft Entra ID connector -
  Azure Activity carries control-plane operations on Azure resources, not directory events
- C. The Defender XDR connector suppresses duplicate identity events
- D. They were dropped by the workspace daily cap

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The distinction that costs them the investigation: the Activity log records
who created a key vault; the directory audit log records who added a credential to an app
registration or granted consent. Both are "audit", both feel like they should be in a SIEM, and
only one of them was connected.</p>
<p>The general lesson is the one 04-03 teaches about every collection decision: what you can
investigate in six months was decided by what you connected today, and the gap is invisible
until you need it.</p>
<p><em>Modules 04-02, 04-03.</em></p>
</details>

## Question 7

Audit search returns nothing for one user's mailbox and works normally for everyone else. What
does that pattern tell you, and how does it differ from returning nothing for everyone?

- A. Nothing for one user means the mailbox was deleted; nothing for everyone means a service
  outage
- B. Nothing for one user points at per-user licensing - high-value events such as
  MailItemsAccessed are generated only for users with Audit (Premium); nothing for everyone
  points at unified audit log ingestion being disabled tenant-wide
- C. Both indicate the retention period has expired
- D. Nothing for one user means their records were purged by a retention policy; nothing for
  everyone means the search scope was wrong

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The shape of the emptiness is the diagnostic. Audit (Premium) is licensed
per user, so the answer to "which messages did the attacker read" depends on a licensing
decision made months before anyone knew there would be an incident - and the events cannot be
generated retroactively.</p>
<p>The tenant-wide case carries its own second thought: disabling unified audit log ingestion is
a single supported administrative command, and an intruder with the right role has as much
reason to run it as an administrator does.</p>
<p><em>Module 04-04.</em></p>
</details>

## Question 8

A portfolio manager in finance was able to open Security Copilot within a day of provisioning.
Explain, and say what restricting access does and does not change.

- A. Their Entra role inherits Copilot owner; removing the role fixes it
- B. Copilot contributor is granted to every user in the tenant by default, so onboarding opened
  the platform to the directory; restricting it governs who may use the platform and changes
  nothing about what a user can see once inside
- C. Security Copilot is licensed per tenant, so all users are entitled to the portal
- D. The workspace was created without member assignments, which defaults to open

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The default is the fact to carry, and the second clause is what stops
people over-reading the fix. What a signed-in user can actually retrieve is governed by their
existing service roles, because a Copilot role grants no access to underlying security data.</p>
<p>So the portfolio manager could open the portal and could not have read Sentinel or Purview
data through it. That is reassuring and it is not a reason to leave the default in place - the
platform is also where plugins are published, and permissive custom plugin publishing is the
consent problem from 01-01 in a new place.</p>
<p><em>Module 04-05.</em></p>
</details>

---

## What this case was testing

| Question | The distinction |
| --- | --- |
| 1 | Removing a credential versus managing it better |
| 2 | An operational objection that a control actually answers, rather than one that has to be overruled |
| 3 | Two silent failures in Azure Policy that look identical and have different causes |
| 4 | A control only works where the threat cannot reach it |
| 5 | Compliance scoring and risk are different measurements, and prioritising by the wrong one is invisible |
| 6 | Control-plane activity and directory audit are different logs with similar names |
| 7 | The shape of an empty result is itself evidence |
| 8 | A default that opens rather than restricts, and the limits of fixing it |

**The thread running through all eight.** Every control in this case was available, affordable
and documented, and every decision had a reason that looked sound when it was made: someone has
to fix things at 3am, the Deny policy is assigned, the score is 84%, we have a SIEM, we have
auditing. Governance work is rarely about discovering an unknown control. It is about noticing
that a control you believe is working has never been asked to do anything.

That is also the exam's favourite shape for a Domain 1 question: a configuration that is correct,
present, and not doing what the reader assumes.

## Sources

- Microsoft Learn - SC-500 study guide: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Workload identity federation: <https://learn.microsoft.com/entra/workload-id/workload-identity-federation>
- Defender for Cloud secrets scanning: <https://learn.microsoft.com/azure/defender-for-cloud/secrets-scanning>
- Multi-user authorization using Resource Guard: <https://learn.microsoft.com/azure/backup/multi-user-authorization>
- Microsoft Purview Audit (Premium): <https://learn.microsoft.com/purview/audit-premium>
