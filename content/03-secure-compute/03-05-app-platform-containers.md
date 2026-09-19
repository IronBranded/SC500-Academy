---
objective: "Implement security for application platform services"
sub_objectives:
  - "Detect misconfigurations and runtime risks in container workloads by using Defender for Containers"
  - "Implement and configure security controls for Azure Kubernetes Service (AKS)"
  - "Implement and configure security controls for Azure Container Registry"
  - "Implement and configure security controls for Azure Container Instances and Azure Container Apps"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-01", "01-03", "02-03", "03-04"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-introduction"
  - "https://learn.microsoft.com/azure/defender-for-cloud/container-security"
  - "https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-usage"
  - "https://learn.microsoft.com/azure/aks/local-accounts"
last_verified: "2026-09-17"
portal: "Azure portal > Kubernetes services / Container registries; Defender for Cloud > Environment settings"
powershell_module: "Az.Aks, Az.ContainerRegistry, Az.Security"
az_cli_command: "az aks create --disable-local-accounts"
kql_tables: []
licensing: "Microsoft Defender for Containers, billed per vCore-hour across monitored clusters"
azure_resources: ["Microsoft.ContainerService/managedClusters", "Microsoft.ContainerRegistry/registries", "Microsoft.App/containerApps", "Microsoft.ContainerInstance/containerGroups"]
lab_cost_estimate: "Medium-HIGH - the AKS control plane may be free on the tier you pick, but the node pool VMs are not and they bill continuously. Defender for Containers bills per vCore-hour. Tear down the same day."
free_practice_available: false
forensic_relevance: "A container is a process that was never meant to change, which makes drift an unusually clean detection signal: any binary running inside a container that did not come from its image is worth an alert, and binary drift detection is built on exactly that assumption. The Defender sensor collects process, network and Kubernetes event data per node using eBPF, and the Kubernetes audit log carries the control-plane story - who created which workload, with which service account, and with what privileges."
---

# Container Platform Security

> **Objective:** Implement security for application platform services
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Detect misconfigurations and runtime risks in container workloads by using Defender for Containers
- Implement and configure security controls for Azure Kubernetes Service (AKS)
- Implement and configure security controls for Azure Container Registry
- Implement and configure security controls for Azure Container Instances and Azure Container Apps

## Why this exists

A container changes two assumptions that every control in Domain 2 and 3 quietly relied on.

**First, the unit of deployment is an artifact, not a machine.** You do not patch a
container; you rebuild the image and redeploy. So vulnerability management moves upstream
into the registry, and "this running workload is vulnerable" and "the image it came from is
vulnerable" become the same finding reached from two directions.

**Second, the thing that decides what runs is an API, not a person.** A Kubernetes cluster
accepts declarative requests and makes them true. Whoever can post to the API server can
create a privileged pod, mount the host filesystem, or run as root - not by exploiting
anything, but by asking. Which means the security question for Kubernetes is not "is the
node hardened" but **"who may ask the API server for what, and what is it willing to
accept?"**

Those two shifts produce the shape of this objective:

| Lifecycle phase | Control |
| --- | --- |
| **Build and store** | Registry authentication, image scanning, signing |
| **Admit** | Admission control - what the API server will accept |
| **Authorise** | Entra integration and Azure RBAC for Kubernetes |
| **Run** | Runtime threat detection, drift detection, network policy |
| **Observe** | Inventory, attack paths, Defender XDR |

And a structural point worth stating once: a container's security is mostly decided before
it ever runs. By the time you are detecting at runtime, you are catching what the earlier
stages missed.

## How it works under the hood

### Defender for Containers

The plan splits cleanly into **agentless** and **sensor-based** capabilities, and knowing
which is which is exam-relevant because they answer different questions and have different
prerequisites.

**Agentless capabilities:**

- **Agentless discovery for Kubernetes** - API-based, zero-footprint discovery of clusters,
  configurations, and deployments.
- **Agentless vulnerability assessment** - scans **registry images, running containers, and
  cluster nodes**. Zero configuration, daily rescans, OS **and language package** coverage,
  exploitability insights. The engine is **Microsoft Defender Vulnerability Management** -
  the same one behind Defender for Servers in 03-04, so findings are consistent. The
  vulnerability findings artifact is **signed with a Microsoft certificate** and associated
  with the image in the registry.
- **Inventory and risk hunting** through **Security Explorer** - resources, pods, services,
  repositories, images, and configurations, with findings fed into the **cloud security
  graph** so container vulnerabilities participate in **attack paths**.
- **Control plane hardening** - continuous assessment of cluster configuration against the
  initiatives applied to your subscriptions.

**Sensor-based capabilities** (the **Defender sensor**, which collects process, network, and
Kubernetes event data per node using **eBPF**):

- **Runtime threat protection** for clusters, nodes, and workloads, mapped to the **MITRE
  ATT&CK framework for Containers**, investigable in **Microsoft Defender XDR**.
