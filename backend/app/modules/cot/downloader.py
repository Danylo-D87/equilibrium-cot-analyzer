"""
COT module — CFTC data downloader.
====================================
Downloads yearly ZIP archives and current-week TXT files from CFTC.
"""

import io
import logging
import time
import zipfile
from datetime import datetime

import requests

from app.core.config import settings
from app.modules.cot.config import cot_settings

logger = logging.getLogger(__name__)


class CotDownloader:
    """Downloads COT data from the CFTC website."""

    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = settings.http_user_agent

    # ------------------------------------------------------------------
    # HTTP helpers
    # ------------------------------------------------------------------

    def _get(self, url: str) -> bytes | None:
        """GET with retries and exponential backoff."""
        for attempt in range(1, settings.http_retries + 1):
            try:
                resp = self.session.get(url, timeout=settings.http_timeout)
                resp.raise_for_status()
                return resp.content
            except requests.RequestException as e:
                logger.warning(
                    "Attempt %d/%d failed for %s: %s",
                    attempt, settings.http_retries, url, e,
                )
                if attempt < settings.http_retries:
                    time.sleep(settings.http_retry_backoff * attempt)

        logger.error("All %d attempts failed for %s", settings.http_retries, url)
        return None

    # ------------------------------------------------------------------
    # Download yearly ZIP → raw CSV text
    # ------------------------------------------------------------------

    def download_yearly_zip(self, report_type: str, subtype: str, year: int) -> str | None:
        """Download a yearly ZIP archive, extract CSV, return as string."""
        url_template = cot_settings.report_urls[report_type][subtype]["yearly"]
        url = url_template.format(year=year)

        logger.info("Downloading %s/%s year %d: %s", report_type, subtype, year, url)
        raw = self._get(url)
        if raw is None:
            return None

        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                names = zf.namelist()
                csv_names = [n for n in names if n.lower().endswith((".txt", ".csv"))]
                if not csv_names:
                    logger.error("No CSV/TXT in ZIP for %s/%s/%d", report_type, subtype, year)
                    return None

                csv_bytes = zf.read(csv_names[0])
                csv_text = csv_bytes.decode("utf-8", errors="replace")
                logger.info("Extracted %s (%d chars)", csv_names[0], len(csv_text))
                return csv_text
        except zipfile.BadZipFile as e:
            logger.error("Bad ZIP for %s/%s/%d: %s", report_type, subtype, year, e)
            return None

    # ------------------------------------------------------------------
    # Download current-week TXT
    # ------------------------------------------------------------------

    def download_current_week(self, report_type: str, subtype: str) -> str | None:
        """Download current-week TXT file (no headers)."""
        url = cot_settings.report_urls[report_type][subtype]["current_week"]
        logger.info("Downloading current week %s/%s: %s", report_type, subtype, url)
        raw = self._get(url)
        if raw is None:
            return None
        text = raw.decode("utf-8", errors="replace")
        logger.info("Current week: %d chars", len(text))
        return text

    # ------------------------------------------------------------------
    # Batch download
    # ------------------------------------------------------------------

    def download_all_years(
        self,
        report_type: str,
        subtype: str,
        skip_years: set[int] | None = None,
    ) -> dict[int, str]:
        """Download N years of data. Returns {year: csv_text}."""
        current_year = datetime.now().year
        start_year = current_year - cot_settings.years_to_download + 1
        results: dict[int, str] = {}

        for year in range(start_year, current_year + 1):
            if skip_years and year in skip_years:
                logger.info("Skipping %s/%s/%d (already downloaded)", report_type, subtype, year)
                continue
            csv_text = self.download_yearly_zip(report_type, subtype, year)
            if csv_text:
                results[year] = csv_text

        return results
