"""
COT Multi-Report Pipeline — Parser
===================================
Parses CSV text (from yearly ZIP or current-week TXT) into normalized dicts
using the correct column mapping for each report type.
"""

import csv
import io
import logging

from config import (
    COLUMN_MAPS, COLUMN_NAMES_MAP, DATE_COLUMN_MAP,
)

logger = logging.getLogger('cot_pipeline.parser')


class Parser:
    """Parses CFTC CSV data into normalized row dicts."""

    def parse_yearly_csv(self, csv_text: str, report_type: str, subtype: str) -> list[dict]:
        """
        Parse CSV text from a yearly ZIP (has header row).
        Returns list of normalized dicts ready for storage.
        """
        reader = csv.DictReader(io.StringIO(csv_text))
        return self._parse_rows(reader, report_type, subtype)

    def parse_current_week(self, txt: str, report_type: str, subtype: str) -> list[dict]:
        """
        Parse current-week TXT file (NO header row).
        Column names are assigned from COLUMN_NAMES_MAP.
        """
        col_names = COLUMN_NAMES_MAP[report_type]

        rows = []
        for line in txt.strip().splitlines():
            # Split by comma; current-week files may have trailing comma
            values = line.split(',')

            # Trim trailing empty values
            while values and values[-1].strip() == '':
                values.pop()

            if len(values) < len(col_names):
                # Pad with empty strings if line is too short
                values.extend([''] * (len(col_names) - len(values)))
            elif len(values) > len(col_names):
                # Truncate if line has extra values
                values = values[:len(col_names)]

            row_dict = {}
            for i, name in enumerate(col_names):
                row_dict[name] = values[i].strip() if i < len(values) else ''
            rows.append(row_dict)

        return self._parse_rows(rows, report_type, subtype)

    def _parse_rows(self, rows, report_type: str, subtype: str) -> list[dict]:
        """
        Internal: normalize rows (list of dicts with CSV column names)
        to our generic g1-g5 schema dicts.
        """
        column_map = COLUMN_MAPS[report_type]
        date_col = DATE_COLUMN_MAP[report_type]
        parsed = []
        errors = 0

        for raw_row in rows:
            try:
                # raw_row can be a dict (from DictReader) or from manual parsing
                if isinstance(raw_row, dict):
                    row = raw_row
                else:
                    continue

                # Must have a date
                date_val = row.get(date_col, '').strip()
                if not date_val:
                    continue

                # Build normalized dict
                result = {
                    'report_type': report_type,
                    'subtype': subtype,
                }

                for csv_col, db_col in column_map.items():
                    raw_val = row.get(csv_col, '').strip()
                    if db_col == 'report_date':
                        result[db_col] = self._normalize_date(raw_val)
                    elif db_col in ('market_and_exchange', 'exchange_code',
                                     'cftc_contract_code', 'cftc_commodity_code'):
                        result[db_col] = raw_val
                    else:
                        result[db_col] = self._to_float(raw_val)

                # Skip rows without required fields
                if not result.get('report_date') or not result.get('cftc_contract_code'):
                    continue

                parsed.append(result)

            except Exception as e:
                errors += 1
                if errors <= 5:
                    logger.warning(f"[PARSE] Row error ({report_type}/{subtype}): {e}")

        if errors > 5:
            logger.warning(f"[PARSE] ... and {errors - 5} more row errors")

        logger.info(f"[PARSE] {report_type}/{subtype}: {len(parsed)} rows parsed, {errors} errors")
        return parsed

    @staticmethod
    def _normalize_date(s: str) -> str:
        """
        Normalize date to YYYY-MM-DD format.
        Handles: 'YYYY-MM-DD', 'YYMMDD'
        """
        if not s:
            return ''
        
        # Already in correct format
        if len(s) == 10 and s[4] == '-' and s[7] == '-':
            return s
        
        # Convert YYMMDD to YYYY-MM-DD
        if len(s) == 6 and s.isdigit():
            from datetime import datetime
            try:
                dt = datetime.strptime(s, '%y%m%d')
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                pass
        
        return s

    @staticmethod
    def _to_float(s: str):
        """Convert string to float, return None for empty/invalid."""
        if not s or s == '.':
            return None
        try:
            return float(s.replace(',', ''))
        except (ValueError, TypeError):
            return None
