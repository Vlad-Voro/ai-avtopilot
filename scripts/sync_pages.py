#!/usr/bin/env python3
"""
Sync and Generate Standalone Hub Pages for ai-avtopilot.ru.
Replaces 202 KB monolithic index.html clones with focused, lightweight hubs
(< 45 KB HTML) linked to external versioned styles.min.css, DOM breadcrumbs,
proper robots directives, and strictly scoped Schema.org @graph entities.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from bs4 import BeautifulSoup

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(ROOT_DIR, "index.html")
CSS_PATH = os.path.join(ROOT_DIR, "assets", "css", "styles.min.css")

HUB_ALL_SECTIONS = ("calculator", "compare", "services", "cases", "pricing", "faq", "dashboard")

SUBPAGES_SPEC = {
    "services": {
        "dir": os.path.join(ROOT_DIR, "services"),
        "title": "Услуги внедрения ИИ-агентов в 1С и CRM | АвтоПилот",
        "description": "Выберите готовый сценарий автоматизации: 24 решения для 1С, CRM, склада и клиентского сервиса. Запустите пилотного ИИ-агента за 14 дней с гарантией ROI.",
        "keywords": "услуги ии автоматизации, внедрение ии агентов в 1с, автоматизация crm и эдо, rpa для бизнеса, автопилот услуги",
        "h1": "Услуги внедрения ИИ-агентов и роботизации процессов",
        "badge": "24 отраслевых решения · Запуск пилота за 14 дней",
        "subtitle": "Готовые ИИ-агенты для 1С:ERP, Битрикс24, amoCRM, Диадок и склада. Выберите сценарий с расчетом окупаемости и кейсами внедрения.",
        "primary_cta": ("Смотреть каталог услуг", "#services"),
        "secondary_cta": ("Рассчитать ROI →", "/calculator/"),
        "breadcrumb_name": "Услуги",
        "keep_sections": ("services", "contact"),
        "has_faq": False,
        "noindex": False,
        "terminal": {
            "title": "autopilot — services_catalog v2.6",
            "lines": [
                ("prompt", "$ autopilot-catalog --list --clusters 3"),
                ("ok", "  ✔ Финансы и 1С: 8 готовых сценариев"),
                ("ok", "  ✔ Маркетинг и CRM: 8 готовых сценариев"),
                ("ok", "  ✔ Склад и логистика: 8 готовых сценариев"),
                ("dim", "  Пилот за 14 дней · Гарантия ROI в договоре"),
            ],
            "agents": [
                {
                    "icon": "📊",
                    "name": "Финансы и 1С",
                    "status": "8 модулей",
                    "width": "86%",
                    "logs": [
                        {"type": "prompt", "text": "$ catalog --cluster finance-erp"},
                        {"type": "ok", "text": "  ✔ P&L, ЭДО, тендеры, дебиторка и сметы КС-2"},
                    ],
                },
                {
                    "icon": "💬",
                    "name": "CRM и продажи",
                    "status": "8 модулей",
                    "width": "82%",
                    "logs": [
                        {"type": "prompt", "text": "$ catalog --cluster marketing-crm"},
                        {"type": "ok", "text": "  ✔ ИИ-агенты, речевая аналитика, Авито и отзывы"},
                    ],
                },
                {
                    "icon": "📦",
                    "name": "Склад и цепи",
                    "status": "8 модулей",
                    "width": "78%",
                    "logs": [
                        {"type": "prompt", "text": "$ catalog --cluster ops-logistics"},
                        {"type": "ok", "text": "  ✔ Запасы 1С, маркетплейсы, RAG 152-ФЗ, 1С:УАТ"},
                    ],
                },
            ],
        },
    },
    "cases": {
        "dir": os.path.join(ROOT_DIR, "cases"),
        "title": "Кейсы внедрения ИИ-агентов и ROI | АвтоПилот",
        "description": "Изучите 11 реальных кейсов автоматизации в ритейле, производстве и B2B: сокращение рутины до 72% и окупаемость от 1.5 месяцев. Цифры и архитектура внедрения.",
        "keywords": "кейсы внедрения ии, автоматизация 1с кейсы, результаты rpa внедрения, окупаемость ии агентов, автопилот кейсы",
        "h1": "Кейсы внедрения ИИ-агентов и результаты автоматизации",
        "badge": "11 подтвержденных внедрений · Средний ROI +340%",
        "subtitle": "Реальные проекты в ритейле, производстве, логистике, тендерах и сервисе: измеримая экономия часов, SLA и сроки окупаемости.",
        "primary_cta": ("Смотреть все кейсы", "#cases"),
        "secondary_cta": ("Запросить аудит →", "#contact"),
        "breadcrumb_name": "Кейсы",
        "keep_sections": ("cases", "contact"),
        "has_faq": False,
        "noindex": False,
        "terminal": {
            "title": "autopilot — case_metrics --verified",
            "lines": [
                ("prompt", "$ autopilot-audit --summary --cases 11"),
                ("ok", "  ✔ Ритейл (230 точек): 9 200 ч/год экономии"),
                ("ok", "  ✔ Финтех DirectBank: 50 000 оп. за 8.4 сек"),
                ("ok", "  ✔ Сервис-центр: 80.4% обращений без оператора"),
                ("dim", "  Средняя окупаемость: 1.5–3 месяца ✓"),
            ],
            "agents": [
                {
                    "icon": "🏪",
                    "name": "Ритейл 1С",
                    "status": "−72% рутины",
                    "width": "88%",
                    "logs": [
                        {"type": "prompt", "text": "$ case --inspect retail-inventory"},
                        {"type": "ok", "text": "  ✔ +18% оборачиваемость · 230 магазинов 1С:УТ"},
                    ],
                },
                {
                    "icon": "💳",
                    "name": "DirectBank 1С",
                    "status": "99.2% точность",
                    "width": "94%",
                    "logs": [
                        {"type": "prompt", "text": "$ case --inspect fintech-recon"},
                        {"type": "ok", "text": "  ✔ 50 000 банковских транзакций за 8.4 сек"},
                    ],
                },
                {
                    "icon": "🎧",
                    "name": "ИИ-оператор",
                    "status": "3 ₽ / контакт",
                    "width": "80%",
                    "logs": [
                        {"type": "prompt", "text": "$ case --inspect service-center"},
                        {"type": "ok", "text": "  ✔ 80.4% авто-закрытие тикетов 24/7"},
                    ],
                },
            ],
        },
    },
    "calculator": {
        "dir": os.path.join(ROOT_DIR, "calculator"),
        "title": "Калькулятор ROI автоматизации ИИ | АвтоПилот",
        "description": "Рассчитайте годовую экономию фонда оплаты труда на калькуляторе ROI: укажите штат и часы рутины. Получите детальный финансовый расчет окупаемости за 30 секунд.",
        "keywords": "калькулятор окупаемости ии, расчет roi автоматизации, экономия на рутине 1с, оценка эффекта внедрения ии",
        "h1": "Калькулятор окупаемости ИИ-автоматизации и расчет ROI",
        "badge": "Финансовая модель · Точность оценки ±10%",
        "subtitle": "Оцените годовые потери ФОТ на ручной ввод в 1С, CRM и ЭДО и потенциальную экономию 80% рутины до старта пилота.",
        "primary_cta": ("Рассчитать ROI сейчас", "#calculator"),
        "secondary_cta": ("Калькулятор НПД →", "/calculator/self-employed/"),
        "breadcrumb_name": "Калькулятор",
        "keep_sections": ("calculator", "contact"),
        "has_faq": False,
        "noindex": False,
        "terminal": {
            "title": "autopilot — roi_engine v2.4",
            "lines": [
                ("prompt", "$ roi-model --staff 10 --hours 15 --salary 80k"),
                ("dim", "  Доля рутины: 15 / 160 = 9.38%"),
                ("ok", "  ✔ Затраты на рутину: 900 000 ₽/год"),
                ("ok", "  ✔ Потенциал экономии (80%): 720 000 ₽/год"),
                ("ok", "  ✔ Высвобождается: 7 800 ч/год ✓"),
            ],
            "agents": [
                {
                    "icon": "📈",
                    "name": "Модель ФОТ",
                    "status": "80% эффект",
                    "width": "80%",
                    "logs": [
                        {"type": "prompt", "text": "$ roi-model --formula annual-save"},
                        {"type": "ok", "text": "  ✔ W = E × S × (H/160) × 12 × 0.80"},
                    ],
                },
                {
                    "icon": "⏱️",
                    "name": "Окупаемость",
                    "status": "1.5–3 мес",
                    "width": "75%",
                    "logs": [
                        {"type": "prompt", "text": "$ roi-model --payback-window"},
                        {"type": "ok", "text": "  ✔ Пилот от 50 000 ₽ с 100% зачетом в смету"},
                    ],
                },
                {
                    "icon": "🧾",
                    "name": "Калькулятор НПД",
                    "status": "4% / 6%",
                    "width": "90%",
                    "logs": [
                        {"type": "prompt", "text": "$ npd-check --limit 2.4M"},
                        {"type": "ok", "text": "  ✔ Расчет выплат самозанятым в 1С без НДФЛ"},
                    ],
                },
            ],
        },
    },
    "dashboard": {
        "dir": os.path.join(ROOT_DIR, "dashboard"),
        "title": "Дашборд и мониторинг ИИ-агентов | АвтоПилот",
        "description": "Проверьте работу ИИ-агентов в реальном времени: интерактивная телеметрия, статус обработки накладных в 1С и журнал событий. Запустите демо-сессию прямо сейчас.",
        "keywords": "дашборд ии агентов, мониторинг 1с автоматизации, телеметрия rpa, центр управления автопилот",
        "h1": "Интерактивный дашборд мониторинга и метрик ИИ-агентов",
        "badge": "Демо-телеметрия · 48 агентов в контуре",
        "subtitle": "Мониторинг пропускной способности, точности распознавания и журнала событий в реальном времени.",
        "primary_cta": ("Открыть телеметрию", "#dashboard"),
        "secondary_cta": ("Запросить демо →", "#contact"),
        "breadcrumb_name": "Дашборд",
        "keep_sections": ("dashboard", "contact"),
        "has_faq": False,
        "noindex": True,
        "terminal": {
            "title": "autopilot — telemetry_stream --live",
            "lines": [
                ("prompt", "$ watch --agents --cluster prod"),
                ("ok", "  ✔ Активных агентов в контуре: 48"),
                ("ok", "  ✔ [1С OData] Обработано 842 документа/ч"),
                ("ok", "  ✔ [ЭДО] Подписано 8 УПД · Ошибок: 0"),
                ("dim", "  SLA uptime: 99.94% · Контур 152-ФЗ ✓"),
            ],
            "agents": [
                {
                    "icon": "🤖",
                    "name": "Агент: Отчёты",
                    "status": "Активен",
                    "width": "84%",
                    "logs": [
                        {"type": "prompt", "text": "$ inspect reports --pid 8821"},
                        {"type": "ok", "text": "  ✔ Утренний P&L сформирован за 2.4с"},
                    ],
                },
                {
                    "icon": "📦",
                    "name": "Агент: Склад",
                    "status": "Активен",
                    "width": "72%",
                    "logs": [
                        {"type": "prompt", "text": "$ inspect warehouse --pid 8822"},
                        {"type": "ok", "text": "  ✔ Проверено 18 420 SKU в 1С:УТ"},
                    ],
                },
                {
                    "icon": "💳",
                    "name": "Агент: ЭДО",
                    "status": "Активен",
                    "width": "91%",
                    "logs": [
                        {"type": "prompt", "text": "$ inspect edo --pid 8823"},
                        {"type": "ok", "text": "  ✔ Сверка УПД и НДС 22% пройдена"},
                    ],
                },
            ],
        },
    },
    "faq": {
        "dir": os.path.join(ROOT_DIR, "faq"),
        "title": "Частые вопросы по ИИ и 1С (FAQ) | АвтоПилот",
        "description": "Узнайте ответы на главные вопросы о внедрении ИИ-агентов: безопасность данных по 152-ФЗ, интеграция с 1С без доработок и гарантии результата по договору.",
        "keywords": "faq внедрение ии, безопасность 152 фз нейросети, интеграция с 1с без доработок, вопросы по автоматизации",
        "h1": "Часто задаваемые вопросы по внедрению ИИ-агентов",
        "badge": "Безопасность 152-ФЗ · Сроки · Окупаемость",
        "subtitle": "Регламент запуска пилота за 14 дней, архитектура подключения к 1С/CRM/ЭДО без снятия с поддержки и гарантии ROI.",
        "primary_cta": ("Перейти к вопросам", "#faq"),
        "secondary_cta": ("Задать свой вопрос →", "#contact"),
        "breadcrumb_name": "FAQ",
        "keep_sections": ("faq", "contact"),
        "has_faq": True,
        "noindex": False,
        "terminal": {
            "title": "autopilot — compliance & sla_check",
            "lines": [
                ("prompt", "$ autopilot-check --sla --152fz --1c"),
                ("ok", "  ✔ Срок пилота: ровно 14 календарных дней"),
                ("ok", "  ✔ 1С/SAP: внешнее расширение .cfe / OData"),
                ("ok", "  ✔ ИБ: РФ контур + On-Premise по 152-ФЗ"),
                ("dim", "  Договор, NDA и ЭДО Диадок/СБИС ✓"),
            ],
            "agents": [
                {
                    "icon": "🔒",
                    "name": "Контур 152-ФЗ",
                    "status": "On-Premise",
                    "width": "96%",
                    "logs": [
                        {"type": "prompt", "text": "$ security --check 152-fz"},
                        {"type": "ok", "text": "  ✔ Данные не покидают периметр РФ / серверов"},
                    ],
                },
                {
                    "icon": "🔌",
                    "name": "1С без доработок",
                    "status": "Типовая",
                    "width": "90%",
                    "logs": [
                        {"type": "prompt", "text": "$ 1c-connect --mode odata-cfe"},
                        {"type": "ok", "text": "  ✔ Поддержка конфигурации сохраняется 100%"},
                    ],
                },
                {
                    "icon": "📑",
                    "name": "Договор и ROI",
                    "status": "Гарантия",
                    "width": "85%",
                    "logs": [
                        {"type": "prompt", "text": "$ sla --check warranty"},
                        {"type": "ok", "text": "  ✔ Зачет 100% пилота + гарантия SLA 30 дней"},
                    ],
                },
            ],
        },
    },
    "contact": {
        "dir": os.path.join(ROOT_DIR, "contact"),
        "title": "Контакты и бесплатный аудит 1С | АвтоПилот",
        "description": "Запишитесь на бесплатный аудит процессов за 30 минут: найдем узкие места в 1С и CRM, покажем расчет окупаемости и план пилота. Ответим в течение 15 минут.",
        "keywords": "контакты автопилот, заказать аудит 1с, связаться по внедрению ии, ai avtopilot контакты",
        "h1": "Контакты и бесплатный экспресс-аудит процессов",
        "badge": "Отвечаем за 15 минут · Официальный канал @AiAvtopilotbot",
        "subtitle": "За 30 минут разберем узкие места в вашей 1С, CRM или ЭДО, рассчитаем матрицу окупаемости и предложим план пилотного внедрения за 14 дней.",
        "primary_cta": ("Оставить заявку", "#contact"),
        "secondary_cta": ("Написать в Telegram →", "https://t.me/AiAvtopilotbot"),
        "breadcrumb_name": "Контакты",
        "keep_sections": ("contact",),
        "has_faq": False,
        "noindex": True,
        "terminal": {
            "title": "autopilot — audit_intake --online",
            "lines": [
                ("prompt", "$ audit-session --schedule --express"),
                ("ok", "  ✔ Время реакции инженера: 5–15 минут"),
                ("ok", "  ✔ Длительность разбора: 30 минут"),
                ("ok", "  ✔ Выход: матрица ROI + схема пилота"),
                ("dim", "  Канал: @AiAvtopilotbot · 24/7 онлайн ✓"),
            ],
            "agents": [
                {
                    "icon": "⚡",
                    "name": "Экспресс-аудит",
                    "status": "30 мин",
                    "width": "92%",
                    "logs": [
                        {"type": "prompt", "text": "$ audit --agenda"},
                        {"type": "ok", "text": "  ✔ Анализ 3 узких мест в 1С, CRM и ЭДО"},
                    ],
                },
                {
                    "icon": "✈️",
                    "name": "Telegram-бот",
                    "status": "Онлайн",
                    "width": "95%",
                    "logs": [
                        {"type": "prompt", "text": "$ tg-ping @AiAvtopilotbot"},
                        {"type": "ok", "text": "  ✔ Дежурный архитектор на связи 24/7"},
                    ],
                },
                {
                    "icon": "🛡️",
                    "name": "NDA до старта",
                    "status": "152-ФЗ",
                    "width": "88%",
                    "logs": [
                        {"type": "prompt", "text": "$ legal --nda-check"},
                        {"type": "ok", "text": "  ✔ Двусторонний NDA через Диадок или СБИС"},
                    ],
                },
            ],
        },
    },
}


def get_css_hash() -> str:
    raw = open(CSS_PATH, "rb").read().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(raw).hexdigest()[:8]


SERVICES_MATRIX_HTML = """
<section id="services-matrix" style="padding:28px 0 40px;">
  <div class="container">
    <div class="article-content" style="max-width:none;">
      <p class="section-tag">Архитектура интеграций</p>
      <h2 class="section-title">Кластеры автоматизации и стек подключения к 1С, CRM и ЭДО</h2>
      <p>Платформа <strong>АвтоПилот</strong> группирует 24 сценария автоматизации в три прикладных контура. Каждый модуль подключается через стандартный API или внешнее расширение <code>.cfe</code>, не снимает типовые конфигурации 1С с официальной поддержки и запускается в пилот за 14 дней.</p>
      <div style="overflow-x:auto;margin:20px 0;border:1px solid rgba(255,255,255,.08);border-radius:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
          <thead>
            <tr style="background:rgba(99,102,241,.12);text-align:left;">
              <th style="padding:12px 14px;">Направление</th>
              <th style="padding:12px 14px;">Учётные системы</th>
              <th style="padding:12px 14px;">Контроль и эффект</th>
              <th style="padding:12px 14px;">Этап старта</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Финансы, ЭДО и 1С</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:ERP, 1С:БП, Диадок, СБИС</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Сверка УПД и НДС 22%, ДДС и дебиторка</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Пилот 14 дней</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Продажи, речевая аналитика и CRM</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Битрикс24, amoCRM, АТС, Авито</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">100% аудит звонков и расчёт КП за 30 сек</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Пилот 14 дней</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Склад, закупки и логистика</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:УТ, 1С:УАТ, WB, Ozon, ГЛОНАСС</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Автозаказ по Safety Stock и путевые листы</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">152-ФЗ РФ / On-Premise</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="faq__guides">
        <span>Инструменты и документы:</span>
        <a href="/calculator/">Калькулятор ROI</a>
        <a href="/calculator/vat-22/">Калькулятор НДС 22%</a>
        <a href="/guides/1c-odata-integration/">1С OData и .cfe</a>
        <a href="/guides/152-fz-on-premise-llm/">On-Premise 152-ФЗ</a>
        <a href="/pricing/">Тарифы и SLA</a>
      </div>
    </div>
  </div>
