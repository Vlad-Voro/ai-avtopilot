#!/usr/bin/env python3
"""
Builder for automated-reporting landing page on ai-avtopilot.ru.
Generates data/ai-avtopilot/automated-reporting/index.html with 1:1 structural alignment with the main page.
"""

import os
import re
import json
from bs4 import BeautifulSoup

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT_DIR, "index.html")
OUTPUT_DIR = os.path.join(ROOT_DIR, "automated-reporting")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "index.html")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    master_html = f.read()

soup = BeautifulSoup(master_html, "html.parser")

# 1. Update Title & Meta
title_text = "Отчеты по продажам, остаткам и P&L из 1С в Telegram | АвтоПилот"
desc_text = "Автоматический сбор управленческой аналитики из 1С:ERP, УТ, КА в Telegram и Email: сводки продаж, P&L (ОПиУ), остатки и алерты кассовых разрывов за 10 дней."
canonical_url = "https://ai-avtopilot.ru/automated-reporting/"

if soup.title:
    soup.title.string = title_text

# Update Meta Description
meta_desc = soup.find("meta", attrs={"name": "description"})
if meta_desc:
    meta_desc["content"] = desc_text

# Update Canonical
canonical = soup.find("link", rel="canonical")
if canonical:
    canonical["href"] = canonical_url

# Update OpenGraph
for prop, val in [
    ("og:url", canonical_url),
    ("og:title", title_text),
    ("og:description", desc_text),
    ("twitter:title", title_text),
    ("twitter:description", desc_text),
]:
    tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
    if tag:
        tag["content"] = val

