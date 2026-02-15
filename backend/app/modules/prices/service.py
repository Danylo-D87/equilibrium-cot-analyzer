"""
Prices module — Service layer.
================================
High-level price data service that maps CFTC codes to tickers
and delegates to the appropriate downloader.
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.modules.prices.config import price_settings
from app.modules.prices.yahoo import YahooDownloader

logger = logging.getLogger(__name__)


class PriceService:
    """Fetches price data for CFTC market codes via Yahoo Finance."""

    def __init__(self) -> None:
        self._ticker_map = price_settings.ticker_map
        self._downloader = YahooDownloader()

    def has_ticker(self, cftc_code: str) -> bool:
        """Check if a market has a price ticker mapping."""
        return cftc_code in self._ticker_map

    def download_prices(self, cftc_code: str) -> list[dict]:
        """Download daily OHLCV for a CFTC market code."""
        ticker_symbol = self._ticker_map.get(cftc_code)
        if not ticker_symbol:
            return []

        logger.info("%s → %s", cftc_code, ticker_symbol)
        return self._downloader.download(ticker_symbol)

    def download_all(self, cftc_codes: list[str]) -> dict[str, list[dict]]:
        """Download prices for multiple markets. Returns {code: [bars...]}.

        Deduplicates by ticker symbol so the same instrument is only
        downloaded once even when several CFTC codes share a ticker.
        """
        eligible = [c for c in cftc_codes if self.has_ticker(c)]
        logger.info("Downloading prices for %d/%d markets...", len(eligible), len(cftc_codes))

        # Group codes by ticker to avoid downloading the same symbol twice
        ticker_to_codes: dict[str, list[str]] = {}
        for code in eligible:
            ticker = self._ticker_map[code]
            ticker_to_codes.setdefault(ticker, []).append(code)

        unique_tickers = list(ticker_to_codes.keys())
        logger.info("Unique tickers: %d (from %d codes)", len(unique_tickers), len(eligible))

        results: dict[str, list[dict]] = {}
        max_workers = min(8, len(unique_tickers)) if unique_tickers else 1

        def _download_one(ticker: str) -> tuple[str, list[dict]]:
            return ticker, self._downloader.download(ticker)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_download_one, t): t for t in unique_tickers}
            for i, future in enumerate(as_completed(futures), 1):
                ticker = futures[future]
                codes = ticker_to_codes[ticker]
                try:
                    _, bars = future.result()
                    if bars:
                        for code in codes:
                            results[code] = bars
                    logger.info("[%d/%d] %s → %s (%d bars)",
                               i, len(unique_tickers), codes[0], ticker, len(bars))
                except Exception as e:
                    logger.warning("[%d/%d] %s → %s failed: %s",
                                  i, len(unique_tickers), codes[0], ticker, e)

        logger.info("Done: %d/%d markets got price data", len(results), len(eligible))
        return results
