"""
COT Multi-Report Pipeline — Downloader
=======================================
Downloads yearly ZIP archives and current-week TXT files from CFTC.
Parameterized by report_type ('legacy','disagg','tff') and subtype ('fo','co').
"""

import io
import logging
import time
import zipfile
from datetime import datetime

import requests

from config import (
    REPORT_URLS, YEARS_TO_DOWNLOAD,
    DOWNLOAD_TIMEOUT, DOWNLOAD_RETRIES, RETRY_BACKOFF,
    USER_AGENT,
)

logger = logging.getLogger('cot_pipeline.downloader')


class Downloader:
    """Downloads COT data from CFTC website."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers['User-Agent'] = USER_AGENT

    # ------------------------------------------------------------------
    # Internal: HTTP GET with retries
    # ------------------------------------------------------------------

    def _get(self, url: str) -> bytes | None:
        """GET url with retries, returns response bytes or None."""
        for attempt in range(1, DOWNLOAD_RETRIES + 1):
            try:
                resp = self.session.get(url, timeout=DOWNLOAD_TIMEOUT)
                resp.raise_for_status()
                return resp.content
            except requests.RequestException as e:
                logger.warning(f"[DL] Attempt {attempt}/{DOWNLOAD_RETRIES} failed for {url}: {e}")
                if attempt < DOWNLOAD_RETRIES:
                    time.sleep(RETRY_BACKOFF * attempt)
        logger.error(f"[DL] All {DOWNLOAD_RETRIES} attempts failed for {url}")
        return None

    # ------------------------------------------------------------------
    # Download yearly ZIP → raw CSV text
    # ------------------------------------------------------------------

    def download_yearly_zip(self, report_type: str, subtype: str, year: int) -> str | None:
        """
        Download a yearly ZIP archive from CFTC, extract CSV, return as string.
        Returns None on failure.
        """
        url_template = REPORT_URLS[report_type][subtype]['yearly']
        url = url_template.format(year=year)

        logger.info(f"[DL] Downloading {report_type}/{subtype} year {year}: {url}")
        raw = self._get(url)
        if raw is None:
            return None

        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                names = zf.namelist()
                csv_names = [n for n in names if n.lower().endswith('.txt') or n.lower().endswith('.csv')]
                if not csv_names:
                    logger.error(f"[DL] No CSV/TXT file found in ZIP for {report_type}/{subtype}/{year}")
                    return None

                csv_name = csv_names[0]
                csv_bytes = zf.read(csv_name)
                csv_text = csv_bytes.decode('utf-8', errors='replace')
                logger.info(f"[DL] Extracted {csv_name} ({len(csv_text)} chars)")
                return csv_text
        except zipfile.BadZipFile as e:
            logger.error(f"[DL] Bad ZIP for {report_type}/{subtype}/{year}: {e}")
            return None

    # ------------------------------------------------------------------
    # Download current-week TXT
    # ------------------------------------------------------------------

    def download_current_week(self, report_type: str, subtype: str) -> str | None:
        """
        Download current-week TXT file (no headers!).
        Returns raw text or None.
        """
        url = REPORT_URLS[report_type][subtype]['current_week']
        logger.info(f"[DL] Downloading current week {report_type}/{subtype}: {url}")
        raw = self._get(url)
        if raw is None:
            return None
        text = raw.decode('utf-8', errors='replace')
        logger.info(f"[DL] Current week: {len(text)} chars")
        return text

    # ------------------------------------------------------------------
    # Convenience: download all years for one report_type/subtype
    # ------------------------------------------------------------------

    def download_all_years(self, report_type: str, subtype: str,
                           skip_years: set[int] = None) -> dict[int, str]:
        """
        Download 5 years of data for a specific report_type/subtype.
        Returns {year: csv_text, ...} for successful downloads.
        skip_years: years to skip (already downloaded).
        """
        current_year = datetime.now().year
        start_year = current_year - YEARS_TO_DOWNLOAD + 1
        results = {}

        for year in range(start_year, current_year + 1):
            if skip_years and year in skip_years:
                logger.info(f"[DL] Skipping {report_type}/{subtype}/{year} (already downloaded)")
                continue

            csv_text = self.download_yearly_zip(report_type, subtype, year)
            if csv_text:
                results[year] = csv_text

        return results
