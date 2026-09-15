# SC-500 Interactive Learning Guide — Proposed Repository Structure & Syllabus

**Source of record:** [Study guide for Exam SC-500: Implementing End-to-End Security Controls for Cloud and AI Workloads](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500)
**Page footer stamp:** Last updated 2026-05-13 · **Page metadata `updated_at`:** 2026-07-31T19:59Z
**Outline captured and verified:** 2026-09-15

---

## 0. Corrections to the build prompt

| Claim in prompt | Reality on the live page | Impact |
|---|---|---|
| "SC-500 is a newly-GA exam with a July 2026 general-availability date" | Correct. GA 21 July 2026; AZ-500 retired 31 August 2026 — **already retired as of today**. | AZ-500 supplementary material is now unmaintained. Treat it as archival, not "current-adjacent." |
| Implied AI security is a top-level domain | **AI security is a sub-section of Domain 3, "Secure compute"** — `Implement security for AI`, 11 bullets. | Domain 3 is the heaviest cluster (29 of 87 bullets) despite a 20–25% weight. Build order and file splits must reflect that. |
| "Use the full bullet-level outline already captured in this project's source material" | Project knowledge contains **four link lists and no captured outline.** | The outline below is now the captured artifact. It should be committed to the repo so drift is diffable. |
| Domain weights | Confirmed verbatim: 20–25 / 25–30 / 20–25 / 20–25. | No change. |

**Also worth flagging from the page itself:** Microsoft states most questions cover GA features but that Preview features may appear if commonly used. Several bullets in `Implement security for AI` (Entra Agent ID conditional access, Foundry agent guardrails, Defender for AI Service) sit on fast-moving surfaces. The `status:` field in the metadata schema is load-bearing for that cluster and must be re-checked per module at generation time, not once at scaffold time.

---

## 1. Structural decisions I made (flag any you disagree with)

### 1.1 Concept files and lab files are separate, paired documents
Your granularity rule was "one comprehensive file per objective/cluster, not per sub-bullet." I kept that unit — but split each unit into a **concept file** (`content/`) and a **lab file** (`labs/`).

Reason: `Implement security for Azure network services` is nine bullets. Dual-method (GUI + PowerShell) walkthroughs for nine bullets plus a teardown section in a single file produces a 2,000+ line document that is unreadable on a phone and unreviewable in a PR diff. The split is not per-sub-bullet fragmentation — it is separating *explanation* from *execution*, which is also how you'll actually use it (read once, run the lab many times).

Every `labs/*.md` file ends with a mandatory `## Teardown` section.

### 1.2 Four oversized clusters are split into two or three modules each
Strict one-file-per-cluster gives **12 modules for 87 bullets**. That produces four monsters (AI: 11 bullets, Networking: 9, App platform: 9, Sentinel: 10) sitting next to a 3-bullet file on databases. I split those four, giving **18 objective modules**. Nothing is split below the cluster level in the metadata — each split file carries the verbatim cluster heading as `objective:` and its subset of verbatim bullets as `sub_objectives:`.

**This is the one decision most worth your veto.** Say the word and the scaffold collapses back to 12.

### 1.3 Schema addition: `sub_objectives: []`
Required by 1.2. Without it, three files would share an identical `objective:` string and the validator couldn't distinguish them. Added between `objective` and `domain`.

### 1.4 GitHub Pages will not render your Markdown
`.nojekyll` at repo root disables the Jekyll pipeline — which means GitHub Pages serves `.md` files **as plain text**, not as HTML. A `.nojekyll` + raw-Markdown-tree site does not work as a readable site.

Three ways out:
- **(a) Runtime render — recommended.** `index.html` is a shell. Hash-router fetches the `.md` over `fetch()`, parses front matter, renders body. One vendored single-file Markdown parser in `assets/js/vendor/`. No npm at runtime, no build step, Markdown stays the source of record, and the front matter becomes a visible metadata panel — which is pedagogically useful, not just plumbing.
- (b) Author every module directly in HTML. Truly zero dependencies; miserable to write 18 modules in.
- (c) Author in Markdown, convert to HTML with a local script before commit. That is a build step, which you excluded.

I scaffolded for **(a)**. Note that "dependency-free" strictly read would mean hand-rolling a ~200-line Markdown subset renderer instead of vendoring one — viable, and I'll write it if you want the zero-third-party-code property. Also note local preview needs a local HTTP server (`python -m http.server`) because `fetch()` fails on `file://`.

