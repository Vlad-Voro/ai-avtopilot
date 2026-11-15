"""Shared #pricing section renderer and OfferCatalog helpers for АвтоПилот."""

from __future__ import annotations

PRICE_RANGE_TEXT = "от 100 000 ₽"


def get_offer_catalog_items() -> list[dict]:
    """Return Schema.org Offer items matching the 3 unified pricing tiers."""
    return [
        {
            "@type": "Offer",
            "name": "Пилот 14 дней",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "100000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Пилот 14 дней: автоматизация 1 процесса в 1С, CRM или ЭДО в песочнице с замером KPI",
            },
        },
        {
            "@type": "Offer",
            "name": "Внедрение под ключ",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "250000",
                "maxPrice": "550000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Внедрение под ключ: 1–3 ИИ-агента, интеграция 1С/CRM/ЭДО, RAG, обучение команды и SLA 30 дней",
            },
        },
        {
            "@type": "Offer",
            "name": "Enterprise On-Premise (152-ФЗ)",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "minPrice": "800000",
                "priceCurrency": "RUB",
            },
            "itemOffered": {
                "@type": "Service",
                "name": "Enterprise On-Premise (152-ФЗ): закрытый контур, локальные LLM, 1С:ERP/УХ, NDA и SLA 24/7",
            },
        },
    ]


def render_pricing_section(active_hub: bool = False) -> str:
    """Render the unified cross-site #pricing section HTML."""
    hub_link_html = (
        ""
        if active_hub
        else '\n        <a href="/pricing/" class="pricing__hub-link">Подробные условия, SLA и сравнение Cloud vs On-Premise →</a>'
    )
    return f"""  <!-- ═══════════════════ PRICING ═══════════════════ -->
  <section class="pricing" id="pricing">
    <div class="container">
      <div class="section-header" data-reveal="">
        <span class="section-tag">Стоимость внедрения</span>
        <h2 class="section-title">Прозрачные форматы <span class="grad-text">запуска ИИ-агентов</span></h2>
        <p class="section-desc">Фиксируем бюджет и KPI в договоре до старта работ. Поэтапная оплата по ЭДО без скрытых платежей.</p>
      </div>

      <div class="pricing__grid">
        <article class="pricing__card" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__tier">Быстрый старт</span>
            <h3 class="pricing__title">Пилот 14 дней</h3>
            <div class="pricing__price">от 100 000 ₽</div>
            <p class="pricing__meta">Срок: 14 дней · 1 процесс</p>
          </div>
          <ul class="pricing__list">
            <li>1 процесс в 1С, CRM или ЭДО на реальных документах</li>
            <li>Запуск в песочнице без остановки текущей работы</li>
            <li>Замер KPI до и после внедрения по договору</li>
            <li><strong>100% оплаты пилота засчитывается</strong> в основное внедрение в течение 30 дней</li>
          </ul>
          <a href="#contact" class="btn btn--ghost btn--full pricing__cta">Обсудить пилот</a>
        </article>

        <article class="pricing__card pricing__card--featured" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__badge">★ Оптимальный</span>
            <h3 class="pricing__title">Внедрение под ключ</h3>
            <div class="pricing__price">от 250 000 ₽</div>
            <p class="pricing__meta">Вилка типового проекта: 250 000 – 550 000 ₽ · 3–6 недель</p>
          </div>
          <ul class="pricing__list">
            <li>1–3 автономных ИИ-агента в промышленной эксплуатации</li>
            <li>Интеграция с 1С, CRM, ЭДО и корпоративной базой знаний (RAG)</li>
            <li>Обучение сотрудников и передача регламентов поддержки</li>
            <li>Гарантийный SLA 30 дней после запуска включен</li>
          </ul>
          <a href="#contact" class="btn btn--primary btn--full pricing__cta">Обсудить внедрение</a>
        </article>

        <article class="pricing__card" data-reveal="">
          <div class="pricing__head">
            <span class="pricing__tier">Корпоративный контур</span>
            <h3 class="pricing__title">Enterprise On-Premise (152-ФЗ)</h3>
            <div class="pricing__price">от 800 000 ₽</div>
            <p class="pricing__meta">Срок: от 6 недель · Закрытый контур</p>
          </div>
          <ul class="pricing__list">
            <li>Развертывание полностью на серверах заказчика</li>
            <li>Локальные LLM (vLLM, YandexGPT, GigaChat) без внешнего трафика</li>
            <li>Интеграция с 1С:ERP, 1С:УХ, SAP и прохождение аудита ИБ</li>
            <li>Соглашение о неразглашении (NDA) и мониторинг SLA 24/7</li>
          </ul>
          <a href="#contact" class="btn btn--ghost btn--full pricing__cta">Запросить смету</a>
        </article>
      </div>

      <div class="pricing__footnote" data-reveal="">
        <p><strong>Прозрачные условия РФ:</strong> поддержка и SLA после запуска — от 25 000 ₽/мес (опционально). LLM-токены (BYOK) или GPU-серверы оплачиваются заказчиком напрямую без наценки. Работаем по договору (ОСНО с НДС 20% или УСН без НДС), оплата 50%/50%, закрывающие документы через ЭДО Диадок и СБИС.</p>{hub_link_html}
      </div>
    </div>
  </section>"""
