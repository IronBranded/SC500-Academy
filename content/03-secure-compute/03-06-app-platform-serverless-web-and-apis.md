---
objective: "Implement security for application platform services"
sub_objectives:
  - "Implement and configure security controls for Azure Functions, including authentication and network access"
  - "Implement and configure security controls for Azure Logic Apps"
  - "Implement and configure security controls for Azure App Service"
  - "Implement and configure Azure Web Application Firewall"
  - "Implement security policies for back-end API protection by using API Management"
domain: "Secure compute"
domain_weight: "20-25%"
status: GA
prerequisites: ["00-00", "00-01", "00-02", "01-01", "01-02", "02-04", "03-03"]
ms_learn_source: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500"
product_docs:
  - "https://learn.microsoft.com/azure/frontdoor/web-application-firewall"
  - "https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-waf-faq"
  - "https://learn.microsoft.com/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules"
  - "https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities"
last_verified: "2026-09-17"
portal: "Azure portal > App Services / Function App / Logic apps / Front Door and WAF / API Management"
powershell_module: "Az.Websites, Az.Functions, Az.Network, Az.ApiManagement"
az_cli_command: "az webapp config set --https-only true"
kql_tables:
  - "AzureDiagnostics"
licensing: "None beyond an Azure subscription. Application Gateway WAF v2 and Front Door Premium both carry substantial hourly or monthly charges."
azure_resources: ["Microsoft.Web/sites", "Microsoft.Logic/workflows", "Microsoft.Network/applicationGateways", "Microsoft.ApiManagement/service"]
lab_cost_estimate: "Medium - App Service Basic is cents per hour and Functions on consumption is near-free, but Application Gateway WAF v2 bills hourly plus capacity units, and Front Door Premium is billed monthly at a level that does not suit a self-funded lab."
free_practice_available: false
forensic_relevance: "A WAF in detection mode is one of the better sources of pre-attack evidence available - it records what was attempted even when nothing was blocked, which makes it the closest thing to a reconnaissance log for a web application. API Management sits in the same position for APIs. On the application side, the artifact that matters most is usually negative: App Service and Functions access keys carry no identity, so a request authenticated with one cannot be attributed to a person."
---

# Serverless, Web, and API Security

> **Objective:** Implement security for application platform services
> **Domain:** Secure compute (20-25%)

## Sub-objectives covered

- Implement and configure security controls for Azure Functions, including authentication and network access
- Implement and configure security controls for Azure Logic Apps
- Implement and configure security controls for Azure App Service
- Implement and configure Azure Web Application Firewall
- Implement security policies for back-end API protection by using API Management

## Why this exists

Platform as a service removes the machine. There is no OS to patch, no port to close, no
agent to install - and that genuinely removes a whole category of risk from 03-04.

What it does not remove is the application, and it introduces a problem that a VM never had:
**a PaaS application is publicly addressable the moment it exists.** An App Service gets a
DNS name on the internet before you deploy any code to it. A Function gets an HTTP trigger
endpoint. A Logic App gets a callback URL. None of that required a decision, a public IP, or
a network security group.

So the questions change:

| On a VM | On PaaS |
| --- | --- |
| Which ports are open? | Who is allowed to call this endpoint? |
| Is the OS patched? | Is the request itself malicious? |
| Who can log in? | What is the app's own identity when it calls something else? |

Which gives the five bullets their structure:

- **Who may call it** - access restrictions, private endpoints, App Service authentication
- **Is the call itself an attack** - Web Application Firewall
- **Is the API being used the way it was intended** - API Management policies
- **What does the app use to call other things** - managed identity, Key Vault references
- **What about workflows specifically** - Logic Apps, where the trigger *is* the endpoint

## How it works under the hood

### App Service and Functions

They share a platform, so they share controls. The ones that matter:

