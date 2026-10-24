#!/usr/bin/env python3
"""
Git-Backed Deterministic Sitemap Generator for ai-avtopilot.ru
Extracts real git commit timestamps or file modification times for each canonical page,
ensuring W3C ISO 8601 compliance without spoofed/stale dates.
"""

import datetime
import os
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
        "url": "https://ai-avtopilot.ru/calculator/",
        "file": "calculator/index.html",
        "changefreq": "weekly",
        "priority": "0.8",
    },
    {
        "url": "https://ai-avtopilot.ru/dashboard/",
        "file": "dashboard/index.html",
        "changefreq": "weekly",
        "priority": "0.8",
    },
    {"url": "https://ai-avtopilot.ru/faq/", "file": "faq/index.html", "changefreq": "weekly", "priority": "0.8"},
    {
        "url": "https://ai-avtopilot.ru/contact/",
        "file": "contact/index.html",
        "changefreq": "weekly",
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


if __name__ == "__main__":
    generate_sitemap()
