#!/usr/bin/env python3
"""
Git-Backed Deterministic Sitemap Generator for ai-avtopilot.ru
Extracts real git commit timestamps or file modification times for each canonical page,
ensuring W3C ISO 8601 compliance without spoofed/stale dates.
"""

import argparse
import datetime
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITEMAP_PATH = os.path.join(ROOT_DIR, "sitemap.xml")

URL_SPEC = [
    {"url": "https://ai-avtopilot.ru/", "file": "index.html", "changefreq": "daily", "priority": "1.0"},
    {
        "url": "https://ai-avtopilot.ru/services/",
        "file": "services/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/automated-reporting/",
        "file": "services/automated-reporting/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/ai-analytics/",
        "file": "services/ai-analytics/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/system-integration/",
        "file": "services/system-integration/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/retail-inventory/",
        "file": "services/retail-inventory/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/document-automation/",
        "file": "services/document-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/customer-support/",
        "file": "services/customer-support/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/speech-analytics/",
        "file": "services/speech-analytics/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/rapid-pilot/",
        "file": "services/rapid-pilot/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/specifications-kp/",
        "file": "services/specifications-kp/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/price-monitoring/",
        "file": "services/price-monitoring/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/debt-control/",
        "file": "services/debt-control/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/reviews-reputation/",
        "file": "services/reviews-reputation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/marketing-automation/",
        "file": "services/marketing-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/hr-recruitment/",
        "file": "services/hr-recruitment/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/tender-automation/",
        "file": "services/tender-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/marketplace-automation/",
        "file": "services/marketplace-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/knowledge-base-rag/",
        "file": "services/knowledge-base-rag/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/b2b-outbound/",
        "file": "services/b2b-outbound/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/customer-retention/",
        "file": "services/customer-retention/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/construction-estimate-audit/",
        "file": "services/construction-estimate-audit/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/fleet-logistics/",
        "file": "services/fleet-logistics/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/ai-agents/",
        "file": "services/ai-agents/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/manufacturing-automation/",
        "file": "services/manufacturing-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {"url": "https://ai-avtopilot.ru/cases/", "file": "cases/index.html", "changefreq": "weekly", "priority": "0.8"},
    {
        "url": "https://ai-avtopilot.ru/cases/retail-inventory-automation/",
        "file": "cases/retail-inventory-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/manufacturing-edi-automation/",
        "file": "cases/manufacturing-edi-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/service-center-ai-operator/",
        "file": "cases/service-center-ai-operator/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/hr-recruitment-automation/",
        "file": "cases/hr-recruitment-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/supply-chain-logistics/",
        "file": "cases/supply-chain-logistics/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/fintech-transaction-reconciliation/",
        "file": "cases/fintech-transaction-reconciliation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/sales-speech-analytics/",
        "file": "cases/sales-speech-analytics/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/tender-procurement-automation/",
        "file": "cases/tender-procurement-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/claims-dispute-automation/",
        "file": "cases/claims-dispute-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/reviews-reputation-automation/",
        "file": "cases/reviews-reputation-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/cases/auto-dealer-parts-automation/",
        "file": "cases/auto-dealer-parts-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/services/avito-automation/",
        "file": "services/avito-automation/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/pricing/",
        "file": "pricing/index.html",
        "changefreq": "weekly",
        "priority": "0.9",
    },
    {
        "url": "https://ai-avtopilot.ru/calculator/",
        "file": "calculator/index.html",
        "changefreq": "weekly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/calculator/self-employed/",
        "file": "calculator/self-employed/index.html",
        "changefreq": "weekly",
        "priority": "0.8",
    },
    {"url": "https://ai-avtopilot.ru/faq/", "file": "faq/index.html", "changefreq": "weekly", "priority": "0.8"},
    {"url": "https://ai-avtopilot.ru/guides/", "file": "guides/index.html", "changefreq": "weekly", "priority": "0.85"},
    {
        "url": "https://ai-avtopilot.ru/guides/1c-odata-integration/",
        "file": "guides/1c-odata-integration/index.html",
        "changefreq": "monthly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/guides/152-fz-on-premise-llm/",
        "file": "guides/152-fz-on-premise-llm/index.html",
        "changefreq": "monthly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/guides/diadoc-sbis-ai-ocr/",
        "file": "guides/diadoc-sbis-ai-ocr/index.html",
        "changefreq": "monthly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/guides/roi-ai-automation-formula/",
        "file": "guides/roi-ai-automation-formula/index.html",
        "changefreq": "monthly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/guides/ai-agents-wb-ozon-vs-retail/",
        "file": "guides/ai-agents-wb-ozon-vs-retail/index.html",
        "changefreq": "monthly",
        "priority": "0.8",
    },
    {"url": "https://ai-avtopilot.ru/privacy.html", "file": "privacy.html", "changefreq": "monthly", "priority": "0.5"},
]


def get_file_lastmod(file_rel: str) -> str:
    full_path = os.path.join(ROOT_DIR, file_rel)
    if not os.path.exists(full_path):
        return datetime.date.today().isoformat()

    try:
        cmd = ["git", "log", "-1", "--format=%cI", "--", file_rel]
        out = subprocess.check_output(cmd, cwd=ROOT_DIR, stderr=subprocess.DEVNULL).decode().strip()
        if out:
            # W3C ISO 8601 date: YYYY-MM-DD
            return out.split("T")[0]
    except Exception:
        pass

    mtime = os.path.getmtime(full_path)
    return datetime.date.fromtimestamp(mtime).isoformat()


def generate_sitemap():
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
        '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
        '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ]

    for item in URL_SPEC:
        lastmod = get_file_lastmod(item["file"])
        lines.append("  <url>")
        lines.append(f"    <loc>{item['url']}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <changefreq>{item['changefreq']}</changefreq>")
        lines.append(f"    <priority>{item['priority']}</priority>")
        lines.append("  </url>")

    lines.append("</urlset>\n")
    xml_content = "\n".join(lines)

    # Validate XML parsing
    ET.fromstring(xml_content)

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write(xml_content)

    print(f"[Sitemap] Successfully generated {len(URL_SPEC)} entries in {SITEMAP_PATH}")


def check_sitemap() -> int:
    if not os.path.exists(SITEMAP_PATH):
        print(f"[Sitemap:CHECK] Missing {SITEMAP_PATH}", file=sys.stderr)
        return 1

    try:
        tree = ET.parse(SITEMAP_PATH)
    except ET.ParseError as exc:
        print(f"[Sitemap:CHECK] Invalid XML: {exc}", file=sys.stderr)
        return 1

    root = tree.getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = root.findall("sm:url", ns)
    expected_urls = [item["url"] for item in URL_SPEC]
    found_urls = []

    for node in urls:
        loc_el = node.find("sm:loc", ns)
        lm_el = node.find("sm:lastmod", ns)
        if loc_el is None or not (loc_el.text or "").strip():
            print("[Sitemap:CHECK] Empty <loc> element", file=sys.stderr)
            return 1
        if lm_el is None or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", (lm_el.text or "").strip()):
            print(f"[Sitemap:CHECK] Invalid <lastmod> for {loc_el.text}", file=sys.stderr)
            return 1
        found_urls.append(loc_el.text.strip())

    if found_urls != expected_urls:
        missing = sorted(set(expected_urls) - set(found_urls))
        extra = sorted(set(found_urls) - set(expected_urls))
        print(f"[Sitemap:CHECK] URL mismatch. missing={missing}, extra={extra}", file=sys.stderr)
        return 1

    for item in URL_SPEC:
        full_path = os.path.join(ROOT_DIR, item["file"])
        if not os.path.exists(full_path):
            print(f"[Sitemap:CHECK] Referenced file missing: {item['file']}", file=sys.stderr)
            return 1

    print(f"[Sitemap:CHECK] OK: {len(found_urls)} URLs match URL_SPEC with valid W3C dates.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or validate sitemap.xml")
    parser.add_argument("--check", action="store_true", help="Validate sitemap.xml structure and URL_SPEC parity")
    args = parser.parse_args()

    if args.check:
        return check_sitemap()
    generate_sitemap()
    return 0


if __name__ == "__main__":
    sys.exit(main())
