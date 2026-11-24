"""Shared #pricing section renderer and OfferCatalog helpers for АвтоПилот."""

from __future__ import annotations

PRICE_RANGE_TEXT = "от 50 000 ₽"


def get_offer_catalog_items() -> list[dict]:
    """Return Schema.org Offer items matching the 3 unified pricing tiers."""
    return [
        {
            "@type": "Offer",
            "name": "Пилот 14 дней",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "50000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Пилот 14 дней: 1 рабочий сценарий в 1С, CRM или ЭДО с проверкой метрик и зачетом в проект",
            },
        },
        {
            "@type": "Offer",
            "name": "Внедрение под ключ",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "125000",
                "maxPrice": "275000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Внедрение под ключ: 1–3 ИИ-агента, интеграция 1С/CRM/ЭДО, база знаний RAG и SLA 30 дней",
            },
        },
        {
            "@type": "Offer",
            "name": "Серверы компании (On-Premise)",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "400000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Серверы компании (On-Premise): закрытый контур по 152-ФЗ, локальные нейросети, 1С:ERP, NDA и SLA 24/7",
            },
        },
    ]


def render_pricing_section(active_hub: bool = False) -> str:
    """Render the unified cross-site #pricing section HTML."""
    return f"""  <!-- ═══════════════════ PRICING ═══════════════════ -->
  <section class="pricing" id="pricing">
    <div class="container">
      <div class="section-header" data-reveal="">
        <span class="section-tag">Стоимость</span>
        <h2 class="section-title">Прозрачные форматы <span class="grad-text">запуска</span></h2>
        <p class="section-desc">Фиксированная смета, критерии приемки и гарантийный SLA в договоре.</p>
      </div>

      <div class="pricing__grid">
        <article class="pricing__card" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__tier">Быстрый старт</span>
            <h3 class="pricing__title"><a href="/pricing/" class="pricing__title-link">Пилот 14 дней</a></h3>
            <div class="pricing__price">от 50 000 ₽</div>
            <p class="pricing__meta">14 дней · 1 процесс</p>
          </div>
          <ul class="pricing__list">
            <li>1 рабочий сценарий в 1С, CRM или ЭДО</li>
            <li>Тест на копии базы: без риска для боевых систем</li>
            <li><strong>100% стоимости</strong> пилота идет в зачет внедрения</li>
          </ul>
          <a href="#contact" class="btn btn--ghost btn--full pricing__cta">Обсудить пилот</a>
        </article>

        <article class="pricing__card pricing__card--featured" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__badge">★ Оптимальный</span>
            <h3 class="pricing__title"><a href="/pricing/" class="pricing__title-link">Внедрение под ключ</a></h3>
            <div class="pricing__price">от 125 000 ₽</div>
            <p class="pricing__meta">125 000 – 275 000 ₽ · 3–6 недель</p>
          </div>
          <ul class="pricing__list">
            <li>1–3 ИИ-агента в ваших рабочих программах</li>
            <li>Интеграция с 1С, CRM и базой знаний (RAG)</li>
            <li>Обучение команды и 30 дней гарантийного SLA</li>
          </ul>
          <a href="#contact" class="btn btn--primary btn--full pricing__cta">Обсудить внедрение</a>
        </article>

        <article class="pricing__card" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__tier">Закрытый контур</span>
            <h3 class="pricing__title"><a href="/pricing/" class="pricing__title-link">Серверы компании (On-Premise)</a></h3>
            <div class="pricing__price">от 400 000 ₽</div>
            <p class="pricing__meta">от 6 недель · 152-ФЗ</p>
          </div>
          <ul class="pricing__list">
            <li>Развертывание на ваших серверах без выхода наружу</li>
            <li>Локальные нейросети: данные строго по 152-ФЗ</li>
            <li>Интеграция с 1С:ERP/SAP, аудит ИБ и SLA 24/7</li>
          </ul>
          <a href="#contact" class="btn btn--ghost btn--full pricing__cta">Запросить смету</a>
        </article>
      </div>
      <div class="slider-controls">
        <button type="button" class="slider-arrow slider-arrow--prev" id="pricing-prev" aria-label="Предыдущие тарифы" title="Предыдущие тарифы">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="carousel-dots pricing-dots" id="pricing-dots"></div>
        <button type="button" class="slider-arrow slider-arrow--next" id="pricing-next" aria-label="Следующие тарифы" title="Следующие тарифы">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  </section>"""
