---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/storage/common/storage-sas-overview"
  - "https://learn.microsoft.com/azure/private-link/private-endpoint-overview"
  - "https://learn.microsoft.com/azure/sentinel/manage-data-overview"
  - "https://learn.microsoft.com/azure/backup/multi-user-authorization"
last_verified: "2026-09-20"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: "Azure subscription. No Microsoft 365 dependency."
azure_resources: []
lab_cost_estimate: "$0 - reading and reasoning only"
free_practice_available: true
forensic_relevance: "Questions 1, 5 and 7 are the three findings that appear in most cloud incident reports: a credential that could not be revoked, a signal nobody was paying for, and a backup that was not as immutable as the policy document claimed."
---

# Case Study 2 - Contoso Manufacturing

> **How to use this.** Read the scenario once, in full. Then answer without scrolling back more
> than once. Open an answer only after committing. See [A9](./a9-case-study-northwind-ai.md) for
> why case-study practice exists at all, and [A6](./a6-choosing-between-controls.md) for the
> decision tables these questions exercise.

---

## Scenario

**Contoso Manufacturing** runs 14 plants. Its Azure estate is a hub-and-spoke landing zone in two
regions, with 60 servers still in plant data centres that cannot be migrated for at least three
years. The security team is four people. There is one Microsoft Sentinel workspace.

**What exists today:**

- A **storage account** receives telemetry from plant equipment. Each plant's integrator was
  issued a SAS token in 2023. Nobody recorded which token went to whom.
- An **Azure SQL Managed Instance** holds production and quality data, including an operator
  national-identifier column. Auditing was enabled at the server and again at the database by two
  different people, to both a storage account and Log Analytics.
- A **hub VNet** with Azure Firewall. Spokes have NSGs written by the application teams. One
  application team has added an NSG rule allowing outbound 443 to any destination, "temporarily",
  in 2024.
- **Azure Backup** protects the SQL MI and 40 Azure VMs. Retention policy says seven years.
- The **60 on-premises servers** have no cloud security coverage. Defender for Cloud shows a
  secure score computed only over Azure resources.
- **Sentinel** ingests roughly 400 GB a day, of which a single verbose application table is
  240 GB. Finance has asked for a 40 percent reduction in Sentinel spend.

**Three events in the last quarter:**

1. An integrator was replaced. Their SAS token still works.
2. An internal auditor found that a database administrator can read the operator identifier column
   in clear text. The team's response was "dynamic data masking is enabled".
3. A departing platform engineer, during notice period, shortened a backup retention policy. It
   was caught by chance during a review.

---

## Question 1

The replaced integrator's SAS token must stop working today, without invalidating the other
thirteen. What is possible?

- A. Revoke the stored access policy the token references
- B. Rotate the account key the token was signed with
- C. Delete the integrator's Entra account
- D. Nothing targeted is possible; all tokens must be reissued

<details class="depth">
<summary>Answer</summary>
<p><strong>D, in this scenario.</strong> This is a two-stage question and the trap is answering the
general case instead of the stated one. A stored access policy is <em>the</em> mechanism for
revoking a service SAS - but only if the SAS was issued referencing one, and nothing in the
scenario says it was. Nobody even recorded which token went to whom.</p>
<p><strong>B</strong> works, and breaks the other thirteen, which the question forbids.
<strong>C</strong> would work for a user delegation SAS, which is signed with Entra credentials -
but a 2023 integrator token handed to a third party is a service SAS.</p>
<p>The remediation, and the exam's real point: reissue with stored access policies, or move to
user delegation SAS so revocation follows the identity.</p>
<p><em>Modules 02-01, and A6 section 9.</em></p>
</details>

## Question 2

Contoso wants plant staff, on the corporate network on-premises, to reach the telemetry storage
account without traversing the public endpoint. Which control?

