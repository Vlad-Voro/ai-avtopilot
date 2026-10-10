#!/usr/bin/env python3
"""Builds the services/ai-analytics/index.html production landing page for ai-avtopilot.ru.

Fully aligns with the canonical 9-block subpage architecture (Spec_ai_avtopilot.md Section 10):
- Zero AI-slop anti-fluff standard
- 1:1 design system integration (canonical CSS classes, no CSS drift)
- Verified Yandex Wordstat commercial semantics (платежный календарь, неснижаемый остаток, контроль цен)
- Zero layout shift (CLS = 0.000) with balanced 2-line typewriter phrases
- 100% compliant ROI calculator adhering to core mathematical engine
- Fully responsive FAQ accordion matching Schema.org FAQPage
- Live B2B Telemetry & Alert Simulator (Cash Flow, Safety Stock, Price Shield)
- Schema.org BreadcrumbList, SoftwareApplication, FAQPage
"""

import json
import os
import re
import sys
from bs4 import BeautifulSoup

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)
from other_services_block import render_other_services_section, get_other_services_carousel_js

INDEX_PATH = os.path.join(PROJECT_DIR, "index.html")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "services", "ai-analytics")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "index.html")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, "html.parser")

# 1. Update Head metadata
title_tag = soup.find("title")
if title_tag:
    title_tag.string = "Предиктивная аналитика 1С: платежный календарь, остатки и контроль цен | АвтоПилот"

desc_tag = soup.find("meta", attrs={"name": "description"})
if desc_tag:
    desc_tag["content"] = (
        "Предиктивная аналитика для 1С:ERP и УТ: платежный календарь, "
        "расчет неснижаемого остатка и контроль цен. Предотвращение кассовых разрывов за 10 дней."
    )

kw_tag = soup.find("meta", attrs={"name": "keywords"})
if kw_tag:
    kw_tag["content"] = (
        "платежный календарь 1с, управление запасами 1с, контроль цен поставщиков, "
        "расчет неснижаемого остатка, прогнозирование кассовых разрывов, ии аналитика для бизнеса, автопилот ии"
    )

canonical_tag = soup.find("link", attrs={"rel": "canonical"})
if canonical_tag:
    canonical_tag["href"] = "https://ai-avtopilot.ru/services/ai-analytics/"

# OG / Twitter
for prop, val in [
    ("og:title", "Предиктивная аналитика 1С: платежный календарь, остатки и контроль цен | АвтоПилот"),
    ("og:url", "https://ai-avtopilot.ru/services/ai-analytics/"),
    (
        "og:description",
        "Предиктивная аналитика для 1С:ERP и УТ: платежный календарь, "
        "расчет неснижаемого остатка и контроль цен. Предотвращение кассовых разрывов за 10 дней.",
    ),
    ("twitter:title", "Предиктивная аналитика 1С: платежный календарь, остатки и контроль цен | АвтоПилот"),
    (
        "twitter:description",
        "Предиктивная аналитика для 1С:ERP и УТ: платежный календарь, "
        "расчет неснижаемого остатка и контроль цен. Предотвращение кассовых разрывов за 10 дней.",
    ),
]:
    meta = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
    if meta:
        meta["content"] = val

