"""
COT Data Health Check
=====================
Checks SQLite DB + exported JSON state for all report_type/subtype variants.

Usage:
  python data_health_check.py          # Full health report
  python data_health_check.py --json   # Output as JSON (for monitoring)

Exit codes: 0 = healthy, 1 = needs update, 2 = critical error
"""

import json
import os
import sys
from datetime import datetime, date
from pathlib import Path
from typing import Dict

from config import BASE_DIR, DB_PATH, JSON_OUTPUT_DIR, DATA_STALE_DAYS, YEARS_TO_DOWNLOAD, REPORT_TYPES, SUBTYPES
from storage import DataStore


class DataHealthChecker:
    """Checks COT data health: SQLite DB + exported JSON files."""

    def __init__(self, store: DataStore = None):
        self.store = store or DataStore()
        self.json_dir = Path(JSON_OUTPUT_DIR)

    def check_health(self) -> Dict:
        """
        Full health check across all report_type/subtype combos.
        Returns dict with all status fields — can be serialized to JSON.
        """
        health = {
            'timestamp': datetime.now().isoformat(),
            'db_path': str(DB_PATH),
            'json_dir': str(self.json_dir),

            # Database checks
            'db_exists': False,

            # Per-variant stats
            'variants': {},

            # Overall
            'needs_update': False,
            'issues': [],
            'status': 'unknown',  # 'healthy', 'stale', 'error'
        }

        # --- 1. Database existence ---
        if not os.path.exists(str(DB_PATH)):
            health['issues'].append('Database file does not exist')
            health['needs_update'] = True
            health['status'] = 'error'
            return health

        health['db_exists'] = True

        # --- 2. Check each report_type/subtype ---
        for rt in REPORT_TYPES:
            for st in SUBTYPES:
                variant_key = f'{rt}_{st}'
                v = self._check_variant(rt, st)
                health['variants'][variant_key] = v

                if v.get('issues'):
                    for issue in v['issues']:
                        health['issues'].append(f'[{variant_key}] {issue}')
                if v.get('needs_update'):
                    health['needs_update'] = True

        # --- 3. Final verdict ---
        if not health['issues']:
            health['status'] = 'healthy'
        elif any(v.get('status') == 'error' for v in health['variants'].values()):
            health['status'] = 'error'
        elif health['needs_update']:
            health['status'] = 'stale'
        else:
            health['status'] = 'healthy'

        return health

    def _check_variant(self, report_type: str, subtype: str) -> Dict:
        """Check health for a single report_type/subtype variant."""
        v = {
            'report_type': report_type,
            'subtype': subtype,
            'total_records': 0,
            'total_weeks': 0,
            'total_markets': 0,
            'first_date': None,
            'last_date': None,
            'days_old': None,
            'is_fresh': False,
            'years_required': [],
            'years_present': [],
            'years_missing': [],
            'json_markets_file': False,
            'json_screener_file': False,
            'json_market_files_count': 0,
            'needs_update': False,
            'issues': [],
            'status': 'unknown',
        }

        # DB stats for this variant
        try:
            stats = self.store.get_db_stats(report_type, subtype)
        except Exception as e:
            v['issues'].append(f'Cannot read database: {e}')
            v['needs_update'] = True
            v['status'] = 'error'
            return v

        v['total_records'] = stats['total_records']
        v['total_weeks'] = stats['total_weeks']
        v['total_markets'] = stats['total_markets']
        v['first_date'] = stats['first_date']
        v['last_date'] = stats['last_date']

        if stats['total_records'] == 0:
            v['issues'].append('No records in DB')
            v['needs_update'] = True
            v['status'] = 'error'
            return v

        # Data freshness
        if stats['last_date']:
            latest = datetime.strptime(stats['last_date'], '%Y-%m-%d').date()
            v['days_old'] = (date.today() - latest).days
            v['is_fresh'] = v['days_old'] <= DATA_STALE_DAYS
            if not v['is_fresh']:
                v['issues'].append(f"Data is {v['days_old']} days old")
                v['needs_update'] = True

        # Year coverage
        current_year = datetime.now().year
        required = list(range(current_year - YEARS_TO_DOWNLOAD + 1, current_year + 1))
        v['years_required'] = required

        for y in required:
            if self.store.is_year_downloaded(y, report_type, subtype):
                v['years_present'].append(y)
            else:
                v['years_missing'].append(y)

        if v['years_missing']:
            v['issues'].append(f"Missing years: {v['years_missing']}")
            v['needs_update'] = True

        # JSON export checks
        markets_json = self.json_dir / f'markets_{report_type}_{subtype}.json'
        screener_json = self.json_dir / f'screener_{report_type}_{subtype}.json'

        v['json_markets_file'] = markets_json.exists()
        v['json_screener_file'] = screener_json.exists()

        if self.json_dir.exists():
            pattern = f'market_*_{report_type}_{subtype}.json'
            v['json_market_files_count'] = len(list(self.json_dir.glob(pattern)))

        if not v['json_markets_file']:
            v['issues'].append(f'markets_{report_type}_{subtype}.json missing')
        if not v['json_screener_file']:
            v['issues'].append(f'screener_{report_type}_{subtype}.json missing')

        # Final verdict for this variant
        if not v['issues']:
            v['status'] = 'healthy'
        elif v['needs_update']:
            v['status'] = 'stale'
        else:
            v['status'] = 'healthy'

        return v

    def print_report(self, health: Dict):
        """Pretty-print health report to stdout."""
        print()
        print("=" * 70)
        print("  COT DATA HEALTH CHECK")
        print("=" * 70)
        print()

        if not health['db_exists']:
            print("  Database:    MISSING")
            print()
            print("  STATUS: ERROR — database does not exist")
            print()
            print("=" * 70)
            return

        for variant_key, v in health['variants'].items():
            status_icon = {'healthy': '✓', 'stale': '⚠', 'error': '✗'}.get(v['status'], '?')
            print(f"  [{status_icon}] {variant_key}")
            print(f"      Records:  {v['total_records']}  |  Markets: {v['total_markets']}  |  Weeks: {v['total_weeks']}")
            if v['first_date']:
                print(f"      Range:    {v['first_date']} — {v['last_date']}  ({v['days_old']}d old)")
            if v['years_missing']:
                print(f"      Missing:  years {v['years_missing']}")
            print(f"      JSON:     markets={'OK' if v['json_markets_file'] else 'NO'}  screener={'OK' if v['json_screener_file'] else 'NO'}  details={v['json_market_files_count']}")
            if v['issues']:
                for issue in v['issues']:
                    print(f"      • {issue}")
            print()

        # Overall
        if health['issues']:
            print(f"  Total issues: {len(health['issues'])}")
        else:
            print("  No issues found.")
        print()

        status_map = {
            'healthy': 'HEALTHY — no action needed',
            'stale': 'STALE — update required',
            'error': 'ERROR — critical issue',
        }
        print(f"  STATUS: {status_map.get(health['status'], health['status'])}")
        print()
        print("=" * 70)
        print()


def main():
    import argparse
    ap = argparse.ArgumentParser(description='COT Data Health Check')
    ap.add_argument('--json', action='store_true', help='Output as JSON (for monitoring)')
    args = ap.parse_args()

    checker = DataHealthChecker()
    health = checker.check_health()

    if args.json:
        print(json.dumps(health, indent=2, ensure_ascii=False))
    else:
        checker.print_report(health)

    if health['status'] == 'error':
        return 2
    elif health['needs_update']:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
