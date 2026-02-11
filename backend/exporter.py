"""
COT Multi-Report Pipeline — Exporter
=====================================
Exports calculated data to JSON files for the frontend.
Each market gets its own JSON file, plus markets.json (list)
and screener.json (one row per market for the screener view).

JSON output per report_type/subtype includes group metadata
so the frontend knows how to render columns dynamically.
"""

import json
import logging
import os
from pathlib import Path

from config import (
    JSON_OUTPUT_DIR, REPORT_GROUPS, REPORT_TYPES, SUBTYPES,
    REPORT_DISPLAY_NAMES, SUBTYPE_DISPLAY_NAMES,
    MARKET_CATEGORIES,
)
from storage import DataStore
from calculator import Calculator
from price_downloader import PriceDownloader

logger = logging.getLogger('cot_pipeline.exporter')


def _categorize_market(name: str) -> tuple[str, str]:
    """Determine category key and display name from market name."""
    upper = name.upper()
    for cat_key, cat_info in MARKET_CATEGORIES.items():
        for kw in cat_info['keywords']:
            if kw in upper:
                return cat_key, cat_info['display']
    return 'other', 'Other'


class Exporter:
    """Exports COT data from SQLite to JSON files for the frontend."""

    def __init__(self, store: DataStore = None, download_prices: bool = True):
        self.store = store or DataStore()
        self.calc = Calculator()
        self.price_dl = PriceDownloader() if download_prices else None
        self.output_dir = Path(JSON_OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_all(self, report_type: str, subtype: str, price_data: dict = None):
        """
        Export all markets for a single report_type/subtype.
        Creates:
          - data/markets_{report_type}_{subtype}.json   (market list)
          - data/screener_{report_type}_{subtype}.json  (screener rows)
          - data/market_{code}_{report_type}_{subtype}.json (per-market detail)
        """
        groups = REPORT_GROUPS[report_type]
        markets = self.store.get_all_markets(report_type, subtype)

        if not markets:
            logger.warning(f"[EXPORT] No markets found for {report_type}/{subtype}")
            return

        logger.info(f"[EXPORT] Exporting {len(markets)} markets for {report_type}/{subtype}...")

        # Download prices if needed (shared across report types)
        if price_data is None and self.price_dl:
            codes = [m['code'] for m in markets]
            price_data = self.price_dl.download_all(codes)
        elif price_data is None:
            price_data = {}

        market_list = []
        screener_rows = []

        for i, mkt in enumerate(markets, 1):
            code = mkt['code']
            name = mkt['name'] or code
            cat_key, cat_display = _categorize_market(name)

            # Get raw weekly data from DB
            raw_rows = self.store.get_market_data(code, report_type, subtype)
            if not raw_rows:
                continue

            # Calculate derived analytics
            computed = self.calc.compute(raw_rows, report_type)
            weeks = computed['weeks']
            stats = computed['stats']

            if not weeks:
                continue

            # Build market metadata
            market_meta = {
                'code': code,
                'name': name,
                'exchange': mkt.get('exchange_code', ''),
                'category': cat_key,
                'category_display': cat_display,
                'report_type': report_type,
                'report_type_display': REPORT_DISPLAY_NAMES[report_type],
                'subtype': subtype,
                'subtype_display': SUBTYPE_DISPLAY_NAMES[subtype],
            }

            market_list.append(market_meta.copy())

            # Build per-market JSON payload
            payload = {
                'market': market_meta,
                'groups': groups,
                'weeks': weeks,
                'stats': stats,
            }

            # Add price data if available
            prices = price_data.get(code, [])
            if prices:
                payload['prices'] = prices

            # Write per-market JSON
            fname = f"market_{code}_{report_type}_{subtype}.json"
            self._write_json(fname, payload)

            # Build screener row (latest week data)
            latest = weeks[0] if weeks else {}
            screener_row = {
                'code': code,
                'name': name,
                'exchange_code': mkt.get('exchange_code', ''),
                'category': cat_key,
                'category_display': cat_display,
                'date': latest.get('date'),
                'open_interest': latest.get('open_interest'),
                'oi_change': latest.get('oi_change'),
            }

            # Add per-group screener fields
            for g in groups:
                gk = g['key']
                screener_row[f'{gk}_net'] = latest.get(f'{gk}_net')
                screener_row[f'{gk}_change'] = latest.get(f'{gk}_change')
                screener_row[f'{gk}_pct_oi'] = latest.get(f'{gk}_pct_net_oi')
                screener_row[f'cot_{gk}_1y'] = latest.get(f'cot_index_{gk}_1y')
                screener_row[f'crowded_{gk}'] = latest.get(f'crowded_{gk}', {}).get('value')
                screener_row[f'signal_{gk}'] = latest.get(f'crowded_{gk}', {}).get('signal')

            # Aggregate signals for the screener
            signals = []
            for g in groups:
                gk = g['key']
                sig = latest.get(f'crowded_{gk}', {}).get('signal')
                if sig:
                    signals.append({'group': g['short'], 'signal': sig})
            screener_row['signals'] = signals

            screener_rows.append(screener_row)

            if i % 20 == 0:
                logger.info(f"[EXPORT] {i}/{len(markets)} done...")

        # Write market list
        self._write_json(f"markets_{report_type}_{subtype}.json", market_list)

        # Write screener
        self._write_json(f"screener_{report_type}_{subtype}.json", screener_rows)

        # Also write group definitions for the frontend
        self._write_json(f"groups_{report_type}.json", groups)

        logger.info(f"[EXPORT] Done: {len(market_list)} markets, "
                     f"{len(screener_rows)} screener rows for {report_type}/{subtype}")

    def _write_json(self, filename: str, data):
        path = self.output_dir / filename
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        logger.debug(f"[EXPORT] Wrote {path}")
