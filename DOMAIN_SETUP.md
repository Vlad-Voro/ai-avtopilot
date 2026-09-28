# Инструкция по архитектуре домена ai-avtopilot.ru, хостингу на Vercel Edge и защите

Данное руководство содержит регламент инфраструктуры домена `ai-avtopilot.ru`: хостинг на Vercel Edge CDN (`76.76.21.21`), авторитетный DNS через Cloudflare в режиме DNS-only (Grey Cloud, DNSSEC), автоматический деплой из приватного репозитория GitHub, изоляция служебных файлов через `.vercelignore`, подключение формы лидогенерации и верификация в Яндекс Вебмастер и Google Search Console.

---

## Шаг 1. Регистрация домена `ai-avtopilot.ru`

Домен в зоне `.ru` зарегистрирован у аккредитованного регистратора **REG.RU** с делегированием NS на Cloudflare и активацией DNSSEC (записи DS).

---

## Шаг 2. Настройка DNS-записей в Cloudflare и хостинга на Vercel (Edge CDN)

Хостинг статики размещён на платформе **Vercel** (тариф Hobby, 100% бесплатно, поддержка приватных репозиториев, автоматический Let's Encrypt SSL, 29 мс пинг в РФ).
Cloudflare используется исключительно как авторитетный DNS-провайдер с поддержкой DNSSEC в режиме **DNS only** (серое облако), что полностью исключает замедления и фильтрацию ТСПУ в РФ.

### 1. DNS-записи в Cloudflare (DNS only / Grey Cloud):

| Тип | Имя / Хост | Значение (IP / CNAME) | TTL | Proxy status | Назначение |
|---|---|---|---|---|---|
| **A** | `@` | `76.76.21.21` | Auto | DNS only (Grey) | Главный домен (Apex на Vercel Edge) |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto | DNS only (Grey) | Алиас `www` (Vercel canonical redirect) |

### 2. Режим SSL/TLS и безопасность:
- **SSL-сертификат**: Выпускается Vercel автоматически (Let's Encrypt / DigiCert) с автоматическим продлением.
- **DNSSEC**: Активирован в Cloudflare и подтвержден записями DS в панели REG.RU.
- **Приватность**: Репозиторий `Vlad-Voro/ai-avtopilot` остаётся 100% приватным.
- **CI/CD**: Автоматический деплой при каждом коммите в ветку `main`.

### 3. DNS-записи для поисковой верификации:

| Тип | Имя | Значение | TTL | Назначение |
|---|---|---|---|---|
| **TXT** | `@` | `google-site-verification=u42j0jjBKadmyE77f9wlqfy5gkyDONXtaPzcPRZ51R8` | Auto | Google Search Console DNS-верификация |

### 4. (Опционально) Записи для доменной почты `contact@ai-avtopilot.ru`:

| Сервис | Тип | Хост | Значение | Приоритет |
|---|---|---|---|---|
| **Яндекс 360** | **MX** | `@` | `mx.yandex.net.` | 10 |
| **Яндекс 360** | **TXT** | `@` | `v=spf1 redirect=_spf.yandex.net` | — |
| **VK WorkMail** | **MX** | `@` | `emx.mail.ru.` | 10 |
| **VK WorkMail** | **TXT** | `@` | `v=spf1 include:_spf.mail.ru ~all` | — |

---

## Шаг 3. Деплой на Vercel Edge и изоляция служебных файлов

Репозиторий `Vlad-Voro/ai-avtopilot` подключен к **Vercel** через официальную интеграцию GitHub. Деплой происходит автоматически при каждом коммите в ветку `main`:

1. **Конфигурация Vercel (`vercel.json`)**:
   - `cleanUrls: true` — чистые URL без `.html`.
   - `trailingSlash: true` — 308 канонический редирект на URL со слешем `/` для sub-роутов.
   - Заголовки безопасности: `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, `Strict-Transport-Security` (HSTS 1 год с preload), `Permissions-Policy`.
   - Кеширование: 1 год (`max-age=31536000, immutable`) для статики в `/assets/`; `max-age=0, must-revalidate` для HTML и манифестов.
   - Автоматическая обработка 404: Vercel отдает кастомный `/404.html` на любые несуществующие маршруты.

2. **Изоляция и безопасность (`.vercelignore`)**:
   Для предотвращения публичного доступа к служебным файлам, тестам и исходному коду ботов/воркеров в корень добавлен `.vercelignore`:
   - Документация и спецификации: `*.md` (`ARCHITECTURE.md`, `DOMAIN_SETUP.md`, `TEST_READY.md`).
   - Серверные конфиги и мета: `_headers`, `.htaccess`, `.gitignore`, `push_to_github.ps1`, `CNAME`.
   - Служебные каталоги: `tests/`, `bot/`, `cloudflare-worker/`, `scripts/`.
   - В результате файлы `https://ai-avtopilot.ru/_headers` и `https://ai-avtopilot.ru/ARCHITECTURE.md` физически не публикуются в Edge CDN и возвращают `404 Not Found`.

3. **Резервный деплой на Beget через FTPS (GitHub Actions)**:
   - Воркфлоу [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) сохраняется как аварийный бэкап контура.
   - Конфигурация [`.htaccess`](file:///.htaccess) сохранена в репозитории для обеспечения совместимости при аварийном переключении DNS обратно на Beget Apache.

---

## Шаг 4. Настройка шлюзов получения заявок и уведомлений

Форма сайта спроектирована с каскадным 3-уровневым резервированием (Zero-Downtime Intake):

### 1. Основной канал (Cloudflare Worker -> Telegram @AiAvtopilotbot):
По умолчанию настроена прямая отправка на граничный шлюз Cloudflare Worker:
`POST https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev/submit`
- Заявки мгновенно поступают дежурному администратору в Telegram-бот [@AiAvtopilotbot](https://t.me/AiAvtopilotbot).
- Поддерживается двусторонний ответ клиенту прямо через функцию «Ответить» (Reply) в Telegram.
- Встроен скользящий IP Rate Limiter (5 заявок/10 мин), отсечка ботов быстрее 1.0с и антиспам Honeypot.

### 2. Резервный канал (Web3Forms + FormSubmit.co):
При непредвиденном сетевом сбое (таймаут 6с) форма автоматически переключается на отправку по электронной почте:
- **Web3Forms**: активируется при указании Access Key в скрытом поле `access_key`.
- **FormSubmit.co**: активируется автоматически без ключей, направляя письмо на `contact@ai-avtopilot.ru`.
- **Offline Fallback UI**: при полной недоступности сети отображается карточка аварийной связи с копированием параметров заявки в буфер и кнопкой перехода в Telegram.

В форму встроены:
- Защита от спама (Honeypot-ловушка `_honey`).
- Блок согласия на обработку данных согласно **152-ФЗ РФ**.
- Ссылка на отдельную страницу `/privacy.html` (Политика конфиденциальности).
- Анимация загрузки и окно благодарности с сохраненными данными заявки.

---

## Шаг 5. Проверка работы сайта

### 1. Проверка DNS:
В терминале выполните:
```bash
nslookup ai-avtopilot.ru 1.1.1.1
```
В ответе должен отображаться IP-адрес `76.76.21.21` (Vercel Anycast Edge), подтверждающий прямое подключение без проксирования Cloudflare и отсутствие замедлений ТСПУ в РФ.

### 2. Проверка доступности страниц и изоляции:
Откройте в браузере или через curl:
- `https://ai-avtopilot.ru/` — главная страница (200 OK, <0.3s)
- `https://ai-avtopilot.ru/services/` — 1С и ERP автоматизация (200 OK)
- `https://ai-avtopilot.ru/cases/` — подтвержденные кейсы (200 OK)
- `https://ai-avtopilot.ru/calculator/` — интерактивный калькулятор ROI (200 OK)
- `https://ai-avtopilot.ru/dashboard/` — симулятор рабочих нагрузок (200 OK)
- `https://ai-avtopilot.ru/faq/` — B2B FAQ (1С/ЭДО/152-ФЗ) (200 OK)
- `https://ai-avtopilot.ru/contact/` — форма заявки (200 OK)
- `https://ai-avtopilot.ru/privacy.html` — политика конфиденциальности (152-ФЗ) (200 OK)
- `https://ai-avtopilot.ru/robots.txt` — директивы для поисковых систем (200 OK)
- `https://ai-avtopilot.ru/sitemap.xml` — карта сайта (200 OK)
- `https://ai-avtopilot.ru/llms.txt` — спецификация для LLM-агентов (200 OK)
- `https://ai-avtopilot.ru/_headers` — проверка изоляции (возвращает 404 кастомную страницу)
- `https://ai-avtopilot.ru/ARCHITECTURE.md` — проверка изоляции (возвращает 404 кастомную страницу)
- `https://ai-avtopilot.ru/non-existent-page` — проверка кастомной 404 страницы (404 Not Found)

---

## Шаг 6. Индексация в Яндекс и Google (B2B продвижение в РФ)

Для максимальной видимости в российском B2B-сегменте подтверждены права владельца:

1. **Яндекс Вебмастер**:
   - Верификационный файл: `https://ai-avtopilot.ru/yandex_cd29b4304b5e16c6.html` (отдает `200 OK`).
   - Добавлен `https://ai-avtopilot.ru/sitemap.xml`.
   - Указан целевой регион: Россия / Москва.

2. **Google Search Console**:
   - Верификация: DNS TXT-запись `google-site-verification=u42j0jjBKadmyE77f9wlqfy5gkyDONXtaPzcPRZ51R8` в Cloudflare DNS + дублирующий метатег в `index.html`.
   - Отправлен `https://ai-avtopilot.ru/sitemap.xml`.

---

## Шаг 7. Яндекс Метрика и цели (Настроено автономно)

Для сайта создан и привязан персональный счетчик Яндекс Метрики в аккаунте `mr.Vladimir.Voronin`:

- **Номер счетчика**: `112978516`
- **Вебвизор**: Версия 2.0 (включена запись действий посетителей)
- **Карта кликов и скроллинга**: Активированы
- **Отслеживание ссылок и отказов**: Активировано
- **CSP (Content Security Policy)**: Обновлен в `index.html` с разрешениями для `https://mc.yandex.ru` и `https://yastatic.net`

### Сконфигурированные цели в Метрике:

| Название цели | Тип | Идентификатор / Условие | Назначение |
|---|---|---|---|
| **Макро: Заявка на аудит отправлена (JS)** | JavaScript-событие | `lead_form_submitted` | Главная конверсия при отправке формы аудита |
| **Макро: Страница спасибо (URL)** | Посещение страницы | содержит `success.html` | Надежное URL-подтверждение перехода после отправки |
| **Микро: Клик по кнопке аудита (CTA)** | JavaScript-событие | `click_cta_audit` | Клик по любой кнопке вызова аудита (хедер, баннеры, калькулятор) |
| **Микро: Взаимодействие с калькулятором ROI** | JavaScript-событие | `calc_interacted` | Пользователь начал двигать ползунки калькулятора |
| **Микро: Доскролл до кейсов (Глубокий интерес)** | JavaScript-событие | `scroll_cases_deep` | Скролл экрана до блока кейсов внедрения |
| **Микро: Клик по контактам (Email/Telegram)** | JavaScript-событие | `click_contact` | Переход в Telegram или клик по почте |

Код счетчика и автоматическая отправка событий встроены во все страницы сайта (`index.html`, `success.html`, `privacy.html`).

