"""Generate the dedicated /pricing/ hub page from index.html + pricing_block.py."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from pricing_block import PRICE_RANGE_TEXT, get_offer_catalog_items, render_pricing_section

PRICING_URL = "https://ai-avtopilot.ru/pricing/"
PRICING_TITLE = "Стоимость внедрения ИИ-агентов и автоматизация 1С: цены от 50 000 ₽ | АвтоПилот"
PRICING_DESC = (
    "Стоимость внедрения ИИ-агентов: пилот 14 дней от 50 000 ₽ с зачетом в проект, "
    "внедрение под ключ от 125 000 ₽, серверы компании (On-Premise) от 400 000 ₽."
)

PRICING_FAQS: list[tuple[str, str]] = [
    (
        "Можно ли начать с пилота и зачесть его стоимость в основной проект?",
        "Да. За 14 дней мы запускаем агента на 1 процессе в 1С, CRM или ЭДО для проверки точности и скорости. При переходе к основному внедрению в течение 30 дней вся стоимость пилота (от 50 000 ₽) вычитается из сметы проекта.",
    ),
    (
        "От чего зависит бюджет внедрения под ключ (125 000 – 275 000 ₽)?",
        "От трех факторов: числа интеграций (1С, CRM, почта, телефония), качества исходных баз и регламентов, а также необходимости подключения корпоративной базы знаний (RAG).",
    ),
    (
        "Входят ли токены LLM и серверные мощности в стоимость разработки?",
        "Нет, мы не делаем наценку на инфраструктуру. В облачной схеме вы оплачиваете запросы напрямую провайдерам по своему ключу (BYOK), а в On-Premise модель работает на ваших серверах.",
    ),
    (
        "Какие форматы договора и оплаты поддерживаются для юрлиц РФ?",
        "Работаем по официальному договору подряда с юрлицами РФ: ОСНО с НДС 20% или УСН. Оплата 50/50 по акту приемки. ЭДО Диадок и СБИС, обязательный NDA.",
    ),
    (
        "Обязательна ли ежемесячная подписка на поддержку после запуска?",
        "Нет. Первые 30 дней гарантийного SLA включены в проект, после чего мы обучаем вашу команду и передаем регламенты. Продление поддержки от 25 000 ₽/мес — исключительно по вашему желанию.",
    ),
]


def _render_pricing_hero() -> str:
    return """  <!-- ═══════════════════ HERO ═══════════════════ -->
  <section class="hero" id="home">
    <div class="hero__particles" id="hero-particles" aria-hidden="true"></div>
    <div class="container hero__inner">
      <div class="hero__content" style="max-width:780px">
        <nav class="breadcrumbs" aria-label="Хлебные крошки" style="display:flex;gap:8px;align-items:center;font-size:.875rem;color:var(--text-3);margin-bottom:16px">
          <a href="/" style="color:var(--text-2);text-decoration:none">Главная</a>
          <span aria-hidden="true">/</span>
          <span style="color:var(--text-1)">Цены</span>
        </nav>
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">Фиксированный бюджет · Зачет пилота 100%</span>
        </div>
        <h1 class="hero__title">Стоимость внедрения <span class="grad-text">ИИ-агентов и автоматизации 1С</span></h1>
        <p class="hero__sub">Форматы запуска для 1С, CRM и ЭДО: от пилота за 14 дней до закрытого On-Premise контура по 152-ФЗ. Смета, этапы и SLA фиксируются в договоре.</p>
        <div class="hero__actions">
          <a href="#pricing" class="btn btn--primary btn--lg">Смотреть форматы</a>
          <a href="#contact" class="btn btn--ghost btn--lg">Запросить смету</a>
        </div>
      </div>
    </div>
  </section>"""


def _render_pricing_details() -> str:
    return """  <!-- ═══════════════════ PRICING DETAILS ═══════════════════ -->
  <section class="pricing-details" id="pricing-details">
    <div class="container">
      <div class="section-header" data-reveal="">
        <span class="section-tag">Архитектура и SLA</span>
        <h2 class="section-title">Сравнение контуров <span class="grad-text">Cloud vs On-Premise</span></h2>
        <p class="section-desc">Выбирайте размещение под требования службы безопасности, бюджет и требования 152-ФЗ.</p>
      </div>

      <div class="pricing-table-wrap" data-reveal="">
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Cloud / API (быстрый запуск)</th>
              <th>On-Premise 152-ФЗ (серверы компании)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Размещение</td>
              <td>Изолированный сервис в РФ или облачный API по ключу заказчика</td>
              <td>Полностью на серверах компании без внешнего трафика</td>
            </tr>
            <tr>
              <td>Языковые модели</td>
              <td>YandexGPT, GigaChat, OpenAI через ваш API-ключ</td>
              <td>Локальные LLM (vLLM, Qwen, Llama) или серверные версии РФ</td>
            </tr>
            <tr>
              <td>Срок запуска</td>
              <td>Пилот — 14 дней, внедрение — 3–6 недель</td>
              <td>От 6 недель с прохождением аудита ИБ</td>
            </tr>
            <tr>
              <td>Оплата LLM-ресурсов</td>
              <td>Прямая оплата токенов провайдеру без наценки</td>
              <td>Без платы за запросы — на мощностях ваших GPU-серверов</td>
            </tr>
            <tr>
              <td>Поддержка и SLA</td>
              <td>30 дней включено, далее сопровождение от 25 000 ₽/мес</td>
              <td>Выделенный инженер, мониторинг 24/7 и SLA в договоре</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pricing-terms" data-reveal="">
        <div class="pricing-terms__item">
          <h3>Юридическая схема РФ</h3>
          <p>Договор с российским юрлицом: ОСНО с НДС 20% или УСН. Документооборот через Диадок или СБИС, NDA подписываем до передачи доступов.</p>
        </div>
        <div class="pricing-terms__item">
          <h3>График оплаты 50% / 50%</h3>
          <p>Аванс 50% на старте этапа, 50% — после проверки точности работы агента на ваших примерах и подписания акта приемки.</p>
        </div>
        <div class="pricing-terms__item">
          <h3>Гарантийный SLA без скрытых подписок</h3>
          <p>Первые 30 дней гарантийного SLA включены в проект. Далее система передается вашей ИТ-команде либо подключается сопровождение от 25 000 ₽/мес.</p>
        </div>
      </div>
    </div>
  </section>"""


def _render_faq_section() -> str:
    items_html = []
    for question, answer in PRICING_FAQS:
        items_html.append(
            f"""        <div class="faq-item">
          <button class="faq-item__header" aria-expanded="false" type="button">
            <span class="faq-item__question">{question}</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>{answer}</p>
            </div>
          </div>
        </div>"""
        )
    joined = "\n".join(items_html)
    return f"""  <!-- ═══════════════════ FAQ SECTION ═══════════════════ -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-header" data-reveal="">
        <span class="section-tag">Частые вопросы</span>
        <h2 class="section-title">Вопросы о <span class="grad-text">стоимости и условиях</span></h2>
        <p class="section-desc" style="color:var(--text-2);margin-top:12px;">Коротко о зачете пилота, оплате токенов, ЭДО и поддержке после запуска.</p>
      </div>
      <div class="faq__grid" data-reveal="">
{joined}
      </div>
    </div>
  </section>"""


def build_pricing_page() -> Path:
    index_path = ROOT_DIR / "index.html"
    css_path = ROOT_DIR / "assets" / "css" / "styles.min.css"
    out_dir = ROOT_DIR / "pricing"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "index.html"

    raw_css = css_path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    css_hash = hashlib.md5(raw_css).hexdigest()[:8]
    soup = BeautifulSoup(index_path.read_text(encoding="utf-8"), "html.parser")

    # 1. Swap inline #app-styles for cached external styles.min.css
    app_styles = soup.find("style", id="app-styles")
    if app_styles:
        link_tag = soup.new_tag("link", rel="stylesheet", href=f"/assets/css/styles.min.css?v={css_hash}")
        app_styles.replace_with(link_tag)

    # 2. Update title, canonical, meta description, OG & Twitter
    if soup.title:
        soup.title.string = PRICING_TITLE

    canonical = soup.find("link", rel="canonical")
    if canonical:
        canonical["href"] = PRICING_URL

    for attr_name, attr_val, content in [
        ("name", "description", PRICING_DESC),
        ("property", "og:url", PRICING_URL),
        ("property", "og:title", PRICING_TITLE),
        ("property", "og:description", PRICING_DESC),
        ("name", "twitter:title", PRICING_TITLE),
        ("name", "twitter:description", PRICING_DESC),
    ]:
        tag = soup.find("meta", attrs={attr_name: attr_val})
        if tag:
            tag["content"] = content

    # 3. Update Schema.org JSON-LD
    json_ld = soup.find("script", attrs={"type": "application/ld+json"})
    if json_ld and json_ld.string:
        data = json.loads(json_ld.string)
        graph = []
        for item in data.get("@graph", []):
            item_type = item.get("@type")
            if item_type in ("FAQPage", "BreadcrumbList", "WebSite"):
                continue
            if item_type == "ProfessionalService":
                item["priceRange"] = PRICE_RANGE_TEXT
                item["hasOfferCatalog"] = {
                    "@type": "OfferCatalog",
                    "name": "Форматы внедрения ИИ-агентов",
                    "itemListElement": get_offer_catalog_items(),
                }
            graph.append(item)

        graph.append(
            {
                "@type": "BreadcrumbList",
                "@id": f"{PRICING_URL}#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": "Цены", "item": PRICING_URL},
                ],
            }
        )
        graph.append(
            {
                "@type": "FAQPage",
                "@id": f"{PRICING_URL}#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a},
                    }
                    for q, a in PRICING_FAQS
                ],
            }
        )
        data["@graph"] = graph
        json_ld.string = "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n"

    # 4. Mark /pricing/ nav link active
    nav_links = soup.find("ul", id="nav-links")
    if nav_links:
        for a in nav_links.find_all("a", class_="nav__link"):
            classes = [c for c in (a.get("class") or []) if c != "active"]
            if a.get("href") == "/pricing/":
                classes.append("active")
            a["class"] = classes

    # 5. Remove non-pricing sections (especially #compare for 42-file invariant)
    for sec_id in ("calculator", "compare", "services", "cases", "dashboard", "other-services"):
        sec = soup.find("section", id=sec_id)
        if sec:
            sec.decompose()

    # 6. Replace Hero, #pricing, insert #pricing-details, replace #faq
    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.replace_with(BeautifulSoup(_render_pricing_hero(), "html.parser"))

    pricing_sec = soup.find("section", id="pricing")
    pricing_markup = render_pricing_section(active_hub=True) + "\n\n" + _render_pricing_details()
    if pricing_sec:
        pricing_sec.replace_with(BeautifulSoup(pricing_markup, "html.parser"))

    faq_sec = soup.find("section", id="faq")
    if faq_sec:
        faq_sec.replace_with(BeautifulSoup(_render_faq_section(), "html.parser"))

    out_path.write_text(str(soup), encoding="utf-8")
    print(f"[build_pricing_page] Generated {out_path} (css v={css_hash})")
    return out_path


if __name__ == "__main__":
    build_pricing_page()
