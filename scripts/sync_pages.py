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
        "deep_content": """
      <div class="subpage-deep" data-reveal>
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>Услуги</span>
        </nav>
        <h1 class="subpage-deep__title">Услуги внедрения ИИ-агентов и автоматизации процессов</h1>
        <p class="subpage-deep__desc">
          «АвтоПилот» проектирует и развёртывает автономных ИИ-агентов, которые интегрируются в корпоративный контур без изменения архитектуры существующих систем. Мы автоматизируем до 80% учетных и транзакционных операций бухгалтерии, логистики, снабжения, продаж и клиентского сервиса.
        </p>

        <h3 style="color:var(--text-1);margin:24px 0 12px;font-family:var(--font-head);font-size:1.2rem;">Стек интеграционных протоколов и поддерживаемые платформы</h3>
        <div style="overflow-x:auto;">
          <table class="subpage-table">
            <thead>
              <tr>
                <th>Платформа / Система</th>
                <th>Метод интеграции</th>
                <th>Автоматизируемые задачи</th>
                <th>Скорость обработки</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1С:ERP / УТ / Бухгалтерия</strong></td>
                <td>1C OData REST API, HTTP-сервисы, COM</td>
                <td>Распознавание первички (УПД, счета), сверка взаиморасчетов, P&L отчёты</td>
                <td>45 сек / документ</td>
              </tr>
              <tr>
                <td><strong>ЭДО (Диадок / СБИС)</strong></td>
                <td>Контур.Диадок SDK, Тензор API</td>
                <td>Юридический аудит договоров, автоподписание актов, маршрутизация</td>
                <td>30 сек / договор</td>
              </tr>
              <tr>
                <td><strong>Маркетплейсы (WB, Ozon, Я.Маркет)</strong></td>
                <td>Seller Open API, WMS Webhooks</td>
                <td>Мониторинг цен конкурентов, автопереоценка, контроль страховых остатков</td>
                <td>В режиме 24/7</td>
              </tr>
              <tr>
                <td><strong>CRM (Битрикс24, amoCRM)</strong></td>
                <td>REST Webhooks, Open Channels</td>
                <td>Квалификация лидов BANT/SPIN, формирование КП, автоответы 24/7</td>
                <td>&lt; 40 секунд</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style="color:var(--text-1);margin:28px 0 12px;font-family:var(--font-head);font-size:1.2rem;">Регламент пилотного запуска за 14 дней</h3>
        <p style="color:var(--text-2);font-size:0.95rem;line-height:1.65;">
          Каждый проект начинается с фиксированного 14-дневного пилота. Мы берем 1–3 ключевых участка учета, подключаем модель к вашим данным через защищенный шлюз и калибруем точность до 99%+. Вы оплачиваете основной контракт только после подтверждения измеримого экономического эффекта.
        </p>

        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:24px;">
          <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Смотреть кейсы внедрения →</a>
          <a href="/calculator/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Рассчитать ROI на калькуляторе →</a>
          <a href="/faq/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Частые вопросы (FAQ) →</a>
        </div>
      </div>
""",
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
          <a href="/contact/" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Заказать бесплатный аудит →</a>
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
          <a href="/contact/" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Получить экспресс-аудит (30 мин) →</a>
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
        "deep_content": """
      <div class="subpage-deep" data-reveal>
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>Дашборд</span>
        </nav>
        <h1 class="subpage-deep__title">Интерактивный дашборд и метрики эффективности агентов</h1>
        <p class="subpage-deep__desc">
          Каждое корпоративное внедрение «АвтоПилот» оснащается системой сквозной телеметрии. Руководитель видит объём обработанных задач, скорость выполнения каждого агента и экономический эффект за смену в режиме реального времени.
        </p>

        <h3 style="color:var(--text-1);margin:24px 0 12px;font-family:var(--font-head);font-size:1.2rem;">Ключевые параметры мониторинга</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin:20px 0;">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;">
            <strong style="color:var(--accent-1);display:block;font-size:1.3rem;font-family:var(--font-head);">99.4%</strong>
            <span style="color:var(--text-3);font-size:0.8rem;">Автономность без участия человека</span>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;">
            <strong style="color:var(--green);display:block;font-size:1.3rem;font-family:var(--font-head);">&lt; 45 сек</strong>
            <span style="color:var(--text-3);font-size:0.8rem;">Среднее время операции в 1С/ЭДО</span>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;">
            <strong style="color:var(--text-1);display:block;font-size:1.3rem;font-family:var(--font-head);">99.9%</strong>
            <span style="color:var(--text-3);font-size:0.8rem;">Гарантированный SLA доступности</span>
          </div>
        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:24px;">
          <a href="/services/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Каталог поддерживаемых систем →</a>
          <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Кейсы с подтвержденными метриками →</a>
          <a href="/contact/" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Подключить телеметрию для бизнеса →</a>
        </div>
      </div>
""",
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
        "h1": "Контакты и запись на бесплатный экспресс-аудит",
        "breadcrumb_name": "Контакты",
        "deep_content": """
      <div class="subpage-deep" data-reveal>
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>Контакты</span>
        </nav>
        <h1 class="subpage-deep__title">Контакты и запись на бесплатный экспресс-аудит</h1>
        <p class="subpage-deep__desc">
          Оставьте заявку на бесплатный 30-минутный аудит или свяжитесь с нами напрямую через официальные каналы. Мы оперативно ответим и подберем оптимальный сценарий автоматизации для вашего стека систем.
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:20px;margin:24px 0;">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
            <span style="color:var(--accent-1);font-family:var(--font-mono);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;">Прямой контакт</span>
            <h4 style="font-family:var(--font-head);font-size:1.2rem;margin:8px 0 12px;">Telegram-бот</h4>
            <p style="color:var(--text-2);font-size:0.9rem;margin-bottom:16px;">Мгновенная связь с дежурным инженером и ботом автоматизации</p>
            <a href="https://t.me/AiAvtopilotbot" target="_blank" rel="noopener noreferrer" class="btn btn--primary" style="padding:10px 20px;font-size:0.88rem;">@AiAvtopilotbot →</a>
          </div>

          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
            <span style="color:var(--accent-1);font-family:var(--font-mono);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;">Электронная почта</span>
            <h4 style="font-family:var(--font-head);font-size:1.2rem;margin:8px 0 12px;">Email для запросов</h4>
            <p style="color:var(--text-2);font-size:0.9rem;margin-bottom:16px;">Для отправки ТЗ, проектов договоров и соглашений о конфиденциальности (NDA)</p>
            <a href="mailto:contact@ai-avtopilot.ru" class="btn btn--ghost" style="padding:10px 20px;font-size:0.88rem;">contact@ai-avtopilot.ru</a>
          </div>

          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
            <span style="color:var(--accent-1);font-family:var(--font-mono);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;">График работы</span>
            <h4 style="font-family:var(--font-head);font-size:1.2rem;margin:8px 0 12px;">Режим поддержки</h4>
            <p style="color:var(--text-2);font-size:0.9rem;line-height:1.6;">
              Круглосуточно<br />
              <strong>24/7 онлайн</strong><br />
              <span style="color:var(--text-3);font-size:0.8rem;">г. Москва · Работаем по всей России</span>
            </p>
          </div>
        </div>

        <h3 style="color:var(--text-1);margin:28px 0 16px;font-family:var(--font-head);font-size:1.2rem;">Корпоративные стандарты работы и гарантии (B2B)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;margin-bottom:24px;">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--accent-1);display:block;margin-bottom:6px;">ЭДО (Диадок / СБИС)</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Мгновенный обмен юридически значимыми документами и закрывающими актами без бумаги.</span>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--green);display:block;margin-bottom:6px;">Безналичный расчет</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Официальный счет-договор для юридических лиц и ИП с фиксацией SLA и измеримых KPI.</span>
          </div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
            <strong style="color:var(--text-1);display:block;margin-bottom:6px;">NDA и безопасность</strong>
            <span style="color:var(--text-2);font-size:0.85rem;line-height:1.5;display:block;">Строгое соглашение о неразглашении перед стартом. Обработка данных строго по 152-ФЗ РФ.</span>
          </div>
        </div>

        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;">
          <a href="/faq/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">База знаний и частые вопросы →</a>
          <a href="/cases/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Смотреть подтвержденные кейсы →</a>
        </div>
      </div>
""",
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

    # 6. Transform <h1 class="hero__title"> to <h2 class="hero__title"> on subpages so exactly 1 H1 exists
    html = re.sub(r'<h1 class="hero__title">(.*?)</h1>', r'<h2 class="hero__title">\1</h2>', html, flags=re.DOTALL)

    # For FAQ subpage: promote FAQ section title to H1 and append PageRank mesh under accordion
    if slug == "faq":
        html = html.replace(
            '<h2 class="section-title">Часто задаваемые вопросы</h2>',
            '<h1 class="section-title">Часто задаваемые вопросы</h1>',
            1,
        )
        faq_mesh_target = "      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════ LIVE DASHBOARD ═══════════════════ -->"
        faq_mesh_replacement = """        <div class="subpage-links-grid" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:28px;justify-content:center;">
          <a href="/services/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Технический стек и протоколы →</a>
          <a href="/calculator/" class="btn btn--ghost" style="padding:10px 18px;font-size:0.88rem;">Интерактивный калькулятор экономии →</a>
          <a href="/contact/" class="btn btn--primary" style="padding:10px 18px;font-size:0.88rem;">Записаться на 30-минутный аудит →</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════ LIVE DASHBOARD ═══════════════════ -->"""
        html = html.replace(faq_mesh_target, faq_mesh_replacement, 1)

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
