#!/usr/bin/env python3
"""Builds the automated-reporting/index.html production landing page for ai-avtopilot.ru.

Fully aligns with the 8-block canonical main page architecture, with:
- Zero AI-slop anti-fluff standard
- 1:1 design system integration (canonical CSS classes)
- Interactive ROI calculator & Telegram phone simulator
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
OUTPUT_DIR = os.path.join(PROJECT_DIR, "services", "automated-reporting")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "index.html")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, "html.parser")

# 1. Update Head metadata
title_tag = soup.find("title")
if title_tag:
    title_tag.string = "Отчеты по продажам, остаткам и P&L из 1С в Telegram | АвтоПилот"

desc_tag = soup.find("meta", attrs={"name": "description"})
if desc_tag:
    desc_tag["content"] = (
        "Автоматический сбор управленческой аналитики из 1С:ERP, УТ, КА в Telegram и Email: "
        "сводки продаж, P&L (ОПиУ), остатки и алерты кассовых разрывов за 10 дней."
    )

canonical_tag = soup.find("link", attrs={"rel": "canonical"})
if canonical_tag:
    canonical_tag["href"] = "https://ai-avtopilot.ru/services/automated-reporting/"

# OG / Twitter
for prop, val in [
    ("og:title", "Отчеты по продажам, остаткам и P&L из 1С в Telegram | АвтоПилот"),
    ("og:url", "https://ai-avtopilot.ru/services/automated-reporting/"),
    (
        "og:description",
        "Автоматический сбор управленческой аналитики из 1С:ERP, УТ, КА в Telegram и Email: "
        "сводки продаж, P&L (ОПиУ), остатки и алерты кассовых разрывов за 10 дней.",
    ),
    ("twitter:title", "Отчеты по продажам, остаткам и P&L из 1С в Telegram | АвтоПилот"),
    (
        "twitter:description",
        "Автоматический сбор управленческой аналитики из 1С:ERP, УТ, КА в Telegram и Email: "
        "сводки продаж, P&L (ОПиУ), остатки и алерты кассовых разрывов за 10 дней.",
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
                "@id": "https://ai-avtopilot.ru/services/automated-reporting/#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": "Услуги", "item": "https://ai-avtopilot.ru/services/"},
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "Автоотчетность и P&L из 1С",
                        "item": "https://ai-avtopilot.ru/services/automated-reporting/",
                    },
                ],
            }
        )

        # SoftwareApplication
        graph.append(
            {
                "@type": "SoftwareApplication",
                "@id": "https://ai-avtopilot.ru/services/automated-reporting/#app",
                "name": "АвтоПилот: Управленческая автоотчетность 1С",
                "operatingSystem": "Windows, Linux (1C:Enterprise 8.3)",
                "applicationCategory": "BusinessApplication",
                "description": "Автоматический сбор управленческой аналитики из 1С:ERP, УТ, КА в Telegram и Email: сводки продаж, P&L (ОПиУ), остатки и алерты кассовых разрывов за 10 дней.",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "RUB",
                    "name": "Бесплатный 30-минутный аудит 1С-отчетности",
                },
            }
        )

        # FAQPage
        graph.append(
            {
                "@type": "FAQPage",
                "@id": "https://ai-avtopilot.ru/services/automated-reporting/#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Нужно ли дорабатывать или снимать 1С с типовой поддержки?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Нет. Агент подключается через внешнюю обработку (.epf) или внешнее расширение (.cfe). Конфигурация остается полностью типовой и обновляется штатными средствами без ограничений.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Как считается себестоимость в P&L до официального закрытия месяца?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Используется оперативный расчет по методу ФИФО или средней скользящей себестоимости на основе регистров партий и движений товаров. После регламентного закрытия месяца бухгалтерией агент автоматически пересчитывает исторические данные.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Как обеспечивается безопасность финансовых данных по 152-ФЗ?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Агент развертывается в закрытом On-Premise контуре вашей компании (на вашем сервере). Базы 1С не открываются в интернет, сырые данные не передаются в сторонние облачные сервисы. Доступ к боту строго ограничен белым списком Telegram ID топ-менеджеров.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Что если учет ведется в нескольких разных базах 1С?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Агент умеет одновременно опрашивать несколько баз (например, 1С:УТ по торговле и 1С:Бухгалтерию по расходам), сопоставлять справочники номенклатуры и автоматически исключать внутригрупповые обороты (интеркампани).",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Сколько времени занимает внедрение первого рабочего отчета?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Развертывание агента и запуск первого рабочего пилота утренней сводки в Telegram занимает от 7 до 14 рабочих дней под ключ.",
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
            badge_text.string = "Системы активны · Автоотчеты в 09:00"

        h1 = hero_inner.find("h1")
        if h1:
            h1.clear()
            phrases_json = '["каждое утро в Telegram в 09:00", "на автопилоте без Excel", "с расчетом P&L за секунды", "без ожидания закрытия месяца"]'
            h1.append(
                BeautifulSoup(
                    f'<span class="hero__title-static">Сводные отчеты по продажам, остаткам и P&amp;L </span>'
                    f'<span class="hero__title-accent-box">'
                    f'<span class="hero__title-accent" id="typed-text" data-phrases=\'{phrases_json}\'>каждое утро в Telegram в 09:00</span>'
                    f'<span aria-hidden="true" class="hero__cursor">|</span></span>',
                    "html.parser",
                )
            )

        # Replace generic hero subtitle!
        sub = hero_inner.find("p", class_="hero__sub")
        if sub:
            sub.string = (
                "Автосбор управленческой отчетности и P&L из любых баз 1С. "
                "Ежедневные утренние сводки продаж и алерты по рискам в Telegram."
            )

        actions = hero_inner.find("div", class_="hero__actions")
        if actions:
            actions.clear()
            actions.append(
                BeautifulSoup(
                    '<a href="#contact" class="btn btn--primary" id="cta-main">Запустить автоотчетность</a>'
                    '<a href="#dashboard" class="btn btn--ghost">Смотреть демо-сводку →</a>',
                    "html.parser",
                )
            )

        metrics = hero_inner.find("div", class_="hero__metrics")
        if metrics:
            metrics.clear()
            metrics.append(
                BeautifulSoup(
                    """
            <div class="hmetric">
              <span class="hmetric__num">09:00</span>
              <span class="hmetric__label">утренний отчет в Telegram</span>
            </div>
            <div class="hmetric__sep"></div>
            <div class="hmetric">
              <span class="hmetric__num">0 часов</span>
              <span class="hmetric__label">ручной рутины в Excel</span>
            </div>
            <div class="hmetric__sep"></div>
            <div class="hmetric">
              <span class="hmetric__num">10 дней</span>
              <span class="hmetric__label">запуск пилота в контуре</span>
            </div>
            """,
                    "html.parser",
                )
            )

# 3. Block 2: #calculator (ROI)
calc_sec = soup.find("section", id="calculator")
if calc_sec:
    h2 = calc_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Калькулятор окупаемости автоотчетности"

    lbl_emp = calc_sec.find("label", attrs={"for": "slider-employees"})
    if lbl_emp:
        lbl_emp.clear()
        lbl_emp.append(
            BeautifulSoup(
                '<span>Экономистов и аналитиков на сведении отчетов</span><span class="roi-value-display" id="display-employees">2</span>',
                "html.parser",
            )
        )
    slider_emp = calc_sec.find("input", id="slider-employees")
    if slider_emp:
        slider_emp["value"] = "2"
        slider_emp["max"] = "15"

    lbl_hrs = calc_sec.find("label", attrs={"for": "slider-hours"})
    if lbl_hrs:
        lbl_hrs.clear()
        lbl_hrs.append(
            BeautifulSoup(
                '<span>Часов в неделю тратят на сведение P&amp;L</span><span class="roi-value-display" id="display-hours">20</span>',
                "html.parser",
            )
        )

    lbl_sal = calc_sec.find("label", attrs={"for": "slider-salary"})
    if lbl_sal:
        lbl_sal.clear()
        lbl_sal.append(
            BeautifulSoup(
                '<span>Средняя зарплата специалиста (руб/мес)</span><span class="roi-value-display" id="display-salary" style="white-space:nowrap;flex-shrink:0;margin-left:8px;">90 000</span>',
                "html.parser",
            )
        )
    slider_sal = calc_sec.find("input", id="slider-salary")
    if slider_sal:
        slider_sal["value"] = "90000"
        slider_sal["min"] = "40000"
        slider_sal["max"] = "250000"

    # Set initial SSR fallback values
    cost_el = calc_sec.find("span", id="roi-cost")
    if cost_el:
        cost_el.string = "270 000 ₽"
    save_el = calc_sec.find("span", id="roi-save")
    if save_el:
        save_el.string = "216 000 ₽"
    hours_el = calc_sec.find("span", id="roi-hours")
    if hours_el:
        hours_el.string = "2 080 часов"

    cta_block = calc_sec.find("div", class_="roi__cta-block")
    if cta_block:
        cta_block.clear()
        cta_block.append(
            BeautifulSoup(
                '<p>Хотите убрать ручной сбор таблиц в вашей компании?</p><a class="btn btn--primary" href="#contact">Заказать аудит 1С-отчетности</a>',
                "html.parser",
            )
        )

# 4. Block 3: #compare (Canonical cards & equal heights)
compare_sec = soup.find("section", id="compare")
if compare_sec:
    h2 = compare_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Как формируется управленка: ручной хаос vs автопилот"
    grid = compare_sec.find("div", class_="compare__grid")
    if grid:
        grid.clear()
        grid.append(
            BeautifulSoup(
                """
        <div class="compare__card compare__card--pain" data-reveal>
          <div class="compare__badge">Сейчас (Excel + 1С)</div>
          <div class="compare__icon">😰</div>
          <ul class="compare__list">
            <li><strong>P&amp;L собирается к 15–20 числу:</strong> стратегические решения принимаются вслепую на устаревших цифрах.</li>
            <li><strong>«Бумажная» прибыль есть, а денег нет:</strong> путаница между начисленной прибылью (P&amp;L) и кассовыми разрывами (ДДС).</li>
            <li><strong>Ошибки в VLOOKUP и связях таблиц:</strong> риск случайной выплаты дивидендов из оборотных средств.</li>
            <li><strong>Зависшие миллионы на складе:</strong> о неликвидах узнают постфактум раз в год во время плановой ревизии.</li>
            <li><strong>Руководитель привязан к офису:</strong> посмотреть реальную маржинальность со смартфона вне офиса невозможно.</li>
          </ul>
        </div>
        <div class="compare__arrow" data-reveal>
          <div class="compare__arrow-line"></div>
          <span>→</span>
        </div>
        <div class="compare__card compare__card--win" data-reveal>
          <div class="compare__badge compare__badge--win">С агентами АвтоПилот</div>
          <div class="compare__icon">🚀</div>
          <ul class="compare__list">
            <li><strong>P&amp;L рассчитывается ежедневно:</strong> утренняя сводка маржи и прибыли готова в Telegram в 09:00.</li>
            <li><strong>Сквозная связка P&amp;L и ДДС:</strong> платежный календарь предупреждает о рисках кассовых разрывов за 10 дней.</li>
            <li><strong>100% точность регистров 1С:</strong> исключены человеческий фактор, опечатки и ручные переносы ячеек.</li>
            <li><strong>Упреждающие алерты по неликвидам:</strong> ежедневные уведомления о зависших позициях и просроченной дебиторке.</li>
            <li><strong>Вся картина бизнеса в смартфоне:</strong> закрытый защищенный бот доступен владельцу в любой точке мира.</li>
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
        tag.string = "Модули и сценарии"
    h2 = services_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "6 модулей автоматической управленческой отчетности"
    bento = services_sec.find("div", class_="services__bento")
    if bento:
        bento.clear()
        bento.append(
            BeautifulSoup(
                """
        <div class="scard">
          <div class="scard__icon">📊</div>
          <h3 class="scard__title">Ежедневная утренняя сводка продаж</h3>
          <p class="scard__desc">Выручка за вчера, факт выполнения плана в %, средний чек, маржинальность дня и топ менеджеров по отгрузкам к 09:00.</p>
          <div class="scard__tags">
            <span>1С:УТ 11</span>
            <span>1С:КА 2</span>
            <span>План/Факт</span>
            <span>Telegram</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📈</div>
          <h3 class="scard__title">Управленческий P&amp;L (ОПиУ) в реальном времени</h3>
          <p class="scard__desc">Расчет чистой прибыли и EBITDA методом начисления (Выручка - Себестоимость ФИФО - OPEX) без ожидания закрытия месяца бухгалтерией.</p>
          <div class="scard__tags">
            <span>1С:ERP</span>
            <span>1С:БП 3.0</span>
            <span>EBITDA</span>
            <span>Маржинальность</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📦</div>
          <h3 class="scard__title">Контроль остатков и неликвидов</h3>
          <p class="scard__desc">Анализ оборачиваемости товарных позиций, аудит замороженных в запасах миллионов и упреждающие алерты риска Out-of-Stock.</p>
          <div class="scard__tags">
            <span>Склад</span>
            <span>Маркетплейсы</span>
            <span>Неликвиды</span>
            <span>Резервы</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">💸</div>
          <h3 class="scard__title">Прогноз кассовых разрывов и дебиторка</h3>
          <p class="scard__desc">Интерактивный платежный календарь ДДС на 14 дней вперед, реестр старения дебиторки и автоматические напоминания по должникам.</p>
          <div class="scard__tags">
            <span>ДДС</span>
            <span>Платежный календарь</span>
            <span>Дебиторка</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">🔄</div>
          <h3 class="scard__title">Консолидация нескольких баз (Интеркампани)</h3>
          <p class="scard__desc">Сведение финансовой аналитики группы компаний из разных юридических лиц с автоматическим исключением межфирменных оборотов.</p>
          <div class="scard__tags">
            <span>Холдинг</span>
            <span>Мультибаза</span>
            <span>Элиминация</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📱</div>
          <h3 class="scard__title">Доставка в удобные каналы руководителя</h3>
          <p class="scard__desc">Закрытый защищенный Telegram-бот с персональным доступом, рассылка PDF/Excel на Email и интерактивный живой веб-дашборд.</p>
          <div class="scard__tags">
            <span>Telegram API</span>
            <span>Email PDF</span>
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
        h2.string = "Кейсы внедрения управленческой автоотчетности"
    grid = cases_sec.find("div", class_="cases__grid")
    if grid:
        grid.clear()
        grid.append(
            BeautifulSoup(
                """
        <div class="case-card case-card--fintech">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--fintech"></span>🏪 Оптовый дистрибьютор · 3 базы 1С</div>
          <h3 class="case-card__title">Консолидация P&amp;L и остатков холдинга в Telegram</h3>
          <p class="case-card__desc">Связали базы 1С:УТ и 1С:БП через агента. Настроили <span class="case-highlight case-highlight--fintech">автоматическое вычитание интеркампани</span> и утреннюю сводку маржи генеральному директору.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--cyan">2 ч</span>
              <span class="case-result__label">вместо 18 дней на P&amp;L</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--green">55 ч/мес</span>
              <span class="case-result__label">высвобождено у CFO</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--gold">18 дней</span>
              <span class="case-result__label">окупаемость пилота</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:УТ</span><span>1С:БП</span><span>Интеркампани</span><span>P&amp;L</span></div>
        </div>

        <div class="case-card case-card--retail">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--retail"></span>🛒 Розничная сеть · 45 магазинов</div>
          <h3 class="case-card__title">Предиктивный платежный календарь и защита от кассовых разрывов</h3>
          <p class="case-card__desc">Объединили потоки данных из 1С:Розница и банковских выписок. Запустили <span class="case-highlight case-highlight--retail">предиктивный платежный календарь</span> с алертами неликвидных остатков.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--green">0</span>
              <span class="case-result__label">кассовых разрывов</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--gold">4.2 млн ₽</span>
              <span class="case-result__label">выведено из неликвида</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--violet">340%</span>
              <span class="case-result__label">ROI за 1-й квартал</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:Розница</span><span>ДДС</span><span>Платежный календарь</span></div>
        </div>

        <div class="case-card case-card--edi">
          <div class="case-card__industry"><span class="case-card__badge-dot case-card__badge-dot--edi"></span>🏭 Производственное предприятие · 1С:ERP</div>
          <h3 class="case-card__title">Оперативный расчет фактической себестоимости и маржи партий</h3>
          <p class="case-card__desc">Подключили агента к регистрам выпуска продукции. Руководство видит <span class="case-highlight case-highlight--edi">фактическую маржинальность</span> каждой спецификации до момента отгрузки клиенту.</p>
          <div class="case-card__results">
            <div class="case-result">
              <span class="case-result__num case-num--green">+4.3%</span>
              <span class="case-result__label">рентабельность сделок</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--cyan">&lt; 1 мин</span>
              <span class="case-result__label">калькуляция маржи</span>
            </div>
            <div class="case-result">
              <span class="case-result__num case-num--gold">14 дней</span>
              <span class="case-result__label">запуск без простоя</span>
            </div>
          </div>
          <div class="case-card__tags"><span>1С:ERP</span><span>ФИФО</span><span>Маржинальность</span></div>
        </div>
        """,
                "html.parser",
            )
        )

# 7. Block 6: #faq (Dedicated questions and answers, working accordion)
faq_sec = soup.find("section", id="faq")
if faq_sec:
    h2 = faq_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Часто задаваемые вопросы по автоотчетности"
    desc = faq_sec.find("p", class_="section-desc")
    if desc:
        desc.string = "Всё, что важно знать о безопасности, интеграции с 1С и методике расчетов"

    # Find the faq grid in the original page structure
    faq_grid = faq_sec.find("div", class_="faq__grid")
    if faq_grid:
        faq_grid.clear()
        faq_grid.append(
            BeautifulSoup(
                """
        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Нужно ли дорабатывать или снимать 1С с типовой поддержки?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Нет. Агент подключается через внешнюю обработку (.epf) или внешнее расширение (.cfe). Конфигурация остается полностью типовой и обновляется штатными средствами без ограничений.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Как считается себестоимость в P&amp;L до официального закрытия месяца?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Используется оперативный расчет по методу ФИФО или средней скользящей себестоимости на основе регистров партий и движений товаров. После регламентного закрытия месяца бухгалтерией агент автоматически пересчитывает исторические данные.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Как обеспечивается безопасность финансовых данных по 152-ФЗ?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Агент развертывается в закрытом On-Premise контуре вашей компании (на вашем сервере). Базы 1С не открываются в интернет, сырые данные не передаются в сторонние облачные сервисы. Доступ к боту строго ограничен белым списком Telegram ID топ-менеджеров.</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Что если учет ведется в нескольких разных базах 1С (Интеркампани)?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Агент умеет одновременно опрашивать несколько баз (например, 1С:УТ по торговле и 1С:Бухгалтерию по расходам), сопоставлять справочники номенклатуры и автоматически исключать внутригрупповые обороты (интеркампани).</p>
            </div>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-item__header" aria-expanded="false">
            <span class="faq-item__question">Сколько времени занимает внедрение первого рабочего отчета?</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>Развертывание агента и запуск первого рабочего пилота утренней сводки в Telegram занимает от 7 до 14 рабочих дней под ключ.</p>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 8. Block 7: #dashboard (Interactive Telegram Simulator without extra squeezed CTA)
dash_sec = soup.find("section", id="dashboard")
if dash_sec:
    badge_text = dash_sec.find("span", class_="hero__badge-text")
    if badge_text:
        badge_text.string = "Системы активны · Автоотчеты в 09:00"
    h2 = dash_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Попробуйте утренний отчет руководителя в действии"

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
                <span style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent-1),var(--accent-2));display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;box-shadow:0 0 15px rgba(99,102,241,0.5);">🤖</span>
                <div>
                  <strong style="color:var(--text-1);display:block;font-size:0.95rem;font-family:var(--font-head);">АвтоПилот · ФинБот</strong>
                  <span style="color:var(--green);font-size:0.75rem;font-family:var(--font-mono);">● бот онлайн (1С:ERP)</span>
                </div>
              </div>
              <div class="phone-sim-tabs" style="display:flex;gap:8px;">
                <button type="button" class="btn btn--ghost sim-tab-btn active" data-sim="sales" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">📊 Продажи</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="pnl" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">📈 P&amp;L (ОПиУ)</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="risks" style="min-height:44px;padding:10px 16px;font-size:0.82rem;font-weight:600;display:inline-flex;align-items:center;">⚠️ Риски</button>
              </div>
            </div>
            
            <div style="background:#08080e;border:1px solid var(--border);border-radius:var(--radius-sm);padding:22px;font-family:var(--font-mono);font-size:0.9rem;line-height:1.7;color:var(--text-1);min-height:230px;">
              <!-- Screen 1: Sales -->
              <div class="sim-screen" id="sim-sales">
                <div style="color:var(--accent-1);font-weight:700;margin-bottom:10px;font-size:0.95rem;">📊 СВОДКА ПРОДАЖ ЗА ВЧЕРА (09:00 МСК)</div>
                <div>• <strong>Выручка:</strong> <span style="color:var(--green);font-weight:700;">1 840 000 ₽</span> <span style="color:var(--green);font-size:0.85rem;">(↑ 12% к плану)</span></div>
                <div>• <strong>Валовая прибыль:</strong> 524 000 ₽ (Маржинальность: <strong style="color:var(--accent-2);">28.5%</strong>)</div>
                <div>• <strong>Чеков / отгрузок:</strong> 46 (Средний чек: 40 000 ₽)</div>
                <div style="margin:10px 0;border-top:1px dashed rgba(255,255,255,0.12);"></div>
                <div>🏆 <strong>Лидер продаж:</strong> Иванов А. (480 000 ₽, 12 сделок)</div>
                <div>⚠️ <strong>Отставание:</strong> «Крепеж и метизы» (-18% от дневного плана)</div>
                <div>💰 <strong>Остаток на р/с (ДДС):</strong> 8 450 000 ₽</div>
              </div>
              
              <!-- Screen 2: P&L -->
              <div class="sim-screen" id="sim-pnl" style="display:none;">
                <div style="color:var(--accent-2);font-weight:700;margin-bottom:10px;font-size:0.95rem;">📈 УПРАВЛЕНЧЕСКИЙ P&amp;L (НАКОПИТЕЛЬНО ЗА МЕСЯЦ)</div>
                <div>• <strong>Выручка отгрузок:</strong> 42 600 000 ₽</div>
                <div>• <strong>Себестоимость (ФИФО):</strong> 29 820 000 ₽</div>
                <div style="color:var(--accent-1);font-weight:700;">= Валовая прибыль: 12 780 000 ₽ (30.0%)</div>
                <div>• Коммерческие расходы: 4 200 000 ₽</div>
                <div>• Управленческий ФОТ и аренда: 3 600 000 ₽</div>
                <div style="color:var(--green);font-weight:700;">= EBITDA: 4 980 000 ₽ (11.7%)</div>
                <div>• Налоги, лизинг и % по кредитам: 980 000 ₽</div>
                <div style="color:#fff;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);padding:6px 10px;border-radius:6px;margin-top:8px;font-weight:700;">= ЧИСТАЯ ПРИБЫЛЬ: 4 000 000 ₽</div>
              </div>
              
              <!-- Screen 3: Risks -->
              <div class="sim-screen" id="sim-risks" style="display:none;">
                <div style="color:var(--accent-hot);font-weight:700;margin-bottom:10px;font-size:0.95rem;">⚠️ АЛЕРТЫ ПО РИСКАМ И СКЛАДУ</div>
                <div>1. <strong>Заморожено в неликвиде (&gt;60 дней):</strong> <span style="color:var(--accent-hot);font-weight:700;">3.8 млн ₽</span></div>
                <div style="color:var(--text-3);padding-left:14px;font-size:0.85rem;">Склад Подольск: группа «Электроинструмент» (24 SKU)</div>
                <div>2. <strong>Риск кассового разрыва:</strong> 6 октября (<span style="color:#ef4444;font-weight:700;">-450 000 ₽</span>)</div>
                <div style="color:var(--text-3);padding-left:14px;font-size:0.85rem;">Плановый платеж «Северсталь» + квартальный НДС</div>
                <div>3. <strong>Просроченная дебиторка:</strong> 1.2 млн ₽ (&gt;14 дней, ООО «Вектор»)</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard__side">
          <div class="dash-card dash-card--board">
            <div class="dash-card__header">
              <span class="dash-card__title">События синхронизации 1С</span>
              <span class="dash-card__live"><span class="pulse-dot"></span>Live</span>
            </div>
            <div class="board-panels">
              <div class="log" id="reporting-event-log">
                <div class="log-item log-item--default">
                  <span class="log-item__time">08:59:57</span>
                  <span class="log-item__text"><strong style="color:var(--accent-1);">[1C:ERP]</strong> OData опрос регистров выручки и партий (200 OK)</span>
                </div>
                <div class="log-item log-item--default">
                  <span class="log-item__time">08:59:58</span>
                  <span class="log-item__text"><strong style="color:var(--accent-2);">[ETL Agent]</strong> Нормализация номенклатуры, маржа по ФИФО</span>
                </div>
                <div class="log-item log-item--success">
                  <span class="log-item__time">08:59:59</span>
                  <span class="log-item__text"><strong style="color:var(--green);">[Intercompany]</strong> Исключено 14 внутригрупповых сделок на 1.2M ₽</span>
                </div>
                <div class="log-item log-item--success">
                  <span class="log-item__time">09:00:00</span>
                  <span class="log-item__text"><strong style="color:var(--accent-hot);">[Telegram Bot]</strong> Сводка доставлена Генеральному директору</span>
                </div>
                <div class="log-item log-item--default">
                  <span class="log-item__time">09:00:01</span>
                  <span class="log-item__text"><strong style="color:var(--text-3);">[152-ФЗ]</strong> Локальный On-Premise кэш очищен</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 9. Block 8: #contact (Clean 3-field canonical form, NO extra select)
