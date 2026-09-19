---
objective: "Implement security for AI"
sub_objectives:
  - "Identify overexposure of data in SharePoint"
  - "Identify risks related to Microsoft Copilot and AI apps by using Microsoft Purview Data Security Posture Management (DSPM)"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-02", "01-01"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/purview/ai-microsoft-purview"
  - "https://learn.microsoft.com/en-us/purview/ai-security-copilot"
  - "https://learn.microsoft.com/en-us/sharepoint/advanced-management"
  - "https://learn.microsoft.com/sharepoint/get-ready-copilot-sharepoint-advanced-management"
  - "https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-architecture-data-protection-auditing"
last_verified: "2026-09-17"
portal: "Microsoft Purview portal > DSPM for AI; SharePoint admin center > Data access governance"
powershell_module: "Microsoft.Online.SharePoint.PowerShell, PnP.PowerShell"
az_cli_command: ""
kql_tables: []
licensing: "Microsoft 365 E5 / E5 Compliance for Purview. SharePoint Advanced Management is required for snapshot permission reports, Restricted Content Discovery and Restricted Access Control - it is unlocked automatically if anyone in the tenant holds a Microsoft 365 Copilot licence, otherwise it is a paid add-on. E5 alone provides activity reports only."
azure_resources: []
lab_cost_estimate: "$0 - Microsoft 365 E5 tenant only. No Azure resources. Note that reports need at least 24 hours to populate, so this lab spans two sessions."
free_practice_available: true
forensic_relevance: "Copilot does not create exposure; it makes existing exposure reachable by asking. That inverts the usual investigative question - instead of 'who accessed this file', the useful question becomes 'who could have asked a question that returned it'. Purview audit records Copilot prompts and responses only when a collection policy exists, so the absence of that policy is itself a finding: the interactions happened and were never recorded."
---

# AI Data Exposure and Purview DSPM

> **Objective:** Implement security for AI
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Identify overexposure of data in SharePoint
- Identify risks related to Microsoft Copilot and AI apps by using Microsoft Purview Data Security Posture Management (DSPM)

> **This objective has no AZ-500 ancestor.** Nothing in the retiring exam covers it,
> which means there is no pool of second-hand prep material to lean on and no
> accumulated folklore to unlearn. Build it from the product documentation.

## Why this exists

Start with the sentence that explains the entire AI security domain:

**Copilot does not grant access to anything. It surfaces what the user could already
reach.**

That is Microsoft's design and it is genuinely true, and it is also why organisations
that deploy Copilot discover data problems within a week. Consider what "could already
reach" has meant in practice for a decade of SharePoint:

- A site shared with **Everyone Except External Users** in 2019 for a project that
  ended in 2020.
- An "Anyone with the link" file from a vendor negotiation, still live.
- Broken permission inheritance on a library nobody has opened since a reorganisation.
- A departed employee's OneDrive, shared broadly during handover.

Every one of those was technically discoverable before. In practice it was protected
by **obscurity through friction** - you would have had to know the site existed, know
roughly what was in it, and go looking. Search was bad enough that nobody found things
by accident.

Copilot removes the friction. "Summarise what we know about the Henderson
acquisition" traverses everything the user can read, at once, with no knowledge of
where anything lives. The permission model did not change. The *reachability* of the
permission model changed completely.

So this objective has two halves, in this order:

1. **Find the exposure that already exists** - SharePoint oversharing discovery
2. **See what AI is actually doing with your data** - Purview DSPM for AI

And a point of sequence worth holding onto: fixing oversharing is a permissions
project, not an AI project. The AI tooling tells you where to look and limits the
damage while you work, but nothing in DSPM for AI repairs a badly shared site.

## How it works under the hood

### What Copilot can actually see

Microsoft 365 Copilot reasons over content through the Microsoft Graph, honouring the
signed-in user's existing permissions. Three consequences:

- Anything the user can open, Copilot can read and summarise.
- Anything the user cannot open, Copilot cannot reach - there is no privileged index.
- **Sensitivity labels with encryption are enforced.** For Copilot to summarise
  labelled content, the user must hold the **EXTRACT and VIEW usage rights** granted by
  that label. A label that grants VIEW but not EXTRACT blocks summarisation while still
  allowing the person to open the file.

That last one is the cleanest control in the module: label-based encryption is the only
mechanism here that constrains Copilot at the *content* level rather than the site
level.

### Finding oversharing in SharePoint

The discovery surface is **Data Access Governance (DAG)** reports in the SharePoint
admin center, and the licensing split matters:

| Report type | What it gives | Licence |
| --- | --- | --- |
| **Activity reports** | Sharing activity over a recent window - "Everyone Except External Users" sharing, "Anyone" links, sharing with external users | **Microsoft 365 E5**, capped at 10,000 sites, and data collection must be enabled first |
| **Snapshot / permission state reports** | A point-in-time view of the whole permission structure across sites, OneDrive, and files | **SharePoint Advanced Management** |

