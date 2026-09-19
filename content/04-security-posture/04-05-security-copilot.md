---
objective: "Implement Microsoft Security Copilot"
sub_objectives:
  - "Configure workspaces for Security Copilot"
  - "Manage permissions and roles in Security Copilot"
  - "Enable and configure plugins"
  - "Enable and configure Microsoft agents and Security Store agents"
domain: "Manage and monitor security posture"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-01", "04-02", "04-04"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/copilot/security/manage-workspaces"
  - "https://learn.microsoft.com/copilot/security/authentication"
  - "https://learn.microsoft.com/training/paths/deploy-operate-security-copilot/"
  - "https://learn.microsoft.com/training/modules/configure-security-copilot-workspaces/1-introduction"
last_verified: "2026-09-17"
portal: "Microsoft Security Copilot portal"
powershell_module: "(portal-driven; no dedicated module)"
az_cli_command: ""
kql_tables: []
licensing: "Security Compute Units (SCUs), provisioned as an Azure capacity resource and billed hourly while provisioned. Verify what your Microsoft 365 licensing includes before assuming you must purchase capacity."
azure_resources: ["Microsoft.SecurityCopilot/capacities"]
lab_cost_estimate: "HIGHEST IN GUIDE. SCUs bill hourly from the moment capacity is provisioned, whether or not a single prompt is submitted. Provision, execute, and deprovision in one session - and set a timer."
free_practice_available: false
forensic_relevance: "Security Copilot inherits the signed-in user's existing permissions, so what it can answer is bounded by what that analyst could already query. That is the correct design and it has an investigative consequence: two analysts running the same prompt get different answers, and a prompt that returns nothing may mean no data or no access. Session history is also a record of what was asked and by whom, which makes it both an audit artifact and something worth governing."
---

# Microsoft Security Copilot

> **Objective:** Implement Microsoft Security Copilot
> **Domain:** Manage and monitor security posture (20-25%)

## Sub-objectives covered

- Configure workspaces for Security Copilot
- Manage permissions and roles in Security Copilot
- Enable and configure plugins
- Enable and configure Microsoft agents and Security Store agents

> **Cost warning, before anything else.** Security Compute Units bill **hourly from the moment
> capacity is provisioned**, used or not. This is the single largest spend risk in the guide by
> a wide margin - larger than Azure Firewall, larger than an AKS node pool. Read
> [00-01](../00-lab-safety/00-01-cost-guardrails-and-budgets.md) again before the lab.

## Why this exists

Domain 3 was about protecting AI workloads. This module is AI as the security tool, and it
closes the loop the guide opened in 03-01.

The problem it addresses is the one every SOC has: **the work is bounded by analyst time, and
most of that time goes on translation.** Translating an incident into a KQL query. Translating a
malware sample's behaviour into a written summary. Translating a script into an explanation of
what it does. Translating four consoles' worth of context into one sentence a manager can act
on. None of that is judgement; all of it is expensive.

But there is a security property that matters more than the productivity claim, and it is what
the exam tests: **Security Copilot does not have its own access to your data.** It reasons over
what the signed-in user could already reach, through plugins the organisation enabled, within a
workspace an owner configured. Every one of the four bullets is a control over that sentence.

So the objective is not "how do I use it." It is: **who may use it, over which data, with whose
permissions, at what capacity, and which autonomous agents are allowed to act.**

## How it works under the hood

### Workspaces and capacity

A **workspace** is the unit of segmentation, and it holds four things:

- **Capacity**, measured in **Security Compute Units (SCUs)**, provisioned as an Azure resource
- **Plugin configuration** - which data sources are available in that workspace
- **Role assignments** - who has owner and contributor access there
- **Session history and promptbooks** - what has been asked, reusable

Workspaces exist so that a large organisation can segment: different teams, different capacity
budgets, different plugin sets, and **different data storage locations for compliance** - the
geo selection is made at workspace creation and is a data residency decision, not a performance
one.

**Capacity provisioning needs two separate permissions**, and this is a favourite exam detail:

- **Azure Contributor or Owner** on the subscription or resource group - because the capacity is
  an Azure resource
- **Security Administrator or higher** in the tenant you are onboarding

Neither alone is sufficient. A Security Administrator with no Azure rights cannot provision
capacity; an Azure Owner with no tenant security role cannot attach it.

