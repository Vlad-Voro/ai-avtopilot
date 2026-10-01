#!/usr/bin/env python3
"""
IndexNow Automated Push Dispatcher for ai-avtopilot.ru
Directly pings Yandex and Bing with updated canonical URLs from sitemap.xml.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITEMAP_PATH = os.path.join(ROOT_DIR, "sitemap.xml")
HOST = "ai-avtopilot.ru"
KEY = "d8a24f0c9b7e416a9e3d81b7e651c4a0"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"

ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"]


def extract_sitemap_urls(sitemap_path: str) -> list[str]:
    if not os.path.exists(sitemap_path):
        raise FileNotFoundError(f"sitemap.xml not found at {sitemap_path}")
    with open(sitemap_path, "r", encoding="utf-8") as f:
        content = f.read()
    urls = re.findall(r"<loc>(https://ai-avtopilot\.ru/[^<]*)</loc>", content)
    return sorted(list(set(urls)))


def push_indexnow(urls: list[str], dry_run: bool = False) -> dict:
    payload = {"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": urls}
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    results = {}

    print(f"[IndexNow] Prepared {len(urls)} URLs for push to search engines.")
    if dry_run:
        print("[IndexNow] DRY-RUN: Payload validated successfully. Zero requests sent.")
        return {"dry_run": True, "count": len(urls)}

    for endpoint in ENDPOINTS:
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "Antigravity-IndexNow/1.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[IndexNow] {endpoint} -> HTTP {resp.status} (Success)")
                results[endpoint] = resp.status
        except urllib.error.HTTPError as e:
            # 200/202 are success in IndexNow, 400/403/422 are errors
            print(f"[IndexNow] {endpoint} -> HTTP {e.code}: {e.reason}")
            results[endpoint] = e.code
        except Exception as e:
            print(f"[IndexNow] {endpoint} -> Network Error: {e}")
            results[endpoint] = str(e)

    return results


def main():
    parser = argparse.ArgumentParser(description="IndexNow Push Dispatcher")
    parser.add_argument("--dry-run", action="store_true", help="Validate payload without sending")
    parser.add_argument("--urls", nargs="+", help="Specific URLs to push")
    args = parser.parse_args()

    urls = args.urls if args.urls else extract_sitemap_urls(SITEMAP_PATH)
    res = push_indexnow(urls, dry_run=args.dry_run)
    sys.exit(0)


if __name__ == "__main__":
    main()
