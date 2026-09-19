---
objective: "Implement security for databases"
sub_objectives:
  - "Implement platform-level security configurations in Azure SQL"
  - "Configure database auditing for Azure SQL Database and Azure SQL Managed Instance"
  - "Configure Defender for Databases protection across Azure database services"
domain: "Secure storage, databases, and networking"
domain_weight: "25-30%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-01", "01-02", "02-01"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/azure-sql/database/auditing-setup"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/sql-azure-vulnerability-assessment-enable"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/configure-vulnerability-findings-express"
  - "https://learn.microsoft.com/en-us/AZURE/defender-for-cloud/sql-azure-vulnerability-assessment-manage"
last_verified: "2026-09-17"
portal: "Azure portal > SQL databases / SQL servers > Security; Defender for Cloud > Environment settings"
powershell_module: "Az.Sql, Az.Security, Az.Monitor"
az_cli_command: "az sql server update"
kql_tables:
  - "SQLSecurityAuditEvents"
  - "AzureDiagnostics"
licensing: "Microsoft Defender for Databases, billed per server per month for the Azure SQL sub-plan"
azure_resources: ["Microsoft.Sql/servers", "Microsoft.Sql/servers/databases"]
lab_cost_estimate: "Medium - use Azure SQL Database serverless with auto-pause. Do not deploy SQL Managed Instance in a self-funded lab; it costs hundreds of dollars and hours to provision. Defender for Databases bills per server per month."
free_practice_available: false
forensic_relevance: "SQL audit is one of the few logs that records the statement text, so it answers what was read rather than only that a connection happened. It is also the log most often configured at the wrong level: a database-level policy on one database while the rest of the server is unaudited, or a retention window shorter than the time it takes anyone to notice. SQLSecurityAuditEvents in Log Analytics is where this becomes queryable rather than archival."
---

# Database Security

> **Objective:** Implement security for databases
> **Domain:** Secure storage, databases, and networking (25-30%)

## Sub-objectives covered

- Implement platform-level security configurations in Azure SQL
- Configure database auditing for Azure SQL Database and Azure SQL Managed Instance
- Configure Defender for Databases protection across Azure database services

## Why this exists

Storage in [02-01](./02-01-storage-account-security.md) held files. A database holds
*structured, queryable* data, and that difference changes the threat model in two
ways that drive this entire objective.

**First: the query is the attack surface.** Nobody exfiltrates a database by copying
it. They ask it questions. That means the useful security question is not only "who
connected" but "what did they ask, and what came back" - which is why auditing here
records statement text, and why SQL injection is a database security topic rather
than an application one.

**Second: the database server authenticates people itself.** Storage only ever spoke
Entra, shared key, or SAS. Azure SQL has its own login system - SQL authentication -
that predates Entra by decades and works entirely outside it. A SQL login is a
username and password living inside the database engine, invisible to Conditional
Access, PIM, and every control in Domain 1.

That is the single most important framing in this module. **Everything you built in
Domain 1 applies to an Azure SQL server only to the extent that SQL authentication is
turned off.** Microsoft Entra-only authentication is not a hardening nicety; it is
what connects the database to the identity control plane at all.

The rest of the objective layers on top:

- Who can reach the server at the network layer - firewall rules and private endpoints
- What the data looks like when it is returned - masking, row-level security, encryption
- What was actually done - auditing
- What was suspicious about it - Defender for Databases

## How it works under the hood

### Authentication: two systems, one of which you want

| | SQL authentication | Microsoft Entra authentication |
| --- | --- | --- |
| Credential | Login and password stored in the engine | Entra token |
| Subject to Conditional Access, MFA, PIM | **No** | Yes |
| Revocation | `DROP LOGIN`, per server | Disable the account once, everywhere |
| Visible in Entra sign-in logs | No | Yes |

Every logical server is created with a SQL administrator login. You then assign a
**Microsoft Entra admin** on the server - a user or, better, a group. Setting
**Microsoft Entra-only authentication** disables SQL authentication entirely,
including that original admin login. After that, every connection carries an Entra
token and is subject to everything in 01-01.

