"""
PortfolioAnalyzer — adapted from Fundamental/backend/portfolio_analyzer.py
==========================================================================
Calculates institutional-grade portfolio metrics and generates chart data.

Key adaptations from Fundamental:
- Accepts list[dict] (from service.trades_to_dicts) instead of Pydantic Trade objects
- Uses per-user initial_balance / risk_free_rate from UserJournalSettings
- Imports BTCDataService from app.modules.market_data
- Schema types imported from app.modules.journal.schemas
- No direct DB access — everything is passed in
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Tuple
from datetime import date, datetime, timedelta

import pytz

from app.modules.journal.schemas import (
    PortfolioMetrics,
    EquityCurvePoint,
    AlphaCurvePoint,
    DrawdownPoint,
    RollingMetricsPoint,
    DailyReturnPoint,
    RollingWinRatePoint,
    RMultipleDistribution,
    RiskAdjustedComparison,
    NAVHistoryPoint,
    RollingInformationRatioPoint,
    ExpectedVsActualReturn,
    ComparativeDrawdownPoint,
    NAVvsHighWatermarkPoint,
    RollingTrackingErrorPoint,
    AssetsExposure,
    TradeStatus,
)
from app.modules.market_data.btc_service import BTCDataService

# Timezone constant
KYIV_TZ = pytz.timezone("Europe/Kyiv")


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def get_current_date_kyiv() -> date:
    return datetime.now(KYIV_TZ).date()


def get_current_datetime_kyiv() -> datetime:
    return datetime.now(KYIV_TZ)


def ensure_timezone_aware(series: pd.Series, tz=KYIV_TZ) -> pd.Series:
    """
    Safely convert pandas Series of dates to timezone-aware.
    If already tz-aware → convert.  If naive → localize.
    """
    dt_series = pd.to_datetime(series)
    if dt_series.dt.tz is None:
        return dt_series.dt.tz_localize(tz)
    else:
        return dt_series.dt.tz_convert(tz)


def prepare_dataframe_for_json(df: pd.DataFrame) -> pd.DataFrame:
    """Remove timezone info from datetime columns for JSON serialisation."""
    result = df.copy()
    for col in result.columns:
        if pd.api.types.is_datetime64_any_dtype(result[col]):
            if hasattr(result[col].dtype, "tz") and result[col].dtype.tz is not None:
                result[col] = result[col].dt.tz_localize(None)
    return result


def safe_float(val, default: float = 0.0) -> float:
    """Convert value to float, replacing None / NaN with *default*."""
    if val is None:
        return default
    try:
        if pd.isna(val):
            return default
    except (TypeError, ValueError):
        pass
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


# ──────────────────────────────────────────────────────────────
# PortfolioAnalyzer
# ──────────────────────────────────────────────────────────────

class PortfolioAnalyzer:
    """
    Institutional portfolio metrics calculator.

    All public methods accept ``trades`` as ``list[dict]`` (from
    ``service.trades_to_dicts``).  Each dict is expected to have at least:
    ``date``, ``pair``, ``type``, ``style``, ``direction``, ``status``,
    ``risk_amount``, ``profit_amount``, ``rr_ratio``.
    """

    def __init__(
        self,
        initial_balance: float = 100_000.0,
        risk_free_rate: float = 0.04,
    ):
        self.initial_balance = initial_balance
        self.risk_free_rate = risk_free_rate
        self.btc_service = BTCDataService()

    # ------------------------------------------------------------------
    # Benchmark helpers
    # ------------------------------------------------------------------

    def fetch_benchmark_data(
        self,
        start_date: date,
        end_date: Optional[date] = None,
    ) -> pd.DataFrame:
        if end_date is None:
            end_date = get_current_date_kyiv()
        return self.btc_service.get_btc_data(start_date, end_date)

    # ------------------------------------------------------------------
    # Return helpers
    # ------------------------------------------------------------------

    def _calculate_returns(self, values: pd.Series) -> pd.Series:
        return values.pct_change().dropna()

    # ------------------------------------------------------------------
    # NAV series (daily equity curve)
    # ------------------------------------------------------------------

    def _calculate_nav_series(self, trades_df: pd.DataFrame) -> pd.DataFrame:
        if trades_df.empty:
            return pd.DataFrame(columns=["date", "nav", "cumulative_profit"])

        df = trades_df.copy()
        df["date"] = ensure_timezone_aware(df["date"])

        start_date = df["date"].min().normalize()
        now_kyiv = get_current_datetime_kyiv()
        end_date = max(df["date"].max(), pd.Timestamp(now_kyiv)).normalize()

        full_date_range = pd.date_range(start=start_date, end=end_date, freq="D", tz=KYIV_TZ)
        daily_profits = df.groupby(df["date"].dt.normalize())["profit_amount"].sum()
        daily_profits_series = daily_profits.reindex(full_date_range, fill_value=0.0)

        result_df = pd.DataFrame(index=full_date_range)
        result_df["daily_profit"] = daily_profits_series
        result_df.index.name = "date"
        result_df["cumulative_profit"] = result_df["daily_profit"].cumsum()
        result_df["nav"] = self.initial_balance + result_df["cumulative_profit"]

        return result_df.reset_index()

    # ------------------------------------------------------------------
    # Max Drawdown
    # ------------------------------------------------------------------

    def calculate_max_drawdown(self, nav_series: pd.Series) -> Tuple[float, int]:
        if nav_series.empty or len(nav_series) < 2:
            return 0.0, 0

        peak = nav_series.expanding(min_periods=1).max()
        drawdown = (nav_series - peak) / peak
        max_dd = drawdown.min()

        if max_dd < 0:
            dd_end_idx = drawdown.idxmin()
            recovery_mask = (drawdown.index > dd_end_idx) & (drawdown >= 0)
            if recovery_mask.any():
                recovery_idx = drawdown[recovery_mask].index[0]
                recovery_days = recovery_idx - dd_end_idx
                recovery_days = recovery_days.days if hasattr(recovery_days, "days") else int(recovery_days)
            else:
                recovery_days = -1
        else:
            recovery_days = 0

        return float(max_dd), recovery_days

    # ------------------------------------------------------------------
    # Beta
    # ------------------------------------------------------------------

    def calculate_beta(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series,
    ) -> float:
        if len(portfolio_returns) < 2 or len(benchmark_returns) < 2:
            return 0.0

        aligned = pd.DataFrame(
            {"portfolio": portfolio_returns, "benchmark": benchmark_returns}
        ).dropna()

        if len(aligned) < 2:
            return 0.0

        covariance = aligned["portfolio"].cov(aligned["benchmark"])
        variance = aligned["benchmark"].var()

        if variance == 0:
            return 0.0

        return float(covariance / variance)

    # ------------------------------------------------------------------
    # Expected Return (CAPM)
    # ------------------------------------------------------------------

    def calculate_expected_return(self, beta: float, benchmark_return: float) -> float:
        return self.risk_free_rate + beta * (benchmark_return - self.risk_free_rate)

    # ------------------------------------------------------------------
    # Information Ratio
    # ------------------------------------------------------------------

    def calculate_information_ratio(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series,
        periods_per_year: int = 365,
    ) -> float:
        if len(portfolio_returns) < 2 or len(benchmark_returns) < 2:
            return 0.0

        aligned = pd.DataFrame(
            {"portfolio": portfolio_returns, "benchmark": benchmark_returns}
        ).dropna()

        if len(aligned) < 2:
            return 0.0

        tracking_diff = aligned["portfolio"] - aligned["benchmark"]
        mean_diff = tracking_diff.mean()
        std_diff = tracking_diff.std()

        if std_diff == 0:
            return 0.0

        ir = (mean_diff / std_diff) * np.sqrt(periods_per_year)
        return float(ir)

    # ------------------------------------------------------------------
    # Sharpe Ratio
    # ------------------------------------------------------------------

    def calculate_sharpe_ratio(
        self,
        portfolio_returns: pd.Series,
        periods_per_year: int = 365,
    ) -> float:
        if len(portfolio_returns) < 2:
            return 0.0

        rf_periodic = self.risk_free_rate / periods_per_year
        excess_returns = portfolio_returns - rf_periodic
        mean_excess = excess_returns.mean()
        std_returns = portfolio_returns.std()

        if std_returns == 0:
            return 0.0

        return float((mean_excess / std_returns) * np.sqrt(periods_per_year))

    # ------------------------------------------------------------------
    # Sortino Ratio
    # ------------------------------------------------------------------

    def calculate_sortino_ratio(
        self,
        portfolio_returns: pd.Series,
        periods_per_year: int = 365,
    ) -> float:
        if len(portfolio_returns) < 2:
            return 0.0

        rf_periodic = self.risk_free_rate / periods_per_year
        excess_returns = portfolio_returns - rf_periodic

        # Canonical Sortino (1991): downside deviation uses ALL observations,
        # flooring positive returns to zero: σᵈ = sqrt(1/N × Σ min(Rᵢ, 0)²)
        downside = np.minimum(portfolio_returns, 0.0)

        if (downside == 0).all():
            return 99.9999 if excess_returns.mean() > 0 else 0.0

        downside_deviation = np.sqrt((downside ** 2).mean())

        if downside_deviation == 0:
            return 0.0

        mean_excess = excess_returns.mean()
        return float((mean_excess / downside_deviation) * np.sqrt(periods_per_year))

    # ------------------------------------------------------------------
    # Tracking Error
    # ------------------------------------------------------------------

    def calculate_tracking_error(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series,
        periods_per_year: int = 365,
    ) -> float:
        if len(portfolio_returns) < 2 or len(benchmark_returns) < 2:
            return 0.0

        aligned = pd.DataFrame(
            {"portfolio": portfolio_returns, "benchmark": benchmark_returns}
        ).dropna()

        if len(aligned) < 2:
            return 0.0

        tracking_diff = aligned["portfolio"] - aligned["benchmark"]
        te = tracking_diff.std() * np.sqrt(periods_per_year)

        return float(te * 100)  # percentage

    # ------------------------------------------------------------------
    # 30-day rolling metrics
    # ------------------------------------------------------------------

    def calculate_30d_metrics(
        self,
        portfolio_returns: pd.Series,
        benchmark_returns: pd.Series,
    ) -> Dict[str, float]:
        if len(portfolio_returns) < 2 or len(benchmark_returns) < 2:
            return {
                "correlation_30d": 0.0,
                "excess_return_30d_annualized": 0.0,
                "sharpe_30d": 0.0,
                "sortino_30d": 0.0,
            }

        days_available = min(30, len(portfolio_returns))
        port_30d = portfolio_returns.tail(days_available)
        bench_30d = benchmark_returns.tail(days_available)

        correlation = port_30d.corr(bench_30d) if len(port_30d) > 1 else 0.0
        if pd.isna(correlation):
            correlation = 0.0

        excess_30d = (port_30d - bench_30d).mean() * 365 * 100
        if pd.isna(excess_30d):
            excess_30d = 0.0

        sharpe_30d = self.calculate_sharpe_ratio(port_30d, periods_per_year=365)
        if pd.isna(sharpe_30d):
            sharpe_30d = 0.0

        sortino_30d = self.calculate_sortino_ratio(port_30d, periods_per_year=365)
        if pd.isna(sortino_30d):
            sortino_30d = 0.0

        return {
            "correlation_30d": round(correlation, 4),
            "excess_return_30d_annualized": round(excess_30d, 2),
            "sharpe_30d": round(sharpe_30d, 4),
            "sortino_30d": round(sortino_30d, 4),
        }

    # ------------------------------------------------------------------
    # Interpretation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _interpret_information_ratio(ir: float) -> str:
        if ir > 1.0:
            return "Super (>1.0)"
        elif ir > 0.5:
            return "Good (0.5-1.0)"
        elif ir > 0.0:
            return "Average (0.0-0.5)"
        else:
            return "Poor (<0.0)"

    @staticmethod
    def _interpret_risk_level(beta: float, sortino: float, max_dd: float) -> str:
        risk_score = 0
        if abs(beta) > 1.5:
            risk_score += 2
        elif abs(beta) > 1.0:
            risk_score += 1
        if sortino < 0:
            risk_score += 2
        elif sortino < 0.5:
            risk_score += 1
        if max_dd < -0.3:
            risk_score += 2
        elif max_dd < -0.15:
            risk_score += 1

        if risk_score >= 4:
            return "High Risk"
        elif risk_score >= 2:
            return "Medium Risk"
        else:
            return "Low Risk"

    # ==================================================================
    # Main metrics calculation
    # ==================================================================

    def calculate_metrics(
        self,
        trades: List[dict],
        *,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> PortfolioMetrics:
        """
        Calculate all portfolio metrics.

        Parameters
        ----------
        trades : list[dict]
            Flat trade dicts from ``service.trades_to_dicts()``.
        date_from / date_to : optional date filters for benchmark range.
        """
        closed_trades = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]

        if not closed_trades:
            return self._get_empty_metrics()

        trades_df = pd.DataFrame(closed_trades)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")

        # Basic
        total_trades = len(closed_trades)
        winning_trades = len([t for t in closed_trades if t["profit_amount"] > 0])
        losing_trades = len([t for t in closed_trades if t["profit_amount"] < 0])
        win_rate = winning_trades / total_trades * 100 if total_trades > 0 else 0

        total_profit = trades_df["profit_amount"].sum()
        current_nav = self.initial_balance + total_profit
        portfolio_return = (current_nav - self.initial_balance) / self.initial_balance * 100

        # R-metrics: sum of individual R-multiples (P&L_i / Risk_i)
        r_multiples = [
            t["profit_amount"] / t["risk_amount"]
            for t in closed_trades
            if t["risk_amount"] > 0
        ]
        total_r = sum(r_multiples) if r_multiples else 0.0
        average_r = total_r / len(r_multiples) if r_multiples else 0.0

        # NAV series
        nav_df = self._calculate_nav_series(trades_df)

        # Benchmark
        if not nav_df.empty:
            start = date_from or nav_df["date"].min().date()
            end = date_to or nav_df["date"].max().date()
            benchmark_df = self.fetch_benchmark_data(start, end)
        else:
            benchmark_df = pd.DataFrame()

        if nav_df.empty or benchmark_df.empty:
            return PortfolioMetrics(
                total_trades=total_trades,
                winning_trades=winning_trades,
                losing_trades=losing_trades,
                win_rate=win_rate,
                initial_balance=self.initial_balance,
                current_nav=current_nav,
                total_profit=total_profit,
                portfolio_return=portfolio_return,
                high_watermark=current_nav,
                benchmark_return=0.0,
                excess_return=portfolio_return,
                max_drawdown_portfolio=0.0,
                max_drawdown_benchmark=0.0,
                drawdown_outperformance=0.0,
                beta=0.0,
                expected_return=0.0,
                information_ratio=0.0,
                tracking_error=0.0,
                sharpe_ratio=0.0,
                sortino_ratio=0.0,
                correlation_30d=0.0,
                excess_return_30d_annualized=0.0,
                sharpe_30d=0.0,
                sortino_30d=0.0,
                total_r=total_r,
                average_r=average_r,
                ir_interpretation="N/A",
                risk_level="N/A",
            )

        # Benchmark metrics
        benchmark_start = benchmark_df["price"].iloc[0]
        benchmark_end = benchmark_df["price"].iloc[-1]
        benchmark_return_ = (benchmark_end - benchmark_start) / benchmark_start * 100
        excess_return = portfolio_return - benchmark_return_

        # Max drawdown
        max_dd_portfolio, _ = self.calculate_max_drawdown(nav_df["nav"])
        benchmark_df["benchmark_nav"] = benchmark_df["price"] / benchmark_start * self.initial_balance
        max_dd_benchmark, _ = self.calculate_max_drawdown(benchmark_df["benchmark_nav"])
        drawdown_outperformance = max_dd_portfolio - max_dd_benchmark

        # Merge for correlation metrics
        nav_df["date"] = ensure_timezone_aware(nav_df["date"])
        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"])

        nav_for_merge = nav_df.copy()
        bench_for_merge = benchmark_df.copy()
        nav_for_merge["date"] = pd.to_datetime(nav_for_merge["date"]).dt.tz_localize(None).dt.normalize()
        bench_for_merge["date"] = pd.to_datetime(bench_for_merge["date"]).dt.tz_localize(None).dt.normalize()

        merged = pd.merge(
            nav_for_merge[["date", "nav"]],
            bench_for_merge[["date", "price"]],
            on="date",
            how="inner",
        )

        if len(merged) < 2:
            portfolio_returns = pd.Series(dtype=float)
            benchmark_returns = pd.Series(dtype=float)
        else:
            portfolio_returns = self._calculate_returns(merged["nav"])
            benchmark_returns = self._calculate_returns(merged["price"])

        beta = self.calculate_beta(portfolio_returns, benchmark_returns)
        expected_return = self.calculate_expected_return(beta, benchmark_return_ / 100)
        information_ratio = self.calculate_information_ratio(portfolio_returns, benchmark_returns)
        sharpe_ratio = self.calculate_sharpe_ratio(portfolio_returns)
        sortino_ratio = self.calculate_sortino_ratio(portfolio_returns)
        tracking_error = self.calculate_tracking_error(portfolio_returns, benchmark_returns)
        high_watermark = nav_df["nav"].max()
        metrics_30d = self.calculate_30d_metrics(portfolio_returns, benchmark_returns)

        ir_interpretation = self._interpret_information_ratio(information_ratio)
        risk_level = self._interpret_risk_level(beta, sortino_ratio, max_dd_portfolio)

        return PortfolioMetrics(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=round(win_rate, 2),
            initial_balance=self.initial_balance,
            current_nav=round(current_nav, 2),
            total_profit=round(total_profit, 2),
            portfolio_return=round(portfolio_return, 2),
            high_watermark=round(high_watermark, 2),
            benchmark_return=round(safe_float(benchmark_return_), 2),
            excess_return=round(safe_float(excess_return), 2),
            max_drawdown_portfolio=round(safe_float(max_dd_portfolio * 100), 2),
            max_drawdown_benchmark=round(safe_float(max_dd_benchmark * 100), 2),
            drawdown_outperformance=round(safe_float(drawdown_outperformance * 100), 2),
            beta=round(safe_float(beta), 4),
            expected_return=round(safe_float(expected_return * 100), 2),
            information_ratio=round(safe_float(information_ratio), 4),
            tracking_error=round(safe_float(tracking_error), 2),
            sharpe_ratio=round(safe_float(sharpe_ratio), 4),
            sortino_ratio=round(safe_float(sortino_ratio), 4),
            correlation_30d=safe_float(metrics_30d["correlation_30d"]),
            excess_return_30d_annualized=safe_float(metrics_30d["excess_return_30d_annualized"]),
            sharpe_30d=safe_float(metrics_30d["sharpe_30d"]),
            sortino_30d=safe_float(metrics_30d["sortino_30d"]),
            total_r=round(safe_float(total_r), 2),
            average_r=round(safe_float(average_r), 4),
            ir_interpretation=ir_interpretation,
            risk_level=risk_level,
        )

    def _get_empty_metrics(self) -> PortfolioMetrics:
        return PortfolioMetrics(
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            win_rate=0.0,
            initial_balance=self.initial_balance,
            current_nav=self.initial_balance,
            total_profit=0.0,
            portfolio_return=0.0,
            high_watermark=self.initial_balance,
            benchmark_return=0.0,
            excess_return=0.0,
            max_drawdown_portfolio=0.0,
            max_drawdown_benchmark=0.0,
            drawdown_outperformance=0.0,
            beta=0.0,
            expected_return=0.0,
            information_ratio=0.0,
            tracking_error=0.0,
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            correlation_30d=0.0,
            excess_return_30d_annualized=0.0,
            sharpe_30d=0.0,
            sortino_30d=0.0,
            total_r=0.0,
            average_r=0.0,
            ir_interpretation="N/A",
            risk_level="N/A",
        )

    # ==================================================================
    # Chart: Equity Curve
    # ==================================================================

    def get_equity_curve(self, trades: List[dict]) -> List[EquityCurvePoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")

        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        start_date = nav_df["date"].min().date()
        end_date = nav_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        benchmark_start = benchmark_df["price"].iloc[0]
        benchmark_df["benchmark_nav"] = benchmark_df["price"] / benchmark_start * self.initial_balance
        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"])
        nav_df["date"] = ensure_timezone_aware(nav_df["date"])

        merged = pd.merge(
            nav_df[["date", "nav"]],
            benchmark_df[["date", "benchmark_nav"]],
            on="date",
            how="outer",
        ).sort_values("date")

        merged["nav"] = merged["nav"].ffill().fillna(self.initial_balance)
        merged["benchmark_nav"] = merged["benchmark_nav"].ffill().fillna(self.initial_balance)

        merged["portfolio_peak"] = merged["nav"].expanding().max()
        merged["portfolio_drawdown"] = (merged["nav"] - merged["portfolio_peak"]) / merged["portfolio_peak"] * 100
        merged["benchmark_peak"] = merged["benchmark_nav"].expanding().max()
        merged["benchmark_drawdown"] = (merged["benchmark_nav"] - merged["benchmark_peak"]) / merged["benchmark_peak"] * 100

        result = []
        for _, row in merged.iterrows():
            result.append(EquityCurvePoint(
                date=row["date"].date(),
                portfolio_nav=round(row["nav"], 2),
                benchmark_nav=round(row["benchmark_nav"], 2),
                portfolio_drawdown=round(row["portfolio_drawdown"], 2),
                benchmark_drawdown=round(row["benchmark_drawdown"], 2),
            ))
        return result

    # ==================================================================
    # Chart: Assets Exposure
    # ==================================================================

    def get_assets_exposure(self, trades: List[dict]) -> List[AssetsExposure]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        exposure_data = []

        for pair in trades_df["pair"].unique():
            pair_trades = trades_df[trades_df["pair"] == pair]
            long_trades = pair_trades[pair_trades["direction"] == "Long"]
            short_trades = pair_trades[pair_trades["direction"] == "Short"]

            long_count = len(long_trades)
            short_count = len(short_trades)
            long_profit = long_trades["profit_amount"].sum() if long_count > 0 else 0.0
            short_profit = short_trades["profit_amount"].sum() if short_count > 0 else 0.0

            total_profit = long_profit + short_profit
            total_trades_pair = long_count + short_count
            winning = len(pair_trades[pair_trades["profit_amount"] > 0])
            win_rate = (winning / total_trades_pair * 100) if total_trades_pair > 0 else 0.0

            exposure_data.append(AssetsExposure(
                pair=pair,
                long_count=long_count,
                short_count=short_count,
                long_profit=round(long_profit, 2),
                short_profit=round(short_profit, 2),
                total_profit=round(total_profit, 2),
                win_rate=round(win_rate, 2),
                total_trades=total_trades_pair,
            ))

        exposure_data.sort(key=lambda x: x.total_profit, reverse=True)
        return exposure_data

    # ==================================================================
    # Chart: Alpha Curve
    # ==================================================================

    def get_alpha_curve(self, trades: List[dict]) -> List[AlphaCurvePoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")

        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        start_date = nav_df["date"].min().date()
        end_date = nav_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        benchmark_start = benchmark_df["price"].iloc[0]
        benchmark_df["benchmark_nav"] = benchmark_df["price"] / benchmark_start * self.initial_balance
        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"])
        nav_df["date"] = ensure_timezone_aware(nav_df["date"])

        merged = pd.merge(
            nav_df[["date", "nav"]],
            benchmark_df[["date", "benchmark_nav"]],
            on="date",
            how="outer",
        ).sort_values("date")

        merged["nav"] = merged["nav"].ffill().fillna(self.initial_balance)
        merged["benchmark_nav"] = merged["benchmark_nav"].ffill().fillna(self.initial_balance)

        merged["portfolio_return_pct"] = ((merged["nav"] - self.initial_balance) / self.initial_balance) * 100
        merged["benchmark_return_pct"] = ((merged["benchmark_nav"] - self.initial_balance) / self.initial_balance) * 100
        merged["cumulative_alpha"] = merged["portfolio_return_pct"] - merged["benchmark_return_pct"]

        merged = prepare_dataframe_for_json(merged)

        return [
            AlphaCurvePoint(date=row["date"].date(), cumulative_alpha=round(row["cumulative_alpha"], 2))
            for _, row in merged.iterrows()
        ]

    # ==================================================================
    # Chart: Drawdown (underwater)
    # ==================================================================

    def get_drawdown_chart(self, trades: List[dict]) -> List[DrawdownPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")

        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        start_date = nav_df["date"].min().date()
        end_date = nav_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        benchmark_start = benchmark_df["price"].iloc[0]
        benchmark_df["benchmark_nav"] = benchmark_df["price"] / benchmark_start * self.initial_balance
        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"])
        nav_df["date"] = ensure_timezone_aware(nav_df["date"])

        merged = pd.merge(
            nav_df[["date", "nav"]],
            benchmark_df[["date", "benchmark_nav"]],
            on="date",
            how="outer",
        ).sort_values("date")

        merged["nav"] = merged["nav"].ffill().fillna(self.initial_balance)
        merged["benchmark_nav"] = merged["benchmark_nav"].ffill().fillna(self.initial_balance)

        merged["portfolio_peak"] = merged["nav"].expanding().max()
        merged["portfolio_drawdown"] = (merged["nav"] - merged["portfolio_peak"]) / merged["portfolio_peak"] * 100
        merged["benchmark_peak"] = merged["benchmark_nav"].expanding().max()
        merged["benchmark_drawdown"] = (merged["benchmark_nav"] - merged["benchmark_peak"]) / merged["benchmark_peak"] * 100

        merged = prepare_dataframe_for_json(merged)

        return [
            DrawdownPoint(
                date=row["date"].date(),
                portfolio_drawdown=round(row["portfolio_drawdown"], 2),
                benchmark_drawdown=round(row["benchmark_drawdown"], 2),
            )
            for _, row in merged.iterrows()
        ]

    # ==================================================================
    # Chart: Rolling Metrics
    # ==================================================================

    def get_rolling_metrics(self, trades: List[dict], window: int = 30) -> List[RollingMetricsPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        start_date = nav_df["date"].min().date()
        end_date = nav_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        nav_df["date"] = ensure_timezone_aware(nav_df["date"], KYIV_TZ)
        nav_df["date_only"] = nav_df["date"].dt.normalize()
        benchmark_df["date_only"] = benchmark_df["date"].dt.normalize()

        merged = pd.merge(
            nav_df[["date_only", "nav"]],
            benchmark_df[["date_only", "price"]],
            on="date_only",
            how="inner",
        ).sort_values("date_only")
        merged.rename(columns={"date_only": "date"}, inplace=True)

        actual_window = min(window, max(5, len(merged) // 2))
        if len(merged) < 2 or actual_window < 2:
            return []

        merged["portfolio_return"] = merged["nav"].pct_change()
        merged["benchmark_return"] = merged["price"].pct_change()

        merged["rolling_beta"] = merged["portfolio_return"].rolling(actual_window).cov(
            merged["benchmark_return"]
        ) / merged["benchmark_return"].rolling(actual_window).var()

        merged["rolling_correlation"] = merged["portfolio_return"].rolling(actual_window).corr(
            merged["benchmark_return"]
        )

        rf_daily = self.risk_free_rate / 365
        merged["excess_return"] = merged["portfolio_return"] - rf_daily
        merged["rolling_sharpe"] = (
            merged["excess_return"].rolling(actual_window).mean()
            / merged["portfolio_return"].rolling(actual_window).std()
        ) * np.sqrt(365)

        merged = prepare_dataframe_for_json(merged)

        def _finite_or_none(val) -> float | None:
            """Return rounded float only if finite; otherwise None."""
            if pd.isna(val):
                return None
            f = float(val)
            if not np.isfinite(f):
                return None
            return round(f, 4)

        result = []
        for _, row in merged.iterrows():
            if pd.notna(row["rolling_beta"]):
                result.append(RollingMetricsPoint(
                    date=row["date"].date() if hasattr(row["date"], "date") else row["date"],
                    rolling_beta=_finite_or_none(row["rolling_beta"]),
                    rolling_correlation=_finite_or_none(row["rolling_correlation"]),
                    rolling_sharpe=_finite_or_none(row["rolling_sharpe"]),
                ))
        return result

    # ==================================================================
    # Chart: Daily Returns
    # ==================================================================

    def get_daily_returns(self, trades: List[dict]) -> List[DailyReturnPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        start_date = nav_df["date"].min().date()
        end_date = nav_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        nav_df["date"] = ensure_timezone_aware(nav_df["date"], KYIV_TZ)
        nav_df["date_only"] = nav_df["date"].dt.normalize()
        benchmark_df["date_only"] = benchmark_df["date"].dt.normalize()

        merged = pd.merge(
            nav_df[["date_only", "nav"]],
            benchmark_df[["date_only", "price"]],
            on="date_only",
            how="inner",
        ).sort_values("date_only")
        merged.rename(columns={"date_only": "date"}, inplace=True)

        merged["portfolio_return"] = merged["nav"].pct_change() * 100
        merged["benchmark_return"] = merged["price"].pct_change() * 100

        merged = prepare_dataframe_for_json(merged)

        return [
            DailyReturnPoint(
                date=row["date"].date(),
                portfolio_return=round(float(row["portfolio_return"]), 2) if pd.notna(row["portfolio_return"]) else 0.0,
                benchmark_return=round(float(row["benchmark_return"]), 2) if pd.notna(row["benchmark_return"]) else 0.0,
            )
            for _, row in merged.iloc[1:].iterrows()
        ]

    # ==================================================================
    # Chart: Rolling Win Rate
    # ==================================================================

    def get_rolling_win_rate(self, trades: List[dict], window: int = 20) -> List[RollingWinRatePoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed or len(closed) < window:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")
        trades_df["is_win"] = trades_df["profit_amount"] > 0

        trades_df = prepare_dataframe_for_json(trades_df)

        result = []
        for i in range(window - 1, len(trades_df)):
            window_trades = trades_df.iloc[max(0, i - window + 1) : i + 1]
            wins = window_trades["is_win"].sum()
            total = len(window_trades)
            win_rate = (wins / total * 100) if total > 0 else 0

            result.append(RollingWinRatePoint(
                date=window_trades.iloc[-1]["date"].date(),
                win_rate=round(float(win_rate), 2),
                winning_trades=int(wins),
                total_trades=int(total),
            ))
        return result

    # ==================================================================
    # Chart: R-Multiple Distribution
    # ==================================================================

    def get_r_multiple_distribution(self, trades: List[dict]) -> List[RMultipleDistribution]:
        closed = [
            t for t in trades
            if t["status"] != TradeStatus.ACTIVE.value and t["risk_amount"] > 0
        ]
        if not closed:
            return []

        r_multiples = [t["profit_amount"] / t["risk_amount"] for t in closed]

        buckets = [
            ("<-3R", lambda x: x < -3),
            ("-3R to -2R", lambda x: -3 <= x < -2),
            ("-2R to -1R", lambda x: -2 <= x < -1),
            ("-1R to 0R", lambda x: -1 <= x < 0),
            ("0R to 1R", lambda x: 0 <= x < 1),
            ("1R to 2R", lambda x: 1 <= x < 2),
            ("2R to 3R", lambda x: 2 <= x < 3),
            (">3R", lambda x: x >= 3),
        ]

        total = len(r_multiples)
        result = []
        for bucket_name, condition in buckets:
            count = sum(1 for r in r_multiples if condition(r))
            if count > 0:
                result.append(RMultipleDistribution(
                    r_bucket=bucket_name,
                    count=count,
                    percentage=round(count / total * 100, 2),
                ))
        return result

    # ==================================================================
    # Chart: Risk-Adjusted Comparison (Sharpe / Sortino — Portfolio vs BTC)
    # ==================================================================

    def get_risk_adjusted_comparison(self, trades: List[dict]) -> List[RiskAdjustedComparison]:
        metrics = self.calculate_metrics(trades)
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])

        start_date = trades_df["date"].min().date()
        end_date = trades_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)

        if benchmark_df.empty or len(benchmark_df) < 2:
            return []

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        benchmark_df = benchmark_df.sort_values("date")
        benchmark_df["return"] = benchmark_df["price"].pct_change()
        btc_returns = benchmark_df["return"].dropna()

        if len(btc_returns) < 2:
            return []

        rf_daily = self.risk_free_rate / 365
        btc_excess = btc_returns - rf_daily
        btc_sharpe = (btc_excess.mean() / btc_returns.std()) * np.sqrt(365) if btc_returns.std() > 0 else 0
        # Use same canonical Sortino method as calculate_sortino_ratio:
        # σᵈ = sqrt(1/N × Σ min(Rᵢ, 0)²) — all observations, floor positives to 0
        btc_downside = np.minimum(btc_returns.values, 0.0)
        btc_downside_dev = np.sqrt((btc_downside ** 2).mean())
        btc_sortino = (btc_excess.mean() / btc_downside_dev) * np.sqrt(365) if btc_downside_dev > 0 else 0

        return [
            RiskAdjustedComparison(
                metric_name="Sharpe Ratio",
                portfolio_value=round(safe_float(metrics.sharpe_ratio), 2),
                benchmark_value=round(safe_float(btc_sharpe), 2),
            ),
            RiskAdjustedComparison(
                metric_name="Sortino Ratio",
                portfolio_value=round(safe_float(metrics.sortino_ratio), 2),
                benchmark_value=round(safe_float(btc_sortino), 2),
            ),
        ]

    # ==================================================================
    # Chart: NAV History
    # ==================================================================

    def get_nav_history(self, trades: List[dict]) -> List[NAVHistoryPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = ensure_timezone_aware(trades_df["date"])
        trades_df = trades_df.sort_values("date")

        # Use daily NAV series (fills gaps between trade dates)
        nav_df = self._calculate_nav_series(trades_df)
        if nav_df.empty:
            return []

        nav_df = prepare_dataframe_for_json(nav_df)

        return [
            NAVHistoryPoint(date=row["date"].date(), nav=round(float(row["nav"]), 2))
            for _, row in nav_df.iterrows()
        ]

    # ==================================================================
    # Chart: Rolling Information Ratio
    # ==================================================================

    def get_rolling_information_ratio(
        self, trades: List[dict], window: int = 20
    ) -> List[RollingInformationRatioPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if len(closed) < 2:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        start_date = trades_df["date"].min().date()
        end_date = trades_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)

        if benchmark_df.empty or len(benchmark_df) < 2:
            return []

        date_range = pd.date_range(start=start_date, end=end_date, freq="D")
        equity_df = pd.DataFrame({"date": date_range})
        equity_df["date"] = pd.to_datetime(equity_df["date"]).dt.tz_localize(KYIV_TZ)

        trades_df["cumulative_pnl"] = trades_df["profit_amount"].cumsum()
        trades_df["nav"] = self.initial_balance + trades_df["cumulative_pnl"]

        equity_df = equity_df.merge(trades_df[["date", "nav"]], on="date", how="left")
        equity_df["nav"] = equity_df["nav"].ffill().fillna(self.initial_balance)
        equity_df["portfolio_return"] = equity_df["nav"].pct_change()

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        equity_df["date_only"] = equity_df["date"].dt.normalize()
        benchmark_df["date_only"] = benchmark_df["date"].dt.normalize()
        merged = equity_df[["date_only", "nav", "portfolio_return"]].merge(
            benchmark_df[["date_only", "price"]], on="date_only", how="inner"
        )
        merged.rename(columns={"date_only": "date"}, inplace=True)

        if len(merged) < window:
            return []

        merged["btc_return"] = merged["price"].pct_change()
        merged["excess_return"] = merged["portfolio_return"] - merged["btc_return"]

        merged["rolling_te"] = merged["excess_return"].rolling(window=window).std() * np.sqrt(365)
        merged["rolling_excess_mean"] = merged["excess_return"].rolling(window=window).mean() * 365
        merged["rolling_ir"] = merged["rolling_excess_mean"] / merged["rolling_te"]

        result_df = merged.dropna(subset=["rolling_ir"])
        result_df = prepare_dataframe_for_json(result_df)

        return [
            RollingInformationRatioPoint(
                date=row["date"].date(),
                information_ratio=round(float(row["rolling_ir"]), 2),
            )
            for _, row in result_df.iterrows()
        ]

    # ==================================================================
    # Chart: Expected vs Actual Return
    # ==================================================================

    def get_expected_vs_actual_return(self, trades: List[dict]) -> List[ExpectedVsActualReturn]:
        metrics = self.calculate_metrics(trades)
        if metrics.expected_return is None:
            return []

        return [
            ExpectedVsActualReturn(metric_name="Expected Return", return_value=round(float(metrics.expected_return), 2)),
            ExpectedVsActualReturn(metric_name="Actual Return", return_value=round(safe_float(metrics.portfolio_return), 2)),
        ]

    # ==================================================================
    # Chart: Comparative Drawdown
    # ==================================================================

    def get_comparative_drawdown(self, trades: List[dict]) -> List[ComparativeDrawdownPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        start_date = trades_df["date"].min().date()
        end_date = trades_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)
        if benchmark_df.empty:
            return []

        trades_df["cumulative_pnl"] = trades_df["profit_amount"].cumsum()
        trades_df["nav"] = self.initial_balance + trades_df["cumulative_pnl"]
        trades_df["hwm"] = trades_df["nav"].expanding().max()
        trades_df["drawdown"] = (trades_df["nav"] - trades_df["hwm"]) / trades_df["hwm"] * 100

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        benchmark_df = benchmark_df.sort_values("date")
        benchmark_df["hwm_btc"] = benchmark_df["price"].expanding().max()
        benchmark_df["btc_drawdown"] = (benchmark_df["price"] - benchmark_df["hwm_btc"]) / benchmark_df["hwm_btc"] * 100

        trades_df["date_only"] = trades_df["date"].dt.normalize()
        benchmark_df["date_only"] = benchmark_df["date"].dt.normalize()
        merged = trades_df[["date_only", "drawdown"]].merge(
            benchmark_df[["date_only", "btc_drawdown"]], on="date_only", how="inner"
        )
        merged.rename(columns={"date_only": "date"}, inplace=True)
        merged = prepare_dataframe_for_json(merged)

        return [
            ComparativeDrawdownPoint(
                date=row["date"].date(),
                portfolio_drawdown=round(float(row["drawdown"]), 2),
                btc_drawdown=round(float(row["btc_drawdown"]), 2),
            )
            for _, row in merged.iterrows()
        ]

    # ==================================================================
    # Chart: NAV vs High Watermark
    # ==================================================================

    def get_nav_vs_high_watermark(self, trades: List[dict]) -> List[NAVvsHighWatermarkPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if not closed:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        trades_df["cumulative_pnl"] = trades_df["profit_amount"].cumsum()
        trades_df["nav"] = self.initial_balance + trades_df["cumulative_pnl"]
        trades_df["hwm"] = trades_df["nav"].expanding().max()

        trades_df = prepare_dataframe_for_json(trades_df)

        return [
            NAVvsHighWatermarkPoint(
                date=row["date"].date(),
                nav=round(float(row["nav"]), 2),
                high_watermark=round(float(row["hwm"]), 2),
            )
            for _, row in trades_df.iterrows()
        ]

    # ==================================================================
    # Chart: Rolling Tracking Error
    # ==================================================================

    def get_rolling_tracking_error(
        self, trades: List[dict], window: int = 20
    ) -> List[RollingTrackingErrorPoint]:
        closed = [t for t in trades if t["status"] != TradeStatus.ACTIVE.value]
        if len(closed) < 2:
            return []

        trades_df = pd.DataFrame(closed)
        trades_df["date"] = pd.to_datetime(trades_df["date"]).dt.tz_localize(KYIV_TZ)
        trades_df = trades_df.sort_values("date")

        start_date = trades_df["date"].min().date()
        end_date = trades_df["date"].max().date()
        benchmark_df = self.fetch_benchmark_data(start_date, end_date)

        if benchmark_df.empty or len(benchmark_df) < 2:
            return []

        date_range = pd.date_range(start=start_date, end=end_date, freq="D")
        equity_df = pd.DataFrame({"date": date_range})
        equity_df["date"] = pd.to_datetime(equity_df["date"]).dt.tz_localize(KYIV_TZ)

        trades_df["cumulative_pnl"] = trades_df["profit_amount"].cumsum()
        trades_df["nav"] = self.initial_balance + trades_df["cumulative_pnl"]

        equity_df = equity_df.merge(trades_df[["date", "nav"]], on="date", how="left")
        equity_df["nav"] = equity_df["nav"].ffill().fillna(self.initial_balance)
        equity_df["portfolio_return"] = equity_df["nav"].pct_change()

        benchmark_df["date"] = ensure_timezone_aware(benchmark_df["date"], KYIV_TZ)
        equity_df["date_only"] = equity_df["date"].dt.normalize()
        benchmark_df["date_only"] = benchmark_df["date"].dt.normalize()
        merged = equity_df[["date_only", "nav", "portfolio_return"]].merge(
            benchmark_df[["date_only", "price"]], on="date_only", how="inner"
        )
        merged.rename(columns={"date_only": "date"}, inplace=True)

        if len(merged) < window:
            return []

        merged["btc_return"] = merged["price"].pct_change()
        merged["excess_return"] = merged["portfolio_return"] - merged["btc_return"]
        merged["rolling_te"] = merged["excess_return"].rolling(window=window).std() * np.sqrt(365) * 100

        result_df = merged.dropna(subset=["rolling_te"])
        result_df = prepare_dataframe_for_json(result_df)

        return [
            RollingTrackingErrorPoint(
                date=row["date"].date(),
                tracking_error=round(float(row["rolling_te"]), 2),
            )
            for _, row in result_df.iterrows()
        ]
