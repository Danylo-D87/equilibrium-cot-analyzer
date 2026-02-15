#!/usr/bin/env python3
"""
Run the API server.
Usage:
    python -m scripts.run_server
    python scripts/run_server.py
    python scripts/run_server.py --reload
"""

import sys
from pathlib import Path

# Ensure the project root (backend/) is on sys.path
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import uvicorn

from app.core.config import settings


def main() -> None:
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload="--reload" in sys.argv,
        log_level="info",
    )


if __name__ == "__main__":
    main()
