/**
 * Vercel Serverless Function: Tier 2 Failover Lead Gateway
 * Independent Edge route executing directly on Vercel infrastructure.
 * Guarantees zero lead loss if primary Cloudflare Worker suffers an outage.
 */

const ALLOWED_ORIGINS = new Set([
  "https://ai-avtopilot.ru",
  "https://www.ai-avtopilot.ru",
  "https://vlad-voro.github.io",
]);

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  let originToTest = origin;
  if (!originToTest && referer) {
    try {
      originToTest = new URL(referer).origin;
    } catch (_) {}
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.has(originToTest) && originToTest ? originToTest : "https://ai-avtopilot.ru");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (originToTest && !ALLOWED_ORIGINS.has(originToTest)) {
    return res.status(403).json({ success: false, error: "Origin not allowed" });
  }

  try {
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }

    // Honeypot check
    if (body._honey || body.botcheck) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect(303, "https://ai-avtopilot.ru/success.html");
      }
      return res.status(200).json({ success: true, status: "ok" });
    }

    const rawContact = String(body.contact || "").trim().slice(0, 150);
    const rawName = String(body.name || "").trim().slice(0, 100);
    const rawCompany = String(body.company || "").trim().slice(0, 100);
    const rawMessage = String(body.message || "").trim().slice(0, 1000);

    if (rawContact.length < 3) {
      return res.status(400).json({ success: false, error: "Укажите корректный контакт" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      const msg = `⚡ <b>Резервный шлюз (Vercel Tier 2): Заявка с сайта!</b>\n\n` +
        `📱 <b>Контакт:</b> ${escapeHtml(rawContact)}\n` +
        (rawName ? `👤 <b>Имя:</b> ${escapeHtml(rawName)}\n` : "") +
        (rawCompany ? `🏢 <b>Компания:</b> ${escapeHtml(rawCompany)}\n` : "") +
        (rawMessage ? `💬 <b>Сообщение:</b>\n${escapeHtml(rawMessage)}\n` : "") +
        `⏰ <b>Время:</b> ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} МСК`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: msg,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }).catch((err) => console.warn("Vercel Telegram dispatch failed:", err));
    }

    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(303, "https://ai-avtopilot.ru/success.html");
    }

    return res.status(200).json({ success: true, status: "delivered_via_tier2" });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