# Update Schema.org
json_ld = soup.find("script", type="application/ld+json")
if json_ld and json_ld.string:
    try:
        data = json.loads(json_ld.string)
        # Add BreadcrumbList and SoftwareApplication
        graph = data.get("@graph", [])
        graph = [
            item for item in graph if item.get("@type") not in ["BreadcrumbList", "FAQPage", "SoftwareApplication"]
        ]

        # Breadcrumbs
        graph.append(
            {
                "@type": "BreadcrumbList",
                "@id": f"{canonical_url}#breadcrumbs",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": "Автоотчетность P&L", "item": canonical_url},
                ],
            }
        )

        # SoftwareApplication
        graph.append(
            {
                "@type": "SoftwareApplication",
                "@id": f"{canonical_url}#app",
                "name": "АвтоПилот: Управленческая автоотчетность 1С",
                "operatingSystem": "Windows, Linux (1C:Enterprise 8.3)",
                "applicationCategory": "BusinessApplication",
                "description": desc_text,
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
                "@id": f"{canonical_url}#faq",
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
            badge_text.string = "Системы активны · Управленческая аналитика в реальном времени"

        h1 = hero_inner.find("h1")
        if h1:
            h1.clear()
            h1.append(
                BeautifulSoup(
                    """<span class="hero__title-static">Сводные отчеты по продажам, остаткам и P&L </span><span class="hero__title-accent-box"><span class="hero__title-accent" id="typed-text">на автопилоте</span><span aria-hidden="true" class="hero__cursor">|</span></span>""",
                    "html.parser",
                )
            )

        desc = hero_inner.find("p", class_="hero__desc")
        if desc:
            desc.string = "Автономные агенты забирают данные из ваших баз 1С:ERP, УТ, КА и CRM, рассчитывают реальную чистую прибыль и присылают утреннюю сводку руководителю в Telegram или Email. Без ожидания экономистов до 15-го числа и без риска ошибок в формулах Excel."

        actions = hero_inner.find("div", class_="hero__actions")
        if actions:
            actions.clear()
            actions.append(
                BeautifulSoup(
                    """<a href="#contact" class="btn btn--primary">Запустить автоотчетность</a><a href="#dashboard" class="btn btn--ghost">Смотреть демо-сводку →</a>""",
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
                """Экономистов и аналитиков на сведении отчетов <span class="roi-value-display" id="display-employees">2</span>""",
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
                """Часов в неделю тратят на сведение P&L и отчетов <span class="roi-value-display" id="display-hours">20</span>""",
                "html.parser",
            )
        )

    lbl_sal = calc_sec.find("label", attrs={"for": "slider-salary"})
    if lbl_sal:
        lbl_sal.clear()
        lbl_sal.append(
            BeautifulSoup(
                """Средняя зарплата специалиста (рублей в месяц) <span class="roi-value-display" id="display-salary">90 000</span>""",
                "html.parser",
            )
        )
    slider_sal = calc_sec.find("input", id="slider-salary")
    if slider_sal:
        slider_sal["value"] = "90000"
        slider_sal["min"] = "40000"
        slider_sal["max"] = "250000"

    cta_block = calc_sec.find("div", class_="roi__cta-block")
    if cta_block:
        cta_block.clear()
        cta_block.append(
            BeautifulSoup(
                """<p>Хотите убрать ручной сбор таблиц в вашей компании?</p><a class="btn btn--primary" href="#contact">Заказать аудит 1С-отчетности</a>""",
                "html.parser",
            )
        )

# 4. Block 3: #compare
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
        <div class="compare__col compare__col--before">
          <div class="compare__header">
            <span class="compare__badge compare__badge--before">Сейчас (Excel + 1С) 😰</span>
          </div>
          <ul class="compare__list">
            <li class="compare__item">
              <span class="compare__icon">✕</span>
              <span><strong>P&L собирается к 15–20 числу следующего месяца</strong> — стратегические решения принимаются вслепую на устаревших цифрах.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✕</span>
              <span><strong>«Бумажная» прибыль в 1С есть, а денег на счетах нет</strong> — путаница между начисленной прибылью (P&L) и кассовыми разрывами (ДДС).</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✕</span>
              <span><strong>Ошибки в формулах VLOOKUP и сломанных связях</strong> между таблицами приводят к случайной выплате дивидендов из оборотных средств.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✕</span>
              <span><strong>О неликвидах на складе и зависших миллионах</strong> узнают постфактум раз в год во время плановой инвентаризации.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✕</span>
              <span><strong>Руководитель привязан к рабочему месту</strong> — посмотреть реальную маржинальность со смартфона вне офиса невозможно.</span>
            </li>
          </ul>
        </div>
        <div class="compare__col compare__col--after">
          <div class="compare__header">
            <span class="compare__badge compare__badge--after">С агентами АвтоПилот 🚀</span>
          </div>
          <ul class="compare__list">
            <li class="compare__item">
              <span class="compare__icon">✓</span>
              <span><strong>Выручка, себестоимость и чистая прибыль</strong> рассчитываются ежедневно и приходят в Telegram в 09:00 утра.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✓</span>
              <span><strong>Сквозная связка P&L с отчетом ДДС</strong> и платежным календарем предупреждает о рисках кассовых разрывов за 10 дней.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✓</span>
              <span><strong>100% точность данных на уровне регистров 1С</strong> без человеческого фактора, опечаток и ручного копирования.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✓</span>
              <span><strong>Ежедневные упреждающие алерты</strong> по замороженным остаткам, просроченной дебиторке и отклонениям от плана продаж.</span>
            </li>
            <li class="compare__item">
              <span class="compare__icon">✓</span>
              <span><strong>Вся картина бизнеса в смартфоне</strong> руководителя в любой точке мира в защищенном корпоративном боте.</span>
            </li>
          </ul>
        </div>
        """,
                "html.parser",
            )
        )

# 5. Block 4: #services
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
            <span class="tag">1С:УТ 11</span>
            <span class="tag">1С:КА 2</span>
            <span class="tag">План/Факт</span>
            <span class="tag">Telegram</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📈</div>
          <h3 class="scard__title">Управленческий P&L (ОПиУ) в реальном времени</h3>
          <p class="scard__desc">Расчет чистой прибыли и EBITDA методом начисления (Выручка - Себестоимость ФИФО - OPEX) без ожидания закрытия месяца бухгалтерией.</p>
          <div class="scard__tags">
            <span class="tag">1С:ERP</span>
            <span class="tag">1С:БП 3.0</span>
            <span class="tag">EBITDA</span>
            <span class="tag">Маржинальность</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📦</div>
          <h3 class="scard__title">Контроль остатков и неликвидов</h3>
          <p class="scard__desc">Анализ оборачиваемости товарных позиций, аудит замороженных в запасах миллионов и упреждающие алерты риска Out-of-Stock.</p>
          <div class="scard__tags">
            <span class="tag">Склад</span>
            <span class="tag">Маркетплейсы</span>
            <span class="tag">Неликвиды</span>
            <span class="tag">Резервы</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">💸</div>
          <h3 class="scard__title">Прогноз кассовых разрывов и дебиторка</h3>
          <p class="scard__desc">Интерактивный платежный календарь ДДС на 14 дней вперед, реестр старения дебиторки и автоматические напоминания по должникам.</p>
          <div class="scard__tags">
            <span class="tag">ДДС</span>
            <span class="tag">Платежный календарь</span>
            <span class="tag">Дебиторка</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">🔄</div>
          <h3 class="scard__title">Консолидация нескольких баз (Интеркампани)</h3>
          <p class="scard__desc">Сведение финансовой аналитики группы компаний из разных юридических лиц с автоматическим исключением межфирменных оборотов.</p>
          <div class="scard__tags">
            <span class="tag">Холдинг</span>
            <span class="tag">Мультибаза</span>
            <span class="tag">Элиминация</span>
          </div>
        </div>
        <div class="scard">
          <div class="scard__icon">📱</div>
          <h3 class="scard__title">Доставка в удобные каналы руководителя</h3>
          <p class="scard__desc">Закрытый защищенный Telegram-бот с персональным доступом, рассылка PDF/Excel на Email и интерактивный живой веб-дашборд.</p>
          <div class="scard__tags">
            <span class="tag">Telegram API</span>
            <span class="tag">Email PDF</span>
            <span class="tag">On-Premise 152-ФЗ</span>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 6. Block 5: #cases
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
        <div class="case-card">
          <div class="case-card__header">
            <div class="case-card__industry">🏪 Оптовый дистрибьютор · 3 базы 1С</div>
            <div class="case-card__badge">Оборот 680 млн ₽</div>
          </div>
          <h3 class="case-card__title">Консолидация P&L и остатков холдинга в Telegram</h3>
          <p class="case-card__desc">Связали базы 1С:УТ и 1С:БП через агента. Настроили автоматическое вычитание интеркампани и утреннюю сводку маржи генеральному директору.</p>
          <div class="case-card__metrics">
            <div class="cmetric">
              <span class="cmetric__val">с 18 дней до 2 ч</span>
              <span class="cmetric__lbl">срок подготовки P&L</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">55 ч/мес</span>
              <span class="cmetric__lbl">высвобождено у CFO</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">18 дней</span>
              <span class="cmetric__lbl">срок окупаемости пилота</span>
            </div>
          </div>
        </div>
        <div class="case-card">
          <div class="case-card__header">
            <div class="case-card__industry">🛒 Федеральная розничная сеть · 45 магазинов</div>
            <div class="case-card__badge">14 000 SKU</div>
          </div>
          <h3 class="case-card__title">Предиктивный платежный календарь и ликвидация кассовых разрывов</h3>
          <p class="case-card__desc">Объединили потоки данных из 1С:Розница и банковских выписок. Запустили предиктивный платежный календарь с алертами неликвидных остатков.</p>
          <div class="case-card__metrics">
            <div class="cmetric">
              <span class="cmetric__val">0 разрывов</span>
              <span class="cmetric__lbl">за 6 месяцев работы</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">4.2 млн ₽</span>
              <span class="cmetric__lbl">выведено из неликвидов</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">340%</span>
              <span class="cmetric__lbl">ROI за первый квартал</span>
            </div>
          </div>
        </div>
        <div class="case-card">
          <div class="case-card__header">
            <div class="case-card__industry">🏭 Производственное предприятие · 1С:ERP</div>
            <div class="case-card__badge">Серийный выпуск</div>
          </div>
          <h3 class="case-card__title">Оперативный расчет фактической себестоимости и маржи партий</h3>
          <p class="case-card__desc">Подключили агента к регистрам выпуска продукции. Руководство видит фактическую маржинальность каждой спецификации до момента отгрузки клиенту.</p>
          <div class="case-card__metrics">
            <div class="cmetric">
              <span class="cmetric__val">+4.3%</span>
              <span class="cmetric__lbl">рост рентабельности сделок</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">&lt; 1 мин</span>
              <span class="cmetric__lbl">калькуляция маржи заказа</span>
            </div>
            <div class="cmetric">
              <span class="cmetric__val">14 дней</span>
              <span class="cmetric__lbl">запуск без остановки 1С</span>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 7. Block 6: #faq
faq_sec = soup.find("section", id="faq")
if faq_sec:
    h2 = faq_sec.find("h2", class_="section-title")
    if h2:
        h2.string = "Часто задаваемые вопросы по автоотчетности"
    desc = faq_sec.find("p", class_="section-desc")
    if desc:
        desc.string = "Всё, что важно знать о безопасности, интеграции с 1С и методике расчетов"
    acc = faq_sec.find("div", class_="faq__accordion")
    if acc:
        acc.clear()
        acc.append(
            BeautifulSoup(
                """
        <details class="faq__item">
          <summary class="faq__question">
            <span>Нужно ли дорабатывать или снимать 1С с типовой поддержки?</span>
            <span class="faq__icon">+</span>
          </summary>
          <div class="faq__answer">
            <p>Нет. Агент подключается через внешнюю обработку (.epf) или внешнее расширение (.cfe). Конфигурация остается полностью типовой и обновляется штатными средствами без ограничений.</p>
          </div>
        </details>
        <details class="faq__item">
          <summary class="faq__question">
            <span>Как считается себестоимость в P&L до официального закрытия месяца?</span>
            <span class="faq__icon">+</span>
          </summary>
          <div class="faq__answer">
            <p>Используется оперативный расчет по методу ФИФО или средней скользящей себестоимости на основе регистров партий и движений товаров. После регламентного закрытия месяца бухгалтерией агент автоматически пересчитывает исторические данные.</p>
          </div>
        </details>
        <details class="faq__item">
          <summary class="faq__question">
            <span>Как обеспечивается безопасность финансовых данных по 152-ФЗ?</span>
            <span class="faq__icon">+</span>
          </summary>
          <div class="faq__answer">
            <p>Агент развертывается в закрытом On-Premise контуре вашей компании (на вашем сервере). Базы 1С не открываются в интернет, сырые данные не передаются в сторонние облачные сервисы. Доступ к боту строго ограничен белым списком Telegram ID топ-менеджеров.</p>
          </div>
        </details>
        <details class="faq__item">
          <summary class="faq__question">
            <span>Что если учет ведется в нескольких разных базах 1С?</span>
            <span class="faq__icon">+</span>
          </summary>
          <div class="faq__answer">
            <p>Агент умеет одновременно опрашивать несколько баз (например, 1С:УТ по торговле и 1С:Бухгалтерию по расходам), сопоставлять справочники номенклатуры и автоматически исключать внутригрупповые обороты (интеркампани).</p>
          </div>
        </details>
        <details class="faq__item">
          <summary class="faq__question">
            <span>Сколько времени занимает внедрение первого рабочего отчета?</span>
            <span class="faq__icon">+</span>
          </summary>
          <div class="faq__answer">
            <p>Развертывание агента и запуск первого рабочего пилота утренней сводки в Telegram занимает от 7 до 14 рабочих дней под ключ.</p>
          </div>
        </details>
        """,
                "html.parser",
            )
        )

# 8. Block 7: #dashboard (Interactive Telegram Simulator)
dash_sec = soup.find("section", id="dashboard")
if dash_sec:
    badge_text = dash_sec.find("span", class_="hero__badge-text")
    if badge_text:
        badge_text.string = "Системы активны · Утренняя сводка руководителя в 09:00"
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
                <button type="button" class="btn btn--ghost sim-tab-btn active" data-sim="sales" style="padding:6px 14px;font-size:0.82rem;font-weight:600;">📊 Продажи</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="pnl" style="padding:6px 14px;font-size:0.82rem;font-weight:600;">📈 P&L (ОПиУ)</button>
                <button type="button" class="btn btn--ghost sim-tab-btn" data-sim="risks" style="padding:6px 14px;font-size:0.82rem;font-weight:600;">⚠️ Риски</button>
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
                <div style="color:var(--accent-2);font-weight:700;margin-bottom:10px;font-size:0.95rem;">📈 УПРАВЛЕНЧЕСКИЙ P&L (НАКОПИТЕЛЬНО ЗА МЕСЯЦ)</div>
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
                <div>1. <strong>Заморожено в неликвиде (>60 дней):</strong> <span style="color:var(--accent-hot);font-weight:700;">3.8 млн ₽</span></div>
                <div style="color:var(--text-3);padding-left:14px;font-size:0.85rem;">Склад Подольск: группа «Электроинструмент» (24 SKU)</div>
                <div>2. <strong>Риск кассового разрыва:</strong> 6 октября (<span style="color:#ef4444;font-weight:700;">-450 000 ₽</span>)</div>
                <div style="color:var(--text-3);padding-left:14px;font-size:0.85rem;">Плановый платеж «Северсталь» + квартальный НДС</div>
                <div>3. <strong>Просроченная дебиторка:</strong> 1.2 млн ₽ (>14 дней, ООО «Вектор»)</div>
              </div>
            </div>
            
            <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;">
              <a href="#contact" class="btn btn--primary" style="flex:1;justify-content:center;font-size:0.9rem;">Подключить для вашей 1С</a>
              <a href="#contact" class="btn btn--ghost" style="font-size:0.9rem;">Запросить демо-выгрузку</a>
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
              <div class="log" id="reporting-event-log" style="font-family:var(--font-mono);font-size:0.82rem;line-height:1.75;color:var(--text-2);padding:14px;">
                <div><span style="color:var(--text-3);">08:59:57</span> <span style="color:var(--accent-1);font-weight:600;">[1C:ERP]</span> OData запрос регистров выручки и партий (200 OK)</div>
                <div><span style="color:var(--text-3);">08:59:58</span> <span style="color:var(--accent-2);font-weight:600;">[ETL Agent]</span> Нормализация номенклатуры, расчет маржи по ФИФО</div>
                <div><span style="color:var(--text-3);">08:59:59</span> <span style="color:var(--green);font-weight:600;">[Intercompany]</span> Исключено 14 внутригрупповых сделок на 1.2M ₽</div>
                <div><span style="color:var(--text-3);">09:00:00</span> <span style="color:var(--accent-hot);font-weight:600;">[Telegram Bot]</span> Сводка успешно доставлена Генеральному директору</div>
                <div><span style="color:var(--text-3);">09:00:01</span> <span style="color:var(--text-3);">[152-ФЗ]</span> Сессия закрыта, локальный On-Premise кэш очищен</div>
              </div>
            </div>
          </div>
        </div>
        """,
                "html.parser",
            )
        )

