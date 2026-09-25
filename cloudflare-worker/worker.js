/**
 * Cloudflare Worker: Ai-Avtopilot 24/7 Telegram Bot & Lead Gateway
 * Handles:
 * 1. Webhook from Telegram (@AiAvtopilotbot)
 *    - Instant welcome message to clients with audit offer
 *    - Instant alert to Vladimir (ID: 111288881)
 *    - Admin replies (via Telegram Reply) forwarded back to clients
 *    - Admin /status, /start commands
 * 2. POST /submit (or /api/lead) from website (ai-avtopilot.ru)
 *    - Bypasses RKN block of api.telegram.org in Russian client browsers
 *    - Instant Telegram notification with lead details
 * 3. GET /set-webhook - 1-click webhook registration with Telegram API
 */

const BOT_TOKEN = "8701592211:AAFQoBr-UB4TOEk7zQXZqWURtjC5QfcLivU";
const ADMIN_CHAT_ID = 111288881;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

async function tgCall(method, payload) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

async function sendTelegramMessage(chatId, text, parseMode = "HTML", replyToMessageId = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
    disable_web_page_preview: false,
  };
  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId;
  }
  return await tgCall("sendMessage", payload);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── CORS Headers ────────────────────────────────────────────────────────
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── 1. Webhook Setup Helper: GET /set-webhook ───────────────────────────
    if (url.pathname === "/set-webhook") {
      const webhookUrl = `${url.origin}/webhook`;
      const res = await tgCall("setWebhook", { url: webhookUrl });
      return new Response(JSON.stringify({ webhookUrl, result: res }, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
      });
    }

    // ── 2. Status / Health Check: GET /status or GET / ──────────────────────
    if (url.pathname === "/status" || url.pathname === "/") {
      const me = await tgCall("getMe");
      const whInfo = await tgCall("getWebhookInfo");
      return new Response(
        JSON.stringify(
          {
            status: "active",
            service: "Ai-Avtopilot 24/7 Cloud Gateway",
            admin_id: ADMIN_CHAT_ID,
            bot: me.result || me,
            webhook: whInfo.result || whInfo,
            server_time: getMskTime(),
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
      );
    }

    // ── 3. Website Form Lead Dispatch: POST /submit or POST /api/lead ───────
    if ((url.pathname === "/submit" || url.pathname === "/api/lead") && request.method === "POST") {
      try {
        const data = await request.json();
        const name = escapeHtml(data.name || "Не указано");
        const company = escapeHtml(data.company || "Не указано");
        const contact = escapeHtml(data.contact || "Не указано");

        const msg =
          "🔥 <b>Новая заявка на аудит с сайта ai-avtopilot.ru!</b>\n\n" +
          `👤 <b>Имя:</b> ${name}\n` +
          `🏢 <b>Компания:</b> ${company}\n` +
          `📱 <b>Контакт:</b> ${contact}\n` +
          `⏰ <b>Время:</b> ${getMskTime()}`;

        await sendTelegramMessage(ADMIN_CHAT_ID, msg);

        return new Response(JSON.stringify({ success: true, status: "delivered_to_telegram" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // ── 4. Telegram Webhook: POST /webhook ──────────────────────────────────
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        const message = update.message;
        if (!message) {
          return new Response("OK", { status: 200 });
        }

        const fromUser = message.from || {};
        const userId = fromUser.id;
        const firstName = fromUser.first_name || "Клиент";
        const lastName = fromUser.last_name || "";
        const fullName = escapeHtml(`${firstName} ${lastName}`.trim());
        const username = fromUser.username ? `@${escapeHtml(fromUser.username)}` : "<i>без юзернейма</i>";
        const text = (message.text || "").trim();

        // A. If Admin (Vladimir) is sending a message
        if (userId === ADMIN_CHAT_ID) {
          const replyTo = message.reply_to_message;

          // If Admin is replying to a forwarded lead/message
          if (replyTo && replyTo.text) {
            // Extract Client ID from the notification text: [ID: 12345678]
            const match = replyTo.text.match(/ID:\s*<code>?(\d+)<?\/code>?/i) ||
                          replyTo.text.match(/ID клиента:\s*<code>?(\d+)<?\/code>?/i) ||
                          replyTo.text.match(/Telegram ID:\s*<code>?(\d+)<?\/code>?/i);

            if (match && match[1]) {
              const targetClientId = parseInt(match[1], 10);
              const sendRes = await sendTelegramMessage(
                targetClientId,
                `💬 <b>Ответ эксперта «АвтоПилот»:</b>\n\n${escapeHtml(text)}`
              );

              if (sendRes && sendRes.ok) {
                await sendTelegramMessage(
                  ADMIN_CHAT_ID,
                  `✅ Ответ успешно отправлен клиенту (ID: <code>${targetClientId}</code>).`,
                  "HTML",
                  message.message_id
                );
              } else {
                await sendTelegramMessage(
                  ADMIN_CHAT_ID,
                  `❌ Ошибка доставки ответа клиенту (ID: <code>${targetClientId}</code>).`,
                  "HTML",
                  message.message_id
                );
              }
              return new Response("OK", { status: 200 });
            }
          }

          // Admin commands
          if (text.startsWith("/start") || text === "/status") {
            const adminPanel =
              "👋 <b>Приветствую, Владимир!</b>\n\n" +
              "🤖 Бот <b>АвтоПилот</b> (<code>@AiAvtopilotbot</code>) активен в облаке 24/7.\n\n" +
              "🟢 <b>Статус:</b> Онлайн (Cloudflare Worker Edge)\n" +
              "🆔 <b>Ваш Chat ID:</b> <code>111288881</code>\n" +
              "🌐 <b>Сайт:</b> <a href=\"https://ai-avtopilot.ru\">ai-avtopilot.ru</a>\n\n" +
              "⚡ <b>Как отвечать клиентам:</b>\n" +
              "Просто нажмите <b>Reply</b> на любое сообщение с заявкой от бота, напишите ваш ответ — бот мгновенно доставит его клиенту в Telegram.";
            await sendTelegramMessage(ADMIN_CHAT_ID, adminPanel);
          } else if (text === "/test") {
            await sendTelegramMessage(
              ADMIN_CHAT_ID,
              "🧪 <b>Тест пройден!</b> Связка сайта и бота работает в облаке без сбоев."
            );
          } else {
            await sendTelegramMessage(
              ADMIN_CHAT_ID,
              "🤖 Бот активен и готов принимать заявки клиентов. Для проверки напишите /status или /test.",
              "HTML",
              message.message_id
            );
          }
          return new Response("OK", { status: 200 });
        }

        // B. If Potential Client is interacting with the Bot
        if (text.startsWith("/start")) {
          // Welcome message to client
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

          await sendTelegramMessage(userId, welcome);

          // Instant alert to Vladimir
          const adminAlert =
            "🔥 <b>Новый контакт в боте @AiAvtopilotbot!</b>\n\n" +
            `👤 <b>Пользователь:</b> ${fullName} (${username})\n` +
            `🆔 <b>ID клиента:</b> <code>${userId}</code>\n` +
            `⏰ <b>Время:</b> ${getMskTime()}\n\n` +
            "💡 <i>Ответьте через Reply на это сообщение, чтобы написать пользователю.</i>";

          await sendTelegramMessage(ADMIN_CHAT_ID, adminAlert);
        } else {
          // Client sent an inquiry, phone, or question
          const ack =
            "✅ <b>Спасибо за обращение!</b>\n\n" +
            "Мы получили ваше сообщение и передали ведущему инженеру компании «АвтоПилот». " +
            "Свяжемся с вами в самое ближайшее время!";

          await sendTelegramMessage(userId, ack, "HTML", message.message_id);

          // Instant alert to Vladimir
          const leadAlert =
            "📩 <b>Новая заявка / сообщение от клиента в боте!</b>\n\n" +
            `👤 <b>Клиент:</b> ${fullName} (${username})\n` +
            `🆔 <b>ID клиента:</b> <code>${userId}</code>\n` +
            `💬 <b>Сообщение:</b>\n<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
            `⏰ <b>Время:</b> ${getMskTime()}\n\n` +
            "💡 <i>Ответьте через Reply на это сообщение, чтобы отправить ответ клиенту.</i>";

          await sendTelegramMessage(ADMIN_CHAT_ID, leadAlert);
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