# Schema.org JSON-LD
json_ld = soup.find("script", attrs={"type": "application/ld+json"})
if json_ld and json_ld.string:
    try:
        data = json.loads(json_ld.string)
        graph = data.get("@graph", [])

        # BreadcrumbList (3-level Silo)
        graph.append(
            {
                "@type": "BreadcrumbList",
                "@id": "https://ai-avtopilot.ru/services/ai-analytics/#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://ai-avtopilot.ru/services/"},
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "Предиктивная ИИ-аналитика 1С",
                        "item": "https://ai-avtopilot.ru/services/ai-analytics/",
                    },
                ],
            }
        )

        # SoftwareApplication
        graph.append(
            {
                "@type": "SoftwareApplication",
                "@id": "https://ai-avtopilot.ru/services/ai-analytics/#app",
                "name": "АвтоПилот: Предиктивная ИИ-аналитика 1С",
                "operatingSystem": "Windows, Linux (1C:Enterprise 8.3 On-Premise)",
                "applicationCategory": "BusinessApplication",
                "description": (
                    "Предиктивная ИИ-аналитика для 1С:ERP и УТ: автоматизация платежного календаря, "
                    "расчет неснижаемого остатка и контроль цен поставщиков."
                ),
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "RUB",
                    "name": "Бесплатный 30-минутный предиктивный аудит 1С",
                },
            }
        )

        # FAQPage
        graph.append(
            {
                "@type": "FAQPage",
                "@id": "https://ai-avtopilot.ru/services/ai-analytics/#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Нужно ли передавать финансовые данные и базу 1С в сторонние облачные сервисы?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Нет. Весь предиктивный контур развертывается в закрытом On-Premise контуре вашей компании (на вашем сервере). Базы 1С не публикуются в интернет, сырые данные защищены по 152-ФЗ и соглашению о коммерческой тайне (NDA).",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Как система подключается к 1С и замедляет ли она работу пользователей?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Подключение выполняется через типовой OData REST API или внешнее расширение (.cfe) в фоновом режиме. Опрос регистров происходит в непиковые интервалы без блокировки таблиц и с нулевым влиянием на скорость работы пользователей.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Какова точность прогноза кассовых разрывов при нерегулярных оплатах клиентов?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "ML-модель рассчитывает скоринг платежной дисциплины каждого дебитора на основе истории задержек оплат за 12–24 месяца. Точность прогнозирования дефицита ликвидности на горизонте 14 дней превышает 94%.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Что происходит при обнаружении завышения цен в накладной поставщика?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Агент сверяет каждую позицию УПД со спецификацией к договору. При обнаружении ценового дрейфа или скрытой наценки документ маркируется алертом, а ответственный закупщик и финансовый контролер получают уведомление в Telegram с указанием суммы переплаты.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Сколько времени занимает запуск пилотного мониторинга на реальных данных?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Развертывание первого рабочего модуля (например, умного платежного календаря или расчета страхового запаса) занимает от 10 до 14 рабочих дней под ключ.",
                        },
                    },
                ],
            }
        )

        data["@graph"] = graph
        json_ld.string = "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    except Exception as e:
        print(f"Error updating JSON-LD: {e}")

# 2. Block 1: #home (Hero)
hero_sec = soup.find("section", id="home")
if hero_sec:
    hero_inner = hero_sec.find("div", class_="hero__content")
    if hero_inner:
        badge_text = hero_inner.find("span", class_="hero__badge-text")
        if badge_text:
            badge_text.string = "Системы активны · Мониторинг аномалий 1С"

        h1 = hero_inner.find("h1")
        if h1:
            h1.clear()
            # Balanced short phrases (max 24 chars) to eliminate line wrapping jitter
            phrases_json = '["без кассовых разрывов", "с расчетом остатков и ROP", "с автоконтролем цен УПД", "в On-Premise контуре"]'
            h1.append(
                BeautifulSoup(
                    f'<span class="hero__title-static">Предиктивная аналитика для 1С </span>'
                    f'<span class="hero__title-accent-box">'
                    f'<span class="hero__title-accent" id="typed-text" data-phrases=\'{phrases_json}\'>без кассовых разрывов</span>'
                    f'<span aria-hidden="true" class="hero__cursor">|</span></span>',
                    "html.parser",
                )
            )

        sub = hero_inner.find("p", class_="hero__sub")
        if sub:
            sub.string = (
                "Автоматизация финансовой аналитики и платежного календаря 1С: "
                "упреждение кассовых разрывов за 14 дней, оптимизация остатков и контроль цен."
            )

        actions = hero_inner.find("div", class_="hero__actions")
        if actions:
            actions.clear()
            actions.append(
                BeautifulSoup(
                    '<a href="#contact" class="btn btn--primary" id="cta-main">Запустить предиктивный аудит</a>'
                    '<a href="#dashboard" class="btn btn--ghost">Смотреть демо алертов →</a>',
                    "html.parser",
                )
            )

        # Pre-populate KPI cards with domain metrics
        kpis = hero_inner.find("div", class_="hero__kpis")
        if kpis:
            kpis.clear()
            kpis.append(
                BeautifulSoup(
                    """
            <div class="kpi-card">
              <span class="kpi-card__num" data-count="14">14 дней</span>
              <span class="kpi-card__label">упреждение разрывов</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-card__num" data-count="32">−32%</span>
              <span class="kpi-card__label">неликвидов на складе</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-card__num" data-count="100">100%</span>
              <span class="kpi-card__label">контроль цен в УПД</span>
            </div>
            """,
                    "html.parser",
                )
            )

    # Pre-render Terminal content with clean domain log
    term_body = hero_sec.find("div", id="terminal-body")
    if term_body:
        term_body.clear()
        term_body.append(
            BeautifulSoup(
                """
          <div class="terminal__line"><span class="terminal__prompt">&gt;</span> <span style="color:var(--text-3);">[10:42:01]</span> <span style="color:var(--accent-1);font-weight:600;">[OData]</span> Подключение к 1С:ERP (200 OK)</div>
          <div class="terminal__line"><span class="terminal__prompt">&gt;</span> <span style="color:var(--text-3);">[10:42:02]</span> <span style="color:var(--accent-2);font-weight:600;">[CashFlow]</span> Прогноз ДДС на 30 дней: расчет рисков</div>
          <div class="terminal__line"><span class="terminal__prompt">&gt;</span> <span style="color:var(--text-3);">[10:42:04]</span> <span style="color:var(--green);font-weight:600;">[SafetyStock]</span> Пересчет ROP для 18 000 SKU завершен</div>
          <div class="terminal__line"><span class="terminal__prompt">&gt;</span> <span style="color:var(--text-3);">[10:42:06]</span> <span style="color:var(--accent-hot);font-weight:600;">[PriceShield]</span> Аудит входящих УПД: аномалий не выявлено</div>
        """,
                "html.parser",
            )
        )

    # Update Hero Agent Cards
    agent_cards = hero_sec.find("div", class_="hero__agent-cards")
    if agent_cards:
        agent_cards.clear()
        agent_cards.append(
            BeautifulSoup(
                """
          <div class="agent-card" data-agent="cashflow" role="button" tabindex="0" aria-label="Инспектировать агента ФинКонтроль">
            <div class="agent-card__icon">💸</div>
            <div class="agent-card__info">
              <span class="agent-card__name">Агент: ФинКонтроль (ДДС)</span>
              <span class="agent-card__status agent-card__status--live">Активен</span>
            </div>
            <div class="agent-card__bar"><div class="agent-card__fill" style="width:94%"></div></div>
          </div>
          <div class="agent-card" data-agent="warehouse" role="button" tabindex="0" aria-label="Инспектировать агента Склад">
            <div class="agent-card__icon">📦</div>
            <div class="agent-card__info">
              <span class="agent-card__name">Агент: Склад &amp; ROP</span>
              <span class="agent-card__status agent-card__status--live">Активен</span>
            </div>
            <div class="agent-card__bar"><div class="agent-card__fill" style="width:78%"></div></div>
          </div>
          <div class="agent-card" data-agent="prices" role="button" tabindex="0" aria-label="Инспектировать агента Аудит Цен">
            <div class="agent-card__icon">🛡️</div>
            <div class="agent-card__info">
              <span class="agent-card__name">Агент: Аудит Цен УПД</span>
              <span class="agent-card__status agent-card__status--live">Активен</span>
            </div>
            <div class="agent-card__bar"><div class="agent-card__fill" style="width:88%"></div></div>
          </div>
        """,
                "html.parser",
            )
        )

