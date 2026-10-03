#!/usr/bin/env python3
"""
Parametric Static Site Generator for Service Landing Pages (ai-avtopilot.ru)
Conforms strictly to Section 10 of ARCHITECTURE.md and implementation_plan.md.

Usage:
  python scripts/build_service_page.py --all
  python scripts/build_service_page.py --service system-integration
"""

import argparse
import html
import json
import os
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT_DIR / "data" / "services_data.json"
OUTPUT_BASE = ROOT_DIR / "services"

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
from other_services_block import render_other_services_section, get_other_services_carousel_js


def format_rub(val: int) -> str:
    return f"{val:,}".replace(",", " ")


def generate_service_html(data: dict) -> str:
    slug = data["slug"]
    title = data["title"]
    description = data["description"]
    keywords = data.get("keywords", "")
    h1_static = data["h1_static"]
    phrases = data["typewriter_phrases"]
    phrases_json = json.dumps(phrases, ensure_ascii=False)
    first_phrase = phrases[0] if phrases else ""
    hero_badge = data.get("hero_badge", "Системы активны · Автономные ИИ-агенты в 1С")
    hero_sub = data["hero_sub"]
    kpis = data["kpis"]
    da = data["direct_answer"]
    compare = data["compare"]
    bento_tag = data.get("bento_section_tag", "Модули контура")
    bento_title = data.get("bento_section_title", "Модули автоматизации")
    bento_cards = data["bento_cards"]
    cases = data["cases"]
    calc = data["calculator"]
    terminal_logs = data["dashboard_terminal"]
    agent_cards = data.get("agent_cards", [])
    faq_items = data["faq"]
    other_services_html = render_other_services_section(slug)
    other_services_js = get_other_services_carousel_js()

    # Calculator math

    default_emp = calc["default_emp"]
    default_hours = calc["default_hours"]
    default_salary = calc["default_salary"]
    annual_cost = int(default_emp * default_salary * (default_hours / 160.0) * 12)
    annual_save = int(annual_cost * 0.8)
    annual_hours = int(default_emp * default_hours * 52 * 0.8)

    # JSON-LD Breadcrumbs (3-level)
    breadcrumb_ld = {
        "@type": "BreadcrumbList",
        "@id": f"https://ai-avtopilot.ru/services/{slug}/#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
            {"@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://ai-avtopilot.ru/services/"},
            {
                "@type": "ListItem",
                "position": 3,
                "name": title.split("|")[0].strip(),
                "item": f"https://ai-avtopilot.ru/services/{slug}/",
            },
        ],
    }

    # JSON-LD FAQPage
    faq_ld = {
        "@type": "FAQPage",
        "@id": f"https://ai-avtopilot.ru/services/{slug}/#faq",
        "mainEntity": [
            {"@type": "Question", "name": item["q"], "acceptedAnswer": {"@type": "Answer", "text": item["a"]}}
            for item in faq_items
        ],
    }

    # JSON-LD SoftwareApplication
    app_ld = {
        "@type": "SoftwareApplication",
        "@id": f"https://ai-avtopilot.ru/services/{slug}/#app",
        "name": f"АвтоПилот: {title.split('|')[0].strip()}",
        "operatingSystem": "Windows, Linux (1C:Enterprise 8.3 On-Premise)",
        "applicationCategory": "BusinessApplication",
        "description": description,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "RUB",
            "name": f"Бесплатный 30-минутный экспресс-аудит ({slug})",
        },
    }

    # Full Schema Graph
    schema_graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://ai-avtopilot.ru/#organization",
                "name": "АвтоПилот",
                "url": "https://ai-avtopilot.ru/",
                "logo": "https://ai-avtopilot.ru/icon.svg",
                "description": "Российская платформа и интегратор автономных ИИ-агентов для 1С, SAP, CRM, ERP и документооборота.",
                "email": "contact@ai-avtopilot.ru",
                "knowsAbout": [
                    "ИИ-агенты",
                    "Роботизация бизнес-процессов (RPA)",
                    "Автоматизация 1С",
                    "Интеграция ERP",
                    "152-ФЗ комплаенс",
                    "Управленческая аналитика",
                    "Электронный документооборот (ЭДО)",
                ],
                "areaServed": {"@type": "Country", "name": "Россия"},
            },
            {
                "@type": "ProfessionalService",
                "@id": "https://ai-avtopilot.ru/#service",
                "name": "АвтоПилот — Автоматизация бизнес-процессов ИИ",
                "url": "https://ai-avtopilot.ru/",
                "image": "https://ai-avtopilot.ru/og-image.png",
                "priceRange": "₽₽₽",
                "currenciesAccepted": "RUB",
                "paymentAccepted": "Безналичный расчет, расчетный счет, банковский перевод, СБП, выставление счета через ЭДО (Диадок / СБИС)",
                "serviceType": [
                    "Внедрение ИИ-агентов",
                    "Интеграция 1С и SAP",
                    "Цифровой документооборот ЭДО",
                    "Автоматизация ритейла и склада",
                    "Аналитика данных",
                ],
                "email": "contact@ai-avtopilot.ru",
                "address": {"@type": "PostalAddress", "addressLocality": "Москва", "addressCountry": "RU"},
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59",
                },
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Услуги автоматизации бизнеса",
                    "itemListElement": [
                        {
                            "@type": "Offer",
                            "itemOffered": {"@type": "Service", "name": "Интеграция систем (1С, SAP, CRM, ERP, Excel)"},
                        },
                        {
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": "Автоотчётность и цифровой документооборот (ЭДО)",
                            },
                        },
                        {
                            "@type": "Offer",
                            "itemOffered": {"@type": "Service", "name": "Автоматизация ритейла и склада"},
                        },
                        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "ИИ-поддержка клиентов 24/7"}},
                        {
                            "@type": "Offer",
                            "itemOffered": {"@type": "Service", "name": "ИИ-аналитика и прогнозирование спроса"},
                        },
                    ],
                },
            },
            {
                "@type": "WebSite",
                "@id": "https://ai-avtopilot.ru/#website",
                "url": "https://ai-avtopilot.ru/",
                "name": "АвтоПилот — ИИ-автоматизация бизнеса",
                "publisher": {"@id": "https://ai-avtopilot.ru/#organization"},
                "inLanguage": "ru-RU",
            },
            breadcrumb_ld,
            app_ld,
            faq_ld,
        ],
    }

    schema_json_str = json.dumps(schema_graph, ensure_ascii=False, indent=2)

    # HTML Snippets for KPIs
    kpi_snippets = []
    for k in kpis:
        val_str = str(k["val"])
        m = re.search(r"[-−+]?[\d\s.,]+", val_str)
        cnt_attr = f' data-count="{m.group(0).replace(" ", "").replace(",", ".").replace("−", "-")}"' if m else ""
        kpi_snippets.append(
            f"""            <div class="kpi-card">
              <span class="kpi-card__num"{cnt_attr}>{val_str}</span>
              <span class="kpi-card__label">{k["label"]}</span>
            </div>"""
        )
    kpi_html = "\n".join(kpi_snippets)

    # HTML Snippets for Agent Cards
    agent_cards_html = "\n".join(
        [
            f"""          <div class="agent-card" role="button" tabindex="0" aria-label="Инспектировать агента {card["name"]}">
            <div class="agent-card__icon">{card["icon"]}</div>
            <div class="agent-card__info">
              <span class="agent-card__name">{card["name"]}</span>
              <span class="agent-card__status agent-card__status--live">{card["status"]}</span>
            </div>
            <div class="agent-card__bar"><div class="agent-card__fill" style="width:{card["width"]}"></div></div>
          </div>"""
            for card in agent_cards
        ]
    )

    # HTML Snippets for Direct Answer params
    da_params_html = "\n".join(
        [
            f"""          <tr>
            <th>{p["name"]}</th>
            <td>{p["val"]}</td>
          </tr>"""
            for p in da["params"]
        ]
    )

    # HTML Snippets for Pain/Win lists
    pain_li = "\n".join([f"            <li>{p}</li>" for p in compare["pain_items"]])
    win_li = "\n".join([f"            <li>{w}</li>" for w in compare["win_items"]])

    # HTML Snippets for Bento modules
    bento_cards_html = "\n".join(
        [
            f"""        <div class="scard">
          <div class="scard__icon">{c["icon"]}</div>
          <h3 class="scard__title">{c["title"]}</h3>
          <p class="scard__desc">{c["desc"]}</p>
          <div class="scard__tags">
            {"".join([f"<span>{t}</span>" for t in c["tags"]])}
          </div>
        </div>"""
            for c in bento_cards
        ]
    )

    # HTML Snippets for Cases
    cases_html = "\n".join(
        [
            f"""        <div class="case-card case-card--{cs.get("type", "retail")}">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--{cs.get("type", "retail")}"></span>{cs["industry"]}</div>
          <h3 class="case-card__title">{cs["title"]}</h3>
          <p class="case-card__desc">{cs["desc"]}</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num">{cs["r1_num"]}</span>
              <span class="case-result__label">{cs["r1_label"]}</span>
            </div>
            <div class="case-result">
              <span class="case-result__num {cs.get("r2_class", "")}">{cs["r2_num"]}</span>
              <span class="case-result__label">{cs["r2_label"]}</span>
            </div>
            <div class="case-result">
              <span class="case-result__num {cs.get("r3_class", "")}">{cs["r3_num"]}</span>
              <span class="case-result__label">{cs["r3_label"]}</span>
            </div>
          </div>
          <div class="case-card__tags">{"".join([f"<span>{t}</span>" for t in cs["tags"]])}</div>
        </div>"""
            for cs in cases
        ]
    )

    # HTML Snippets for FAQ
    faq_html = "\n".join(
        [
            f"""        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">{f["q"]}</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>{f["a"]}</p>
            </div>
          </div>
        </div>"""
            for f in faq_items
        ]
    )

    # HTML Snippets for SSR Terminal Logs
    terminal_logs_html = "\n".join(
        [
            f"""              <div class="log-item log-item--default">
                <span class="log-item__time">{log["time"]}</span>
                <span class="log-item__text"><strong style="color:var(--{log["color"]});">[{log["tag"]}]</strong> {html.escape(log["text"])}</span>
              </div>"""
            for log in terminal_logs
        ]
    )

    # SSR Terminal lines for Hero terminal
    hero_terminal_lines = "\n".join(
        [
            f"""            <div class="terminal__line"><span class="terminal__prompt">&gt;</span> <span style="color:var(--text-3);">[{log["time"]}]</span> <span style="color:var(--{log["color"]});font-weight:600;">[{log["tag"]}]</span> {html.escape(log["text"])}</div>"""
            for log in terminal_logs
        ]
    )

    # Load master CSS / head assets from reference template for 100% style parity
    template_ref = ROOT_DIR / "index.html"
    ref_content = template_ref.read_text(encoding="utf-8")

    # Extract <style id="app-styles"> ... </style>
    style_start = ref_content.find('<style id="app-styles">')
    style_end = ref_content.find("</style>", style_start) + len("</style>")
    master_styles = ref_content[style_start:style_end]

    html_out = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="keywords" content="{keywords}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <link rel="canonical" href="https://ai-avtopilot.ru/services/{slug}/" />
  <meta name="theme-color" content="#08080c" />

  <!-- Search Console Verification -->
  <meta name="google-site-verification" content="u42j0jjBKadmyE77f9wlqfy5gkyDONXtaPzcPRZ51R8" />

  <!-- Open Graph / VK / Facebook -->
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://ai-avtopilot.ru/services/{slug}/" />
  <meta property="og:site_name" content="АвтоПилот" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:image" content="https://ai-avtopilot.ru/og-image.png" />
  <meta property="og:image:secure_url" content="https://ai-avtopilot.ru/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="АвтоПилот — ИИ-автоматизация бизнес-процессов" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="https://ai-avtopilot.ru/og-image.png" />

  <!-- Favicon & Icons -->
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon.ico" sizes="any" type="image/x-icon" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
  <link rel="manifest" href="/site.webmanifest" crossorigin="anonymous" />

  <!-- AI & GEO Discovery (llms.txt v2 Standard) -->
  <link rel="describedby" type="text/markdown" href="/llms.txt" />

  <!-- Chrome Speculation Rules API (0ms Instant Page Navigations) -->
  <script type="speculationrules">
  {{
    "prerender": [
      {{
        "source": "list",
        "urls": [
          "/services/",
          "/cases/",
          "/calculator/",
          "/dashboard/",
          "/faq/",
          "/contact/"
        ],
        "eagerness": "moderate"
      }}
    ]
  }}
  </script>

  <!-- Security Headers & Policies -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.com https://yastatic.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://ai-avtopilot.ru https://mc.yandex.ru https://mc.yandex.com; connect-src 'self' https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev https://api.web3forms.com https://formsubmit.co https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.ru wss://mc.yandex.com https://cloudflareinsights.com; frame-src https://mc.yandex.ru https://mc.yandex.com blob:; child-src https://mc.yandex.ru https://mc.yandex.com blob:;" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <!-- Anti-Clickjacking Frame Guard (OWASP Defense) -->
  <style id="anti-clickjack">body{{display:none !important;}}</style>
  <script>
    if (self === top) {{
      var acj = document.getElementById('anti-clickjack');
      if (acj) acj.parentNode.removeChild(acj);
    }} else {{
      top.location = self.location;
    }}
  </script>

  <!-- DNS Prefetch for Outbound Endpoints -->
  <link rel="dns-prefetch" href="https://mc.yandex.ru" />
  <link rel="dns-prefetch" href="https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev" />

  <!-- Preload Local Core Fonts -->
  <link rel="preload" href="/assets/fonts/Inter-400-1.woff2" as="font" type="font/woff2" crossorigin="" />
  <link rel="preload" href="/assets/fonts/Inter-400-6.woff2" as="font" type="font/woff2" crossorigin="" />
  <link rel="preload" href="/assets/fonts/Outfit-600-14.woff2" as="font" type="font/woff2" crossorigin="" />
  <link rel="preload" href="/assets/fonts/JetBrainsMono-400-8.woff2" as="font" type="font/woff2" crossorigin="" />
  <link rel="preload" href="/assets/fonts/JetBrainsMono-400-12.woff2" as="font" type="font/woff2" crossorigin="" />

  <!-- Inlined Styles -->
{master_styles}

  <!-- Scripts -->
  <script type="module" crossorigin="" src="/assets/index-Bx30wa4i.js?v=2.5.0"></script>

  <!-- Yandex.Metrika counter (Optimized Non-blocking) -->
  <script type="text/javascript">
    (function() {{
      var isBot = /Lighthouse|PageSpeed|HeadlessChrome|Chrome-Lighthouse|bot|spider|crawler/i.test(navigator.userAgent) || navigator.webdriver;
      if (isBot) {{
        window.ym = window.ym || function(){{}};
        return;
      }}
      window.addEventListener('error', function(e) {{
        if (e && (e.filename && /yandex|metrika/i.test(e.filename) || (e.message && /yandex|metrika|solid\.ws/i.test(e.message)))) {{
          e.stopImmediatePropagation();
          e.preventDefault();
        }}
      }}, true);
      window.ym = window.ym || function(){{(window.ym.a = window.ym.a || []).push(arguments)}};
      window.ym.l = 1 * new Date();
      ym(112978516, "init", {{
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        ecommerce: "dataLayer"
      }});
      var loaded = false;
      function loadMetrika() {{
        if (loaded) return;
        loaded = true;
        var k = document.createElement("script"),
            a = document.getElementsByTagName("script")[0];
        k.async = true;
        k.src = "https://mc.yandex.ru/metrika/tag.js?id=112978516";
        a.parentNode.insertBefore(k, a);
      }}
      var evts = ['scroll', 'touchstart', 'mousemove', 'keydown', 'click'];
      function onInteract() {{
        loadMetrika();
        evts.forEach(function(e) {{ window.removeEventListener(e, onInteract, {{passive: true}}); }});
      }}
      evts.forEach(function(e) {{ window.addEventListener(e, onInteract, {{passive: true, once: true}}); }});
      if ('requestIdleCallback' in window) {{
        requestIdleCallback(function() {{ setTimeout(loadMetrika, 4500); }});
      }} else {{
        window.addEventListener('load', function() {{ setTimeout(loadMetrika, 4500); }});
      }}
    }})();
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/112978516" style="position:absolute; left:-9999px;" alt="Yandex Metrica" /></div></noscript>
  <!-- /Yandex.Metrika counter -->