</section>
"""

CASES_MATRIX_HTML = """
<section id="cases-matrix" style="padding:28px 0 40px;">
  <div class="container">
    <div class="article-content" style="max-width:none;">
      <p class="section-tag">Методология аудита</p>
      <h2 class="section-title">Сводная таблица внедрений и методика фиксации ROI</h2>
      <p>Эффект по каждому из 11 проектов подтверждается хронометражем до запуска пилота и сверкой журналов событий в рабочей базе заказчика за первые 30 дней промышленной эксплуатации (SLA). Средняя окупаемость составляет 1,5–3 месяца.</p>
      <div style="overflow-x:auto;margin:20px 0;border:1px solid rgba(255,255,255,.08);border-radius:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
          <thead>
            <tr style="background:rgba(99,102,241,.12);text-align:left;">
              <th style="padding:12px 14px;">Отрасль</th>
              <th style="padding:12px 14px;">Интеграционный контур</th>
              <th style="padding:12px 14px;">Измеренный результат</th>
              <th style="padding:12px 14px;">Разбор</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Розничная сеть (230 точек)</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:Розница, автозаказ</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">−72% рутины, 9 200 ч/год</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);"><a href="/cases/retail-inventory-automation/">Кейс ритейла</a></td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Производственный холдинг</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:ERP, SAP, Диадок</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">−90% бумажного ЭДО, закрытие за 5 мин</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);"><a href="/cases/manufacturing-edi-automation/">Кейс ЭДО</a></td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Финтех и B2B-платежи</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С DirectBank, CRM, 152-ФЗ</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">50 000 выписок за 8,4 сек</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);"><a href="/cases/fintech-transaction-reconciliation/">Кейс DirectBank</a></td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Тендеры 44-ФЗ и 223-ФЗ</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:ERP, скоринг ТЗ и смет</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">−85% времени на разбор ТЗ</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);"><a href="/cases/tender-procurement-automation/">Кейс тендеров</a></td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Логистика и СТО (45 центров)</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1С:Альфа-Авто, ГЛОНАСС</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Подбор по VIN за секунды, −30% простоев</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);"><a href="/cases/auto-dealer-parts-automation/">Кейс автодилера</a></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="faq__guides">
        <span>Оценка экономики проекта:</span>
        <a href="/calculator/">Калькулятор ROI</a>
        <a href="/guides/roi-ai-automation-formula/">Формула расчёта ROI</a>
        <a href="/services/">Все 24 услуги</a>
        <a href="/pricing/">Условия и цены</a>
      </div>
    </div>
  </div>
