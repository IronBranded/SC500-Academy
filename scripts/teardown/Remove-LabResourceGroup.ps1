<#
.SYNOPSIS
    Tears down one SC-500 lab across all four scopes and verifies the result.

.DESCRIPTION
    Implements the checklist in content/00-lab-safety/00-03-teardown-checklist-template.md:

      1. Resources            - delete the lab resource group
      2. Subscription scope   - Defender plans, policy assignments, orphaned roles
      3. Directory scope      - reported, never auto-deleted
      4. Soft-deleted remains - key vaults holding a name hostage
      5. Access               - PIM deactivation is reported, not automated
      6. Verify               - a sweep that proves the teardown worked

    Directory objects are deliberately NOT deleted automatically. A script that
    deletes app registrations and conditional access policies on your behalf is
    a script that can lock you out of your own tenant. It reports them instead.

.PARAMETER LabId
    Module identifier, e.g. '02-04'. Matches the rg-sc500-lab-<LabId> convention
    and the sc500-module tag.

.PARAMETER SweepOnly
    Skip deletion. Run the end-of-session verification sweep across the whole
    subscription and report anything outstanding.

.EXAMPLE
    .\Remove-LabResourceGroup.ps1 -LabId '02-04' -WhatIf

.EXAMPLE
    .\Remove-LabResourceGroup.ps1 -SweepOnly
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(ParameterSetName = 'Lab', Mandatory)]
    [ValidatePattern('^\d{2}-\d{2}$')]
    [string]$LabId,

    [Parameter(ParameterSetName = 'Sweep', Mandatory)]
    [switch]$SweepOnly,

    [string]$Prefix = 'rg-sc500-lab',
    [switch]$PurgeKeyVaults
)

$ErrorActionPreference = 'Stop'

$ctx = Get-AzContext
if (-not $ctx) { throw 'No Azure context. Run Connect-AzAccount first.' }
$SubId = $ctx.Subscription.Id
$SubScope = "/subscriptions/$SubId"

Write-Host "Subscription: $($ctx.Subscription.Name)" -ForegroundColor Cyan

function Write-Section { param([string]$T) Write-Host "`n--- $T ---" -ForegroundColor Cyan }

#region -------------------------------------------------------------- Teardown

