#!/usr/bin/env python3
"""
Sync and Generate Multi-Entry Hybrid Subpages for ai-avtopilot.ru.
Eliminates CSS drift and synchronizes inlined styles, nav, and schemas across all 6 HTML targets.
"""

import json
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT_DIR, "index.html")

SUBPAGES_SPEC = {
    "services": {
        "dir": os.path.join(ROOT_DIR, "services"),
        "title": "Услуги внедрения ИИ-агентов в 1С, SAP, CRM и ЭДО | АвтоПилот",
        "description": "Выберите готовый сценарий автоматизации: 24 решения для 1С, CRM, склада и клиентского сервиса. Запустите пилотного ИИ-агента за 14 дней с гарантией ROI.",
        "h1": "Услуги внедрения ИИ-агентов и роботизации процессов",
        "breadcrumb_name": "Услуги",
        "deep_content": "",
    },
    "cases": {
        "dir": os.path.join(ROOT_DIR, "cases"),
        "title": "Кейсы внедрения ИИ-агентов: результаты, окупаемость и ROI | АвтоПилот",
        "description": "Изучите 11 реальных кейсов автоматизации в ритейле, производстве и B2B: сокращение рутины до 72% и окупаемость от 1.5 месяцев. Цифры и архитектура внедрения.",
        "h1": "Кейсы внедрения ИИ-агентов и результаты автоматизации",
        "breadcrumb_name": "Кейсы",
        "deep_content": "",
    },
    "calculator": {
        "dir": os.path.join(ROOT_DIR, "calculator"),
        "title": "Калькулятор окупаемости ИИ и расчет ROI автоматизации | АвтоПилот",
        "description": "Рассчитайте годовую экономию фонда оплаты труда на калькуляторе ROI: укажите штат и часы рутины. Получите детальный финансовый расчет окупаемости за 30 секунд.",
        "h1": "Калькулятор окупаемости ИИ-автоматизации и расчет ROI",
        "breadcrumb_name": "Калькулятор",
        "deep_content": "",
    },
    "dashboard": {
        "dir": os.path.join(ROOT_DIR, "dashboard"),
        "title": "Интерактивный дашборд и мониторинг работы ИИ-агентов | АвтоПилот",
        "description": "Проверьте работу ИИ-агентов в реальном времени: интерактивная телеметрия, статус обработки накладных в 1С и журнал событий. Запустите демо-сессию прямо сейчас.",
        "h1": "Интерактивный дашборд мониторинга и метрик ИИ-агентов",
        "breadcrumb_name": "Дашборд",
        "deep_content": "",
    },
    "faq": {
        "dir": os.path.join(ROOT_DIR, "faq"),
        "title": "Частые вопросы по внедрению ИИ-агентов и автоматизации | АвтоПилот",
        "description": "Узнайте ответы на 15 главных вопросов о внедрении ИИ-агентов: безопасность данных по 152-ФЗ, интеграция с 1С без доработок и гарантии результата по договору.",
        "h1": "Часто задаваемые вопросы",
        "breadcrumb_name": "FAQ",
        "deep_content": "",
    },
    "contact": {
        "dir": os.path.join(ROOT_DIR, "contact"),
        "title": "Контакты и запись на бесплатный аудит процессов | АвтоПилот",
        "description": "Запишитесь на бесплатный аудит бизнес-процессов за 30 минут: найдем узкие места в 1С и CRM, покажем расчет окупаемости и план пилота. Ответим в течение 15 минут.",
        "h1": "Первый шаг — бесплатный аудит",
        "breadcrumb_name": "Контакты",
        "deep_content": "",
    },
}