</section>
"""

CALC_METHODOLOGY_HTML = """
<section id="calc-methodology" style="padding:28px 0 40px;">
  <div class="container">
    <div class="article-content" style="max-width:none;">
      <p class="section-tag">Финансовое обоснование</p>
      <h2 class="section-title">Методика расчёта ROI автоматизации и смежные калькуляторы</h2>
      <p>Интерактивная модель выше рассчитывает прямую годовую экономию фонда оплаты труда по формуле: <strong>W = E × S × (H / 160) × 12 × 0,80</strong>, где <em>E</em> — количество сотрудников на рутинных операциях, <em>S</em> — средняя зарплата на руки в месяц, <em>H</em> — часов ручного ввода в неделю, 160 — нормо-часы месяца, а 0,80 — консервативный коэффициент автоматизации с учётом ручной эскалации исключений.</p>
      <p>Для типовой команды из 10 специалистов с окладом 80 000 ₽ и долей рутины 20 часов в неделю (половина рабочего времени) текущие затраты на однотипные операции в 1С, Excel и почте достигают 1 200 000 ₽ в год. Автоматизация 80% рутины высвобождает 960 000 ₽ и до 7 800 рабочих часов ежегодно, благодаря чему пилот стоимостью от 50 000 ₽ и основное внедрение от 125 000 ₽ окупаются за 1,5–3 месяца.</p>
      <div style="overflow-x:auto;margin:20px 0;border:1px solid rgba(255,255,255,.08);border-radius:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
          <thead>
            <tr style="background:rgba(99,102,241,.12);text-align:left;">
              <th style="padding:12px 14px;">Подразделение</th>
              <th style="padding:12px 14px;">Автоматизируемая рутина</th>
              <th style="padding:12px 14px;">Штат / нагрузка</th>
              <th style="padding:12px 14px;">Срок окупаемости</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Бухгалтерия и ЭДО</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Ввод УПД, сверка НДС 22%, акты ТОРГ-2</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">6 чел · 18 ч/нед</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1,5–2 месяца</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Отдел продаж и Тендеры</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Расчёт КП, скоринг ТЗ 44-ФЗ, аудит звонков</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">8 чел · 15 ч/нед</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">2–2,5 месяца</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Закупки и склад 1С:УТ</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">Контроль остатков, прайсы, заказы поставщикам</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">5 чел · 20 ч/нед</td>
              <td style="padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);">1,5–3 месяца</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="faq__guides">
        <span>Специализированные налоговые калькуляторы:</span>
        <a href="/calculator/vat-22/">Калькулятор НДС 22% (2026)</a>
        <a href="/calculator/self-employed/">Калькулятор самозанятых (НПД)</a>
        <a href="/guides/roi-ai-automation-formula/">Подробный гайд по ROI</a>
        <a href="/pricing/">Стоимость внедрения</a>
      </div>
    </div>
  </div>
