---
objective: "Implement security for servers and virtual machines (VMs)"
sub_objectives:
  - "Implement and configure disk encryption"
  - "Plan and implement Azure Bastion"
  - "Enable and enforce use of just-in-time (JIT) VM access"
  - "Extend security controls to hybrid and multicloud servers by using Azure Arc"
  - "Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios"
  - "Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)"
  - "Implement and manage agentless scanning for VMs in Defender for Servers"
  - "Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type"
  - "Enforce security configuration of Azure-managed servers by using Azure Machine Configuration"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-02", "01-03", "02-03"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-servers-overview"
  - "https://learn.microsoft.com/azure/defender-for-cloud/plan-defender-for-servers-select-plan"
  - "https://learn.microsoft.com/azure/defender-for-cloud/file-integrity-monitoring-overview"
  - "https://learn.microsoft.com/azure/virtual-machines/trusted-launch"
  - "https://learn.microsoft.com/en-my/azUre/security/fundamentals/virtual-machines-overview"
last_verified: "2026-09-17"
portal: "Azure portal > Virtual machines; Defender for Cloud > Environment settings"
powershell_module: "Az.Compute, Az.ConnectedMachine, Az.Security, Az.Network"
az_cli_command: "az vm update --set securityProfile.encryptionAtHost=true"
kql_tables: []
licensing: "Defender for Servers Plan 1 or Plan 2, billed per server per hour. Azure Bastion billed per hour by SKU."
azure_resources: ["Microsoft.Compute/virtualMachines", "Microsoft.Network/bastionHosts", "Microsoft.HybridCompute/machines"]
lab_cost_estimate: "HIGH - Azure Bastion and Defender for Servers Plan 2 both bill hourly per resource, and the VM itself bills while allocated. Deploy, test, and delete in one session; prefer the lowest Bastion SKU your scenario allows."
free_practice_available: false
forensic_relevance: "A compromised server is where most investigations actually land, and the controls here decide what evidence exists. Defender for Endpoint provides the process and network telemetry; file integrity monitoring records who changed which file and with which process; boot integrity attestation is the only signal that would catch a bootkit. JIT access leaves an audit trail of who opened which port, when, and from where - which in a tenant with standing open management ports does not exist at all."
---

# Server and Virtual Machine Security

> **Objective:** Implement security for servers and virtual machines (VMs)
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Implement and configure disk encryption
- Plan and implement Azure Bastion
- Enable and enforce use of just-in-time (JIT) VM access
- Extend security controls to hybrid and multicloud servers by using Azure Arc
- Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios
- Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)
- Implement and manage agentless scanning for VMs in Defender for Servers
- Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type
- Enforce security configuration of Azure-managed servers by using Azure Machine Configuration

## Why this exists

A virtual machine is the one resource in Azure where you own the whole stack. Storage,
SQL, and Foundry are services with a configuration surface; a VM is a computer, and
everything that has ever been true of computers is still true of it.

That makes the objective large, but it organises cleanly if you sort the nine bullets by
**where the control acts**:

| Layer | Question it answers | Bullets |
| --- | --- | --- |
| **The disk** | Is data at rest protected, and who holds the key? | Disk encryption |
| **The boot chain** | Did this machine start as the machine we think it is? | Secure boot, vTPM, integrity monitoring, security type |
| **The front door** | How does an administrator get in, and is the door shut when nobody is? | Bastion, JIT |
| **Inside the OS** | Is it configured the way policy requires, and is it drifting? | Machine Configuration, file integrity monitoring |
| **Behaviour** | Is something happening that should not be? | Defender for Servers, EDR, vulnerability assessment, agentless scanning |
| **Reach** | Do all of the above apply to machines that are not in Azure? | Azure Arc |

The framing that ties them together: **a management port open to the internet is the most
reliably exploited misconfiguration in cloud computing.** Not a subtle one, not a novel
one - RDP and SSH exposed to the world, brute-forced or hit with a known CVE. Bastion and
JIT exist because of that single fact, and if you only implement two things from this
module, they are the two.

## How it works under the hood

### Disk encryption: three mechanisms, not one

The exam expects you to distinguish them by **where the encryption happens** and **who
holds the key**.