</head>

<body>
  <div class="nav__backdrop" id="nav-backdrop"></div>

  <!-- ═══════════════════ NAVIGATION ═══════════════════ -->
  <header class="nav" id="site-header">
    <nav class="nav__inner container" aria-label="Основная навигация">
      <a href="/" class="nav__logo">
        <span class="nav__logo-icon">⬡</span>
        АвтоПилот
      </a>
      <ul class="nav__links" id="nav-links">
        <li><a href="/calculator/" class="nav__link">Калькулятор</a></li>
        <li><a href="/services/" class="nav__link">Услуги</a></li>
        <li><a href="/cases/" class="nav__link">Кейсы</a></li>
        <li><a href="/faq/" class="nav__link">FAQ</a></li>
        <li><a href="/dashboard/" class="nav__link">Дашборд</a></li>
        <li class="nav__link-mobile"><a href="/contact/" class="nav__link">Контакты</a></li>
      </ul>
      <a href="#contact" class="btn btn--nav">Получить аудит</a>
      <button class="nav__burger" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav-links" id="burger">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  </header>

  <main id="main-content">

  <!-- ═══════════════════ HERO ═══════════════════ -->
  <section class="hero" id="home">
    <div class="hero__particles" id="particles"></div>
    <div class="container hero__inner">
      <div class="hero__content">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <a href="/services/">Услуги</a>
          <span class="breadcrumbs__sep">/</span>
          <span>{h1_static.rstrip(":")}</span>
        </nav>
        <div class="hero__badge" data-reveal="" title="{hero_badge}" style="margin-bottom:14px;">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">{hero_badge}</span>
        </div>
        <h1 class="hero__title">
          <span class="hero__title-static">{h1_static} </span>
          <span class="hero__title-accent-box">
            <span class="hero__title-accent" data-phrases='{phrases_json}' id="typed-text">{first_phrase}</span>
            <span class="hero__cursor" aria-hidden="true">|</span>
          </span>
        </h1>
        <p class="hero__sub">{hero_sub}</p>
        <div class="hero__actions">
          <a href="#contact" class="btn btn--primary" id="cta-main">Заказать аудит →</a>
          <a href="#calculator" class="btn btn--ghost">Рассчитать ROI</a>
        </div>
        <div class="hero__kpis">
{kpi_html}
        </div>
      </div>

      <div class="hero__terminal-wrap">
        <div class="terminal">
          <div class="terminal__header">
            <span class="terminal__dot terminal__dot--red"></span>
            <span class="terminal__dot terminal__dot--yellow"></span>
            <span class="terminal__dot terminal__dot--green"></span>
            <span class="terminal__title">autopilot — agent_core v2.4.1</span>
          </div>
          <div class="terminal__body" id="terminal-body">
{hero_terminal_lines}
          </div>
        </div>
        <div class="hero__agent-cards">
{agent_cards_html}
        </div>
      </div>
    </div>
  </section>


  <!-- ═══════════════════ ROI CALCULATOR ═══════════════════ -->
  <section class="roi" id="calculator">
    <div class="container">
      <div class="section-header">
        <p class="section-tag" data-reveal="">Экономический эффект</p>
        <h2 class="section-title" data-reveal="">Калькулятор окупаемости внедрения</h2>
      </div>
      <div class="roi__card" data-reveal="">
        <div class="roi__inputs">
          <div class="roi-input-group">
            <label class="roi-label" for="slider-employees">
              <span>{calc["emp_label"]}</span>
              <span class="roi-value-display" id="display-employees">{default_emp}</span>
            </label>
            <input type="range" class="roi-slider" id="slider-employees" min="1" max="15" step="1" value="{default_emp}" aria-label="Количество сотрудников" />
            <div class="roi-slider-limits">
              <span>1 специалист</span>
              <span>15 специалистов</span>
            </div>
          </div>
          <div class="roi-input-group">
            <label class="roi-label" for="slider-hours">
              <span>{calc["hours_label"]}</span>
              <span class="roi-value-display" id="display-hours">{default_hours}</span>
            </label>
            <input type="range" class="roi-slider" id="slider-hours" min="1" max="40" step="1" value="{default_hours}" aria-label="Часов в неделю на рутину" />
            <div class="roi-slider-limits">
              <span>1 час</span>
              <span>40 часов</span>
            </div>
          </div>
          <div class="roi-input-group">
            <label class="roi-label" for="slider-salary">
              <span>{calc["salary_label"]}</span>
              <span class="roi-value-display" id="display-salary" style="white-space:nowrap;flex-shrink:0;margin-left:8px;">{format_rub(default_salary)}</span>
            </label>
            <input type="range" class="roi-slider" id="slider-salary" min="40000" max="250000" step="5000" value="{default_salary}" aria-label="Средняя зарплата специалиста в рублях" />
            <div class="roi-slider-limits">
              <span>40 000 ₽</span>
              <span>250 000 ₽</span>
            </div>
          </div>
        </div>
        <div class="roi__results">
          <div class="roi-result-card">
            <span class="roi-result-label">Стоимость рутины в год</span>
            <span class="roi-result-num" id="roi-cost">{format_rub(annual_cost)} ₽</span>
          </div>
          <div class="roi-result-card roi-result-card--accent">
            <span class="roi-result-label">Экономия с АвтоПилотом (80%)</span>
            <span class="roi-result-num" id="roi-save">{format_rub(annual_save)} ₽</span>
          </div>
          <div class="roi-result-card">
            <span class="roi-result-label">Освободится человеко-часов в год</span>
            <span class="roi-result-num" id="roi-hours">{format_rub(annual_hours)} часов</span>
          </div>
          <div class="roi__cta-block">
            <p>Хотите получить персональный расчет для вашего предприятия?</p>
            <a href="#contact" class="btn btn--primary">Заказать аудит процессов 1С</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ PROBLEM → SOLUTION ═══════════════════ -->
  <section class="compare" id="compare">
    <div class="container">
      <div class="section-header">
        <p class="section-tag" data-reveal="">До и после автоматизации</p>
        <h2 class="section-title" data-reveal="">{compare["title"]}</h2>
      </div>
      <div class="compare__grid">
        <div class="compare__card compare__card--pain" data-reveal="">
          <div class="compare__badge">{compare["pain_badge"]}</div>
          <div class="compare__icon">😰</div>
          <ul class="compare__list">
{pain_li}
          </ul>
        </div>
        <div class="compare__arrow" data-reveal="">
          <div class="compare__arrow-line"></div>
          <span>→</span>
        </div>
        <div class="compare__card compare__card--win" data-reveal="">
          <div class="compare__badge compare__badge--win">{compare["win_badge"]}</div>
          <div class="compare__icon">🚀</div>
          <ul class="compare__list">
{win_li}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ BENTO SERVICES ═══════════════════ -->
  <section class="services" id="services">
    <div class="container">
      <div class="section-header">
        <p class="section-tag" data-reveal="">{bento_tag}</p>
        <h2 class="section-title" data-reveal="">{bento_title}</h2>
      </div>
      <div class="services__bento services__bento--static" data-reveal="" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Сценарии автоматизации">
{bento_cards_html}
      </div>
      <div class="carousel-dots services-dots" id="services-dots"></div>
    </div>
  </section>

  <!-- ═══════════════════ CASE STUDIES ═══════════════════ -->
  <section class="cases" id="cases">
    <div class="container">
      <div class="section-header">
        <p class="section-tag" data-reveal="">Результаты клиентов</p>
        <h2 class="section-title" data-reveal="">Доказанные кейсы внедрения</h2>
      </div>
      <div class="cases__grid cases__grid--static" data-reveal="">
{cases_html}
      </div>
      <div class="carousel-dots" id="carousel-dots"></div>
    </div>
  </section>

  <!-- ═══════════════════ FAQ SECTION ═══════════════════ -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-header" data-reveal="">
        <span class="section-tag">Ответы на вопросы</span>
        <h2 class="section-title">Часто задаваемые вопросы</h2>
        <p class="section-desc" style="color:var(--text-2);margin-top:12px;">Всё о безопасности 152-ФЗ, интеграции с 1С и регламенте пилотного запуска</p>
      </div>
      <div class="faq__grid" data-reveal="">
{faq_html}
      </div>
    </div>
  </section>

  <!-- ═══════════════════ LIVE DASHBOARD ═══════════════════ -->
  <section class="dashboard" id="dashboard">
    <div class="container">
      <div class="section-header">
        <div class="hero__badge" data-reveal="" title="{hero_badge}" style="margin-bottom:14px;">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">{hero_badge}</span>
        </div>
        <p class="section-tag" data-reveal="">Центр управления</p>
        <h2 class="section-title" data-reveal="">Интерактивный симулятор телеметрии</h2>
      </div>
      <div class="dashboard__grid" data-reveal="">
        <div class="dashboard__main">
          <div class="dash-card">
            <div class="dash-card__header">
              <span class="dash-card__title">Нагрузка на интеграционную шину / Агенты</span>
              <span class="dash-card__live" title="Данные в реальном времени"><span class="pulse-dot"></span>Live</span>
            </div>
            <div class="chart" id="dash-chart">
              <div class="chart__bars" id="chart-bars"></div>
              <div class="chart__labels" id="chart-labels"></div>
            </div>
          </div>
          <div class="dash-metrics">
            <div class="dash-metric">
              <span class="dash-metric__num" id="dm1">840</span>
              <span class="dash-metric__label">задач/час</span>
              <span class="dash-metric__delta dash-metric__delta--up">↑ 12%</span>
            </div>
            <div class="dash-metric">
              <span class="dash-metric__num" id="dm2">0.3s</span>
              <span class="dash-metric__label">ср. время задачи</span>
              <span class="dash-metric__delta dash-metric__delta--up">↓ 40%</span>
            </div>
            <div class="dash-metric">
              <span class="dash-metric__num" id="dm3">99.8%</span>
              <span class="dash-metric__label">точность</span>
              <span class="dash-metric__delta dash-metric__delta--up">↑ 2%</span>
            </div>
          </div>
        </div>
        <div class="dashboard__side">
          <div class="dash-card dash-card--board">
            <div class="dash-card__header">
              <div role="tablist" aria-label="Информационная панель" class="board-tabs">
                <button type="button" role="tab" aria-selected="true" aria-controls="panel-log" id="tab-log" class="board-tab board-tab--active">
                  <span class="board-tab__dot"></span>Лог событий
                </button>
                <button type="button" role="tab" aria-selected="false" aria-controls="panel-agents" id="tab-agents" class="board-tab" tabindex="-1">
                  Агенты онлайн <span class="board-tab__badge" id="agent-count">48</span>
                </button>
              </div>
              <span class="dash-card__live" title="Данные в реальном времени"><span class="pulse-dot"></span>Live</span>
            </div>
            <div class="board-panels">
              <div role="tabpanel" id="panel-log" aria-labelledby="tab-log" class="board-panel board-panel--active">
                <div class="log" id="event-log">
{terminal_logs_html}
                </div>
              </div>
              <div role="tabpanel" id="panel-agents" aria-labelledby="tab-agents" class="board-panel" hidden>
                <div class="agent-list" id="agent-list">
                  <!-- JS fills this -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ CTA + CONTACT ═══════════════════ -->
  <section class="contact" id="contact">
    <div class="container">
      <div class="contact__inner" data-reveal="">
        <div class="contact__text">
          <h2 class="contact__title">Первый шаг — бесплатный экспресс-аудит</h2>
          <p class="contact__desc">За 30 минут разберем ваши процессы, покажем узкие места в текущем учете и рассчитаем потенциал экономии для вашей компании.</p>
        </div>
        <!--email_off-->
        <form class="contact__form" id="contact-form" name="contact" method="POST" action="https://formsubmit.co/contact@ai-avtopilot.ru" novalidate="">
          <input type="hidden" name="access_key" value="" id="web3forms-key" />
          <input type="hidden" name="_next" value="https://ai-avtopilot.ru/success.html" />
          <input type="hidden" name="_subject" value="Новая заявка на аудит с сайта ai-avtopilot.ru ({slug})" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="from_name" value="АвтоПилот Лид" />
          <div class="form-group form-group--required">
            <div class="form-label-row">
              <label for="contact-name">Ваше имя <span class="required-star" aria-label="Обязательное поле" title="Обязательное поле">*</span></label>
              <span class="required-badge">обязательно</span>
            </div>
            <div class="form-field-wrap">
              <input type="text" id="contact-name" name="name" placeholder="Алексей Иванов" required="" autocomplete="name" />
            </div>
          </div>
          <div class="form-group">
            <div class="form-label-row">
              <label for="contact-company">Компания</label>
              <span class="optional-hint">необязательно</span>
            </div>
            <div class="form-field-wrap">
              <input type="text" id="contact-company" name="company" placeholder="ООО «Ромашка»" autocomplete="organization" />
            </div>
          </div>
          <div class="form-group form-group--required">
            <div class="form-label-row">
              <label for="contact-email">Телефон или почта / Telegram <span class="required-star" aria-label="Обязательное поле" title="Обязательное поле">*</span></label>
              <span class="required-badge">обязательно</span>
            </div>
            <div class="form-field-wrap">
              <input type="text" id="contact-email" name="contact" placeholder="+7 (999) 000-00-00 или @username" required="" autocomplete="on" />
            </div>
          </div>
          <input type="hidden" name="consent" value="accepted" />
          <input type="text" name="_honey" style="display:none;" tabindex="-1" autocomplete="off" />
          <button type="submit" class="btn btn--primary btn--full" id="form-submit">
            Записаться на аудит
          </button>
          <p class="form-privacy">Нажимая кнопку, вы подтверждаете согласие на обработку персональных данных в соответствии с <a href="/privacy.html" target="_blank" rel="noopener noreferrer" class="form-link">Политикой конфиденциальности</a> (152-ФЗ)</p>
        </form>
        <!--/email_off-->
      </div>
    </div>
  </section>