Applications should connect with a **managed identity** and hold a database user
mapped to it - the same pattern as Key Vault in 01-02, for the same reason.

### Network: the firewall rule that is not what it looks like

Azure SQL has two firewall layers:

- **Server-level rules**, stored in the `master` database, applying to every database
  on the logical server.
- **Database-level rules**, set with T-SQL on an individual database, evaluated first
  and useful for narrowing access below the server rule.

The trap is the portal toggle **"Allow Azure services and resources to access this
server."** It writes a rule for `0.0.0.0`, and that does not mean "your Azure
resources." It means **any resource in any Azure subscription in any tenant**, which
includes the attacker's. It exists because it makes demos work. Treat it as a finding.

Beyond the firewall:

- **`publicNetworkAccess = Disabled`** plus a **private endpoint** removes the public
  endpoint entirely.
- **Connection policy** - `Redirect`, `Proxy`, or `Default` - decides whether clients
  connect straight to the node or through a gateway. `Redirect` performs better but
  needs ports 11000-11999 open, which is the detail that breaks private-endpoint
  deployments behind restrictive network security groups.
- **Minimal TLS version** should be set explicitly.
- **Outbound firewall rules** restrict where the *server itself* may connect,
  relevant when a compromised database is used to push data out.

### Data protection features, and which ones are security boundaries

This is the part people memorise badly, because the features sound interchangeable
and are not.

| Feature | Where it acts | Is it a security boundary? |
| --- | --- | --- |
| **Transparent Data Encryption (TDE)** | At rest, on disk | Against stolen media and backups. Not against an authorized query |
| **TDE with customer-managed key** | Same, key held in Key Vault | Adds key custody. Losing the key loses the database |
| **Always Encrypted** | Client side - keys never reach the server | **Yes**, including against a database administrator |
| **Always Encrypted with secure enclaves** | Same, plus in-enclave computation | Yes, and it allows richer queries on encrypted columns |
| **Dynamic Data Masking** | Presentation layer, on the way out | **No.** See below |
| **Row-Level Security** | Query predicate, inside the engine | Yes, for row visibility |
| **Ledger** | Cryptographic tamper evidence | Detection, not prevention |
| **Data discovery and classification** | Metadata labels on columns | No - it feeds other controls |

**Dynamic Data Masking is not a security boundary and the exam knows it.** It masks
values in the result set for unprivileged users, but the data is still there and
still queryable: a user who can run `WHERE ssn LIKE '123%'` can infer the value one
predicate at a time. DDM prevents shoulder-surfing and casual exposure in an
application. It does not prevent a determined reader. When a question asks to protect
data *from the DBA*, the answer is Always Encrypted.

TDE with a customer-managed key connects directly back to
[01-02](../01-identity-access-governance/01-02-key-vault-secrets-and-keys.md): the
TDE protector lives in a key vault, that vault needs soft delete and purge protection,
and the server reaches it with a managed identity. Delete the key and the database
becomes inaccessible - which is the control working, and also the availability risk
you accepted.

### Auditing

Auditing has two levels and three destinations, and the interaction between them is
exam material.

**Levels:**

- **Server-level policy** applies to every database on the logical server, including
  databases created later. This is the one you want.
- **Database-level policy** applies to one database. If a server policy is also on,
  the two run **side by side** and the database is audited twice - duplicate records,
  duplicate ingestion cost. Enable database-level auditing only for a requirement the
  server policy genuinely cannot meet.

**Destinations** - storage account, Log Analytics workspace, Event Hubs - and you can
configure **any combination**; logs are written to each one you enable.

- Choosing **Log Analytics** or **Event Hubs** creates a diagnostic setting with the
  **`SQLSecurityAuditEvents`** category. That table name is what you query, and it is
  the bridge into the Sentinel work in Domain 4.
- Writing to a **storage account** offers two authentication types: **managed
  identity** (system-assigned or user-assigned) or storage access keys. Managed
  identity is the right answer, and it is the same argument as everywhere else -
  though note it means the storage account's firewall must admit that identity, which
  is where the resource instance rules from 02-01 earn their keep.

