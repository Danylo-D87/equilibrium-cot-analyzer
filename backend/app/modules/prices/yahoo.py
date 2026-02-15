"""
Prices module — Yahoo Finance downloader.
============================================
Downloads daily OHLCV data from Yahoo Finance.
"""

import logging
import time as _time
from datetime import datetime, timedelta

import yfinance as yf

from app.modules.prices.config import price_settings

logger = logging.getLogger(__name__)

PRICE_DOWNLOAD_BUFFER_DAYS = 30  # Extra days to ensure full year coverage
PRICE_DECIMAL_PLACES = 4
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # seconds — doubles on each retry


class YahooDownloader:
    """Downloads daily price data from Yahoo Finance."""

    def download(self, ticker_symbol: str, years: int | None = None) -> list[dict]:
        """
        Download daily OHLCV bars for a ticker with retry + backoff.

        Returns:
            List of dicts: [{date, open, high, low, close, volume}, ...]
            Sorted oldest-first. Empty list on failure.
        """
        yrs = years or price_settings.price_years

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                end_date = datetime.now()
                start_date = end_date - timedelta(days=yrs * 365 + PRICE_DOWNLOAD_BUFFER_DAYS)

                ticker = yf.Ticker(ticker_symbol)
                df = ticker.history(
                    start=start_date.strftime("%Y-%m-%d"),
                    end=end_date.strftime("%Y-%m-%d"),
                    interval="1d",
                    auto_adjust=True,
                )

                if df.empty:
                    logger.warning("No data for %s", ticker_symbol)
                    return []

                # Vectorized conversion — much faster than iterrows()
                df = df.copy()
                df.index = df.index.strftime("%Y-%m-%d")
                for col in ("Open", "High", "Low", "Close"):
                    df[col] = df[col].round(PRICE_DECIMAL_PLACES)
                df["Volume"] = df["Volume"].fillna(0).astype(int)

                bars: list[dict] = [
                    {
                        "date": row.Index,
                        "open": float(row.Open),
                        "high": float(row.High),
                        "low": float(row.Low),
                        "close": float(row.Close),
                        "volume": int(row.Volume),
                    }
                    for row in df.itertuples()
                ]

                logger.info("%s: %d daily bars", ticker_symbol, len(bars))
                return bars

            except (OSError, ValueError, KeyError, RuntimeError) as e:
                if attempt < MAX_RETRIES:
                    wait = RETRY_BACKOFF_BASE ** attempt
                    logger.warning("Attempt %d/%d failed for %s: %s — retrying in %ds", attempt, MAX_RETRIES, ticker_symbol, e, wait)
                    _time.sleep(wait)
                else:
                    logger.warning("All %d attempts failed for %s: %s", MAX_RETRIES, ticker_symbol, e)

        return []
