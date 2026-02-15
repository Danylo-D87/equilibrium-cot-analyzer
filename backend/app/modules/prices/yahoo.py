"""
Prices module — Yahoo Finance downloader.
============================================
Downloads daily OHLCV data from Yahoo Finance.
"""

import logging
from datetime import datetime, timedelta

import yfinance as yf

from app.modules.prices.config import price_settings

logger = logging.getLogger(__name__)


class YahooDownloader:
    """Downloads daily price data from Yahoo Finance."""

    def download(self, ticker_symbol: str, years: int | None = None) -> list[dict]:
        """
        Download daily OHLCV bars for a ticker.

        Returns:
            List of dicts: [{date, open, high, low, close, volume}, ...]
            Sorted oldest-first. Empty list on failure.
        """
        yrs = years or price_settings.price_years

        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=yrs * 365 + 30)

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
                df[col] = df[col].round(4)
            df["Volume"] = df["Volume"].fillna(0).astype(int)

            bars: list[dict] = [
                {
                    "date": idx,
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"]),
                }
                for idx, row in zip(df.index, df.itertuples())
            ]

            logger.info("%s: %d daily bars", ticker_symbol, len(bars))
            return bars

        except Exception as e:
            logger.warning("Failed %s: %s", ticker_symbol, e)
            return []