- A. A service endpoint on the connected spoke subnet
- B. A private endpoint, with the private DNS zone linked and public network access disabled
- C. A storage firewall rule listing the plant public IP ranges
- D. A service endpoint policy scoped to the account

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> "From on-premises" and "not the public endpoint" together are a private
endpoint question, every time. The second half of the option is what makes it complete: without
the private DNS zone the name still resolves publicly, and without disabling public access the
public endpoint remains reachable.</p>
<p><strong>Why not the others.</strong> A service endpoint extends a <em>subnet's</em> identity to
the service and does not work from on-premises at all, nor does it give a private address. C keeps
all traffic on the public endpoint and merely filters it. D narrows which accounts a service
endpoint may reach - useful, and answering a different question.</p>
<p><em>Modules 02-01, 02-04, and A6 section 2.</em></p>
</details>

## Question 3

The "temporary" NSG rule allowing outbound 443 to any destination is discovered. The team argues
it is harmless because Azure Firewall inspects egress anyway. Evaluate.

- A. Correct - the firewall is in the path, so the NSG rule changes nothing
- B. Incorrect - traffic only reaches the firewall if routing sends it there; the NSG rule is
  evidence nobody has verified that
- C. Incorrect - an NSG allow rule overrides an Azure Firewall deny
- D. Correct, provided the firewall is Premium with IDPS enabled

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> An NSG and a firewall are not alternatives and neither overrides the other;
they are different points in a path, and the firewall only sees traffic that routing forces
through it. The NSG rule is not itself the vulnerability - it is the sign that the spoke's egress
assumption has never been tested.</p>
<p><strong>C is the tempting wrong answer</strong> because it sounds like an ordering rule. There
is no precedence relationship between an NSG and a firewall; they are sequential hops. The
precedence rules you do need are within each: NSG rules by priority, lowest first; Azure Firewall
DNAT, then network, then application - and a network rule match means application rules never
run.</p>
<p>The verification step is effective security rules plus IP flow verify in Network Watcher, then
checking the route table.</p>
<p><em>Modules 02-03, and A6 section 1.</em></p>
</details>

## Question 4

The auditor's finding about the operator identifier column. What is the correct response, and what
is wrong with the team's?

- A. The team is right; dynamic data masking prevents the administrator reading the column
- B. Implement Always Encrypted; masking is a presentation control that a query can defeat
- C. Enable Transparent Data Encryption with a customer-managed key
- D. Remove the administrator's role assignment and audit the column

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> Dynamic data masking obscures results; the data remains fully queryable, and
a predicate recovers values one at a time. Where the requirement is that a database administrator
must not be able to read a column, the control is Always Encrypted, where the keys never reach the
engine.</p>
<p><strong>C</strong> protects files and backups at rest and is transparent to anyone querying the
database, so it does nothing here - a customer-managed key changes who holds the key, not who can
read a row. <strong>D</strong> is defensible operationally and is not what was asked; somebody
must administer the instance.</p>
<p><em>Modules 02-02, and A6 section 10.</em></p>
</details>

## Question 5

Bringing the 60 plant servers into coverage. What is the correct order, and what does the first
step buy you before you pay for anything?

- A. Enable Defender for Servers first, then connect the servers
- B. Onboard the servers to Azure Arc first; they then appear as resources, gaining policy,
  inventory and free recommendations before any plan is enabled
- C. Install the Defender for Endpoint agent directly and skip Arc
- D. Deploy a site-to-site VPN and treat them as Azure VMs

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> Arc is the projection layer: once a server is Arc-enabled it is an Azure
resource, so it can carry policy, machine configuration, inventory and the free foundational
recommendations. Paying for Defender for Servers is then a decision you make with visibility
rather than before it.</p>
<p><strong>A</strong> has the order backwards - the plan has nothing to protect yet.
<strong>C</strong> gives endpoint detection without posture, inventory or policy, and is the
answer that looks efficient and costs you the whole management plane. <strong>D</strong> confuses
network reachability with resource identity.</p>
<p><em>Modules 03-04, 04-01.</em></p>
</details>

