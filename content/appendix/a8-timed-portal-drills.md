---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience"
last_verified: "2026-09-20"
portal: "Varies - every drill is portal-only by design"
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: "Drills marked E5 need only the Microsoft 365 tenant. The rest need the companion Azure subscription."
azure_resources: []
lab_cost_estimate: "Low - most drills are $0. Three touch metered resources and say so."
free_practice_available: true
forensic_relevance: "Working a console under a clock, without documentation, is the same muscle an on-call hour uses. The drills below are configuration rather than investigation, but the failure mode is identical: knowing the control and not knowing where it lives costs the same minutes either way."
---

# Timed Portal Drills

> **Why this appendix exists.** SC-500 is scheduled at **120 minutes**. On Microsoft's own
> duration table, associate exams *without* labs are 100 minutes and those that *may contain* labs
> are 120 - and the certification page says you may have interactive components to complete. See
> [A4](./a4-exam-logistics-and-scoring.md) for that reasoning in full.
>
> The labs in this repository teach configuration properly, with both methods, at a pace that
> suits learning. None of them teaches you to do the work **under a clock, in the portal, with the
> documentation closed**. That is a different skill and it is trainable in an afternoon.

## Rules of engagement

1. **Portal only.** No PowerShell, no CLI. If an interactive component exists, it is a console.
2. **Documentation closed.** No Microsoft Learn, no notes, no this repository.
3. **Timer visible** and started before you open the blade, not after you find it.
4. **Stop when the clock stops.** Score what you completed. Finishing late teaches you nothing
   about whether you would have finished.
5. **Tear down at the end of the session**, not at the end of each drill. Three drills below
   create metered resources - they are marked, and they are the ones to delete first.
6. Run a drill **at least a week after** the lab it derives from. Immediately afterwards you are
   testing short-term memory, which the exam will not be.

## Scoring yourself

Each drill lists **pass conditions**. Score each condition, not the drill as a whole - partial
completion is the useful signal, because it tells you whether you lost time *finding* the setting
or *understanding* it. Those two failures have different fixes:

- **Found it late, configured it right** → navigation practice. Repeat the drill.
- **Found it fast, configured it wrong** → go back to the content module. The drill is not the
  problem.

---

## Domain 1

### D1 - Conditional Access, report-only · 6 minutes · E5 · $0

Create a policy requiring multifactor authentication for a pilot group, excluding the break-glass
account, in report-only mode.

**Pass conditions:** policy exists; assignment targets the group; break-glass account excluded in
the user exclusions, not by a group the account is not in; grant control is MFA; state is
report-only; you can say where to view the impact before enabling it.

### D2 - PIM role settings · 6 minutes · E5 · $0

Make a user eligible for a directory role, then constrain activation: maximum four hours, MFA and
justification required on activation.

**Pass conditions:** eligible, not active; expiry set on the eligibility; four-hour activation
maximum set on the **role setting**, not on the assignment; MFA and justification both enforced;
you can say which of these is configured per role and which per assignment.

### D3 - Key Vault hardening · 8 minutes · Low

Create a vault with the RBAC permission model, enable purge protection, restrict network access to
selected networks, and grant one principal read access to **one secret** rather than the vault.

**Pass conditions:** permission model is Azure RBAC; purge protection on, and you can say why the
choice is irreversible; firewall set to selected networks; role assignment scoped to the secret,
not the vault; you did not use an access policy anywhere.

### D4 - Policy assignment with an exemption · 6 minutes · $0

Assign a built-in policy with a deny effect at resource-group scope, then exempt one resource with
a stated justification and an expiry.

**Pass conditions:** assignment at the right scope; effect confirmed as deny; exemption created at
the resource, with a category and an expiry date; you can say the difference between an exemption
and an exclusion scope.

---

## Domain 2

### D5 - Storage account, identity-first · 8 minutes · Low

