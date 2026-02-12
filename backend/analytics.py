"""
COT Analyzer — Site Analytics
==============================
Lightweight visit tracking with SQLite storage.
Stores page visits with IP, user-agent, path, and timestamp.
Provides aggregated stats (total visits, unique visitors) for today / all-time.
"""

import sqlite3
import logging
from datetime import datetime, date
from pathlib import Path
from contextlib import contextmanager

import pytz

from config import BASE_DIR

logger = logging.getLogger('cot_pipeline.analytics')

ANALYTICS_DB = BASE_DIR / 'analytics.db'
KYIV_TZ = pytz.timezone('Europe/Kyiv')


class Analytics:
    """Visit tracking and statistics."""

    def __init__(self, db_path: Path = None):
        self.db_path = db_path or ANALYTICS_DB
        self._init_db()

    def _init_db(self):
        with self._conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS visits (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts        TEXT NOT NULL,
                    ip        TEXT,
                    path      TEXT,
                    referrer  TEXT,
                    user_agent TEXT,
                    country   TEXT
                )
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_visits_ip ON visits(ip)
            ''')

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(str(self.db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def record_visit(self, ip: str, path: str = '/',
                     referrer: str = None, user_agent: str = None) -> dict:
        """Record a visit. Returns visit info dict."""
        now = datetime.now(KYIV_TZ)
        ts = now.strftime('%Y-%m-%d %H:%M:%S')

        with self._conn() as conn:
            conn.execute(
                'INSERT INTO visits (ts, ip, path, referrer, user_agent) '
                'VALUES (?, ?, ?, ?, ?)',
                (ts, ip, path, referrer, user_agent)
            )

        return {
            'ts': ts,
            'ip': ip,
            'path': path,
            'referrer': referrer,
            'user_agent': user_agent,
        }

    def get_stats_today(self) -> dict:
        """Get today's stats (Kyiv timezone)."""
        today = datetime.now(KYIV_TZ).strftime('%Y-%m-%d')
        with self._conn() as conn:
            row = conn.execute(
                'SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_visitors '
                'FROM visits WHERE ts LIKE ?',
                (f'{today}%',)
            ).fetchone()
        return {
            'date': today,
            'total_visits': row['total'],
            'unique_visitors': row['unique_visitors'],
        }

    def get_stats_alltime(self) -> dict:
        """Get all-time stats."""
        with self._conn() as conn:
            row = conn.execute(
                'SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_visitors, '
                'MIN(ts) as first_visit, MAX(ts) as last_visit '
                'FROM visits'
            ).fetchone()
        return {
            'total_visits': row['total'],
            'unique_visitors': row['unique_visitors'],
            'first_visit': row['first_visit'],
            'last_visit': row['last_visit'],
        }

    def get_daily_breakdown(self, days: int = 7) -> list[dict]:
        """Get per-day stats for the last N days."""
        with self._conn() as conn:
            rows = conn.execute(
                'SELECT SUBSTR(ts, 1, 10) as day, '
                'COUNT(*) as total, COUNT(DISTINCT ip) as unique_visitors '
                'FROM visits '
                'GROUP BY day ORDER BY day DESC LIMIT ?',
                (days,)
            ).fetchall()
        return [dict(r) for r in rows]
