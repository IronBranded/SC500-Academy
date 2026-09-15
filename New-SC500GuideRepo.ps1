<#
.SYNOPSIS
    Scaffolds the SC500 Academy repository (SC-500 interactive learning guide).

.DESCRIPTION
    Creates the folder tree, emits metadata-schema-conformant Markdown stubs for
    every module and lab, writes the dependency-free static site shell, generates
    content/manifest.json from the module table, writes the PowerShell validator,
    initialises git, and optionally creates the GitHub repo and enables Pages.

    The $Modules table below is the single source of truth. It drives the folder
    tree, the stub front matter, the manifest, and docs/SYLLABUS.md. Edit it there
    and re-run rather than editing generated files by hand.

    Skills-measured outline captured from Microsoft Learn on 2026-09-15.
    Re-verify before generating content for any module.

.PARAMETER RepoName
    Repository / folder name. Default: SC500-Academy

.PARAMETER Path
    Parent directory the repo folder is created in.

.PARAMETER LocalOnly
    Scaffold and commit locally without touching GitHub. By default the script
    creates the remote repository if it does not exist, pushes, and enables Pages.

.PARAMETER GitHubToken
    Personal access token. Falls back to $env:GITHUB_TOKEN, then to the token held
    by the GitHub CLI ('gh auth token') if gh is installed and signed in.
    Fine-grained PAT scopes needed: Contents read/write, Administration
    read/write (to create the repo), Pages read/write (to enable Pages).
    Classic PAT equivalent: 'repo' plus 'admin:repo_hook' not required.

.PARAMETER SkipPages
    Push the repository but do not enable GitHub Pages.

.PARAMETER AdoptRemote
    The remote repository already has commits (e.g. it was created through the
    GitHub UI with a README and LICENSE). Fetch that history and rebase the
    scaffold onto it instead of refusing to push. Expect conflicts on README.md
    and LICENSE.

.EXAMPLE
    .\New-SC500GuideRepo.ps1 -Path C:\repos -WhatIf

.EXAMPLE
    $env:GITHUB_TOKEN = 'github_pat_...'
    .\New-SC500GuideRepo.ps1 -Path C:\repos

.EXAMPLE
    # Repo already created on github.com with a README
    .\New-SC500GuideRepo.ps1 -Path C:\repos -AdoptRemote

.EXAMPLE
    .\New-SC500GuideRepo.ps1 -Path C:\repos -LocalOnly
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$RepoName      = 'SC500-Academy',
    [string]$Path          = (Get-Location).Path,
    [ValidateSet('public','private')]
    [string]$Visibility    = 'public',
    [string]$GitHubOwner   = 'IronBranded',
    [switch]$LocalOnly,
    [switch]$SkipPages,
    [switch]$AdoptRemote,
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$DefaultBranch = 'main',
    [ValidateSet('MIT','CC-BY-4.0','Dual','None')]
    [string]$License       = 'Dual',
    [string]$Author        = 'IronBranded',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$SkillsUrl   = 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500'
$VerifiedOn  = '2026-09-15'
$RepoRoot    = Join-Path $Path $RepoName

#region ---------------------------------------------------------------- Modules

# Domain metadata
$Domains = [ordered]@{
    '00' = @{ Name = 'Lab Safety and Environment Setup';            Weight = 'n/a';    Folder = '00-lab-safety' }
    '01' = @{ Name = 'Manage identity, access, and governance';     Weight = '20-25%'; Folder = '01-identity-access-governance' }
    '02' = @{ Name = 'Secure storage, databases, and networking';   Weight = '25-30%'; Folder = '02-storage-databases-networking' }
    '03' = @{ Name = 'Secure compute';                              Weight = '20-25%'; Folder = '03-secure-compute' }
    '04' = @{ Name = 'Manage and monitor security posture';         Weight = '20-25%'; Folder = '04-security-posture' }
}

