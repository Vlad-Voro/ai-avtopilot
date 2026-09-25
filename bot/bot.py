#!/usr/bin/env python3
"""Ai-Avtopilot Telegram Lead & Assistant Bot (@AiAvtopilotbot).

Listens for incoming messages from potential clients, provides
instant welcome/onboarding, forwards leads to administrator Vladimir Voro
(Chat ID: 111288881), and supports two-way admin replies via Telegram Reply.
Also provides a local HTTP endpoint for receiving leads from the web form.
"""

from __future__ import annotations

import datetime
import html
import json
import logging
import os
import signal
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("AiAvtopilotBot")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8701592211:AAFQoBr-UB4TOEk7zQXZqWURtjC5QfcLivU")
ADMIN_CHAT_ID = int(os.getenv("TELEGRAM_ADMIN_ID", "111288881"))
LOCAL_PROXIES = ["http://127.0.0.1:10809", "socks5://127.0.0.1:10808"]
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
HTTP_PORT = int(os.getenv("BOT_HTTP_PORT", "8765"))

# Mapping: admin_msg_id -> client_user_id (for admin reply routing)
REPLY_MAP: dict[int, int] = {}
MAP_LOCK = threading.Lock()


def get_opener() -> urllib.request.OpenerDirector:
    """Builds an OpenerDirector with proxy if local proxy is active, else direct."""
    # Check if 127.0.0.1:10809 is open
    is_proxy_open = False
    try:
        with socket.create_connection(("127.0.0.1", 10809), timeout=0.3):
            is_proxy_open = True
    except OSError:
        is_proxy_open = False

    if is_proxy_open:
        proxy_handler = urllib.request.ProxyHandler(
            {
                "http": "http://127.0.0.1:10809",
                "https": "http://127.0.0.1:10809",
            }
        )
        return urllib.request.build_opener(proxy_handler)
    return urllib.request.build_opener()


def telegram_api_call(
    method: str, payload: dict[str, Any] | None = None, timeout: float = 30.0
) -> dict[str, Any] | None:
    """Executes a Telegram Bot API method safely."""
    url = f"{API_URL}/{method}"
    opener = get_opener()
    data = None
    headers = {"User-Agent": "AiAvtopilotBot/1.0"}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with opener.open(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.error("Telegram API HTTP error %d for %s: %s", exc.code, method, err_body)
        return None
    except Exception as exc:
        logger.error("Telegram API network error for %s: %s", method, exc)
        return None


def send_message(
    chat_id: int | str, text: str, parse_mode: str = "HTML", reply_to_message_id: int | None = None
) -> int | None:
    """Sends a message to a chat and returns message_id if successful."""
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": False,
    }
    if reply_to_message_id:
        payload["reply_to_message_id"] = reply_to_message_id

    res = telegram_api_call("sendMessage", payload)
    if res and res.get("ok"):
        return res["result"]["message_id"]
    return None


def msk_now() -> str:
    """Returns current Moscow time formatted as string."""
    utc_now = datetime.datetime.now(datetime.timezone.utc)
    msk_tz = datetime.timezone(datetime.timedelta(hours=3))
    return utc_now.astimezone(msk_tz).strftime("%d.%m.%Y %H:%M:%S МСК")


