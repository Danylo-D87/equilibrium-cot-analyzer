#!/usr/bin/env python3
"""
COT Data Health Check.
Usage:
    python -m scripts.health_check
    python scripts/health_check.py
    python scripts/health_check.py --json
"""

import json
import sqlite3
import sys
from datetime import datetime, date
from pathlib import Path

# Ensure the project root (backend/) is on sys.path
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from app.core.config import settings
from app.modules.cot.config import cot_settings
from app.modules.cot.storage import CotStorage


class DataHealthChecker:
    """Checks COT data health: SQLite DB + exported JSON files."""

    def __init__(self, store: CotStorage | None = None):
        self.store = store or CotStorage()
        self.json_dir = Path(settings.json_output_dir)

    def check_health(self) -> dict:
        health: dict = {
            "timestamp": datetime.now().isoformat(),
            "db_path": str(settings.db_path),
            "json_dir": str(self.json_dir),
            "db_exists": False,
            "variants": {},
            "needs_update": False,
            "issues": [],
            "status": "unknown",
        }

        if not settings.db_path.exists():
            health["issues"].append("Database file does not exist")
            health["needs_update"] = True
            health["status"] = "error"
            return health

        health["db_exists"] = True

        for rt in cot_settings.report_types:
            for st in cot_settings.subtypes:
                key = f"{rt}_{st}"
                v = self._check_variant(rt, st)
                health["variants"][key] = v
                if v.get("issues"):
                    for issue in v["issues"]:
                        health["issues"].append(f"[{key}] {issue}")
                if v.get("needs_update"):
                    health["needs_update"] = True

        if not health["issues"]:
            health["status"] = "healthy"
        elif any(v.get("status") == "error" for v in health["variants"].values()):
            health["status"] = "error"
        elif health["needs_update"]:
            health["status"] = "stale"
        else:
            health["status"] = "healthy"

        return health

    def _check_variant(self, report_type: str, subtype: str) -> dict:
        v: dict = {
            "report_type": report_type,
            "subtype": subtype,
            "total_records": 0, "total_weeks": 0, "total_markets": 0,
            "first_date": None, "last_date": None, "days_old": None,
            "is_fresh": False,
            "years_present": [], "years_missing": [],
            "json_markets_file": False, "json_screener_file": False,
            "json_market_files_count": 0,
            "needs_update": False, "issues": [], "status": "unknown",
        }

        try:
            stats = self.store.get_db_stats(report_type, subtype)
        except sqlite3.Error as e:
            v["issues"].append(f"Cannot read database: {e}")
            v["needs_update"] = True
            v["status"] = "error"
            return v

        v.update({
            "total_records": stats["total_records"],
            "total_weeks": stats["total_weeks"],
            "total_markets": stats["total_markets"],
            "first_date": stats["first_date"],
            "last_date": stats["last_date"],
        })

        if stats["total_records"] == 0:
            v["issues"].append("No records in DB")
            v["needs_update"] = True
            v["status"] = "error"
            return v

        if stats["last_date"]:
            latest = datetime.strptime(stats["last_date"], "%Y-%m-%d").date()
            v["days_old"] = (date.today() - latest).days
            v["is_fresh"] = v["days_old"] <= settings.data_stale_days
            if not v["is_fresh"]:
                v["issues"].append(f"Data is {v['days_old']} days old")
                v["needs_update"] = True

        # Year coverage
        current_year = datetime.now().year
        for y in range(current_year - cot_settings.years_to_download + 1, current_year + 1):
            if self.store.is_year_downloaded(y, report_type, subtype):
                v["years_present"].append(y)
            else:
                v["years_missing"].append(y)

        if v["years_missing"]:
            v["issues"].append(f"Missing years: {v['years_missing']}")
            v["needs_update"] = True

        # JSON export checks
        v["json_markets_file"] = (self.json_dir / f"markets_{report_type}_{subtype}.json").exists()
        v["json_screener_file"] = (self.json_dir / f"screener_{report_type}_{subtype}.json").exists()
        if self.json_dir.exists():
            v["json_market_files_count"] = len(
                list(self.json_dir.glob(f"market_*_{report_type}_{subtype}.json"))
            )

        v["status"] = "healthy" if not v["issues"] else ("stale" if v["needs_update"] else "healthy")
        return v

    def print_report(self, health: dict) -> None:
        print()
        print("=" * 70)
        print("  COT DATA HEALTH CHECK")
        print("=" * 70)
        print()

        if not health["db_exists"]:
            print("  Database:    MISSING")
            print("  STATUS: ERROR")
            print("=" * 70)
            return

        icons = {"healthy": "✓", "stale": "⚠", "error": "✗"}
        for key, v in health["variants"].items():
            icon = icons.get(v["status"], "?")
            print(f"  [{icon}] {key}")
            print(f"      Records: {v['total_records']}  |  Markets: {v['total_markets']}  |  Weeks: {v['total_weeks']}")
            if v["first_date"]:
                print(f"      Range: {v['first_date']} — {v['last_date']}  ({v['days_old']}d old)")
            if v["years_missing"]:
                print(f"      Missing years: {v['years_missing']}")
            m = "OK" if v["json_markets_file"] else "NO"
            s = "OK" if v["json_screener_file"] else "NO"
            print(f"      JSON: markets={m}  screener={s}  details={v['json_market_files_count']}")
            for issue in v["issues"]:
                print(f"      • {issue}")
            print()

        if health["issues"]:
            print(f"  Total issues: {len(health['issues'])}")
        else:
            print("  No issues found.")

        status_map = {
            "healthy": "HEALTHY — no action needed",
            "stale": "STALE — update required",
            "error": "ERROR — critical issue",
        }
        print(f"\n  STATUS: {status_map.get(health['status'], health['status'])}")
        print("=" * 70)
        print()


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description="COT Data Health Check")
    ap.add_argument("--json", action="store_true", help="Output as JSON")
    args = ap.parse_args()

    checker = DataHealthChecker()
    health = checker.check_health()

    if args.json:
        print(json.dumps(health, indent=2, ensure_ascii=False))
    else:
        checker.print_report(health)

    if health["status"] == "error":
        return 2
    elif health["needs_update"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
