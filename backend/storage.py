"""
COT Multi-Report Pipeline — SQLite Storage
===========================================
Stores data for all report types (legacy, disagg, tff) × subtypes (fo, co)
using generic g1–g5 group columns.
"""

import sqlite3
import logging
from pathlib import Path

from config import DB_PATH

logger = logging.getLogger('cot_pipeline.storage')


class DataStore:
    """SQLite-backed storage for COT data, supporting multiple report types."""

    def __init__(self, db_path: str = None):
        self.db_path = str(db_path or DB_PATH)
        self._ensure_tables()

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def db_exists(self) -> bool:
        p = Path(self.db_path)
        return p.exists() and p.stat().st_size > 0

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------

    def _ensure_tables(self):
        conn = self._connect()
        try:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS cot_data (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_type     TEXT NOT NULL,   -- 'legacy','disagg','tff'
                    subtype         TEXT NOT NULL,   -- 'fo','co'
                    report_date     TEXT NOT NULL,
                    cftc_contract_code TEXT NOT NULL,
                    market_and_exchange TEXT,
                    exchange_code   TEXT,
                    cftc_commodity_code TEXT,

                    open_interest   REAL,
                    oi_change       REAL,

                    g1_long         REAL,
                    g1_short        REAL,
                    g1_spread       REAL,
                    g1_long_change  REAL,
                    g1_short_change REAL,
                    g1_spread_change REAL,
                    g1_pct_long     REAL,
                    g1_pct_short    REAL,
                    g1_pct_spread   REAL,

                    g2_long         REAL,
                    g2_short        REAL,
                    g2_spread       REAL,
                    g2_long_change  REAL,
                    g2_short_change REAL,
                    g2_spread_change REAL,
                    g2_pct_long     REAL,
                    g2_pct_short    REAL,
                    g2_pct_spread   REAL,

                    g3_long         REAL,
                    g3_short        REAL,
                    g3_spread       REAL,
                    g3_long_change  REAL,
                    g3_short_change REAL,
                    g3_spread_change REAL,
                    g3_pct_long     REAL,
                    g3_pct_short    REAL,
                    g3_pct_spread   REAL,

                    g4_long         REAL,
                    g4_short        REAL,
                    g4_spread       REAL,
                    g4_long_change  REAL,
                    g4_short_change REAL,
                    g4_spread_change REAL,
                    g4_pct_long     REAL,
                    g4_pct_short    REAL,
                    g4_pct_spread   REAL,

                    g5_long         REAL,
                    g5_short        REAL,
                    g5_spread       REAL,
                    g5_long_change  REAL,
                    g5_short_change REAL,
                    g5_spread_change REAL,
                    g5_pct_long     REAL,
                    g5_pct_short    REAL,
                    g5_pct_spread   REAL,

                    total_rept_long  REAL,
                    total_rept_short REAL,

                    UNIQUE(cftc_contract_code, report_date, report_type, subtype)
                );

                CREATE INDEX IF NOT EXISTS idx_cot_rt_st
                    ON cot_data(report_type, subtype);
                CREATE INDEX IF NOT EXISTS idx_cot_code_date
                    ON cot_data(cftc_contract_code, report_date);
                CREATE INDEX IF NOT EXISTS idx_cot_date
                    ON cot_data(report_date);

                CREATE TABLE IF NOT EXISTS download_log (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_type TEXT NOT NULL,
                    subtype     TEXT NOT NULL,
                    year        INTEGER NOT NULL,
                    downloaded  TEXT NOT NULL,
                    rows_count  INTEGER DEFAULT 0,
                    UNIQUE(report_type, subtype, year)
                );
            """)
            conn.commit()
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Insert / upsert
    # ------------------------------------------------------------------

    # Ordered list of columns for bulk insert
    _DATA_COLS = [
        'report_type', 'subtype', 'report_date', 'cftc_contract_code',
        'market_and_exchange', 'exchange_code', 'cftc_commodity_code',
        'open_interest', 'oi_change',
        'g1_long', 'g1_short', 'g1_spread',
        'g1_long_change', 'g1_short_change', 'g1_spread_change',
        'g1_pct_long', 'g1_pct_short', 'g1_pct_spread',
        'g2_long', 'g2_short', 'g2_spread',
        'g2_long_change', 'g2_short_change', 'g2_spread_change',
        'g2_pct_long', 'g2_pct_short', 'g2_pct_spread',
        'g3_long', 'g3_short', 'g3_spread',
        'g3_long_change', 'g3_short_change', 'g3_spread_change',
        'g3_pct_long', 'g3_pct_short', 'g3_pct_spread',
        'g4_long', 'g4_short', 'g4_spread',
        'g4_long_change', 'g4_short_change', 'g4_spread_change',
        'g4_pct_long', 'g4_pct_short', 'g4_pct_spread',
        'g5_long', 'g5_short', 'g5_spread',
        'g5_long_change', 'g5_short_change', 'g5_spread_change',
        'g5_pct_long', 'g5_pct_short', 'g5_pct_spread',
        'total_rept_long', 'total_rept_short',
    ]

    def upsert_rows(self, rows: list[dict]):
        """
        Insert rows (list of dicts). On conflict, replace.
        Each dict must contain at least: report_type, subtype, report_date, cftc_contract_code.
        """
        if not rows:
            return 0

        cols_str = ', '.join(self._DATA_COLS)
        placeholders = ', '.join(['?'] * len(self._DATA_COLS))
        sql = f"""
            INSERT OR REPLACE INTO cot_data ({cols_str})
            VALUES ({placeholders})
        """

        conn = self._connect()
        try:
            values = []
            for row in rows:
                vals = tuple(row.get(c) for c in self._DATA_COLS)
                values.append(vals)

            conn.executemany(sql, values)
            conn.commit()
            logger.debug(f"Upserted {len(values)} rows")
            return len(values)
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Download log
    # ------------------------------------------------------------------

    def is_year_downloaded(self, year: int, report_type: str = None, subtype: str = None) -> bool:
        """Check if a year was already downloaded for given report_type/subtype."""
        conn = self._connect()
        try:
            if report_type and subtype:
                cur = conn.execute(
                    "SELECT 1 FROM download_log WHERE year=? AND report_type=? AND subtype=?",
                    (year, report_type, subtype))
            else:
                cur = conn.execute("SELECT 1 FROM download_log WHERE year=?", (year,))
            return cur.fetchone() is not None
        finally:
            conn.close()

    def log_download(self, report_type: str, subtype: str, year: int, rows_count: int):
        conn = self._connect()
        try:
            from datetime import datetime
            conn.execute(
                """INSERT OR REPLACE INTO download_log
                   (report_type, subtype, year, downloaded, rows_count)
                   VALUES (?, ?, ?, ?, ?)""",
                (report_type, subtype, year, datetime.now().isoformat(), rows_count))
            conn.commit()
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    def get_market_data(self, cftc_code: str, report_type: str, subtype: str) -> list[dict]:
        """
        Returns all weekly rows for a market, sorted newest → oldest.
        """
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            cur = conn.execute("""
                SELECT * FROM cot_data
                WHERE cftc_contract_code = ?
                  AND report_type = ?
                  AND subtype = ?
                ORDER BY report_date DESC
            """, (cftc_code, report_type, subtype))
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    def get_all_markets(self, report_type: str, subtype: str) -> list[dict]:
        """
        Returns list of distinct markets for a report_type/subtype:
        [{code, name, exchange_code, commodity_code}, ...]
        """
        conn = self._connect()
        try:
            cur = conn.execute("""
                SELECT cftc_contract_code AS code,
                       market_and_exchange AS name,
                       exchange_code,
                       cftc_commodity_code AS commodity_code
                FROM cot_data
                WHERE report_type = ? AND subtype = ?
                GROUP BY cftc_contract_code
                ORDER BY market_and_exchange
            """, (report_type, subtype))
            return [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]
        finally:
            conn.close()

    def get_latest_date(self, report_type: str = None, subtype: str = None) -> str | None:
        """Get the most recent report_date in the DB (optionally for a specific type)."""
        conn = self._connect()
        try:
            if report_type and subtype:
                cur = conn.execute(
                    "SELECT MAX(report_date) FROM cot_data WHERE report_type=? AND subtype=?",
                    (report_type, subtype))
            else:
                cur = conn.execute("SELECT MAX(report_date) FROM cot_data")
            row = cur.fetchone()
            return row[0] if row else None
        finally:
            conn.close()

    def get_db_stats(self, report_type: str = None, subtype: str = None) -> dict:
        """
        Returns summary statistics about the stored data.
        """
        conn = self._connect()
        try:
            where = ""
            params = []
            if report_type and subtype:
                where = "WHERE report_type=? AND subtype=?"
                params = [report_type, subtype]

            cur = conn.execute(f"""
                SELECT COUNT(*) AS total_records,
                       COUNT(DISTINCT cftc_contract_code) AS total_markets,
                       COUNT(DISTINCT report_date) AS total_weeks,
                       MIN(report_date) AS first_date,
                       MAX(report_date) AS last_date
                FROM cot_data {where}
            """, params)

            row = cur.fetchone()
            return {
                'total_records': row[0] or 0,
                'total_markets': row[1] or 0,
                'total_weeks': row[2] or 0,
                'first_date': row[3],
                'last_date': row[4],
            }
        finally:
            conn.close()

    def delete_report_data(self, report_type: str, subtype: str):
        """Delete all data for a specific report type/subtype (for re-download)."""
        conn = self._connect()
        try:
            conn.execute(
                "DELETE FROM cot_data WHERE report_type=? AND subtype=?",
                (report_type, subtype))
            conn.execute(
                "DELETE FROM download_log WHERE report_type=? AND subtype=?",
                (report_type, subtype))
            conn.commit()
            logger.info(f"Deleted all data for {report_type}/{subtype}")
        finally:
            conn.close()

    def delete_current_week(self, report_type: str, subtype: str, date: str):
        """Delete rows for a specific date (used before re-inserting current week)."""
        conn = self._connect()
        try:
            conn.execute(
                "DELETE FROM cot_data WHERE report_type=? AND subtype=? AND report_date=?",
                (report_type, subtype, date))
            conn.commit()
        finally:
            conn.close()
