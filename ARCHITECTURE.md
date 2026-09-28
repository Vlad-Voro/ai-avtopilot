# Architectural Reference & Project Map: ai-avtopilot.ru

> **Status**: Production Hardened | **Updated**: 2026-09-28  
> **Live URL**: [https://ai-avtopilot.ru/](https://ai-avtopilot.ru/) | **Repo**: `Vlad-Voro/ai-avtopilot` (`main` - Private)  
> **Local Root**: `d:\AI\data\ai-avtopilot`  
> **Verification**: 115 / 115 PASS (78 E2E + 19 SEO + 13 Security + 5 Resiliency, 0 regressions)

---

## 1. Topology & Edge Infrastructure

```mermaid
flowchart TD
    Client["Client (Browser / Mobile / Tablet)"] -->|HTTPS / HTTP/3 / TLS 1.3| CF["Cloudflare Zero-Trust Edge (Proxy: ON, Flexible SSL)"]
    
    subgraph EdgeLayer ["1. Edge & DNS Layer (Cloudflare)"]
        CF -->|1. Static Assets & HTML (Port 80)| BGT["Beget Production Origin (185.50.25.55 / Apache)"]
        CF -->|2. POST /submit (Lead Ingestion)| CFW["Cloudflare Worker (ai-avtopilot-bot)"]
        CF -->|3. HSTS 1y + Preload + WAF| SEC["OWASP Frame Guard + Sliding Rate Limiter"]
    end
    
    subgraph AppLayer ["2. Static Hybrid Multi-Entry SSG (.htaccess Hardened)"]
        BGT --> P1["/ (Main Landing)"]
        BGT --> P2["/services/ (1C / ERP / RPA Services)"]
        BGT --> P3["/cases/ (340% Proven ROI Metrics)"]
        BGT --> P4["/calculator/ (Interactive ROI Engine)"]
        BGT --> P5["/dashboard/ (Real-Time Workload Simulator)"]
        BGT --> P6["/faq/ (B2B FAQ: 1C/EDI/152-FZ)"]
        BGT --> P7["/contact/ (Express Audit Capture)"]
    end
    
    subgraph LeadDelivery ["3. Resilient Ingestion & Notifications"]
        CFW -->|Primary: HTML Telegram API| TGB["Telegram Bot @AiAvtopilotbot"]
        TGB -->|Two-way routing| Admin["Duty Administrator"]
        CFW -.->|Fallback on network error| W3F["Web3Forms API + FormSubmit .co"]
        W3F -.-> Mail["contact@ai-avtopilot.ru"]
    end

    subgraph CICD ["4. Automated CI/CD Pipeline"]
        GHA["GitHub Actions (deploy.yml)"] -->|FTPS Sync (TLS 1.2+)| BGT
    end
```

### 1.1. DNS & Edge Routing
- **Domain**: `ai-avtopilot.ru` (`.ru` TLD, registrar REG.RU with DNSSEC DS records).
- **Beget Origin + Cloudflare Proxy**:
  - Origin IP: `185.50.25.55` (Beget, Saint Petersburg / Moscow DC).
  - Virtual Host: `f91009a4.beget.tech/public_html/`.
  - Cloudflare SSL/TLS Mode: **Flexible** (Edge terminates client HTTPS with HTTP/3 & TLS 1.3; connects to Beget over port 80).
  - DNSSEC: Signed zone via REG.RU DS key records.
  - A records: `@` $\to$ `185.50.25.55` (Proxied), `www` $\to$ `185.50.25.55` (Proxied).
  - Webmaster Verification:
    - Google Search Console: DNS TXT `google-site-verification=u42j0jjBKadmyE77f9wlqfy5gkyDONXtaPzcPRZ51R8` + meta tag.
    - Yandex Webmaster: HTML verification file `/yandex_cd29b4304b5e16c6.html`.
- **Security & Caching (.htaccess on Beget)**:
  - Custom 404 handler (`ErrorDocument 404 /404.html`).
  - Sensitive file cloaking (`_headers`, `.git`, `.env`, `package*.json`, `*.md`).
  - MIME types for modern formats (`font/woff2`, `image/svg+xml`, `application/manifest+json`).
  - Strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).
  - Static asset caching (`max-age=31536000, public, immutable`) and dynamic HTML revalidation (`no-cache, must-revalidate`).
