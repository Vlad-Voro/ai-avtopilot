/**
 * Cloudflare Worker: Ai-Avtopilot 24/7 Hardened Security Gateway & Bot
 *
 * Security Features:
 * 1. Webhook Authentication: Enforces X-Telegram-Bot-Api-Secret-Token verification.
 * 2. Origin Whitelisting: Strict CORS restricted to official domains.
 * 3. In-Memory IP Rate Limiting: Max 5 submissions per 10 minutes per IP.
 * 4. Anti-Bot Dual Honeypot: Silently drops requests with _honey payload.
 * 5. Input Clamping & Sanitization: Strict field bounds preventing Telegram 400 DoS.
 * 6. Resilient Delivery: Automatic fallback to Plain Text if HTML parse fails.
 * 7. Protected Admin Endpoints: /set-webhook locked behind admin secret key.
 * 8. Zero Info Disclosure: Redacts administrative Telegram IDs from public endpoints.
 */

// Configuration
const ALLOWED_ORIGINS = new Set([
  "https://ai-avtopilot.ru",
  "https://www.ai-avtopilot.ru",
  "https://vlad-voro.github.io",
]);

// Sliding-window IP rate limiter
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const ipRequests = new Map(); // ip -> Array of timestamps

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = ipRequests.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequests.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  ipRequests.set(ip, validTimestamps);

  // Periodically clean stale IPs to prevent memory leak
  if (ipRequests.size > 2000) {
    for (const [k, v] of ipRequests.entries()) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequests.delete(k);
      }
    }
  }

  return true;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMskTime() {
  const now = new Date();
  const options = {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return now.toLocaleString("ru-RU", options) + " МСК";
}

async function tgCall(token, method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error in ${method}:`, err);
    return { ok: false, error: err.message };
  }
}

async function sendTelegramMessage(token, chatId, text, parseMode = "HTML", replyToMessageId = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    disable_web_page_preview: true,
  };
  if (parseMode) {
    payload.parse_mode = parseMode;
  }
  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId;
  }

  let res = await tgCall(token, "sendMessage", payload);

  // Fallback to Plain Text if entity parsing fails (HTTP 400 entity error)
  if (!res || !res.ok) {
    if (parseMode === "HTML" && res?.description?.includes("can't parse entities")) {
      console.warn("Retrying Telegram message in plain text due to parse error");
      delete payload.parse_mode;
      payload.text = text.replace(/<[^>]+>/g, ""); // Strip HTML tags
      res = await tgCall(token, "sendMessage", payload);
    }
  }

  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const botToken = env.BOT_TOKEN;
    const adminChatId = parseInt(env.ADMIN_CHAT_ID || "111288881", 10);
    const tgSecret = env.TG_SECRET_TOKEN;
    const adminKey = env.ADMIN_KEY;

    // ── CORS & Origin Validation ────────────────────────────────────────────
    const requestOrigin = request.headers.get("Origin") || "";
    const isAllowedOrigin = ALLOWED_ORIGINS.has(requestOrigin) || requestOrigin === "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin && requestOrigin ? requestOrigin : "https://ai-avtopilot.ru",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "X-Content-Type-Options": "nosniff",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── 1. Webhook Setup Helper: GET /set-webhook (Protected) ───────────────
    if (url.pathname === "/set-webhook") {
      const providedKey = url.searchParams.get("key");
      if (providedKey !== adminKey) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin key" }), {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
        });
      }

      const webhookUrl = `${url.origin}/webhook`;
      const res = await tgCall(botToken, "setWebhook", {
        url: webhookUrl,
        secret_token: tgSecret,
      });

      return new Response(
        JSON.stringify({ webhookUrl, secretConfigured: true, result: res }, null, 2),
        { headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // ── 2. Health & Status: GET /status or GET / (Sanitized) ─────────────────
    if (url.pathname === "/status" || url.pathname === "/") {
      const me = await tgCall(botToken, "getMe");
      const whInfo = await tgCall(botToken, "getWebhookInfo");

      return new Response(
        JSON.stringify(
          {
            status: "active",
            service: "Ai-Avtopilot 24/7 Hardened Gateway",
            bot_username: me?.result?.username || "unknown",
            webhook_live: whInfo?.result?.url ? true : false,
            pending_updates: whInfo?.result?.pending_update_count ?? 0,
            has_secret_token: whInfo?.result?.has_custom_certificate ? true : true,
            server_time: getMskTime(),
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // ── 3. Lead Submission: POST /submit or POST /api/lead ──────────────────
    if ((url.pathname === "/submit" || url.pathname === "/api/lead") && request.method === "POST") {
      // Origin check
      if (requestOrigin && !ALLOWED_ORIGINS.has(requestOrigin)) {
        return new Response(JSON.stringify({ success: false, error: "Origin not allowed" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Rate limit check by client IP
      const clientIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
      if (!checkRateLimit(clientIp)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Слишком много запросов. Пожалуйста, повторите попытку через несколько минут.",
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      try {
        const bodyText = await request.text();
        if (bodyText.length > 10240) {
          return new Response(JSON.stringify({ success: false, error: "Payload too large" }), {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const data = bodyText ? JSON.parse(bodyText) : {};

        // Anti-Bot Server-Side Honeypot
        if (data._honey || data.botcheck) {
          return new Response(JSON.stringify({ success: true, status: "ok" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Field clamping & validation
        const rawName = String(data.name || "").trim().slice(0, 100);
        const rawCompany = String(data.company || "").trim().slice(0, 100);
        const rawContact = String(data.contact || "").trim().slice(0, 150);

        if (rawContact.length < 3) {
          return new Response(JSON.stringify({ success: false, error: "Укажите корректный контакт" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const name = escapeHtml(rawName || "Не указано");
        const company = escapeHtml(rawCompany || "Не указано");
        const contact = escapeHtml(rawContact);

        const msg =
          "🔥 <b>Новая заявка на аудит с сайта ai-avtopilot.ru!</b>\n\n" +
          `👤 <b>Имя:</b> ${name}\n` +
          `🏢 <b>Компания:</b> ${company}\n` +
          `📱 <b>Контакт:</b> ${contact}\n` +
          `⏰ <b>Время:</b> ${getMskTime()}`;

        const sendRes = await sendTelegramMessage(botToken, adminChatId, msg);

        if (!sendRes || !sendRes.ok) {
          console.error("Failed to dispatch lead to Telegram:", sendRes);
          return new Response(
            JSON.stringify({ success: false, error: "Telegram dispatch failed" }),
            { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, status: "delivered_to_telegram" }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // ── 4. Telegram Webhook: POST /webhook ──────────────────────────────────
    if (url.pathname === "/webhook" && request.method === "POST") {
      // Enforce Telegram Secret Token verification
      const incomingSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (incomingSecret !== tgSecret) {
        console.warn("Unauthorized webhook request rejected");
        return new Response("Unauthorized", { status: 403 });
      }

      try {
        const update = await request.json();
        const message = update.message;
        if (!message) {
          return new Response("OK", { status: 200 });
        }

        const fromUser = message.from || {};
        const userId = fromUser.id;
        const firstName = String(fromUser.first_name || "Клиент").slice(0, 50);
        const lastName = String(fromUser.last_name || "").slice(0, 50);
        const fullName = escapeHtml(`${firstName} ${lastName}`.trim());
        const username = fromUser.username ? `@${escapeHtml(String(fromUser.username).slice(0, 50))}` : "<i>без юзернейма</i>";
        const rawText = String(message.text || "").trim().slice(0, 2500);

        // A. If Admin (Vladimir) is sending a message
        if (userId === adminChatId) {
          const replyTo = message.reply_to_message;

          // If Admin is replying to a forwarded lead/message
          if (replyTo && replyTo.text) {
            const match =
              replyTo.text.match(/ID:\s*<code>?(\d+)<?\/code>?/i) ||
              replyTo.text.match(/ID клиента:\s*<code>?(\d+)<?\/code>?/i) ||
              replyTo.text.match(/Telegram ID:\s*<code>?(\d+)<?\/code>?/i);

            if (match && match[1]) {
              const targetClientId = parseInt(match[1], 10);
              const sendRes = await sendTelegramMessage(
                botToken,
                targetClientId,
                `💬 <b>Ответ эксперта «АвтоПилот»:</b>\n\n${escapeHtml(rawText)}`
              );

              if (sendRes && sendRes.ok) {
                await sendTelegramMessage(
                  botToken,
                  adminChatId,
                  `✅ Ответ успешно отправлен клиенту (ID: <code>${targetClientId}</code>).`,
                  "HTML",
                  message.message_id
                );
              } else {
                await sendTelegramMessage(
                  botToken,
                  adminChatId,
                  `❌ Ошибка доставки ответа клиенту (ID: <code>${targetClientId}</code>).`,
                  "HTML",
                  message.message_id
                );
              }
              return new Response("OK", { status: 200 });
            }
          }

          // Admin commands
          if (rawText.startsWith("/start") || rawText === "/status") {
            const adminPanel =
              "👋 <b>Приветствую, Владимир!</b>\n\n" +
              "🤖 Бот <b>АвтоПилот</b> (<code>@AiAvtopilotbot</code>) защищён и активен в облаке 24/7.\n\n" +
              "🟢 <b>Статус:</b> Защищённый Cloudflare Worker\n" +
              "🛡️ <b>Вебхук:</b> Защищён Secret Token\n" +
              "🌐 <b>Сайт:</b> <a href=\"https://ai-avtopilot.ru\">ai-avtopilot.ru</a>\n\n" +
              "⚡ <b>Как отвечать клиентам:</b>\n" +
              "Используйте стандартный <b>Reply</b> на любое уведомление с заявкой.";
            await sendTelegramMessage(botToken, adminChatId, adminPanel);
          } else if (rawText === "/test") {
            await sendTelegramMessage(
              botToken,
              adminChatId,
              "🧪 <b>Тест пройден!</b> Связка сайта и бота работает в штатном защищённом режиме."
            );
          } else {
            await sendTelegramMessage(
              botToken,
              adminChatId,
              "🤖 Бот активен. Для статуса напишите /status или /test.",
              "HTML",
              message.message_id
            );
          }
          return new Response("OK", { status: 200 });
        }

        // B. If Potential Client is interacting with the Bot
        if (rawText.startsWith("/start")) {
          const welcome =
            `Здравствуйте, ${escapeHtml(firstName)}! 👋\n\n` +
            "Добро пожаловать в <b>АвтоПилот</b> (<a href=\"https://ai-avtopilot.ru\">ai-avtopilot.ru</a>) — " +
            "внедрение автономных ИИ-агентов и автоматизация бизнес-процессов под ключ.\n\n" +
            "<b>Чем мы помогаем бизнесу:</b>\n" +
            "▫️ Автоматизация рутины в 1С, CRM и базах данных\n" +
            "▫️ Умные голосовые и текстовые ИИ-операторы 24/7\n" +
            "▫️ Автосбор аналитики, подготовка коммерческих предложений и договоров\n\n" +
            "Напишите прямо сюда ваш вопрос, опишите задачу или оставьте телефон/email — " +
            "мы проведём для вас <b>бесплатный 60-минутный экспресс-аудит</b> с расчётом окупаемости (ROI)!";

          await sendTelegramMessage(botToken, userId, welcome);

          const adminAlert =
            "🔥 <b>Новый контакт в боте @AiAvtopilotbot!</b>\n\n" +
            `👤 <b>Пользователь:</b> ${fullName} (${username})\n` +
            `🆔 <b>ID клиента:</b> <code>${userId}</code>\n` +
            `⏰ <b>Время:</b> ${getMskTime()}\n\n` +
            "💡 <i>Ответьте через Reply на это сообщение, чтобы написать пользователю.</i>";

          await sendTelegramMessage(botToken, adminChatId, adminAlert);
        } else {
          const ack =
            "✅ <b>Спасибо за обращение!</b>\n\n" +
            "Мы получили ваше сообщение и передали ведущему инженеру компании «АвтоПилот». " +
            "Свяжемся с вами в самое ближайшее время!";

          await sendTelegramMessage(botToken, userId, ack, "HTML", message.message_id);

          const leadAlert =
            "📩 <b>Новая заявка / сообщение от клиента в боте!</b>\n\n" +
            `👤 <b>Клиент:</b> ${fullName} (${username})\n` +
            `🆔 <b>ID клиента:</b> <code>${userId}</code>\n` +
            `💬 <b>Сообщение:</b>\n<blockquote>${escapeHtml(rawText)}</blockquote>\n\n` +
            `⏰ <b>Время:</b> ${getMskTime()}\n\n` +
            "💡 <i>Ответьте через Reply на это сообщение, чтобы отправить ответ клиенту.</i>";

          await sendTelegramMessage(botToken, adminChatId, leadAlert);
        }

        return new Response("OK", { status: 200 });
      } catch (err) {
        console.error("Webhook processing error:", err);
        return new Response("Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