## Question 6

Finance wants a 40 percent Sentinel reduction. The verbose 240 GB table is used by two analytics
rules that fire perhaps twice a month, and by auditors who query it quarterly. Which approach
meets both needs?

- A. Switch the table to the data lake tier
- B. Apply a DCR transformation to drop the columns nobody queries, keeping the table in the
  analytics tier
- C. Reduce workspace retention to 30 days
- D. Delete the two analytics rules and switch the table to the data lake tier

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> The cost here is ingestion volume, and a transformation in the data
collection rule reduces what is ingested while leaving the table where the analytics rules can
still see it. That is the control that satisfies both stated needs.</p>
<p><strong>A</strong> is the trap, and it is the most attractive one: moving a table to the data
lake tier is cheap and it <em>stops real-time analytics and hunting on that table</em>. The two
rules would silently stop working. <strong>C</strong> attacks retention when the problem is
ingestion, and it damages the auditors' quarterly query. <strong>D</strong> achieves the saving by
deleting the detection, which is the question inverted.</p>
<p>If the rules genuinely had no value, D would become a reasonable engineering answer - but the
question does not say that, and the exam rewards reading what is stated rather than what would be
convenient.</p>
<p><em>Modules 04-03, 04-04, and A6 section 12. Re-verify the tier model; it moved recently.</em></p>
</details>

## Question 7

Preventing a repeat of the shortened backup retention. Which control, and why not the obvious
alternatives?

- A. A CanNotDelete resource lock on the Recovery Services vault
- B. Multi-user authorization using a Resource Guard, so a critical backup operation requires a
  second principal to approve
- C. Remove Backup Contributor from everyone and use PIM for the role
- D. An Azure Policy denying changes to backup policies

<details class="depth">
<summary>Answer</summary>
<p><strong>B.</strong> Multi-user authorization with a Resource Guard is purpose-built for exactly
this: a destructive backup operation cannot be completed by the vault's own administrator alone.
It is the only option that assumes the administrator is the threat.</p>
<p><strong>A</strong> is management-plane deletion protection and says nothing about a policy being
edited. <strong>C</strong> is genuinely good practice and should also be done - but a person with
the role activated through PIM can still shorten retention, so it reduces the window rather than
requiring approval. <strong>D</strong> can constrain resource properties but is not the control the
platform provides for this, and would be fragile.</p>
<p>The complete answer in practice is B plus C plus immutable vault settings plus soft delete -
but when the question asks which control addresses the <em>rogue administrator</em>, it is MUA.</p>
<p><em>Modules 01-03, and A6 section 7.</em></p>
</details>

---

## What this case was testing

| Question | The distinction |
| --- | --- |
| 1 | Answer the stated case, not the general one - the revocation mechanism has to have been chosen in advance |
| 2 | On-premises plus private addressing is never a service endpoint |
| 3 | Controls in sequence do not have precedence over each other; controls within a device do |
| 4 | Presentation controls are not security boundaries |
| 5 | Projection before protection - Arc first, plans second |
| 6 | Ingestion cost and retention cost are different problems with different controls |
| 7 | Some controls exist specifically because the administrator is in the threat model |

The habit all seven reward: **classify the requirement before shortlisting controls.** Is this a
data-plane or management-plane problem? Detection or prevention? Ingestion or retention?
Reachability or authorization? The classification usually eliminates three options before you have
thought about any product at all.

## Sources

- Microsoft Learn - SC-500 study guide: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Grant limited access with shared access signatures: <https://learn.microsoft.com/azure/storage/common/storage-sas-overview>
- Private endpoint overview: <https://learn.microsoft.com/azure/private-link/private-endpoint-overview>
- Manage data tiers and retention in Microsoft Sentinel: <https://learn.microsoft.com/azure/sentinel/manage-data-overview>
- Multi-user authorization using Resource Guard: <https://learn.microsoft.com/azure/backup/multi-user-authorization>