**App Service authentication ("Easy Auth")** is a platform feature that sits in front of your
code. Enable it and the platform validates tokens - from Microsoft Entra ID or another
provider - before the request reaches the application. Unauthenticated requests can be
redirected to sign in or rejected outright. The important property: **the application does not
implement this and cannot accidentally bypass it**, because it runs in the platform's request
pipeline, not in your process.

**Access restrictions** are an allow/deny list evaluated on the inbound request: IP ranges,
service tags, and rules based on the virtual network. There are **two separate sites** to
protect and this is a favourite exam trap - the application itself, and the **SCM/Kudu
advanced tools site** that carries deployment and console access. Restricting one does not
restrict the other; the SCM site has its own rule set, with an option to inherit the main
site's rules.

**Private endpoints** remove public reachability entirely, as in 02-04. **Virtual network
integration** is the opposite direction - it governs the app's *outbound* traffic into your
network. People conflate them constantly: inbound is the private endpoint, outbound is VNet
integration.

**Transport and deployment hardening**: HTTPS-only, a minimum TLS version, **FTPS-only or FTP
disabled entirely**, and client certificate requirements where mutual TLS is wanted.

**Identity**: the app should hold a **managed identity** and read secrets through **Key Vault
references**, so configuration contains a reference rather than a value - the 01-01 and 01-02
argument, applied to app settings.

**Functions adds one thing of its own: access keys.** An HTTP-triggered function has an
authorization level - anonymous, function, or admin - and the non-anonymous levels are
satisfied by a **key in the query string or a header**. A function key is a bearer credential
with no identity attached, no expiry, and it frequently ends up in a URL, in a log, in a
browser history. It is the SAS token problem from 02-01 in a new place. Where the caller can
hold an Entra identity, use Easy Auth or API Management in front instead, and reserve keys for
cases with no alternative.

**Defender for App Service** is the workload protection plan covering this family, detecting
attacks against the app and suspicious behaviour on the underlying compute.

### Logic Apps

A workflow's trigger is its attack surface, and the request trigger is the sharp case: it
produces a **callback URL containing a shared access signature**. Anyone with the URL can fire
the workflow. Mitigations, in increasing strength: IP range restrictions on the trigger,
**Microsoft Entra OAuth validation** on request triggers, and putting **API Management or a
gateway in front** so the callback URL is never the public entry point.

Beyond the trigger:

- **Managed identity** for connections to Azure resources, instead of connection strings stored
  in the workflow's API connections
- **Secure inputs and outputs**, which suppress sensitive parameter values from run history -
  worth knowing because run history is otherwise readable by anyone who can view the workflow
- **Standard** workflows run on the App Service platform, which means every App Service control
  above applies to them, including private endpoints and VNet integration

### Web Application Firewall

The WAF is a set of rules evaluated against HTTP requests, and it exists in two places:

| | Application Gateway WAF | Front Door WAF |
| --- | --- | --- |
| Scope | Regional, in your virtual network | Global, at the edge |
| Managed rules | **DRS 2.1**, or OWASP **CRS 3.2 / 3.1** and older | **DRS**, plus the **Bot Manager rule set** |
| Tier requirement | WAF v2 | **Premium** for managed rules |
| Rate limiting | - | Custom rules |

**Modes, and the sentence that decides exam answers:** a WAF policy **starts in Detection
mode**, which logs what it would have done and **blocks nothing**. You tune in detection mode -
adding exclusions, disabling rules that fire on legitimate traffic - and then switch to
**Prevention mode**. Microsoft's own guidance is blunt: detection mode provides no protection.
A question describing a WAF that "is configured but attacks are still succeeding" is usually
describing detection mode.

**Managed rule sets** are Azure-maintained and updated as new attack signatures appear. The
Default Rule Set covers cross-site scripting, SQL injection, remote command execution, remote
and local file inclusion, PHP and Java attacks, session fixation, and protocol attacks - and
includes the **Microsoft Threat Intelligence Collection** rules written with the threat
intelligence team for additional coverage and fewer false positives.