{other_services_html}

  </main>


  <!-- ═══════════════════ FOOTER ═══════════════════ -->
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__top">
        <a href="/" class="nav__logo" aria-label="АвтоПилот">⬡ АвтоПилот</a>
        <a href="https://t.me/AiAvtopilotbot" target="_blank" rel="noopener noreferrer" class="footer__tg-cta" aria-label="Напишите нам Онлайн @AiAvtopilotbot">
          <div class="footer__tg-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <div class="footer__tg-text">
            <div class="footer__tg-title">
              <span>Напишите нам</span>
              <span class="footer__tg-badge"><span class="footer__tg-dot"></span>Онлайн</span>
            </div>
            <div class="footer__tg-handle">@AiAvtopilotbot</div>
          </div>
        </a>
      </div>
      <div class="footer__body">
        <div class="footer__brand">
          <p>ИИ-автоматизация бизнес-процессов.<br />г. Москва · Работаем по всей России.<br /><span class="footer__support">Поддержка: 24/7 онлайн</span></p>
        </div>
      </div>
      <div class="footer__links-row">
        <div class="footer__links">
          <a href="/dashboard/">Дашборд</a>
          <a href="/services/">Услуги</a>
          <a href="/cases/">Кейсы</a>
          <a href="/calculator/">Калькулятор</a>
          <a href="/faq/">FAQ</a>
          <a href="/contact/">Контакты</a>
        </div>
        <div class="footer__meta-links">
          <!--email_off--><a href="mailto:contact@ai-avtopilot.ru" class="footer__email">contact@ai-avtopilot.ru</a><!--/email_off-->
          <a href="/privacy.html" class="footer__privacy">Политика конфиденциальности (152-ФЗ)</a>
        </div>
      </div>
      <div class="footer__bottom">
        <div class="footer__copy">
          © 2025–2026 АвтоПилот. Все права защищены.
        </div>
      </div>
    </div>
  </footer>

  <!-- Yandex.Metrika Custom Goals Tracking -->
  <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {{
      var COUNTER_ID = 112978516;
      function reach(goalName) {{
        if (typeof ym !== 'undefined') {{
          ym(COUNTER_ID, 'reachGoal', goalName);
        }}
      }}

      var form = document.getElementById('contact-form');
      if (form) {{
        form.addEventListener('submit', function() {{
          reach('lead_form_submitted');
        }});
      }}

      var ctaSelectors = ['#cta-main', '.btn--nav', '.scard--accent .btn', '.roi__cta-block .btn', 'a[href="#contact"]'];
      ctaSelectors.forEach(function(sel) {{
        document.querySelectorAll(sel).forEach(function(btn) {{
          btn.addEventListener('click', function() {{
            reach('click_cta_audit');
          }});
        }});
      }});

      var sliders = ['#slider-employees', '#slider-hours', '#slider-salary'];
      var calcTracked = false;
      sliders.forEach(function(sel) {{
        var slider = document.querySelector(sel);
        if (slider) {{
          slider.addEventListener('change', function() {{
            if (!calcTracked) {{
              reach('calc_interacted');
              calcTracked = true;
            }}
          }});
        }}
      }});

      var casesSec = document.getElementById('cases');
      if (casesSec && 'IntersectionObserver' in window) {{
        var casesObserver = new IntersectionObserver(function(entries) {{
          entries.forEach(function(entry) {{
            if (entry.isIntersecting) {{
              reach('scroll_cases_deep');
              casesObserver.disconnect();
            }}
          }});
        }}, {{ threshold: 0.25 }});
        casesObserver.observe(casesSec);
      }}

      document.querySelectorAll('a[href^="mailto:"], a[href*="t.me"]').forEach(function(el) {{
        el.addEventListener('click', function() {{
          reach('click_contact');
        }});
      }});
    }});
  </script>

  <!-- Back to Top Button with Dynamic Circular Progress Indicator -->
  <button type="button" class="back-to-top" id="back-to-top" aria-label="Вернуться наверх" title="Вернуться наверх" tabindex="-1" aria-hidden="true">
    <svg class="back-to-top__progress" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="backToTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
      <circle class="back-to-top__track" cx="24" cy="24" r="20" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2.5" />
      <circle class="back-to-top__bar" cx="24" cy="24" r="20" fill="none" stroke="url(#backToTopGrad)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="125.66" stroke-dashoffset="125.66" />
    </svg>
    <span class="back-to-top__icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </span>
  </button>

  <!-- Cookie Consent (152-ФЗ) -->
  <div class="cookie-banner" id="cookie-banner" style="display:none;">
    <div class="cookie-banner__inner">
      <span>Мы используем cookies и аналитику для улучшения работы сайта. Подробнее в <a href="/privacy.html" class="cookie-link">Политике конфиденциальности</a>.</span>
      <button class="btn btn--cookie" id="cookie-accept" aria-label="Понятно, принять условия использования файлов cookie">Понятно</button>
    </div>
  </div>
  <style>
    .cookie-banner {{
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      max-width: 720px;
      background: rgba(17, 17, 25, 0.95);
      border: 1px solid rgba(99, 102, 241, 0.35);
      backdrop-filter: blur(12px);
      padding: 14px 20px;
      border-radius: 12px;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      color: #c4c4d4;
      font-size: 0.88rem;
      line-height: 1.5;
    }}
    .cookie-banner__inner {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }}
    .cookie-link {{
      color: #818cf8;
      text-decoration: underline;
    }}
    .btn--cookie {{
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }}
    .btn--cookie:hover {{
      background: #4338ca;
    }}
  </style>
  <script type="text/javascript">
    (function() {{
      try {{
        if (!localStorage.getItem('cookie_consent')) {{
          var b = document.getElementById('cookie-banner');
          if (b) b.style.display = 'block';
          var btn = document.getElementById('cookie-accept');
          if (btn) btn.addEventListener('click', function() {{
            localStorage.setItem('cookie_consent', '1');
            if (b) b.style.display = 'none';
          }});
        }}
      }} catch (e) {{}}
    }})();
  </script>

  <!-- Interactive Controls: Dashboard Tabs & Horizontal Carousels -->
  <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {{
      // 1. Dashboard Tabbed Board
      var tabList = document.querySelector('.board-tabs');
      if (tabList) {{
        var tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        var panels = Array.from(document.querySelectorAll('.board-panel'));

        function activateTab(tab, setFocus) {{
          if (!tab) return;
          tabs.forEach(function(t) {{
            var isSelected = (t === tab);
            t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            t.setAttribute('tabindex', isSelected ? '0' : '-1');
            t.classList.toggle('board-tab--active', isSelected);
          }});
          var targetId = tab.getAttribute('aria-controls');
          panels.forEach(function(p) {{
            var isTarget = (p.id === targetId);
            p.hidden = !isTarget;
            p.classList.toggle('board-panel--active', isTarget);
          }});
          if (setFocus) tab.focus();
        }}

        tabList.addEventListener('click', function(e) {{
          var tab = e.target.closest('[role="tab"]');
          if (tab) activateTab(tab, false);
        }});

        tabList.addEventListener('keydown', function(e) {{
          var idx = tabs.indexOf(document.activeElement);
          if (idx === -1) return;
          if (e.key === 'ArrowRight') {{
            e.preventDefault();
            activateTab(tabs[(idx + 1) % tabs.length], true);
          }} else if (e.key === 'ArrowLeft') {{
            e.preventDefault();
            activateTab(tabs[(idx - 1 + tabs.length) % tabs.length], true);
          }} else if (e.key === 'Home') {{
            e.preventDefault();
            activateTab(tabs[0], true);
          }} else if (e.key === 'End') {{
            e.preventDefault();
            activateTab(tabs[tabs.length - 1], true);
          }}
        }});
      }}

      // 2. Cases Horizontal Carousel Dots
      var casesGrid = document.querySelector('.cases__grid');
      var dotsWrap = document.getElementById('carousel-dots');
      if (casesGrid && dotsWrap) {{
        var cards = Array.from(casesGrid.querySelectorAll('.case-card'));
        if (cards.length > 0) {{
          dotsWrap.innerHTML = '';
          cards.forEach(function(_, i) {{
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Кейс ' + (i + 1) + ' из ' + cards.length);
            dot.addEventListener('click', function() {{
              cards[i].scrollIntoView({{ behavior: 'smooth', inline: 'center', block: 'nearest' }});
            }});
            dotsWrap.appendChild(dot);
          }});

          var dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));
          var isTicking = false;

          function updateActiveDot() {{
            var gridRect = casesGrid.getBoundingClientRect();
            var gridCenter = gridRect.left + gridRect.width / 2;
            var closestIdx = 0;
            var minDiff = Infinity;

            cards.forEach(function(card, idx) {{
              var r = card.getBoundingClientRect();
              var cardCenter = r.left + r.width / 2;
              var diff = Math.abs(gridCenter - cardCenter);
              if (diff < minDiff) {{
                minDiff = diff;
                closestIdx = idx;
              }}
            }});

            dots.forEach(function(d, idx) {{
              d.classList.toggle('active', idx === closestIdx);
            }});
            isTicking = false;
          }}

          casesGrid.addEventListener('scroll', function() {{
            if (!isTicking) {{
              window.requestAnimationFrame(updateActiveDot);
              isTicking = true;
            }}
          }}, {{ passive: true }});
        }}
      }}

      // 3. Services Horizontal Carousel Dots
      var servicesBento = document.querySelector('.services__bento');
      var sDotsWrap = document.getElementById('services-dots');
      if (servicesBento && sDotsWrap) {{
        var sCards = Array.from(servicesBento.querySelectorAll('.scard'));
        if (sCards.length > 0) {{
          sDotsWrap.innerHTML = '';
          sCards.forEach(function(_, i) {{
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Сценарий ' + (i + 1) + ' из ' + sCards.length);
            dot.addEventListener('click', function() {{
              sCards[i].scrollIntoView({{ behavior: 'smooth', inline: 'center', block: 'nearest' }});
            }});
            sDotsWrap.appendChild(dot);
          }});

          var sDots = Array.from(sDotsWrap.querySelectorAll('.carousel-dot'));
          var sTicking = false;

          function updateServicesDot() {{
            var gridRect = servicesBento.getBoundingClientRect();
            var gridCenter = gridRect.left + gridRect.width / 2;
            var closestIdx = 0;
            var minDiff = Infinity;

            sCards.forEach(function(card, idx) {{
              var r = card.getBoundingClientRect();
              var cardCenter = r.left + r.width / 2;
              var diff = Math.abs(gridCenter - cardCenter);
              if (diff < minDiff) {{
                minDiff = diff;
                closestIdx = idx;
              }}
            }});

            sDots.forEach(function(d, idx) {{
              d.classList.toggle('active', idx === closestIdx);
            }});
            sTicking = false;
          }}

          servicesBento.addEventListener('scroll', function() {{
            if (!sTicking) {{
              window.requestAnimationFrame(updateServicesDot);
              sTicking = true;
            }}
          }}, {{ passive: true }});
        }}
      }}

      // Universal Adaptive Slider Controller
      function initAdaptiveSlider(cfg) {{
        var container = cfg.container;
        var dotsWrap = cfg.dotsWrap;
        var prevBtn = cfg.prevBtn;
        var nextBtn = cfg.nextBtn;
        var itemSelector = cfg.itemSelector;
        var labelPrefix = cfg.labelPrefix || 'Слайд';

        if (!container || !dotsWrap) return;
        var cards = Array.from(container.querySelectorAll(itemSelector));
        if (cards.length === 0) return;

        var isTicking = false;
        var currentSlide = 0;
        var totalSlides = 1;
        var isDesktop = window.innerWidth >= 1025;

        function calcTotalSlides() {{
          isDesktop = window.innerWidth >= 1025;
          if (isDesktop) {{
            return Math.max(1, Math.ceil(cards.length / 8));
          }} else {{
            return cards.length;
          }}
        }}

        function updateDots() {{
          totalSlides = calcTotalSlides();
          dotsWrap.innerHTML = '';

          for (var i = 0; i < totalSlides; i++) {{
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === currentSlide ? ' active' : '');
            dot.setAttribute('aria-label', labelPrefix + ' ' + (i + 1) + ' из ' + totalSlides);
            (function(idx) {{
              dot.addEventListener('click', function() {{
                goToSlide(idx);
              }});
            }})(i);
            dotsWrap.appendChild(dot);
          }}
          updateArrows();
        }}

        function updateArrows() {{
          if (!prevBtn || !nextBtn) return;
          if (totalSlides <= 1) {{
            prevBtn.setAttribute('hidden', '');
            nextBtn.setAttribute('hidden', '');
            prevBtn.disabled = true;
            nextBtn.disabled = true;
          }} else {{
            prevBtn.removeAttribute('hidden');
            nextBtn.removeAttribute('hidden');
            prevBtn.disabled = (currentSlide <= 0);
            nextBtn.disabled = (currentSlide >= totalSlides - 1);
            prevBtn.setAttribute('aria-disabled', currentSlide <= 0 ? 'true' : 'false');
            nextBtn.setAttribute('aria-disabled', currentSlide >= totalSlides - 1 ? 'true' : 'false');
          }}
        }}

        function goToSlide(idx) {{
          idx = Math.max(0, Math.min(totalSlides - 1, idx));
          currentSlide = idx;
          if (isDesktop) {{
            var maxScroll = container.scrollWidth - container.clientWidth;
            var targetScroll = totalSlides > 1 ? (idx / (totalSlides - 1)) * maxScroll : 0;
            container.scrollTo({{ left: targetScroll, behavior: 'smooth' }});
          }} else {{
            if (cards[idx]) {{
              cards[idx].scrollIntoView({{ behavior: 'smooth', inline: 'center', block: 'nearest' }});
            }}
          }}
          setActiveDot(idx);
          updateArrows();
        }}

        function setActiveDot(idx) {{
          currentSlide = idx;
          var dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));
          dots.forEach(function(d, i) {{
            d.classList.toggle('active', i === idx);
          }});
        }}

        function onScroll() {{
          if (isDesktop) {{
            var maxScroll = container.scrollWidth - container.clientWidth;
            if (maxScroll <= 0) {{
              setActiveDot(0);
            }} else {{
              var progress = container.scrollLeft / maxScroll;
              var slideIdx = Math.round(progress * (totalSlides - 1));
              setActiveDot(slideIdx);
            }}
          }} else {{
            var gridRect = container.getBoundingClientRect();
            var gridCenter = gridRect.left + gridRect.width / 2;
            var closestIdx = 0;
            var minDiff = Infinity;
            cards.forEach(function(card, idx) {{
              var r = card.getBoundingClientRect();
              var cardCenter = r.left + r.width / 2;
              var diff = Math.abs(gridCenter - cardCenter);
              if (diff < minDiff) {{
                minDiff = diff;
                closestIdx = idx;
              }}
            }});
            setActiveDot(closestIdx);
          }}
          updateArrows();
          isTicking = false;
        }}

        container.addEventListener('scroll', function() {{
          if (!isTicking) {{
            window.requestAnimationFrame(onScroll);
            isTicking = true;
          }}
        }}, {{ passive: true }});

        if (prevBtn) {{
          prevBtn.addEventListener('click', function() {{
            goToSlide(currentSlide - 1);
          }});
        }}
        if (nextBtn) {{
          nextBtn.addEventListener('click', function() {{
            goToSlide(currentSlide + 1);
          }});
        }}

        var resizeTimer;
        window.addEventListener('resize', function() {{
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function() {{
            var wasDesktop = isDesktop;
            var newIsDesktop = window.innerWidth >= 1025;
            if (wasDesktop !== newIsDesktop) {{
              currentSlide = 0;
              updateDots();
              goToSlide(0);
            }} else {{
              updateDots();
            }}
          }}, 150);
        }});

        updateDots();
      }}
{other_services_js}
    }});
  </script>


  <!-- Schema.org Microdata JSON-LD -->
  <!--email_off-->
  <script type="application/ld+json">
{schema_json_str}
  </script>
  <!--/email_off-->
</body>
</html>
"""
    return html_out


def build_service(slug: str, service_data: dict):
    out_dir = OUTPUT_BASE / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    page_html = generate_service_html(service_data)
    out_file.write_text(page_html, encoding="utf-8")
    print(f"✔ Generated: {out_file.relative_to(ROOT_DIR)} ({len(page_html)} bytes)")


def main():
    parser = argparse.ArgumentParser(description="Build service landing pages for ai-avtopilot.ru")
    parser.add_argument("--all", action="store_true", help="Build all services from data/services_data.json")
    parser.add_argument("--service", type=str, help="Build specific service by slug")
    args = parser.parse_args()

    if not DATA_PATH.exists():
        print(f"❌ Error: {DATA_PATH} not found", file=sys.stderr)
        sys.exit(1)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        services_db = json.load(f)

    if args.service:
        if args.service not in services_db:
            print(f"❌ Error: Service '{args.service}' not found in {DATA_PATH}", file=sys.stderr)
            sys.exit(1)
        build_service(args.service, services_db[args.service])
    elif args.all:
        for slug, data in services_db.items():
            build_service(slug, data)
        print(f"\n🎉 Successfully built all {len(services_db)} service landing pages!")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
