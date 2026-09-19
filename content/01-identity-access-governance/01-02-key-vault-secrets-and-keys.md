---
objective: "Secure secrets and keys by using Azure Key Vault"
sub_objectives:
  - "Deploy Key Vault"
  - "Configure Key Vault settings"
  - "Configure access to Key Vault"
  - "Configure firewall settings on Key Vault"
  - "Manage keys, secrets, and certificates"
  - "Scan for secrets by using Defender Cloud Security Posture Management (Defender CSPM)"
  - "Implement Defender for Key Vault"
domain: "Manage identity, access, and governance"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-01"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/key-vault/general/rbac-access-policy"
  - "https://learn.microsoft.com/en-us/azure/key-vault/general/access-control-default"
  - "https://learn.microsoft.com/azure/key-vault/general/network-security"
  - "https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview"
  - "https://learn.microsoft.com/en-us/azure/key-vault/general/versions"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/secrets-scanning"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/secrets-scanning-servers"
  - "https://learn.microsoft.com/azure/defender-for-cloud/secrets-scanning-cloud-deployment"
  - "https://learn.microsoft.com/azure/defender-for-cloud/tutorial-enable-key-vault-plan"
last_verified: "2026-09-17"
portal: "Azure portal > Key vaults; Defender for Cloud > Environment settings"
powershell_module: "Az.KeyVault, Az.Resources, Az.Security"
az_cli_command: "az keyvault create"
kql_tables: []
licensing: "Defender for Key Vault plan (CWPP) and Defender CSPM plan, both billed at subscription scope"
azure_resources: ["Microsoft.KeyVault/vaults", "Microsoft.KeyVault/vaults/secrets", "Microsoft.KeyVault/vaults/keys"]
lab_cost_estimate: "Low - vault operations cost fractions of a cent. Defender for Key Vault and Defender CSPM bill at subscription scope while on; enable at the start of the session and set both back to Free during teardown."
free_practice_available: false
forensic_relevance: "A key vault is an early-stage objective in most cloud intrusions, so its data-plane log is a high-value artifact: it records which principal read which secret from which IP, and Defender for Key Vault alerts specifically on anomalous access patterns. The inverse question - which secrets exist outside the vault - is what Defender CSPM secret scanning answers, and it is usually how lateral movement was possible in the first place."
---

# Secrets and Keys with Azure Key Vault

> **Objective:** Secure secrets and keys by using Azure Key Vault
> **Domain:** Manage identity, access, and governance (20-25%)

## Sub-objectives covered

- Deploy Key Vault
- Configure Key Vault settings
- Configure access to Key Vault
- Configure firewall settings on Key Vault
- Manage keys, secrets, and certificates
- Scan for secrets by using Defender Cloud Security Posture Management (Defender CSPM)
- Implement Defender for Key Vault

## Why this exists

An application that talks to a database needs a connection string. That string has
to exist somewhere at runtime. The historical answers were all bad in the same way:

- **In the source** - now it is in every clone, every fork, and the repository's
  entire history, which survives deleting the line.
- **In a config file on the server** - now anyone who can read the disk, take a
  snapshot, or restore a backup has it.
- **In an environment variable** - better, but it is still plaintext to anything
  that can read the process environment, and it gets shipped into logs and crash
  dumps more often than anyone expects.

A vault fixes the storage problem: the secret lives in one hardened, audited,
network-restricted place, and every read is attributable.

But notice what it does not fix on its own. **To read a secret from the vault, the
application must first authenticate to the vault.** If you solve that with a client
secret in a config file, you have added a hop and changed nothing. The vault is
only worth having when the caller proves who it is without holding a secret - which
is the managed identity you configured in
[01-01](./01-01-entra-id-secure-access.md). Key Vault and managed identity are one
control split across two objectives; the exam tests them separately and reality
does not.

The second idea is the uncomfortable one. Centralising secrets creates a chokepoint,
and a chokepoint is both a control and a target. Everything else in this module
follows from that:

- Restrict who can reach it at the identity layer → **access control**
- Restrict who can reach it at the network layer → **firewall and private endpoints**
- Detect the access that gets through anyway → **Defender for Key Vault**
- Find the credentials that never made it into the vault in the first place →
  **Defender CSPM secret scanning**
- And make sure nobody can quietly destroy it → **soft delete and purge protection**

## How it works under the hood

### Two planes, and almost every Key Vault confusion is a plane confusion

