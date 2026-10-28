#Requires -Version 7.0
<#
.SYNOPSIS
    Validates the SC-500 guide: structure, front matter, sections, links, quizzes.

.DESCRIPTION
    Replaces the original scaffold validator and closes the eight gaps logged in
    docs/CONTRIBUTING.md:

      1.  required sections in content files are now checked
      2.  lab files are schema-checked, not only for '## Teardown'
      3.  sub_objectives are diffed against docs/SKILLS-MEASURED-SNAPSHOT.md
      4.  quiz files are validated - JSON, verbatim sub_skill, answer ranges
      5.  manifest appendix paths are checked
      6.  paths are cross-platform (was Windows-only)
      7.  every module is checked for a lab and a quiz
      8.  orphan check - files on disk that no manifest entry references

    Also added: front matter vs body sub-objective list drift, and cost-level
    parity between a module's front matter and its lab header - both of which
    caught real defects when this was written.

    Beginner-first redesign (v3) checks:
      -   exam lessons carry the sixteen-section lesson anatomy, in order
      -   Module 0A primers carry the twelve-section primer anatomy, and
          supports_objectives names real objectives
      -   prerequisites name modules that exist (exam lessons, Module 0B, 0A)
      -   labs carry the lab anatomy, in order, ending in a Completion checklist
      -   every quiz question has a scenario clue, and why_not lines up with
          the options (null for correct answers, an explanation for wrong ones)
      -   content/comparisons.json: every option answers all nine questions,
          and every lesson and objective it names exists
      -   content/skills-measured.json matches the captured study guide
      -   content/cases.json and content/drills.json: every question joins to
          an official bullet by id and verbatim text, answers and why_not line
          up, conflict rules point at real options, evidence is labelled
          simplified, and every source is a Microsoft Learn URL

.PARAMETER Root
    Repository root. Defaults to the parent of the folder holding this script.

.PARAMETER CheckExternalLinks
    Also HEAD every learn.microsoft.com URL. Slow; run weekly, not per commit.

.PARAMETER StaleDays
    Warn when last_verified is older than this. Default 60.

.PARAMETER FailOn
    Error (default) or Warning. Controls the exit code, not the output.

.EXAMPLE
    .\tools\Test-GuideContent.ps1
.EXAMPLE
    .\tools\Test-GuideContent.ps1 -CheckExternalLinks -FailOn Warning
