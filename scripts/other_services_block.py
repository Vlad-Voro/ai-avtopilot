#!/usr/bin/env python3
"""
Reusable component for rendering the "Другие сценарии" (Other Services) internal linking block.
Strictly conforms to SOTA SEO invariants:
- 8-node complete mesh without circular self-links (7 links per page)
- Valid trailing slash URLs
- Heading hierarchy: <h2> with <p class="section-tag">
- Bento design system styling (.services, .services__bento, .scard, .scard--wide, .scard--link)
- Mobile touch carousel with dedicated dots (#other-services-dots) and zero aria-hidden
"""

import json
import os

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(PROJECT_DIR, "data", "services_catalog.json")


def load_services_catalog() -> list:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def render_other_services_cards(current_slug: str, catalog: list = None) -> str:
    if catalog is None:
        catalog = load_services_catalog()

    siblings = [s for s in catalog if s["slug"] != current_slug]
    expected_siblings = len(catalog) - 1
    if len(siblings) != expected_siblings:
        raise ValueError(
            f"Expected {expected_siblings} sibling services for slug '{current_slug}', got {len(siblings)}"
        )

    cards_html = []
    for i, s in enumerate(siblings):
        classes = ["scard", "scard--link"]
        if s.get("class_extra"):
            for extra in s["class_extra"].split():
                if extra not in classes:
                    classes.append(extra)

        tags_html = ""
        if s.get("tags"):
            tags_spans = "".join([f"<span>{t}</span>" for t in s["tags"]])
            tags_html = f'\n          <div class="scard__tags">\n            {tags_spans}\n          </div>'

        btn_html = ""
        if s.get("cta_btn"):
            btn_html = f'\n          <span class="btn btn--primary">{s["cta_btn"]}</span>'

        card_str = f'''        <a href="{s["url"]}" class="{" ".join(classes)}" aria-label="{s["aria_label"]}">
          <div class="scard__icon">{s["icon"]}</div>
          <h3 class="scard__title">{s["title"]} <span class="scard__arrow" aria-hidden="true">→</span></h3>
          <p class="scard__desc">{s["desc"]}</p>{tags_html}{btn_html}
        </a>'''
        cards_html.append(card_str)

    return "\n".join(cards_html)


def render_other_services_section(current_slug: str, catalog: list = None) -> str:
    cards_html = render_other_services_cards(current_slug, catalog)
    return f"""  <!-- ═══════════════════ OTHER SERVICES ═══════════════════ -->
  <section class="services other-services" id="other-services">
    <div class="container">
      <div class="section-header">
        <p class="section-tag" data-reveal="">Смежные решения</p>
        <h2 class="section-title" data-reveal="">Другие сценарии автоматизации</h2>
      </div>
      <div class="services__bento other-services__bento" data-reveal="" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Другие сценарии автоматизации">
{cards_html}
      </div>
      <div class="carousel-dots other-services-dots" id="other-services-dots"></div>
    </div>
  </section>"""


def get_other_services_carousel_js() -> str:
    return """
      // 4. Other Services Horizontal Carousel Dots
      var otherBento = document.querySelector('.other-services__bento');
      var oDotsWrap = document.getElementById('other-services-dots');
      if (otherBento && oDotsWrap) {
        var oCards = Array.from(otherBento.querySelectorAll('.scard'));
        if (oCards.length > 0) {
          oDotsWrap.innerHTML = '';
          oCards.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Сценарий ' + (i + 1) + ' из ' + oCards.length);
            dot.addEventListener('click', function() {
              oCards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
            oDotsWrap.appendChild(dot);
          });

          var oDots = Array.from(oDotsWrap.querySelectorAll('.carousel-dot'));
          var oTicking = false;

          function updateOtherServicesDot() {
            var gridRect = otherBento.getBoundingClientRect();
            var gridCenter = gridRect.left + gridRect.width / 2;
            var closestIdx = 0;
            var minDiff = Infinity;

            oCards.forEach(function(card, idx) {
              var r = card.getBoundingClientRect();
              var cardCenter = r.left + r.width / 2;
              var diff = Math.abs(gridCenter - cardCenter);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
              }
            });

            oDots.forEach(function(d, idx) {
              d.classList.toggle('active', idx === closestIdx);
            });
            oTicking = false;
          }

          otherBento.addEventListener('scroll', function() {
            if (!oTicking) {
              window.requestAnimationFrame(updateOtherServicesDot);
              oTicking = true;
            }
          }, { passive: true });
        }
      }
"""


if __name__ == "__main__":
    test_out = render_other_services_section("system-integration")
    assert "/services/system-integration/" not in test_out
    assert "/services/rapid-pilot/" in test_out
    assert "Другие сценарии автоматизации" in test_out
    print("[x] other_services_block self-test passed successfully.")