**Tuning** has three tools and you should be able to pick between them:

- **Exclusions** - omit specific request attributes from evaluation. The canonical example is
  an authentication token in a header, which looks like an injection payload to a generic rule.
  Exclusions can apply to one rule, a rule group, or the whole rule set.
- **Disabling individual rules** - blunter; the rule stops applying to everything.
- **Custom rules** - your own conditions and actions, evaluated by priority, including IP
  restrictions and rate limiting.

One operational trap worth memorising: **changing rule set version resets every enabled and
disabled rule customisation to the defaults of the new version.** Your tuning does not migrate.

**Bot protection** categorises traffic as good, bad, or unknown bots, with signatures managed
and updated by the platform - so search engine crawlers pass while bad bots are blocked.

### API Management for back-end protection

API Management is the same chokepoint idea as the AI gateway in 03-03, applied to ordinary
APIs. The policies that matter for this objective:

| Policy area | What it does |
| --- | --- |
| **Subscription keys** | Per-consumer identification, revocable independently |
| **`validate-jwt`** | Verify an Entra (or other) token at the gateway - issuer, audience, claims, required scopes - **before** the request reaches the backend |
| **Rate limiting and quotas** | Per consumer, by calls or bandwidth, over a period |
| **IP filtering** | Allow or deny by address at the gateway |
| **Mutual TLS** | Client certificate validation |
| **Backend credentials and named values** | The gateway holds the backend credential, backed by **Key Vault**; consumers never see it |
| **CORS, header and payload policies** | Remove backend-revealing headers, enforce schemas |

The architectural point: **the backend should accept traffic only from API Management.** If the
backend is directly reachable, every policy above is optional from an attacker's point of
view. Private endpoints, access restrictions, or an internal-mode gateway are what make the
gateway the only path.

And note how APIM and WAF layer: **WAF inspects the request for attacks; API Management
decides whether this caller is allowed to make this call at this rate.** They are commonly
deployed together, with the WAF in front.

## Configuration surface

| Control | Default | Set it to | Why |
| --- | --- | --- | --- |
| HTTPS only | Off on older apps | On | Explicit and auditable |
| Minimum TLS version | varies | 1.2 or higher | Same |
| FTP/FTPS deployment | FTP allowed | Disabled, or FTPS only | A credentialled write path to your app |
| App Service authentication | Off | On, with Entra | Platform-enforced, cannot be bypassed by the app |
| Access restrictions - main site | Allow all | Explicit allow list | Publicly addressable by default |
| Access restrictions - **SCM site** | inherits or allows all | **Restricted separately** | Deployment and console access |
| Private endpoint | none | Where the app should not be public | Inbound |
| VNet integration | none | Where the app calls private resources | **Outbound** - not the same control |
| App identity | connection strings | Managed identity + Key Vault references | No secrets in app settings |
| Function authorization level | function key | Entra via Easy Auth or APIM | Keys carry no identity |
| Logic App request trigger | SAS callback URL | IP restriction, Entra OAuth, or a gateway in front | The URL is the credential |
| Logic App secure inputs/outputs | Off | On for sensitive parameters | Run history is readable |
| WAF mode | **Detection** | **Prevention**, after tuning | Detection blocks nothing |
| WAF rule set | latest managed | Latest, and **re-tune after a version change** | Customisations reset on upgrade |
| Bot protection | available | Enabled | Large share of traffic |
| APIM backend reachability | public | **Only from APIM** | Otherwise policies are bypassable |
| `validate-jwt` | not applied | Applied on protected APIs | Rejects bad tokens at the edge |

## Common failure modes

**Main site locked down, SCM site wide open.** The application refuses your test traffic and
the Kudu console answers from anywhere.

**Private endpoint created, public access left enabled.** Exactly as in 02-04 - the private
path exists alongside the public one.