| | Control plane | Data plane |
| --- | --- | --- |
| Endpoint | Azure Resource Manager (`management.azure.com`) | `<vault-name>.vault.azure.net` |
| Operations | Create the vault, change its SKU, set network rules, toggle `enableRbacAuthorization`, read tags | Read, write, list keys, secrets, certificates |
| Governed by | Azure RBAC only | Azure RBAC **or** the legacy access policy model |
| Filtered by the vault firewall? | **No** | **Yes** |

Two consequences that appear on exams and in incidents:

1. **The vault firewall does not protect vault configuration.** A principal with
   Contributor can read and change the vault's settings from any address, because
   that traffic goes to ARM, not to the vault endpoint.
2. **Under the access policy model, control-plane write is data-plane read.**
   Anyone holding `Microsoft.KeyVault/vaults/write` - Contributor, Key Vault
   Contributor - can add an access policy granting themselves secret access. That
   is not a bug; it is the model. It is also the single strongest argument for the
   RBAC model, where data-plane permissions are role assignments and only Owner or
   User Access Administrator can create them.

### The three object types are not interchangeable

| Object | What comes back to the caller | Typical use |
| --- | --- | --- |
| **Secret** | The value itself | Connection strings, passwords, API keys |
| **Key** | Never the private key material - you send data *to* the vault and it performs the operation | Encryption at rest with customer-managed keys, signing |
| **Certificate** | A managed bundle that also creates an addressable key and a secret | TLS certificates with lifecycle and auto-renewal |

The distinction matters because it changes the blast radius of a read. Exfiltrating
a secret gives an attacker the secret. Access to a key gives an attacker the ability
to *use* the key while the access lasts - which is worse in some ways and better in
others, and is why customer-managed keys are an availability risk as well as a
security control. Premium SKU and Managed HSM back keys with hardware modules;
Standard SKU keys are software-protected.

Every object is versioned. Writing a new value creates a new version and the old
one remains retrievable unless disabled. An unversioned URI resolves to the current
version, which is what makes rotation transparent to a caller that references it.

### Authorization: RBAC versus access policies

This is the highest-value thing to get straight in this module, and it changed
recently.

**Azure RBAC is the recommended data-plane authorization system.** Since **Key Vault
API version 2026-02-01**, new vaults default to Azure RBAC
(`enableRbacAuthorization = true`), matching what the portal already did. Existing
vaults keep whatever model they have until you change it explicitly, and **both
models remain fully supported** - access policies are legacy, not retired. Any
AZ-500-era walkthrough that opens with "go to Access policies" is describing the
model you should not be choosing for a new vault.

Built-in data-plane roles worth knowing by name:

| Role | Grants |
| --- | --- |
| Key Vault Administrator | All data-plane operations on all object types |
| Key Vault Secrets Officer | Full management of secrets, including delete |
| Key Vault Secrets User | **Read secret values only** - the role an application gets |
| Key Vault Certificates Officer | Full management of certificates |
| Key Vault Crypto Officer | Full management of keys |
| Key Vault Crypto User | Use keys for cryptographic operations, not manage them |
| Key Vault Reader | Metadata about the vault and its objects - **not secret values** |

Key Vault Reader versus Key Vault Secrets User is a favourite exam pairing. Reader
sees that a secret named `db-conn` exists. Secrets User sees what is in it.

RBAC assignments can be scoped to the vault or to an individual secret, key, or
certificate. Scoping to the individual object is the least-privilege answer, and it
is the one people forget exists.

### Network controls

The vault's network rules filter the **data plane** only. Three positions:

1. **Allow public access from all networks.** The default on creation. Authentication
   is still required, but the endpoint is reachable from anywhere.
2. **Allow public access from specific virtual networks and IP addresses.** IP rules
   accept public IPv4 addresses and CIDR ranges - **RFC 1918 private ranges are
   rejected**, and IPv6 is not supported. Virtual network rules require the
   `Microsoft.KeyVault` service endpoint on the subnet, which keeps the traffic on
   the Azure backbone.
3. **Disable public access.** Data-plane reachable only through a **private
   endpoint**, which gives the vault a private IP in your virtual network. Private
   DNS is the part that breaks: the vault's public FQDN must resolve to the private
   IP from inside the network, or clients will keep trying the blocked public path.

**Trusted Microsoft services** is an exception you can switch on alongside the
firewall. Three things the exam likes about it:

- The trusted list covers services where Microsoft controls all the code that runs.
  Services that let you write your own code - Azure DevOps being the standard
  example - are not on it, which is not a judgment about their security.