### 1.5 Validator in PowerShell, not Node
You build in PowerShell (RAFT, MDETimelineTriage, Scope25.Purview). A Node validator adds a toolchain to this repo that exists nowhere else in your work, for a script that reads YAML and checks links. `tools/Test-GuideContent.ps1` it is.

### 1.6 KQL scope — your earlier decision mostly holds, with one exception
Dropping threat-hunting labs is correct: nothing in the outline tests hunting. But the Sentinel cluster does contain `Create custom log tables in the workspace to store ingested data` and `Query Microsoft Purview Audit in Defender XDR`, and DCR transformations use KQL. So modules 04-03 and 04-04 need a **minimal, ingestion-scoped** KQL section — not hunting, but not zero either. The `kql_tables:` field stays populated for those two modules only.

---

## 2. Cost reality check for Module 0

Module 0 is about budget guardrails, so it should name the actual traps. Three objectives in this exam are genuinely expensive to lab:

| Surface | Why it's a trap |
|---|---|
| **Microsoft Security Copilot** (04-05, 4 bullets) | Billed on **provisioned** Security Compute Units, hourly, whether or not you use them. Left running, this is the single largest cost item in the entire guide by an order of magnitude. Lab design must be: provision → execute → deprovision inside one session, with a hard budget alert. |
| **Azure Firewall** (02-04) | Hourly deployment charge plus data processing, independent of traffic. Standard/Premium SKU choice matters for the objective and for the bill. |
| **Defender plans** (multiple) | Defender for Servers P2, Databases, Storage, Containers, AI Service are per-resource/per-hour. Enabling at subscription scope for one lab silently bills every resource in scope. |

Recommendation: Module 0 sets a subscription budget with an **action group that disables Defender plans**, not just an email alert. Email alerts don't stop spend.

---

## 3. Proposed repository structure

```
sc-500-interactive-guide/
├── .nojekyll
├── .gitignore
├── LICENSE                          # code — MIT (see §5)
├── LICENSE-CONTENT                  # prose/labs — CC BY 4.0 (see §5)
├── README.md
├── index.html                       # app shell: sidebar, content pane, metadata panel
├── 404.html
│
├── assets/
│   ├── css/
│   │   ├── tokens.css               # colour, type scale, spacing tokens
│   │   ├── layout.css               # shell, sidebar, responsive breakpoints
│   │   └── components.css           # metadata panel, lab callouts, GUI/PS tabs, quiz, progress
│   ├── js/
│   │   ├── app.js                   # hash router + content loader
│   │   ├── frontmatter.js           # YAML front-matter subset parser
│   │   ├── nav.js                   # sidebar built from content/manifest.json
│   │   ├── tabs.js                  # GUI ⇄ PowerShell method switcher
│   │   ├── progress.js              # per-module completion (localStorage)
│   │   ├── quiz.js                  # self-check engine
│   │   ├── search.js                # client-side index over manifest + headings
│   │   └── vendor/
│   │       └── marked.min.js        # single vendored file, no npm at runtime
│   └── img/
│
├── content/                         # concept files — one per objective cluster (or split)
│   ├── manifest.json                # single source of truth for nav order + file map
│   │
│   ├── 00-lab-safety/
│   │   ├── 00-00-module-overview.md
│   │   ├── 00-01-cost-guardrails-and-budgets.md
│   │   ├── 00-02-pim-just-in-time-lab-access.md
│   │   └── 00-03-teardown-checklist-template.md
│   │
│   ├── 01-identity-access-governance/
│   │   ├── 01-01-entra-id-secure-access.md
│   │   ├── 01-02-key-vault-secrets-and-keys.md
│   │   └── 01-03-governance-and-regulatory-compliance.md
│   │
│   ├── 02-storage-databases-networking/
│   │   ├── 02-01-storage-account-security.md
│   │   ├── 02-02-database-security.md
│   │   ├── 02-03-network-segmentation-and-connectivity.md
│   │   └── 02-04-private-access-and-perimeter.md
│   │
│   ├── 03-secure-compute/
│   │   ├── 03-01-ai-data-exposure-and-purview-dspm.md
│   │   ├── 03-02-ai-agent-identity-and-governance.md
│   │   ├── 03-03-ai-platform-and-workload-protection.md
│   │   ├── 03-04-servers-and-virtual-machines.md
│   │   ├── 03-05-app-platform-containers.md
│   │   └── 03-06-app-platform-serverless-web-and-apis.md
│   │
│   ├── 04-security-posture/
│   │   ├── 04-01-defender-for-cloud-posture.md
│   │   ├── 04-02-sentinel-workspace-roles-and-content.md
│   │   ├── 04-03-sentinel-data-connectors-and-collection.md
│   │   ├── 04-04-sentinel-automation-retention-and-audit.md
│   │   └── 04-05-security-copilot.md
│   │
│   └── appendix/
│       ├── a1-powershell-and-graph-module-reference.md
│       ├── a2-licensing-and-lab-cost-matrix.md
│       ├── a3-glossary.md
│       ├── a4-exam-logistics-and-scoring.md
│       └── a5-az500-to-sc500-delta.md
│
├── labs/                            # mirrors content/; every file ends in ## Teardown
│   ├── 00-lab-safety/
│   │   └── 00-lab-environment-setup.md
│   ├── 01-identity-access-governance/
│   │   ├── 01-01-lab.md
│   │   ├── 01-02-lab.md
│   │   └── 01-03-lab.md
│   ├── 02-storage-databases-networking/
│   │   ├── 02-01-lab.md … 02-04-lab.md
│   ├── 03-secure-compute/
│   │   ├── 03-01-lab.md … 03-06-lab.md
│   └── 04-security-posture/
│       ├── 04-01-lab.md … 04-05-lab.md
│
├── scripts/                         # runnable .ps1 extracted from labs, so they can be linted
│   ├── 01-identity-access-governance/
│   ├── 02-storage-databases-networking/
│   ├── 03-secure-compute/
│   ├── 04-security-posture/
│   └── teardown/
│       └── Remove-LabResourceGroup.ps1
│
├── tools/
│   ├── Test-GuideContent.ps1        # front-matter schema, internal links, dead MS Learn links
│   ├── New-Module.ps1               # emits a new module from the schema template
│   └── schema/
│       └── frontmatter.schema.json
│
└── docs/
    ├── SKILLS-MEASURED-SNAPSHOT.md  # verbatim outline as captured 2026-09-15 (drift baseline)
    ├── SYLLABUS.md                  # the table in §4 below
    ├── STYLE-GUIDE.md               # analogy policy, GUI/PS parity rules, verbatim-quoting rules
    └── CONTRIBUTING.md
```