</section>
"""

EXTRA_FAQ_ITEMS: list[tuple[str, str]] = [
    (
        "Сколько стоит пилот и как фиксируется гарантия результата?",
        "Запуск пилотного ИИ-агента на 1 процессе стоит от 50 000 ₽ за 14 дней и на 100% засчитывается в смету основного внедрения (125 000 – 275 000 ₽). Целевые метрики точности и скорости обработки фиксируются в техническом приложении к договору.",
    ),
    (
        "Как контролируются ставки НДС 22%, 10% и УСН 5%/7% в ЭДО?",
        "Валидатор проверяет XML-файлы Диадок и СБИС и сканы PDF до проводки в 1С: сверяет ставку НДС, формулу 22/122, ИНН/КПП и отклонения от спецификации договора, а для быстрых ручных проверок доступен онлайн-калькулятор НДС 22%.",
    ),
    (
        "Как оплачиваются токены нейросетей и серверы после запуска?",
        "Наценка на инфраструктуру отсутствует: при облачном сценарии заказчик подключает собственный API-ключ (BYOK) с оплатой напрямую провайдеру, а при On-Premise модель работает на серверах компании без внешней тарификации.",
    ),
    (
        "С кем и в каком формате заключается официальный договор?",
        "Работаем с юридическими лицами РФ на ОСНО (НДС 22%) или УСН с поэтапной оплатой 50/50, обязательным соглашением о неразглашении (NDA) и обменом документами через Диадок или СБИС.",
    ),
]


def _build_terminal_wrap(term: dict) -> str:
    lines_html = "\n".join(
        f'            <div class="terminal__line terminal__line--{t}"><span>{txt}</span></div>'
        for t, txt in term["lines"]
    )
    cards_html = []
    for ac in term["agents"]:
        logs_json = json.dumps(ac["logs"], ensure_ascii=False).replace("'", "&#39;")
        cards_html.append(
            f"""          <div class="agent-card" role="button" tabindex="0" aria-label="Инспектировать {ac["name"]}" data-agent-log='{logs_json}'>
            <div class="agent-card__icon">{ac["icon"]}</div>
            <div class="agent-card__info">
              <span class="agent-card__name">{ac["name"]}</span>
              <span class="agent-card__status agent-card__status--live">{ac["status"]}</span>
            </div>
            <div class="agent-card__bar"><div class="agent-card__fill" style="width:{ac["width"]}"></div></div>
          </div>"""
        )
    return f"""      <div class="hero__terminal-wrap">
        <div class="terminal">
          <div class="terminal__header">
            <span class="terminal__dot terminal__dot--red"></span>
            <span class="terminal__dot terminal__dot--yellow"></span>
            <span class="terminal__dot terminal__dot--green"></span>
            <span class="terminal__title">{term["title"]}</span>
          </div>
          <div class="terminal__body" id="terminal-body" data-static-terminal="true">
{lines_html}
          </div>
        </div>
        <div class="hero__agent-cards">
{chr(10).join(cards_html)}
        </div>
      </div>"""


def _build_hub_hero(soup: BeautifulSoup, spec: dict) -> BeautifulSoup:
    p_text, p_href = spec["primary_cta"]
    s_text, s_href = spec["secondary_cta"]
    extra_attr = ' target="_blank" rel="noopener"' if s_href.startswith("https://") else ""
    term_html = _build_terminal_wrap(spec["terminal"])
    hero_html = f"""  <section class="hero" id="home">
    <div class="hero__particles" id="particles"></div>
    <div class="container hero__inner">
      <div class="hero__content">
        <nav class="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span class="breadcrumbs__sep">/</span>
          <span>{spec["breadcrumb_name"]}</span>
        </nav>
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <span class="hero__badge-text">{spec["badge"]}</span>
        </div>
        <h1 class="hero__title">{spec["h1"]}</h1>
        <p class="hero__sub">{spec["subtitle"]}</p>
        <div class="hero__actions">
          <a href="{p_href}" class="btn btn--primary" id="cta-main">{p_text}</a>
          <a href="{s_href}" class="btn btn--ghost"{extra_attr}>{s_text}</a>
        </div>
      </div>
{term_html}
    </div>
  </section>"""
    return BeautifulSoup(hero_html, "html.parser")


def generate_subpage(slug: str, spec: dict, master_html: str, css_hash: str) -> str:
    soup = BeautifulSoup(master_html, "html.parser")
    canonical_url = f"https://ai-avtopilot.ru/{slug}/"

    # 1. Swap inline #app-styles for external cached CSS
    app_style = soup.find("style", attrs={"id": "app-styles"})
    if app_style:
        app_style.replace_with(soup.new_tag("link", rel="stylesheet", href=f"/assets/css/styles.min.css?v={css_hash}"))

    # 2. Update Head Meta & Robots
    if soup.title:
        soup.title.string = spec["title"]

    desc = soup.find("meta", attrs={"name": "description"})
    if desc:
        desc["content"] = spec["description"]

    kw = soup.find("meta", attrs={"name": "keywords"})
    if kw:
        kw["content"] = spec["keywords"]

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots:
        robots["content"] = (
            "noindex, follow"
            if spec["noindex"]
            else "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        )

    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon:
        canon["href"] = canonical_url

    for prop, val in [
        ("og:url", canonical_url),
        ("og:title", spec["title"]),
        ("og:description", spec["description"]),
        ("twitter:title", spec["title"]),
        ("twitter:description", spec["description"]),
    ]:
        tag = soup.find("meta", attrs={"property": prop}) or soup.find("meta", attrs={"name": prop})
        if tag:
            tag["content"] = val

    # 3. Active nav highlight
    for nav_a in soup.select(".nav__links a.nav__link"):
        classes = [c for c in nav_a.get("class", []) if c != "active"]
        if nav_a.get("href") == f"/{slug}/":
            classes.append("active")
        nav_a["class"] = classes

    # 4. Focused Hero + prune cloned unrelated sections
    hero_sec = soup.find("section", id="home")
    if hero_sec:
        hero_sec.replace_with(_build_hub_hero(soup, spec))

    keep = set(spec["keep_sections"])
    for sec_id in HUB_ALL_SECTIONS:
        if sec_id not in keep:
            sec = soup.find("section", id=sec_id)
            if sec:
                sec.decompose()

    if slug == "services":
        bento = soup.select_one("#services .services__bento")
        if bento:
            cls = bento.get("class", [])
            if "services__bento--static" not in cls:
                cls.append("services__bento--static")
            bento["class"] = cls
            sdata_path = os.path.join(ROOT_DIR, "data", "services_data.json")
            if os.path.isfile(sdata_path):
                sdata = json.loads(open(sdata_path, "r", encoding="utf-8").read())
                sdata["automated-reporting"] = {
                    "description": "Ежедневная доставка P&L, остатков и выручки из 1С в Telegram по расписанию без выгрузок в Excel."
                }
                sdata["ai-analytics"] = {
                    "description": "Предиктивный платёжный календарь, расчёт неснижаемого остатка и контроль ценовых отклонений в 1С."
                }
                for scard in bento.select(".scard"):
                    link = scard.select_one("a.scard__title-link")
                    desc_el = scard.select_one(".scard__desc")
                    if link and desc_el:
                        href_slug = link.get("href", "").strip("/").split("/")[-1]
                        if href_slug in sdata and sdata[href_slug].get("description"):
                            desc_el.string = sdata[href_slug]["description"]
        nav_cta = soup.select_one(".nav .btn--nav")
        if nav_cta:
            nav_cta["href"] = "#contact"
        contact_sec = soup.find("section", id="contact")
        if contact_sec:
            extra_svc = """
            <h3 style="margin-top:24px;margin-bottom:10px;">Регламент внедрения за 14 дней</h3>
            <p>Каждый сценарий проходит 3 последовательных этапа на тестовой копии базы 1С или CRM: аудит узких мест и фиксация целевого SLA (дни 1–3), развёртывание коннектора OData/API или изолированного расширения .cfe (дни 4–10) и опытная эксплуатация на реальных документах без остановки текущих процессов бухгалтерии, склада и продаж (дни 11–14).</p>
            <p>После подтверждения точности распознавания и скорости реакции агента заказчик переводит решение в промышленный контур на собственных серверах (152-ФЗ РФ) или в защищённом облаке с зачётом 100% стоимости пилота в основной договор внедрения.</p>
            """
            mat_soup = BeautifulSoup(SERVICES_MATRIX_HTML, "html.parser")
            art = mat_soup.select_one(".article-content")
            guides_bar = mat_soup.select_one(".faq__guides")
            if art and guides_bar:
                guides_bar.insert_before(BeautifulSoup(extra_svc, "html.parser"))
            contact_sec.insert_before(mat_soup)

    if slug == "cases":
        grid = soup.select_one("#cases .cases__grid")
        if grid:
            cls = grid.get("class", [])
            if "cases__grid--static" not in cls:
                cls.append("cases__grid--static")
            grid["class"] = cls
            cdata_path = os.path.join(ROOT_DIR, "data", "cases_data.json")
            if os.path.isfile(cdata_path):
                cdata = json.loads(open(cdata_path, "r", encoding="utf-8").read())
                for ccard in grid.select(".case-card"):
                    link = ccard.select_one("a.case-card__title-link")
                    desc_el = ccard.select_one(".case-card__desc")
                    if link and desc_el:
                        href_slug = link.get("href", "").strip("/").split("/")[-1]
                        if href_slug in cdata and cdata[href_slug].get("description"):
                            desc_el.string = cdata[href_slug]["description"]
        contact_sec = soup.find("section", id="contact")
        if contact_sec:
            extra_case = """
            <h3 style="margin-top:24px;margin-bottom:10px;">Критерии приёмки и контроль качества в промышленной эксплуатации</h3>
            <p>В каждом проекте фиксируются три обязательных показателя до старта работ: исходная трудоёмкость операции в часах, доля ручных исправлений в 1С или CRM и время реакции при пиковых нагрузках в конце отчётного периода. Журнал событий агента протоколирует все сверки и автоматически передаёт спорные документы ответственному сотруднику с пояснением причины расхождения.</p>
            """
            mat_soup = BeautifulSoup(CASES_MATRIX_HTML, "html.parser")
            art = mat_soup.select_one(".article-content")
            guides_bar = mat_soup.select_one(".faq__guides")
            if art and guides_bar:
                guides_bar.insert_before(BeautifulSoup(extra_case, "html.parser"))
            contact_sec.insert_before(mat_soup)

    if slug == "calculator":
        contact_sec = soup.find("section", id="contact")
        if contact_sec:
            extra_calc = """
            <h3 style="margin-top:24px;margin-bottom:10px;">Учёт страховых взносов 30,2% и стоимости ошибок</h3>
            <p>Базовый калькулятор выше оценивает экономию строго по окладу на руки, поэтому фактическая выгода бизнеса с учётом страховых взносов работодателя (до 30,2% на ОСНО), отпускных резервов и стоимости ошибок при вводе первички в 1С обычно выше на 25–35%.</p>
            <p>На этапе 14-дневного пилота команда АвтоПилот измеряет реальную скорость обработки документов по журналу регистрации 1С, Диадок и СБИС, чтобы сравнить расчётную модель с фактической экономией часов. В результате финансовый директор получает точный бюджет масштабирования с фиксированным SLA и 100% зачётом пилота.</p>
            <p>Для компаний с высокой долей внештатных исполнителей и перехода на новую ставку НДС 22% с 2026 года мы вынесли отдельные прикладные калькуляторы ниже — проверьте налоговую нагрузку по НПД 4%/6% и формулу выделения НДС 22/122 перед согласованием бюджета пилота.</p>
            """
            mat_soup = BeautifulSoup(CALC_METHODOLOGY_HTML, "html.parser")
            art = mat_soup.select_one(".article-content")
            guides_bar = mat_soup.select_one(".faq__guides")
            if art and guides_bar:
                guides_bar.insert_before(BeautifulSoup(extra_calc, "html.parser"))
            contact_sec.insert_before(mat_soup)

    if slug == "faq":
        faq_grid = soup.select_one("#faq .faq__grid")
        if faq_grid:
            for q, a in EXTRA_FAQ_ITEMS:
                fitem = soup.new_tag("div", attrs={"class": "faq-item"})
                fbtn = soup.new_tag(
                    "button", attrs={"aria-expanded": "false", "class": "faq-item__header", "type": "button"}
                )
                qspan = soup.new_tag("span", attrs={"class": "faq-item__question"})
                qspan.string = q
                ispan = soup.new_tag("span", attrs={"class": "faq-item__icon"})
                ispan.string = "+"
                fbtn.append(qspan)
                fbtn.append(ispan)
                fans = soup.new_tag("div", attrs={"class": "faq-item__answer"})
                fin = soup.new_tag("div", attrs={"class": "faq-item__inner"})
                p_el = soup.new_tag("p")
                p_el.string = a
                fin.append(p_el)
                fans.append(fin)
                fitem.append(fbtn)
                fitem.append(fans)
                faq_grid.append(fitem)
        guides_bar = soup.select_one("#faq .faq__guides")
        if guides_bar and not guides_bar.find("a", href="/calculator/vat-22/"):
            vat_a = soup.new_tag("a", href="/calculator/vat-22/")
            vat_a.string = "Калькулятор НДС 22%"
            guides_bar.append(vat_a)

    # 5. Scoped Schema.org JSON-LD (strip homepage WebSite, OfferCatalog, and unused FAQPage)
    json_ld = soup.find("script", attrs={"type": "application/ld+json"})
    if json_ld and json_ld.string:
        data = json.loads(json_ld.string)
        new_graph = []
        for item in data.get("@graph", []):
            itype = item.get("@type")
            if itype in ("WebSite", "BreadcrumbList"):
                continue
            if itype == "FAQPage":
                if spec["has_faq"]:
                    item["@id"] = f"{canonical_url}#faq"
                    if slug == "faq":
                        main_entities = []
                        for fitem in soup.select("#faq .faq-item"):
                            q_el = fitem.select_one(".faq-item__question")
                            a_el = fitem.select_one(".faq-item__inner")
                            if q_el and a_el:
                                q_txt = " ".join(q_el.get_text(" ", strip=True).split())
                                a_txt = " ".join(a_el.get_text(" ", strip=True).split())
                                main_entities.append(
                                    {
                                        "@type": "Question",
                                        "name": q_txt,
                                        "acceptedAnswer": {"@type": "Answer", "text": a_txt},
                                    }
                                )
                        if main_entities:
                            item["mainEntity"] = main_entities
                    new_graph.append(item)
                continue
            if itype == "ProfessionalService":
                item.pop("hasOfferCatalog", None)
            new_graph.append(item)

        if slug == "calculator":
            new_graph.append(
                {
                    "@type": "WebApplication",
                    "@id": f"{canonical_url}#webapp",
                    "name": "Калькулятор окупаемости ИИ и расчет ROI автоматизации",
                    "description": spec["description"],
                    "url": canonical_url,
                    "inLanguage": "ru-RU",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "All",
                    "browserRequirements": "Requires JavaScript",
                    "isAccessibleForFree": True,
                    "provider": {"@id": "https://ai-avtopilot.ru/#organization"},
                    "featureList": [
                        "Расчет годовых затрат ФОТ на рутинные процессы в 1С, CRM и ЭДО",
                        "Оценка потенциальной экономии 80% рутины в рублях и часах в год",
                        "Ориентировочный срок окупаемости внедрения ИИ-агента",
                    ],
                }
            )
        elif slug in ("services", "cases"):
            list_sel, list_name = (
                ("#services a.scard__title-link", "Каталог услуг АвтоПилот")
                if slug == "services"
                else ("#cases a.case-card__title-link", "Кейсы внедрения АвтоПилот")
            )
            list_items = []
            for idx, a_tag in enumerate(soup.select(list_sel), start=1):
                href = a_tag.get("href", "")
                clone = BeautifulSoup(str(a_tag), "html.parser")
                for sp in clone.select("span"):
                    sp.decompose()
                item_name = " ".join(clone.get_text(" ", strip=True).split())
                if href and item_name:
                    list_items.append(
                        {
                            "@type": "ListItem",
                            "position": idx,
                            "name": item_name,
                            "url": f"https://ai-avtopilot.ru{href}" if href.startswith("/") else href,
                        }
                    )
            new_graph.append(
                {
                    "@type": "CollectionPage",
                    "@id": f"{canonical_url}#collection",
                    "name": spec["h1"],
                    "description": spec["description"],
                    "url": canonical_url,
                    "inLanguage": "ru-RU",
                    "publisher": {"@id": "https://ai-avtopilot.ru/#organization"},
                    "mainEntity": {
                        "@type": "ItemList",
                        "@id": f"{canonical_url}#itemlist",
                        "name": list_name,
                        "numberOfItems": len(list_items),
                        "itemListElement": list_items,
                    },
                }
            )

        new_graph.append(
            {
                "@type": "BreadcrumbList",
                "@id": f"{canonical_url}#breadcrumb",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://ai-avtopilot.ru/"},
                    {"@type": "ListItem", "position": 2, "name": spec["breadcrumb_name"], "item": canonical_url},
                ],
            }
        )
        data["@graph"] = new_graph
        json_ld.string = "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n"

    return str(soup)


def main() -> None:
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        master_html = f.read()

    css_hash = get_css_hash()
    print(f"Master index.html loaded ({len(master_html)} bytes), css v={css_hash}.")

    for slug, spec in SUBPAGES_SPEC.items():
        os.makedirs(spec["dir"], exist_ok=True)
        target_path = os.path.join(spec["dir"], "index.html")
        subpage_html = generate_subpage(slug, spec, master_html, css_hash)
        with open(target_path, "w", encoding="utf-8") as out_f:
            out_f.write(subpage_html)
        print(f"  [OK] Generated standalone hub: {slug}/index.html ({len(subpage_html)} bytes)")

    print("All 6 hub pages built cleanly.")

    try:
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        if ROOT_DIR not in sys.path:
            sys.path.insert(0, ROOT_DIR)

        try:
            from scripts.sync_docs import run_sync
        except ImportError:
            from sync_docs import run_sync
        run_sync(check_only=False)
    except Exception as e:
        print(f"  [WARN] Auto doc sync skipped: {e}")


if __name__ == "__main__":
    main()