def handle_admin_command(message: dict[str, Any]) -> None:
    """Handles commands sent directly by the administrator."""
    chat_id = message["chat"]["id"]
    text = (message.get("text") or "").strip()
    reply_to = message.get("reply_to_message")

    # If admin replied to a forwarded client message
    if reply_to:
        replied_msg_id = reply_to.get("message_id")
        with MAP_LOCK:
            target_client_id = REPLY_MAP.get(replied_msg_id)

        if target_client_id:
            client_msg_id = send_message(
                chat_id=target_client_id,
                text=f"💬 <b>Ответ эксперта АвтоПилот:</b>\n\n{html.escape(text)}",
            )
            if client_msg_id:
                send_message(
                    chat_id=chat_id,
                    text=f"✅ Ответ успешно доставлен клиенту (ID: <code>{target_client_id}</code>).",
                    reply_to_message_id=message["message_id"],
                )
                return
            else:
                send_message(
                    chat_id=chat_id,
                    text=f"❌ Не удалось доставить ответ клиенту (ID: <code>{target_client_id}</code>).",
                    reply_to_message_id=message["message_id"],
                )
                return

    # Regular admin commands
    if text.startswith("/start") or text == "/status":
        admin_info = (
            "👋 <b>Приветствую, Владимир!</b>\n\n"
            "🤖 Бот <b>АвтоПилот</b> (<code>@AiAvtopilotbot</code>) активен и подключен к вашей учётной записи.\n\n"
            "🟢 <b>Статус</b>: Онлайн\n"
            "🆔 <b>Ваш Chat ID</b>: <code>111288881</code>\n"
            '🌐 <b>Сайт</b>: <a href="https://ai-avtopilot.ru">ai-avtopilot.ru</a>\n\n'
            "⚡ <b>Как это работает:</b>\n"
            "• Все заявки с сайта мгновенно приходят сюда\n"
            "• Когда клиент пишет в бот, вы сразу получаете уведомление\n"
            "• Чтобы ответить клиенту — просто сделайте <b>Reply</b> на сообщение с заявкой!"
        )
        send_message(chat_id=chat_id, text=admin_info)
    elif text == "/help":
        help_msg = (
            "📌 <b>Команды администратора:</b>\n"
            "/status — проверить статус бота и связку\n"
            "/test — отправить тестовую заявку\n"
            "💡 Чтобы ответить клиенту — используйте <i>Reply</i> на уведомление о заявке."
        )
        send_message(chat_id=chat_id, text=help_msg)
    elif text == "/test":
        test_msg = "🧪 <b>Тестовое уведомление:</b>\nСвязка сайта и бота работает стабильно! Линии связи активны."
        send_message(chat_id=chat_id, text=test_msg)
    else:
        # Default acknowledgment for admin
        send_message(
            chat_id=chat_id,
            text="🤖 Команда принята. Бот активен и готов принимать заявки клиентов.",
            reply_to_message_id=message.get("message_id"),
        )


def handle_client_message(message: dict[str, Any]) -> None:
    """Handles incoming inquiries from potential clients."""
    from_user = message.get("from", {})
    user_id = from_user.get("id")
    first_name = from_user.get("first_name", "Клиент")
    last_name = from_user.get("last_name", "")
    full_name = html.escape(f"{first_name} {last_name}".strip())
    username = from_user.get("username")
    user_link = f"@{html.escape(username)}" if username else "<i>без юзернейма</i>"
    text = (message.get("text") or "").strip()

    if text.startswith("/start"):
        # Welcome message to client
        welcome = (
            f"Здравствуйте, {html.escape(first_name)}! 👋\n\n"
            'Добро пожаловать в <b>АвтоПилот</b> (<a href="https://ai-avtopilot.ru">ai-avtopilot.ru</a>) — '
            "внедрение ИИ-агентов и автоматизация бизнес-процессов под ключ.\n\n"
            "<b>Чем мы можем помочь вашему бизнесу:</b>\n"
            "▫️ Автоматизация рутины в 1С, МойСклад, CRM и базах данных\n"
            "▫️ Автономные ИИ-агенты и голосовые/чат-операторы 24/7\n"
            "▫️ Автосбор аналитики, генерация договоров и коммерческих предложений\n\n"
            "Напишите прямо сюда ваш вопрос, описание задачи или оставьте контакты — "
            "мы свяжемся с вами и проведём <b>бесплатный 60-минутный экспресс-аудит</b> с расчётом ROI!"
        )
        send_message(chat_id=user_id, text=welcome)

        # Notify Vladimir
        admin_alert = (
            "🔥 <b>Новый пользователь запустил бота @AiAvtopilotbot!</b>\n\n"
            f"👤 <b>Пользователь:</b> {full_name} ({user_link})\n"
            f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n"
            f"⏰ <b>Время:</b> {msk_now()}\n\n"
            "💡 <i>Ответьте через Reply на это сообщение, чтобы написать пользователю.</i>"
        )
        adm_msg_id = send_message(chat_id=ADMIN_CHAT_ID, text=admin_alert)
        if adm_msg_id and user_id:
            with MAP_LOCK:
                REPLY_MAP[adm_msg_id] = user_id

    else:
        # Client sent a lead / question / contact info
        confirmation = (
            "✅ <b>Спасибо за обращение!</b>\n\n"
            "Мы получили ваше сообщение и передали ведущему инженеру компании «АвтоПилот». "
            "Свяжемся с вами в самое ближайшее время!"
        )
        send_message(chat_id=user_id, text=confirmation, reply_to_message_id=message.get("message_id"))

        # Notify Vladimir
        admin_lead = (
            "📩 <b>Новая заявка / сообщение в боте @AiAvtopilotbot!</b>\n\n"
            f"👤 <b>От кого:</b> {full_name} ({user_link})\n"
            f"🆔 <b>ID:</b> <code>{user_id}</code>\n"
            f"💬 <b>Сообщение:</b>\n"
            f"<blockquote>{html.escape(text)}</blockquote>\n\n"
            f"⏰ <b>Время:</b> {msk_now()}\n\n"
            "💡 <i>Ответьте через Reply на это сообщение, чтобы отправить ответ клиенту.</i>"
        )
        adm_msg_id = send_message(chat_id=ADMIN_CHAT_ID, text=admin_lead)
        if adm_msg_id and user_id:
            with MAP_LOCK:
                REPLY_MAP[adm_msg_id] = user_id