---

## 4. Syllabus mapping — objective → file → domain → weight

Objectives are the verbatim second-level headings from the Microsoft outline. Bullet counts are the verbatim sub-bullets assigned to each file.

### Module 0 — Lab Safety & Environment Setup *(project prerequisite, not an exam domain)*

| Module | File | Purpose | Bullets |
|---|---|---|---|
| 00-00 | `00-00-module-overview.md` | Tenant/subscription topology, naming convention, lab RG pattern | — |
| 00-01 | `00-01-cost-guardrails-and-budgets.md` | Budget + action group that disables Defender plans; runs before any other lab | — |
| 00-02 | `00-02-pim-just-in-time-lab-access.md` | No standing Global Admin; PIM activation for lab work — doubles as practice for 01-01 | — |
| 00-03 | `00-03-teardown-checklist-template.md` | Reusable teardown template inherited by every lab | — |

### Domain 1 — Manage identity, access, and governance · **20–25%**

| Objective (verbatim) | File | Bullets |
|---|---|---|
| Secure access to resources by using Microsoft Entra ID | `01-01-entra-id-secure-access.md` | 6 |
| Secure secrets and keys by using Azure Key Vault | `01-02-key-vault-secrets-and-keys.md` | 7 |
| Implement governance to enforce security and regulatory compliance | `01-03-governance-and-regulatory-compliance.md` | 9 |

### Domain 2 — Secure storage, databases, and networking · **25–30%**

| Objective (verbatim) | File | Bullets |
|---|---|---|
| Implement security for storage accounts | `02-01-storage-account-security.md` | 4 |
| Implement security for databases | `02-02-database-security.md` | 3 |
| Implement security for Azure network services *(split 1 of 2 — segmentation & connectivity: NSG/ASG, Virtual Network Manager, Virtual WAN, VPN)* | `02-03-network-segmentation-and-connectivity.md` | 4 |
| Implement security for Azure network services *(split 2 of 2 — private access & perimeter: Entra Private Access, private endpoints, Private Link, Azure Firewall, Network Watcher)* | `02-04-private-access-and-perimeter.md` | 5 |

### Domain 3 — Secure compute · **20–25%** *(29 bullets — heaviest cluster)*