# 9. Block 8: #contact
contact_sec = soup.find("section", id="contact")
if contact_sec:
    h2 = contact_sec.find("h2", class_="contact__title")
    if h2:
        h2.string = "Первый шаг — бесплатный аудит 1С-отчетности"
    desc = contact_sec.find("p", class_="contact__desc")
    if desc:
        desc.string = "За 30 минут разберем ваши базы 1С, покажем, где теряются часы экономистов и рассчитаем потенциал экономии при автоматизации управленческого P&L для вашей компании."

    perks = contact_sec.find("ul", class_="contact__perks")
    if perks:
        perks.clear()
        perks.append(
            BeautifulSoup(
                """
        <li class="contact__perk">
          <span class="contact__perk-icon">✓</span>
          <span>Экспресс-анализ архитектуры баз 1С (ERP, УТ, КА, БП) бесплатно</span>
        </li>
        <li class="contact__perk">
          <span class="contact__perk-icon">✓</span>
          <span>Демонстрация готового шаблона утренней сводки под вашу отрасль</span>
        </li>
        <li class="contact__perk">
          <span class="contact__perk-icon">✓</span>
          <span>Расчет точного срока окупаемости и плана запуска за 10 дней</span>
        </li>
        """,
                "html.parser",
            )
        )

    # Add System selector in the form before phone
    form = contact_sec.find("form", id="contact-form")
    if form:
        # Check if system select already exists
        if not form.find("select", id="user_system"):
            comp_group = form.find("div", class_="form-group")
            system_html = BeautifulSoup(
                """
            <div class="form-group">
              <label class="form-label" for="user_system">Конфигурация 1С / Учетная система</label>
              <select class="form-input" id="user_system" name="system" style="background:var(--bg);color:var(--text-1);">
                <option value="1C:ERP">1С:ERP Управление предприятием</option>
                <option value="1C:Комплексная автоматизация">1С:Комплексная автоматизация (КА 2)</option>
                <option value="1C:Управление торговлей">1С:Управление торговлей (УТ 11)</option>
                <option value="1C:Бухгалтерия">1С:Бухгалтерия предприятия (БП 3.0)</option>
                <option value="Несколько баз 1С">Несколько баз 1С (Холдинг)</option>
                <option value="МойСклад / Другое">МойСклад / Другая система</option>
              </select>
            </div>
            """,
                "html.parser",
            )
            comp_group.insert_after(system_html)

        btn_text = form.find("span", id="submit-btn-text")
        if btn_text:
            btn_text.string = "Записаться на аудит отчетности"

# 10. Add Simulator switching script at the end of body
body = soup.find("body")
if body:
    sim_script = BeautifulSoup(
        """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
      var tabs = document.querySelectorAll('.sim-tab-btn');
      var screens = {
        'sales': document.getElementById('sim-sales'),
        'pnl': document.getElementById('sim-pnl'),
        'risks': document.getElementById('sim-risks')
      };
      
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var target = tab.getAttribute('data-sim');
          tabs.forEach(function(t) { t.classList.remove('active'); t.style.borderColor = 'rgba(99,102,241,0.3)'; });
          tab.classList.add('active');
          tab.style.borderColor = 'var(--accent-1)';
          
          Object.keys(screens).forEach(function(k) {
            if (screens[k]) {
              screens[k].style.display = (k === target) ? 'block' : 'none';
            }
          });
        });
      });
    });
    </script>
    """,
        "html.parser",
    )
    body.append(sim_script)

final_html = str(soup)

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(final_html)

print(f"Generated {OUTPUT_PATH} ({len(final_html)} bytes)")
