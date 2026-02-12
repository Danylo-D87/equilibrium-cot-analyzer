#!/usr/bin/env python3
"""
COT Analyzer — Telegram Bot + Analytics
========================================
Runs two services in one process:
  1. Telegram bot — receives commands, sends visit notifications
  2. HTTP server  — lightweight /api/visit endpoint for frontend tracking

Features:
  - Real-time visit notifications to Telegram
  - Daily stats digest at 00:00 Kyiv time
  - Bot commands: /stats, /today, /week
  - Inline keyboard for quick stats access

Environment variables:
  TG_BOT_TOKEN  — Telegram bot token from @BotFather
  TG_CHAT_ID    — Your Telegram chat/user ID (get from @userinfobot)

Usage:
  python tg_bot.py                  # Run bot + analytics server
  python tg_bot.py --test           # Send test message and exit
"""

import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime
from functools import partial

import pytz
from aiohttp import web
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, ContextTypes,
)

# Ensure we're running from the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from analytics import Analytics

logger = logging.getLogger('cot_pipeline.tg_bot')

KYIV_TZ = pytz.timezone('Europe/Kyiv')

# --- Configuration ---
TG_BOT_TOKEN = os.environ.get('TG_BOT_TOKEN', '')
TG_CHAT_ID = os.environ.get('TG_CHAT_ID', '')
ANALYTICS_PORT = int(os.environ.get('ANALYTICS_PORT', '8700'))

# Throttle: don't send more than 1 notification per this many seconds per IP
NOTIFY_THROTTLE_SEC = 300  # 5 minutes

# =====================================================================
# Formatting helpers
# =====================================================================

def fmt_stats_today(stats: dict) -> str:
    return (
        f"📊 *Статистика за сьогодні* ({stats['date']})\n"
        f"\n"
        f"👀 Відвідувань: *{stats['total_visits']}*\n"
        f"👤 Унікальних: *{stats['unique_visitors']}*"
    )


def fmt_stats_alltime(stats: dict) -> str:
    first = stats['first_visit'] or '—'
    last = stats['last_visit'] or '—'
    return (
        f"📈 *Статистика за весь час*\n"
        f"\n"
        f"👀 Відвідувань: *{stats['total_visits']}*\n"
        f"👤 Унікальних: *{stats['unique_visitors']}*\n"
        f"📅 Перший візит: {first}\n"
        f"📅 Останній: {last}"
    )


def fmt_daily_breakdown(days: list[dict]) -> str:
    if not days:
        return "Немає даних за останній тиждень."
    lines = ["📅 *Статистика по днях (останні 7):*\n"]
    for d in days:
        lines.append(f"  `{d['day']}` — 👀 {d['total']} / 👤 {d['unique_visitors']}")
    return '\n'.join(lines)


def fmt_visit_notification(visit: dict) -> str:
    now = datetime.now(KYIV_TZ).strftime('%H:%M:%S')
    ip = visit.get('ip', '?')
    path = visit.get('path', '/')
    ref = visit.get('referrer') or 'direct'
    ua = visit.get('user_agent', '')
    # Shorten UA
    if len(ua) > 80:
        ua = ua[:77] + '...'
    return (
        f"🔔 *Новий відвідувач*  `{now}`\n"
        f"🌐 IP: `{ip}`\n"
        f"📄 Сторінка: {path}\n"
        f"🔗 Джерело: {ref}\n"
        f"💻 `{ua}`"
    )


def stats_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📊 Сьогодні", callback_data="stats_today"),
            InlineKeyboardButton("📈 За весь час", callback_data="stats_alltime"),
        ],
        [
            InlineKeyboardButton("📅 За тиждень", callback_data="stats_week"),
        ],
    ])


# =====================================================================
# Telegram Bot Handlers
# =====================================================================

analytics = Analytics()


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 *COT Analyzer Bot*\n\n"
        "Я відстежую відвідування сайту та надсилаю сповіщення.\n\n"
        "Команди:\n"
        "/stats — Статистика (кнопки)\n"
        "/today — Статистика за сьогодні\n"
        "/alltime — Статистика за весь час\n"
        "/week — По днях за останній тиждень",
        parse_mode='Markdown',
    )


async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    today = analytics.get_stats_today()
    text = fmt_stats_today(today)
    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=stats_keyboard())