#>
[CmdletBinding()]
param(
    [string] $Root,
    [switch] $CheckExternalLinks,
    [int]    $StaleDays = 60,
    [ValidateSet('Error', 'Warning')]
    [string] $FailOn = 'Error'
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------- setup ----

if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = (Resolve-Path -LiteralPath $Root).Path

$script:Issues = [System.Collections.Generic.List[pscustomobject]]::new()

function Add-Issue {
    param(
        [ValidateSet('Error', 'Warning', 'Info')] [string] $Severity,
        [string] $File,
        [string] $Message
    )
    $script:Issues.Add([pscustomobject]@{
        Severity = $Severity
        File     = $File
        Message  = $Message
    })
}

# Always compare and display paths with forward slashes, whatever the OS.
function ConvertTo-RelPath {
    param([string] $Path)
    $full = [System.IO.Path]::GetFullPath($Path)
    $rel  = $full.Substring($Root.Length).TrimStart([char]'\', [char]'/')
    return $rel -replace '\\', '/'
}

function Join-RepoPath {
    param([string] $Relative)
    return [System.IO.Path]::GetFullPath(
        (Join-Path $Root ($Relative -replace '/', [System.IO.Path]::DirectorySeparatorChar)))
}

# ------------------------------------------------------- front matter ------

<#
    Deliberately small YAML reader. It implements exactly the subset the guide's
    schema uses, and mirrors assets/js/frontmatter.js. If one grows, grow both.
#>
function Read-FrontMatter {
    param([string] $Text)

    $m = [regex]::Match($Text, '(?s)^\uFEFF?---\r?\n(.*?)\r?\n---\r?\n')
    if (-not $m.Success) { return $null }

    $data = [ordered]@{}
    $key  = $null

    foreach ($line in ($m.Groups[1].Value -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -match '^\s*#') { continue }

        if ($line -match '^\s+-\s+(.*)$' -and $key) {
            if ($data[$key] -isnot [System.Collections.IList]) { $data[$key] = @() }
            $data[$key] += ($Matches[1].Trim() -replace '^"|"$', '')
            continue
        }

        if ($line -match '^([A-Za-z0-9_-]+)\s*:\s*(.*)$') {
            $key = $Matches[1]
            $raw = $Matches[2].Trim()
            if ($raw -eq '') {
                $data[$key] = @()
            }
            elseif ($raw.StartsWith('[')) {
                $inner = $raw.Trim('[', ']').Trim()
                $data[$key] = if ($inner) {
                    @($inner -split ',' | ForEach-Object { $_.Trim().Trim('"', "'") })
                } else { @() }
            }
            else {
                $data[$key] = $raw -replace '^"|"$', ''
            }
        }
    }

    return [pscustomobject]@{
        Data = $data
        Body = $Text.Substring($m.Length)
    }
}

function Get-Body {
    param([string] $Text)
    $fm = Read-FrontMatter $Text
    if ($fm) { return $fm.Body }
    return $Text
}

# Normalise whitespace so a wrapped bullet compares equal to a single line.
function ConvertTo-Norm {
    param([string] $Value)
    return ([regex]::Replace(($Value ?? ''), '\s+', ' ')).Trim().Trim('"')
}

# ------------------------------------------------------------ schema -------

$RequiredKeys = @(
    'objective', 'sub_objectives', 'domain', 'domain_weight', 'status',
    'prerequisites', 'ms_learn_source', 'product_docs', 'last_verified',
    'portal', 'powershell_module', 'az_cli_command', 'kql_tables', 'licensing',
    'azure_resources', 'lab_cost_estimate', 'free_practice_available',
    'forensic_relevance'
)
$ValidWeights = @('20-25%', '25-30%', 'n/a')
$ValidStatus  = @('GA', 'Preview')

# The lesson anatomy (docs/STYLE-GUIDE.md), in reading order: problem first,
# Microsoft's control in the middle, outcome validation and exam reasoning last.
$ContentSections = @(
    '## Sub-objectives covered', '## The security problem', '## In plain English',
    '## Words you need to know', '## Mental model', '## How it works under the hood',
    '## Why security cares', '## Configuration surface', '## Common failure modes',
    '## Hands-on', '## Validate the security outcome', '## How this is tested',
    '## Check yourself', '## Teach it back', '## Key takeaways', '## Sources'
)
# Module 0A foundation primers.
$PrimerSections = @(
    '## Why this matters for security', '## In plain English', '## Words you need to know',
    '## Mental model', '## Microsoft cloud translation', '## How it works',
    '## Why security cares', '## Common misunderstandings', '## Where SC-500 uses this',
    '## Teach it back', '## Key takeaways', '## Sources'
)
# Lab anatomy: understand -> implement -> observe -> validate -> explain -> clean up.
# '## Part 1' is checked separately; it sits between Prerequisites and Validation.
$LabSections = @(
    '## Why this lab matters', '## Architecture', '## Desired security outcome',
    '## Prerequisites', '## Validation', '## What just happened?', '## Limitations',
    '## Teardown', '## Completion'
)

# Required sections must exist AND appear in this order.
function Test-SectionOrder {
    param([string] $Body, [string[]] $Sections, [string] $Rel, [string] $Kind)
    $last = -1; $lastName = $null
    foreach ($sec in $Sections) {
        $m = [regex]::Match($Body, '(?m)^' + [regex]::Escape($sec) + '\s*$')
        if (-not $m.Success) {
            Add-Issue Error $Rel "Missing required $Kind section: $sec"
            continue
        }
        if ($m.Index -lt $last) {
            Add-Issue Error $Rel "$Kind section out of order: '$sec' appears before '$lastName'."
        }
        $last = $m.Index; $lastName = $sec
    }
}

# Mirrors SC500FrontMatter.costLevel in assets/js/frontmatter.js: read the
# LEADING token, because estimates routinely say "back to Free in teardown"
# later in the sentence and that must not downgrade a paid lab to $0.
function Get-CostLevel {
    param([string] $Estimate)
    $s = ($Estimate ?? '').ToLowerInvariant()
    if (-not $s) { return 'low' }
    $head = ($s -split '\s[-\u2013\u2014]\s|\.\s')[0]
    if ($head.Length -gt 40) { $head = $head.Substring(0, 40) }
    foreach ($pair in @(@('highest', 'max'), @('high', 'high'), @('medium', 'mid'), @('low', 'low'))) {
        if ($head.Contains($pair[0])) { return $pair[1] }
    }
    if ($head.Contains('$0') -or $head.Contains('free')) { return 'none' }
    foreach ($pair in @(@('highest', 'max'), @('high', 'high'), @('medium', 'mid'), @('low', 'low'))) {
        if ($s.Contains($pair[0])) { return $pair[1] }
    }
    if ($s.Contains('$0')) { return 'none' }
    return 'low'
}

# ---------------------------------------------------------- 1. manifest ----

$manifestPath = Join-RepoPath 'content/manifest.json'
$manifest = $null
$referenced = [System.Collections.Generic.HashSet[string]]::new()

if (-not (Test-Path -LiteralPath $manifestPath)) {
    Add-Issue Error 'content/manifest.json' 'Manifest not found - structure checks skipped.'
}
else {
    try { $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json }
    catch { Add-Issue Error 'content/manifest.json' "Invalid JSON: $($_.Exception.Message)" }
}

$modules = @()
$moduleIds = [System.Collections.Generic.HashSet[string]]::new()

if ($manifest) {
    foreach ($domain in $manifest.domains) {
        foreach ($mod in $domain.modules) {
            [void]$moduleIds.Add($mod.id)
            $modules += [pscustomobject]@{
                Id      = $mod.id
                Title   = $mod.title
                Weight  = $domain.weight
                Domain  = $domain
                Content = $mod.content
                Lab     = $mod.lab
            }

            foreach ($p in @($mod.content, $mod.lab)) {
                if (-not $p) { continue }
                [void]$referenced.Add(($p -replace '\\', '/'))
                if (-not (Test-Path -LiteralPath (Join-RepoPath $p))) {
                    Add-Issue Error 'content/manifest.json' "$($mod.id): file not found -> $p"
                }
            }
            if (-not $mod.lab -and $domain.weight -ne 'n/a') {
                Add-Issue Warning 'content/manifest.json' "$($mod.id): no lab declared."
            }
        }
    }

    # Gap 5: the original loop never walked the appendix array, which the site
    # navigation now depends on.
    foreach ($apx in $manifest.appendix) {
        if (-not $apx.content) {
            Add-Issue Error 'content/manifest.json' "Appendix entry '$($apx.title)' has no content path."
            continue
        }
        [void]$referenced.Add(($apx.content -replace '\\', '/'))
        if (-not (Test-Path -LiteralPath (Join-RepoPath $apx.content))) {
            Add-Issue Error 'content/manifest.json' "Appendix file not found -> $($apx.content)"
        }
    }
}

# --------------------------------------------------- collect the files -----

$contentDir = Join-RepoPath 'content'
$labsDir    = Join-RepoPath 'labs'

$contentFiles = @()
$labFiles     = @()
if (Test-Path -LiteralPath $contentDir) {
    $contentFiles = Get-ChildItem -LiteralPath $contentDir -Recurse -Filter *.md -File | Sort-Object FullName
}
if (Test-Path -LiteralPath $labsDir) {
    $labFiles = Get-ChildItem -LiteralPath $labsDir -Recurse -Filter *.md -File | Sort-Object FullName
}

# Gap 8: files on disk that no manifest entry references are unreachable pages.
if ($manifest) {
    foreach ($f in @($contentFiles + $labFiles)) {
        $rel = ConvertTo-RelPath $f.FullName
        if (-not $referenced.Contains($rel)) {
            Add-Issue Warning $rel 'Orphan: on disk but not referenced by content/manifest.json.'
        }
    }
}

# -------------------------------------------- objective ids (for primers) --

$skillsJsonPath = Join-RepoPath 'content/skills-measured.json'
$skillsJson = $null
$objectiveIds = [System.Collections.Generic.HashSet[string]]::new()
$bulletIds    = [System.Collections.Generic.HashSet[string]]::new()
if (-not (Test-Path -LiteralPath $skillsJsonPath)) {
    Add-Issue Error 'content/skills-measured.json' 'Not found - objective ids cannot be checked.'
}
else {
    try {
        $skillsJson = Get-Content -LiteralPath $skillsJsonPath -Raw | ConvertFrom-Json
        foreach ($sd in $skillsJson.domains) {
            foreach ($so in $sd.objectives) {
                [void]$objectiveIds.Add($so.id)
                foreach ($sb in $so.bullets) { [void]$bulletIds.Add($sb.id) }
            }
        }
    }
    catch { Add-Issue Error 'content/skills-measured.json' "Invalid JSON: $($_.Exception.Message)" }
}

# -------------------------------------------- 2/3. front matter, sections --

$allSubObjectives = [System.Collections.Generic.List[string]]::new()
$subOwner         = @{}
$moduleCost       = @{}

foreach ($f in $contentFiles) {
    $rel  = ConvertTo-RelPath $f.FullName
    $text = Get-Content -LiteralPath $f.FullName -Raw
    $fm   = Read-FrontMatter $text

    if (-not $fm) { Add-Issue Error $rel 'No YAML front matter.'; continue }

    $d = $fm.Data
    foreach ($k in $RequiredKeys) {
        if (-not $d.Contains($k)) { Add-Issue Error $rel "Missing front-matter key: $k" }
    }

    if ($d.domain_weight -notin $ValidWeights) {
        Add-Issue Error $rel "domain_weight invalid: '$($d.domain_weight)'"
    }
    if ($d.status -notin $ValidStatus) {
        Add-Issue Error $rel "status invalid: '$($d.status)' (expected GA or Preview)"
    }

    if ("$($d.last_verified)" -notmatch '^\d{4}-\d{2}-\d{2}$') {
        Add-Issue Error $rel "last_verified malformed: '$($d.last_verified)'"
    }
    else {
        $age = (New-TimeSpan -Start ([datetime]$d.last_verified) -End (Get-Date)).Days
        if ($age -gt $StaleDays) {
            Add-Issue Warning $rel "last_verified is $age days old - re-check the product docs."
        }
    }

    $isAppendix = $rel -like 'content/appendix/*'

    if ($isAppendix) {
        if ($fm.Body -notmatch '(?m)^## Sources\s*$') {
            Add-Issue Warning $rel 'Appendix has no Sources block.'
        }
        continue
    }

    $subs = @($d.sub_objectives)
    $isExamModule = $d.domain_weight -ne 'n/a'
    $isPrimer = $rel -like 'content/00a-foundations/*'

    # Prerequisites must name modules that exist - a typo here is a dead
    # "read this first" link on the lesson page.
    foreach ($pr in @($d.prerequisites)) {
        if ($pr -and $manifest -and -not $moduleIds.Contains($pr)) {
            Add-Issue Error $rel "Prerequisite '$pr' is not a module id in content/manifest.json."
        }
    }

    if ($isPrimer) {
        Test-SectionOrder $fm.Body $PrimerSections $rel 'primer'
        $sup = @($d.supports_objectives | Where-Object { $_ })
        if ($sup.Count -eq 0) {
            Add-Issue Error $rel 'Primer has no supports_objectives - every foundation must name the SC-500 objective it supports.'
        }
        foreach ($o in $sup) {
            if ($objectiveIds.Count -and -not $objectiveIds.Contains($o)) {
                Add-Issue Error $rel "supports_objectives '$o' is not an objective id in content/skills-measured.json."
            }
        }
        if ($subs.Count -gt 0) {
            Add-Issue Error $rel 'A primer must not claim sub_objectives - foundations support objectives, they do not own them.'
        }
        continue
    }

    # Gap 1: required sections were never checked.
    # The exam-module skeleton applies to exam modules only. Module 0 is a
    # project prerequisite with its own structure; holding it to the exam
    # skeleton produced 22 errors on every run and kept CI permanently red,
    # which made the gate useless for catching real regressions.
    if ($isExamModule) {
        Test-SectionOrder $fm.Body $ContentSections $rel 'lesson'
        if ($fm.Body -notmatch '\*\*AZ-500 divergence\.\*\*') {
            Add-Issue Warning $rel 'No AZ-500 divergence note in "How this is tested".'
        }
    }
    if ($isExamModule -and $subs.Count -eq 0) {
        Add-Issue Error $rel 'sub_objectives is empty on an exam module.'
    }

    $modId = if ($f.BaseName -match '^(\d{2}-\d{2}|0A-\d{2})') { $Matches[1] } else { $null }
    if ($modId) { $moduleCost[$modId] = Get-CostLevel $d.lab_cost_estimate }

    foreach ($s in $subs) {
        $n = ConvertTo-Norm $s
        # A Module 0 lesson may double as practice for an exam bullet (00-02
        # teaches PIM through the lab-access setup). Only a bullet claimed by
        # two EXAM modules is ambiguous ownership.
        if (-not $isExamModule) { $allSubObjectives.Add($n); continue }
        if ($subOwner.ContainsKey($n)) {
            Add-Issue Error $rel "Sub-objective also claimed by $($subOwner[$n]): $($n.Substring(0, [Math]::Min(70, $n.Length)))..."
        }
        else { $subOwner[$n] = $modId }
        $allSubObjectives.Add($n)
    }

    # Front matter and the visible list must agree - this caught a real drift.
    $vis = [regex]::Match($fm.Body, '(?s)## Sub-objectives covered\s*\r?\n\r?\n(.*?)\r?\n\r?\n')
    if ($vis.Success -and $subs.Count -gt 0) {
        $listed = @($vis.Groups[1].Value -split "`r?`n" |
            Where-Object { $_.StartsWith('- ') } |
            ForEach-Object { ConvertTo-Norm $_.Substring(2) })
        $fmNorm = @($subs | ForEach-Object { ConvertTo-Norm $_ })
        $diff = Compare-Object -ReferenceObject $fmNorm -DifferenceObject $listed
        if ($diff) {
            Add-Issue Error $rel 'sub_objectives front matter does not match the "## Sub-objectives covered" list.'
        }
    }
}

# Gap 2: labs were only checked for '## Teardown'.
foreach ($f in $labFiles) {
    $rel  = ConvertTo-RelPath $f.FullName
    $body = Get-Content -LiteralPath $f.FullName -Raw

    Test-SectionOrder $body $LabSections $rel 'lab'
    $p1 = [regex]::Match($body, '(?m)^## Part 1')
    if (-not $p1.Success) {
        Add-Issue Warning $rel 'No "## Part 1" - labs are expected to be structured in numbered parts.'
    }
    else {
        $pre = [regex]::Match($body, '(?m)^## Prerequisites\s*$')
        $val = [regex]::Match($body, '(?m)^## Validation\s*$')
        if (($pre.Success -and $p1.Index -lt $pre.Index) -or ($val.Success -and $p1.Index -gt $val.Index)) {
            Add-Issue Error $rel '"## Part 1" must sit between Prerequisites and Validation.'
        }
    }
    # The Completion checklist is what makes a lab count as practised: it
    # needs the outcome confirmation and the teardown confirmation.
    $comp = [regex]::Match($body, '(?s)(?m)^## Completion\s*$(.*)$')
    if ($comp.Success) {
        $boxes = [regex]::Matches($comp.Groups[1].Value, '(?m)^\s*- \[ \] ').Count
        if ($boxes -lt 2) {
            Add-Issue Error $rel "Completion has $boxes checkbox(es); expected the outcome and teardown confirmations."
        }
    }
    $outc = [regex]::Match($body, '(?s)(?m)^## Desired security outcome\s*$(.*?)^## ')
    if ($outc.Success -and [regex]::Matches($outc.Groups[1].Value, '(?m)^- ').Count -lt 2) {
        Add-Issue Warning $rel 'Desired security outcome lists fewer than two statements for Validation to prove.'
    }

    # Cost parity: the module's chip and the lab header must agree.
    $modId = if ($f.BaseName -match '^(\d{2}-\d{2}|0A-\d{2})') { $Matches[1] } else { $null }
    if ($modId -and $moduleCost.ContainsKey($modId)) {
        $hdr = [regex]::Match($body, '\*\*Estimated cost:\*\*(.*)')
        if (-not $hdr.Success) {
            Add-Issue Warning $rel 'Lab header has no "**Estimated cost:**" line.'
        }
        else {
            $labLevel = Get-CostLevel ($hdr.Groups[1].Value -replace '\*\*', '')
            if ($labLevel -ne $moduleCost[$modId]) {
                Add-Issue Error $rel "Cost level disagrees with the module: lab='$labLevel', module='$($moduleCost[$modId])'."
            }
        }
    }
}

# ---------------------------------------------- 4. skills-measured diff ----

$snapshotPath = Join-RepoPath 'docs/SKILLS-MEASURED-SNAPSHOT.md'
if (-not (Test-Path -LiteralPath $snapshotPath)) {
    Add-Issue Warning 'docs/SKILLS-MEASURED-SNAPSHOT.md' 'Snapshot missing - cannot diff sub-objectives against the exam outline.'
}
else {
    $snap = Get-Content -LiteralPath $snapshotPath -Raw
    $skills = [regex]::Match($snap, '(?s)## Skills measured(.*?)(?:\r?\n## |$)')
    if (-not $skills.Success) {
        Add-Issue Warning 'docs/SKILLS-MEASURED-SNAPSHOT.md' 'No "## Skills measured" section found - is this the markdown capture?'
    }
    else {
        # Bullets wrap across lines in the captured markdown; rejoin them first.
        $block = $skills.Groups[1].Value -replace '\r?\n(?!\s*[-#])', ' '
        # Only bullets under an objective ("#### ...") inside a weighted domain
        # ("### Name (20-25%)") are skills. The audience profile and "Skills at
        # a glance" are also bulleted, and counting them produced ten false
        # "not covered" errors. Mirrors parseSnapshot in assets/js/curriculum.js.
        $inDomain = $false; $inObjective = $false
        $live = [System.Collections.Generic.List[string]]::new()
        foreach ($line in ($block -split "`r?`n")) {
            if ($line -match '^###\s+.+\(\d+\s*[-\u2013]\s*\d+%\)\s*$') { $inDomain = $true; $inObjective = $false; continue }
            if ($line -match '^###\s') { $inDomain = $false; $inObjective = $false; continue }
            if ($line -match '^####\s') { $inObjective = $inDomain; continue }
            if ($inObjective -and $line -match '^\s*-\s+\S') {
                $n = ConvertTo-Norm ($line -replace '^\s*-\s+', '')
                if ($n.Length -gt 12) { $live.Add($n) }
            }
        }

        $liveSet = [System.Collections.Generic.HashSet[string]]::new(
            [string[]]$live, [System.StringComparer]::OrdinalIgnoreCase)
        $mineSet = [System.Collections.Generic.HashSet[string]]::new(
            [string[]]$allSubObjectives, [System.StringComparer]::OrdinalIgnoreCase)

        foreach ($s in $liveSet) {
            if (-not $mineSet.Contains($s)) {
                Add-Issue Error 'docs/SKILLS-MEASURED-SNAPSHOT.md' "Outline bullet not covered by any module: $s"
            }
        }
        foreach ($s in $mineSet) {
            if (-not $liveSet.Contains($s)) {
                Add-Issue Error 'content' "sub_objective is not in the captured outline (owner $($subOwner[$s])): $s"
            }
        }
        Add-Issue Info 'docs/SKILLS-MEASURED-SNAPSHOT.md' "Outline bullets: $($liveSet.Count); guide sub-objectives: $($mineSet.Count)."

        # The structured objective manifest must say exactly what the snapshot says.
        if ($skillsJson) {
            $jsonBullets = @($skillsJson.domains | ForEach-Object { $_.objectives } |
                ForEach-Object { $_.bullets } | ForEach-Object { ConvertTo-Norm $_.text })
            if ($jsonBullets.Count -ne $live.Count) {
                Add-Issue Error 'content/skills-measured.json' "Has $($jsonBullets.Count) bullets; the snapshot has $($live.Count). Regenerate it."
            }
            $jsonSet = [System.Collections.Generic.HashSet[string]]::new(
                [string[]]$jsonBullets, [System.StringComparer]::OrdinalIgnoreCase)
            foreach ($s in $liveSet) {
                if (-not $jsonSet.Contains($s)) {
                    Add-Issue Error 'content/skills-measured.json' "Snapshot bullet missing from the objective manifest: $s"
                }
            }
            foreach ($s in $jsonSet) {
                if (-not $liveSet.Contains($s)) {
                    Add-Issue Error 'content/skills-measured.json' "Objective manifest bullet is not in the snapshot: $s"
                }
            }
        }
    }
}

# --------------------------------------------------------- 6. quizzes ------

$quizDir = Join-RepoPath 'quizzes'
$quizzed = [System.Collections.Generic.HashSet[string]]::new()

if (Test-Path -LiteralPath $quizDir) {
    foreach ($qf in (Get-ChildItem -LiteralPath $quizDir -Filter *.json -File | Sort-Object Name)) {
        $rel = ConvertTo-RelPath $qf.FullName
        try { $q = Get-Content -LiteralPath $qf.FullName -Raw | ConvertFrom-Json }
        catch { Add-Issue Error $rel "Invalid JSON: $($_.Exception.Message)"; continue }

        if (-not $q.module) { Add-Issue Error $rel 'No "module" property.'; continue }
        [void]$quizzed.Add($q.module)

        $owned = @($subOwner.GetEnumerator() |
            Where-Object { $_.Value -eq $q.module } |
            ForEach-Object { $_.Key })

        if ($owned.Count -eq 0) {
            Add-Issue Error $rel "No content module matches module id '$($q.module)'."
            continue
        }

        $seenIds = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($item in $q.questions) {
            $qid = if ($item.id) { $item.id } else { '(no id)' }

            if (-not $seenIds.Add($qid)) { Add-Issue Error $rel "$qid : duplicate question id." }
            if (-not $item.prompt)       { Add-Issue Error $rel "$qid : no prompt." }
            if (-not $item.explanation)  { Add-Issue Warning $rel "$qid : no explanation." }

            $opts = @($item.options)
            if ($opts.Count -lt 3) { Add-Issue Error $rel "$qid : only $($opts.Count) options." }
            if (($opts | Select-Object -Unique).Count -ne $opts.Count) {
                Add-Issue Error $rel "$qid : duplicate option text."
            }

            foreach ($i in @($item.answer)) {
                # JSON integers deserialise as Int64 in PowerShell 7, so a type
                # test against [int] rejects every valid index. Coerce instead.
                $idx = $i -as [int]
                if ($null -eq $idx -or $idx -lt 0 -or $idx -ge $opts.Count) {
                    Add-Issue Error $rel "$qid : answer index '$i' out of range (0..$($opts.Count - 1))."
                }
            }

            # The join between a wrong answer and what to re-read.
            if ((ConvertTo-Norm $item.sub_skill) -notin $owned) {
                Add-Issue Error $rel "$qid : sub_skill is not a verbatim sub_objective of $($q.module)."
            }

            # Every answer explains the scenario clue that points to it.
            if (-not $item.scenario_clue) {
                Add-Issue Error $rel "$qid : no scenario_clue."
            }

            # why_not lines up with options: null for a correct answer, an
            # explanation for every wrong one.
            $answers = @($item.answer | ForEach-Object { $_ -as [int] })
            if ($null -ne $item.why_not) {
                $wn = @($item.why_not)
                if ($wn.Count -ne $opts.Count) {
                    Add-Issue Error $rel "$qid : why_not has $($wn.Count) entries for $($opts.Count) options."
                }
                else {
                    for ($k = 0; $k -lt $wn.Count; $k++) {
                        if ($k -in $answers -and $null -ne $wn[$k]) {
                            Add-Issue Error $rel "$qid : why_not[$k] explains a correct answer; it should be null."
                        }
                        if ($k -notin $answers -and -not $wn[$k]) {
                            Add-Issue Error $rel "$qid : why_not[$k] is empty for a wrong answer."
                        }
                    }
                }
            }
            else {
                Add-Issue Warning $rel "$qid : no why_not - learners are not told why the alternatives are wrong."
            }
        }
    }
}
else {
    Add-Issue Warning 'quizzes' 'No quizzes directory.'
}

foreach ($m in $modules) {
    if ($m.Weight -ne 'n/a' -and -not $quizzed.Contains($m.Id)) {
        Add-Issue Warning 'quizzes' "$($m.Id): no knowledge check."
    }
}

# ------------------------------------------------------ 8. comparisons -----

$cmpPath = Join-RepoPath 'content/comparisons.json'
$cmpFields = @('security_problem', 'purpose', 'layer', 'scope', 'when_to_use',
               'major_difference', 'limitation', 'dependency', 'validation')
if (-not (Test-Path -LiteralPath $cmpPath)) {
    Add-Issue Error 'content/comparisons.json' 'Not found - the comparison component has no data.'
}
else {
    $cmp = $null
    try { $cmp = Get-Content -LiteralPath $cmpPath -Raw | ConvertFrom-Json }
    catch { Add-Issue Error 'content/comparisons.json' "Invalid JSON: $($_.Exception.Message)" }
    if ($cmp) {
        $seenCmp = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($x in @($cmp.comparisons)) {
            $cid = if ($x.id) { $x.id } else { '(no id)' }
            if (-not $seenCmp.Add($cid)) { Add-Issue Error 'content/comparisons.json' "$cid : duplicate id." }
            foreach ($k in @('title', 'question', 'takeaway', 'trap')) {
                if (-not $x.$k) { Add-Issue Error 'content/comparisons.json' "$cid : no $k." }
            }
            if (@($x.clues).Count -lt 1) { Add-Issue Warning 'content/comparisons.json' "$cid : no scenario clues." }
            if (@($x.sources).Count -lt 1) { Add-Issue Warning 'content/comparisons.json' "$cid : no Microsoft Learn sources." }
            $opts = @($x.options)
            if ($opts.Count -lt 2) { Add-Issue Error 'content/comparisons.json' "$cid : fewer than two options." }
            foreach ($o in $opts) {
                foreach ($fld in $cmpFields) {
                    if (-not $o.$fld) { Add-Issue Error 'content/comparisons.json' "$cid / $($o.name) : '$fld' is empty." }
                }
            }
            foreach ($lid in @($x.lessons)) {
                if ($manifest -and -not $moduleIds.Contains($lid)) {
                    Add-Issue Error 'content/comparisons.json' "$cid : lesson '$lid' is not in the manifest."
                }
            }
            if (@($x.objectives).Count -eq 0) {
                Add-Issue Error 'content/comparisons.json' "$cid : maps to no official objective - comparisons must stay inside the exam scope."
            }
            foreach ($bid in @($x.objectives)) {
                if ($bulletIds.Count -and -not $bulletIds.Contains($bid)) {
                    Add-Issue Error 'content/comparisons.json' "$cid : objective '$bid' is not a bullet id in content/skills-measured.json."
                }
            }
        }
        Add-Issue Info 'content/comparisons.json' "Structured comparisons: $(@($cmp.comparisons).Count)."
    }
}

# ------------------------------------------- 9. case studies and drills ----
# Both join to the official outline on objective id AND verbatim bullet text,
# so a renamed bullet breaks loudly instead of silently unmapping.

$bulletText = @{}
if ($skillsJson) {
    foreach ($sd in $skillsJson.domains) { foreach ($so in $sd.objectives) {
        foreach ($sb in $so.bullets) { $bulletText[$sb.id] = ConvertTo-Norm $sb.text } } }
}

function Test-ObjectiveJoin {
    param([string] $File, [string] $Where, [string] $Objective, [string] $SubSkill)
    if (-not $bulletText.ContainsKey($Objective)) {
        Add-Issue Error $File "$Where : objective '$Objective' is not a bullet id in content/skills-measured.json."
    }
    elseif ((ConvertTo-Norm $SubSkill) -ne $bulletText[$Objective]) {
        Add-Issue Error $File "$Where : sub_skill is not the verbatim text of bullet $Objective."
    }
}

function Test-Choice {
    # options / answer / why_not alignment, shared by case and drill questions.
    param([string] $File, [string] $Where, $Item, [int[]] $Answers, [int] $MinOptions = 3)
    $opts = @($Item.options)
    if ($opts.Count -lt $MinOptions) { Add-Issue Error $File "$Where : only $($opts.Count) options." }
    if (($opts | Select-Object -Unique).Count -ne $opts.Count) { Add-Issue Error $File "$Where : duplicate option text." }
    foreach ($a in $Answers) {
        if ($a -lt 0 -or $a -ge $opts.Count) { Add-Issue Error $File "$Where : answer index $a out of range." }
    }
    $wn = @($Item.why_not)
    if ($wn.Count -ne $opts.Count) { Add-Issue Error $File "$Where : why_not has $($wn.Count) entries for $($opts.Count) options." }
    else {
        for ($k = 0; $k -lt $wn.Count; $k++) {
            if ($k -in $Answers -and $null -ne $wn[$k]) { Add-Issue Error $File "$Where : why_not[$k] explains a correct answer; it should be null." }
            if ($k -notin $Answers -and -not $wn[$k]) { Add-Issue Error $File "$Where : why_not[$k] is empty for a wrong answer." }
        }
    }
    if (-not $Item.explanation) { Add-Issue Error $File "$Where : no explanation." }
}

function Test-Sources {
    param([string] $File, [string] $Where, $Sources)
    if (@($Sources).Count -lt 1) { Add-Issue Error $File "$Where : no Microsoft Learn sources." }
    foreach ($u in @($Sources)) {
        if ($u -notmatch '^https://learn\.microsoft\.com/') { Add-Issue Error $File "$Where : source is not a Microsoft Learn URL: $u" }
    }
}

$casePath = Join-RepoPath 'content/cases.json'
if (Test-Path -LiteralPath $casePath) {
    $F = 'content/cases.json'
    $cj = $null
    try { $cj = Get-Content -LiteralPath $casePath -Raw | ConvertFrom-Json }
    catch { Add-Issue Error $F "Invalid JSON: $($_.Exception.Message)" }
    if ($cj) {
        $seenCase = [System.Collections.Generic.HashSet[string]]::new()
        $nq = 0
        foreach ($c in @($cj.cases)) {
            $cid = if ($c.id) { $c.id } else { '(no id)' }
            if (-not $seenCase.Add($cid)) { Add-Issue Error $F "$cid : duplicate case id." }
            foreach ($k in @('title', 'summary', 'overview')) { if (-not $c.$k) { Add-Issue Error $F "$cid : no $k." } }
            if (@($c.environment).Count -lt 1) { Add-Issue Error $F "$cid : no environment." }
            if (@($c.design).Count -lt 1) { Add-Issue Error $F "$cid : no reference design." }
            $reqIds = [System.Collections.Generic.HashSet[string]]::new()
            foreach ($r in @($c.requirements)) {
                $pair = @($r)
                if ($pair.Count -ne 2 -or -not $pair[1]) { Add-Issue Error $F "$cid : a requirement is not [id, text]." }
                elseif (-not $reqIds.Add($pair[0])) { Add-Issue Error $F "$cid : duplicate requirement $($pair[0])." }
            }
            $qById = @{}
            $usedReq = [System.Collections.Generic.HashSet[string]]::new()
            foreach ($q in @($c.questions)) {
                $nq++
                $w = "$cid/$($q.id)"
                if ($qById.ContainsKey($q.id)) { Add-Issue Error $F "$w : duplicate question id." }
                $qById[$q.id] = $q
                if (-not $q.prompt) { Add-Issue Error $F "$w : no prompt." }
                if (-not $q.scenario_clue) { Add-Issue Error $F "$w : no scenario_clue." }
                Test-ObjectiveJoin $F $w $q.objective $q.sub_skill
                if (@($q.requirements).Count -lt 1) { Add-Issue Error $F "$w : names no requirement." }
                foreach ($rid in @($q.requirements)) {
                    [void]$usedReq.Add($rid)
                    if (-not $reqIds.Contains($rid)) { Add-Issue Error $F "$w : requirement '$rid' is not in the case." }
                }
                switch ($q.type) {
                    'single' { Test-Choice $F $w $q @([int]$q.answer) }
                    'multi' {
                        $ans = @($q.answer | ForEach-Object { $_ -as [int] })
                        if ($ans.Count -ne ($q.choose -as [int]) -or $ans.Count -lt 2) { Add-Issue Error $F "$w : 'choose' must equal the number of answers (at least 2)." }
                        Test-Choice $F $w $q $ans
                    }
                    'dropdowns' {
                        if (@($q.slots).Count -lt 1) { Add-Issue Error $F "$w : no slots." }
                        if (-not $q.explanation) { Add-Issue Error $F "$w : no explanation." }
                        $si = 0
                        foreach ($sl in @($q.slots)) {
                            $so2 = @($sl.options); $sa = $sl.answer -as [int]
                            if (-not $sl.label) { Add-Issue Error $F "$w slot $si : no label." }
                            if ($so2.Count -lt 2) { Add-Issue Error $F "$w slot $si : fewer than two options." }
                            if ($null -eq $sa -or $sa -lt 0 -or $sa -ge $so2.Count) { Add-Issue Error $F "$w slot $si : answer out of range." }
                            if (-not $sl.why) { Add-Issue Error $F "$w slot $si : no 'why' - learners are not told why the alternatives are wrong." }
                            $si++
                        }
                    }
                    default { Add-Issue Error $F "$w : unknown type '$($q.type)'." }
                }
            }
            foreach ($rid in $reqIds) { if (-not $usedReq.Contains($rid)) { Add-Issue Warning $F "$cid : requirement $rid is not tested by any question." } }
            $ci = 0
            foreach ($cf in @($c.conflicts)) {
                if (-not $cf.message) { Add-Issue Error $F "$cid conflict $ci : no message." }
                foreach ($cond in @($cf.when)) {
                    $tq = $qById[$cond.q]
                    if (-not $tq) { Add-Issue Error $F "$cid conflict $ci : question '$($cond.q)' does not exist."; continue }
                    if ($null -ne $cond.slot) {
                        $sl = @($tq.slots)[[int]$cond.slot]
                        if (-not $sl -or [int]$cond.is -ge @($sl.options).Count) { Add-Issue Error $F "$cid conflict $ci : slot or option out of range on $($cond.q)." }
                    }
                    elseif ($null -ne $cond.has) { if ([int]$cond.has -ge @($tq.options).Count) { Add-Issue Error $F "$cid conflict $ci : option out of range on $($cond.q)." } }
                    elseif ($null -ne $cond.is) { if ([int]$cond.is -ge @($tq.options).Count) { Add-Issue Error $F "$cid conflict $ci : option out of range on $($cond.q)." } }
                    else { Add-Issue Error $F "$cid conflict $ci : condition on $($cond.q) has no is/has." }
                }
                $ci++
            }
            foreach ($lid in @($c.lessons)) { if ($manifest -and -not $moduleIds.Contains($lid)) { Add-Issue Error $F "$cid : lesson '$lid' is not in the manifest." } }
            Test-Sources $F $cid $c.sources
        }
        Add-Issue Info $F "Case studies: $(@($cj.cases).Count), questions: $nq."
    }
}
else { Add-Issue Warning 'content/cases.json' 'Not found - #/cases has no data.' }

$drillPath = Join-RepoPath 'content/drills.json'
if (Test-Path -LiteralPath $drillPath) {
    $F = 'content/drills.json'
    $dj = $null
    try { $dj = Get-Content -LiteralPath $drillPath -Raw | ConvertFrom-Json }
    catch { Add-Issue Error $F "Invalid JSON: $($_.Exception.Message)" }
    if ($dj) {
        $seenDrill = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($d in @($dj.drills)) {
            $did = if ($d.id) { $d.id } else { '(no id)' }
            if (-not $seenDrill.Add($did)) { Add-Issue Error $F "$did : duplicate drill id." }
            foreach ($k in @('title', 'takeaway')) { if (-not $d.$k) { Add-Issue Error $F "$did : no $k." } }
            if (-not $d.ticket -or -not $d.ticket.from -or -not $d.ticket.text) { Add-Issue Error $F "$did : ticket needs 'from' and 'text'." }
            Test-ObjectiveJoin $F $did $d.objective $d.sub_skill
            $arts = @{}
            foreach ($a in @($d.artifacts)) {
                if ($arts.ContainsKey($a.id)) { Add-Issue Error $F "$did : duplicate artifact id $($a.id)." }
                if (-not $a.title) { Add-Issue Error $F "$did/$($a.id) : no title." }
                # Evidence is teaching material, not a product screen: say so.
                if ($a.note -notin @('Simplified', 'Trimmed')) { Add-Issue Error $F "$did/$($a.id) : note must say Simplified or Trimmed." }
                if ($a.kind -eq 'table') {
                    $nc = @($a.columns).Count
                    $rows = @($a.rows)
                    foreach ($row in $rows) { if (@($row).Count -ne $nc) { Add-Issue Error $F "$did/$($a.id) : a row has $(@($row).Count) cells for $nc columns." } }
                    $arts[$a.id] = $rows.Count
                }
                elseif ($a.kind -eq 'log') { $arts[$a.id] = @($a.lines).Count }
                else { Add-Issue Error $F "$did/$($a.id) : unknown kind '$($a.kind)'." }
            }
            if (-not $d.proof -or @($d.proof.accept).Count -lt 1) { Add-Issue Error $F "$did : no accepted proof." }
            else {
                if (-not $d.proof.prompt -or -not $d.proof.explanation) { Add-Issue Error $F "$did : proof needs a prompt and an explanation." }
                foreach ($acc in @($d.proof.accept)) {
                    if (-not $arts.ContainsKey($acc.a)) { Add-Issue Error $F "$did : proof names artifact '$($acc.a)', which does not exist." }
                    elseif ([int]$acc.r -lt 0 -or [int]$acc.r -ge $arts[$acc.a]) { Add-Issue Error $F "$did : proof row $($acc.r) is out of range for $($acc.a)." }
                }
            }
            $ids = @($d.steps | ForEach-Object { $_.id }) -join ','
            if ($ids -ne 'cause,fix,validate') { Add-Issue Error $F "$did : steps must be cause, fix, validate in that order (found '$ids')." }
            foreach ($st in @($d.steps)) {
                if (-not $st.prompt) { Add-Issue Error $F "$did/$($st.id) : no prompt." }
                Test-Choice $F "$did/$($st.id)" $st @([int]$st.answer)
            }
            foreach ($lid in @($d.lessons)) { if ($manifest -and -not $moduleIds.Contains($lid)) { Add-Issue Error $F "$did : lesson '$lid' is not in the manifest." } }
            Test-Sources $F $did $d.sources
        }
        Add-Issue Info $F "Break-fix drills: $(@($dj.drills).Count)."
    }
}
else { Add-Issue Warning 'content/drills.json' 'Not found - #/drills has no data.' }

# ----------------------------------------------------------- 7. links ------

$onDisk = [System.Collections.Generic.HashSet[string]]::new(
    [string[]]@(@($contentFiles + $labFiles) | ForEach-Object { ConvertTo-RelPath $_.FullName }),
    [System.StringComparer]::OrdinalIgnoreCase)

$externals = [System.Collections.Generic.HashSet[string]]::new()

foreach ($f in @($contentFiles + $labFiles)) {
    $rel  = ConvertTo-RelPath $f.FullName
    $dir  = Split-Path -Parent $rel
    $text = Get-Content -LiteralPath $f.FullName -Raw

    foreach ($m in [regex]::Matches($text, '\[[^\]]*\]\(([^)\s]+)\)')) {
        $href = $m.Groups[1].Value
        if ($href -match '^(https?:|#|mailto:)') {
            if ($href -match '^https://learn\.microsoft\.com/') { [void]$externals.Add($href) }
            continue
        }
        $target = ($href -split '#')[0]
        if (-not $target) { continue }

        $combined = if ($dir) { "$dir/$target" } else { $target }
        $norm = ([System.IO.Path]::GetFullPath(
            (Join-Path $Root ($combined -replace '/', [System.IO.Path]::DirectorySeparatorChar))))
        $normRel = ConvertTo-RelPath $norm

        if ($normRel -like '*.md' -and -not $onDisk.Contains($normRel)) {
            if (-not (Test-Path -LiteralPath $norm)) {
                Add-Issue Error $rel "Unresolved internal link -> $href"
            }
        }
        elseif ($normRel -notlike '*.md' -and -not (Test-Path -LiteralPath $norm)) {
            Add-Issue Warning $rel "Link target not found -> $href"
        }
    }

    foreach ($m in [regex]::Matches($text, '<(https://learn\.microsoft\.com/[^>\s]+)>')) {
        [void]$externals.Add($m.Groups[1].Value)
    }
}

Add-Issue Info 'links' "Distinct learn.microsoft.com URLs cited: $($externals.Count)."

if ($CheckExternalLinks) {
    Write-Host "Checking $($externals.Count) external links..." -ForegroundColor DarkGray
    $n = 0
    foreach ($url in ($externals | Sort-Object)) {
        $n++
        Write-Progress -Activity 'External links' -Status $url -PercentComplete (100 * $n / $externals.Count)
        try {
            $r = Invoke-WebRequest -Uri $url -Method Head -MaximumRedirection 5 `
                                   -SkipHttpErrorCheck -TimeoutSec 20
            if ($r.StatusCode -ge 400) {
                Add-Issue Error 'links' "HTTP $($r.StatusCode) -> $url"
            }
        }
        catch {
            Add-Issue Warning 'links' "Unreachable ($($_.Exception.Message)) -> $url"
        }
    }
    Write-Progress -Activity 'External links' -Completed
}

# ----------------------------------------------------------- report --------

$errors   = @($script:Issues | Where-Object Severity -eq 'Error')
$warnings = @($script:Issues | Where-Object Severity -eq 'Warning')
$infos    = @($script:Issues | Where-Object Severity -eq 'Info')

Write-Host ''
Write-Host ('=' * 66)
Write-Host "  SC-500 guide validation" -ForegroundColor Cyan
Write-Host "  root: $Root"
Write-Host ('=' * 66)
Write-Host ("  content {0,-4} labs {1,-4} quizzes {2,-4} modules {3}" -f `
    $contentFiles.Count, $labFiles.Count, $quizzed.Count, $modules.Count)
Write-Host ("  sub-objectives {0}" -f $allSubObjectives.Count)
foreach ($i in $infos) { Write-Host "  $($i.Message)" -ForegroundColor DarkGray }
Write-Host ('=' * 66)

foreach ($group in @(
    @{ Name = 'ERROR';   Items = $errors;   Colour = 'Red' },
    @{ Name = 'WARNING'; Items = $warnings; Colour = 'Yellow' }
)) {
    Write-Host ''
    Write-Host "$($group.Name): $($group.Items.Count)" -ForegroundColor $group.Colour
    foreach ($g in ($group.Items | Group-Object File | Sort-Object Name)) {
        Write-Host "   $($g.Name)" -ForegroundColor Gray
        foreach ($i in $g.Group) { Write-Host "      $($i.Message)" }
    }
}

Write-Host ''
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host '  PASS - no issues.' -ForegroundColor Green
}
elseif ($errors.Count -eq 0) {
    Write-Host "  PASS with $($warnings.Count) warning(s)." -ForegroundColor Yellow
}
else {
    Write-Host "  FAIL - $($errors.Count) error(s), $($warnings.Count) warning(s)." -ForegroundColor Red
}
Write-Host ''

$exit = 0
if ($errors.Count -gt 0) { $exit = 1 }
elseif ($FailOn -eq 'Warning' -and $warnings.Count -gt 0) { $exit = 1 }
exit $exit
