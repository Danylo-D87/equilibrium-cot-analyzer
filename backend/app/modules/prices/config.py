"""
Prices module — ticker mappings.
==================================
Maps CFTC contract codes to Yahoo Finance ticker symbols.
"""

from dataclasses import dataclass, field
from functools import cached_property

from app.core.config import env_int


@dataclass(frozen=True)
class PriceSettings:
    """Price download configuration."""

    price_years: int = field(default_factory=lambda: env_int("PRICE_YEARS", 3))

    @cached_property
    def ticker_map(self) -> dict[str, str]:
        """CFTC contract code → Yahoo Finance ticker symbol."""
        return {
            # --- Crypto ---
            "133741": "BTC-USD", "133742": "BTC-USD",
            "146021": "ETH-USD", "146022": "ETH-USD",
            "176740": "XRP-USD", "177741": "SOL-USD",
            # --- Currencies ---
            "099741": "6E=F", "096742": "6B=F", "097741": "6J=F",
            "090741": "6C=F", "232741": "6A=F", "112741": "6N=F",
            "092741": "6S=F", "098662": "DX=F", "095741": "6M=F", "102741": "6L=F",
            # --- Energy ---
            "067411": "CL=F", "023651": "NG=F", "022651": "HO=F",
            "111416": "RB=F", "06765T": "BZ=F", "067651": "CL=F",
            # --- Grains ---
            "001602": "ZW=F", "001612": "KE=F", "002602": "ZC=F",
            "005602": "ZS=F", "005603": "ZS=F", "026603": "ZM=F",
            "007601": "ZL=F", "004603": "ZO=F", "039601": "ZR=F",
            # --- Metals ---
            "088691": "GC=F", "088695": "GC=F", "084691": "SI=F",
            "084694": "SI=F", "085692": "HG=F", "085699": "HG=F",
            "076651": "PL=F", "075651": "PA=F",
            # --- Indices ---
            "13874A": "ES=F", "13874+": "ES=F", "13874U": "ES=F",
            "209742": "NQ=F", "20974+": "NQ=F", "209747": "NQ=F",
            "239742": "RTY=F", "239747": "RTY=F",
            "124603": "YM=F", "12460+": "YM=F", "240741": "NKD=F", "1170E1": "^VIX",
            # --- Livestock ---
            "057642": "LE=F", "061641": "GF=F", "054642": "HE=F",
            # --- Softs ---
            "073732": "CC=F", "083731": "KC=F", "033661": "CT=F",
            "080732": "SB=F", "040701": "OJ=F", "058644": "LBS=F",
            # --- Rates ---
            "043602": "ZN=F", "042601": "ZT=F", "044601": "ZF=F",
            "020601": "ZB=F", "043607": "TN=F", "020604": "UB=F",
        }


price_settings = PriceSettings()
