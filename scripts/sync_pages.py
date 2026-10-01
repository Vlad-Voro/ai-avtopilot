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
        "description": "Профессиональные услуги роботизации процессов (RPA + LLM): интеграция ИИ с 1С:ERP, УТ, Бухгалтерия, цифровой документооборот ЭДО, склад и саппорт 24/7.",
        "h1": "Услуги внедрения ИИ-агентов и роботизации процессов",
        "breadcrumb_name": "Услуги",
        "deep_content": "",
    },
    "cases": {
        "dir": os.path.join(ROOT_DIR, "cases"),
        "title": "Кейсы внедрения ИИ-агентов: результаты, окупаемость и ROI | АвтоПилот",
        "description": "Реальные кейсы автоматизации бизнеса: логистика, ритейл, B2B-дистрибуция. Экономия 9 200+ рабочих часов, средний ROI 340%, окупаемость за 1.5–3 месяца.",
        "h1": "Кейсы внедрения ИИ-агентов и результаты автоматизации",
        "breadcrumb_name": "Кейсы",
        "deep_content": """
      <div class="subpage-deep" data-reveal>
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>Кейсы</span>
        </nav>
        <h1 class="subpage-deep__title">Кейсы внедрения ИИ-агентов: доказанный ROI и метрики</h1>
        <p class="subpage-deep__desc">
          В нашем портфолио более 47 успешно завершенных проектов роботизации рутины на предприятиях России. Ниже представлены ключевые кейсы с верифицированными метриками до и после внедрения автономных ИИ-ассистентов.
        </p>

        <div style="overflow-x:auto;">
          <table class="subpage-table">
            <thead>
              <tr>
                <th>Отрасль / Профиль</th>
                <th>Проблема до внедрения</th>
                <th>Решение АвтоПилот</th>
                <th>Доказанный результат</th>
                <th>Срок окупаемости</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Федеральная логистика</strong> (120+ тягачей, 450 контрагентов)</td>
                <td>Ручной ввод 18 мин на накладную, задержка закрытия месяца 10 дней</td>
                <td>Локальный агент распознавания OCR + 1С:Бухгалтерия</td>
                <td>45 сек / документ, экономия 1 850 ч/мес, точность 99.2%</td>
                <td>1.2 месяца (ROI 380%)</td>
              </tr>
              <tr>
                <td><strong>Розничная сеть (Retail)</strong> (35 точек, 14 000 SKU)</td>
                <td>Out-of-stock 18%, кассовые разрывы, ручные Excel-сводки</td>
                <td>Предиктивный ИИ-контроль остатков и автозаказ поставщикам</td>
                <td>Снижение out-of-stock на 38%, высвобождено 14.5 млн ₽ оборотки</td>
                <td>2.0 месяца (ROI 320%)</td>
              </tr>
              <tr>
                <td><strong>B2B-дистрибуция оборудования</strong> (чек 650 000 ₽)</td>
                <td>Ответ менеджера до 4.5 часов, потеря до 30% входящих лидов</td>
                <td>Омниканальный ИИ-ассистент квалификации в Telegram и CRM</td>
                <td>Ответ за 40 сек, конверсия в счет +24%, рост выручки +18%</td>
                <td>1.8 месяца (ROI 350%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:24px;">
          <a href="/calculator/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Рассчитать ROI под ваши параметры →</a>
          <a href="/services/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Стек интеграции (1С, ЭДО, CRM) →</a>
          <a href="#contact" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Заказать бесплатный аудит →</a>
        </div>
      </div>
""",
    },
    "calculator": {
        "dir": os.path.join(ROOT_DIR, "calculator"),
        "title": "Калькулятор окупаемости ИИ и расчет ROI автоматизации | АвтоПилот",
        "description": "Интерактивный онлайн калькулятор окупаемости ИИ-агентов. Рассчитайте экономию затрат, высвобождаемые часы сотрудников и срок окупаемости для вашего бизнеса.",
        "h1": "Калькулятор окупаемости ИИ-автоматизации и расчет ROI",
        "breadcrumb_name": "Калькулятор",
        "deep_content": """
      <div class="subpage-deep" data-reveal>
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>Калькулятор ROI</span>
        </nav>
        <h1 class="subpage-deep__title">Калькулятор окупаемости ИИ-автоматизации и расчёт ROI</h1>
        <p class="subpage-deep__desc">
          Оцените потенциал высвобождения трудовых ресурсов и прямой финансовой выгоды от внедрения ИИ-агентов в рутинные процессы вашей организации.
        </p>

        <h3 style="color:var(--text-1);margin:24px 0 12px;font-family:var(--font-head);font-size:1.2rem;">Математическая методология расчёта</h3>
        <p style="color:var(--text-2);font-size:0.95rem;line-height:1.65;margin-bottom:16px;">
          Формула основана на прямых затратах рабочего времени сотрудников, занятых ручным заполнением 1С, сверкой таблиц, перепечаткой накладных и обработкой типовых обращений:
        </p>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px 20px;font-family:var(--font-mono);font-size:0.88rem;color:var(--accent-1);margin-bottom:20px;">
          Годовая экономия (₽) = Сотрудники × Часы_рутины_в_неделю × (Ставка/160) × 52 недели × 80%_автоматизации
        </div>
        <p style="color:var(--text-3);font-size:0.85rem;line-height:1.6;">
          Коэффициент 80% отражает консервативную долю типовых операций, которые полностью делегируются ИИ-агентам без участия человека. Оставшиеся 20% нестандартных исключений направляются на верификацию ведущим специалистам.
        </p>

        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:24px;">
          <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Реальные кейсы клиентов с ROI 340% →</a>
          <a href="/faq/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Вопросы и ответы по окупаемости →</a>
          <a href="#contact" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Получить экспресс-аудит (30 мин) →</a>
        </div>
      </div>
""",
    },
    "dashboard": {
        "dir": os.path.join(ROOT_DIR, "dashboard"),
        "title": "Интерактивный дашборд и мониторинг работы ИИ-агентов | АвтоПилот",
        "description": "Демонстрация интерфейса мониторинга ИИ-агентов: телеметрия в реальном времени, скорость обработки, процент автономных решений, журнал событий 1С и ЭДО.",
        "h1": "Интерактивный дашборд мониторинга и метрик ИИ-агентов",
        "breadcrumb_name": "Дашборд",
        "deep_content": "",
    },
    "faq": {
        "dir": os.path.join(ROOT_DIR, "faq"),
        "title": "Частые вопросы по внедрению ИИ-агентов и автоматизации | АвтоПилот",
        "description": "Ответы на ключевые вопросы по роботизации бизнеса: сроки запуска за 14 дней, интеграция с 1С и SAP без доработок, безопасность данных по 152-ФЗ, окупаемость и ROI.",
        "h1": "Часто задаваемые вопросы",
        "breadcrumb_name": "FAQ",
        "deep_content": "",
    },
    "contact": {
        "dir": os.path.join(ROOT_DIR, "contact"),
        "title": "Контакты и запись на бесплатный аудит процессов | АвтоПилот",
        "description": "Запишитесь на 30-минутный бесплатный аудит бизнес-процессов. Официальные контакты: Telegram-бот @AiAvtopilotbot, e-mail contact@ai-avtopilot.ru, поддержка 24/7 онлайн.",
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
    if spec.get("deep_content"):
        html = re.sub(r'<h1 class="hero__title">(.*?)</h1>', r'<h2 class="hero__title">\1</h2>', html, flags=re.DOTALL)
    elif slug == "faq":
        html = re.sub(r'<h1 class="hero__title">(.*?)</h1>', r'<h2 class="hero__title">\1</h2>', html, flags=re.DOTALL)
        html = html.replace(
            '<h2 class="section-title">Часто задаваемые вопросы</h2>',
            '<h1 class="section-title">Часто задаваемые вопросы</h1>',
            1,
        )
    elif slug == "contact":
        html = re.sub(r'<h1 class="hero__title">(.*?)</h1>', r'<h2 class="hero__title">\1</h2>', html, flags=re.DOTALL)
        html = html.replace(
            '<h2 class="contact__title">Первый шаг — бесплатный аудит</h2>',
            '<h1 class="contact__title">Первый шаг — бесплатный аудит</h1>',
            1,
        )

    # For Services subpage: append cross-linking mesh before contact section
    if slug == "services":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')
        services_directions_mesh = """  <!-- ═══════════════════ PAGERANK CROSS-LINKING MESH ═══════════════════ -->
  <section class="container" style="padding: 10px 24px 30px;">
    <div class="subpage-deep" data-reveal="">
      <h3 style="font-family:var(--font-head); font-size:1.15rem; margin-bottom:14px; color:var(--text-1);">Другие направления автоматизации АвтоПилот</h3>
      <div class="subpage-links-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        <a href="/services/automated-reporting/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">📊 Автоотчётность</a>
        <a href="/services/ai-analytics/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">🧠 ИИ-аналитика</a>
        <a href="/services/system-integration/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">🔄 Интеграция систем</a>
        <a href="/services/retail-inventory/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">🏪 Ритейл и склад</a>
        <a href="/services/document-automation/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">📄 Документооборот</a>
        <a href="/services/customer-support/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">💬 ИИ-поддержка</a>
        <a href="/services/rapid-pilot/" class="btn btn--ghost" style="justify-content:flex-start; font-size:0.85rem; padding:10px 14px;">⚡ Быстрый старт</a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ CTA + CONTACT ═══════════════════ -->"""
        html = html.replace(
            "  <!-- ═══════════════════ CTA + CONTACT ═══════════════════ -->", services_directions_mesh, 1
        )

    # For Cases subpage: link secondary hero button to #cases and in-page CTAs to #contact
    if slug == "cases":
        html = html.replace(
            '<a href="/cases/" class="btn btn--ghost">Смотреть кейсы →</a>',
            '<a href="#cases" class="btn btn--ghost">Смотреть кейсы ↓</a>',
            1,
        )
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')

    # For Dashboard subpage: append cross-linking mesh at the end of the telemetry dashboard section
    if slug == "dashboard":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')
        dash_mesh_target = "        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════ CTA + CONTACT ═══════════════════ -->"
        dash_mesh_replacement = """        </div>
      </div>
      <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:28px;justify-content:center;">
        <a href="/services/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Каталог поддерживаемых систем →</a>
        <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Кейсы с подтвержденными метриками →</a>
        <a href="#contact" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Подключить телеметрию для бизнеса →</a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ CTA + CONTACT ═══════════════════ -->"""
        html = html.replace(dash_mesh_target, dash_mesh_replacement, 1)

    # For FAQ subpage: promote FAQ section title to H1 and append PageRank mesh under accordion
    if slug == "faq":
        html = html.replace('href="/contact/" class="btn btn--primary"', 'href="#contact" class="btn btn--primary"')
        html = html.replace(
            '<h2 class="section-title">Часто задаваемые вопросы</h2>',
            '<h1 class="section-title">Часто задаваемые вопросы</h1>',
            1,
        )
        faq_mesh_target = "      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════ LIVE DASHBOARD ═══════════════════ -->"
        faq_mesh_replacement = """        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:28px;justify-content:center;">
          <a href="/services/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Технический стек и протоколы →</a>
          <a href="/calculator/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Интерактивный калькулятор экономии →</a>
          <a href="#contact" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Записаться на 30-минутный аудит →</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ LIVE DASHBOARD ═══════════════════ -->"""
        html = html.replace(faq_mesh_target, faq_mesh_replacement, 1)

    # For Contact subpage: promote Contact title to H1 and append B2B trust mesh & subpage links at the bottom
    if slug == "contact":
        html = html.replace(
            '<h2 class="contact__title">Первый шаг — бесплатный аудит</h2>',
            '<h1 class="contact__title">Первый шаг — бесплатный аудит</h1>',
            1,
        )
        contact_mesh_target = "    </div>\n  </section>\n  </main>"
        contact_mesh_replacement = """      <div class="contact-b2b" style="margin-top:36px;border-top:1px solid var(--border);padding-top:24px;">
        <h3 style="color:var(--text-1);margin-bottom:16px;font-family:var(--font-head);font-size:1.15rem;">Корпоративные стандарты работы и гарантии (B2B)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:24px;">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--accent-1);display:block;margin-bottom:6px;">ЭДО (Диадок / СБИС)</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Мгновенный обмен юридически значимыми документами и закрывающими актами без бумаги.</span>
          </div>
          <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.3);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--green);display:block;margin-bottom:6px;">Безналичный расчет</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Официальный счет-договор для юридических лиц и ИП с фиксацией SLA и измеримых KPI.</span>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--text-1);display:block;margin-bottom:6px;">NDA и безопасность</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Строгое соглашение о неразглашении перед стартом. Обработка данных строго по 152-ФЗ РФ.</span>
          </div>
        </div>
        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:20px;">
          <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Смотреть подтвержденные кейсы →</a>
          <a href="/calculator/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Рассчитать окупаемость →</a>
          <a href="/faq/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Частые вопросы (FAQ) →</a>
        </div>
      </div>
    </div>
  </section>
  </main>"""
        html = html.replace(contact_mesh_target, contact_mesh_replacement, 1)

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


if __name__ == "__main__":
    main()