- **Mail Compliance**:
  - SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all`.
  - DMARC: `_dmarc.ai-avtopilot.ru TXT "v=DMARC1; p=none; sp=none; aspf=r;"` (audit mode; avoids dropping legitimate mail).

---

## 2. Frontend Architecture & Design System

### 2.1. Zero-Blocking Delivery & Web Vitals (100/100 Mobile & Desktop)
- **Inlined Styles**: Global CSS embedded directly in `<head>` via `<style id="app-styles">` (~97 KB). Zero render-blocking external CSS.
- **WOFF2 Font Subsetting**: *Inter* (U+0400-045F Cyrillic, Latin) and *Outfit* preloaded via `<link rel="preload">`, partitioned into local Unicode ranges in `/assets/fonts/` with `font-display: swap`.
- **Core Web Vitals Thresholds**:
  - FCP: **0.3s – 0.5s**.
  - LCP: **0.5s – 0.6s**.
  - TBT: **0 ms**.
  - CLS: **0.000** (strict fixed heights on terminal, chart bars, and card containers).

### 2.2. Contrast & Palette (WCAG AA Strict)
- Background: `#050507` (Deep Cosmic Black).
- Text Tier 1 (`--text-1`): `#ffffff` (21:1 contrast).
- Text Tier 2 (`--text-2`): `#cbd5e1` (13.7:1 contrast on `#050507`).
- Text Tier 3 (`--text-3`): `#94a3b8` (7.9:1 contrast, exceeds WCAG AA 4.5:1).
- Accents: Indigo `--accent: #6366f1`, Purple `--accent-2: #a855f7`, Border glow `rgba(99, 102, 241, 0.25)`.
- Cards (`.scard`, `.case-card`, `.dash-card`): 4px hover elevation, `box-shadow: 0 12px 36px rgba(99, 102, 241, 0.18)`, neon border glow.

### 2.3. Breakpoints & Accessibility
- Viewport Grid: `1440px` (wide), `1200px` (desktop), `1024px` (tablet landscape), `768px` (tablet portrait), `414px / 375px / 320px` (mobile).
- Zero horizontal overflow (`overflow-x: clip / hidden` on body and wrapper containers).
- **Mobile Navigation**:
  - Burger touch target $\ge 48\text{px}$ with safe padding.
  - Synchronous `aria-expanded="true/false"`.
  - Body scroll lock (`overflow: hidden`) while open.
  - Auto-closes on `Escape` key or nav link selection.
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables transforms, blinks, and particle animations.

---

## 3. Multi-Entry Hybrid SSG & Routing Engine

```text
index.html (Master Template)
   │
   ├── [sync_pages.py] ──> /services/index.html   (H1, Breadcrumbs, Canonical, Schema, Table, Mesh)
   ├── [sync_pages.py] ──> /cases/index.html      (H1, Breadcrumbs, Canonical, Schema, Table, Mesh)
   ├── [sync_pages.py] ──> /calculator/index.html (H1, Breadcrumbs, Canonical, Schema, Table, Mesh)
   ├── [sync_pages.py] ──> /dashboard/index.html  (H1, Breadcrumbs, Canonical, Schema, Table, Mesh)
   ├── [sync_pages.py] ──> /faq/index.html        (H1, Breadcrumbs, Canonical, Schema, FAQPage, Mesh)
   └── [sync_pages.py] ──> /contact/index.html    (H1, Breadcrumbs, Canonical, Schema, Form, Mesh)
```

