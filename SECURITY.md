# Security policy

SC500 Academy is a static study site and a set of lab instructions. It has no server
and no user accounts, and it stores progress only in your browser. The realistic
security problems are therefore of three kinds, and all three are in scope.

## In scope

- **Lab instructions that leave something unsafe behind.** Examples: a step that
  creates public access, standing privileged access or an open management port that
  teardown does not remove, or a teardown that misses a billable resource. Given how
  the labs are used, these are the most important reports.
- **The site itself.** Script injection through rendered content, the service worker
  serving something it should not, or a way for one learner's data to reach another.
- **The repository's automation.** The workflows in `.github/workflows/`, including
  the dependencies they install.

## Out of scope

- **Vulnerabilities in Microsoft products.** Report these to the Microsoft Security
  Response Center at <https://msrc.microsoft.com/>, not here.
- **Your own lab tenant's configuration**, beyond what the lab instructions tell you
  to do.

## How to report

Use GitHub's **private vulnerability reporting**: the repository's *Security* tab,
then *Report a vulnerability*, if it is enabled. Otherwise, open an issue that says
only that you have a security report and would like a private channel. Do not post
details in the issue.

Please include:

- the lab step or site route involved;
- what it leaves exposed, or what an attacker could do;
- how to reproduce it.

**Never include tenant IDs, subscription IDs, secrets, keys or tokens.** Redact them
even from screenshots.

## What happens next

- **Lab-safety reports** get the affected lab corrected, and its teardown re-tested,
  before anything else is worked on.
- **Site reports** get a fix, and a `CACHE_VERSION` bump in `sw.js` so returning
  visitors receive it.

There is no bounty. The maintainer credits reporters in `CHANGELOG.md` unless you
ask not to be named.
