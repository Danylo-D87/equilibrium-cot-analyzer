"""
COT module — SQLite data access layer.
========================================
All database operations for COT data live here.
"""

import sqlite3
import logging
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from app.core.config import settings
from app.core.database import get_connection, db_exists, managed_connection
from app.core.migrations import run_migrations

logger = logging.getLogger(__name__)


class CotStorage:
    """SQLite-backed storage for COT data, supporting multiple report types."""

    # Ordered columns for bulk insert
    _DATA_COLS = [
        "report_type", "subtype", "report_date", "cftc_contract_code",
        "market_and_exchange", "exchange_code", "cftc_commodity_code",
        "open_interest", "oi_change",
        "g1_long", "g1_short", "g1_spread",
        "g1_long_change", "g1_short_change", "g1_spread_change",
        "g1_pct_long", "g1_pct_short", "g1_pct_spread",
        "g2_long", "g2_short", "g2_spread",
        "g2_long_change", "g2_short_change", "g2_spread_change",
        "g2_pct_long", "g2_pct_short", "g2_pct_spread",
        "g3_long", "g3_short", "g3_spread",
        "g3_long_change", "g3_short_change", "g3_spread_change",
        "g3_pct_long", "g3_pct_short", "g3_pct_spread",
        "g4_long", "g4_short", "g4_spread",
        "g4_long_change", "g4_short_change", "g4_spread_change",
        "g4_pct_long", "g4_pct_short", "g4_pct_spread",
        "g5_long", "g5_short", "g5_spread",
        "g5_long_change", "g5_short_change", "g5_spread_change",
        "g5_pct_long", "g5_pct_short", "g5_pct_spread",
        "total_rept_long", "total_rept_short",
    ]

    # Columns actually used by CotCalculator (avoids SELECT *)
    _QUERY_COLS = [
        "report_date", "cftc_contract_code", "market_and_exchange", "exchange_code",
        "cftc_commodity_code", "open_interest", "oi_change",
        "g1_long", "g1_short", "g1_spread", "g1_long_change", "g1_short_change",
        "g2_long", "g2_short", "g2_spread", "g2_long_change", "g2_short_change",
        "g3_long", "g3_short", "g3_spread", "g3_long_change", "g3_short_change",
        "g4_long", "g4_short", "g4_spread", "g4_long_change", "g4_short_change",
        "g5_long", "g5_short", "g5_spread", "g5_long_change", "g5_short_change",
    ]

    _QUERY_COLS_SQL = ", ".join(_QUERY_COLS)

    def __init__(
        self,
        db_path: str | Path | None = None,
        conn: sqlite3.Connection | None = None,
    ):
        self.db_path = str(db_path or settings.db_path)
        self._external_conn = conn
        self._ensure_tables()

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------

    @contextmanager
    def _conn(self):
        """
        Context manager that yields a connection.

        If an external (managed) connection was injected via the constructor,
        it is reused and **not** closed here.  Otherwise falls back to
        the thread-local ``managed_connection`` which opens/closes as needed.
        """
        if self._external_conn is not None:
            yield self._external_conn
            return

        with managed_connection(self.db_path) as conn:
            yield conn

    def db_exists(self) -> bool:
        return db_exists(self.db_path)

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------

    def _ensure_tables(self) -> None:
        """Run pending migrations to ensure schema is up to date."""
        with self._conn() as conn:
            run_migrations(conn)

    # ------------------------------------------------------------------
    # Insert / upsert
    # ------------------------------------------------------------------

    def upsert_rows(self, rows: list[dict]) -> int:
        """Insert rows (list of dicts). On conflict, replace."""
        if not rows:
            return 0

        cols_str = ", ".join(self._DATA_COLS)
        placeholders = ", ".join(["?"] * len(self._DATA_COLS))
        sql = f"INSERT OR REPLACE INTO cot_data ({cols_str}) VALUES ({placeholders})"

        with self._conn() as conn:
            values = [tuple(row.get(c) for c in self._DATA_COLS) for row in rows]
            conn.executemany(sql, values)
            conn.commit()
            logger.debug("Upserted %d rows", len(values))
            return len(values)

    # ------------------------------------------------------------------
    # Download log
    # ------------------------------------------------------------------

    def is_year_downloaded(self, year: int, report_type: str, subtype: str) -> bool:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT 1 FROM download_log WHERE year=? AND report_type=? AND subtype=?",
                (year, report_type, subtype),
            )
            return cur.fetchone() is not None

    def log_download(self, report_type: str, subtype: str, year: int, rows_count: int) -> None:
        with self._conn() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO download_log
                   (report_type, subtype, year, downloaded, rows_count)
                   VALUES (?, ?, ?, ?, ?)""",
                (report_type, subtype, year, datetime.now().isoformat(), rows_count),
            )
            conn.commit()

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    def get_market_data(self, cftc_code: str, report_type: str, subtype: str) -> list[dict]:
        """All weekly rows for a market, sorted newest → oldest."""
        with self._conn() as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.execute(
                f"""SELECT {self._QUERY_COLS_SQL} FROM cot_data
                   WHERE cftc_contract_code = ? AND report_type = ? AND subtype = ?
                   ORDER BY report_date DESC""",
                (cftc_code, report_type, subtype),
            )
            return [dict(r) for r in cur.fetchall()]

    def get_all_market_data_bulk(self, report_type: str, subtype: str) -> dict[str, list[dict]]:
        """All rows for a variant, grouped by market code (for screener)."""
        with self._conn() as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.execute(
                f"""SELECT {self._QUERY_COLS_SQL} FROM cot_data
                   WHERE report_type = ? AND subtype = ?
                   ORDER BY cftc_contract_code, report_date DESC""",
                (report_type, subtype),
            )
            result: dict[str, list[dict]] = {}
            for row in cur:
                d = dict(row)
                code = d["cftc_contract_code"]
                result.setdefault(code, []).append(d)
            return result

    def get_all_markets(self, report_type: str, subtype: str) -> list[dict]:
        """Distinct markets for a report variant."""
        with self._conn() as conn:
            cur = conn.execute(
                """SELECT cftc_contract_code AS code,
                          market_and_exchange AS name,
                          exchange_code,
                          cftc_commodity_code AS commodity_code
                   FROM cot_data
                   WHERE report_type = ? AND subtype = ?
                   GROUP BY cftc_contract_code
                   ORDER BY market_and_exchange""",
                (report_type, subtype),
            )
            return [dict(zip([d[0] for d in cur.description], row)) for row in cur.fetchall()]

    def get_latest_date(self, report_type: str | None = None, subtype: str | None = None) -> str | None:
        with self._conn() as conn:
            if report_type and subtype:
                cur = conn.execute(
                    "SELECT MAX(report_date) FROM cot_data WHERE report_type=? AND subtype=?",
                    (report_type, subtype),
                )
            else:
                cur = conn.execute("SELECT MAX(report_date) FROM cot_data")
            row = cur.fetchone()
            return row[0] if row else None

    def get_db_stats(self, report_type: str | None = None, subtype: str | None = None) -> dict:
        _STATS_SQL = """SELECT COUNT(*) AS total_records,
                               COUNT(DISTINCT cftc_contract_code) AS total_markets,
                               COUNT(DISTINCT report_date) AS total_weeks,
                               MIN(report_date) AS first_date,
                               MAX(report_date) AS last_date
                        FROM cot_data"""
        with self._conn() as conn:
            if report_type and subtype:
                cur = conn.execute(
                    _STATS_SQL + " WHERE report_type=? AND subtype=?",
                    [report_type, subtype],
                )
            else:
                cur = conn.execute(_STATS_SQL)
            row = cur.fetchone()
            return {
                "total_records": row[0] or 0,
                "total_markets": row[1] or 0,
                "total_weeks": row[2] or 0,
                "first_date": row[3],
                "last_date": row[4],
            }

    def delete_report_data(self, report_type: str, subtype: str) -> None:
        with self._conn() as conn:
            conn.execute(
                "DELETE FROM cot_data WHERE report_type=? AND subtype=?",
                (report_type, subtype),
            )
            conn.execute(
                "DELETE FROM download_log WHERE report_type=? AND subtype=?",
                (report_type, subtype),
            )
            conn.commit()
            logger.info("Deleted all data for %s/%s", report_type, subtype)

    def delete_current_week(self, report_type: str, subtype: str, date: str) -> None:
        with self._conn() as conn:
            conn.execute(
                "DELETE FROM cot_data WHERE report_type=? AND subtype=? AND report_date=?",
                (report_type, subtype, date),
            )
            conn.commit()
