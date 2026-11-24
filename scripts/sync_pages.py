#!/usr/bin/env python3
"""
Sync and Generate Standalone Hub Pages for ai-avtopilot.ru.
Replaces 202 KB monolithic index.html clones with focused, lightweight hubs
(< 45 KB HTML) linked to external versioned styles.min.css, DOM breadcrumbs,
proper robots directives, and strictly scoped Schema.org @graph entities.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from bs4 import BeautifulSoup

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT_DIR, "index.html")
CSS_PATH = os.path.join(ROOT_DIR, "assets", "css", "styles.min.css")

HUB_ALL_SECTIONS = ("calculator", "compare", "services", "cases", "pricing", "faq", "dashboard")

SUBPAGES_SPEC = {
    "services": {
        "dir": os.path.join(ROOT_DIR, "services"),
        "title": "Услуги внедрения ИИ-агентов в 1С, SAP, CRM и ЭДО | АвтоПилот",
        "description": "Выберите готовый сценарий автоматизации: 24 решения для 1С, CRM, склада и клиентского сервиса. Запустите пилотного ИИ-агента за 14 дней с гарантией ROI.",
        "keywords": "услуги ии автоматизации, внедрение ии агентов в 1с, автоматизация crm и эдо, rpa для бизнеса, автопилот услуги",
        "h1": "Услуги внедрения ИИ-агентов и роботизации процессов",
        "badge": "24 отраслевых решения · Запуск пилота за 14 дней",
        "subtitle": "Готовые ИИ-агенты для 1С:ERP, Битрикс24, amoCRM, Диадок и склада. Выберите сценарий с расчетом окупаемости и кейсами внедрения.",
        "primary_cta": ("Смотреть каталог услуг", "#services"),
        "secondary_cta": ("Рассчитать ROI →", "/calculator/"),
        "breadcrumb_name": "Услуги",
        "keep_sections": ("services", "contact"),
        "has_faq": False,
        "noindex": False,
    },
    "cases": {
        "dir": os.path.join(ROOT_DIR, "cases"),
        "title": "Кейсы внедрения ИИ-агентов: результаты, окупаемость и ROI | АвтоПилот",
        "description": "Изучите 11 реальных кейсов автоматизации в ритейле, производстве и B2B: сокращение рутины до 72% и окупаемость от 1.5 месяцев. Цифры и архитектура внедрения.",
        "keywords": "кейсы внедрения ии, автоматизация 1с кейсы, результаты rpa внедрения, окупаемость ии агентов, автопилот кейсы",
        "h1": "Кейсы внедрения ИИ-агентов и результаты автоматизации",
        "badge": "11 подтвержденных внедрений · Средний ROI +340%",
        "subtitle": "Реальные проекты в ритейле, производстве, логистике, тендерах и сервисе: измеримая экономия часов, SLA и сроки окупаемости.",
        "primary_cta": ("Смотреть все кейсы", "#cases"),
        "secondary_cta": ("Запросить аудит →", "#contact"),
        "breadcrumb_name": "Кейсы",
        "keep_sections": ("cases", "contact"),
        "has_faq": False,
        "noindex": False,
    },
    "calculator": {
        "dir": os.path.join(ROOT_DIR, "calculator"),
        "title": "Калькулятор окупаемости ИИ и расчет ROI автоматизации | АвтоПилот",
        "description": "Рассчитайте годовую экономию фонда оплаты труда на калькуляторе ROI: укажите штат и часы рутины. Получите детальный финансовый расчет окупаемости за 30 секунд.",
        "keywords": "калькулятор окупаемости ии, расчет roi автоматизации, экономия на рутине 1с, оценка эффекта внедрения ии",
        "h1": "Калькулятор окупаемости ИИ-автоматизации и расчет ROI",
        "badge": "Финансовая модель · Точность оценки ±10%",
        "subtitle": "Оцените годовые потери ФОТ на ручной ввод в 1С, CRM и ЭДО и потенциальную экономию 80% рутины до старта пилота.",
        "primary_cta": ("Рассчитать ROI сейчас", "#calculator"),
        "secondary_cta": ("Калькулятор НПД (самозанятые) →", "/calculator/self-employed/"),
        "breadcrumb_name": "Калькулятор",
        "keep_sections": ("calculator", "contact"),
        "has_faq": False,
        "noindex": False,
    },
    "dashboard": {
        "dir": os.path.join(ROOT_DIR, "dashboard"),
        "title": "Интерактивный дашборд и мониторинг работы ИИ-агентов | АвтоПилот",
        "description": "Проверьте работу ИИ-агентов в реальном времени: интерактивная телеметрия, статус обработки накладных в 1С и журнал событий. Запустите демо-сессию прямо сейчас.",
        "keywords": "дашборд ии агентов, мониторинг 1с автоматизации, телеметрия rpa, центр управления автопилот",
        "h1": "Интерактивный дашборд мониторинга и метрик ИИ-агентов",
        "badge": "Демо-телеметрия · 48 агентов в контуре",
        "subtitle": "Мониторинг пропускной способности, точности распознавания и журнала событий в реальном времени.",
        "primary_cta": ("Открыть телеметрию", "#dashboard"),
        "secondary_cta": ("Запросить доступ к демо →", "#contact"),
        "breadcrumb_name": "Дашборд",
        "keep_sections": ("dashboard", "contact"),
        "has_faq": False,
        "noindex": True,
    },
    "faq": {
        "dir": os.path.join(ROOT_DIR, "faq"),
        "title": "Частые вопросы по внедрению ИИ-агентов и автоматизации | АвтоПилот",
        "description": "Узнайте ответы на главные вопросы о внедрении ИИ-агентов: безопасность данных по 152-ФЗ, интеграция с 1С без доработок и гарантии результата по договору.",
        "keywords": "faq внедрение ии, безопасность 152 фз нейросети, интеграция с 1с без доработок, вопросы по автоматизации",
        "h1": "Часто задаваемые вопросы по внедрению ИИ-агентов",
        "badge": "Безопасность 152-ФЗ · Сроки · Окупаемость",
        "subtitle": "Регламент запуска пилота за 14 дней, архитектура подключения к 1С/CRM/ЭДО без снятия с поддержки и гарантии ROI.",
        "primary_cta": ("Перейти к вопросам", "#faq"),
        "secondary_cta": ("Задать свой вопрос →", "#contact"),
        "breadcrumb_name": "FAQ",
        "keep_sections": ("faq", "contact"),
        "has_faq": True,
        "noindex": False,
    },
    "contact": {
        "dir": os.path.join(ROOT_DIR, "contact"),
        "title": "Контакты и запись на бесплатный аудит процессов | АвтоПилот",
        "description": "Запишитесь на бесплатный аудит бизнес-процессов за 30 минут: найдем узкие места в 1С и CRM, покажем расчет окупаемости и план пилота. Ответим в течение 15 минут.",
        "keywords": "контакты автопилот, заказать аудит 1с, связаться по внедрению ии, ai avtopilot контакты",
        "h1": "Контакты и бесплатный экспресс-аудит процессов",
        "badge": "Отвечаем за 15 минут · Официальный канал @AiAvtopilotbot",
        "subtitle": "За 30 минут разберем узкие места в вашей 1С, CRM или ЭДО, рассчитаем матрицу окупаемости и предложим план пилотного внедрения за 14 дней.",
        "primary_cta": ("Оставить заявку", "#contact"),
        "secondary_cta": ("Написать в Telegram →", "https://t.me/AiAvtopilotbot"),
        "breadcrumb_name": "Контакты",
        "keep_sections": ("contact",),
        "has_faq": False,
        "noindex": True,
    },
}


def get_css_hash() -> str:
    raw = open(CSS_PATH, "rb").read().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.md5(raw).hexdigest()[:8]


def _build_hub_hero(soup: BeautifulSoup, spec: dict) -> BeautifulSoup:
    p_text, p_href = spec["primary_cta"]
    s_text, s_href = spec["secondary_cta"]
    extra_attr = ' target="_blank" rel="noopener"' if s_href.startswith("https://") else ""
    hero_html = f"""  <section class="hero" id="home">
    <div class="hero__particles" id="particles"></div>
    <div class="container hero__inner">
      <div class="hero__content" style="max-width:820px">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>{spec["breadcrumb_name"]}</span>
        </nav>
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">{spec["badge"]}</span>
        </div>
        <h1 class="hero__title">{spec["h1"]}</h1>
        <p class="hero__sub">{spec["subtitle"]}</p>
        <div class="hero__actions">
          <a href="{p_href}" class="btn btn--primary" id="cta-main">{p_text}</a>
          <a href="{s_href}" class="btn btn--ghost"{extra_attr}>{s_text}</a>
        </div>
      </div>
    </div>
  </section>"""
    return BeautifulSoup(hero_html, "html.parser")


def generate_subpage(slug: str, spec: dict, master_html: str, css_hash: str) -> str:
    soup = BeautifulSoup(master_html, "html.parser")
    canonical_url = f"https://ai-avtopilot.ru/{slug}/"

    # 1. Swap inline #app-styles for external cached CSS
    app_style = soup.find("style", attrs={"id": "app-styles"})
    if app_style:
        app_style.replace_with(soup.new_tag("link", rel="stylesheet", href=f"/assets/css/styles.min.css?v={css_hash}"))

    # 2. Update Head Meta & Robots
    if soup.title:
        soup.title.string = spec["title"]

    desc = soup.find("meta", attrs={"name": "description"})
    if desc:
        desc["content"] = spec["description"]

    kw = soup.find("meta", attrs={"name": "keywords"})
    if kw:
        kw["content"] = spec["keywords"]

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots:
        robots["content"] = (
            "noindex, follow"
            if spec["noindex"]
            else "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        )

    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon:
        canon["href"] = canonical_url

    for prop, val in [
        ("og:url", canonical_url),
        ("og:title", spec["title"]),
        ("og:description", spec["description"]),
        ("twitter:title", spec["title"]),
        ("twitter:description", spec["description"]),
    ]:
        tag = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        if tag:
            tag["content"] = val

    # 3. Active nav highlight
    for nav_a in soup.select(".nav__links a.nav__link"):
        classes = [c for c in nav_a.get("class", []) if c != "active"]
        if nav_a.get("href") == f"/{slug}/":
            classes.append("active")
        nav_a["class"] = classes

    # 4. Focused Hero + prune cloned unrelated sections
    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.replace_with(_build_hub_hero(soup, spec))

    keep = set(spec["keep_sections"])
    for sec_id in HUB_ALL_SECTIONS:
        if sec_id not in keep:
            sec = soup.find("section", id=sec_id)
            if sec:
                sec.decompose()

    if slug == "services":
        bento = soup.select_one("#services .services__bento")
        if bento:
            cls = bento.get("class", [])
            if "services__bento--static" not in cls:
                cls.append("services__bento--static")
            bento["class"] = cls
        nav_cta = soup.select_one(".nav .btn--nav")
        if nav_cta:
            nav_cta["href"] = "#contact"

    if slug == "cases":
        grid = soup.select_one("#cases .cases__grid")
        if grid:
            cls = grid.get("class", [])
            if "cases__grid--static" not in cls:
                cls.append("cases__grid--static")
            grid["class"] = cls

    # 5. Scoped Schema.org JSON-LD (strip homepage WebSite, OfferCatalog, and unused FAQPage)
    json_ld = soup.find("script", attrs={"type": "application/ld+json"})
    if json_ld and json_ld.string:
        data = json.loads(json_ld.string)
        new_graph = []
        for item in data.get("@graph", []):
            itype = item.get("@type")
            if itype in ("WebSite", "BreadcrumbList"):
                continue
            if itype == "FAQPage":
                if spec["has_faq"]:
                    item["@id"] = f"{canonical_url}#faq"
                    new_graph.append(item)
                continue
            if itype == "ProfessionalService":
                item.pop("hasOfferCatalog", None)
            new_graph.append(item)

        new_graph.append(
            {
                "@type": "BreadcrumbList",
                "@id": f"{canonical_url}#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": spec["breadcrumb_name"], "item": canonical_url},
                ],
            }
        )
        data["@graph"] = new_graph
        json_ld.string = "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n"

    return str(soup)


def main() -> None:
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        master_html = f.read()

    css_hash = get_css_hash()
    print(f"Master index.html loaded ({len(master_html)} bytes), css v={css_hash}.")

    for slug, spec in SUBPAGES_SPEC.items():
        os.makedirs(spec["dir"], exist_ok=True)
        target_path = os.path.join(spec["dir"], "index.html")
        subpage_html = generate_subpage(slug, spec, master_html, css_hash)
        with open(target_path, "w", encoding="utf-8") as out_f:
            out_f.write(subpage_html)
        print(f"  [OK] Generated standalone hub: {slug}/index.html ({len(subpage_html)} bytes)")

    print("All 6 hub pages built cleanly.")

    try:
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        if ROOT_DIR not in sys.path:
            sys.path.insert(0, ROOT_DIR)

        try:
            from scripts.sync_docs import run_sync
        except ImportError:
            from sync_docs import run_sync
        run_sync(check_only=False)
    except Exception as e:
        print(f"  [WARN] Auto doc sync skipped: {e}")


if __name__ == "__main__":
    main()
