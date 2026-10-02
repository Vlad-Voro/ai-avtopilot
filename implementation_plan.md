# Implementation Plan: Safe Dead Code Pruning in ai-avtopilot

## Bottleneck & Problem
- Dead CSS bundle `assets/index-DpYQgKNk.css` (55.6 KB) unlinked in DOM, drifted from master inlined CSS.
- Duplicate mobile swipe nudge observer in inline Script #7 of `index.html` redundant with `index-Bx30wa4i.js`.

## Proposed Delta & Scope
1. **Asset Pruning**: Delete dead `assets/index-DpYQgKNk.css` (-55.6 KB repository weight).
2. **JS Deduplication**: Remove duplicate `is-nudging` block (lines 2969-2989) from inline Script #7 in `index.html`.
3. **SSG Sync**: Run `python scripts/sync_pages.py` to propagate cleaned Script #7 across 6 hub targets.

## Zero-Risk Verification Matrix
- **Lighthouse/CWV**: 0% impact. Inlined CSS untouched; zero render-blocking files added.
- **E2E Tests**: 78/78 Playwright tests verify `.is-nudging` and carousel dots via bundle listener.
- **SEO/Security**: 25/25 SEO, 14/14 Security, 11/11 ROI Unit tests must remain 100% green.

## Step-by-Step Execution Order
1. Pre-flight verification: run baseline test matrix (138 checks).
2. Remove `assets/index-DpYQgKNk.css`.
3. Edit `index.html` to prune redundant lines 2969-2989.
4. Execute `python scripts/sync_pages.py`.
5. Post-flight verification: run complete 138-check suite (`run_e2e_tests.js`, `test_seo_audit.js`, etc.).
6. Rollback plan: `git checkout -- .` restores baseline in <1s if single check fails.