def process_update(update: dict[str, Any]) -> None:
    """Processes a single Telegram update."""
    message = update.get("message")
    if not message:
        return

    from_user = message.get("from", {})
    user_id = from_user.get("id")
    if not user_id:
        return

    if user_id == ADMIN_CHAT_ID:
        handle_admin_command(message)
    else:
        handle_client_message(message)


# ── Embedded HTTP Webhook/Form Server ─────────────────────────────────────────


class LeadHandler(BaseHTTPRequestHandler):
    """Handles POST /api/lead or /submit from local forms or reverse proxies."""

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body) if body else {}

            name = html.escape(str(data.get("name", "Не указано")).strip())
            company = html.escape(str(data.get("company", "Не указано")).strip())
            contact = html.escape(str(data.get("contact", "Не указано")).strip())

            tg_msg = (
                "🔥 <b>Новая заявка на аудит с сайта ai-avtopilot.ru!</b>\n\n"
                f"👤 <b>Имя:</b> {name}\n"
                f"🏢 <b>Компания:</b> {company}\n"
                f"📱 <b>Контакт:</b> {contact}\n"
                f"⏰ <b>Время:</b> {msk_now()}"
            )
            send_message(chat_id=ADMIN_CHAT_ID, text=tg_msg)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"success": true, "status": "sent_to_telegram"}')
        except Exception as exc:
            logger.error("HTTP lead handler error: %s", exc)
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(exc)}).encode("utf-8"))

    def log_message(self, format: str, *args: Any) -> None:
        """Suppress default HTTP logging clutter."""
        pass


def run_http_server() -> None:
    """Runs a lightweight HTTP server in a daemon thread."""
    try:
        server = HTTPServer(("127.0.0.1", HTTP_PORT), LeadHandler)
        logger.info("Local Lead HTTP Server listening on http://127.0.0.1:%d", HTTP_PORT)
        server.serve_forever()
    except Exception as exc:
        logger.warning("Could not start HTTP Lead Server on port %d: %s", HTTP_PORT, exc)


# ── Main Bot Polling Loop ─────────────────────────────────────────────────────

RUNNING = True


def signal_handler(signum: int, frame: Any) -> None:
    global RUNNING
    logger.info("Signal received, stopping bot gracefully...")
    RUNNING = False


def main() -> None:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    logger.info("Starting Ai-Avtopilot Bot (@AiAvtopilotbot)...")

    # Verify bot credentials
    me = telegram_api_call("getMe")
    if not me or not me.get("ok"):
        logger.error("Failed to connect to Telegram Bot API. Verify network/proxy/token.")
        sys.exit(1)

    bot_info = me["result"]
    logger.info(
        "Connected as @%s (%s, ID: %s)", bot_info.get("username"), bot_info.get("first_name"), bot_info.get("id")
    )

    # Send startup confirmation to admin
    startup_msg = (
        "🚀 <b>Служба бота @AiAvtopilotbot запущена!</b>\n\n"
        "Связка настроена. Все сообщения и заявки поступают напрямую в этот диалог."
    )
    send_message(chat_id=ADMIN_CHAT_ID, text=startup_msg)

    # Start background HTTP server
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()

    offset = 0

    while RUNNING:
        try:
            updates = telegram_api_call("getUpdates", {"offset": offset, "timeout": 20}, timeout=25.0)
            if updates and updates.get("ok"):
                for update in updates.get("result", []):
                    update_id = update["update_id"]
                    offset = update_id + 1
                    try:
                        process_update(update)
                    except Exception as exc:
                        logger.error("Error processing update %d: %s", update_id, exc)
            time.sleep(0.5)
        except Exception as exc:
            logger.error("Polling loop exception: %s", exc)
            time.sleep(3.0)

    logger.info("Bot stopped.")


if __name__ == "__main__":
    main()
