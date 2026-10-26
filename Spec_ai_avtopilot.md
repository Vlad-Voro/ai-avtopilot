# Architectural Specification & Production Blueprint: ai-avtopilot.ru (Spec_ai_avtopilot.md)

> **Status**: Production Hardened | **Updated**: 2026-10-26  
> **Live URL**: [https://ai-avtopilot.ru/](https://ai-avtopilot.ru/) | **Repo**: `Vlad-Voro/ai-avtopilot` (`main` - Private)  
> **Local Root**: `d:\AI\data\ai-avtopilot` | **Inventory**: 42 Production URLs (1 Root, 6 Hubs, 21 Services, 11 Cases, 3 Utility)  
> **Verification Matrix**: **153 / 153 PASS** (Tier 1: 11 Unit + Tier 2: 54 Static + Tier 3: 88 Browser E2E, 0 regressions) + 486 Layout Matrix

---

## 1. Edge Infrastructure & Network Topology

```mermaid
flowchart TD
    Client["Client Browser"] -->|HTTPS / TLS 1.3 / Anycast 76.76.21.21| Vercel["Vercel Anycast Edge"]

    subgraph EdgeLayer ["1. Edge & DNS Layer (Vercel + Cloudflare Grey Cloud)"]
        Vercel -->|Static Assets & Subpages| VEdge["Vercel Edge (vercel.json)"]
        Vercel -->|POST /submit (Lead Ingestion)| CFW["Cloudflare Worker (ai-avtopilot-bot)"]
        VEdge -->|Security Headers + 1y Cache| VSec["HSTS, CSP, Frame Guard, Permissions-Policy"]
        VEdge -->|Deployment Isolation| VIgn[".vercelignore (blocks _headers, *.md, tests, bot)"]
    end

    subgraph AppLayer ["2. Multi-Entry Hybrid SSG (42 URLs)"]
        VEdge --> P1["/ (Main Landing)"]
        VEdge --> P2["6 Hub Pages (/services/, /cases/, /calculator/, /dashboard/, /faq/, /contact/)"]
        VEdge --> P3["21 Dedicated Service Pages (/services/<slug>/)"]
        VEdge --> P4["11 Dedicated Case Pages (/cases/<slug>/)"]
        VEdge --> P5["3 Utility Pages (/privacy.html, /404.html, /success.html)"]
    end

    subgraph Ingestion ["3. Multi-Cloud Ingestion & Notifications"]
        CFW["Cloudflare Worker /submit"] -->|Tier 1 Primary: HTML Telegram API| TGB["Telegram Bot @AiAvtopilotbot"]
        TGB --> Admin["Duty Administrator"]
        CFW -.->|Tier 2 Failover: Vercel Edge| VFE["/api/fallback-lead (Vercel Serverless)"]
        VFE -.-> Admin
        CFW -.->|Tier 3 Failover: Client Guard| CLI["1-Click Clipboard + @AiAvtopilotbot"]
    end

    subgraph Monitoring ["4. Synthetic Monitoring"]
        GHA["GitHub Actions (healthcheck.yml)"] -->|Daily Cron + Push Verification| Vercel
    end
```

### 1.1. DNS, Routing & Anti-Throttling (TSPU DPI Resilience)

| Parameter | Configuration | Technical Rationale |
| :--- | :--- | :--- |
| **Apex Domain** | `ai-avtopilot.ru` $\to$ `76.76.21.21` (A) | Vercel Global Anycast Edge. Bypasses 24 KB DPI stall in Russia. |
| **Subdomain** | `www.ai-avtopilot.ru` $\to$ `cname.vercel-dns.com` | Canonical 301 redirect to apex domain. |
| **Proxy Mode** | Cloudflare DNS only (**Grey Cloud**) + DNSSEC (DS 2371) | Prevents Russian TSPU DPI throttling applied to Cloudflare IP ranges. |
| **Cold DR Origin** | Beget RU host (`185.50.25.55`) | Standby failover via automated FTPS deployment (`deploy.yml`). |
| **Webmasters** | Google Search Console DNS TXT + Yandex HTML file | `/yandex_cd29b4304b5e16c6.html` returns HTTP 200 (cleanUrls bypassed). |
| **Edge Cache** | `/assets/*`: 1-year immutable; HTML: 0s `must-revalidate` | Immediate content updates with zero stale SSG page caches. |
| **URL Normalize** | `"trailingSlash": true` (`vercel.json`) | Canonical 308 redirect. Prevents multi-hop redirect penalties. |
| **Security Headers** | HSTS preload, CSP, nosniff, SAMEORIGIN, strict-referrer | Edge-enforced protocol security and frame isolation. |
| **Mail Auth** | SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all` | DMARC: `v=DMARC1; p=none; sp=none; aspf=r;`. |

---

## 2. Frontend Architecture & Design System

### 2.1. Web Vitals & Zero-Blocking Core

| Metric | Target | Implementation Specification |
| :--- | :--- | :--- |
| **Inlined CSS** | ~97 KB | Master stylesheet embedded in `<head>` via `<style id="app-styles">`. Zero external render-blocking CSS. |
| **Font Subsetting** | Local WOFF2 | Zero external Google Fonts CDN. Local WOFF2 (*Inter*, *Outfit*, *JetBrains Mono*) in `/assets/fonts/` with `font-display: optional / swap`. |
| **FCP / LCP** | 0.3s–0.6s | Critical CSS inlined, zero external font roundtrips, hero SVG inlined. |
| **TBT** | 0 ms | Zero heavy client-side JavaScript frameworks. Pure vanilla JS modules. |
| **CLS** | 0.000 | Fixed dimensions on terminals, sliders, and bento cards. Pre-sized layout containers. |

### 2.2. Strict Palette & Contrast (WCAG AA Compliant)

| Token | Hex Value | Contrast Ratio | Usage Constraint |
| :--- | :--- | :--- | :--- |
| **Background** | `#050507` | Baseline | Deep Cosmic Black page background. |
| `--text-1` | `#ffffff` | 21:1 | Primary headings and critical metric values. |
| `--text-2` | `#cbd5e1` | 13.7:1 | Body copy and secondary UI labels. |
| `--text-3` | `#94a3b8` | 7.9:1 | Captions and tertiary metadata (exceeds WCAG AA 4.5:1). |
| `--accent` | `#6366f1` | 4.8:1 | Primary interactive elements, active borders, and focus rings. |
| `--accent-2` | `#a855f7` | 5.2:1 | Secondary gradient accents and telemetry badges. |

### 2.3. Breakpoints & Accessibility
- **Viewports**: `320px`, `375px`, `414px`, `768px`, `1024px`, `1200px`, `1440px`. Zero horizontal overflow (`overflow-x: clip / hidden`).
- **Touch Target**: All interactive controls $\ge 48\text{px}$ minimum hit dimensions.
- **Mobile Nav**: Synchronous `aria-expanded` toggle, body scroll lock (`overflow: hidden`), auto-close on `Escape` or link click.
- **Motion Reduction**: `@media (prefers-reduced-motion: reduce)` disables particles, transforms, and pulsating glows.

---

## 3. Multi-Entry Hybrid SSG & Navigation Engine

```text
index.html (Master Template) & Data Catalogs
   ├── [sync_pages.py] ──────────> 6 Hub & Tool Pages (/services/, /cases/, /calculator/, etc.)
   ├── [build_service_page.py] ──> 15 Dedicated Service Pages (/services/<slug>/)
   └── [build_case_page.py] ─────> 10 Dedicated Case Pages (/cases/<slug>/)
```

### 3.1. SSG Routing & Navigation Contracts
- **SOTA 404 Fallback**: Root `/404.html` caught natively by Vercel; preserves request path and executes client-side `history.replaceState` to restore target route.
- **Deterministic ScrollSpy Guard**:
  - Active section calculated via DOM geometry (`getActiveSection()`) using scroll offset (`window.scrollY + offset`).
  - Clears active underline on `#home`.
  - **Subpage Isolation**: `const isSubpage = window.location.pathname.startsWith('/services') || window.location.pathname.startsWith('/cases') || document.querySelector('.subpage-deep')`. Bypasses `history.replaceState` during scroll on subpages to preserve canonical URLs.

---

## 4. Interactive Engines & Mathematical Contracts

### 4.1. ROI Calculator Specifications

| Parameter | Boundary | Step | Default |
| :--- | :--- | :--- | :--- |
| **Employees ($E$)** | $[1, 100]$ | 1 | 10 |
| **Routine Hours/Week ($H$)** | $[1, 40]$ | 1 | 15 |
| **Monthly Salary ($S$)** | $[30\,000, 300\,000]$ RUB | $5\,000$ RUB | $80\,000$ RUB |

- **Exact Mathematical Formulas**:
  $$\text{Routine Fraction: } D = \frac{H}{160}$$
  $$\text{Annual Routine Cost: } M = E \times S \times D \times 12$$
  $$\text{Annual Savings (80% Efficiency): } W = M \times 0.80$$
  $$\text{Freed Hours Per Year: } X = E \times H \times 52$$
- **UI Elements**: Track height 7px, border-radius 999px. Dynamic gradient fill via `--fill`.
- **Output IDs**: `#roi-cost`, `#roi-save`, `#roi-hours` formatted with Russian locale (`ru-RU`).

### 4.2. Hero Particle Canvas
- **Particle Count**: Desktop ($\ge 768\text{px}$) 40 particles; Mobile ($< 768\text{px}$) 18–20 particles (-75% CPU load).
- **Lifecycle**: `IntersectionObserver` pauses `requestAnimationFrame` loop when Hero leaves viewport; resumes instantly on re-entry.

### 4.3. Live Dashboard Telemetry Simulator
- **Intervals**: Primary telemetry stream 3500ms; secondary log stream 2100ms.
- **Lifecycle**: Pauses execution during inactive browser tabs via `visibilitychange` (`document.hidden === true`).

### 4.4. KPI Counter Animation Engine
- **Interpolation**: Numbers interpolate over 1200ms using ease-out quad on `IntersectionObserver` trigger (`threshold: 0.15`).
- **Metric Unit Preservation Contract**: Strictly isolates numeric stems while preserving signs (`+`, `−`), decimal separators (`,`), and suffixes (`%`, `₽`, `ч`, `сек`, `млн ₽`, `★`). Never render naked integers where units are defined.

---

## 5. Ingestion Gateway, Edge Security & Anti-Bot Defense

### 5.1. Cloudflare Worker Gateway (`cloudflare-worker/worker.js`)
- **Endpoint**: `POST https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev/submit`.
- **Origin Whitelist**: `https://ai-avtopilot.ru`, `https://www.ai-avtopilot.ru`, `https://vlad-voro.github.io`.
- **Rate Limit**: Max 5 requests per 10 minutes per IP (sliding window with auto-pruning >2000 records).
- **Anti-Bot Defenses**:
  1. *Time-to-Submit*: Submissions completed in $< 1.0\text{s}$ are dropped silently (bot trap).
  2. *User Interaction*: Requires client interaction flags (`input`, `focus`, `touchstart`).
  3. *Honeypot*: Non-empty `_honey` field returns HTTP 200 silently without dispatch.
- **Telegram HTML Sanitization**:
  - Allowed entities: strictly `&lt;`, `&gt;`, `&amp;`, `&quot;`.
  - **Prohibited `&#039;`**: Triggers Telegram 400 Bad Request error.
- **Anti-Hijacking Parser**: Regex `^🆔 ID клиента: <code>(\d+)</code>` isolates client ID, preventing prompt injection in user quotes.

### 5.2. Multi-Cloud Lead Failover Cascade
1. **Tier 1 (Primary Gateway)**: Cloudflare Worker `/submit` (`/api/lead`) with dual parser (JSON + `urlencoded`), bot timing verification, sliding-window rate limit (5 req/10m), and HTML 303 Redirect to `/success.html`.
2. **Tier 2 (Multi-Cloud Failover)**: Vercel Serverless Function `/api/fallback-lead` running independently on Vercel Edge infrastructure, guaranteeing zero-loss if Cloudflare suffers an edge outage.
3. **Tier 3 (Offline / Network Stall Guard)**: Resilient fallback card with 1-click clipboard payload copy and direct Telegram contact link (`@AiAvtopilotbot`) (`RES-02`, `RES-03`).
4. **Tier 4 (NoScript Accessibility)**: In-page `<noscript>` container with instant Telegram and mailto direct contact buttons.
5. **Zero Naked Form Endpoints**: Complete elimination of public third-party endpoints and hardcoded emails across all 41 HTML pages and client bundles.

---

## 6. SEO, GEO & AEO (Generative Search Optimization)

### 6.1. Search Directives & Machine Protocols
- **AI Crawlers (`robots.txt`)**: Permits `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Applebot-Extended`, `Amazonbot`, `Cohere-ai`, `Meta-ExternalAgent`, `Google-Extended`, `Yandex`.
- **Ad Parameter Deduplication**:
  ```txt
  Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&_openstat&from&vk_source&gclid&fbclid /
  ```
- **Machine Discovery**: `/llms.txt` and `/llms-full.txt` indexed via `<link rel="describedby" href="/llms.txt">`.
- **Instant Navigation**: Chrome Speculation Rules API prerenders subpages with moderate threshold.
- **Security Standards**: RFC 9116 security policy at `/.well-known/security.txt`.
- **IndexNow Protocol**: Real-time push via `scripts/seo/push_indexnow.py` keyed by `d8a24f0c9b7e416a9e3d81b7e651c4a0.txt`.

### 6.2. Schema.org JSON-LD (@graph)
- `Organization` & `ProfessionalService`: RUB currency, areaServed "Russian Federation, Moscow", 152-FZ taxonomies.
- `FAQPage`: DOM accordion items match JSON-LD 1:1.
- `BreadcrumbList`: Structural 3-tier hierarchy across all subpages.
- `TechArticle`: Deep case study metadata (headline, datePublished, author).

---

## 7. Security Threat Matrix

| Threat Vector | Mitigation Strategy | Security Effect |
| :--- | :--- | :--- |
| **Clickjacking** | Frame guard in `<head>`: `if (self !== top) top.location = self.location;` | Blocks unauthorized iframe embedding. |
| **XSS & Injection** | Strict CSP: `default-src 'self'`; whitelisted analytics and fonts | Mitigates unauthorized script execution. |
| **MIME Sniffing** | `X-Content-Type-Options: nosniff` header | Prevents browser MIME confusion attacks. |
| **Outbound Leakage** | `Referrer-Policy: strict-origin-when-cross-origin` | Protects query tokens on outbound links. |
| **Form Scraping & Spam Injection** | Masked `action="/api/lead"`, zero third-party endpoints, honeypot & timing trap ($\ge 1.0$s) | Neutralizes automated direct-to-endpoint bot submissions. |
| **Non-JS Lead Drop** | Worker dual parser (`application/x-www-form-urlencoded`) + 303 Redirect to `/success.html` | 100% lead capture resilience without client-side JavaScript. |
| **Gateway Single Point of Failure** | Tier 2 Vercel Serverless Function `/api/fallback-lead` running independently | Eliminates edge dependency, ensuring failover lead capture. |
| **Payload Flooding** | 10 KB body clamp and input length validations | Neutralizes buffer overflow and DoS vectors. |
| **Secret Leaks** | Zero credentials in repo; Cloudflare environment secrets | Eliminates API credential exposure. |
| **Transit Sniffing** | TLS 1.3 / TLS 1.2 PFS, HSTS preload (1 year), zero mixed content | Guaranteed edge transit encryption. |

---

## 8. Verification Matrix: 153 Automated Checks

```powershell
# Fast In-Process Static, Security & Unit Suites (78 checks, < 1.4s)
node data/ai-avtopilot/tests/run_all.js --fast

# Responsive Layout & Viewport Matrix (486 checks across 27 pages x 18 devices, ~4s)
node data/ai-avtopilot/tests/audit/audit_runner.js

# Browser E2E Suites (82 checks, ~18s)
node data/ai-avtopilot/tests/run_all.js --e2e

# Full Test Pyramid Execution (160 checks, ~24s)
node data/ai-avtopilot/tests/run_all.js
```

### Pyramid Tier Specifications

| Tier | Scope | Checks | Latency | Key Invariants Verified |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | In-Memory Unit | 11 | $\le 20\text{ms}$ | ROI formula ($E \times S \times \frac{H}{160} \times 12$), boundary clamps, sanitization, Russian locale formatting. |
| **Tier 2** | Static & Integration | 67 | $< 1.4\text{s}$ | **SEO (34)**: `sitemap.xml`, trailing slashes, title $\le 85$c, description $\le 175$c, 1 H1, Schema.org @graph, DOM sequence.<br>**Security (16)**: TG HTML escaping, ID parser, 10 KB clamp, honeypot, frame guard, WCAG AA palette contrast.<br>**SSL/TLS (1)**: Edge TLS & zero mixed content.<br>**Resiliency (5)**: 6000ms abort, fallback card, Metrica callback, anti-slop audit.<br>**Invariants (11)**: Favicons (6), Compare Cards equal heights across 29 HTML pages (5). |
| **Tier 3** | Browser E2E | 82 | $\sim 18\text{s}$ | **Core E2E (69)**: touch, routing, burger menu, viewports (320px–2560px), WCAG AA contrast, lead delivery, formula reactivity.<br>**Express Modal (7)**: dual pill, dialog open/close, tab switch, 1-click email copy.<br>**Slider & Drag (6)**: desktop LMB drag-to-scroll, grab cursor, vertical control centering, sNudge animation. |
| **Tier 4** | Layout Matrix | 486 | $\sim 4\text{s}$ | DOM geometry across 18 canonical viewport profiles: zero horizontal overflow, $\ge 48\text{px}$ touch targets. |

---

## 9. Canonical Specification for Service Landing Pages (`/services/<slug>/`)

### 9.1. 7-Stage Canonical Funnel Structure
`Hero` $\to$ `ROI Calculator` $\to$ `Compare` $\to$ `Bento Modules` $\to$ `Cases` $\to$ `FAQ` $\to$ `Dashboard` $\to$ `Contact Form (#contact)` $\to$ `Other Scenarios (#other-services)` $\to$ `Footer`.

| Section | Target Selector | Mandatory Architecture & Styling Rules |
| :--- | :--- | :--- |
| **1. Nav** | `header.nav#site-header` | Logo link to `/`, subpage navigation links, burger ($\ge 48\text{px}$). |
| **2. Hero** | `section.hero#home` | **Exactly ONE `<h1>`**: static text + dynamic `#typed-text` box. Primary CTA (`#contact`), Secondary CTA (`#dashboard`). |
| **3. ROI Calc** | `section.roi#calculator` | Reactive JS sliders updating `--fill` gradient. Formatted labels, 80% savings math. |
| **4. Bento Grid** | `section.services#services` | 6 unlinked modules rendered via `.services__bento--static` (3-column desktop grid, mobile touch swipe). |
| **5. Cases** | `section.cases#cases` | **Strict 3-Case Invariant**: exactly 3 applied case cards (`.cases__grid--static`). 3 columns desktop, 3 dots mobile. |
| **6. FAQ** | `section.faq#faq` | Semantic accordion buttons (`aria-expanded`), B2B answers (1C, 152-FZ, SLA, NDA). |
| **7. Dashboard** | `section.dashboard#dashboard` | Live terminal and agent telemetry. Zero duplicate CTA buttons inside widget. |
| **8. Contact** | `section.contact#contact` | Canonical 3 fields (`#contact-name`, `#contact-company`, `#contact-email`), 152-FZ checkbox, honeypot `_honey`. |
| **9. Mesh** | `section.other-services` | **$K_{12}$ Silo Mesh**: 11 sibling service cards strictly below `#contact`. Desktop: 4x2 slider (2 slides). |
| **10. Footer** | `footer.footer` | B2B contacts, Telegram bot, 24/7 support hours, Schema.org graph. |

### 9.2. Strict Negative Invariants (22 Rules)
1. ❌ **Zero Phantom Top Banners**: Never inject `subpage-deep` boxes above Hero; page starts with Hero immediately after Navigation.
2. ❌ **Zero ScrollSpy URL Hijacking**: On subpages (`/services/*`, `/cases/*`), `history.replaceState` must NEVER overwrite clean URL during scroll.
3. ❌ **Zero H1 Pollution**: Exactly ONE `<h1>` per page located in Hero title. Prohibited: 0 or $>1$ H1.
4. ❌ **Zero Flex Wrapper Pollution**: Prohibited to wrap `.case-card` or `.scard` content in intermediate wrappers that break flex layout.
5. ❌ **Zero Duplicate CTA Buttons**: Prohibited to duplicate audit buttons inside demo widgets or intermediate cards.
6. ❌ **Zero Extra Form Fields**: Prohibited to introduce non-standard `<select>` or radio buttons into the canonical lead form.
7. ❌ **Zero Incomplete Sliders**: Prohibited to render static sliders without reactive JS bindings and gradient `--fill` updates.
8. ❌ **Zero Duplicate Event Listeners**: Never re-attach inline listeners for components already wired in `index-Bx30wa4i.js`.
9. ❌ **Zero Typewriter Phrase Wrapping**: All phrases in `data-phrases` MUST be $\le 19$ characters (`min-height: 1.25em` mobile, CLS = 0.000).
10. ❌ **Zero Calculator Math Divergence**: Sliders must strictly follow core mathematical contract ($E \times S \times \frac{H}{160} \times 12$, 80% savings).
11. ❌ **Zero Static SSR Terminal Stubs**: Telemetry terminals, live logs, and KPI badge values must be pre-rendered in SSR HTML.
12. ❌ **Zero Navigation Link Hijacking**: Subpage navigation links MUST trigger genuine browser navigation.
13. ❌ **Zero Log Overflow**: Telemetry logs must strictly use `.log-item` (`font-size: 0.72rem`, `gap: 10px`) with `.log-item__time` and `.log-item__text`.
14. ❌ **Universal Swipe Carousel Nudge & LMB Drag-to-Scroll**: All scrollable blocks on mobile and desktop (`.services__bento`, `.cases__grid`, `.other-services__bento`) must include GPU nudge observer (`@keyframes sNudge`, guarded by overflow check `scrollWidth > clientWidth` and `prefers-reduced-motion`) and desktop Left Mouse Button (LMB) drag-to-scroll navigation with click capture guard.
15. ❌ **Zero Factoid Sheet Clutter**: Prohibited to inject standalone factoid sheet cards into the DOM. Embed facts in Hero, FAQ, and Schema.org.
16. ❌ **Subpage In-Page Form Routing**: Secondary CTAs (`href="#contact"`) must smoothly scroll to in-page form.
17. ❌ **Zero AI-Slop & Semantic Invariance**: All pages must pass `ru_text_humanizer` (0/64 patterns, Title 30–85c, Meta Description 70–175c).
18. ❌ **Zero KPI Unit Stripping**: Never strip metric suffixes or signs (`+18%`, `−72%`, `9 200 ч`, `30 сек`, `4.2 млн ₽`, `4,9★`).
19. ❌ **Desktop 3x3 Static Grids & Strict 3-Case Invariant**: Unlinked module blocks must render as 3-column grid (`repeat(3, minmax(0, 1fr))`). Every service page MUST feature exactly 3 applied case cards.
20. ❌ **Zero Asymmetric Mobile Cards (Equal-Height Invariant)**: In mobile/tablet horizontal swipe containers (`.services__bento`, `.other-services__bento`, `.cases__grid` under `@media(max-width: 1024px)`), containers must enforce `align-items: stretch !important` and card items (`.scard`, `.case-card`) must have `align-self: stretch !important`, `height: auto !important`, `display: flex !important`, `flex-direction: column !important`. Description blocks must have `flex: 1 1 auto !important`, and trailing tags/results/CTAs must have `margin-top: auto !important`. Sibling card descriptions and tag counts must remain balanced to prevent height disparity.
21. ❌ **Zero Solo Telegram Footers (Canonical Dual-CTA Footer Invariant)**: Every production page (`/`, hubs, `/services/*`, `/cases/*`) must strictly render the canonical dual conversion footer (`.footer__dual-cta` containing both Telegram button and `#open-express-modal` Email express audit trigger, backed by `<dialog id="express-contact-modal">` and modal controller script). Standalone legacy `.footer__tg-cta` is strictly prohibited.
22. ❌ **Zero Asymmetric Comparison Cards (Equal-Height & Alignment Invariant)**: In the `#compare` before/after block across all 29 production pages (`/`, 6 hubs, 12 services, 10 cases), `.compare__grid` MUST declare `align-items: stretch` (prohibited: `align-items: center` which vertically centers shorter cards and creates mismatched top/bottom bounds). Both cards (`.compare__card`) MUST specify `height: 100%` and `box-sizing: border-box` on desktop, and `height: auto` on mobile. Central arrow (`.compare__arrow`) MUST declare `align-self: center` and `justify-content: center` to ensure it remains perfectly centered between cards of equal height. Enforced by `test_compare_card_invariants.js` and E2E suites `R1.7` / `E2E-7`.


---

## 10. Canonical Specification for Case Study Landing Pages (`/cases/<slug>/`)

### 10.1. Key Structural Invariants
- **Routing**: `/cases/<slug>/` (e.g. `/cases/retail-inventory-automation/`).
- **Conversion Sequence**: `Hero` $\to$ `ROI Calculator` $\to$ `Compare` $\to$ `Bento Architecture` $\to$ `FAQ` $\to$ `Dashboard` $\to$ `Contact Form` $\to$ `Other Cases (#cases)` $\to$ `Footer`.
- **Bottom Placement of "Другие кейсы"**: On case pages, the `#cases` section is positioned strictly below `#contact` and displays 9 sibling cases (excluding active case). Desktop: 1 slide (10 items, arrows auto-hidden via `hidden`).
- **Structured Data**: `TechArticle` metadata, `BreadcrumbList` (3 levels), and `FAQPage` matching accordion 1:1.
- **Declarative Source**: `data/cases_data.json` and `data/cases_semantics.json`.

### 10.2. Internal Linking Mesh Invariant ($K_{24}$ & $K_{11}$)
- **Service Silo Mesh ($K_{24}$)**: Every service page cross-links to all 23 sibling services in `#other-services` (552 total directed links, 0 self-links, 0 redirect hops).
- **Case Silo Mesh ($K_{11}$)**: Every case page cross-links to all 10 sibling cases in `#cases` (110 total directed links, 0 self-links).

---

## 11. Generation Protocol & Build CLI Commands

```powershell
# 1. Synchronize all 6 Multi-Entry Hub pages from index.html:
python data/ai-avtopilot/scripts/sync_pages.py

# 2. Build dedicated service subpages (all 12 services):
python data/ai-avtopilot/scripts/build_service_page.py --all

# 3. Build dedicated case study subpages (all 10 cases):
python data/ai-avtopilot/scripts/build_case_page.py --all

# 4. Push instant indexation updates via IndexNow:
python data/ai-avtopilot/scripts/seo/push_indexnow.py

# 5. Run full verification suite:
node data/ai-avtopilot/tests/run_all.js --fast       # 78 fast checks (< 1.4s)
node data/ai-avtopilot/tests/audit/audit_runner.js # 486 layout checks (~4s)
node data/ai-avtopilot/tests/run_all.js --e2e        # 82 browser E2E checks (~18s)
node data/ai-avtopilot/tests/run_all.js              # 160 full checks (~24s)
```