- **Anti-malware** inside containers.
- **Binary drift detection** - alerts on **unauthorised external processes running inside a
  container**, meaning binaries that did not come from the image. You define drift policies
  to separate legitimate activity from suspicious. **Binary drift blocking** goes further and
  stops them.

Binary drift deserves a moment. In a VM, "a new binary appeared" is ambiguous - administrators
install things. In a container, it is close to definitional evidence of compromise, because a
container is supposed to be exactly its image and nothing else. This is the clearest example in
the whole guide of a detection that works because the platform's constraints are tighter.

**Kubernetes data plane hardening** is the admission-control half, delivered by the **Azure
Policy for Kubernetes** add-on. With it installed, **every request to the Kubernetes API server
is evaluated against your policies before it is persisted to the cluster** - so you can mandate
that privileged containers are never created, and future requests to create one are rejected.
This is Azure Policy from 01-03 reaching into the cluster, in the same way Machine
Configuration reached into the guest OS in 03-04.

One detail about what enables what: vulnerability assessment of **registry** images requires
**registry access** to be enabled on the Defender CSPM or Defender for Containers plan;
vulnerability assessment of **running** images requires **agentless scanning for machines**
plus either **K8s API access** or the **Defender sensor**.

### AKS

**Authentication and authorisation - the single most important control.**

There are three models, in increasing order of what you want:

| Model | What it means |
| --- | --- |
| Local accounts with Kubernetes RBAC | Cluster-local certificates, invisible to Entra |
| Microsoft Entra authentication with Kubernetes RBAC | Entra identity, permissions defined in cluster YAML |
| **Microsoft Entra authentication with Azure RBAC for Kubernetes authorization** | Entra identity, permissions as **Azure role assignments** |

The third puts cluster access under the same system as everything else in this guide -
PIM-eligible, Conditional Access-governed, auditable in one place.

**And the fact the exam will use:** local accounts are **enabled by default**, and `--admin`
access remains a **non-auditable backdoor even when Entra integration and RBAC are enabled.**
Disabling them is an explicit step - `--disable-local-accounts`, surfacing as
`properties.disableLocalAccounts`. There is a critical operational rider: if users may already
have authenticated with local accounts, **you must rotate the cluster certificates** after
disabling, or the credentials they hold remain valid.

The rest of the AKS baseline, which shows up as recommendations and as exam distractors:

- **Private cluster** or **API server authorised IP ranges** - the API server is the control
  plane; exposing it publicly is the AKS version of an open management port
- **Managed identities** for the cluster and kubelet identities, not service principals
- **Azure Workload Identity** for pods needing Azure resources - the successor to the retired
  pod identity approach, and the container version of 01-01's "no secrets in code"
- **Secrets Store CSI driver** to mount Key Vault secrets rather than baking them into images
  or Kubernetes secrets
- **Network policies** to constrain pod-to-pod traffic - the 02-03 segmentation argument
  applied inside the cluster
- **System and user node pool separation**, so workloads do not share nodes with cluster
  components
- **ImageCleaner** to remove stale, vulnerable images from nodes
- **Host-based encryption** on node VMs, which is 03-04's encryption at host
- Managed egress through **Azure Firewall**, and ingress through **Application Gateway with
  WAF** - covered in 02-04 and 03-06 respectively

### Azure Container Registry

The registry is the supply chain. Two recommendations recur in Defender for Cloud and are
worth memorising as a pair:

- **Anonymous authentication disabled**
- **Local admin account disabled**

The admin account is a single shared credential with push and pull rights and no identity
behind it - the storage account key problem from 02-01, wearing a different hat. The
alternative is Entra authentication with `AcrPull` and `AcrPush` role assignments, and for
AKS specifically, granting `AcrPull` to the cluster's **kubelet identity** so no registry
credential exists anywhere.

Beyond authentication:

- **Private endpoints** and disabled public network access, per 02-04
- **Vulnerability scanning** of images through Defender for Containers registry access
- **Image signing** so a cluster can require that images come from your build system
- **Retention and cleanup**, because an unscanned five-year-old image is still deployable
- **Dedicated data endpoints** where data exfiltration paths matter

### Container Instances and Container Apps

Both run containers without a cluster, and both are tested lightly relative to AKS - but the
controls follow the same pattern you already know:

- **Managed identity** rather than credentials, for pulling from ACR and for reaching Azure
  resources
- **Virtual network integration**, and ingress restricted to internal only where the workload
  is not public
- **Secrets from Key Vault** rather than environment variables in the deployment definition
- **Confidential containers** on ACI, for hardware-isolated execution - the container analogue
  of confidential VMs in 03-04