- The bypass **continues to apply when public network access is Disabled**. Trusted
  services do not need a private endpoint to reach the vault.
- The bypass is **overridden** when the vault is associated with a **Network
  Security Perimeter** and public access is set to secure-by-perimeter. Then even
  trusted services are blocked unless a perimeter access rule admits them. That is
  the connection point to Domain 2, where the perimeter itself is the objective.

### Deletion is not deletion

Covered as a teardown trap in
[00-03](../00-lab-safety/00-03-teardown-checklist-template.md) and repeated here
because it is also exam content:

- **Soft delete is always on and cannot be turned off.** A deleted vault is
  recoverable for the retention period, configurable from 7 to 90 days, defaulting
  to 90 - **and the vault name stays reserved for that whole window**.
- **Purge protection cannot be disabled once enabled**, on the vault or inherited
  from policy. With it on, nobody - not you, not a compromised Owner - can purge the
  vault before retention expires. That is the point: it defends against destructive
  attack and against ransom scenarios involving customer-managed keys.
- Individual secrets, keys, and certificates are soft-deleted too, and a purged
  object is gone.

In production, purge protection on. In a lab, off, or you cannot reuse the name for
up to 90 days.

### Defender for Key Vault versus Defender CSPM secret scanning

Both appear in this objective. They are opposite-facing controls and the exam tests
whether you know which one answers which question.

**Defender for Key Vault** is a workload protection plan (CWPP). It assumes the
vault is configured correctly and watches the data plane for suspicious access -
unusual principals, unusual locations, anomalous volume or enumeration patterns. It
is enabled per subscription, **off by default**, and covers every vault in the
subscription immediately once on, with nothing to configure per vault. Enabling
Defender for Cloud does not enable it.

**Defender CSPM secret scanning** faces the other way: it looks for credentials that
are sitting *outside* the vault, where they became a lateral-movement accelerant.
Scanning is agentless - for machines it snapshots the disk through cloud APIs, with
no agent, no inbound connectivity, and no impact on the running workload.

| Scanning type | What it covers | Plan required |
| --- | --- | --- |
| Machine scanning | Plaintext secrets on multicloud VM disks | Defender CSPM **or** Defender for Servers Plan 2 |
| Cloud deployment resource scanning | Secrets in infrastructure-as-code deployment resources, including values surfaced only at deployment time | Defender CSPM |
| Code repository scanning | Exposed secrets in Azure DevOps | Defender CSPM |

Detected types include storage connection strings and SAS tokens, SQL and Cosmos DB
credentials, SSH private keys, Entra ID client secrets, and personal access tokens.
For SSH keys the engine goes further and tests whether a discovered key actually
authenticates to another reachable machine: unverified keys appear as
recommendations, verified ones appear as **attack paths**, because a proven pivot is
a different finding from a suspicious file.

## Configuration surface

| Setting | Default | Set it to | Why |
| --- | --- | --- | --- |
| Permission model | Azure RBAC for vaults created with API 2026-02-01+ | Azure RBAC, explicitly | Access policies let anyone with vaults/write grant themselves data access |
| SKU | Standard | Standard for labs, Premium where HSM-backed keys are required | Software-protected keys are adequate until a compliance requirement says otherwise |
| Soft-delete retention | 90 days | 7 in a lab, 90 in production | The name is held for the whole window |
| Purge protection | Off | **On in production, off in labs** | Irreversible; a lab vault name becomes unusable for the retention period |
| Public network access | All networks | Specific networks, or disabled with a private endpoint | Authentication-only exposure is still exposure |
| Trusted services bypass | Off | On only when a specific trusted service needs it | It is a standing exception, not a convenience |
| Diagnostic settings | None | Send AuditEvent to the Log Analytics workspace | Without this there is no data-plane log to investigate |
| Defender for Key Vault | Off | On | No anomalous-access alerting at all without it |
| Defender CSPM | Off (foundational CSPM is free but excludes secret scanning) | On while you need scanning | Secret scanning is a paid-plan capability |
| RBAC scope | Vault | Individual secret or key where practical | Object-level scope is supported and rarely used |

## Common failure modes

**The vault that solved nothing.** Application authenticates to Key Vault with a
client secret stored in `appsettings.json`. Every audit passes. Use a managed
identity or the vault is decoration.

**Two permission models, one vault, one confused admin.** The vault is in RBAC mode,
somebody adds an access policy, and it has no effect - or the reverse. Check
`enableRbacAuthorization` before you debug anything else.

