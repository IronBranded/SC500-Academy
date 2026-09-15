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

Skills-measured outline captured 2026-09-15 from <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>.
The verbatim snapshot lives in `docs/SKILLS-MEASURED-SNAPSHOT.md` so outline drift is diffable.

## Start here

**`content/00-lab-safety/`** - budget guardrails and PIM-based just-in-time lab access.
Run Module 0 before creating any billable resource. Several objectives in this guide
(Security Copilot, Azure Firewall, Defender for Servers, AKS) bill hourly whether or
not you use them.

Every lab file ends with a mandatory `## Teardown` section. Use it.

## Local preview

The site fetches Markdown at runtime, so `file://` will not work. Serve it:

```
python -m http.server 8080
```

Then open <http://localhost:8080>.

## Validate before committing

```powershell
.\tools\Test-GuideContent.ps1 -CheckExternalLinks
```

## Licence

MIT for code (scripts, tooling, site) / CC BY 4.0 for prose and labs

Maintained by IronBranded.