### 3.1. SSG Generator (`scripts/sync_pages.py`)
- **Problem**: In static hosting environments without server-side rendering, direct deep navigation to sub-routes could trigger generic server 404s, degrading SEO indexation and UX.
- **Solution**: Multi-Entry Hybrid SSG:
  - 6 physical directories with dedicated `index.html`.
  - Unique `<title>`, `<meta description>`, OpenGraph, Twitter Cards, canonical `<link rel="canonical">`.
  - Exactly one `<h1>` per page reflecting page intent.
  - Deep content tables (integration protocols, SLAs, verified ROI).
  - PageRank Mesh (`.subpage-links-grid`) ensuring weight circulation without dead ends.
- **Build Command**:
  ```powershell
  python data/ai-avtopilot/scripts/sync_pages.py
  ```

### 3.2. Trailing Slash Normalization (Zero 301 Hops)
- All internal links in header, footer, mesh, and JS routing use trailing slashes: `/services/`, `/cases/`, `/calculator/`, `/dashboard/`, `/faq/`, `/contact/`.
- Combined with `.htaccess` rewrite rules checking `X-Forwarded-Proto = https`, eliminating multi-hop protocol downgrades and preserving crawler budget.

### 3.3. SOTA 404 Fallback & Custom Error Handling
- Hardened `.htaccess` directive: `ErrorDocument 404 /404.html`.
- `404.html` branded with design system, catches non-existent URLs and provides immediate navigation back to core landing pages or SPA recovery.
- `index.html` router on `DOMContentLoaded` reads the stored path, restores clean URL via `history.replaceState`, and smooth scrolls to target with `scroll-margin-top: 80px`.

### 3.4. Deterministic ScrollSpy (ADR 2026-09-25)
- Replaced flaky `IntersectionObserver` with DOM geometry-based `getActiveSection()` calculating active sections from scroll offset (`window.scrollY + offset`).
- Synchronously sets `.nav__link.active` on click, clears underline at `#home`, and updates address bar via `history.replaceState`.

---

## 4. Interactive Engines & Mathematical Models

### 4.1. ROI Calculator Model
- **Inputs**:
  - Employee count: $E \in [1, 100]$, step 1.
  - Routine hours/week per employee: $H \in [1, 40]$, step 1.
  - Average monthly salary: $S \in [30\,000, 300\,000]$ RUB, step $5\,000$ RUB.
- **Formulas**:
  - Routine fraction of month:
    $$D = \frac{H}{160}$$
  - Annual salary spent on routine:
    $$M = E \times S \times D \times 12$$
  - Annual savings (80% automation efficiency):
    $$W = M \times 0.80$$
  - Freed employee hours per year:
    $$X = E \times H \times 52$$
- **UI & Visualization**:
  - 7px track height, 999px rounded geometry.
  - Dynamic gradient fill via CSS var `--fill`:  
    `background: linear-gradient(to right, #6366f1 0%, #a855f7 pct%, rgba(255, 255, 255, 0.1) pct%, rgba(255, 255, 255, 0.1) 100%)`.
  - Pill badges displaying formatted current values and min/max limit ticks.

### 4.2. Hero Particle Canvas (CWV CPU/Battery Optimization)
- **Adaptive Density**:
  - Desktop ($\ge 768\text{px}$): 40 particles.
  - Mobile ($< 768\text{px}$): 18–20 particles (-75% CPU load, eliminates mobile thermal throttling).
- **Lifecycle Control**:
  - `IntersectionObserver` monitors Hero visibility.
  - `requestAnimationFrame` loop freezes when scrolled below Hero.
  - Resumes instantly when scrolled back into view.

### 4.3. Live Dashboard Simulator
- Real-time agent status simulation with log streams and metric bars (intervals: 3500ms and 2100ms).
- Linked to `visibilitychange`: when tab is inactive (`document.hidden === true`), intervals pause to eliminate memory leaks and background CPU cycles.

---

## 5. Edge Gateway, Cloudflare Worker & Ingestion

### 5.1. Cloudflare Worker Gateway (`cloudflare-worker/worker.js`)
Deploys on Cloudflare V8 isolates:
- **Endpoint**: `POST https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev/submit`.
- **Origin Whitelist**: Validates `Origin` header. Permitted:
  - `https://ai-avtopilot.ru`
  - `https://www.ai-avtopilot.ru`
  - `https://vlad-voro.github.io`