SCUs can be increased and decreased, and **capacity can be switched between workspaces**.
Monitoring usage is an ongoing task rather than a setup step, because consumption varies with
what people ask and which agents run.

### Roles and permissions

This is the part most worth getting exactly right.

Security Copilot introduces **two roles that are not Microsoft Entra ID roles.** They function
like access groups and control access only to the Security Copilot platform:

| Role | Grants |
| --- | --- |
| **Copilot owner** | Platform administration - workspace settings, plugin governance, capacity assignment |
| **Copilot contributor** | Use of the platform |

**By default, every user in the Microsoft Entra tenant is given Copilot contributor access.**
That is the sentence to remember. Onboarding Security Copilot does not restrict it to the SOC;
it opens it to the directory, and narrowing that is a deliberate act.

**Entra roles that inherit Copilot owner** include **Security Administrator** and **Global
Administrator**. The set of owner roles is configurable, and **only the roles you select inherit
owner on that workspace** - so this is a genuine least-privilege lever rather than a fixed list.
Recommended owner roles span Entra roles and service-specific ones: Purview Compliance
Administrator, Purview Data Governance Administrator, Purview Organization Management, Intune
Administrator, and Defender roles.

**And now the mechanism that matters most.** A Copilot role does **not** grant access to the
underlying security data. If a plugin needs a service role to read its data, the **user** must
hold that role.

Microsoft's own example is worth internalising: an analyst with **Compliance Administrator**
can use the Microsoft Purview plugin, because that role gives them Purview data access. **That
same analyst needs additional role assignments to reach Microsoft Sentinel data.** Copilot did
not elevate them; it inherited what they had.

Two consequences:

1. Two analysts running the same prompt can get different answers, legitimately.
2. An empty result means "no data" **or** "no access," and telling those apart is a permissions
   question, not a prompt question.

The permission matrix for multi-workspace operations follows the same shape - creating or
duplicating a workspace needs a supported owner role; setting or switching capacity needs an
owner role plus **capacity write**; merely switching between workspaces needs only Security
Operator or Contributor.

### Plugins

Plugins are how Copilot reaches data. Three categories:

- **Microsoft plugins** - Defender XDR, Sentinel, Entra, Intune, Purview, Defender Threat
  Intelligence, Defender EASM and others
- **Third-party plugins** - security vendors' own integrations
- **Custom plugins** - your own, built against KQL, APIs, or GPT-based definitions

**Plugin governance is an owner-level setting**, and it controls **who may add and publish
custom plugins**. Left permissive, any contributor - which by default means any user in the
tenant - can introduce a plugin that reaches an external API with credentials it holds. That is
the plugin equivalent of the consent problem from
[01-01](../01-identity-access-governance/01-01-entra-id-secure-access.md), and it deserves the
same treatment: restrict who can publish, and review what exists.

Plugin settings are **workspace-scoped**, so different teams can have different data reach
within the same tenant.

### Agents

Agents are the autonomous layer: they run defined security work rather than answering a prompt.

**Microsoft agents** cover recurring SOC tasks - triaging phishing submissions, triaging alerts,
optimising Conditional Access policies, prioritising vulnerability remediation, and producing
threat intelligence briefings. **Microsoft Security Store** extends this with partner-built
agents and security solutions.

> The agent catalogue is expanding quickly. Verify the current list before the exam rather than
> memorising this one.

Three governance points that matter more than the catalogue:

- **Agents consume SCUs.** An agent running on a schedule consumes capacity continuously, and an
  agent enabled and forgotten is a recurring charge with no one watching the output.
- **Agents are assigned to a workspace.** Setting the preferred workspace for Microsoft agents is
  an owner-level action, and it determines which capacity they draw from and which plugin set
  they use.
- **Agents act with permissions.** The same inheritance principle applies, which makes the
  question "what can this agent reach" the same question you asked about Entra Agent ID in
  [03-02](../03-secure-compute/03-02-ai-agent-identity-and-governance.md). The two modules are
  the same governance problem from two directions: 03-02 governs agents you build, this one
  governs agents you enable.