**SharePoint Advanced Management (SAM)** - branded Microsoft SharePoint Premium - is an
add-on, and the licensing detail people miss: **it is unlocked automatically for all
SharePoint admins if anyone in the tenant holds a Microsoft 365 Copilot licence.** It
is also sold standalone. Many organisations already have it and do not know.

SAM provides the remediation tools as well, and the distinction between the two main
ones is exam-shaped:

| Control | What it does | Does it change permissions? |
| --- | --- | --- |
| **Restricted Content Discovery (RCD)** | Stops a site's content surfacing in Microsoft 365 Copilot and organisation-wide search | **No.** Anyone with access can still browse the site and open the files |
| **Restricted Access Control (RAC)** | Limits a site to members of specified Entra or Microsoft 365 groups | **Yes.** It overrides existing permissions *and* sharing links for everyone outside the group |

RCD is the containment measure: it reduces reachability while an access review runs,
without breaking anyone's work. RAC is the remediation: it genuinely locks the site
down. Choosing RCD when the question demands that unauthorised users lose access - or
RAC when the question says existing users must not be disrupted - is the trap.

Two operational notes worth carrying: **RCD can take up to 24 hours to take effect**,
and it can be delegated to site owners.

**Restricted SharePoint Search** - the tenant-wide allow-list of up to 100 sites - is
being retired, with new enablement blocked from **31 July 2026**. It was always a blunt
instrument. Plan around Restricted Content Discovery.

Beyond SAM, the built-in SharePoint controls still do real work:

- Default sharing links set to **Specific people** rather than organisation-wide
- **Hiding the Everyone Except External Users claim** from the sharing picker
- Site-level restrictions on member sharing, so owners handle access requests
- **Site access reviews**, initiated by the admin from a DAG report, where the site
  owner reviews SharePoint groups and individual items and decides what was genuinely
  oversharing
- **Inactive site policies**, because every abandoned site is both storage cost and
  another source Copilot has to reason through

### Purview DSPM for AI

DSPM for AI is the discovery and posture surface for AI usage across the tenant. It
does not introduce new enforcement; it uses existing Purview controls - sensitivity
labels, data classification, auditing, communication compliance, retention, eDiscovery -
and puts reports, recommendations, and **one-click policies** in front of them.

> **Naming, as of this writing:** the portal offers **DSPM for AI (classic)** and a
> newer unified **Data Security Posture Management (preview)**. Verify which your
> tenant shows before following any walkthrough, including this one.

What it reports on, in two categories:

- **Microsoft Copilot experiences** - Microsoft 365 Copilot, Copilot Chat, and related
  first-party experiences
- **Enterprise AI apps and other AI apps** - third-party generative AI reached from
  managed devices and browsers

The one-click policies are named objects you should recognise on sight:

| Policy | Created from | Owning solution |
| --- | --- | --- |
| **DSPM for AI - Capture interactions for Copilot experiences** | *Secure interactions in Microsoft Copilot experiences* | Purview Audit / collection policy |
| **DSPM for AI - Detect risky AI usage** | *Detect risky interactions in AI apps* | Insider Risk Management |
| **DSPM for AI - Unethical behavior in AI apps** | *Detect unethical behavior in AI apps* | Communication Compliance |

Two mechanical facts that generate exam questions:

1. **Prompts and responses are not captured by default.** Recording the actual
   interactions requires a **collection policy** - in practice, the *Capture
   interactions for Copilot experiences* one-click policy. Without it, DSPM shows
   activity counts but the content of what people asked and what came back was never
   stored. In an incident, that gap is unrecoverable.
2. **Reports need at least a day to populate.** An empty DSPM report on the afternoon
   you enabled it means nothing.

The policies are created from DSPM but **edited in their owning solution** - you tune
the unethical-behaviour policy in Communication Compliance, not in DSPM. And
recommendations disappear from the Overview page once completed or dismissed, so
"dismissed" is a decision, not a deferral.

Alongside DSPM, two Purview controls act directly on Copilot:

- **Sensitivity labels with encryption**, via the EXTRACT/VIEW rights described above
- **DLP for Microsoft 365 Copilot**, which prevents Copilot from accessing content
  carrying specified sensitivity labels - a label-driven exclusion rather than a
  site-driven one

## Configuration surface

| Setting | Default | Set it to | Why |
| --- | --- | --- | --- |
| DAG data collection | off | On, before you need a report | Activity reports have nothing to show until collection has been running |
| Default sharing link | often organisation-wide | **Specific people** | Changes the shape of every future share |
| Everyone Except External Users claim | visible | Hidden | Removes the one-click path to tenant-wide exposure |
| Restricted Content Discovery | off | On for known-overshared sites during review | Reduces reachability without breaking access |
| Restricted Access Control | off | On where access genuinely must be revoked | Overrides existing permissions and links |
| Restricted SharePoint Search | legacy | Do not build on it | New enablement blocked from 31 July 2026 |
| Site access reviews | not initiated | Initiated from DAG findings | Puts the decision with the site owner who knows the content |
| Collection policy for Copilot interactions | **not created** | Created | No prompts or responses are recorded without it |
| DSPM recommendations | pending | Actioned, then dismissed deliberately | Dismissed recommendations vanish from the Overview |
| Sensitivity labels on sensitive content | none | Labels with encryption; withhold EXTRACT where summarisation must be blocked | The only content-level control over Copilot |
| DLP for Microsoft 365 Copilot | none | Exclude labelled content from Copilot | Label-driven rather than site-driven |

