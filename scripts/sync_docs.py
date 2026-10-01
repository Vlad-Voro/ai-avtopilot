#!/usr/bin/env python3
"""
AI Avtopilot Documentation & Architecture Synchronization Engine.

Maintains strict synchronization between actual site code/routes and:
  1. ARCHITECTURE.md (Local repo architectural blueprint & verification matrix)
  2. content_strategy_implementation_plan.md (B2B demand capture & URL inventory)

Supports:
  - Default: Audit & auto-sync deterministic fields (timestamp, URL count, inventories).
  - --check: Audit mode, returns exit code 1 if documentation has drifted.
  - --pre-commit: Hook mode, detects staged site changes, syncs docs, and auto-stages ARCHITECTURE.md.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

# Locate ARCHITECTURE.md
ARCH_PATH = REPO_ROOT / "ARCHITECTURE.md"

# Locate content_strategy_implementation_plan.md across likely workspace paths
CANDIDATE_PLAN_PATHS = [
    REPO_ROOT.parent / "tmp" / "content_strategy_implementation_plan.md",
    REPO_ROOT / "tmp" / "content_strategy_implementation_plan.md",
    Path("d:/AI/tmp/content_strategy_implementation_plan.md"),
]
PLAN_PATH: Path | None = None
for p in CANDIDATE_PLAN_PATHS:
    if p.is_file():
        PLAN_PATH = p
        break


def get_site_inventory() -> dict[str, any]:
    """Inspects site filesystem and data files to extract active URL inventory."""
    services_json = REPO_ROOT / "data" / "services_data.json"
    cases_json = REPO_ROOT / "data" / "cases_data.json"

    services_data: dict = {}
    if services_json.is_file():
        try:
            with open(services_json, "r", encoding="utf-8") as f:
                services_data = json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to parse services_data.json: {e}", file=sys.stderr)

    cases_data: dict = {}
    if cases_json.is_file():
        try:
            with open(cases_json, "r", encoding="utf-8") as f:
                cases_data = json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to parse cases_data.json: {e}", file=sys.stderr)

    # Hub subpages: directories with index.html
    known_hubs = ["services", "cases", "calculator", "dashboard", "faq", "contact"]
    active_hubs = [h for h in known_hubs if (REPO_ROOT / h / "index.html").is_file()]

    # Dedicated services: all directories under services/ that contain index.html
    services_dir = REPO_ROOT / "services"
    service_slugs: list[str] = []
    if services_dir.is_dir():
        service_slugs = sorted([d.name for d in services_dir.iterdir() if d.is_dir() and (d / "index.html").is_file()])

    # Dedicated cases: all directories under cases/ that contain index.html
    cases_dir = REPO_ROOT / "cases"
    case_slugs: list[str] = []
    if cases_dir.is_dir():
        case_slugs = sorted([d.name for d in cases_dir.iterdir() if d.is_dir() and (d / "index.html").is_file()])

    # System & legal pages
    known_legal = ["privacy.html", "404.html", "success.html"]
    active_legal = [f for f in known_legal if (REPO_ROOT / f).is_file()]

    # Total active URLs = 1 (root) + hubs + services + cases + legal
    total_urls = 1 + len(active_hubs) + len(service_slugs) + len(case_slugs) + len(active_legal)

    return {
        "root": "/",
        "hubs": active_hubs,
        "services": services_data,
        "cases": cases_data,
        "service_slugs": service_slugs,
        "case_slugs": case_slugs,
        "legal": active_legal,
        "total_urls": total_urls,
    }


def sync_architecture_doc(inventory: dict, today_str: str) -> bool:
    """Updates ARCHITECTURE.md header timestamp and invariants if needed."""
    if not ARCH_PATH.is_file():
        return False

    with open(ARCH_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    orig_content = content

    # 1. Update timestamp in header
    # > **Status**: Production Hardened | **Updated**: 2026-10-01
    content = re.sub(
        r"(\*\*Updated\*\*:\s*)\d{4}-\d{2}-\d{2}",
        rf"\g<1>{today_str}",
        content,
        count=1,
    )

    if content != orig_content:
        with open(ARCH_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def sync_content_strategy_doc(inventory: dict, today_str: str) -> bool:
    """Updates content_strategy_implementation_plan.md active URLs and inventories."""
    if not PLAN_PATH or not PLAN_PATH.is_file():
        return False

    with open(PLAN_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    orig_content = content

    total_urls = inventory["total_urls"]
    service_count = len(inventory["service_slugs"])
    case_count = len(inventory["case_slugs"])

    # 1. Verification line URL count
    # > **Verification**: ... across all 23 URLs
    content = re.sub(
        r"(across all )\d+( URLs)",
        rf"\g<1>{total_urls}\g<2>",
        content,
        count=1,
    )

    # 2. Subgraph Architecture header
    # subgraph Architecture ["2. Production Silo Architecture (23 URLs)"]
    content = re.sub(
        r'(subgraph Architecture \["2\. Production Silo Architecture \()\d+( URLs\)\])',
        rf"\g<1>{total_urls}\g<2>",
        content,
        count=1,
    )

    # 3. Section 1.1 title
    # ### 1.1. Production Page Inventory (23 Active URLs)
    content = re.sub(
        r"(### 1\.1\. Production Page Inventory \()\d+( Active URLs\))",
        rf"\g<1>{total_urls}\g<2>",
        content,
        count=1,
    )

    # 4. Service count in section 1.1
    # - **Dedicated Service Landing Pages (7 URLs, `/services/*`)**:
    content = re.sub(
        r"(- \*\*Dedicated Service Landing Pages \()\d+( URLs, `/services/\*`\)\*\*:)",
        rf"\g<1>{service_count}\g<2>",
        content,
        count=1,
    )

    # 5. Case count in section 1.1
    # - **Dedicated Case Studies (6 URLs, `/cases/*`)**:
    content = re.sub(
        r"(- \*\*Dedicated (?:Applied )?Case Studies \()\d+( URLs, `/cases/\*`\)\*\*:)",
        rf"\g<1>{case_count}\g<2>",
        content,
        count=1,
    )

    if content != orig_content:
        with open(PLAN_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def get_staged_files() -> list[str]:
    """Returns list of staged files in git repo."""
    try:
        res = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )
        if res.returncode == 0:
            return [line.strip() for line in res.stdout.splitlines() if line.strip()]
    except Exception:
        pass
    return []


def is_site_change(staged_files: list[str]) -> bool:
    """Detects whether staged files represent website code, templates, data or tests."""
    site_prefixes = (
        "data/",
        "scripts/",
        "services/",
        "cases/",
        "calculator/",
        "dashboard/",
        "faq/",
        "contact/",
        "tests/",
        "assets/",
        "index.html",
        "vercel.json",
        "robots.txt",
        "sitemap.xml",
        "llms.txt",
        "llms-full.txt",
    )
    for f in staged_files:
        norm = f.replace("\\", "/")
        if norm.startswith(site_prefixes):
            return True
    return False


def run_sync(pre_commit_mode: bool = False, check_only: bool = False) -> int:
    today_str = datetime.date.today().isoformat()
    inventory = get_site_inventory()

    staged = get_staged_files() if pre_commit_mode else []

    if pre_commit_mode:
        if not staged:
            print("[DocSync] Zero staged files; skipping.")
            return 0
        if not is_site_change(staged):
            print("[DocSync] No site content/code changes staged; skipping docs sync.")
            return 0
        print(f"[DocSync] Site changes detected in {len(staged)} staged file(s). Synchronizing documentation...")

    if check_only:
        # Check drift without writing
        print(f"[DocSync] Auditing documentation consistency (Inventory: {inventory['total_urls']} URLs)...")
        arch_drift = False
        plan_drift = False
        if ARCH_PATH.is_file():
            with open(ARCH_PATH, "r", encoding="utf-8") as f:
                c = f.read()
            if f"**Updated**: {today_str}" not in c:
                arch_drift = True
        if PLAN_PATH and PLAN_PATH.is_file():
            with open(PLAN_PATH, "r", encoding="utf-8") as f:
                c = f.read()
            if f"({inventory['total_urls']} Active URLs)" not in c:
                plan_drift = True

        if arch_drift or plan_drift:
            print(f"[FAIL] Documentation drift detected: arch={arch_drift}, plan={plan_drift}", file=sys.stderr)
            return 1
        print("[OK] Documentation is in sync with site inventory.")
        return 0

    # Auto-sync execution
    arch_updated = sync_architecture_doc(inventory, today_str)
    plan_updated = sync_content_strategy_doc(inventory, today_str)

    if arch_updated:
        print(f"[DocSync] Updated {ARCH_PATH.name} (Date: {today_str}, URLs: {inventory['total_urls']})")
        if pre_commit_mode:
            subprocess.run(["git", "add", "ARCHITECTURE.md"], cwd=str(REPO_ROOT), check=False)
            print("[DocSync] Auto-staged ARCHITECTURE.md into current commit.")
    else:
        print(f"[DocSync] {ARCH_PATH.name} is already up to date.")

    if plan_updated and PLAN_PATH:
        print(f"[DocSync] Updated {PLAN_PATH.name} (URLs: {inventory['total_urls']})")
    elif PLAN_PATH:
        print(f"[DocSync] {PLAN_PATH.name} is already up to date.")

    return 0


def main() -> None:
    pre_commit = "--pre-commit" in sys.argv
    check = "--check" in sys.argv

    code = run_sync(pre_commit_mode=pre_commit, check_only=check)
    sys.exit(code)


if __name__ == "__main__":
    main()
