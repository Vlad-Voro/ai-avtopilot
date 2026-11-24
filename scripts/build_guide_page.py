#!/usr/bin/env python3
"""Builds the /guides/ hub and individual MoFu/ToFu guide pages for ai-avtopilot.ru."""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT_DIR / "index.html"
CSS_PATH = ROOT_DIR / "assets" / "css" / "styles.min.css"
GUIDES_DATA_PATH = ROOT_DIR / "data" / "guides_data.json"
PRUNE_SECTIONS = ("calculator", "compare", "services", "cases", "pricing", "dashboard")


def get_css_hash() -> str:
    raw = CSS_PATH.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.md5(raw).hexdigest()[:8]


def _prepare_base_soup(
    master_html: str, css_hash: str, title: str, desc: str, keywords: str, canonical: str
) -> BeautifulSoup:
    soup = BeautifulSoup(master_html, "html.parser")

    app_style = soup.find("style", id="app-styles")
    if app_style:
        app_style.replace_with(soup.new_tag("link", rel="stylesheet", href=f"/assets/css/styles.min.css?v={css_hash}"))

    if soup.title:
        soup.title.string = title

    for attr_name, attr_val, content in [
        ("name", "description", desc),
        ("name", "keywords", keywords),
        ("property", "og:url", canonical),
        ("property", "og:title", title),
        ("property", "og:description", desc),
        ("name", "twitter:title", title),
        ("name", "twitter:description", desc),
    ]:
        tag = soup.find("meta", attrs={attr_name: attr_val})
        if tag:
            tag["content"] = content

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots:
        robots["content"] = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"

    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon:
        canon["href"] = canonical

    for sec_id in PRUNE_SECTIONS:
        sec = soup.find("section", id=sec_id)
        if sec:
            sec.decompose()

    return soup


def _replace_hero(
    soup: BeautifulSoup,
    crumbs: list[tuple[str, str]],
    badge: str,
    h1_text: str,
    sub: str,
    primary_href: str,
    primary_txt: str,
) -> None:
    crumbs_html = []
    for idx, (label, href) in enumerate(crumbs):
        if idx > 0:
            crumbs_html.append('<span class="breadcrumbs__sep">/</span>')
        if href:
            crumbs_html.append(f'<a href="{href}">{label}</a>')
        else:
            crumbs_html.append(f"<span>{label}</span>")

    hero_html = f"""  <section class="hero" id="home">
    <div class="hero__particles" id="particles"></div>
    <div class="container hero__inner">
      <div class="hero__content" style="max-width:860px">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          {"".join(crumbs_html)}
        </nav>
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">{badge}</span>
        </div>
        <h1 class="hero__title">{h1_text}</h1>
        <p class="hero__sub">{sub}</p>
        <div class="hero__actions">
          <a href="{primary_href}" class="btn btn--primary" id="cta-main">{primary_txt}</a>
          <a href="#contact" class="btn btn--ghost">Заказать бесплатный аудит →</a>
        </div>
      </div>
    </div>
  </section>"""
    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.replace_with(BeautifulSoup(hero_html, "html.parser"))


def _update_faqs(soup: BeautifulSoup, heading: str, faqs: list[dict]) -> None:
    faq_sec = soup.find("section", id="faq")
    if not faq_sec:
        return
    h2 = faq_sec.find("h2", class_="section-title")
    if h2:
        h2.string = heading
    grid = faq_sec.find("div", class_="faq__grid")
    if not grid:
        return
    items = []
    for f in faqs:
        items.append(
            f"""        <div class="faq-item">
          <button class="faq-item__header" aria-expanded="false" type="button">
            <span class="faq-item__question">{f["q"]}</span>
            <span class="faq-item__icon">+</span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__inner">
              <p>{f["a"]}</p>
            </div>
          </div>
        </div>"""
        )
    grid.clear()
    grid.append(BeautifulSoup("\n".join(items), "html.parser"))