# 3. Block 2: #calculator (Canonical ROI & Loss Prevention Calculator)
calc_sec = soup.find("section", id="calculator")
if calc_sec:
    h2 = calc_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Калькулятор окупаемости предиктивной аналитики"

    tag = calc_sec.find("p", class_="section-tag")
    if tag:
        tag.string = "Экономический эффект"

    # Slider 1: Employees
    lbl_emp = calc_sec.find("label", attrs={"for": "slider-employees"})
    if lbl_emp:
        lbl_emp.clear()
        lbl_emp.append(
            BeautifulSoup(
                '<span>Аналитиков на сверке цен, остатков и ДДС</span><span class="roi-value-display" id="display-employees">2</span>',
                "html.parser",
            )
        )
    slider_emp = calc_sec.find("input", id="slider-employees")
    if slider_emp:
        slider_emp["value"] = "2"
        slider_emp["min"] = "1"
        slider_emp["max"] = "15"
        slider_emp["step"] = "1"
        slider_emp["aria-label"] = "Количество аналитиков"

    if slider_emp and slider_emp.parent:
        limits1 = slider_emp.parent.find("div", class_="roi-slider-limits")
        if limits1:
            limits1.clear()
            limits1.append(BeautifulSoup("<span>1 специалист</span><span>15 специалистов</span>", "html.parser"))

    # Slider 2: Hours
    lbl_hrs = calc_sec.find("label", attrs={"for": "slider-hours"})
    if lbl_hrs:
        lbl_hrs.clear()
        lbl_hrs.append(
            BeautifulSoup(
                '<span>Часов в неделю уходит на ручной аудит и таблицы</span><span class="roi-value-display" id="display-hours">20</span>',
                "html.parser",
            )
        )
    slider_hrs = calc_sec.find("input", id="slider-hours")
    if slider_hrs:
        slider_hrs["value"] = "20"
        slider_hrs["min"] = "1"
        slider_hrs["max"] = "40"
        slider_hrs["step"] = "1"
        slider_hrs["aria-label"] = "Часов в неделю на рутину"

    if slider_hrs and slider_hrs.parent:
        limits2 = slider_hrs.parent.find("div", class_="roi-slider-limits")
        if limits2:
            limits2.clear()
            limits2.append(BeautifulSoup("<span>1 час</span><span>40 часов</span>", "html.parser"))

    # Slider 3: Salary
    lbl_sal = calc_sec.find("label", attrs={"for": "slider-salary"})
    if lbl_sal:
        lbl_sal.clear()
        lbl_sal.append(
            BeautifulSoup(
                '<span>Средняя зарплата специалиста (руб/мес)</span><span class="roi-value-display" id="display-salary" style="white-space:nowrap;flex-shrink:0;margin-left:8px;">100 000</span>',
                "html.parser",
            )
        )
    slider_sal = calc_sec.find("input", id="slider-salary")
    if slider_sal:
        slider_sal["value"] = "100000"
        slider_sal["min"] = "40000"
        slider_sal["max"] = "250000"
        slider_sal["step"] = "5000"
        slider_sal["aria-label"] = "Средняя зарплата специалиста в рублях"

    if slider_sal and slider_sal.parent:
        limits3 = slider_sal.parent.find("div", class_="roi-slider-limits")
        if limits3:
            limits3.clear()
            limits3.append(BeautifulSoup("<span>40 000 ₽</span><span>250 000 ₽</span>", "html.parser"))

    # Initial fallback values adhering to core math: 2 emp * 100k * (20/160) * 12 = 300 000 ₽
    cost_el = calc_sec.find("span", id="roi-cost")
    if cost_el:
        cost_el.string = "300 000 ₽"
    save_el = calc_sec.find("span", id="roi-save")
    if save_el:
        save_el.string = "240 000 ₽"
    hours_el = calc_sec.find("span", id="roi-hours")
    if hours_el:
        hours_el.string = "2 080 часов"

    cta_block = calc_sec.find("div", class_="roi__cta-block")
    if cta_block:
        cta_block.clear()
        cta_block.append(
            BeautifulSoup(
                '<p>Хотите устранить потери ликвидности и переплаты поставщикам?</p><a class="btn btn--primary" href="#contact">Заказать предиктивный аудит 1С</a>',
                "html.parser",
            )
        )

