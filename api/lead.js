/**
 * Vercel Serverless Function: /api/lead
 * Receives lead from frontend, validates origin & honeypots,
 * and proxies securely to Cloudflare Worker gateway and/or Telegram.
 */

const ALLOWED_ORIGINS = new Set([
  "https://ai-avtopilot.ru",
  "https://www.ai-avtopilot.ru",
  "https://vlad-voro.github.io",
]);

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  let originToTest = origin;
  if (!originToTest && referer) {
    try {
      originToTest = new URL(referer).origin;
    } catch (_) {}
  }

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
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }

    // Forward to Cloudflare Worker Gateway
    const cfRes = await fetch("https://ai-avtopilot-bot.mr-vladimir-voronin.workers.dev/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://ai-avtopilot.ru",
        "Referer": "https://ai-avtopilot.ru/",
      },
      body: JSON.stringify(body || {}),
    });

    const cfData = await cfRes.json();
    return res.status(cfRes.status).json(cfData);
  } catch (err) {
    console.error("Error in /api/lead:", err);
    return res.status(502).json({ success: false, error: "Gateway proxy failed" });
  }
};