**Agent lifecycle management** - enabling, assigning, monitoring, retiring - is the
administrative work this bullet is really about.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| Capacity (SCUs) | none | The minimum that works, monitored | **Bills hourly while provisioned** |
| Workspace geo | chosen at creation | Where data residency requires | Not a performance setting |
| Copilot contributor | **every user in the tenant** | Restricted deliberately | Onboarding opens it to the directory |
| Owner roles | a default set | Only the roles that need administration | Only selected roles inherit owner |
| Underlying data access | the user's existing roles | Assigned per service, per analyst | A Copilot role grants no data access |
| Custom plugin publishing | permissive | Restricted to named owners | A plugin can reach an external API |
| Plugin set | broad | Per workspace, matched to the team | Workspace-scoped by design |
| Microsoft agents | off | Enabled deliberately, assigned to a workspace | They consume SCUs on a schedule |
| Capacity monitoring | none | Reviewed regularly | Consumption varies with usage and agents |

## Common failure modes

**Capacity provisioned and left running.** The defining cost mistake of this module. SCUs bill
by the hour whether or not anyone submits a prompt.

**Only one of the two provisioning permissions.** Security Administrator without Azure rights,
or Azure Owner without a tenant security role. Provisioning fails and the cause is not obvious.

**Assuming onboarding restricts access.** Every user in the tenant gets Copilot contributor by
default.

**Expecting a Copilot role to grant data access.** It does not. The analyst needs the service
role for each plugin's data - Purview access does not confer Sentinel access.

**Reading an empty answer as "nothing found."** It may be "nothing you are allowed to see."

**Custom plugin publishing left open.** Any contributor can introduce a plugin that reaches an
external endpoint.

**Plugins enabled tenant-wide when the workspace model would have scoped them.** Workspaces exist
precisely so different teams reach different data.

**Agents enabled and forgotten.** They consume capacity on a schedule and produce output nobody
reads.

**Agent assigned to the wrong workspace.** It draws from the wrong capacity and sees the wrong
plugin set.

**Treating output as verified.** It summarises and correlates; it does not vouch. The analyst
owns the conclusion.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "different teams, different capacity and plugins" | Separate workspaces |
| "data must stay in a region" | Workspace geo selection at creation |
| "who can provision capacity" | Azure Contributor/Owner **plus** Security Administrator or higher |
| "restrict who can administer Security Copilot" | Owner roles - only selected roles inherit |
| "all users can access Copilot" | Copilot contributor is granted to the tenant by default |
| "analyst can query Purview but not Sentinel" | Underlying service roles, not Copilot roles |
| "prevent users adding their own plugins" | Owner-level plugin governance setting |
| "extend Copilot to a non-Microsoft data source" | Custom or third-party plugin |
| "automate phishing submission triage" | A Microsoft agent |
| "partner-built agents" | Microsoft Security Store |
| "agent must use this team's capacity" | Assign the agent's preferred workspace |
| "reduce Security Copilot cost" | Reduce provisioned SCUs; review scheduled agents |

**AZ-500 divergence.** Nothing here has an AZ-500 ancestor. The more useful warning is recency:
workspaces, the owner-role selection model, and Security Store agents are all recent additions,
and material written even a few months ago describes a smaller product. Check the documentation
rather than trusting a walkthrough.

## Hands-on

See [04-05 lab](../../labs/04-security-posture/04-05-lab.md).

## Check yourself

1. Your organisation onboards Security Copilot. A finance user discovers they can open the
   portal. Explain why, and describe what you would change.
2. An analyst holding Compliance Administrator reports that Copilot answers Purview questions
   well but returns nothing for Sentinel. Give the mechanism and the fix, and explain why this
   is the correct design rather than a bug.
3. Provisioning capacity fails for an administrator who holds Global Administrator in the
   tenant. Give the most likely cause.
4. Compare the governance question in this module with the one in 03-02. What is the same about
   an Entra Agent ID and a Security Copilot agent, and what is different?
5. Your SCU bill is three times last month's and analyst usage is unchanged. List what you would
   check, in order.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Manage Security Copilot workspaces: <https://learn.microsoft.com/copilot/security/manage-workspaces>
- Security Copilot authentication and roles: <https://learn.microsoft.com/copilot/security/authentication>
- Deploy and operate Microsoft Security Copilot (learning path): <https://learn.microsoft.com/training/paths/deploy-operate-security-copilot/>
- Configure Security Copilot workspaces (module): <https://learn.microsoft.com/training/modules/configure-security-copilot-workspaces/1-introduction>