# 4. Block 3: #compare (Pain vs Win)
compare_sec = soup.find("section", id="compare")
if compare_sec:
    h2 = compare_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Управление рисками предприятия: реактивный хаос vs предиктивный автопилот"
    grid = compare_sec.find("div", class_="compare__grid")
    if grid:
        grid.clear()
        grid.append(
            BeautifulSoup(
                """
        <div class="compare__card compare__card--pain" data-reveal>
          <div class="compare__badge">Сейчас (Excel + реактивный учет)</div>
          <div class="compare__icon">😰</div>
          <ul class="compare__list">
            <li><strong>О кассовом разрыве узнают накануне платежей:</strong> срочное привлечение овердрафтов по ставке 22%+ годовых.</li>
            <li><strong>Склад забит неликвидами:</strong> миллионы рублей заморожены в товарах группы Z, пока ходовые позиции попадают в Out-of-Stock.</li>
            <li><strong>Скрытый дрейф закупочных цен:</strong> бухгалтерия физически не успевает сверять номенклатурные цены в УПД с условиями договоров (переплата 2–4%).</li>
            <li><strong>Статичный платежный календарь:</strong> даты оплат переносятся вручную наугад без учета реальной платежной дисциплины дебиторов.</li>
            <li><strong>Запоздалая аналитика:</strong> финансовый директор видит кассовые дыры и убытки постфактум при закрытии месяца.</li>
          </ul>
        </div>
        <div class="compare__arrow" data-reveal>
          <div class="compare__arrow-line"></div>
          <span>→</span>
        </div>
        <div class="compare__card compare__card--win" data-reveal>
          <div class="compare__badge compare__badge--win">С предиктивной аналитикой АвтоПилот</div>
          <div class="compare__icon">🚀</div>
          <ul class="compare__list">
            <li><strong>Прогноз кассовых разрывов за 14–30 дней:</strong> модель ДДС заранее рассчитывает дефицит ликвидности и предлагает варианты маневрирования.</li>
            <li><strong>Динамический расчет неснижаемого остатка:</strong> пересчет точки заказа (ROP) и страхового запаса на основе вариации спроса и сбоев логистики.</li>
            <li><strong>100% автоконтроль цен поставщиков:</strong> алгоритмическая сверка входящих УПД с договорами и блокировка завышенных цен до проведения.</li>
            <li><strong>Предиктивный скоринг дебиторки:</strong> учет вероятности задержки оплат по каждому контрагенту на базе истории 1С.</li>
            <li><strong>Мгновенные Telegram-алерты:</strong> оповещение руководства об аномалиях ликвидности и рисках за 3 секунды.</li>
          </ul>
        </div>
        """,
                "html.parser",
            )
        )