# Objective and sub-objective strings are VERBATIM Microsoft wording. Do not reword.
$Modules = @(
    # ---- Module 0 (project prerequisite, not an exam objective) ----
    @{ Id='00-00'; Domain='00'; Slug='00-00-module-overview'; Title='Module Overview: Lab Topology and Conventions'
       Objective='(Project prerequisite - not an SC-500 exam objective)'; Sub=@()
       Portal='Azure portal > Subscriptions'; PSModule='Az.Accounts'; Licensing=''; Cost='$0'; Lab=$false }

    @{ Id='00-01'; Domain='00'; Slug='00-01-cost-guardrails-and-budgets'; Title='Cost Guardrails and Budget Alerts'
       Objective='(Project prerequisite - not an SC-500 exam objective)'; Sub=@()
       Portal='Cost Management + Billing > Budgets'; PSModule='Az.Billing, Az.Monitor'; Licensing=''; Cost='$0'; Lab=$true }

    @{ Id='00-02'; Domain='00'; Slug='00-02-pim-just-in-time-lab-access'; Title='PIM-Based Just-in-Time Lab Access'
       Objective='(Project prerequisite - doubles as practice for 01-01)'; Sub=@()
       Portal='Entra admin center > Identity Governance > Privileged Identity Management'
       PSModule='Microsoft.Graph.Identity.Governance'; Licensing='Microsoft Entra ID P2'; Cost='Included in P2 trial'; Lab=$true }

    @{ Id='00-03'; Domain='00'; Slug='00-03-teardown-checklist-template'; Title='Reusable Teardown Checklist'
       Objective='(Project prerequisite - not an SC-500 exam objective)'; Sub=@()
       Portal='Azure portal > Resource groups'; PSModule='Az.Resources'; Licensing=''; Cost='$0'; Lab=$false }

    # ---- Domain 1 ----
    @{ Id='01-01'; Domain='01'; Slug='01-01-entra-id-secure-access'; Title='Secure Access with Microsoft Entra ID'
       Objective='Secure access to resources by using Microsoft Entra ID'
       Sub=@(
         'Implement and configure Privileged Identity Management (PIM)'
         'Implement conditional access policies'
         'Implement and configure authentication methods, including multifactor authentication (MFA) and passwordless'
         'Implement and configure identity for applications, including enterprise applications and app registrations'
         'Manage OAuth permission grants and consent settings'
         'Implement and configure managed identities for Azure resources')
       Portal='Microsoft Entra admin center'; PSModule='Microsoft.Graph'; Licensing='Microsoft Entra ID P2'; Cost='Low'; Lab=$true }

    @{ Id='01-02'; Domain='01'; Slug='01-02-key-vault-secrets-and-keys'; Title='Secrets and Keys with Azure Key Vault'
       Objective='Secure secrets and keys by using Azure Key Vault'
       Sub=@(
         'Deploy Key Vault'
         'Configure Key Vault settings'
         'Configure access to Key Vault'
         'Configure firewall settings on Key Vault'
         'Manage keys, secrets, and certificates'
         'Scan for secrets by using Defender Cloud Security Posture Management (Defender CSPM)'
         'Implement Defender for Key Vault')
       Portal='Azure portal > Key vaults'; PSModule='Az.KeyVault'; Licensing='Defender CSPM plan'; Cost='Low'; Lab=$true }

    @{ Id='01-03'; Domain='01'; Slug='01-03-governance-and-regulatory-compliance'; Title='Governance and Regulatory Compliance'
       Objective='Implement governance to enforce security and regulatory compliance'
       Sub=@(
         'Implement and configure security controls by using Azure Policy, including built-in and custom policy definitions'
         'Evaluate regulatory compliance by using Microsoft Defender for Cloud'
         'Implement and configure security controls in Defender for Cloud, including security standards and recommendations'
         'Implement resource locks'
         'Manage Azure built-in role assignments'
         'Manage custom roles, including Azure roles and Microsoft Entra roles'
         'Evaluate and remediate overprivileged access assignments by using Azure role-based access control (RBAC)'
         'Configure security controls for backup protection by using Azure Backup security features'
         'Implement and configure security controls by using infrastructure as code')
       Portal='Azure portal > Policy; Defender for Cloud > Regulatory compliance'
       PSModule='Az.PolicyInsights, Az.Resources'; Licensing='Defender CSPM plan'; Cost='Low'; Lab=$true }

    # ---- Domain 2 ----
    @{ Id='02-01'; Domain='02'; Slug='02-01-storage-account-security'; Title='Storage Account Security'
       Objective='Implement security for storage accounts'
       Sub=@(
         'Implement and configure security for storage accounts'
         'Configure Azure Storage firewall rules'
         'Implement Defender for Storage threat protection configurations'
         'Manage access to storage, including access policies')
       Portal='Azure portal > Storage accounts'; PSModule='Az.Storage'; Licensing='Defender for Storage plan'; Cost='Low'; Lab=$true }

    @{ Id='02-02'; Domain='02'; Slug='02-02-database-security'; Title='Database Security'
       Objective='Implement security for databases'
       Sub=@(
         'Implement platform-level security configurations in Azure SQL'
         'Configure database auditing for Azure SQL Database and Azure SQL Managed Instance'
         'Configure Defender for Databases protection across Azure database services')
       Portal='Azure portal > SQL databases'; PSModule='Az.Sql'; Licensing='Defender for Databases plan'
       Cost='Medium - avoid SQL Managed Instance; use Azure SQL Database serverless'; Lab=$true }

    @{ Id='02-03'; Domain='02'; Slug='02-03-network-segmentation-and-connectivity'; Title='Network Segmentation and Connectivity'
       Objective='Implement security for Azure network services'
       Sub=@(
         'Implement and manage network security groups (NSGs) and application security groups (ASGs)'
         'Implement and configure network access policies by using Azure Virtual Network Manager'
         'Configure security for an Azure Virtual WAN'
         'Implement and configure security for virtual private network (VPN) connections')
       Portal='Azure portal > Virtual networks / Virtual Network Manager'; PSModule='Az.Network'
       Licensing=''; Cost='Medium - Virtual WAN hub and VPN gateway bill hourly'; Lab=$true }

    @{ Id='02-04'; Domain='02'; Slug='02-04-private-access-and-perimeter'; Title='Private Access and Network Perimeter'
       Objective='Implement security for Azure network services'
       Sub=@(
         'Implement and configure Microsoft Entra Private Access'
         'Configure Azure private endpoints to secure access to Azure platform as a service (PaaS) resources'
         'Configure Azure Private Link services to secure access to network resources'
         'Implement and configure Azure Firewall'
         'Evaluate effective security rules by using Azure Network Watcher diagnostics')
       Portal='Azure portal > Firewalls / Private Link / Network Watcher'; PSModule='Az.Network'
       Licensing='Microsoft Entra Suite or Global Secure Access licensing for Private Access'
       Cost='HIGH - Azure Firewall bills hourly plus data processing regardless of traffic'; Lab=$true }

    # ---- Domain 3 ----
    @{ Id='03-01'; Domain='03'; Slug='03-01-ai-data-exposure-and-purview-dspm'; Title='AI Data Exposure and Purview DSPM'
       Objective='Implement security for AI'
       Sub=@(
         'Identify overexposure of data in SharePoint'
         'Identify risks related to Microsoft Copilot and AI apps by using Microsoft Purview Data Security Posture Management (DSPM)')
       Portal='Microsoft Purview portal > DSPM for AI'; PSModule='ExchangeOnlineManagement, PnP.PowerShell'
       Licensing='Microsoft 365 E5 / E5 Compliance'; Cost='Low - M365 dev tenant'; Lab=$true }

    @{ Id='03-02'; Domain='03'; Slug='03-02-ai-agent-identity-and-governance'; Title='AI Agent Identity and Governance'
       Objective='Implement security for AI'
       Sub=@(
         'Enable and configure real-time protection for Microsoft Copilot Studio agents'
         'Implement conditional access for Microsoft Entra Agent ID'
         'Analyze blast radius for security risks related to Entra Agent ID by using Defender XDR'
         'Manage Entra Agent ID access'
         'Manage agents in Microsoft 365 admin center')
       Portal='Entra admin center > Agent ID; Defender portal; M365 admin center'
       PSModule='Microsoft.Graph'; Licensing='Microsoft Entra ID P2; Copilot Studio capacity'
       Cost='Low - verify Preview status per bullet before writing'; Lab=$true }

    @{ Id='03-03'; Domain='03'; Slug='03-03-ai-platform-and-workload-protection'; Title='AI Platform and Workload Protection'
       Objective='Implement security for AI'
       Sub=@(
         'Configure and deploy AI Gateway in Azure API Management for Microsoft Foundry'
         'Configure guardrails for agent security in Foundry'
         'Enable Defender for AI Service in Cloud Workload Protection in Defender for Cloud'
         'Monitor AI security by using the Data and AI security dashboard in Defender for Cloud')
       Portal='Azure portal > API Management / Microsoft Foundry; Defender for Cloud'
       PSModule='Az.ApiManagement, Az.CognitiveServices'; Licensing='Defender for AI Service plan'
       Cost='Medium - APIM tier choice dominates; model inference billed per token'; Lab=$true }

    @{ Id='03-04'; Domain='03'; Slug='03-04-servers-and-virtual-machines'; Title='Server and Virtual Machine Security'
       Objective='Implement security for servers and virtual machines (VMs)'
       Sub=@(
         'Implement and configure disk encryption'
         'Plan and implement Azure Bastion'
         'Enable and enforce use of just-in-time (JIT) VM access'
         'Extend security controls to hybrid and multicloud servers by using Azure Arc'
         'Onboard servers to Defender for Servers in Defender for Cloud, including hybrid and multicloud scenarios'
         'Configure Defender for Servers settings, including vulnerability scanning, and endpoint detection and response (EDR)'
         'Implement and manage agentless scanning for VMs in Defender for Servers'
         'Configure security features on a VM, including secure boot, virtual Trusted Platform Module (vTPM), integrity monitoring, and security type'
         'Enforce security configuration of Azure-managed servers by using Azure Machine Configuration')
       Portal='Azure portal > Virtual machines; Defender for Cloud > Environment settings'
       PSModule='Az.Compute, Az.ConnectedMachine'; Licensing='Defender for Servers Plan 2'
       Cost='HIGH - Bastion and Defender for Servers P2 both bill hourly per resource'; Lab=$true }

    @{ Id='03-05'; Domain='03'; Slug='03-05-app-platform-containers'; Title='Container Platform Security'
       Objective='Implement security for application platform services'
       Sub=@(
         'Detect misconfigurations and runtime risks in container workloads by using Defender for Containers'
         'Implement and configure security controls for Azure Kubernetes Service (AKS)'
         'Implement and configure security controls for Azure Container Registry'
         'Implement and configure security controls for Azure Container Instances and Azure Container Apps')
       Portal='Azure portal > Kubernetes services / Container registries'
       PSModule='Az.Aks, Az.ContainerRegistry'; Licensing='Defender for Containers plan'
       Cost='Medium-HIGH - AKS node pool bills continuously; tear down same day'; Lab=$true }

    @{ Id='03-06'; Domain='03'; Slug='03-06-app-platform-serverless-web-and-apis'; Title='Serverless, Web, and API Security'
       Objective='Implement security for application platform services'
       Sub=@(
         'Implement and configure security controls for Azure Functions, including authentication and network access'
         'Implement and configure security controls for Azure Logic Apps'
         'Implement and configure security controls for Azure App Service'
         'Implement and configure Azure Web Application Firewall'
         'Implement security policies for back-end API protection by using API Management')
       Portal='Azure portal > App Services / Function App / Front Door and WAF'
       PSModule='Az.Websites, Az.Functions, Az.Network, Az.ApiManagement'; Licensing=''
       Cost='Medium - WAF requires Application Gateway or Front Door Premium'; Lab=$true }

    # ---- Domain 4 ----
    @{ Id='04-01'; Domain='04'; Slug='04-01-defender-for-cloud-posture'; Title='Security Posture with Defender for Cloud'
       Objective='Manage security posture by using Defender for Cloud'
       Sub=@(
         'Identify security risks by using Defender CSPM'
         'Evaluate compliance against security frameworks by using Defender for Cloud'
         'Enable and configure Defender for Cloud workload protection plans'
         'Connect hybrid cloud and multicloud environments to Defender for Cloud, including Amazon Web Services (AWS) and Google Cloud Platform (GCP)'
         'Configure Microsoft Defender Vulnerability Management settings for Azure VMs'
         'Discover unprotected assets and vulnerabilities by using Microsoft Defender External Attack Surface Management (EASM)')
       Portal='Defender for Cloud > Environment settings'; PSModule='Az.Security'
       Licensing='Defender CSPM; Defender EASM billed separately'; Cost='Medium - EASM bills per asset inventory'; Lab=$true }

    @{ Id='04-02'; Domain='04'; Slug='04-02-sentinel-workspace-roles-and-content'; Title='Sentinel Workspace, Roles, and Content Hub'
       Objective='Implement activity and event collection in Microsoft Sentinel'
       Sub=@(
         'Create and connect workspaces in Microsoft Sentinel'
         'Assign roles in Microsoft Sentinel'
         'Implement and use content hub solutions')
       Portal='Defender portal > Microsoft Sentinel'; PSModule='Az.OperationalInsights, Az.SecurityInsights'
       Licensing='Sentinel ingestion-based'; Cost='Low if ingestion is kept minimal'; Lab=$true }

    @{ Id='04-03'; Domain='04'; Slug='04-03-sentinel-data-connectors-and-collection'; Title='Sentinel Data Connectors and Event Collection'
       Objective='Implement activity and event collection in Microsoft Sentinel'
       Sub=@(
         'Configure and use Microsoft data connectors for Azure resources'
         'Implement and configure syslog and Common Event Format (CEF) event collections'
         'Implement and configure collection of Windows Security events by using data collection rules, including Windows Event Forwarding (WEF)'
         'Create custom log tables in the workspace to store ingested data')
       Portal='Defender portal > Sentinel > Data connectors; Azure Monitor > Data collection rules'
       PSModule='Az.Monitor, Az.SecurityInsights'; Kql='Custom_CL, SecurityEvent, Syslog, CommonSecurityLog'
       Licensing='Sentinel ingestion-based'; Cost='Medium - ingestion is the cost driver; cap with a daily quota'; Lab=$true }

    @{ Id='04-04'; Domain='04'; Slug='04-04-sentinel-automation-retention-and-audit'; Title='Sentinel Automation, Retention, and Purview Audit'
       Objective='Implement activity and event collection in Microsoft Sentinel'
       Sub=@(
         'Implement automation rules and playbooks in Microsoft Sentinel'
         'Implement data retention in Microsoft Sentinel data stores'
         'Query Microsoft Purview Audit in Defender XDR')
       Portal='Defender portal > Sentinel > Automation; Purview portal > Audit'
       PSModule='Az.SecurityInsights, Az.LogicApp'; Kql='AuditLogs, CloudAppEvents, OfficeActivity'
       Licensing='Sentinel; Purview Audit (Standard/Premium)'; Cost='Low'; Lab=$true }

    @{ Id='04-05'; Domain='04'; Slug='04-05-security-copilot'; Title='Microsoft Security Copilot'
       Objective='Implement Microsoft Security Copilot'
       Sub=@(
         'Configure workspaces for Security Copilot'
         'Manage permissions and roles in Security Copilot'
         'Enable and configure plugins'
         'Enable and configure Microsoft agents and Security Store agents')
       Portal='Microsoft Security Copilot portal'; PSModule='(portal-driven; no dedicated module)'
       Licensing='Security Copilot provisioned SCUs'
       Cost='HIGHEST IN GUIDE - SCUs bill hourly while provisioned. Provision, execute, deprovision in one session.'; Lab=$true }
)

