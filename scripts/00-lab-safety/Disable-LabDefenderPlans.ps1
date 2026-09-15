<#
.SYNOPSIS
    Emergency cost brake for the SC-500 lab subscription.

.DESCRIPTION
    Sets every Microsoft Defender for Cloud pricing tier from Standard to Free,
    then deallocates every running VM tagged 'sc500-module'.

    Designed to run as an Azure Automation PowerShell runbook under a
    system-assigned managed identity holding Contributor at subscription scope,
    triggered by a webhook attached to a budget alert action group. It also runs
    interactively for testing.

    This is a BACKSTOP, not the primary control. Azure cost data lags actual
    usage by hours, so by the time a budget alert fires the spend has already
    happened. Per-lab teardown discipline is the real control.

.PARAMETER WhatIfMode
    Report what would change without changing it. Use this for the first run.
    Named WhatIfMode rather than using SupportsShouldProcess because Automation
    runbook webhook parameters are passed as plain values.

.PARAMETER SkipVMs
    Change Defender pricing tiers only; leave virtual machines running.

.PARAMETER KeepPlans
    Plan names to leave at Standard, e.g. 'CloudPosture'.

.NOTES
    Required module in the Automation account: Az.Accounts, Az.Security, Az.Compute.
    Verified against Az.Security cmdlet surface on 2026-09-15.
#>
[CmdletBinding()]
param(
    [bool]$WhatIfMode = $false,
    [bool]$SkipVMs    = $false,
    [string[]]$KeepPlans = @()
)

$ErrorActionPreference = 'Stop'

function Write-Line { param([string]$Text) Write-Output "$(Get-Date -Format 'u')  $Text" }

Write-Line '=== SC-500 lab cost brake ==='
if ($WhatIfMode) { Write-Line 'WHATIF MODE - no changes will be made' }

# --- Authenticate ------------------------------------------------------------
# In Automation, connect with the managed identity. Interactively, reuse the
# existing context.
if ($env:AUTOMATION_ASSET_ACCOUNTID) {
    Write-Line 'Authenticating with the Automation account managed identity'
    Disable-AzContextAutosave -Scope Process | Out-Null
    $ctx = (Connect-AzAccount -Identity).Context
} else {
    Write-Line 'Using the current interactive Azure context'
    $ctx = Get-AzContext
    if (-not $ctx) { throw 'No Azure context. Run Connect-AzAccount first.' }
}

Write-Line "Subscription: $($ctx.Subscription.Name) ($($ctx.Subscription.Id))"

# --- 1. Defender for Cloud pricing tiers --------------------------------------
# These are SUBSCRIPTION-scope settings. Deleting resource groups does not
# touch them, which is why they are the most common source of surprise spend.
Write-Line ''
Write-Line '--- Defender for Cloud plans ---'

$plans   = Get-AzSecurityPricing
$standard = $plans | Where-Object { $_.PricingTier -eq 'Standard' -and $_.Name -notin $KeepPlans }

if (-not $standard) {
    Write-Line 'No Standard plans found. Nothing to disable.'
} else {
    Write-Line "$($standard.Count) plan(s) at Standard:"
    foreach ($p in $standard) {
        $sub = if ($p.SubPlan) { " (subplan: $($p.SubPlan))" } else { '' }
        Write-Line "  - $($p.Name)$sub"
    }

    foreach ($p in $standard) {
        if ($WhatIfMode) {
            Write-Line "  WOULD SET $($p.Name) -> Free"
            continue
        }
        try {
            Set-AzSecurityPricing -Name $p.Name -PricingTier 'Free' | Out-Null
            Write-Line "  SET $($p.Name) -> Free"
        } catch {
            Write-Line "  FAILED $($p.Name): $($_.Exception.Message)"
        }
    }
}

if ($KeepPlans) { Write-Line "Left at Standard by request: $($KeepPlans -join ', ')" }

# --- 2. Running lab VMs --------------------------------------------------------
# Deallocate, not stop. A stopped-but-allocated VM still bills for compute.
if ($SkipVMs) {
    Write-Line ''
    Write-Line '--- Virtual machines: skipped by request ---'
} else {
    Write-Line ''
    Write-Line '--- Virtual machines tagged sc500-module ---'

    $running = Get-AzVM -Status |
        Where-Object { $_.Tags.Keys -contains 'sc500-module' -and $_.PowerState -eq 'VM running' }

    if (-not $running) {
        Write-Line 'No running tagged VMs.'
    } else {
        foreach ($vm in $running) {
            $module = $vm.Tags['sc500-module']
            if ($WhatIfMode) {
                Write-Line "  WOULD DEALLOCATE $($vm.Name) [module $module]"
                continue
            }
            try {
                Stop-AzVM -ResourceGroupName $vm.ResourceGroupName -Name $vm.Name -Force | Out-Null
                Write-Line "  DEALLOCATED $($vm.Name) [module $module]"
            } catch {
                Write-Line "  FAILED $($vm.Name): $($_.Exception.Message)"
            }
        }
    }
}

# --- 3. What this does NOT stop ------------------------------------------------
# Stated explicitly so the output is honest about the gap.
Write-Line ''
Write-Line '--- Still billing, not handled by this brake ---'
Write-Line '  Azure Firewall, Bastion, VPN/ExpressRoute gateways, Virtual WAN hubs,'
Write-Line '  AKS node pools, App Service plans, provisioned Security Copilot SCUs,'
Write-Line '  and Log Analytics data retention.'
Write-Line '  These need resource deletion, not a tier change. Run the per-lab teardown.'

Write-Line ''
Write-Line '=== Brake complete ==='