| | Where it runs | Key custody | Notes |
| --- | --- | --- | --- |
| **Server-side encryption (SSE)** | Storage platform, always on | Platform-managed by default; **customer-managed key** via a disk encryption set and Key Vault | The default; you cannot turn it off |
| **Encryption at host** | The **host**, before data reaches storage | Platform or CMK | Encrypts temp disks and caches too; no in-guest agent; VM must be **deallocated** to enable on an existing VM; some legacy VM sizes unsupported |
| **Azure Disk Encryption (ADE)** | **Inside the guest** - BitLocker on Windows, DM-Crypt on Linux | Key Vault, always | Requires a Key Vault and an in-guest extension |
| **Confidential disk encryption** | Confidential VM, keys bound to the VM's **vTPM** | Platform or CMK | Optional at deployment, **cannot be changed afterwards**; Secure Boot on by default when selected |

Two things to carry: **encryption at host covers the temp disk and host cache, which ADE
historically did not**, and Defender for Cloud raises a recommendation specifically for
it. And **confidential OS disk encryption is a deployment-time decision** - like
infrastructure encryption on a storage account in 02-01, and like purge protection in
01-02, it is one of the small set of settings you cannot retrofit.

CMK anywhere here creates the same dependency chain as TDE in 02-02: the key lives in Key
Vault, the vault needs soft delete and purge protection, and losing the key loses the
disk.

### Trusted launch: secure boot, vTPM, integrity monitoring

**Trusted launch is now the default for newly created Generation 2 Azure VMs and scale
sets.** That is a changed default since AZ-500-era material, and it means the exam can ask
about it as a baseline rather than an enhancement.

The three components, which together are what the **security type** setting on the VM
selects:

- **Secure Boot** - platform firmware ensures only signed OS boot components load: boot
  loader, kernel, kernel drivers must be signed by trusted publishers. If authentication
  fails, **the VM does not boot.** This is the root of trust.
- **vTPM** - a dedicated, TPM 2.0-compliant virtual TPM instance per VM, running outside
  the reach of the VM itself. It is a vault for keys and measurements, and it measures the
  entire boot chain: UEFI, OS, system, drivers.
- **Boot integrity monitoring** - remote attestation using those vTPM measurements. If the
  boot chain fails to attest, **Microsoft Defender for Cloud issues an integrity alert**
  naming the components that failed.

Secure Boot prevents; the vTPM measures; integrity monitoring reports. A question that
asks how you would *detect* boot-level tampering wants attestation, not Secure Boot.

Trusted launch can be enabled on existing Gen2 VMs, and Gen1 VMs can be upgraded to
Gen2-Trusted launch. It is not compatible with everything - managed images, for instance,
push you toward the Azure Compute Gallery instead.

**Confidential VMs** are the next tier up: hardware-based trusted execution environments
protecting data **in use**, with a dedicated vTPM, Secure Boot, and disk keys bound to
attestation. If the platform cannot attest, the VM will not start.

### Getting in: Bastion and JIT

**Azure Bastion** is a managed jump host. Administrators connect through the Azure portal
over TLS, and Bastion establishes the RDP or SSH session from inside the virtual network
to the VM's **private** address. The VMs need no public IP and no inbound management port
open to the internet.

SKU choice drives features - deployment model, scaling, native client support, session
recording, and private-only deployment vary by tier - and it also drives cost, because
Bastion bills **hourly per host** plus outbound data. Pick the lowest SKU that meets the
requirement; verify the current SKU feature matrix before answering a question from
memory, as the tiers have changed.

**Just-in-time VM access** is a Defender for Servers Plan 2 feature and solves a different
half of the same problem. Management ports stay closed by NSG rule; an administrator
**requests access** for a specific port, source range, and duration; Defender for Cloud
opens the rule and closes it automatically when the window expires. Every request is
audited - who, when, from where, for how long.

Bastion removes the public IP. JIT ensures the port is shut when nobody is using it. They
are complementary, and the strongest answer usually uses both - which is also the shape of
the PIM argument from 00-02, applied to network reachability instead of roles.

### Defender for Servers

Two paid plans, and the split is heavily tested:

| | Plan 1 | Plan 2 |
| --- | --- | --- |
| Defender for Endpoint integration and **EDR** | Yes | Yes |
| Microsoft Defender Vulnerability Management | Yes | Yes |
| **Agentless scanning** | No | **Yes** |
| **File integrity monitoring** | No | Yes |
| **OS configuration assessment** against MCSB compute baselines | No | Yes |
| **Just-in-time VM access** | No | Yes |
| Data ingestion benefit | No | 500 MB |