$Appendices = @(
    @{ Slug='a1-powershell-and-graph-module-reference'; Title='PowerShell and Microsoft Graph Module Reference' }
    @{ Slug='a2-licensing-and-lab-cost-matrix';          Title='Licensing and Lab Cost Matrix' }
    @{ Slug='a3-glossary';                               Title='Glossary' }
    @{ Slug='a4-exam-logistics-and-scoring';             Title='Exam Logistics and Scoring' }
    @{ Slug='a5-az500-to-sc500-delta';                   Title='AZ-500 to SC-500 Delta' }
)

#endregion

#region ---------------------------------------------------------------- Helpers

function Write-Step { param([string]$Message) Write-Host "  -> $Message" -ForegroundColor Cyan }

function New-Dir {
    param([string]$FullPath)
    if (-not (Test-Path -LiteralPath $FullPath)) {
        if ($PSCmdlet.ShouldProcess($FullPath, 'Create directory')) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        }
    }
}

function New-TextFile {
    param([string]$FullPath, [string]$Content)
    if ((Test-Path -LiteralPath $FullPath) -and -not $Force) {
        Write-Verbose "Exists, skipping: $FullPath"
        return
    }
    if ($PSCmdlet.ShouldProcess($FullPath, 'Write file')) {
        New-Dir (Split-Path -Parent $FullPath)
        # UTF-8 without BOM so the browser fetch() and the validator agree
        [System.IO.File]::WriteAllText($FullPath, $Content, (New-Object System.Text.UTF8Encoding($false)))
    }
}