Container Apps adds an environment as the isolation boundary, with ingress controls, IP
restrictions, and authentication that can be delegated to Entra rather than implemented in the
application.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| AKS local accounts | **Enabled** | **Disabled**, then rotate certificates | `--admin` is a non-auditable backdoor |
| AKS authorisation | Kubernetes RBAC | Entra authentication + **Azure RBAC for Kubernetes** | Puts cluster access under PIM and Conditional Access |
| API server exposure | Public | Private cluster, or authorised IP ranges | It is the control plane |
| Cluster and kubelet identity | service principal in older clusters | **Managed identities** | No credential to rotate or leak |
| Pod access to Azure resources | app-held secrets | **Workload identity** | Same argument as 01-01 |
| Azure Policy for Kubernetes add-on | not installed | Installed, audit then deny | Admission control is the only place to stop a privileged pod |
| Network policy | none | Enabled, default-deny between namespaces | Flat pod networking otherwise |
| ACR admin account | **Enabled on creation** | **Disabled** | Shared credential with push rights |
| ACR anonymous pull | disabled | Keep disabled | Recommendation exists because people enable it |
| ACR public network access | Enabled | Private endpoint | Per 02-04 |
| Defender for Containers | Off | On, with registry access and the sensor | Agentless alone gives no runtime detection |
| Binary drift | detection off | Detection, then blocking | Near-definitional signal in a container |
| Container Apps ingress | often external | Internal unless it must be public | The default is convenience |

## Common failure modes

**Entra integration enabled, local accounts left on.** The cluster looks governed and the
`--admin` path still works, unaudited.

**Local accounts disabled without rotating certificates.** Anyone who already pulled local
credentials keeps them.

**Kubernetes RBAC used where Azure RBAC was intended.** Permissions live in cluster manifests,
disconnected from Entra, and survive an employee's departure.

**Public API server with no authorised IP ranges.** The most consequential AKS
misconfiguration, and the direct analogue of the open RDP port from 03-04.

**Azure Policy add-on installed and left entirely in audit.** You have a report of privileged
pods, and privileged pods.

**Registry scanning enabled, runtime not.** Registry access covers images at rest; running
containers need agentless machine scanning plus K8s API access or the sensor. A clean registry
does not mean a clean cluster - images can be pulled from anywhere.

**ACR admin account used by a pipeline.** One shared credential, push rights, no identity,
usually in a variable group.

**AcrPull granted to a service principal with a secret instead of the kubelet identity.** A
credential where none was needed.

**Secrets in Kubernetes secrets, treated as encrypted.** They are base64-encoded, not
encrypted, and readable by anyone with the right API permission. Use the CSI driver with Key
Vault.

**Node pool left running.** The AKS control plane may be free on your tier; the node VMs are
not, and they bill continuously.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "cluster access must be revoked when the user leaves Entra" | Azure RBAC for Kubernetes authorization |
| "remove the non-auditable backdoor" | Disable local accounts, then rotate certificates |
| "API server must not be reachable from the internet" | Private cluster or authorised IP ranges |
| "prevent privileged containers from ever being created" | Azure Policy for Kubernetes, deny effect |
| "pod must access a key vault without a stored secret" | Workload identity, Secrets Store CSI driver |
| "detect a process that is not part of the image" | Binary drift detection |
| "block that process" | Binary drift blocking |
| "scan images in the registry" | Defender for Containers, registry access |
| "scan containers that are actually running" | Agentless machine scanning + K8s API access or sensor |
| "no shared credential for the registry" | Disable the ACR admin account, use `AcrPull`/`AcrPush` |
| "AKS must pull images with no credential" | `AcrPull` on the kubelet identity |
| "hardware-isolated container execution" | Confidential containers on ACI |
| "internal-only container app" | Container Apps ingress restricted to internal |

**AZ-500 divergence.** Container vulnerability assessment now runs on **Microsoft Defender
Vulnerability Management** rather than the earlier third-party engine, so findings, scoring, and
the portal experience all differ from older material. The Defender **sensor** with eBPF and
binary drift detection and blocking are new capability classes. And pod identity has been
superseded by **workload identity** - a walkthrough that configures the former is configuring a
retired feature.

## Hands-on

See [03-05 lab](../../labs/03-secure-compute/03-05-lab.md).

## Check yourself

1. A cluster has Microsoft Entra integration and Kubernetes RBAC configured. An engineer who
   left the company last month runs `kubectl get pods` successfully. Give two distinct
   explanations, and the remediation for each.
2. Defender for Containers reports no vulnerabilities for a running workload, while the registry
   shows the source image as clean. Name every reason the running container could still be
   vulnerable.
3. Explain why binary drift detection is a stronger signal in a container than the equivalent
   would be on a virtual machine. What property of containers makes it work?
4. Your organisation wants to guarantee that no privileged container can be created in any
   cluster, regardless of what a developer submits. Describe the mechanism, where it sits in the
   request path, and the one configuration choice that determines whether it reports or prevents.
5. A pipeline authenticates to ACR with the admin account. Describe what is wrong in terms of
   the storage account discussion from 02-01, and give the replacement for both the pipeline and
   the AKS cluster.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Overview of Defender for Containers: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-introduction>
- Container security in Defender for Cloud: <https://learn.microsoft.com/azure/defender-for-cloud/container-security>
- Vulnerability assessment usage in Defender for Containers: <https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-containers-usage>
- Manage local accounts with Microsoft Entra integration (AKS): <https://learn.microsoft.com/azure/aks/local-accounts>