- **Sliding-Window Rate Limiter**: Max 5 requests per 10 minutes per IP with automatic stale IP pruning (>2000 entries).
- **Zero-Overhead Anti-Bot Defense**:
  - *Time-to-Submit*: Drops submissions faster than 1.0s (human input impossible under 1s).
  - *Interaction Tracker*: Enforces real user interaction events (`input`, `focus`, `touchstart`).
  - *Honeypot*: Hidden `_honey` field; non-empty values sink silently (HTTP 200 without Telegram dispatch).
- **Telegram HTML Sanitization**:
  - Allowed entities strictly: `&lt;`, `&gt;`, `&amp;`, `&quot;`.
  - Single quote escaping as `&#039;` is prohibited (causes `Telegram 400 Bad Request` and delivery drops).
- **Anti-Hijacking Reply Parser**:
  - Regex `^🆔 ID клиента: <code>(\d+)</code>` isolates real client ID, neutralizing injection in user quotes.

### 5.2. Resilient Lead Failover Cascade
1. **Primary**: POST to Cloudflare Worker $\to$ Telegram bot [@AiAvtopilotbot](https://t.me/AiAvtopilotbot) to duty admin.
2. **Timeout**: Client-side fetch aborted via `AbortController` after 6000ms.
3. **Secondary**: Web3Forms API $\to$ FormSubmit `.co` $\to$ inbox `contact@ai-avtopilot.ru`.
4. **Offline Fallback UI**: On catastrophic network failure, UI shows fallback card with 1-click clipboard payload copy and direct Telegram contact button.

### 5.3. Local Python Bot (`bot/bot.py`)
- Local development & backup gateway with proxy support (SOCKS5 `127.0.0.1:10808` / HTTP `127.0.0.1:10809`).
- Bi-directional relay: Admin native Telegram Replies route back to the originating client chat.

---

## 6. SEO, GEO & AEO (Generative Engine Optimization)

### 6.1. AI Search Crawlers (Yandex Neuro, ChatGPT, Perplexity)
- **Crawler Access (`robots.txt`)**: Explicitly allows 10 AI engines:
  - `GPTBot`, `OAI-SearchBot`
  - `PerplexityBot`
  - `ClaudeBot`
  - `Applebot-Extended`
  - `Amazonbot`, `Cohere-ai`, `Meta-ExternalAgent`, `Google-Extended`, `Yandex`
- **Machine-Readable Knowledge Context**:
  - `/llms.txt`: Dense summary of capabilities, stack, cases, and conversion contacts for fast RAG ingestion.
  - `/llms-full.txt`: Full technical protocol spec (1C OData REST API, Diadoc SDK, SBIS API, 152-FZ on-premise deployment).

### 6.2. Schema.org JSON-LD (@graph)
- `Organization` & `ProfessionalService`:
  - `currenciesAccepted: "RUB"`, `priceRange: "₽₽"`.
  - `paymentAccepted: "Bank transfer, cashless invoice, SBP"`.
  - `areaServed: "Russian Federation, Moscow"`.
  - `knowsAbout`: Taxonomies for AI Agents, RPA, 1C:ERP, 1C:UT, 1C:BP 3.0, 152-FZ.
- `FAQPage`: B2B accordion Q&A matching DOM elements 1:1.
- `BreadcrumbList`: Structural hierarchy across all 6 subpages.
- `WebSite`: Search intents and canonical domain.

### 6.3. Ad Parameter Sanitization (Yandex Clean-Param)
```txt
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&_openstat&from&vk_source&gclid&fbclid /
```
Prevents crawler index pollution and duplicate pages across 11 standard Russian ad tracking parameters.

---

## 7. Security & Zero-Trust Hardening

| Vector | Implementation | Protection |
|---|---|---|
| **OWASP Clickjacking** | Inline Frame Guard in `<head>`: `if (self !== top) top.location = self.location;` with instant `body{display:none}` removal | Prevents malicious iframe embedding |
| **Content Security Policy** | `default-src 'self'`; strict whitelists for `mc.yandex.ru`, Cloudflare Worker, Web3Forms, local fonts | Mitigates XSS and script injections |
| **X-Content-Type-Options** | `nosniff` meta tag & edge header | Disables browser MIME-type sniffing |
| **Referrer Policy** | `strict-origin-when-cross-origin` | Protects URL query privacy on outbound links |
| **Payload Clamping** | Max 10 KB request body, length validation on inputs | Prevents Telegram 400 DoS attacks |
| **Secrets Hygiene** | Zero plaintext tokens in repository; secrets managed via Cloudflare Worker environment | Eliminates credential leak vectors |

---

## 8. Verification Matrix: 115 Automated Tests

```powershell
# 1. 78 E2E tests (Rendering, responsive, routing, math, user journeys)
node data/ai-avtopilot/tests/run_e2e_tests.js

# 2. 19 Technical & SEO tests (Directives, canonicals, schemas, PageRank mesh)
node data/ai-avtopilot/tests/seo/test_seo_audit.js

# 3. 13 Edge Security tests (Worker gateway, sanitization, anti-bot, clickjack)
node data/ai-avtopilot/tests/security/test_security_audit.js

# 4. 5 Resiliency & JTBD tests (AbortController, fallback UI, anti-slop)
node data/ai-avtopilot/tests/resiliency/test_resiliency_jtbd.js
```

### 4-Tier E2E Architecture (78 tests, 3-worker context pool, ~25s runtime)
- **Tier 1 (Feature Coverage R1–R7, 39 tests)**: Hero layout, section sequence, WCAG AA contrast, bento/card hover, slash routing, slider 7px track/math, fixed CLS heights, visibility lifecycle, passive listeners.
- **Tier 2 (Boundary & Corner Cases, 28 tests)**: 8 viewports (320px..2560px), slider extremes (Min 1/1/30k, Max 100/40/300k, Mid), rapid input drag (50 iterations), SPA 404 fallback, burger 10x toggle, ESC close, rapid nav clicks.
- **Tier 3 (Cross-Feature Interactions, 6 tests)**: Scroll during nav click, mobile slider drag without horizontal shift, scroll lock during open menu, hash/pushState transitions.
- **Tier 4 (Real-World User Journeys, 5 tests)**: Full workflows: first-time visitor discovery, bento exploration, CFO ROI calculation, direct deep-link `/cases/`, mobile lead submission on 375px.

---

## 9. B2B Commercial Model & Positioning

### 9.1. Core Offer & Landing Triggers
- **Hero Offer**: **"Free 30-minute express audit of 3 business processes"**.
- **Value Proposition**: Selling **direct payroll reduction, cash gap elimination, and inventory mismatch prevention**, not abstract "AI/neural nets".
- **Pilot Framework**: 14-day fixed pilot (50,000 – 150,000 RUB) guaranteeing measurable ROI before entering annual B2B contracts.

### 9.2. Decision Maker Personas (B2B)
1. **Chief Operating Officer (COO)**: Stock accuracy, marketplace overstock/out-of-stock (WB/Ozon), order fulfillment delays.
2. **Chief Financial Officer / Chief Accountant (CFO)**: Month-end close delays (3–5 days), invoice backlogs in EDI (Diadoc/SBIS), manual reconciliations.
3. **Chief Information Officer (CIO / CTO)**: Shortage of 1C developers, 1C OData REST API integration, 152-FZ on-premise compliance.
4. **Business Owner / CEO**: Scaling operational capacity without expanding back-office headcount.

### 9.3. B2B Enterprise Compliance
- Cashless payment via formal contract-invoice.
- Electronic Document Interchange (EDI): **Kontur.Diadoc** and **Tensor SBIS**.
- Mandatory bilateral **NDA** before inspecting sample data or configurations.
- 24/7 technical support and monitoring SLAs.
