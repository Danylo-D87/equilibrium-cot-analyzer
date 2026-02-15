"""
COT module — CSV/TXT parser.
==============================
Parses raw CFTC CSV text into normalized dicts matching the g1–g5 DB schema.
"""

import csv
import io
import logging
from datetime import datetime

from app.modules.cot.constants import COLUMN_MAPS, COLUMN_NAMES_MAP, DATE_COLUMN_MAP

logger = logging.getLogger(__name__)

# Maximum number of per-row parse errors to log individually
MAX_LOGGED_ERRORS = 5


class CotParser:
    """Parses CFTC CSV data into normalized row dicts."""

    def parse_yearly_csv(self, csv_text: str, report_type: str, subtype: str) -> list[dict]:
        """Parse CSV text from a yearly ZIP (has header row)."""
        reader = csv.DictReader(io.StringIO(csv_text))
        return self._parse_rows(reader, report_type, subtype)

    def parse_current_week(self, txt: str, report_type: str, subtype: str) -> list[dict]:
        """Parse current-week TXT file (NO header row)."""
        col_names = COLUMN_NAMES_MAP[report_type]
        rows: list[dict] = []

        reader = csv.reader(io.StringIO(txt.strip()))
        for values in reader:
            # Trim trailing empty values
            while values and values[-1].strip() == "":
                values.pop()

            if len(values) < len(col_names):
                values.extend([""] * (len(col_names) - len(values)))
            elif len(values) > len(col_names):
                values = values[: len(col_names)]

            row_dict = {}
            for i, name in enumerate(col_names):
                row_dict[name] = values[i].strip() if i < len(values) else ""
            rows.append(row_dict)

        return self._parse_rows(rows, report_type, subtype)

    # ------------------------------------------------------------------
    # Internal: normalize to g1-g5 schema
    # ------------------------------------------------------------------

    def _parse_rows(self, rows, report_type: str, subtype: str) -> list[dict]:
        column_map = COLUMN_MAPS[report_type]
        date_col = DATE_COLUMN_MAP[report_type]
        parsed: list[dict] = []
        errors = 0

        for raw_row in rows:
            try:
                if not isinstance(raw_row, dict):
                    continue

                date_val = raw_row.get(date_col, "").strip()
                if not date_val:
                    continue

                result: dict = {
                    "report_type": report_type,
                    "subtype": subtype,
                }

                for csv_col, db_col in column_map.items():
                    raw_val = raw_row.get(csv_col, "").strip().strip('"')
                    if db_col == "report_date":
                        result[db_col] = self._normalize_date(raw_val)
                    elif db_col in (
                        "market_and_exchange", "exchange_code",
                        "cftc_contract_code", "cftc_commodity_code",
                    ):
                        result[db_col] = raw_val
                    else:
                        result[db_col] = self._to_float(raw_val)

                if not result.get("report_date") or not result.get("cftc_contract_code"):
                    continue

                parsed.append(result)

            except Exception as e:
                errors += 1
                if errors <= MAX_LOGGED_ERRORS:
                    logger.warning("Row error (%s/%s): %s", report_type, subtype, e)

        if errors > MAX_LOGGED_ERRORS:
            logger.warning("... and %d more row errors", errors - MAX_LOGGED_ERRORS)

        logger.info("%s/%s: %d rows parsed, %d errors", report_type, subtype, len(parsed), errors)
        return parsed

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_date(s: str) -> str:
        """Normalize date to YYYY-MM-DD."""
        if not s:
            return ""
        if len(s) == 10 and s[4] == "-" and s[7] == "-":
            return s
        if len(s) == 6 and s.isdigit():
            try:
                return datetime.strptime(s, "%y%m%d").strftime("%Y-%m-%d")
            except ValueError:
                pass
        return s

    @staticmethod
    def _to_float(s: str) -> float | None:
        """Convert string to float; None for empty/invalid."""
        if not s or s == ".":
            return None
        try:
            return float(s.replace(",", ""))
        except (ValueError, TypeError):
            return None