## Common failure modes

**Treating oversharing as a Copilot problem.** It is a permissions problem that Copilot
made visible. Turning Copilot off does not fix it; it restores the friction that was
hiding it.

**Using RCD when access must actually be revoked.** RCD hides content from Copilot and
org-wide search and changes no permission. Every person who could open the file still
can.

**Using RAC when the requirement was "do not disrupt existing users."** RAC overrides
existing permissions and sharing links for anyone outside the group. That is its
purpose and it will break things.

**Enabling RCD the morning of a demonstration.** It can take 24 hours.

**Assuming E5 provides the permission snapshot reports.** E5 gives activity reports,
capped and requiring collection to be enabled. The snapshot and permission state
reports need SharePoint Advanced Management.

**Not realising SAM is already unlocked.** A single Microsoft 365 Copilot licence in
the tenant enables it for all SharePoint admins.

**Reading an empty DSPM report as a clean result.** Reports need at least 24 hours, and
third-party AI app discovery depends on managed devices reporting in.

**No collection policy.** DSPM shows that AI was used, not what was asked or returned.
This is the single highest-value configuration step in the module and it is off by
default.

**Editing a one-click policy in DSPM.** They are created there and managed in
Communication Compliance, Insider Risk Management, or Audit.

**Labelling content and expecting Copilot to be blocked.** A label without encryption
does not restrict Copilot. Encryption plus the withholding of EXTRACT does.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "stop content appearing in Copilot results without removing access" | Restricted Content Discovery |
| "only members of this group may access the site, overriding existing links" | Restricted Access Control |
| "identify sites shared with Everyone Except External Users" | DAG activity report |
| "point-in-time view of the permission structure" | DAG snapshot / permission state report, requires SAM |
| "site owner should confirm whether sharing is appropriate" | Site access review |
| "record what users asked Copilot" | Collection policy - *Capture interactions for Copilot experiences* |
| "detect risky AI usage" | DSPM one-click policy, managed in Insider Risk Management |
| "detect inappropriate prompts" | DSPM one-click policy, managed in Communication Compliance |
| "prevent Copilot summarising a document the user can still open" | Sensitivity label with encryption, withholding EXTRACT |
| "exclude labelled content from Copilot entirely" | DLP for Microsoft 365 Copilot |
| "discover third-party AI apps in use" | DSPM for AI, Enterprise AI apps / other AI apps |

**AZ-500 divergence.** Total. There is no AZ-500 equivalent for any of this, and that
cuts both ways: no outdated material to unlearn, but also no cross-check. Where a
third-party summary conflicts with the Microsoft documentation here, the documentation
wins - and both the DSPM naming and the Restricted SharePoint Search retirement moved
recently enough that even recent blog posts are unreliable.

## Hands-on

See [03-01 lab](../../labs/03-secure-compute/03-01-lab.md).

## Check yourself

1. Your organisation has not deployed Copilot. A colleague argues there is therefore no
   AI data exposure risk to address. Give the strongest version of their argument, then
   the rebuttal.
2. A site contains a confidential acquisition folder shared five years ago with Everyone
   Except External Users. Legal says nobody outside the deal team should be able to find
   it in Copilot, and the deal team must not be disrupted today. Name the control, and
   state precisely what risk remains after you apply it.
3. Same scenario, but Legal now says unauthorised users must lose access entirely.
   Which control, and what will break?
4. DSPM for AI shows 400 Copilot interactions last week. Your incident response team
   asks what a specific user asked on Tuesday. Under what configuration can you answer,
   and what do you tell them if that configuration was never in place?
5. A file carries a sensitivity label with encryption. A user can open it but Copilot
   refuses to summarise it. Explain the mechanism, and name the usage right involved.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Microsoft Purview data security and compliance protections for generative AI apps: <https://learn.microsoft.com/en-us/purview/ai-microsoft-purview>
- Microsoft Purview protections for Copilot and AI apps: <https://learn.microsoft.com/en-us/purview/ai-security-copilot>
- SharePoint Advanced Management overview: <https://learn.microsoft.com/en-us/sharepoint/advanced-management>
- Use SharePoint Advanced Management to get ready for Copilot: <https://learn.microsoft.com/sharepoint/get-ready-copilot-sharepoint-advanced-management>
- Microsoft 365 Copilot architecture, data protection, and auditing: <https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-architecture-data-protection-auditing>