if (-not $SweepOnly) {
    $rgName = "$Prefix-$LabId"

    # 1. Resources -------------------------------------------------------------
    Write-Section "1. Resources ($rgName)"
    $rg = Get-AzResourceGroup -Name $rgName -ErrorAction SilentlyContinue
    if (-not $rg) {
        Write-Host "  Not present - nothing to delete." -ForegroundColor DarkGray
    } else {
        $contents = Get-AzResource -ResourceGroupName $rgName
        Write-Host "  $($contents.Count) resource(s):"
        $contents | ForEach-Object { Write-Host "    $($_.ResourceType)  $($_.Name)" }
        if ($PSCmdlet.ShouldProcess($rgName, 'Remove resource group')) {
            Remove-AzResourceGroup -Name $rgName -Force | Out-Null
            Write-Host "  Deleted." -ForegroundColor Green
        }
    }

    # 2. Subscription scope ----------------------------------------------------
    Write-Section '2. Subscription scope'

    $standardPlans = Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard'
    if ($standardPlans) {
        Write-Host '  Defender plans at Standard:' -ForegroundColor Yellow
        foreach ($p in $standardPlans) {
            Write-Host "    $($p.Name)"
            if ($PSCmdlet.ShouldProcess($p.Name, 'Set Defender plan to Free')) {
                Set-AzSecurityPricing -Name $p.Name -PricingTier 'Free' | Out-Null
                Write-Host "      -> Free" -ForegroundColor Green
            }
        }
    } else {
        Write-Host '  No Defender plans at Standard.' -ForegroundColor DarkGray
    }

    $policies = Get-AzPolicyAssignment -Scope $SubScope |
        Where-Object { $_.Name -like "sc500-$LabId*" }
    foreach ($pol in $policies) {
        Write-Host "  Policy assignment: $($pol.Name)"
        if ($PSCmdlet.ShouldProcess($pol.Name, 'Remove policy assignment')) {
            Remove-AzPolicyAssignment -Id $pol.Id
            Write-Host '      removed' -ForegroundColor Green
        }
    }
    if (-not $policies) { Write-Host '  No matching policy assignments.' -ForegroundColor DarkGray }

    # Orphaned role assignments show an empty DisplayName: the principal or the
    # scope they referenced no longer resolves.
    $orphans = Get-AzRoleAssignment -Scope $SubScope |
        Where-Object { [string]::IsNullOrWhiteSpace($_.DisplayName) }
    if ($orphans) {
        Write-Host "  $($orphans.Count) orphaned role assignment(s):" -ForegroundColor Yellow
        foreach ($o in $orphans) {
            Write-Host "    $($o.RoleDefinitionName) -> $($o.ObjectId)"
            if ($PSCmdlet.ShouldProcess($o.RoleAssignmentId, 'Remove orphaned role assignment')) {
                Remove-AzRoleAssignment -ObjectId $o.ObjectId `
                                        -RoleDefinitionName $o.RoleDefinitionName `
                                        -Scope $o.Scope -ErrorAction SilentlyContinue
                Write-Host '      removed' -ForegroundColor Green
            }
        }
    } else {
        Write-Host '  No orphaned role assignments.' -ForegroundColor DarkGray
    }

    # 3. Directory scope - report only -----------------------------------------
    Write-Section '3. Directory scope (manual)'
    if (Get-Command Get-AzADApplication -ErrorAction SilentlyContinue) {
        $apps = Get-AzADApplication -DisplayNameStartsWith "sc500-$LabId" -ErrorAction SilentlyContinue
        if ($apps) {
            Write-Host '  App registrations to review and delete by hand:' -ForegroundColor Yellow
            $apps | ForEach-Object { Write-Host "    $($_.DisplayName)  $($_.AppId)" }
        } else {
            Write-Host '  No matching app registrations.' -ForegroundColor DarkGray
        }
    }
    Write-Host '  Conditional access policies are never auto-deleted. Disable, verify, then delete.' -ForegroundColor DarkGray

    # 4. Soft-deleted remains ---------------------------------------------------
    Write-Section '4. Soft-deleted remains'
    $deadVaults = Get-AzKeyVault -InRemovedState -ErrorAction SilentlyContinue |
        Where-Object VaultName -like "*sc500*$LabId*"
    if ($deadVaults) {
        foreach ($v in $deadVaults) {
            $pp = if ($v.PurgeProtectionEnabled) { ' PURGE PROTECTION ON - cannot purge' } else { '' }
            Write-Host "  $($v.VaultName)  deleted $($v.DeletionDate)$pp" -ForegroundColor Yellow
            if ($PurgeKeyVaults -and -not $v.PurgeProtectionEnabled) {
                if ($PSCmdlet.ShouldProcess($v.VaultName, 'Purge soft-deleted key vault')) {
                    Remove-AzKeyVault -VaultName $v.VaultName -Location $v.Location -InRemovedState -Force
                    Write-Host '      purged' -ForegroundColor Green
                }
            }
        }
        if (-not $PurgeKeyVaults) {
            Write-Host '  Re-run with -PurgeKeyVaults to free these names.' -ForegroundColor DarkGray
        }
    } else {
        Write-Host '  None.' -ForegroundColor DarkGray
    }
}

#endregion

#region ----------------------------------------------------------------- Sweep

Write-Section '6. Verification sweep'

$homeless = Get-AzResource -TagName 'sc500-module' -ErrorAction SilentlyContinue |
    Where-Object ResourceGroupName -notlike "$Prefix-*"
if ($homeless) {
    Write-Host "  $($homeless.Count) tagged resource(s) outside a lab resource group:" -ForegroundColor Yellow
    $homeless | ForEach-Object {
        Write-Host "    [$($_.Tags['sc500-module'])] $($_.ResourceType)  $($_.Name)  in $($_.ResourceGroupName)"
    }
} else {
    Write-Host '  No homeless tagged resources.' -ForegroundColor Green
}

$remainingPlans = Get-AzSecurityPricing | Where-Object PricingTier -eq 'Standard'
if ($remainingPlans) {
    Write-Host "  Defender plans still at Standard: $($remainingPlans.Name -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host '  All Defender plans at Free.' -ForegroundColor Green
}

$labRgs = Get-AzResourceGroup -Name "$Prefix-*" -ErrorAction SilentlyContinue
if ($labRgs) {
    Write-Host "  Lab resource groups still present: $($labRgs.ResourceGroupName -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host '  No lab resource groups remain.' -ForegroundColor Green
}

$runningVMs = Get-AzVM -Status -ErrorAction SilentlyContinue |
    Where-Object { $_.PowerState -eq 'VM running' }
if ($runningVMs) {
    Write-Host "  $($runningVMs.Count) VM(s) still running: $($runningVMs.Name -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host '  No running VMs.' -ForegroundColor Green
}

Write-Host "`nNot covered by this script - check by hand:" -ForegroundColor DarkGray
Write-Host '  PIM role deactivation, conditional access policies, OAuth consent grants,' -ForegroundColor DarkGray
Write-Host '  Sentinel workspace retention, Defender EASM inventory, Security Copilot SCUs.' -ForegroundColor DarkGray

#endregion