Both plans deliver **Defender for Endpoint Plan 2 capabilities**, including EDR - Plan 1
is described as entry-level precisely because EDR is the whole of it.

What is on by default when you enable a plan, and what is not, is the detail that makes or
breaks a configuration question:

- **Endpoint protection** - the Defender for Endpoint extension is **automatically
  provisioned** on supported connected machines. You can turn automatic provisioning off.
- **Vulnerability assessment** - Microsoft Defender Vulnerability Management is **enabled
  by default** on machines carrying the Defender for Endpoint extension.
- **Agentless scanning** - **enabled by default** with Plan 2, and also with the Defender
  CSPM plan.
- **OS configuration assessment** - assesses settings against the Microsoft cloud security
  benchmark compute baselines, and **requires the Azure Machine Configuration extension**
  on the machine.
- **File integrity monitoring** - **not enabled by default.** You turn it on after
  enabling Plan 2.

**Agentless scanning** takes a snapshot of the disk through cloud APIs and analyses it out
of band: software inventory, vulnerability assessment, **secrets scanning** (the same
engine as 01-02), and malware detection. No agent, no inbound connectivity, no performance
impact on the running workload - and equally, no real-time behavioural signal, which is
what the agent provides. Agentless and agent-based are complementary, not alternatives.

**File integrity monitoring** moved. It previously collected data through the Log
Analytics agent (MMA) or the Azure Monitor agent; it now uses **Defender for Endpoint**,
and existing deployments on the legacy agents must be migrated. Change events from
agentless collection stream to your workspace on a **24-hour cadence**, and the data
counts against the 500 MB benefit included in Plan 2. FIM records the source of the
change, the account, and the initiating process - which is what makes it evidence rather
than an alert.

### Azure Arc

Arc projects the Azure control plane onto machines that are not in Azure - on-premises
servers, VMs in other clouds. The Connected Machine agent registers the machine as an
Azure resource, and once it is one, it can carry Azure RBAC, Azure Policy, Azure Machine
Configuration, extensions, and **Defender for Servers**.

The important mental model: **Arc does not move the machine.** It gives it an ARM resource
ID so that every governance mechanism you built in Domain 1 applies to it. For multicloud,
Defender for Cloud's AWS and GCP connectors handle onboarding at scale rather than
per-machine registration.

### Azure Machine Configuration

Formerly Guest Configuration. It is **Azure Policy reaching inside the operating system**:
define a desired configuration - password policy, TLS version, a service state, a file
permission - and Azure audits machines against it, or **enforces** it.

Mechanically it needs the machine configuration extension and a **system-assigned managed
identity** on the machine, which is why it appears in the Defender for Servers
prerequisites for OS configuration assessment. It works on Azure VMs and on Arc-enabled
servers alike - the same definition covering both is the payoff for the Arc work.

Audit versus enforce is the same distinction as `Audit` versus `DeployIfNotExists` in
01-03, applied inside the guest.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| Server-side encryption | On, platform key | CMK where key custody is required | Creates a Key Vault dependency |
| Encryption at host | **Off** | On | Covers temp disk and host cache; needs deallocation to enable |
| Confidential OS disk encryption | Off | Decide **at deployment** | Cannot be changed later |
| Security type / trusted launch | **Default for new Gen2 VMs** | Confirm it is on; enable on existing Gen2 | Changed default - verify rather than assume |
| Boot integrity monitoring | part of trusted launch | On | The only detection for boot-chain tampering |
| Public IP on a VM | often created by default | **None** | The single most exploited misconfiguration |
| Management port NSG rules | open when created by the portal wizard | Closed, with **JIT** | JIT opens them on request and closes them automatically |
| Bastion SKU | - | Lowest that meets the requirement | Hourly per host plus data |
| Defender for Servers | Off | Plan 2 where agentless scanning, FIM and JIT are needed | Plan 1 is EDR only |
| Defender for Endpoint provisioning | **On** with either plan | Leave on | Turning it off removes EDR |
| Agentless scanning | **On** with Plan 2 | Leave on | No agent, no performance cost |
| File integrity monitoring | **Off** | On, after enabling Plan 2 | Not enabled by default; now uses Defender for Endpoint |
| Machine configuration extension | not installed | Installed, with a managed identity | Required for OS configuration assessment |
| Machine configuration assignment | Audit | Audit, then enforce | Same discipline as policy in 01-03 |

## Common failure modes