**Contributor treated as a low-privilege role.** Under the access policy model it is
effectively full data-plane access, one step away.

**Purge protection enabled in a lab "because it is best practice."** The vault name
is now unusable for up to 90 days, with no override at any privilege level.

**Public access disabled before the private endpoint and DNS work.** The vault
becomes unreachable on the data plane. The control plane still works, so you can
reverse it - but only if you remember which plane you are on.

**Private endpoint created, DNS forgotten.** The FQDN still resolves publicly from
inside the VNet, the client hits the blocked public path, and the failure looks like
an authorization problem.

**RFC 1918 address entered as an IP rule.** Rejected. People then add the NAT
gateway's public address without realising that is what they needed all along.

**Secret expiry set with nothing watching it.** Key Vault lets you set expiry dates
on objects; nothing enforces them at read time in every client library, and nothing
tells you the certificate expires on Saturday unless you configured an event
subscription or a Defender recommendation view.

**Defender for Cloud enabled, Key Vault plan not.** A very common audit finding, and
the reason the objective says *implement* rather than *have*.

**Secret scanning enabled with no scannable surface.** Machine scanning needs
machines. In a lab with no VMs, expect no findings, and do not read that as a clean
result.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "application must read only the value, nothing else" | Key Vault Secrets User |
| "must see which secrets exist but not their values" | Key Vault Reader |
| "grant access to a single secret" | Object-scoped RBAC assignment |
| "prevent an administrator from granting themselves access" | RBAC permission model, not access policies |
| "must not be permanently deleted, even by an administrator" | Purge protection |
| "reuse the vault name immediately" | Soft-delete retention, and purge the deleted vault |
| "only reachable from the virtual network" | Disable public access + private endpoint |
| "alert on unusual access to the vault" | Defender for Key Vault |
| "find credentials stored outside the vault" | Defender CSPM secret scanning |
| "no agent may be installed" | Agentless scanning |
| "hardware-backed key" | Premium SKU or Managed HSM |

Cost and scope questions also show up: Defender plans are enabled at **subscription**
scope, not on the vault, which is why deleting the resource group does not stop the
charge - the point made in [00-01](../00-lab-safety/00-01-cost-guardrails-and-budgets.md).

**AZ-500 divergence.** The vault itself is stable; the defaults and the surrounding
detection surface are not. New vaults now default to the RBAC permission model, the
trusted-services bypass now interacts with Network Security Perimeter, and CSPM
secret scanning has no AZ-500 precedent as an exam objective. Treat older
walkthroughs as a guide to the blades, not to the answers.

## Hands-on

See [01-02 lab](../../labs/01-identity-access-governance/01-02-lab.md).

## Check yourself

1. A vault has `enableRbacAuthorization = true` and a colleague adds an access
   policy granting themselves Get on secrets. Nothing changes. Explain precisely
   why, and name the change that would make the policy take effect.
2. You set the vault firewall to deny all networks. You can still rename the vault's
   tags and change its SKU from your laptop, but `Get-AzKeyVaultSecret` fails. Which
   plane is each operation on, and what does that tell you about what the firewall
   is and is not protecting?
3. An application uses a managed identity and holds Key Vault Secrets User at vault
   scope. A reviewer says this violates least privilege. What is the more precise
   assignment, and what operational cost does it carry?
4. Defender CSPM secret scanning reports an SSH private key on a VM disk as an
   attack path rather than a recommendation. What extra fact did the engine
   establish, and why does it change how you triage it?
5. You enable purge protection on a lab vault and then delete the resource group.
   Two weeks later the same lab needs the same vault name. What are your options?

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Azure RBAC vs. access policies: <https://learn.microsoft.com/azure/key-vault/general/rbac-access-policy>
- Default access control model for new vaults: <https://learn.microsoft.com/en-us/azure/key-vault/general/access-control-default>
- Key Vault network security: <https://learn.microsoft.com/azure/key-vault/general/network-security>
- Key Vault soft-delete overview: <https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview>
- Key Vault API versions and what's new: <https://learn.microsoft.com/en-us/azure/key-vault/general/versions>
- Defender for Cloud secrets scanning overview: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/secrets-scanning>
- Machine secrets scanning: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/secrets-scanning-servers>
- Cloud deployment secrets scanning: <https://learn.microsoft.com/azure/defender-for-cloud/secrets-scanning-cloud-deployment>
- Enable the Defender for Key Vault plan: <https://learn.microsoft.com/azure/defender-for-cloud/tutorial-enable-key-vault-plan>
