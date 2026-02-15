"""
Market Analytics Platform — Backend Application
================================================
Modular backend for financial data analytics.
Each domain (COT, prices, etc.) is a self-contained module.
"""

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("cftc-analyzer")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"
