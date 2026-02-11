"""
COT Legacy Report — Price Downloader
Downloads daily OHLCV data from Yahoo Finance for markets that have a ticker mapping.
Uses yfinance library.
"""

import logging
from datetime import datetime, timedelta

import yfinance as yf

from config import TICKER_MAP, PRICE_YEARS

logger = logging.getLogger('cot_pipeline.price_downloader')


class PriceDownloader:
    """Downloads and formats daily price data from Yahoo Finance."""

    def __init__(self):
        self.ticker_map = TICKER_MAP

    def has_ticker(self, cftc_code: str) -> bool:
        """Check if a market has a Yahoo Finance ticker mapping."""
        return cftc_code in self.ticker_map

    def download_prices(self, cftc_code: str) -> list[dict]:
        """
        Download daily OHLCV for a given CFTC market code.
        Returns list of dicts: [{date, open, high, low, close, volume}, ...]
        Sorted oldest-first.
        Returns empty list if no ticker or download fails.
        """
        ticker_symbol = self.ticker_map.get(cftc_code)
        if not ticker_symbol:
            return []

        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=PRICE_YEARS * 365 + 30)

            ticker = yf.Ticker(ticker_symbol)
            df = ticker.history(
                start=start_date.strftime('%Y-%m-%d'),
                end=end_date.strftime('%Y-%m-%d'),
                interval='1d',
                auto_adjust=True,
            )

            if df.empty:
                logger.warning(f"[PRICE] No data for {cftc_code} ({ticker_symbol})")
                return []

            bars = []
            for idx, row in df.iterrows():
                dt = idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx)[:10]
                bars.append({
                    'date': dt,
                    'open': round(float(row['Open']), 4),
                    'high': round(float(row['High']), 4),
                    'low': round(float(row['Low']), 4),
                    'close': round(float(row['Close']), 4),
                    'volume': int(row['Volume']) if row['Volume'] else 0,
                })

            logger.info(f"[PRICE] {cftc_code} ({ticker_symbol}): {len(bars)} daily bars")
            return bars

        except Exception as e:
            logger.warning(f"[PRICE] Failed {cftc_code} ({ticker_symbol}): {e}")
            return []

    def download_all(self, cftc_codes: list[str]) -> dict[str, list[dict]]:
        """
        Download prices for multiple markets.
        Returns dict: {cftc_code: [bars...], ...}
        Only includes markets that have tickers and returned data.
        """
        results = {}
        eligible = [c for c in cftc_codes if self.has_ticker(c)]

        logger.info(f"[PRICE] Downloading prices for {len(eligible)}/{len(cftc_codes)} markets...")

        for i, code in enumerate(eligible, 1):
            ticker = self.ticker_map[code]
            logger.info(f"[PRICE] [{i}/{len(eligible)}] {code} -> {ticker}")
            bars = self.download_prices(code)
            if bars:
                results[code] = bars

        logger.info(f"[PRICE] Done: {len(results)}/{len(eligible)} markets got price data")
        return results