def generate_subpage(slug: str, spec: dict, master_html: str) -> str:
    html = master_html

    # 1. Update Title & Meta Description
    html = re.sub(r"<title>.*?</title>", f"<title>{spec['title']}</title>", html)
    html = re.sub(
        r'<meta name="description"\s+content=".*?"\s*/>',
        f'<meta name="description" content="{spec["description"]}" />',
        html,
        flags=re.DOTALL,
    )

    # 2. Update Canonical URL
    canonical_url = f"https://ai-avtopilot.ru/{slug}/"
    html = re.sub(r'<link rel="canonical"\s+href=".*?"\s*/>', f'<link rel="canonical" href="{canonical_url}" />', html)

    # 3. Update OpenGraph URL & Title & Desc
    html = re.sub(
        r'<meta property="og:url"\s+content=".*?"\s*/>', f'<meta property="og:url" content="{canonical_url}" />', html
    )
    html = re.sub(
        r'<meta property="og:title"\s+content=".*?"\s*/>',
        f'<meta property="og:title" content="{spec["title"]}" />',
        html,
    )
    html = re.sub(
        r'<meta property="og:description"\s+content=".*?"\s*/>',
        f'<meta property="og:description" content="{spec["description"]}" />',
        html,
        flags=re.DOTALL,
    )

    # 4. Update Twitter Title & Desc
    html = re.sub(
        r'<meta name="twitter:title"\s+content=".*?"\s*/>',
        f'<meta name="twitter:title" content="{spec["title"]}" />',
        html,
    )
    html = re.sub(
        r'<meta name="twitter:description"\s+content=".*?"\s*/>',
        f'<meta name="twitter:description" content="{spec["description"]}" />',
        html,
        flags=re.DOTALL,
    )

    # 5. Inject BreadcrumbList into Schema.org @graph
    breadcrumb_schema = {
        "@type": "BreadcrumbList",
        "@id": f"{canonical_url}#breadcrumbs",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
            {"@type": "ListItem", "position": 2, "name": spec["breadcrumb_name"], "item": canonical_url},
        ],
    }

    # Find JSON-LD block and inject BreadcrumbList into @graph
    json_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    if json_match:
        try:
            schema_data = json.loads(json_match.group(1).strip())
            # Replace or append BreadcrumbList
            graph = [item for item in schema_data.get("@graph", []) if item.get("@type") != "BreadcrumbList"]
            graph.append(breadcrumb_schema)
            schema_data["@graph"] = graph
            formatted_json = json.dumps(schema_data, ensure_ascii=False, indent=2)
            html = html[: json_match.start(1)] + "\n  " + formatted_json + "\n  " + html[json_match.end(1) :]
        except Exception as e:
            print(f"Error updating JSON-LD for {slug}: {e}")

    # 6. Ensure exactly 1 H1 exists per page
    html = re.sub(r'<h1 class="hero__title">(.*?)</h1>', r'<h2 class="hero__title">\1</h2>', html, flags=re.DOTALL)

    if slug == "services":
        html = html.replace(
            '<h2 class="section-title" data-reveal>Готовые сценарии автоматизации</h2>',
            '<h1 class="section-title" data-reveal>Готовые сценарии автоматизации</h1>',
            1,
        )
    elif slug == "cases":
        html = html.replace(
            '<h2 class="section-title" data-reveal>Кейсы внедрения</h2>',
            '<h1 class="section-title" data-reveal>Кейсы внедрения</h1>',
            1,
        )
    elif slug == "calculator":
        html = html.replace(
            '<h2 class="section-title" data-reveal>Калькулятор окупаемости</h2>',
            '<h1 class="section-title" data-reveal>Калькулятор окупаемости</h1>',
            1,
        )
    elif slug == "dashboard":
        html = html.replace(
            '<h2 class="section-title" data-reveal>Ваши агенты могут работать прямо сейчас</h2>',
            '<h1 class="section-title" data-reveal>Ваши агенты могут работать прямо сейчас</h1>',
            1,
        )
    elif slug == "faq":
        html = html.replace(
            '<h2 class="section-title">Часто задаваемые вопросы</h2>',
            '<h1 class="section-title">Часто задаваемые вопросы</h1>',
            1,
        )
    elif slug == "contact":
        html = html.replace(
            '<h2 class="contact__title">Первый шаг — бесплатный аудит</h2>',
            '<h1 class="contact__title">Первый шаг — бесплатный аудит</h1>',
            1,
        )

    # For Services subpage: link primary CTA to #contact
    if slug == "services":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')

    # For Cases subpage: link secondary hero button to #cases, in-page CTAs to #contact
    if slug == "cases":
        html = html.replace(
            '<a href="/cases/" class="btn btn--ghost">Смотреть кейсы →</a>',
            '<a href="#cases" class="btn btn--ghost">Смотреть кейсы ↓</a>',
            1,
        )
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')

    # For Calculator subpage: ensure in-page contact routing
    if slug == "calculator":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')

    # For Dashboard subpage: ensure in-page contact routing
    if slug == "dashboard":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')

    # For FAQ subpage: promote FAQ section title to H1
    if slug == "faq":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')
        html = html.replace(
            '<h2 class="section-title">Часто задаваемые вопросы</h2>',
            '<h1 class="section-title">Часто задаваемые вопросы</h1>',
            1,
        )

    # For Contact subpage: promote Contact title to H1
    if slug == "contact":
        html = html.replace(
            '<h2 class="contact__title">Первый шаг — бесплатный аудит</h2>',
            '<h1 class="contact__title">Первый шаг — бесплатный аудит</h1>',
            1,
        )

    # 7. Insert deep_content at the beginning of <main id="main-content"> (if present)
    main_tag = '<main id="main-content">'
    if main_tag in html and spec.get("deep_content"):
        injection = (
            f'{main_tag}\n  <div class="container" style="padding-top:100px;">\n{spec["deep_content"]}\n  </div>'
        )
        html = html.replace(main_tag, injection, 1)

    return html


def main():
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        master_html = f.read()

    print(f"Master index.html loaded ({len(master_html)} bytes).")

    for slug, spec in SUBPAGES_SPEC.items():
        os.makedirs(spec["dir"], exist_ok=True)
        target_path = os.path.join(spec["dir"], "index.html")
        subpage_html = generate_subpage(slug, spec, master_html)
        with open(target_path, "w", encoding="utf-8") as out_f:
            out_f.write(subpage_html)
        print(f"  [OK] Generated Multi-Entry Hybrid subpage: {slug}/index.html ({len(subpage_html)} bytes)")

    print("All subpages successfully synchronized with zero CSS drift.")

    try:
        import sys

        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        if ROOT_DIR not in sys.path:
            sys.path.insert(0, ROOT_DIR)

        try:
            from scripts.sync_docs import run_sync
        except ImportError:
            import sync_docs

            run_sync = sync_docs.run_sync

        run_sync()
    except Exception as e:
        print(f"[WARN] Failed to trigger sync_docs: {e}")


if __name__ == "__main__":
    main()
