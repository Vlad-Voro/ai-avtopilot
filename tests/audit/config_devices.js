/**
 * Device Matrix Configuration for AI Avtopilot Layout & Typography Audit.
 * 18 Canonical Profiles covering 99%+ real-world incident surface.
 */

const DEVICES = [
  {
    id: 'D01-fold-cover',
    name: 'Galaxy Z Fold (Cover)',
    width: 280,
    height: 653,
    dpr: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile-extreme',
    tag: '280px Fold Cover (P0 boundary)'
  },
  {
    id: 'D02-mobile-320',
    name: 'iPhone SE (1st gen)',
    width: 320,
    height: 568,
    dpr: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile-compact',
    tag: '320px Web Standard Baseline'
  },
  {
    id: 'D03-mobile-360',
    name: 'Samsung Galaxy A-series',
    width: 360,
    height: 800,
    dpr: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile-standard',
    tag: '360px Top-1 Android RU (~22%)'
  },
  {
    id: 'D04-mobile-390',
    name: 'iPhone 13 / 14 / 15',
    width: 390,
    height: 844,
    dpr: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile-standard',
    tag: '390px Top-1 iOS RU (~25%)'
  },
  {
    id: 'D05-mobile-412',
    name: 'Android Flagship Plus (S24+ / Pixel)',
    width: 412,
    height: 915,
    dpr: 2.625,
    isMobile: true,
    hasTouch: true,
    category: 'mobile-large',
    tag: '412px Android Plus'
  },
  {
    id: 'D06-bp-480',
    name: 'CSS Breakpoint 480px',
    width: 480,
    height: 854,
    dpr: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'breakpoint',
    tag: '480px Media Query Max-Width'
  },
  {
    id: 'D07-land-375',
    name: 'Mobile Landscape (Short Viewport)',
    width: 667,
    height: 375,
    dpr: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'landscape',
    tag: '375px Height Stress Test'
  },
  {
    id: 'D08-bp-768',
    name: 'Tablet Portrait / Burger Activation',
    width: 768,
    height: 1024,
    dpr: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'breakpoint',
    tag: '768px Burger Menu Breakpoint'
  },
  {
    id: 'D09-bp-769',
    name: 'Desktop Nav Activation (+1px)',
    width: 769,
    height: 1024,
    dpr: 2.0,
    isMobile: false,
    hasTouch: false,
    category: 'breakpoint',
    tag: '769px Desktop Nav Boundary'
  },
  {
    id: 'D10-bp-900',
    name: 'Tablet Intermediate Max',
    width: 900,
    height: 1200,
    dpr: 1.5,
    isMobile: false,
    hasTouch: true,
    category: 'breakpoint',
    tag: '900px Tablet Intermediate Boundary'
  },
  {
    id: 'D11-bp-901',
    name: 'Desktop Intermediate (+1px)',
    width: 901,
    height: 1200,
    dpr: 1.5,
    isMobile: false,
    hasTouch: false,
    category: 'breakpoint',
    tag: '901px Desktop Intermediate Boundary'
  },
  {
    id: 'D12-bp-1024',
    name: 'Tablet Landscape / Small Laptop',
    width: 1024,
    height: 768,
    dpr: 2.0,
    isMobile: false,
    hasTouch: false,
    category: 'breakpoint',
    tag: '1024px Laptop/Tablet Boundary'
  },
  {
    id: 'D13-bp-1025',
    name: 'Desktop Standard Bento (+1px)',
    width: 1025,
    height: 768,
    dpr: 2.0,
    isMobile: false,
    hasTouch: false,
    category: 'breakpoint',
    tag: '1025px Desktop Bento Grid Boundary'
  },
  {
    id: 'D14-desk-1280',
    name: 'Desktop Standard (1280px)',
    width: 1280,
    height: 800,
    dpr: 1.0,
    isMobile: false,
    hasTouch: false,
    category: 'desktop',
    tag: '1280px Container Max-Width'
  },
  {
    id: 'D15-win-1366',
    name: 'Budget Windows Laptop',
    width: 1366,
    height: 768,
    dpr: 1.0,
    isMobile: false,
    hasTouch: false,
    category: 'desktop',
    tag: '1366x768 Top-1 Corporate Laptop RU (~18%)'
  },
  {
    id: 'D16-dpi-125',
    name: 'Windows Full HD @ 125% DPI',
    width: 1536,
    height: 864,
    dpr: 1.25,
    isMobile: false,
    hasTouch: false,
    category: 'subpixel',
    tag: '1536px (DPR 1.25 Subpixel Stress)'
  },
  {
    id: 'D17-dpi-150',
    name: 'Windows Full HD @ 150% DPI',
    width: 1280,
    height: 720,
    dpr: 1.5,
    isMobile: false,
    hasTouch: false,
    category: 'subpixel',
    tag: '1280x720 (DPR 1.5 Subpixel Stress)'
  },
  {
    id: 'D18-desk-1920',
    name: 'Corporate Full HD Monitor',
    width: 1920,
    height: 1080,
    dpr: 1.0,
    isMobile: false,
    hasTouch: false,
    category: 'desktop',
    tag: '1920x1080 Standard Desktop'
  }
];