Create a storage account that cannot be accessed with the account key, cannot be read
anonymously, and hands out a delegated token that you can revoke without rotating anything.

**Pass conditions:** shared key access disabled; anonymous blob access disabled at account level;
a stored access policy created on a container; a SAS issued **referencing that policy**; you can
state what revoking the policy does and what it does not.

### D6 - Storage firewall · 7 minutes · Low

Restrict the account from D5 to one subnet, then allow a specific Azure service instance through
without opening it to all trusted services.

**Pass conditions:** public network access set to selected networks; the subnet added, with the
service endpoint enabled in the process; a **resource instance rule** naming the specific
resource; you can say why the resource instance rule is narrower than the trusted-services
exception.

### D7 - NSG and ASG authoring · 10 minutes · Low

Create two application security groups, then write NSG rules that allow one to reach the other on
one port and deny everything else, without writing a single IP address.

**Pass conditions:** two ASGs; NIC or subnet association correct; rules reference ASGs as source
and destination; priorities leave room to insert a rule later; you can state which default rule
your deny is overriding.

### D8 - Firewall policy, no firewall · 8 minutes · $0

Author an Azure Firewall **policy** - no firewall deployed - with a rule collection group
containing one network rule and one application rule permitting a single FQDN.

**Pass conditions:** policy created; rule collection group priority set deliberately; network rule
and application rule both present; you can state which one is evaluated first and what that means
for the FQDN rule you just wrote.

> A firewall policy with no firewall associated to it costs nothing. The firewall itself bills
> hourly from the moment it deploys, which is why this drill stops at the policy.

### D9 - Network Watcher effective rules · 6 minutes · Low

Given an existing VM, produce the effective security rules for its NIC and explain why one
specific flow is allowed or denied.

**Pass conditions:** effective rules retrieved for the right NIC; you can name which rule wins and
why; you used IP flow verify to confirm rather than reasoning from the rule list alone.

---

## Domain 3

### D10 - VM security features · 7 minutes · **Metered** · Medium

Deploy a VM with a **Trusted launch** security type, confirm secure boot and vTPM, then enable
just-in-time access on it.

**Pass conditions:** security type set at creation, and you can say why it cannot simply be added
afterwards on every SKU; secure boot and vTPM both on; JIT configured with specific ports, a
maximum request duration, and a source restriction; an access request raised and visible.

> **Deallocate or delete this VM before the session ends.** JIT requires Defender for Servers, so
> the plan is running too.

### D11 - Defender for AI services · 5 minutes · **Metered** · Medium

Enable the AI services plan on the subscription, turn on user prompt evidence, and find the Data
and AI security dashboard.

**Pass conditions:** plan enabled at subscription scope; prompt evidence toggled deliberately, and
you can state the privacy trade-off it carries; dashboard located without searching the portal
blindly.

> **Turn the plan off at the end of the session.**

---

## Domain 4

### D12 - Sentinel rule from the content hub · 9 minutes · Low

Install one content hub solution, enable one scheduled analytics rule from its templates, set
incident grouping, and attach an automation rule that assigns an owner.

**Pass conditions:** solution installed rather than a rule hand-written; rule enabled from the
template with its query left alone; grouping configured with a stated window; automation rule
created with a trigger and a condition, not just an action.

### D13 - Data collection rule · 8 minutes · Low

Create a DCR that collects Windows security events at something narrower than "All events", and
say which table it lands in.

**Pass conditions:** DCR created with a resource association; a filtered selection rather than the
preset "All"; destination workspace set; you can name the table and say what would have to change
to send the same data somewhere cheaper.

---

## After the session

Run the teardown for anything metered - D10 and D11 first - then the Cost Management check from
[A2](./a2-licensing-and-lab-cost-matrix.md). A drill session is the easiest way to leave something
running, because the drills are short and the temptation is to move straight on to the next one.

## Sources

- Exam duration and exam experience: <https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience>
- Microsoft Learn - SC-500 study guide: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
