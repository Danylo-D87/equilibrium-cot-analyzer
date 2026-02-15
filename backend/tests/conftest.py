"""
Shared test fixtures.
"""

import pytest
from pathlib import Path


@pytest.fixture
def tmp_db(tmp_path: Path) -> Path:
    """Provide a temporary database path for tests."""
    return tmp_path / "test.db"


@pytest.fixture
def sample_cot_row() -> dict:
    """A minimal COT data row for testing."""
    return {
        "report_type": "legacy",
        "subtype": "fo",
        "report_date": "2025-01-10",
        "cftc_contract_code": "001602",
        "market_and_exchange": "WHEAT - CHICAGO BOARD OF TRADE",
        "exchange_code": "CBT",
        "cftc_commodity_code": "001602",
        "open_interest": 400000.0,
        "oi_change": 5000.0,
        "g1_long": 150000.0,
        "g1_short": 100000.0,
        "g1_spread": 20000.0,
        "g1_long_change": 2000.0,
        "g1_short_change": -1000.0,
        "g1_spread_change": 500.0,
        "g1_pct_long": 37.5,
        "g1_pct_short": 25.0,
        "g1_pct_spread": 5.0,
        "g2_long": 120000.0,
        "g2_short": 180000.0,
        "g2_long_change": -500.0,
        "g2_short_change": 3000.0,
        "g2_pct_long": 30.0,
        "g2_pct_short": 45.0,
        "g3_long": 50000.0,
        "g3_short": 40000.0,
        "g3_long_change": 100.0,
        "g3_short_change": -200.0,
        "g3_pct_long": 12.5,
        "g3_pct_short": 10.0,
    }