# 5. Block 4: #services (6 modules with uniform cards)
services_sec = soup.find("section", id="services")
if services_sec:
    tag = services_sec.find("p", class_="section-tag")
    if tag:
        tag.string = "Модули предиктивного контура"
    h2 = services_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "6 модулей предиктивной аналитики для 1С и ERP"
    bento = services_sec.find("div", class_="services__bento")
    if bento:
        classes = bento.get("class", [])
        if "services__bento--static" not in classes:
            classes.append("services__bento--static")
            bento["class"] = classes
        bento.clear()
        bento.append(
            BeautifulSoup(
                """
        <div class="scard">
          <div class="scard__icon">💸</div>
          <h3 class="scard__title">Умный платежный календарь (Cash Flow ML)</h3>
          <p class="scard__desc">Непрерывный прогноз остатка на расчетных счетах на 14–30 дней вперед с учетом скоринга вероятности оплаты дебиторки клиентами.</p>
          <div class="scard__tags">
            <span>1С:ERP</span>
            <span>1С:КА</span>
            <span>Платежный календарь</span>
            <span>ДДС</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📦</div>
          <h3 class="scard__title">Расчет неснижаемого остатка и ROP</h3>
          <p class="scard__desc">Динамический расчет точки перезаказа (Reorder Point) и страхового запаса с защитой от Out-of-Stock и высвобождением замороженной оборотки.</p>
          <div class="scard__tags">
            <span>1С:УТ 11</span>
            <span>Safety Stock</span>
            <span>Точка заказа</span>
            <span>Склад</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">🛡️</div>
          <h3 class="scard__title">Контроль цен поставщиков (Price Shield)</h3>
          <p class="scard__desc">Автоматическая сверка номенклатурных цен входящей первички (УПД/счета) со спецификациями договоров и выявление скрытых наценок.</p>
          <div class="scard__tags">
            <span>1С:Бухгалтерия</span>
            <span>Аудит закупок</span>
            <span>УПД</span>
            <span>Спецификации</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📊</div>
          <h3 class="scard__title">Управление запасами и ABC/XYZ-анализ</h3>
          <p class="scard__desc">Ежедневный аудит неликвидов, раннее выявление залежалых партий товаров группы Z и автоматические рекомендации по своевременной уценке.</p>
          <div class="scard__tags">
            <span>ABC/XYZ</span>
            <span>Неликвиды</span>
            <span>Оборачиваемость</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📈</div>
          <h3 class="scard__title">Прогнозирование спроса и сезонности в 1С</h3>
          <p class="scard__desc">Машинное обучение на истории отгрузок с фильтрацией оптовых выбросов, учетом сезонных пиков и формированием точного плана закупок.</p>
          <div class="scard__tags">
            <span>ML-прогноз</span>
            <span>Сезонность</span>
            <span>План закупок</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📱</div>
          <h3 class="scard__title">Система предиктивных Telegram-алертов</h3>
          <p class="scard__desc">Мгновенные push-уведомления финансовому директору и закупщикам при обнаружении риска кассового разрыва или завышения цены в счете.</p>
          <div class="scard__tags">
            <span>Telegram Bot</span>
            <span>Push-алерты</span>
            <span>On-Premise 152-ФЗ</span>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 6. Block 5: #cases (Canonical case-card 1:1 with homepage)
cases_sec = soup.find("section", id="cases")
if cases_sec:
    h2 = cases_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Кейсы внедрения предиктивной аналитики"
    grid = cases_sec.find("div", class_="cases__grid")
    if grid:
        classes = grid.get("class", [])
        if "cases__grid--static" not in classes:
            classes.append("cases__grid--static")
            grid["class"] = classes
        grid.clear()
        grid.append(
            BeautifulSoup(
                """
        <div class="case-card case-card--retail">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--retail"></span>🛒 Федеральный дистрибьютор · 18 000 SKU</div>
          <h3 class="case-card__title">Оптимизация неснижаемого остатка и ликвидация out-of-stock</h3>
          <p class="case-card__desc">Внедрили алгоритм динамического расчета страхового запаса на данных 1С:УТ. Настроили <span class="case-highlight case-highlight--retail">предиктивный автозаказ поставщикам</span> с учетом вариативности спроса.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--gold">16.8 млн ₽</span>
              <span class="case-result__label">высвобождено оборотки</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--green">−74%</span>
              <span class="case-result__label">случаев Out-of-Stock</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--cyan">1.8 мес</span>
              <span class="case-result__label">окупаемость пилота</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:УТ 11</span><span>Safety Stock</span><span>ROP</span><span>Автозаказ</span></div>
        </div>

        <div class="case-card case-card--fintech">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--fintech"></span>🏢 Производственно-торговый холдинг · 140 поставщиков</div>
          <h3 class="case-card__title">Автоконтроль цен поставщиков и аудит первичных накладных</h3>
          <p class="case-card__desc">Подключили агента Price Shield к потоку входящих УПД в 1С:ERP. Настроили <span class="case-highlight case-highlight--fintech">автоматическую сверку со спецификациями</span> и блокировку скрытого повышения цен.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--green">5.2 млн ₽</span>
              <span class="case-result__label">предотвращено переплат</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--violet">100%</span>
              <span class="case-result__label">проверенной первички</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--gold">320%</span>
              <span class="case-result__label">ROI за 6 месяцев</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:ERP</span><span>Аудит цен</span><span>Спецификации</span><span>УПД</span></div>
        </div>

        <div class="case-card case-card--edi">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--edi"></span>🏪 Сеть оптово-розничных баз · 35 филиалов</div>
          <h3 class="case-card__title">Предиктивный платежный календарь и защита от кассовых разрывов</h3>
          <p class="case-card__desc">Связали базы 1С:КА и банковские выписки. Модель <span class="case-highlight case-highlight--edi">прогнозирует кассовые разрывы</span> на 14 дней вперед с учетом скоринга платежной дисциплины покупателей.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--green">0</span>
              <span class="case-result__label">кассовых разрывов за год</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--cyan">96.4%</span>
              <span class="case-result__label">точность прогноза ДДС</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--gold">14 дней</span>
              <span class="case-result__label">запуск первого модуля</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:КА 2</span><span>Платежный календарь</span><span>ДДС</span><span>Скоринг</span></div>
        </div>
        """,
                "html.parser",
            )
        )

# 7. Block 6: #faq (Dedicated questions and answers)
faq_sec = soup.find("section", id="faq")
if faq_sec:
    h2 = faq_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Часто задаваемые вопросы по предиктивной аналитике 1С"
    desc = faq_sec.find("p", class_="section-desc")
    if desc:
        desc.string = "Всё о безопасности 152-ФЗ, интеграции с 1С и точности прогнозных алгоритмов"

    faq_grid = faq_sec.find("div", class_="faq__grid")
    if faq_grid:
        faq_grid.clear()
        faq_grid.append(
            BeautifulSoup(
                """
        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Нужно ли передавать финансовые данные и базу 1С в сторонние облачные сервисы?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Нет. Весь предиктивный контур развертывается в закрытом On-Premise контуре вашей компании (на вашем сервере). Базы 1С не публикуются в интернет, сырые данные защищены по 152-ФЗ и соглашению о коммерческой тайне (NDA).</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Как система подключается к 1С и замедляет ли она работу пользователей?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Подключение выполняется через типовой OData REST API или внешнее расширение (.cfe) в фоновом режиме. Опрос регистров происходит в непиковые интервалы без блокировки таблиц и с нулевым влиянием на скорость работы пользователей.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Какова точность прогноза кассовых разрывов при нерегулярных оплатах клиентов?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>ML-модель рассчитывает скоринг платежной дисциплины каждого дебитора на основе истории задержек оплат за 12–24 месяца. Точность прогнозирования дефицита ликвидности на горизонте 14 дней превышает 94%.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Что происходит при обнаружении завышения цен в накладной поставщика?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Агент сверяет каждую позицию УПД со спецификацией к договору. При обнаружении ценового дрейфа или скрытой наценки документ маркируется алертом, а ответственный закупщик и финансовый контролер получают уведомление в Telegram с указанием суммы переплаты.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Сколько времени занимает запуск пилотного мониторинга на реальных данных?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Развертывание первого рабочего модуля (например, умного платежного календаря или расчета страхового запаса) занимает от 10 до 14 рабочих дней под ключ.</p>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 8. Block 7: #dashboard (Telemetry & Alert Simulator)
dash_sec = soup.find("section", id="dashboard")
if dash_sec:
    badge_text = dash_sec.find("span", class_="hero__badge-text")
    if badge_text:
        badge_text.string = "Системы активны · Мониторинг аномалий 1С"
    h2 = dash_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Интерактивный симулятор предиктивных алертов"

    dash_grid = dash_sec.find("div", class_="dashboard__grid")
    if dash_grid:
        dash_grid.clear()
        dash_grid.append(
            BeautifulSoup(
                """
        <div class="dashboard__main">
          <div class="dash-card" style="padding:24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-glow);">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent-1),var(--accent-2));display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;box-shadow:0 0 15px rgba(99,102,241,0.5);">🧠</span>
                <div>
                  <strong style="color:var(--text-1);display:block;font-size:0.95rem;font-family:var(--font-head);">АвтоПилот · Предиктив-Бот</strong>
                  <span style="color:var(--green);font-size:0.75rem;font-family:var(--font-mono);">● мониторинг активен (1С:ERP)</span>
                </div>
              </div>
              <div class="phone-sim-tabs" style="display:flex;gap:8px;">
                <button type="button" class="btn btn--ghost sim-tab-btn active" data-sim="cashflow" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">💸 Платежный календарь</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="stock" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">📦 Склад и ROP</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="prices" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">🛡️ Аудит цен</button>
              </div>
            </div>
            
            <div style="background:#08080e;border:1px solid var(--border);border-radius:var(--radius-sm);padding:22px;font-family:var(--font-mono);font-size:0.9rem;line-height:1.7;color:var(--text-1);min-height:230px;">
              <!-- Screen 1: Cash Flow -->
              <div class="sim-screen" id="sim-cashflow">
                <div style="color:var(--accent-1);font-weight:700;margin-bottom:10px;font-size:0.95rem;">⚠️ АЛЕРТ: РИСК КАССОВОГО РАЗРЫВА ЧЕРЕЗ 11 ДНЕЙ</div>
                <div>• <strong>Дата прогнозируемого дефицита:</strong> 18 октября</div>
                <div>• <strong>Расчетный кассовый разрыв:</strong> <span style="color:#ef4444;font-weight:700;">-2 450 000 ₽</span></div>
                <div>• <strong>Причина:</strong> плановый платеж по лизингу + задержка оплаты от ООО «СнабСервис» (скоринг оплаты 42%)</div>
                <div style="margin:10px 0;border-top:1px dashed rgba(255,255,255,0.12);"></div>
                <div style="color:var(--green);font-weight:700;">💡 РЕКОМЕНДАЦИЯ АВТОПИЛОТ:</div>
                <div>1. Сдвинуть выплату по заявке #884 поставщику «МеталлТрейд» на 22 октября (согласована отсрочка).</div>
                <div>2. Отправить автонапоминание дебитору «СнабСервис» по ЭДО. Риск разрыва нейтрализуется.</div>
              </div>
              
              <!-- Screen 2: Stock -->
              <div class="sim-screen" id="sim-stock" style="display:none;">
                <div style="color:var(--accent-2);font-weight:700;margin-bottom:10px;font-size:0.95rem;">📦 ДИНАМИЧЕСКИЙ SAFETY STOCK &amp; ТОЧКА ЗАКАЗА</div>
                <div>• <strong>Артикул:</strong> SKU-44019 (Кабель силовой ВВГнг-LS 3x2.5)</div>
                <div>• <strong>Текущий остаток:</strong> 14 бухт (Ниже точки заказа ROP: <span style="color:#eab308;font-weight:700;">32 бухты</span>)</div>
                <div>• <strong>Плечо поставки (Lead Time):</strong> 7 рабочих дней (поставщик «КабельПром»)</div>
                <div>• <strong>Прогнозируемый спрос:</strong> 4.5 бухты/сутки (Риск Out-of-Stock через 3 дня)</div>
                <div style="margin:10px 0;border-top:1px dashed rgba(255,255,255,0.12);"></div>
                <div style="color:var(--green);font-weight:700;">✅ ДЕЙСТВИЕ: Сформирован проект автозаказа в 1С:УТ на 50 бухт.</div>
              </div>
              
              <!-- Screen 3: Prices -->
              <div class="sim-screen" id="sim-prices" style="display:none;">
                <div style="color:var(--accent-hot);font-weight:700;margin-bottom:10px;font-size:0.95rem;">🛡️ ВЫЯВЛЕНА ЦЕНОВАЯ АНОМАЛИЯ В НАКЛАДНОЙ УПД</div>
                <div>• <strong>Документ:</strong> Входящая УПД №491 от ООО «ПромСнаб-М»</div>
                <div>• <strong>Позиция:</strong> «Арматура А500С 12мм» (Количество: 20 т)</div>
                <div>• <strong>Цена в накладной:</strong> <span style="color:#ef4444;font-weight:700;">58 200 ₽/т</span></div>
                <div>• <strong>Цена по спецификации:</strong> <span style="color:var(--green);font-weight:700;">53 200 ₽/т</span> (+9.4% переплата)</div>
                <div>• <strong>Сумма переплаты по строке:</strong> <span style="color:#ef4444;font-weight:700;">100 000 ₽</span></div>
                <div style="margin:10px 0;border-top:1px dashed rgba(255,255,255,0.12);"></div>
                <div style="color:var(--accent-1);font-weight:700;">🛑 ДЕЙСТВИЕ: Проведение УПД в 1С приостановлено, алерт отправлен в Telegram закупщику.</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard__side">
          <div class="dash-card dash-card--board">
            <div class="dash-card__header">
              <span class="dash-card__title">Предиктивные события 1С</span>
              <span class="dash-card__live"><span class="pulse-dot"></span>Live</span>
            </div>
            <div class="board-panels">
              <div class="log" id="analytics-event-log">
                <div class="log-item log-item--default">
                  <span class="log-item__time">10:42:01</span>
                  <span class="log-item__text"><strong style="color:var(--accent-1);">[OData]</strong> Опрос регистра «Заявки на расход ДС»</span>
                </div>
                <div class="log-item log-item--warn">
                  <span class="log-item__time">10:42:02</span>
                  <span class="log-item__text"><strong style="color:var(--accent-2);">[CashFlow ML]</strong> Баланс ДДС на 30 дней: найден разрыв</span>
                </div>
                <div class="log-item log-item--success">
                  <span class="log-item__time">10:42:04</span>
                  <span class="log-item__text"><strong style="color:var(--green);">[Safety Stock]</strong> Пересчет ROP для 18 000 SKU</span>
                </div>
                <div class="log-item log-item--warn">
                  <span class="log-item__time">10:42:06</span>
                  <span class="log-item__text"><strong style="color:var(--accent-hot);">[Price Shield]</strong> УПД №491: заблокирована переплата 100 000 ₽</span>
                </div>
                <div class="log-item log-item--success">
                  <span class="log-item__time">10:42:07</span>
                  <span class="log-item__text"><strong style="color:var(--text-3);">[Telegram Bot]</strong> Алерты доставлены CFO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 9. Block 8: #contact (Canonical form)
contact_sec = soup.find("section", id="contact")
if contact_sec:
    h2 = contact_sec.find("h2", class_="contact__title")
    if h2:
        h2.string = "Заказать бесплатный предиктивный аудит 1С"
    desc = contact_sec.find("p", class_="contact__desc")
    if desc:
        desc.string = (
            "За 30 минут разберем ваши базы 1С: оценим риск кассовых разрывов в платежном календаре, "
            "рассчитаем потенциал высвобождения оборотки на складе и покажем, где бизнес переплачивает поставщикам."
        )

# 9.5 Add Other Services internal linking block below contact
contact_sec = soup.find("section", id="contact")
if contact_sec:
    other_section_soup = BeautifulSoup(render_other_services_section("ai-analytics"), "html.parser")
    contact_sec.insert_after(other_section_soup)

# 10. Add Simulator & FAQ delegated scripts at the end of body
body = soup.find("body")
if body:
    sim_script = BeautifulSoup(
        f"""
    <script>
    document.addEventListener('DOMContentLoaded', function() {{
      // 1. Simulator tab switching
      var tabs = document.querySelectorAll('.sim-tab-btn');
      var screens = {{
        'cashflow': document.getElementById('sim-cashflow'),
        'stock': document.getElementById('sim-stock'),
        'prices': document.getElementById('sim-prices')
      }};
      
      tabs.forEach(function(tab) {{
        tab.addEventListener('click', function() {{
          var target = tab.getAttribute('data-sim');
          tabs.forEach(function(t) {{ t.classList.remove('active'); t.style.borderColor = 'rgba(99,102,241,0.3)'; }});
          tab.classList.add('active');
          tab.style.borderColor = 'var(--accent-1)';
          
          Object.keys(screens).forEach(function(k) {{
            if (screens[k]) {{
              screens[k].style.display = (k === target) ? 'block' : 'none';
            }}
          }});
        }});
      }});
{get_other_services_carousel_js()}
    }});
    </script>
    """,
        "html.parser",
    )
    body.append(sim_script)


final_html = str(soup)

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(final_html)

print(f"Generated {OUTPUT_PATH} ({len(final_html)} bytes)")