const ALL_PAGES = [
  // Homepage
  { path: '/', name: 'Главная (Homepage)', category: 'home' },

  // Hubs
  { path: '/services/', name: 'Хаб: Услуги', category: 'hub' },
  { path: '/cases/', name: 'Хаб: Кейсы', category: 'hub' },
  { path: '/calculator/', name: 'Хаб: Калькулятор ROI', category: 'hub' },
  { path: '/dashboard/', name: 'Хаб: Дашборд', category: 'hub' },
  { path: '/faq/', name: 'Хаб: FAQ', category: 'hub' },
  { path: '/contact/', name: 'Хаб: Контакты', category: 'hub' },

  // Service Scenarios
  { path: '/services/automated-reporting/', name: 'Услуга: Автоотчетность', category: 'service' },
  { path: '/services/ai-analytics/', name: 'Услуга: ИИ-аналитика', category: 'service' },
  { path: '/services/system-integration/', name: 'Услуга: Интеграция 1C/SAP', category: 'service' },
  { path: '/services/retail-inventory/', name: 'Услуга: Товарные остатки', category: 'service' },
  { path: '/services/document-automation/', name: 'Услуга: Документооборот ЭДО', category: 'service' },
  { path: '/services/customer-support/', name: 'Услуга: Поддержка клиентов', category: 'service' },
  { path: '/services/speech-analytics/', name: 'Услуга: Речевая аналитика', category: 'service' },
  { path: '/services/rapid-pilot/', name: 'Услуга: Быстрый пилот 14 дней', category: 'service' },
  { path: '/services/specifications-kp/', name: 'Услуга: Спецификации и КП', category: 'service' },
  { path: '/services/price-monitoring/', name: 'Услуга: Мониторинг цен', category: 'service' },
  { path: '/services/debt-control/', name: 'Услуга: Контроль дебиторки', category: 'service' },
  { path: '/services/reviews-reputation/', name: 'Услуга: Управление отзывами', category: 'service' },
  { path: '/services/construction-estimate-audit/', name: 'Услуга: Аудит смет и КС-2', category: 'service' },
  { path: '/services/fleet-logistics/', name: 'Услуга: Логистика и 1С:УАТ', category: 'service' },
  { path: '/services/ai-agents/', name: 'Услуга: ИИ-агенты для бизнеса', category: 'service' },
  { path: '/services/manufacturing-automation/', name: 'Услуга: 1С:ERP Производство', category: 'service' },

  // Deep Case Studies
  { path: '/cases/retail-inventory-automation/', name: 'Кейс: Ритейл и остатки', category: 'case' },
  { path: '/cases/manufacturing-edi-automation/', name: 'Кейс: Производство и ЭДО', category: 'case' },
  { path: '/cases/service-center-ai-operator/', name: 'Кейс: Сервисный центр', category: 'case' },
  { path: '/cases/hr-recruitment-automation/', name: 'Кейс: HR-найм', category: 'case' },
  { path: '/cases/supply-chain-logistics/', name: 'Кейс: Логистика и цепи', category: 'case' },
  { path: '/cases/fintech-transaction-reconciliation/', name: 'Кейс: Финтех сверка', category: 'case' },
  { path: '/cases/sales-speech-analytics/', name: 'Кейс: Продажи и аудио', category: 'case' },
  { path: '/cases/auto-dealer-parts-automation/', name: 'Кейс: СТО и подбор по VIN', category: 'case' },

  // Utility
  { path: '/privacy.html', name: 'Политика конфиденциальности', category: 'utility' },
  { path: '/404.html', name: 'Страница 404', category: 'utility' },
  { path: '/success.html', name: 'Успешная отправка заявки', category: 'utility' }
];

module.exports = {
  DEVICES,
  ALL_PAGES
};
