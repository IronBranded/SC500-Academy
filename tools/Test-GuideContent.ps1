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