contact_sec = soup.find("section", id="contact")
if contact_sec:
    h2 = contact_sec.find("h2", class_="contact__title")
    if h2:
        h2.string = "Первый шаг — бесплатный аудит 1С-отчетности"
    desc = contact_sec.find("p", class_="contact__desc")
    if desc:
        desc.string = (
            "За 30 минут разберем ваши базы 1С, покажем, где теряются часы экономистов "
            "и рассчитаем потенциал экономии при автоматизации управленческого P&L для вашей компании."
        )

    # Note: NO extra dropdown added! Form keeps canonical 3 fields: name, company, contact.

# 9.5 Add Other Services internal linking block below contact
contact_sec = soup.find("section", id="contact")
if contact_sec:
    other_section_soup = BeautifulSoup(render_other_services_section("automated-reporting"), "html.parser")
    contact_sec.insert_after(other_section_soup)

# 10. Add Simulator switching script at the end of body
body = soup.find("body")
if body:
    sim_script = BeautifulSoup(
        f"""
    <script>
    document.addEventListener('DOMContentLoaded', function() {{
      var tabs = document.querySelectorAll('.sim-tab-btn');
      var screens = {{
        'sales': document.getElementById('sim-sales'),
        'pnl': document.getElementById('sim-pnl'),
        'risks': document.getElementById('sim-risks')
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