The **default policy** audits three action groups: `BATCH_COMPLETED_GROUP`,
`SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP`, and
`FAILED_DATABASE_AUTHENTICATION_GROUP` - that is, every query and stored procedure
executed, plus successful and failed logins. Character fields are truncated at 4,000
characters, so a very long statement is recorded incompletely.

**Azure SQL Managed Instance** audits the same events but is configured differently -
server audit objects created with T-SQL (`CREATE SERVER AUDIT`), written to storage,
Log Analytics, or Event Hubs. The exam tends to test that both are auditable and that
the destinations are the same, rather than the T-SQL syntax.

Separately, **auditing of Microsoft support operations** records what Microsoft
support personnel do on your server during a support request. It is a distinct toggle
and a favourite "which setting gives you *that* record" question.

### Defender for Databases

One plan with several sub-plans, and the exam expects you to know the coverage:

| Sub-plan | Covers |
| --- | --- |
| Azure SQL Databases | Azure SQL Database, Azure SQL Managed Instance, Synapse dedicated SQL pools |
| SQL servers on machines | SQL Server on Azure VMs and Arc-enabled machines, including on-premises |
| Open-source relational databases | Azure Database for PostgreSQL, MySQL, MariaDB |
| Azure Cosmos DB | Cosmos DB accounts |

Each sub-plan can be enabled independently, at subscription scope, so "protect all
database services" is several toggles rather than one.

The Azure SQL sub-plan delivers two things:

**Advanced Threat Protection.** Alerts on SQL injection patterns, brute force,
anomalous access from unusual locations or principals, and suspicious data
exfiltration shapes.

**SQL vulnerability assessment**, which changed materially and is a likely exam
target:

| | Classic configuration | **Express configuration** |
| --- | --- | --- |
| Storage account | Required, customer-managed | **None** |
| Setup | Manual, per server | Automatic when the plan is enabled |
| Baselines | Take effect after a rescan | Take effect without rescanning |
| Scan result size | Unlimited | Up to 1 MB per rule |
| Export | Excel, Azure Resource Graph | Azure Resource Graph |
| Status | Legacy | **Recommended**, GA for Azure SQL Database, Managed Instance, and Synapse |

Enabling the Defender for Azure SQL plan **automatically turns on Advanced Threat
Protection and vulnerability assessment in express configuration** for every Azure SQL
database in the subscription. Moving an express-configured database back to classic
requires disabling the plan and reconfiguring through PowerShell - which tells you
which direction Microsoft expects traffic to flow.

The quick way to tell which one you are on: open the database → **Security** →
**Defender for Cloud** → **Configure**. **If it asks for a storage account, you are on
classic.**

## Configuration surface

| Setting | Default | Set it to | Why |
| --- | --- | --- | --- |
| Microsoft Entra admin | not set | A group, not a person | Nothing in Domain 1 reaches the server until this exists |
| Entra-only authentication | off | **On** | Disables SQL logins, which no Conditional Access policy can see |
| "Allow Azure services..." | off on new servers | **Off** | It is a `0.0.0.0` rule admitting any Azure tenant |
| Server firewall rules | none | Specific addresses, or none plus a private endpoint | Database-level rules narrow further |
| `publicNetworkAccess` | Enabled | Disabled where a private endpoint exists | Removes the public endpoint entirely |
| Minimal TLS version | varies | 1.2 or higher, explicitly | Auditable |
| TDE | On, service-managed key | CMK where key custody is required | CMK adds an availability dependency on the vault |
| Auditing | Off | **Server level**, to Log Analytics | Covers databases created later |
| Database-level auditing | Off | Leave off unless required | Duplicate records and duplicate cost |
| Microsoft support operations auditing | Off | On | The only record of support-side activity |
| Defender for Databases | Off per sub-plan | On for each service you actually run | Per-server monthly billing |
| Vulnerability assessment | Express, once the plan is on | Leave on express | No storage account, baselines apply without rescanning |

## Common failure modes