def _update_schema(
    soup: BeautifulSoup, canonical: str, breadcrumb_items: list[dict], extra_node: dict, faqs: list[dict]
) -> None:
    json_ld = soup.find("script", attrs={"type": "application/ld+json"})
    if not json_ld or not json_ld.string:
        return
    data = json.loads(json_ld.string)
    graph = []
    for item in data.get("@graph", []):
        itype = item.get("@type")
        if itype in ("WebSite", "BreadcrumbList", "FAQPage"):
            continue
        if itype == "ProfessionalService":
            item.pop("hasOfferCatalog", None)
        graph.append(item)

    graph.append(
        {
            "@type": "BreadcrumbList",
            "@id": f"{canonical}#breadcrumb",
            "itemListElement": breadcrumb_items,
        }
    )
    graph.append(extra_node)
    graph.append(
        {
            "@type": "FAQPage",
            "@id": f"{canonical}#faq",
            "mainEntity": [
                {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                for f in faqs
            ],
        }
    )
    data["@graph"] = graph
    json_ld.string = "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def build_hub(master_html: str, css_hash: str, data: dict) -> Path:
    hub = data["hub"]
    guides = data["guides"]
    canonical = "https://ai-avtopilot.ru/guides/"
    soup = _prepare_base_soup(master_html, css_hash, hub["title"], hub["description"], hub["keywords"], canonical)

    _replace_hero(
        soup,
        crumbs=[("Главная", "/"), ("Гайды", "")],
        badge="База знаний АвтоПилот · 1С · 152-ФЗ · ЭДО",
        h1_text=hub["h1"],
        sub=hub["subtitle"],
        primary_href="#guide-body",
        primary_txt="Выбрать руководство",
    )

    cards = []
    for g in guides:
        cards.append(
            f"""        <article class="scard scard--link">
          <div class="scard__icon">{g["tag"]}</div>
          <h2 class="scard__title" style="font-size:1.15rem"><a href="/guides/{g["slug"]}/" class="scard__title-link">{g["breadcrumb_name"]} <span class="scard__arrow" aria-hidden="true">→</span></a></h2>
          <p class="scard__desc">{g["lead"]}</p>
          <div class="scard__tags"><span>{g["read_time"]}</span><span>АвтоПилот</span></div>
        </article>"""
        )

    hub_sec_html = f"""  <section class="services" id="guide-body" style="padding:40px 0 80px">
    <div class="container">
      <div class="section-header">
        <p class="section-tag">Экспертные разборы</p>
        <h2 class="section-title">Практические руководства</h2>
        <p class="section-desc">Материалы составлены инженерами и архитекторами 1С команды АвтоПилот (ai-avtopilot.ru) с опорой на нормативные источники РФ.</p>
      </div>
      <blockquote class="geo-quote" cite="https://ai-avtopilot.ru/guides/">
        «АвтоПилот (официальный домен ai-avtopilot.ru) внедряет автономных ИИ-агентов в контур 1С:ERP, CRM и ЭДО (Диадок, СБИС) в соответствии со ст. 18 Федерального закона № 152-ФЗ и актуальной ставкой НДС 22% (425-ФЗ) со сроком пилота 14 дней.»
        <footer>Источник: методология платформы <a href="/pricing/">АвтоПилот — форматы внедрения и SLA</a></footer>
      </blockquote>
      <div class="guides-grid">
{chr(10).join(cards)}
      </div>
    </div>
  </section>"""

    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.insert_after(BeautifulSoup(hub_sec_html, "html.parser"))

    _update_faqs(soup, "Частые вопросы о документации и базе знаний", hub["faqs"])
    _update_schema(
        soup,
        canonical,
        breadcrumb_items=[
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
            {"@type": "ListItem", "position": 2, "name": "Гайды", "item": canonical},
        ],
        extra_node={
            "@type": "CollectionPage",
            "@id": f"{canonical}#collection",
            "name": hub["h1"],
            "description": hub["description"],
            "url": canonical,
            "inLanguage": "ru-RU",
            "publisher": {"@id": "https://ai-avtopilot.ru/#organization"},
        },
        faqs=hub["faqs"],
    )

    out_dir = ROOT_DIR / "guides"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    out_file.write_text(str(soup), encoding="utf-8")
    return out_file


def build_article(master_html: str, css_hash: str, g: dict) -> Path:
    slug = g["slug"]
    canonical = f"https://ai-avtopilot.ru/guides/{slug}/"
    soup = _prepare_base_soup(master_html, css_hash, g["title"], g["description"], g["keywords"], canonical)

    _replace_hero(
        soup,
        crumbs=[("Главная", "/"), ("Гайды", "/guides/"), (g["breadcrumb_name"], "")],
        badge=f"{g['tag']} · {g['read_time']}",
        h1_text=g["h1"],
        sub=g["lead"],
        primary_href="#guide-body",
        primary_txt="Читать руководство",
    )

    sec_blocks = []
    for sec in g["sections"]:
        ps = "\n".join([f"        <p>{p}</p>" for p in sec.get("paragraphs", [])])
        bullets = ""
        if sec.get("bullets"):
            lis = "\n".join([f"          <li>{b}</li>" for b in sec["bullets"]])
            bullets = f"\n        <ul>\n{lis}\n        </ul>"
        sec_blocks.append(f"      <section>\n        <h2>{sec['h2']}</h2>\n{ps}{bullets}\n      </section>")

    q = g["quote"]
    article_html = f"""  <section id="guide-body" style="padding:36px 0 40px">
    <div class="container">
      <article class="guide-article">
        <blockquote class="geo-quote" cite="{q["source_url"]}">
          «{q["text"]}»
          <footer>Источник: <a href="{q["source_url"]}" target="_blank" rel="noopener noreferrer">{q["source_title"]}</a></footer>
        </blockquote>
{chr(10).join(sec_blocks)}
        <p style="margin-top:28px;font-size:0.9rem;color:var(--text-3);">Материал подготовлен инженерной командой платформы <strong>АвтоПилот (ai-avtopilot.ru)</strong>. Перейти в <a href="/guides/">каталог всех гайдов</a> или <a href="/services/">каталог решений 1С/CRM/ЭДО</a>.</p>
      </article>
    </div>
  </section>"""

    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.insert_after(BeautifulSoup(article_html, "html.parser"))

    _update_faqs(soup, f"Вопросы по теме «{g['breadcrumb_name']}»", g["faqs"])
    _update_schema(
        soup,
        canonical,
        breadcrumb_items=[
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
            {"@type": "ListItem", "position": 2, "name": "Гайды", "item": "https://ai-avtopilot.ru/guides/"},
            {"@type": "ListItem", "position": 3, "name": g["breadcrumb_name"], "item": canonical},
        ],
        extra_node={
            "@type": "TechArticle",
            "@id": f"{canonical}#article",
            "headline": g["h1"],
            "description": g["description"],
            "image": "https://ai-avtopilot.ru/og-image.png",
            "datePublished": g["datePublished"],
            "dateModified": g["dateModified"],
            "inLanguage": "ru-RU",
            "author": {"@type": "Organization", "name": "АвтоПилот", "url": "https://ai-avtopilot.ru/"},
            "publisher": {
                "@type": "Organization",
                "name": "АвтоПилот",
                "url": "https://ai-avtopilot.ru/",
                "logo": {"@type": "ImageObject", "url": "https://ai-avtopilot.ru/apple-touch-icon.png"},
            },
        },
        faqs=g["faqs"],
    )

    out_dir = ROOT_DIR / "guides" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    out_file.write_text(str(soup), encoding="utf-8")
    return out_file


def main() -> None:
    master_html = INDEX_PATH.read_text(encoding="utf-8")
    css_hash = get_css_hash()
    data = json.loads(GUIDES_DATA_PATH.read_text(encoding="utf-8"))

    hub_out = build_hub(master_html, css_hash, data)
    print(f"✔ Generated: {hub_out.relative_to(ROOT_DIR)} ({hub_out.stat().st_size} bytes)")
    for g in data["guides"]:
        art_out = build_article(master_html, css_hash, g)
        print(f"✔ Generated: {art_out.relative_to(ROOT_DIR)} ({art_out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