**VNet integration mistaken for a private endpoint.** Outbound configured, inbound unchanged.

**Function key shared as the API credential.** It is in a URL, in browser history, in a
ticket, and it identifies nobody.

**Anonymous authorization level "for testing."** It stays.

**Logic App callback URL circulated as though it were an address.** It is a credential.

**WAF left in detection mode.** The dashboard shows attacks detected, and they all succeeded.

**Tuning by disabling rules instead of adding exclusions.** The rule stops protecting
everything, when an exclusion would have protected everything except one header.

**Rule set upgraded, tuning lost.** All enabled and disabled customisations reset to the new
version's defaults, and false positives return in production.

**Front Door WAF on a non-Premium tier.** Managed rules are not available.

**API Management deployed with a directly reachable backend.** The gateway becomes advisory.

**Secrets in app settings rather than Key Vault references.** Readable by anyone with
Contributor - and Contributor is not a data-plane role anywhere else in this guide either.

## How this is tested

| Phrase in the question | What it steers you to |
| --- | --- |
| "authentication without changing application code" | App Service authentication (Easy Auth) |
| "restrict deployment and console access" | SCM site access restrictions |
| "app must not be reachable from the internet" | Private endpoint + disable public access |
| "app must reach resources in the virtual network" | VNet integration |
| "no credentials in configuration" | Managed identity + Key Vault references |
| "caller must present a valid Entra token" | Easy Auth, or `validate-jwt` in APIM |
| "each consumer limited independently" | APIM subscription keys + rate-limit policy |
| "backend must only accept gateway traffic" | Private endpoint / access restriction on the backend |
| "block SQL injection and XSS" | WAF managed rule set |
| "evaluate impact before blocking" | **Detection mode** |
| "attacks are logged but not blocked" | Still in detection mode - switch to prevention |
| "false positive on an auth header" | WAF exclusion, not rule disablement |
| "block bad bots, allow crawlers" | Bot Manager rule set |
| "limit requests per client IP" | Custom rate-limiting rule (Front Door) |
| "workflow trigger must not be callable by anyone with the URL" | Entra OAuth on the request trigger, or a gateway |

**AZ-500 divergence.** The controls are broadly continuous, but the WAF rule set landscape has
moved - DRS 2.1 alongside CRS 3.2, Bot Manager as a separate managed rule set, and managed
rules gated behind Front Door Premium. Logic Apps Standard running on the App Service platform
also changes which controls apply, which older material predating that model gets wrong.

## Hands-on

See [03-06 lab](../../labs/03-secure-compute/03-06-lab.md).

## Check yourself

1. An App Service has access restrictions allowing only your office range, and HTTPS-only is
   on. A penetration tester reaches a deployment console from a coffee shop. Explain, and give
   the fix.
2. Distinguish a private endpoint from virtual network integration for an App Service in one
   sentence each, then describe a scenario needing both.
3. A WAF has been in place for three months, the managed rule set is current, and the
   application was successfully exploited by SQL injection that the WAF logged. Give the most
   likely cause and how you would confirm it in under a minute.
4. Your WAF blocks legitimate requests carrying an authentication token in a header. Compare
   the three tuning options and say which you would choose and why.
5. A Function uses the `function` authorization level, and the key is embedded in a partner's
   integration URL. Describe every problem with that arrangement using the vocabulary from
   02-01, and give the replacement.

## Sources

- Microsoft Learn - SC-500 skills measured: <https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500>
- Azure Web Application Firewall on Azure Front Door: <https://learn.microsoft.com/azure/frontdoor/web-application-firewall>
- Application Gateway WAF FAQ (modes and supported rule sets): <https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/application-gateway-waf-faq>
- WAF DRS and CRS rule groups and rules: <https://learn.microsoft.com/azure/web-application-firewall/ag/application-gateway-crs-rulegroups-rules>
- API Management gateway capabilities: <https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities>
