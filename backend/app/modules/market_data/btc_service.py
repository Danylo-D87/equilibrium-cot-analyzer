"""
BTC Data Service — shared module for fetching & caching Bitcoin price data.
============================================================================
Adapted from Fundamental/backend/btc_data_service.py.
Uses ccxt (Binance) with file-based caching.
User-timezone-aware via pytz.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import pytz

from app.core.config import settings

logger = logging.getLogger(__name__)

KYIV_TZ = pytz.timezone("Europe/Kiev")


def _get_today_kyiv() -> date:
    return datetime.now(KYIV_TZ).date()


class BTCDataService:
    """
    BTC-USDT price data with file caching.
    Fetches from Binance via ccxt; falls back to simulation if API fails.
    """

    def __init__(self, cache_file: str | Path | None = None):
        self.cache_file = Path(cache_file) if cache_file else settings.base_dir / "data" / "btc_cache.csv"

    def _get_exchange(self):
        """Lazy ccxt exchange init (avoid import cost at module level)."""
        import ccxt
        return ccxt.binance({
            "enableRateLimit": True,
            "options": {"defaultType": "spot"},
        })

    # ── Public API ──

    def get_btc_data(self, start_date: date, end_date: date | None = None) -> pd.DataFrame:
        """
        Return DataFrame with columns [date, price] for the given range.
        Loads from cache; fetches missing ranges from API.
        """
        if end_date is None:
            end_date = _get_today_kyiv()

        cached = self._load_cache()
        needs_update, miss_start, miss_end = self._check_coverage(cached, start_date, end_date)

        if needs_update and miss_start and miss_end:
            new_data = self._fetch_from_api(miss_start, miss_end)
            if cached is not None and not cached.empty:
                if not new_data.empty:
                    cached = pd.concat([cached, new_data], ignore_index=True)
                    cached = cached.drop_duplicates(subset=["date"]).sort_values("date")
            else:
                cached = new_data
            if cached is not None and not cached.empty:
                self._save_cache(cached)

        if cached is None or cached.empty:
            return pd.DataFrame(columns=["date", "price"])

        mask = (cached["date"].dt.date >= start_date) & (cached["date"].dt.date <= end_date)
        return cached[mask].copy().reset_index(drop=True)

    def force_refresh(self, check_dates: tuple[date, date] | None = None) -> None:
        """Force-refresh cache to today, optionally extending coverage."""
        cached = self._load_cache()
        today = _get_today_kyiv()

        ranges: list[tuple[date, date]] = []

        if cached is not None and not cached.empty:
            cached_start = cached["date"].min().date()
            cached_end = cached["date"].max().date()

            if cached_end < today - timedelta(days=1):
                ranges.append((cached_end + timedelta(days=1), today))

            if check_dates:
                req_start, req_end = check_dates
                if req_start < cached_start:
                    ranges.append((req_start, cached_start - timedelta(days=1)))

            for s, e in ranges:
                new = self._fetch_from_api(s, e)
                if not new.empty:
                    cached = pd.concat([cached, new], ignore_index=True)

            if ranges:
                cached = cached.drop_duplicates(subset=["date"]).sort_values("date")
                self._save_cache(cached)
        else:
            start = today - timedelta(days=365)
            end = today
            if check_dates:
                start = min(check_dates[0], start)
                end = max(check_dates[1], end)
            data = self._fetch_from_api(start, end)
            if not data.empty:
                self._save_cache(data)

    # ── Cache I/O ──

    def _load_cache(self) -> pd.DataFrame | None:
        if not self.cache_file.exists():
            return None
        try:
            df = pd.read_csv(self.cache_file)
            df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_convert(KYIV_TZ)
            return df
        except Exception as e:
            logger.warning("Failed to load BTC cache: %s", e)
            return None

    def _save_cache(self, data: pd.DataFrame) -> None:
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            data.to_csv(self.cache_file, index=False)
        except Exception as e:
            logger.warning("Failed to save BTC cache: %s", e)

    def _check_coverage(
        self,
        cached: pd.DataFrame | None,
        start_date: date,
        end_date: date,
    ) -> tuple[bool, date | None, date | None]:
        if cached is None or cached.empty:
            return True, start_date, end_date

        cached_start = cached["date"].min().date()
        cached_end = cached["date"].max().date()
        today = _get_today_kyiv()

        if cached_end < today - timedelta(days=1):
            return True, cached_end + timedelta(days=1), today
        if start_date < cached_start:
            return True, start_date, cached_start - timedelta(days=1)
        if end_date > cached_end:
            return True, cached_end + timedelta(days=1), end_date
        return False, None, None

    # ── API fetch ──

    def _fetch_from_api(self, start_date: date, end_date: date) -> pd.DataFrame:
        try:
            exchange = self._get_exchange()
            since = int(datetime.combine(start_date, datetime.min.time()).timestamp() * 1000)
            end_ts = int(datetime.combine(end_date, datetime.min.time()).timestamp() * 1000)

            all_candles = []
            current = since
            logger.info("Fetching BTC data: %s → %s", start_date, end_date)

            while current < end_ts:
                candles = exchange.fetch_ohlcv("BTC/USDT", "1d", since=current, limit=1000)
                if not candles:
                    break
                all_candles.extend(candles)
                current = candles[-1][0] + 86_400_000
                if len(candles) < 1000:
                    break

            if not all_candles:
                return pd.DataFrame(columns=["date", "price"])

            df = pd.DataFrame(all_candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
            df["date"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True).dt.tz_convert(KYIV_TZ)
            df["price"] = df["close"]
            df = df[df["date"].dt.date <= end_date]
            logger.info("Fetched %d days of BTC data", len(df))
            return df[["date", "price"]].copy()

        except Exception as e:
            logger.error("BTC API fetch error: %s", e)
            return self._fallback(start_date, end_date)

    def _fallback(self, start_date: date, end_date: date) -> pd.DataFrame:
        logger.warning("Using fallback simulated BTC data")
        dates = pd.date_range(start=start_date, end=end_date, freq="D", tz=KYIV_TZ)
        np.random.seed(42)
        returns = np.random.normal(0.001, 0.03, len(dates))
        prices = 40000 * np.cumprod(1 + returns)
        return pd.DataFrame({"date": dates, "price": prices})
