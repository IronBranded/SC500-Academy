#Requires -Version 7.0
<#
.SYNOPSIS
    Regenerates content/skills-measured.json from docs/SKILLS-MEASURED-SNAPSHOT.md.

.DESCRIPTION
    The snapshot is Microsoft's study guide captured as markdown. This script turns
    its "## Skills measured" section into the structured objective manifest the
    site and the validator read: domains, objectives and bullets, verbatim, with
    positional ids (domain.objective.bullet) that the Academy assigns - Microsoft
    does not number them.

    Run it after replacing the snapshot, then run tools/Test-GuideContent.ps1 to see
    what the change affects. See docs/OBJECTIVE-VALIDATION.md section 7.

.PARAMETER Root
    Repository root. Defaults to the parent of the folder holding this script.

.PARAMETER Retrieved
    The date the snapshot was retrieved (yyyy-MM-dd). Defaults to today.

.EXAMPLE
    ./tools/Update-SkillsManifest.ps1
#>
[CmdletBinding()]
param(
    [string] $Root,
    [string] $Retrieved = (Get-Date -Format 'yyyy-MM-dd')
)

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }

$snapPath = Join-Path $Root 'docs/SKILLS-MEASURED-SNAPSHOT.md'
$outPath  = Join-Path $Root 'content/skills-measured.json'
$text = Get-Content -LiteralPath $snapPath -Raw

function Get-Meta([string] $Key) {
    $m = [regex]::Match($text, '(?m)^' + [regex]::Escape($Key) + ':\s*(\S+)')
    if ($m.Success) { return $m.Groups[1].Value } else { return $null }
}

$section = [regex]::Match($text, '(?s)## Skills measured(.*?)## Study resources')
if (-not $section.Success) { throw 'No "## Skills measured" ... "## Study resources" section in the snapshot.' }

$domains = [System.Collections.Generic.List[object]]::new()
$domain = $null; $objective = $null

foreach ($line in ($section.Groups[1].Value -split "`r?`n")) {
    if ($line -match '^### (.+?) \((\d+)[–-](\d+)%\)\s*$') {
        $domain = [ordered]@{
            id         = [string]($domains.Count + 1)
            name       = $Matches[1]
            weight     = "$($Matches[2])$([char]0x2013)$($Matches[3])%"
            objectives = [System.Collections.Generic.List[object]]::new()
        }
        $domains.Add($domain); $objective = $null; continue
    }
    if ($line -match '^### ') { $domain = $null; $objective = $null; continue }
    if ($line -match '^#### (.+)$' -and $domain) {
        $objective = [ordered]@{
            id      = "$($domain.id).$($domain.objectives.Count + 1)"
            name    = $Matches[1].Trim()
            bullets = [System.Collections.Generic.List[object]]::new()
        }
        $domain.objectives.Add($objective); continue
    }
    if ($line -match '^- (.+)$' -and $objective) {
        $objective.bullets.Add([ordered]@{
            id   = "$($objective.id).$($objective.bullets.Count + 1)"
            text = $Matches[1].Trim()
        })
    }
}

$count = ($domains | ForEach-Object { $_.objectives } | ForEach-Object { $_.bullets.Count } | Measure-Object -Sum).Sum
if ($domains.Count -eq 0 -or $count -eq 0) { throw 'Parsed no domains or bullets - has the page shape changed?' }

$out = [ordered]@{
    schema                = 1
    exam                  = 'SC-500'
    title                 = 'Implementing End-to-End Security Controls for Cloud and AI Workloads'
    source                = 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500'
    snapshot              = 'docs/SKILLS-MEASURED-SNAPSHOT.md'
    skills_measured_as_of = ((Get-Meta 'ms.date') -replace 'T.*$', '')
    source_updated_at     = (Get-Meta 'updated_at')
    source_git_commit     = (Get-Meta 'git_commit_id')
    retrieved             = $Retrieved
    note                  = 'Bullet ids are positional (domain.objective.bullet) and assigned by the Academy; Microsoft does not number bullets. Regenerate from the snapshot when the study guide changes.'
    domains               = $domains
}

$json = $out | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($outPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outPath - $($domains.Count) domains, $count bullets."
