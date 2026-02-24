"""
Database schema migrations.
==============================
Simple version-based migration system for SQLite.
Each migration is a (version, sql) pair applied in order.

Usage::

    from app.core.migrations import run_migrations
    run_migrations(conn)  # called once at startup
"""

import logging
import sqlite3

logger = logging.getLogger(__name__)

# Each entry: (version_number, description, sql_statement)
# Add new migrations at the bottom with incrementing version numbers.
_MIGRATIONS: list[tuple[int, str, str]] = [
    (
        1,
        "Initial schema — cot_data + download_log + indexes",
        """
        CREATE TABLE IF NOT EXISTS cot_data (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type     TEXT NOT NULL,
            subtype         TEXT NOT NULL,
            report_date     TEXT NOT NULL,
            cftc_contract_code TEXT NOT NULL,
            market_and_exchange TEXT,
            exchange_code   TEXT,
            cftc_commodity_code TEXT,

            open_interest   REAL,
            oi_change       REAL,

            g1_long REAL, g1_short REAL, g1_spread REAL,
            g1_long_change REAL, g1_short_change REAL, g1_spread_change REAL,
            g1_pct_long REAL, g1_pct_short REAL, g1_pct_spread REAL,

            g2_long REAL, g2_short REAL, g2_spread REAL,
            g2_long_change REAL, g2_short_change REAL, g2_spread_change REAL,
            g2_pct_long REAL, g2_pct_short REAL, g2_pct_spread REAL,

            g3_long REAL, g3_short REAL, g3_spread REAL,
            g3_long_change REAL, g3_short_change REAL, g3_spread_change REAL,
            g3_pct_long REAL, g3_pct_short REAL, g3_pct_spread REAL,

            g4_long REAL, g4_short REAL, g4_spread REAL,
            g4_long_change REAL, g4_short_change REAL, g4_spread_change REAL,
            g4_pct_long REAL, g4_pct_short REAL, g4_pct_spread REAL,

            g5_long REAL, g5_short REAL, g5_spread REAL,
            g5_long_change REAL, g5_short_change REAL, g5_spread_change REAL,
            g5_pct_long REAL, g5_pct_short REAL, g5_pct_spread REAL,

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
        """,
    ),
    # ── Future migrations go here ──────────────────────────────
    (   
        2,
        "Add concentration ratio columns (top-4/top-8 gross %)",
        """
        ALTER TABLE cot_data ADD COLUMN conc_top4_long REAL;
        ALTER TABLE cot_data ADD COLUMN conc_top4_short REAL;
        ALTER TABLE cot_data ADD COLUMN conc_top8_long REAL;
        ALTER TABLE cot_data ADD COLUMN conc_top8_short REAL;
        """,
    ),
]


def _ensure_version_table(conn: sqlite3.Connection) -> None:
    """Create the schema_version table if it doesn't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_version (
            version     INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.commit()


def _get_current_version(conn: sqlite3.Connection) -> int:
    """Return the highest applied migration version, or 0 if none."""
    cur = conn.execute("SELECT MAX(version) FROM schema_version")
    row = cur.fetchone()
    return row[0] or 0 if row else 0


def run_migrations(conn: sqlite3.Connection) -> int:
    """
    Apply all pending migrations in order.

    Returns:
        Number of migrations applied.
    """
    _ensure_version_table(conn)
    current = _get_current_version(conn)
    applied = 0

    for ver, desc, sql in _MIGRATIONS:
        if ver <= current:
            continue
        logger.info("Applying migration %d: %s", ver, desc)
        conn.executescript(sql)
        conn.execute(
            "INSERT INTO schema_version (version, description) VALUES (?, ?)",
            (ver, desc),
        )
        conn.commit()
        applied += 1
        logger.info("Migration %d applied successfully", ver)

    if applied:
        logger.info("Migrations complete: %d applied (now at version %d)", applied, ver)
    else:
        logger.debug("Schema up to date (version %d)", current)

    return applied
