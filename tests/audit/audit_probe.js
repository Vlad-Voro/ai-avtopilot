/**
 * In-Browser DOM Probe for Playwright Layout & Typography Audit.
 * Evaluates DOM in a single pass (< 50ms) with zero false-positive filtering.
 */

function runInBrowserAudit(device) {
  const issues = [];
  const docW = document.documentElement.clientWidth;
  const docScrollW = document.documentElement.scrollWidth;
  const bodyScrollW = document.body ? document.body.scrollWidth : docScrollW;
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  // Helper: CSS selector generator
  function getCssSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return el ? el.tagName.toLowerCase() : '';
    if (el.id) return `#${el.id}`;
    let sel = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).filter(c => c && !c.startsWith('is-') && !c.startsWith('active'));
      if (classes.length) sel += `.${classes.slice(0, 2).join('.')}`;
    }
    return sel;
  }

  // Helper: Check if element is truly visible
  function isVisible(el, style) {
    if (!style) style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  }

  // Helper: Recursive background color resolver for contrast
  function getEffectiveBgColor(el) {
    let curr = el;
    while (curr && curr !== document) {
      const style = window.getComputedStyle(curr);
      const bg = style.backgroundColor;
      if (bg && bg !== 'transparent' && !bg.includes('rgba(0, 0, 0, 0)')) {
        return bg;
      }
      curr = curr.parentElement;
    }
    return 'rgb(8, 8, 12)'; // default dark background of ai-avtopilot.ru
  }

  // Helper: Luminance & Contrast
  function parseRgb(colorStr) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return [8, 8, 12];
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrastRatio(fgRgb, bgRgb) {
    const lum1 = getLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
    const lum2 = getLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // ==========================================
  // CHECK 1: Horizontal Page Overflow (P0)
  // ==========================================
  const hasPageOverflow = docScrollW > docW + 1 || bodyScrollW > docW + 1;
  if (hasPageOverflow) {
    const offendingElements = [];
    const allEls = document.querySelectorAll('header, section, div, main, footer, table, form, nav, article, p, h1, h2, h3, h4');

    for (const el of allEls) {
      const style = window.getComputedStyle(el);
      if (!isVisible(el, style)) continue;

      // Ignore decorative background elements with pointer-events: none
      if (style.pointerEvents === 'none' || el.classList.contains('glow') || el.classList.contains('hero__decor')) {
        continue;
      }

      // Ignore elements inside legitimate horizontal swipe containers (carousels)
      let insideScroll = false;
      let p = el.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        const ps = window.getComputedStyle(p);
        if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') {
          insideScroll = true;
          break;
        }
        p = p.parentElement;
      }
      if (insideScroll) continue;

      const rect = el.getBoundingClientRect();
      if (rect.right > docW + 1.5) {
        offendingElements.push({
          selector: getCssSelector(el),
          right: Math.round(rect.right),
          overflow: Math.round(rect.right - docW),
          textPreview: (el.textContent || '').trim().substring(0, 30)
        });
        if (offendingElements.length >= 3) break;
      }
    }

    issues.push({
      type: 'horizontal-overflow',
      severity: 'P0',
      category: 'layout',
      message: `Горизонтальный скролл страницы: scrollWidth (${Math.max(docScrollW, bodyScrollW)}px) > clientWidth (${docW}px)`,
      details: offendingElements,
      recommendation: 'Добавьте max-width: 100% или overflow-x: clip/hidden на родительский контейнер'
    });
  }

  // ==========================================
  // CHECK 2: Text & Content Clipping (P1/P2)
  // ==========================================
  const accentBox = document.querySelector('.hero__title-accent-box');
  if (accentBox) {
    const boxStyle = window.getComputedStyle(accentBox);
    const isClipped = accentBox.scrollHeight > accentBox.clientHeight + 2 && boxStyle.overflow === 'hidden';
    if (isClipped) {
      issues.push({
        type: 'text-clipping',
        severity: 'P0',
        category: 'layout',
        selector: '.hero__title-accent-box',
        message: `Заголовок Hero обрезан: scrollHeight (${accentBox.scrollHeight}px) > clientHeight (${accentBox.clientHeight}px)`,
        recommendation: 'Установите height: auto и min-height вместо фиксированной высоты с overflow: hidden'
      });
    }
  }

  // ==========================================
  // CHECK 3: Form Input Font Size on Mobile (P1)
  // Prevents iOS Safari Automatic Zoom
  // ==========================================
  if (device.isMobile) {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
    for (const input of inputs) {
      const style = window.getComputedStyle(input);
      if (!isVisible(input, style)) continue;
      const fs = parseFloat(style.fontSize);
      if (fs < 16) {
        issues.push({
          type: 'input-font-size-zoom-risk',
          severity: 'P1',
          category: 'typography',
          selector: getCssSelector(input),
          fontSize: `${fs}px`,
          message: `Размер шрифта в поле ввода (${fs}px < 16px) вызовет автозум экрана в iOS Safari`,
          recommendation: 'Задайте font-size: 16px на мобильных экранах (<= 768px)'
        });
        break; // Report once per form
      }
    }
  }

  // ==========================================
  // CHECK 4: Touch Target Dimensions (WCAG 2.5.5 / 2.5.8)
  // ==========================================
  if (device.hasTouch) {
    // Only target primary interactive controls, exclude inline links inside paragraphs
    const interactiveTargets = document.querySelectorAll(
      'button, .btn, .nav__burger, a.nav__link, a.footer__link, .services__tab, .cases__filter-btn, .faq__question, input[type="submit"], input[type="button"]'
    );

    let smallTargetCount = 0;
    for (const target of interactiveTargets) {
      const style = window.getComputedStyle(target);
      if (!isVisible(target, style)) continue;

      const rect = target.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w < 32 || h < 32) {
        issues.push({
          type: 'touch-target-too-small',
          severity: 'P1',
          category: 'ergonomics',
          selector: getCssSelector(target),
          size: `${w}x${h}px`,
          message: `Критически малая зона нажатия: ${w}x${h}px (минимум WCAG: 44x44px)`,
          recommendation: 'Увеличьте padding или min-height/min-width до 44px'
        });
        smallTargetCount++;
        if (smallTargetCount >= 3) break;
      } else if ((w < 42 || h < 42) && smallTargetCount === 0) {
        issues.push({
          type: 'touch-target-suboptimal',
          severity: 'P2',
          category: 'ergonomics',
          selector: getCssSelector(target),
          size: `${w}x${h}px`,
          message: `Зона нажатия меньше рекомендуемой Apple HIG: ${w}x${h}px (< 44x44px)`,
          recommendation: 'Добавьте min-height: 44px или компенсационный padding'
        });
        smallTargetCount++;
      }
    }
  }

  // ==========================================
  // CHECK 5: Typography Line-Height & Readability
  // ==========================================
  const headings = document.querySelectorAll('h1, h2, h3');
  for (const h of headings) {
    const style = window.getComputedStyle(h);
    if (!isVisible(h, style)) continue;
    const fs = parseFloat(style.fontSize);
    let lh = parseFloat(style.lineHeight);
    if (isNaN(lh)) lh = fs * 1.2;

    const ratio = lh / fs;
    if (ratio < 1.05 && fs > 20) {
      issues.push({
        type: 'heading-line-height-cramped',
        severity: 'P2',
        category: 'typography',
        selector: getCssSelector(h),
        ratio: ratio.toFixed(2),
        message: `Интерлиньяж заголовка слишком мал (${ratio.toFixed(2)}): риск наложения выносных элементов букв`,
        recommendation: 'Установите line-height не менее 1.15-1.25'
      });
      break;
    }
  }

  // ==========================================
  // CHECK 6: Mobile Gutter Safety (Edge Touch)
  // ==========================================
  if (device.width <= 480) {
    const mainHeadings = document.querySelectorAll('main h1, main h2, .section__title');
    for (const el of mainHeadings) {
      const style = window.getComputedStyle(el);
      if (!isVisible(el, style)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.left < 8 && rect.left >= 0 && rect.width > 100) {
        issues.push({
          type: 'insufficient-gutter',
          severity: 'P2',
          category: 'spacing',
          selector: getCssSelector(el),
          distanceToEdge: `${Math.round(rect.left)}px`,
          message: `Заголовок прилипает к краю экрана (${Math.round(rect.left)}px < 16px safe margin)`,
          recommendation: 'Добавьте безопасный боковой отступ padding-left/right: 16px в контейнер'
        });
        break;
      }
    }
  }

  // ==========================================
  // CHECK 7: Contrast Ratios on Core Headings
  // ==========================================
  const textSample = document.querySelectorAll('h1, .hero__sub, .btn--primary');
  for (const el of textSample) {
    const style = window.getComputedStyle(el);
    if (!isVisible(el, style)) continue;
    const fgRgb = parseRgb(style.color);
    const bgRgb = parseRgb(getEffectiveBgColor(el));
    const contrast = getContrastRatio(fgRgb, bgRgb);

    if (contrast < 3.0) {
      issues.push({
        type: 'low-contrast',
        severity: 'P1',
        category: 'typography',
        selector: getCssSelector(el),
        contrast: `${contrast.toFixed(1)}:1`,
        message: `Низкий контраст текста (${contrast.toFixed(1)}:1 < 3.0:1 WCAG AA)`,
        recommendation: 'Сделайте цвет текста светлее для темного фона'
      });
      break;
    }
  }

  return {
    deviceId: device.id,
    viewport: `${device.width}x${device.height}`,
    dpr: device.dpr,
    docWidth: docW,
    scrollWidth: Math.max(docScrollW, bodyScrollW),
    issuesCount: issues.length,
    issues
  };
}

module.exports = {
  runInBrowserAudit
};