**Entra admin set, SQL authentication left on.** Both work simultaneously, so the SQL
admin login remains a fully privileged account outside Conditional Access. Setting the
Entra admin is step one of two.

**"Allow Azure services" enabled to make a connection work.** It works because it
admits every Azure resource in the world.

**Database-level auditing enabled on top of server-level.** Every event recorded
twice, ingestion cost doubled, and duplicate rows in every query.

**Auditing enabled with no one reading it.** Storage destination, no Log Analytics,
no alerting. It becomes an archive that proves something after the fact rather than a
detection.

**Dynamic Data Masking treated as a control.** Reported as "PII is masked" in a
compliance answer; a `WHERE` clause defeats it.

**CMK for TDE without purge protection on the vault.** A deleted or purged key means a
permanently inaccessible database. Purge protection is the mitigation, and it is
irreversible - see 01-02.

**Private endpoint plus `Redirect` connection policy behind a restrictive NSG.** Ports
11000-11999 are blocked and the connection fails in a way that looks like an
authentication problem.

**Defender for Databases assumed to cover everything.** Turning on the Azure SQL
sub-plan does nothing for Cosmos DB, PostgreSQL, or SQL Server on a VM.

**Vulnerability assessment findings never baselined.** Every scan reports the same
approved deviations, the report is ignored, and a real finding arrives in the noise.

**SQL Managed Instance deployed in a lab.** Hours to provision, hundreds of dollars a
month, and no exam answer requires you to have run one.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "must enforce MFA for database access" | Microsoft Entra-only authentication - CA cannot see SQL logins |
| "protect data from the database administrator" | Always Encrypted |
| "compute on encrypted columns" | Always Encrypted with secure enclaves |
| "hide values from non-privileged users in the app" | Dynamic Data Masking - and know its limits |
| "users see only their own rows" | Row-Level Security |
| "prove records were not tampered with" | Ledger |
| "customer must hold the encryption key" | TDE with CMK in Key Vault |
| "audit all databases including future ones" | Server-level auditing policy |
| "query audit records" | Log Analytics destination, `SQLSecurityAuditEvents` |
| "no storage account for scan results" | Vulnerability assessment express configuration |
| "record what Microsoft support did" | Microsoft support operations auditing |
| "protect Cosmos DB and PostgreSQL too" | Separate Defender for Databases sub-plans |

**AZ-500 divergence.** SQL vulnerability assessment moved from the storage-account
based classic configuration to express configuration, which is now the recommended
mode and is enabled automatically with the plan. Any walkthrough that starts by
creating a storage account for scan results is teaching the legacy path.

## Hands-on

See [02-02 lab](../../labs/02-storage-databases-networking/02-02-lab.md).

## Check yourself

1. A server has a Microsoft Entra admin assigned and Conditional Access requires MFA
   for all users. An attacker with the SQL admin password connects successfully from
   an unmanaged device. Explain why, and name the single setting that closes it.
2. Auditing is enabled at both server and database level, to both a storage account
   and Log Analytics. Describe exactly what gets written where, and what it costs you.
3. A compliance report states that social security numbers are protected because
   Dynamic Data Masking is enabled. Write the two-sentence rebuttal, and name what you
   would use instead.
4. You enable the Defender for Azure SQL plan on a subscription containing one Azure
   SQL database, one Cosmos DB account, and a SQL Server running on an Azure VM. What
   is now protected, and what is not?
5. Your database uses TDE with a customer-managed key. Someone deletes the key vault.
   Walk through what happens to the database and what determines whether you recover.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Set up auditing for Azure SQL Database: <https://learn.microsoft.com/en-us/azure/azure-sql/database/auditing-setup>
- Enable SQL vulnerability assessment (express configuration): <https://learn.microsoft.com/en-us/azure/defender-for-cloud/sql-azure-vulnerability-assessment-enable>
- Express configuration vulnerability findings: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/configure-vulnerability-findings-express>
- Manage vulnerability findings in Azure SQL databases: <https://learn.microsoft.com/en-us/AZURE/defender-for-cloud/sql-azure-vulnerability-assessment-manage>
