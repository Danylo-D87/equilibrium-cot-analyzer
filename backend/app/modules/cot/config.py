"""
COT module configuration.
===========================
Settings specific to the COT data pipeline.
Report types, subtypes, URLs, display names, thresholds, categories.
"""

from dataclasses import dataclass, field
from functools import cached_property

from app.core.config import env_int


@dataclass(frozen=True)
class CotSettings:
    """COT-specific configuration values."""

    # --- Report definitions ---
    report_types: tuple[str, ...] = ("legacy", "disagg", "tff")
    subtypes: tuple[str, ...] = ("fo", "co")

    # --- Download settings ---
    years_to_download: int = field(default_factory=lambda: env_int("COT_YEARS", 5))

    # --- Lookback periods (weeks) ---
    cot_index_3m: int = 13
    cot_index_1y: int = 52
    cot_index_3y: int = 156
    wci_lookback: int = 26

    # --- Statistics ---
    max_min_5y_weeks: int = 260
    avg_13w_weeks: int = 13

    # --- Crowded level thresholds ---
    crowded_buy_threshold: int = field(default_factory=lambda: env_int("COT_CROWDED_BUY", 80))
    crowded_sell_threshold: int = field(default_factory=lambda: env_int("COT_CROWDED_SELL", 20))

    # --- Display names ---
    @cached_property
    def report_display_names(self) -> dict[str, str]:
        return {
            "legacy": "Legacy",
            "disagg": "Disaggregated",
            "tff": "Traders in Financial Futures",
        }

    @cached_property
    def subtype_display_names(self) -> dict[str, str]:
        return {
            "fo": "Futures Only",
            "co": "Futures + Options Combined",
        }

    # --- CFTC download URLs ---
    @cached_property
    def report_urls(self) -> dict:
        return {
            "legacy": {
                "fo": {
                    "yearly": "https://www.cftc.gov/files/dea/history/deacot{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/deafut.txt",
                },
                "co": {
                    "yearly": "https://www.cftc.gov/files/dea/history/deahistfo{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/deacom.txt",
                },
            },
            "disagg": {
                "fo": {
                    "yearly": "https://www.cftc.gov/files/dea/history/fut_disagg_txt_{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/f_disagg.txt",
                },
                "co": {
                    "yearly": "https://www.cftc.gov/files/dea/history/com_disagg_txt_{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/c_disagg.txt",
                },
            },
            "tff": {
                "fo": {
                    "yearly": "https://www.cftc.gov/files/dea/history/fut_fin_txt_{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/FinFutWk.txt",
                },
                "co": {
                    "yearly": "https://www.cftc.gov/files/dea/history/com_fin_txt_{year}.zip",
                    "current_week": "https://www.cftc.gov/dea/newcot/FinComWk.txt",
                },
            },
        }

    # --- Report groups (trader categories per report type) ---
    @cached_property
    def report_groups(self) -> dict[str, list[dict]]:
        return {
            "legacy": [
                {"key": "g1", "name": "Large Speculators", "short": "L.S", "role": "speculative", "has_spread": True},
                {"key": "g2", "name": "Commercials", "short": "Comm", "role": "commercial", "has_spread": False},
                {"key": "g3", "name": "Small Traders", "short": "ST", "role": "small", "has_spread": False},
            ],
            "disagg": [
                {"key": "g1", "name": "Producer/Merchant", "short": "PM", "role": "commercial", "has_spread": False},
                {"key": "g2", "name": "Swap Dealers", "short": "SD", "role": "commercial", "has_spread": True},
                {"key": "g3", "name": "Managed Money", "short": "MM", "role": "speculative", "has_spread": True},
                {"key": "g4", "name": "Other Reportables", "short": "OR", "role": "speculative", "has_spread": True},
                {"key": "g5", "name": "Non-Reportable", "short": "NR", "role": "small", "has_spread": False},
            ],
            "tff": [
                {"key": "g1", "name": "Dealer/Intermediary", "short": "Dealer", "role": "commercial", "has_spread": True},
                {"key": "g2", "name": "Asset Manager", "short": "AM", "role": "speculative", "has_spread": True},
                {"key": "g3", "name": "Leveraged Funds", "short": "LevFn", "role": "speculative", "has_spread": True},
                {"key": "g4", "name": "Other Reportables", "short": "OR", "role": "speculative", "has_spread": True},
                {"key": "g5", "name": "Non-Reportable", "short": "NR", "role": "small", "has_spread": False},
            ],
        }

    # --- Market categories for classification ---
    @cached_property
    def market_categories(self) -> dict[str, dict]:
        return {
            "currencies": {
                "keywords": [
                    "USD INDEX", "EURO FX", "BRITISH POUND", "JAPANESE YEN",
                    "SWISS FRANC", "CANADIAN DOLLAR", "AUSTRALIAN DOLLAR",
                    "NEW ZEALAND DOLLAR", "MEXICAN PESO", "BRAZILIAN REAL",
                    "RUSSIAN RUBLE", "S. AFRICAN RAND", "RENMINBI",
                ],
                "display": "Currencies",
            },
            "crypto": {
                "keywords": [
                    "BITCOIN", "MICRO BITCOIN", "ETHER", "NANO BITCOIN", "NANO ETHER",
                    "SHIB", "SOLANA", "XRP", "DOGECOIN",
                    "LITECOIN", "POLKADOT", "CHAINLINK", "AVALANCHE",
                    "CARDONA", "STELLAR", "HEDERA", "SUI",
                    "BITCOIN CASH",
                ],
                "display": "Crypto",
            },
            "metals": {
                "keywords": ["GOLD", "SILVER", "COPPER", "PLATINUM", "PALLADIUM", "ALUMINUM"],
                "display": "Metals",
            },
            "energy": {
                "keywords": [
                    "CRUDE OIL", "NATURAL GAS", "HEATING OIL", "RBOB GASOLINE", "BRENT CRUDE",
                    "ETHANOL",
                ],
                "display": "Energy",
            },
            "grains": {
                "keywords": [
                    "WHEAT", "CORN", "SOYBEANS", "SOYBEAN OIL", "SOYBEAN MEAL",
                    "OATS", "ROUGH RICE", "CANOLA",
                ],
                "display": "Grains",
            },
            "softs": {
                "keywords": ["COFFEE", "COCOA", "SUGAR", "COTTON", "ORANGE JUICE", "LUMBER"],
                "display": "Softs",
            },
            "livestock": {
                "keywords": ["LIVE CATTLE", "FEEDER CATTLE", "LEAN HOGS"],
                "display": "Livestock",
            },
            "indices": {
                "keywords": [
                    "S&P 500", "E-MINI S&P", "NASDAQ", "DOW JONES", "RUSSELL",
                    "VIX", "NIKKEI", "MIDCAP",
                ],
                "display": "Indices",
            },
            "rates": {
                "keywords": [
                    "2-YEAR", "5-YEAR", "10-YEAR", "30-YEAR", "EURODOLLAR",
                    "FED FUNDS", "TREASURY", "T-NOTE", "T-BOND", "ULTRA",
                    "SOFR",
                ],
                "display": "Rates",
            },
        }


# Module-level singleton
cot_settings = CotSettings()