**A public IP and an open management port, created by the deployment wizard.** Nobody
chose it; the default did. This is still the most common way cloud VMs are compromised.

**Bastion deployed while VMs keep their public IPs.** The secure path exists and the
insecure one was never removed.

**JIT configured but not enforced.** Somebody adds a standing NSG allow rule for
convenience and the just-in-time property silently stops being true.

**Assuming Plan 1 includes agentless scanning, FIM, or JIT.** It does not. Plan 1 is EDR.

**Expecting file integrity monitoring to be on because Plan 2 is on.** It is not enabled by
default, and it is the one Plan 2 feature that requires a deliberate step.

**Running FIM on a legacy agent.** It moved to Defender for Endpoint; MMA and AMA-based
configurations need migrating.

**Treating agentless scanning as a replacement for the agent.** It has no real-time
behavioural signal. A machine with only agentless coverage has no EDR.

**OS configuration assessment reporting nothing.** The machine configuration extension is
missing, or the managed identity is not there.

**Trying to enable encryption at host on a running VM.** It must be deallocated.

**Deciding on confidential OS disk encryption after deployment.** You cannot; redeploy.

**Arc agent installed, nothing governing the machine.** Registration is step one. Policy
assignments, Defender plan coverage, and machine configuration assignments are what make
it worth having.

**A VM left running after a lab.** Compute, Bastion, and the Defender plan all bill
independently, and the Defender plan survives resource group deletion.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "encrypt temp disks and caches too" | Encryption at host |
| "encryption inside the guest OS" | Azure Disk Encryption |
| "keys bound to the VM, cannot be changed later" | Confidential OS disk encryption |
| "only signed boot components may load" | Secure Boot |
| "attest that the VM booted correctly" | vTPM plus boot integrity monitoring |
| "detect boot-level tampering" | Integrity monitoring, not Secure Boot |
| "RDP without a public IP" | Azure Bastion |
| "port open only when an admin needs it" | Just-in-time VM access, Plan 2 |
| "EDR only, lowest cost" | Defender for Servers Plan 1 |
| "scan for secrets and malware without an agent" | Agentless scanning, Plan 2 |
| "who changed this file and with what process" | File integrity monitoring |
| "on-premises and AWS servers, same controls" | Azure Arc + Defender for Cloud connectors |
| "enforce a setting inside the operating system" | Azure Machine Configuration |
| "assess against the security benchmark baseline" | OS configuration assessment, needs the machine configuration extension |

**AZ-500 divergence.** Two defaults moved and one feature relocated. **Trusted launch is
now the default for new Gen2 VMs**, so secure boot and vTPM are a baseline to verify rather
than a feature to add. **File integrity monitoring now runs on Defender for Endpoint**, not
the Log Analytics or Azure Monitor agent - and the Log Analytics agent itself is retired,
so any walkthrough that provisions MMA is describing a dead path. Agentless scanning also
did not exist in the AZ-500 blueprint.

## Hands-on

See [03-04 lab](../../labs/03-secure-compute/03-04-lab.md).

## Check yourself

1. A VM has server-side encryption with a platform-managed key. Defender for Cloud still
   recommends enabling encryption at host. Explain what the recommendation adds, and what
   you must do to the VM to apply it.
2. You enable Defender for Servers Plan 2 on a subscription. Three days later, an auditor
   asks for a record of changes to `/etc/passwd` on a Linux VM. Can you produce one?
   Explain.
3. A VM fails to boot after a patch. Distinguish what Secure Boot, the vTPM, and integrity
   monitoring would each have contributed to understanding why.
4. Your organisation deploys Bastion and mandates its use. An engineer reports they can
   still RDP directly to a VM from home. Describe what is misconfigured and the two
   controls that would close it.
5. An Arc-enabled on-premises server appears in Defender for Cloud but has no
   recommendations and no OS configuration assessment results. List the possible causes in
   the order you would check them.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Overview of Defender for Servers: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-servers-overview>
- Select a Defender for Servers plan: <https://learn.microsoft.com/azure/defender-for-cloud/plan-defender-for-servers-select-plan>
- File integrity monitoring overview: <https://learn.microsoft.com/azure/defender-for-cloud/file-integrity-monitoring-overview>
- Trusted launch for Azure virtual machines: <https://learn.microsoft.com/azure/virtual-machines/trusted-launch>
- Azure virtual machine security overview: <https://learn.microsoft.com/en-my/azUre/security/fundamentals/virtual-machines-overview>