function ConvertTo-YamlList {
    param([string[]]$Items, [string]$Indent = '  ')
    if (-not $Items -or $Items.Count -eq 0) { return ' []' }
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine('')
    foreach ($i in $Items) {
        [void]$sb.AppendLine("$Indent- `"$($i -replace '"','\"')`"")
    }
    return $sb.ToString().TrimEnd([char]13, [char]10)
}

function Get-ModuleFrontMatter {
    param([hashtable]$M)

    $d       = $Domains[$M.Domain]
    $subs    = ConvertTo-YamlList -Items ($M.Sub)
    $kql     = if ($M.ContainsKey('Kql') -and $M.Kql) {
                   ConvertTo-YamlList -Items ($M.Kql -split ',\s*')
               } else { ' []' }

@"
---
objective: "$($M.Objective)"
sub_objectives:$subs
domain: "$($d.Name)"
domain_weight: "$($d.Weight)"
status: GA                       # GA | Preview - RE-VERIFY per module before writing
prerequisites: []
ms_learn_source: "$SkillsUrl"
product_docs: []
last_verified: "$VerifiedOn"
portal: "$($M.Portal)"
powershell_module: "$($M.PSModule)"
az_cli_command: ""
kql_tables:$kql
licensing: "$($M.Licensing)"
azure_resources: []
lab_cost_estimate: "$($M.Cost)"
free_practice_available: false
forensic_relevance: ""
---
"@
}

#endregion

#region ---------------------------------------------------------------- Scaffold

Write-Host "`nSC500 Academy - SC-500 interactive learning guide scaffold" -ForegroundColor Green
Write-Host "Repo:       $RepoRoot"
Write-Host "Visibility: $Visibility   License: $License   Branch: $DefaultBranch"
Write-Host "Remote:     $(if ($LocalOnly) { 'local init only (-LocalOnly)' } else { 'create if missing, then push' })"
Write-Host "Pages:      $(if ($LocalOnly -or $SkipPages) { 'not enabled' } else { "$DefaultBranch root" })`n"

if ((Test-Path -LiteralPath $RepoRoot) -and -not $Force) {
    throw "Target already exists: $RepoRoot. Re-run with -Force to write into it."
}

Write-Step 'Creating directory tree'
$dirs = @(
    'assets/css','assets/js/vendor','assets/img',
    'content/appendix','labs','scripts/teardown',
    'tools/schema','docs'
)
foreach ($d in $Domains.Values) {
    $dirs += "content/$($d.Folder)"
    $dirs += "labs/$($d.Folder)"
    if ($d.Folder -ne '00-lab-safety') { $dirs += "scripts/$($d.Folder)" }
}
foreach ($d in $dirs) { New-Dir (Join-Path $RepoRoot ($d -replace '/','\')) }

# ---- Root files ----
Write-Step 'Writing root files'
New-TextFile (Join-Path $RepoRoot '.nojekyll') ''

New-TextFile (Join-Path $RepoRoot '.gitignore') @'
.DS_Store
Thumbs.db
*.log
.vscode/
.idea/
# never commit tenant-specific output
**/lab-output/
*.publishsettings
*.pfx
*.cer
.env
'@

$licenseNote = switch ($License) {
    'MIT'        { 'MIT (code and content)' }
    'CC-BY-4.0'  { 'CC BY 4.0 (code and content)' }
    'Dual'       { 'MIT for code (scripts, tooling, site) / CC BY 4.0 for prose and labs' }
    'None'       { 'UNSET - see docs/STRUCTURE.md section 5' }
}

New-TextFile (Join-Path $RepoRoot 'README.md') @"
# SC500 Academy

A dependency-free, static interactive study guide for **Exam SC-500: Implementing
End-to-End Security Controls for Cloud and AI Workloads** (Microsoft Certified:
Cloud and AI Security Engineer Associate).

Every concept is sourced from official Microsoft Learn documentation. Non-Microsoft
material appears only as clearly labelled optional supplemental reading.

## Scope

| Domain | Weight |
| --- | --- |
| Manage identity, access, and governance | 20-25% |
| Secure storage, databases, and networking | 25-30% |
| Secure compute | 20-25% |
| Manage and monitor security posture | 20-25% |

Skills-measured outline captured $VerifiedOn from <$SkillsUrl>.
The verbatim snapshot lives in ``docs/SKILLS-MEASURED-SNAPSHOT.md`` so outline drift is diffable.

## Start here

**``content/00-lab-safety/``** - budget guardrails and PIM-based just-in-time lab access.
Run Module 0 before creating any billable resource. Several objectives in this guide
(Security Copilot, Azure Firewall, Defender for Servers, AKS) bill hourly whether or
not you use them.

Every lab file ends with a mandatory ``## Teardown`` section. Use it.

## Local preview

The site fetches Markdown at runtime, so ``file://`` will not work. Serve it:

``````
python -m http.server 8080
``````

Then open <http://localhost:8080>.

## Validate before committing

``````powershell
.\tools\Test-GuideContent.ps1 -CheckExternalLinks
``````

## Licence

$licenseNote

Maintained by $Author.
"@

if ($License -in @('MIT','Dual')) {
    New-TextFile (Join-Path $RepoRoot 'LICENSE') @"
MIT License

Copyright (c) $(Get-Date -Format yyyy) $Author

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@
}

if ($License -in @('CC-BY-4.0','Dual')) {
    New-TextFile (Join-Path $RepoRoot 'LICENSE-CONTENT') @"
Prose, diagrams, and lab instructions in this repository are licensed under
Creative Commons Attribution 4.0 International (CC BY 4.0).

Full terms: https://creativecommons.org/licenses/by/4.0/

Attribution: $Author - SC500 Academy.

Microsoft product names, documentation excerpts, and the SC-500 skills-measured
outline remain the property of Microsoft Corporation and are used for
educational reference. This project is not affiliated with or endorsed by
Microsoft.
"@
}

# ---- Site shell ----
Write-Step 'Writing static site shell'

New-TextFile (Join-Path $RepoRoot 'index.html') @'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SC500 Academy</title>
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components.css">
</head>
<body>
<a class="skip" href="#content">Skip to content</a>

<header class="topbar">
  <button id="nav-toggle" aria-expanded="false" aria-controls="sidebar">Menu</button>
  <span class="topbar__title">SC500 Academy</span>
  <input id="search" type="search" placeholder="Search modules" aria-label="Search modules">
</header>

<div class="shell">
  <nav id="sidebar" class="sidebar" aria-label="Modules"><!-- built by nav.js --></nav>
  <main id="content" class="content" tabindex="-1">
    <p class="loading">Loading&hellip;</p>
  </main>
  <aside id="meta" class="meta" aria-label="Objective metadata"><!-- built by app.js --></aside>
</div>

<script src="assets/js/vendor/marked.min.js"></script>
<script src="assets/js/frontmatter.js"></script>
<script src="assets/js/nav.js"></script>
<script src="assets/js/tabs.js"></script>
<script src="assets/js/progress.js"></script>
<script src="assets/js/quiz.js"></script>
<script src="assets/js/search.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
'@

New-TextFile (Join-Path $RepoRoot '404.html') @'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Not found</title>
<meta http-equiv="refresh" content="0; url=/"></head>
<body><p>That page does not exist. <a href="/">Back to the guide</a>.</p></body>
</html>
'@

foreach ($css in @('tokens','layout','components')) {
    New-TextFile (Join-Path $RepoRoot "assets\css\$css.css") "/* $css.css - SC-500 guide. TODO: design pass. */`n"
}
foreach ($js in @('app','frontmatter','nav','tabs','progress','quiz','search')) {
    New-TextFile (Join-Path $RepoRoot "assets\js\$js.js") "// $js.js - SC-500 guide. TODO: implement.`n"
}
New-TextFile (Join-Path $RepoRoot 'assets\js\vendor\README.md') @'
Drop the single-file Markdown parser here as `marked.min.js`.

Vendored deliberately: no npm, no build step, no CDN at runtime. Pin the version
and record it below when you add it.

- marked.min.js - version: (record here) - added: (date)
'@

# ---- Content and lab stubs ----
Write-Step "Writing $($Modules.Count) module stubs and lab stubs"

foreach ($m in $Modules) {
    $d  = $Domains[$m.Domain]
    $fm = Get-ModuleFrontMatter -M $m

    $subList = if ($m.Sub.Count) {
        ($m.Sub | ForEach-Object { "- $_" }) -join "`n"
    } else { '_Project prerequisite module - no exam sub-objectives._' }

    $body = @"
$fm

# $($m.Title)

> **Objective:** $($m.Objective)
> **Domain:** $($d.Name) ($($d.Weight))

## Sub-objectives covered

$subList

## Why this exists

<!-- First-principles framing. What problem does this control solve, and what
     goes wrong without it? Analogy goes here, before any portal blade is named. -->

## How it works under the hood

<!-- Mechanism, not menu path. Trust boundaries, token flow, evaluation order,
     where the control actually sits in the request path. -->

## Configuration surface

<!-- What is configurable, what the defaults are, and which defaults are unsafe. -->

## Common failure modes

<!-- Misconfigurations that pass a checklist but fail in practice. -->

## Check yourself

<!-- 3-5 self-check questions. Reasoning questions, not recall. -->

## Hands-on

See [$($m.Id) lab](../../labs/$($d.Folder)/$($m.Id)-lab.md).

## Sources

- Microsoft Learn - SC-500 skills measured: $SkillsUrl
- <!-- product documentation URLs -->
"@
    New-TextFile (Join-Path $RepoRoot "content\$($d.Folder)\$($m.Slug).md") $body

    if ($m.Lab) {
        $labBody = @"
# Lab $($m.Id) - $($m.Title)

**Objective:** $($m.Objective)
**Estimated cost:** $($m.Cost)
**Licensing required:** $(if ($m.Licensing) { $m.Licensing } else { 'None beyond an Azure subscription' })

> Complete **Module 0** before running this lab. Activate your role through PIM;
> do not run labs with standing Global Administrator.

## Prerequisites

<!-- Resources, roles, licences. Reference the PIM activation from 00-02. -->

## Method A - Portal

**Portal path:** $($m.Portal)

<!-- Numbered steps. One action per step. -->

## Method B - PowerShell

**Modules:** $($m.PSModule)

``````powershell
# See scripts/$($d.Folder)/ for the runnable version.
``````

## Validation

<!-- How you prove the control is working, using the portal surface the exam tests. -->

## Teardown

**Mandatory.** Run this before you close the session.

- [ ] <!-- Remove resource created in this lab -->
- [ ] <!-- Revert configuration changed in this lab -->
- [ ] Disable any Defender plan enabled solely for this lab
- [ ] Deactivate the PIM role assignment
- [ ] Confirm the lab resource group is empty or deleted
- [ ] Check Cost Management for unexpected residual spend

``````powershell
.\scripts\teardown\Remove-LabResourceGroup.ps1 -LabId '$($m.Id)' -WhatIf
``````
"@
        New-TextFile (Join-Path $RepoRoot "labs\$($d.Folder)\$($m.Id)-lab.md") $labBody
    }
}

foreach ($a in $Appendices) {
    New-TextFile (Join-Path $RepoRoot "content\appendix\$($a.Slug).md") @"
---
objective: "(Appendix - not an SC-500 exam objective)"
sub_objectives: []
domain: "Appendix"
domain_weight: "n/a"
status: GA
prerequisites: []
ms_learn_source: "$SkillsUrl"
product_docs: []
last_verified: "$VerifiedOn"
portal: ""
powershell_module: ""
az_cli_command: ""
kql_tables: []
licensing: ""
azure_resources: []
lab_cost_estimate: ""
free_practice_available: false
forensic_relevance: ""
---

# $($a.Title)

<!-- TODO -->
"@
}

# ---- manifest.json ----
Write-Step 'Generating content/manifest.json'
$manifest = [ordered]@{
    generated      = $VerifiedOn
    skills_source  = $SkillsUrl
    domains        = @()
}
foreach ($key in $Domains.Keys) {
    $d = $Domains[$key]
    $manifest.domains += [ordered]@{
        id      = $key
        name    = $d.Name
        weight  = $d.Weight
        folder  = $d.Folder
        modules = @(
            $Modules | Where-Object { $_.Domain -eq $key } | ForEach-Object {
                [ordered]@{
                    id        = $_.Id
                    title     = $_.Title
                    objective = $_.Objective
                    content   = "content/$($d.Folder)/$($_.Slug).md"
                    lab       = if ($_.Lab) { "labs/$($d.Folder)/$($_.Id)-lab.md" } else { $null }
                }
            }
        )
    }
}
$manifest.appendix = @($Appendices | ForEach-Object {
    [ordered]@{ title = $_.Title; content = "content/appendix/$($_.Slug).md" }
})
New-TextFile (Join-Path $RepoRoot 'content\manifest.json') ($manifest | ConvertTo-Json -Depth 6)

# ---- docs/SYLLABUS.md ----
Write-Step 'Generating docs/SYLLABUS.md'
$syl = [System.Text.StringBuilder]::new()
[void]$syl.AppendLine('# SC-500 Syllabus Map')
[void]$syl.AppendLine('')
[void]$syl.AppendLine("Generated by ``New-SC500GuideRepo.ps1``. Outline verified $VerifiedOn against <$SkillsUrl>.")
[void]$syl.AppendLine('')
[void]$syl.AppendLine('| Module | Objective (verbatim) | File | Domain | Weight | Bullets |')
[void]$syl.AppendLine('| --- | --- | --- | --- | --- | --- |')
foreach ($m in $Modules) {
    $d = $Domains[$m.Domain]
    [void]$syl.AppendLine("| $($m.Id) | $($m.Objective) | ``content/$($d.Folder)/$($m.Slug).md`` | $($d.Name) | $($d.Weight) | $($m.Sub.Count) |")
}
[void]$syl.AppendLine('')
[void]$syl.AppendLine("**Totals:** $($Modules.Count) modules, $(($Modules | Measure-Object -Property @{E={$_.Sub.Count}} -Sum).Sum) verbatim sub-objectives.")
New-TextFile (Join-Path $RepoRoot 'docs\SYLLABUS.md') $syl.ToString()

foreach ($doc in @(
    @{ f='SKILLS-MEASURED-SNAPSHOT.md'; t='Skills Measured - Verbatim Snapshot'; n="Paste the verbatim outline captured $VerifiedOn here. This file is the drift baseline; diff it against the live page before each module." }
    @{ f='STYLE-GUIDE.md';  t='Style Guide';  n='Analogy policy, GUI/PowerShell parity rules, Microsoft-source-only policy, verbatim-quoting limits.' }
    @{ f='CONTRIBUTING.md'; t='Contributing'; n='Run tools/Test-GuideContent.ps1 before every commit.' }
)) {
    New-TextFile (Join-Path $RepoRoot "docs\$($doc.f)") "# $($doc.t)`n`n<!-- $($doc.n) -->`n"
}

# ---- Validator ----
Write-Step 'Writing tools/Test-GuideContent.ps1'
New-TextFile (Join-Path $RepoRoot 'tools\Test-GuideContent.ps1') @'
<#
.SYNOPSIS
    Validates front-matter schema conformance, internal link integrity, and
    optionally external Microsoft Learn link health.
.EXAMPLE
    .\tools\Test-GuideContent.ps1 -CheckExternalLinks
#>
[CmdletBinding()]
param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent),
    [switch]$CheckExternalLinks,
    [int]$StaleAfterDays = 60
)

$ErrorActionPreference = 'Stop'

$Required = @(
    'objective','sub_objectives','domain','domain_weight','status','prerequisites',
    'ms_learn_source','product_docs','last_verified','portal','powershell_module',
    'az_cli_command','kql_tables','licensing','azure_resources','lab_cost_estimate',
    'free_practice_available','forensic_relevance'
)

$issues = [System.Collections.Generic.List[object]]::new()
function Add-Issue { param($File,$Level,$Message)
    $issues.Add([pscustomobject]@{ File = $File; Level = $Level; Message = $Message })
}

$mdFiles = Get-ChildItem -Path (Join-Path $Root 'content') -Filter *.md -Recurse

foreach ($f in $mdFiles) {
    $text = Get-Content -LiteralPath $f.FullName -Raw
    $rel  = $f.FullName.Substring($Root.Length + 1)

    if ($text -notmatch '(?s)\A---\r?\n(.*?)\r?\n---\r?\n') {
        Add-Issue $rel 'ERROR' 'Missing or malformed YAML front matter'
        continue
    }
    $fm = $Matches[1]

    foreach ($key in $Required) {
        if ($fm -notmatch "(?m)^$([regex]::Escape($key))\s*:") {
            Add-Issue $rel 'ERROR' "Missing required key: $key"
        }
    }

    if ($fm -match '(?m)^status\s*:\s*(\S+)' -and $Matches[1] -notin @('GA','Preview')) {
        Add-Issue $rel 'ERROR' "status must be GA or Preview (found: $($Matches[1]))"
    }

    if ($fm -match '(?m)^last_verified\s*:\s*"?(\d{4}-\d{2}-\d{2})"?') {
        $age = (Get-Date) - [datetime]::ParseExact($Matches[1],'yyyy-MM-dd',$null)
        if ($age.TotalDays -gt $StaleAfterDays) {
            Add-Issue $rel 'WARN' "last_verified is $([int]$age.TotalDays) days old - re-check the live outline"
        }
    } else {
        Add-Issue $rel 'ERROR' 'last_verified missing or not YYYY-MM-DD'
    }

    if ($fm -match '(?m)^domain_weight\s*:\s*"?([^"\r\n]*)"?' ) {
        $w = $Matches[1].Trim()
        if ($w -notin @('20-25%','25-30%','n/a')) {
            Add-Issue $rel 'ERROR' "Unexpected domain_weight: $w"
        }
    }

    # Internal relative links
    foreach ($m in [regex]::Matches($text, '\]\((?!https?:|#|mailto:)([^)]+)\)')) {
        $target = $m.Groups[1].Value -replace '#.*$',''
        if (-not $target) { continue }
        $resolved = Join-Path (Split-Path $f.FullName -Parent) $target
        if (-not (Test-Path -LiteralPath $resolved)) {
            Add-Issue $rel 'ERROR' "Broken internal link: $target"
        }
    }
}

# Every lab must end with a Teardown section
foreach ($f in Get-ChildItem -Path (Join-Path $Root 'labs') -Filter *.md -Recurse) {
    $rel = $f.FullName.Substring($Root.Length + 1)
    if ((Get-Content -LiteralPath $f.FullName -Raw) -notmatch '(?m)^##\s+Teardown\s*$') {
        Add-Issue $rel 'ERROR' 'Lab file has no ## Teardown section'
    }
}

# Manifest paths resolve
$manifestPath = Join-Path $Root 'content\manifest.json'
if (Test-Path $manifestPath) {
    $mf = Get-Content $manifestPath -Raw | ConvertFrom-Json
    foreach ($d in $mf.domains) {
        foreach ($mod in $d.modules) {
            foreach ($p in @($mod.content, $mod.lab) | Where-Object { $_ }) {
                if (-not (Test-Path (Join-Path $Root ($p -replace '/','\')))) {
                    Add-Issue 'content/manifest.json' 'ERROR' "Manifest points at missing file: $p"
                }
            }
        }
    }
} else {
    Add-Issue 'content/manifest.json' 'ERROR' 'Manifest not found'
}

if ($CheckExternalLinks) {
    $urls = $mdFiles | ForEach-Object { Get-Content $_.FullName -Raw } |
        ForEach-Object { [regex]::Matches($_, 'https://learn\.microsoft\.com/[^\s)"]+') } |
        ForEach-Object { $_.Value } | Sort-Object -Unique
    foreach ($u in $urls) {
        try {
            $r = Invoke-WebRequest -Uri $u -Method Head -MaximumRedirection 5 -SkipHttpErrorCheck -TimeoutSec 20
            if ($r.StatusCode -ge 400) { Add-Issue 'external' 'WARN' "$($r.StatusCode) - $u" }
        } catch {
            Add-Issue 'external' 'WARN' "Unreachable - $u"
        }
    }
}

$errors = @($issues | Where-Object Level -eq 'ERROR')
$warns  = @($issues | Where-Object Level -eq 'WARN')

if ($issues.Count) { $issues | Sort-Object Level, File | Format-Table -AutoSize }
Write-Host "`n$($mdFiles.Count) content files checked. $($errors.Count) error(s), $($warns.Count) warning(s)." -ForegroundColor $(if ($errors.Count) { 'Red' } else { 'Green' })
exit ($(if ($errors.Count) { 1 } else { 0 }))
'@

New-TextFile (Join-Path $RepoRoot 'tools\New-Module.ps1') "# Emits a new module stub from the schema template. TODO.`n"
New-TextFile (Join-Path $RepoRoot 'scripts\teardown\Remove-LabResourceGroup.ps1') @'
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$LabId,
    [string]$Prefix = 'rg-sc500-lab'
)
$name = "$Prefix-$LabId"
if ($PSCmdlet.ShouldProcess($name, 'Remove resource group')) {
    Remove-AzResourceGroup -Name $name -Force
}
'@

#endregion

#region ---------------------------------------------------------------- Git

Write-Step 'Initialising git'
Push-Location $RepoRoot
try {
    if (-not (Test-Path (Join-Path $RepoRoot '.git'))) {
        if ($PSCmdlet.ShouldProcess($RepoRoot, 'git init')) {
            git init --initial-branch=$DefaultBranch | Out-Null
        }
    }
    if ($PSCmdlet.ShouldProcess($RepoRoot, 'git commit')) {
        git add -A | Out-Null
        git -c user.useConfigOnly=false commit -m "Scaffold SC-500 interactive learning guide (outline verified $VerifiedOn)" | Out-Null
    }

    if (-not $LocalOnly) {

        # --- Credential resolution -------------------------------------------
        # Order: -GitHubToken, then $env:GITHUB_TOKEN (bound above), then the
        # token the GitHub CLI already holds. Everything after this point is
        # plain REST over Invoke-RestMethod, so gh is convenient but not required.
        $token = $GitHubToken
        if (-not $token -and (Get-Command gh -ErrorAction SilentlyContinue)) {
            $ghToken = & gh auth token 2>$null
            if ($LASTEXITCODE -eq 0 -and $ghToken) { $token = $ghToken.Trim() }
        }
        if (-not $token) {
            throw @'
No GitHub credential found. Supply one of:
  -GitHubToken <pat>
  $env:GITHUB_TOKEN = '<pat>'
  gh auth login
Or re-run with -LocalOnly to skip publishing.
'@
        }

        $ghHeaders = @{
            Authorization          = "Bearer $token"
            Accept                 = 'application/vnd.github+json'
            'X-GitHub-Api-Version' = '2022-11-28'
            'User-Agent'           = 'New-SC500GuideRepo'
        }

        function Invoke-GitHubApi {
            param(
                [string]$Method = 'GET',
                [Parameter(Mandatory)][string]$Endpoint,
                $Body
            )
            $p = @{
                Method      = $Method
                Uri         = "https://api.github.com/$($Endpoint.TrimStart('/'))"
                Headers     = $ghHeaders
                ErrorAction = 'Stop'
            }
            if ($Body) {
                $p.Body        = ($Body | ConvertTo-Json -Depth 6 -Compress)
                $p.ContentType = 'application/json'
            }
            Invoke-RestMethod @p
        }

        function Get-HttpStatus {
            # Null-safe: a DNS/TLS failure has no Response object, and StrictMode
            # would otherwise throw inside the catch block and mask the real error.
            param($ErrorRecord)
            try {
                $r = $ErrorRecord.Exception.PSObject.Properties['Response']
                if ($r -and $r.Value) { return [int]$r.Value.StatusCode }
            } catch { }
            return 0
        }

        # --- Owner ------------------------------------------------------------
        $authUser = (Invoke-GitHubApi -Endpoint 'user').login
        $owner    = if ($GitHubOwner) { $GitHubOwner } else { $authUser }
        $target   = "$owner/$RepoName"
        Write-Step "Authenticated as $authUser; target $target"

        # --- Create repository if it does not already exist -------------------
        $repoExists = $true
        try   { Invoke-GitHubApi -Endpoint "repos/$target" | Out-Null }
        catch { if ((Get-HttpStatus $_) -eq 404) { $repoExists = $false } else { throw } }

        if ($repoExists) {
            Write-Step "Remote $target already exists - reusing it"
        }
        elseif ($PSCmdlet.ShouldProcess($target, "Create $Visibility repository")) {
            Write-Step "Creating $Visibility repository $target"
            $payload = @{
                name        = $RepoName
                description = 'Interactive study guide for Microsoft Exam SC-500 (Cloud and AI Security Engineer Associate)'
                private     = ($Visibility -eq 'private')
                auto_init   = $false          # we already have a commit; auto_init would force a merge
                has_issues  = $true
                has_wiki    = $false
            }
            $endpoint = if ($owner -eq $authUser) { 'user/repos' } else { "orgs/$owner/repos" }
            Invoke-GitHubApi -Method POST -Endpoint $endpoint -Body $payload | Out-Null
            Start-Sleep -Seconds 2   # brief settle before the first push
        }

        # --- Remote and push --------------------------------------------------
        $cleanUrl = "https://github.com/$target.git"
        $authArgs = @('-c', 'credential.helper=', '-c', "http.extraheader=AUTHORIZATION: bearer $token")

        # A repo created through the GitHub UI usually has a README and a LICENSE
        # commit. Pushing our unrelated history onto that is rejected, so find out
        # before trying rather than after.
        $remoteHasCommits = $false
        if ($repoExists) {
            try {
                $commits = Invoke-GitHubApi -Endpoint "repos/$target/commits?per_page=1"
                $remoteHasCommits = @($commits).Count -gt 0
            }
            catch {
                # 409 Conflict is GitHub's way of saying the repository is empty.
                if ((Get-HttpStatus $_) -ne 409) { throw }
            }
        }

        if ($PSCmdlet.ShouldProcess($target, "git push $DefaultBranch")) {
            if ((git remote) -contains 'origin') {
                git remote set-url origin $cleanUrl | Out-Null
            } else {
                git remote add origin $cleanUrl | Out-Null
            }

            if ($remoteHasCommits) {
                if (-not $AdoptRemote) {
                    throw @"
$target already has commits. Pushing this scaffold on top would be rejected.

Pick one:
  -AdoptRemote   Fetch the remote history and rebase the scaffold onto it.
                 Expect a conflict on README.md and LICENSE if the repo was
                 created with those files; resolve and re-run.
  -LocalOnly     Scaffold locally, then merge by hand.
  Delete the remote repository and re-run to start clean.
"@
                }

                Write-Step "Remote has history - fetching and rebasing onto origin/$DefaultBranch"
                git @authArgs fetch origin $DefaultBranch
                if ($LASTEXITCODE -ne 0) { throw "git fetch failed with exit code $LASTEXITCODE." }

                git rebase "origin/$DefaultBranch"
                if ($LASTEXITCODE -ne 0) {
                    throw @"
Rebase stopped on a conflict. This is expected if the remote already had a
README.md or LICENSE. Resolve the conflicts, then:

    git rebase --continue
    git push origin $DefaultBranch

Or abandon the rebase with: git rebase --abort
"@
                }
            }

            Write-Step "Pushing $DefaultBranch"
            # The token is passed as a transient header on this one invocation.
            # It is never written to .git/config and no credential helper is used,
            # so nothing persists on disk after the push.
            git @authArgs push --set-upstream origin $DefaultBranch
            if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE." }
        }

        # --- Pages ------------------------------------------------------------
        if (-not $SkipPages -and $PSCmdlet.ShouldProcess($target, 'Enable GitHub Pages')) {
            Write-Step "Enabling Pages ($DefaultBranch, root - .nojekyll present)"
            $pagesBody = @{ source = @{ branch = $DefaultBranch; path = '/' } }
            try {
                Invoke-GitHubApi -Method POST -Endpoint "repos/$target/pages" -Body $pagesBody | Out-Null
            }
            catch {
                $code = $_.Exception.Response.StatusCode.value__
                if ($code -eq 409) {
                    # Already configured - update the source instead
                    Invoke-GitHubApi -Method PUT -Endpoint "repos/$target/pages" -Body $pagesBody | Out-Null
                }
                elseif ($code -eq 403) {
                    Write-Warning "Pages not enabled: token lacks the Pages (write) permission. Enable it under Settings > Pages, or re-run with a PAT that has it."
                }
                else { throw }
            }
            Write-Host "  Pages URL: https://$owner.github.io/$RepoName/" -ForegroundColor Green
            Write-Host '  First build takes a minute or two.' -ForegroundColor DarkGray
        }

        $script:PublishedTo = $target
    }
}
finally { Pop-Location }

#endregion

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  $($Modules.Count) modules, $(($Modules | Where-Object Lab).Count) labs, $($Appendices.Count) appendices."
Write-Host "  Next: review docs/SYLLABUS.md, then run tools\Test-GuideContent.ps1."
if ($LocalOnly) {
    Write-Host '  Local only. Re-run without -LocalOnly to create the remote and push.' -ForegroundColor Yellow
}
elseif (Get-Variable PublishedTo -Scope Script -ErrorAction SilentlyContinue) {
    Write-Host "  Pushed to https://github.com/$($script:PublishedTo)" -ForegroundColor Green
}
