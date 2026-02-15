"""
Generic TTL cache.
===================
Thread-safe in-memory cache with per-key time-to-live.
Can be instantiated by any module that needs caching.
"""

import time
import threading
import logging
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_CACHE_TTL = 300       # 5 minutes
DEFAULT_CACHE_MAX_SIZE = 10_000
CACHE_CLEANUP_INTERVAL = 100  # Run cleanup every N set() calls


class TTLCache:
    """Thread-safe in-memory cache with per-key TTL."""

    def __init__(self, name: str = "default", default_ttl: int = DEFAULT_CACHE_TTL, max_size: int = DEFAULT_CACHE_MAX_SIZE):
        """
        Args:
            name: Human-readable cache name (for logging).
            default_ttl: Default time-to-live in seconds.
            max_size: Maximum number of entries (0 = unlimited).
        """
        self.name = name
        self.default_ttl = default_ttl
        self.max_size = max_size
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._cleanup_counter = 0
        self._cleanup_every = CACHE_CLEANUP_INTERVAL

    def get(self, key: str) -> Any | None:
        """Get value if it exists and has not expired."""
        with self._lock:
            if key not in self._store:
                return None
            value, expires_at = self._store[key]
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """Store a value with the given TTL (or default)."""
        ttl = ttl if ttl is not None else self.default_ttl
        with self._lock:
            self._store[key] = (value, time.time() + ttl)
            self._cleanup_counter += 1
            if self._cleanup_counter >= self._cleanup_every:
                self._cleanup_counter = 0
                self._cleanup_expired_locked()

    def _cleanup_expired_locked(self) -> None:
        """Remove expired entries and enforce max_size. Caller must hold self._lock."""
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]
        # Enforce max_size: evict oldest entries by expiry time
        if self.max_size and len(self._store) > self.max_size:
            by_expiry = sorted(self._store.items(), key=lambda x: x[1][1])
            excess = len(self._store) - self.max_size
            for k, _ in by_expiry[:excess]:
                del self._store[k]
        if expired:
            logger.debug("[%s] Cleanup: removed %d expired entries", self.name, len(expired))

    def invalidate(self, pattern: str | None = None) -> int:
        """
        Invalidate cache entries.

        Args:
            pattern: If given, clear keys containing this substring.
                     If None, clear everything.

        Returns:
            Number of entries cleared.
        """
        with self._lock:
            if pattern is None:
                count = len(self._store)
                self._store.clear()
                logger.debug("[%s] Cleared all %d entries", self.name, count)
                return count

            keys_to_delete = [k for k in self._store if pattern in k]
            for k in keys_to_delete:
                del self._store[k]
            if keys_to_delete:
                logger.debug(
                    "[%s] Cleared %d entries matching '%s'",
                    self.name, len(keys_to_delete), pattern,
                )
            return len(keys_to_delete)

    def stats(self) -> dict:
        """Return cache statistics."""
        with self._lock:
            now = time.time()
            total = len(self._store)
            expired = sum(1 for _, (_, exp) in self._store.items() if now > exp)
            return {
                "name": self.name,
                "total_entries": total,
                "expired_entries": expired,
                "active_entries": total - expired,
            }