async def cmd_today(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    today = analytics.get_stats_today()
    await update.message.reply_text(fmt_stats_today(today), parse_mode='Markdown')


async def cmd_alltime(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    alltime = analytics.get_stats_alltime()
    await update.message.reply_text(fmt_stats_alltime(alltime), parse_mode='Markdown')


async def cmd_week(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    days = analytics.get_daily_breakdown(7)
    await update.message.reply_text(fmt_daily_breakdown(days), parse_mode='Markdown')


async def callback_handler(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == 'stats_today':
        today = analytics.get_stats_today()
        await query.edit_message_text(fmt_stats_today(today), parse_mode='Markdown',
                                      reply_markup=stats_keyboard())
    elif query.data == 'stats_alltime':
        alltime = analytics.get_stats_alltime()
        await query.edit_message_text(fmt_stats_alltime(alltime), parse_mode='Markdown',
                                      reply_markup=stats_keyboard())
    elif query.data == 'stats_week':
        days = analytics.get_daily_breakdown(7)
        await query.edit_message_text(fmt_daily_breakdown(days), parse_mode='Markdown',
                                      reply_markup=stats_keyboard())


# =====================================================================
# Visit notification (with throttle)
# =====================================================================

_last_notify: dict[str, float] = {}  # ip -> timestamp


async def notify_visit(bot: Bot, visit: dict):
    """Send visit notification to Telegram (throttled per IP)."""
    if not TG_CHAT_ID:
        return

    ip = visit.get('ip', '')
    now = asyncio.get_event_loop().time()

    # Throttle: skip if same IP was notified recently
    last = _last_notify.get(ip, 0)
    if now - last < NOTIFY_THROTTLE_SEC:
        return

    _last_notify[ip] = now

    try:
        text = fmt_visit_notification(visit)
        await bot.send_message(chat_id=TG_CHAT_ID, text=text, parse_mode='Markdown')
    except Exception as e:
        logger.warning(f"[TG] Failed to send visit notification: {e}")


# =====================================================================
# Daily digest (scheduled at 00:00 Kyiv)
# =====================================================================

async def daily_digest(bot: Bot):
    """Send daily stats digest at midnight Kyiv time."""
    if not TG_CHAT_ID:
        return

    try:
        today = analytics.get_stats_today()
        alltime = analytics.get_stats_alltime()

        text = (
            f"🌙 *Щоденний звіт — COT Analyzer*\n"
            f"{'─' * 30}\n\n"
            f"{fmt_stats_today(today)}\n\n"
            f"{'─' * 30}\n\n"
            f"{fmt_stats_alltime(alltime)}"
        )

        await bot.send_message(
            chat_id=TG_CHAT_ID, text=text,
            parse_mode='Markdown', reply_markup=stats_keyboard(),
        )
        logger.info("[TG] Daily digest sent")
    except Exception as e:
        logger.error(f"[TG] Daily digest failed: {e}", exc_info=True)


# =====================================================================
# HTTP Analytics endpoint (aiohttp)
# =====================================================================

def create_http_app(bot: Bot) -> web.Application:
    app = web.Application()

    async def handle_visit(request: web.Request):
        """POST /api/visit — track a page visit."""
        try:
            # Get real IP (behind nginx proxy)
            ip = request.headers.get('X-Real-IP') or \
                 request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or \
                 request.remote or ''

            body = {}
            if request.content_type == 'application/json':
                try:
                    body = await request.json()
                except Exception:
                    pass

            path = body.get('path', '/')
            referrer = body.get('referrer', request.headers.get('Referer', ''))
            user_agent = request.headers.get('User-Agent', '')

            visit = analytics.record_visit(
                ip=ip, path=path, referrer=referrer, user_agent=user_agent
            )
            logger.info(f"[VISIT] {ip} -> {path}")

            # Notify Telegram (async, don't block response)
            asyncio.create_task(notify_visit(bot, visit))

            return web.json_response({'ok': True})
        except Exception as e:
            logger.error(f"[VISIT] Error: {e}")
            return web.json_response({'ok': False}, status=500)

    async def handle_health(request: web.Request):
        """GET /api/health — health check."""
        return web.json_response({'status': 'ok', 'service': 'cot-analytics'})

    app.router.add_post('/api/visit', handle_visit)
    app.router.add_get('/api/health', handle_health)

    return app


# =====================================================================
# Main entry point
# =====================================================================

async def run_all():
    """Run Telegram bot + HTTP server + scheduler concurrently."""

    if not TG_BOT_TOKEN:
        logger.error("[TG] TG_BOT_TOKEN not set! Set it via environment variable.")
        sys.exit(1)

    if not TG_CHAT_ID:
        logger.warning("[TG] TG_CHAT_ID not set — notifications will be disabled.")

    # Build Telegram application
    app = Application.builder().token(TG_BOT_TOKEN).build()

    app.add_handler(CommandHandler('start', cmd_start))
    app.add_handler(CommandHandler('stats', cmd_stats))
    app.add_handler(CommandHandler('today', cmd_today))
    app.add_handler(CommandHandler('alltime', cmd_alltime))
    app.add_handler(CommandHandler('week', cmd_week))
    app.add_handler(CallbackQueryHandler(callback_handler))

    bot = app.bot

    # APScheduler — daily digest at 00:00 Kyiv
    scheduler = AsyncIOScheduler(timezone=KYIV_TZ)
    scheduler.add_job(
        daily_digest, 'cron',
        hour=0, minute=0, second=0,
        args=[bot],
        id='daily_digest',
        name='Daily stats digest at 00:00 Kyiv',
    )
    scheduler.start()
    logger.info("[SCHEDULER] Daily digest scheduled at 00:00 Europe/Kyiv")

    # HTTP analytics server
    http_app = create_http_app(bot)
    runner = web.AppRunner(http_app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', ANALYTICS_PORT)
    await site.start()
    logger.info(f"[HTTP] Analytics server listening on 127.0.0.1:{ANALYTICS_PORT}")

    # Initialize and start the Telegram bot
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

    logger.info("[TG] Bot started, polling for updates...")

    # Send startup notification
    if TG_CHAT_ID:
        try:
            now = datetime.now(KYIV_TZ).strftime('%Y-%m-%d %H:%M:%S')
            await bot.send_message(
                chat_id=TG_CHAT_ID,
                text=f"✅ *COT Analyzer Bot запущено*\n🕐 {now} (Kyiv)",
                parse_mode='Markdown',
            )
        except Exception as e:
            logger.warning(f"[TG] Failed to send startup message: {e}")

    # Keep running until interrupted
    stop_event = asyncio.Event()

    def _signal_handler():
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    try:
        await stop_event.wait()
    except (KeyboardInterrupt, SystemExit):
        pass

    # Graceful shutdown
    logger.info("[SHUTDOWN] Stopping services...")
    scheduler.shutdown(wait=False)
    await app.updater.stop()
    await app.stop()
    await app.shutdown()
    await runner.cleanup()
    logger.info("[SHUTDOWN] Done.")


def main():
    import argparse

    ap = argparse.ArgumentParser(description='COT Analyzer — Telegram Bot + Analytics')
    ap.add_argument('--test', action='store_true', help='Send test message and exit')
    ap.add_argument('--verbose', '-v', action='store_true', help='Debug logging')
    args = ap.parse_args()

    # Logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(
                str(os.path.join(os.path.dirname(__file__), 'logs', 'tg_bot.log')),
                encoding='utf-8',
            ),
        ],
    )
    # Create logs dir
    os.makedirs(os.path.join(os.path.dirname(__file__), 'logs'), exist_ok=True)

    if args.test:
        # Quick test: send message and exit
        async def _test():
            if not TG_BOT_TOKEN or not TG_CHAT_ID:
                print("ERROR: Set TG_BOT_TOKEN and TG_CHAT_ID environment variables")
                return
            bot = Bot(token=TG_BOT_TOKEN)
            now = datetime.now(KYIV_TZ).strftime('%Y-%m-%d %H:%M:%S')
            await bot.send_message(
                chat_id=TG_CHAT_ID,
                text=f"🧪 *Тестове повідомлення*\n🕐 {now} (Kyiv)\n✅ Бот працює!",
                parse_mode='Markdown',
            )
            print("✅ Test message sent!")
        asyncio.run(_test())
        return

    asyncio.run(run_all())


if __name__ == '__main__':
    main()