| Objective (verbatim) | File | Bullets |
|---|---|---|
| Implement security for AI *(split 1 of 3 — data exposure: SharePoint overexposure, Copilot/AI-app risk via Purview DSPM)* | `03-01-ai-data-exposure-and-purview-dspm.md` | 2 |
| Implement security for AI *(split 2 of 3 — agent identity: Copilot Studio real-time protection, Entra Agent ID conditional access + access management, blast radius via Defender XDR, agents in M365 admin center)* | `03-02-ai-agent-identity-and-governance.md` | 5 |
| Implement security for AI *(split 3 of 3 — platform: AI Gateway in APIM for Foundry, Foundry agent guardrails, Defender for AI Service, Data and AI security dashboard)* | `03-03-ai-platform-and-workload-protection.md` | 4 |
| Implement security for servers and virtual machines (VMs) | `03-04-servers-and-virtual-machines.md` | 9 |
| Implement security for application platform services *(split 1 of 2 — containers: Defender for Containers, AKS, ACR, Container Instances/Container Apps)* | `03-05-app-platform-containers.md` | 4 |
| Implement security for application platform services *(split 2 of 2 — Functions, Logic Apps, App Service, Web Application Firewall, API Management back-end protection)* | `03-06-app-platform-serverless-web-and-apis.md` | 5 |

### Domain 4 — Manage and monitor security posture · **20–25%**

| Objective (verbatim) | File | Bullets |
|---|---|---|
| Manage security posture by using Defender for Cloud | `04-01-defender-for-cloud-posture.md` | 6 |
| Implement activity and event collection in Microsoft Sentinel *(split 1 of 3 — workspaces, roles, content hub)* | `04-02-sentinel-workspace-roles-and-content.md` | 3 |
| Implement activity and event collection in Microsoft Sentinel *(split 2 of 3 — Microsoft data connectors, syslog/CEF, Windows Security events via DCR + WEF, custom log tables)* | `04-03-sentinel-data-connectors-and-collection.md` | 4 |
| Implement activity and event collection in Microsoft Sentinel *(split 3 of 3 — automation rules and playbooks, data retention, querying Purview Audit in Defender XDR)* | `04-04-sentinel-automation-retention-and-audit.md` | 3 |
| Implement Microsoft Security Copilot | `04-05-security-copilot.md` | 4 |

**Totals:** 4 domains · 12 official objective clusters · 18 objective modules · 87 verbatim sub-bullets · 4 Module 0 files · 5 appendices.

Bullet reconciliation: D1 = 6+7+9 = 22 · D2 = 4+3+4+5 = 16 · D3 = 2+5+4+9+4+5 = 29 · D4 = 6+3+4+3+4 = 20 · **87**.

---

## 5. Configuration — still needs your answer

| Setting | What I scaffolded as default | Needs you |
|---|---|---|
| Repo name | **Confirmed:** `IronBranded/SC500-Academy` — now the script default | Done |
| Visibility | Public | Confirm |
| **License** | **MIT for code + CC BY 4.0 for content** | Your prompt listed the license as "IronBranded" — that's your handle, not a license. Attribution ≠ licence terms. A public study guide with no licence is technically all-rights-reserved and nobody can fork it. Pick, or take the dual default. |
| Repo creation | **Confirmed.** Script creates the repo if missing, pushes, and enables Pages — all from PowerShell over the GitHub REST API. No `gh` dependency (it will borrow `gh auth token` if present, but a PAT in `-GitHubToken` or `$env:GITHUB_TOKEN` is enough). `-LocalOnly` opts out. | Token needs Contents + Administration + Pages write |
| Pages source | Repo root `/` on `main`, `.nojekyll` present | Confirm |
| Default branch | `main` | Confirm |
| Granularity | 18 modules (§1.2) | Confirm, or collapse to 12 |
| `forensic_relevance` | Lightweight cross-reference note only, as you specified | Confirm it stays a note and not a second content track |

---

## 6. Suggested build order once approved

Not domain order. Dependency and cost order:

1. **Module 0** — must exist before any resource is created.
2. **01-01, 01-03** — PIM and RBAC gate every later lab's access model.
3. **04-01** — Defender for Cloud posture, because enabling plans is the precondition for Defender for Storage/Databases/Servers/Containers/AI labs downstream.
4. **02-xx** — storage, databases, networking.
5. **03-04 → 03-06** — compute and app platform.
6. **03-01 → 03-03** — AI security last, because it is the most Preview-volatile content and will need the least re-verification lag between writing and your exam date.
7. **04-02 → 04-05** — Sentinel and Security Copilot; Copilot last because it is the most expensive to lab and the shortest cluster.
