import { useState } from 'react';
import {
    TrendingUp, Activity, Shield, Target, Zap, AlertTriangle,
    DollarSign, BarChart2, Scale, Percent, Gauge,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortfolioMetrics, TradeFilters } from '../types';
import { Card, CardContent } from './ui/Card';
import { useJournalStore } from '../store/useJournalStore';
import { formatDisplayValue, formatNAV } from '../utils/formatters';
import { translations, type LangKey } from '../i18n/translations';
import MetricInfoModal from './MetricInfoModal';
import MetricCardModal from './MetricCardModal';
import {
    AlphaCurveChart, DrawdownChart, RollingMetricsChart, RollingWinRateChart,
    RMultipleDistributionChart, RiskAdjustedComparisonChart, DailyReturnsChart,
    NAVHistoryChart, RollingInformationRatioChart, ExpectedVsActualReturnChart,
    ComparativeDrawdownChart, NAVvsHighWatermarkChart, RollingTrackingErrorChart,
} from './charts';
import {
    useAlphaCurve, useDrawdownChart, useRollingMetricsChart, useRollingWinRate,
    useRMultipleDistribution, useRiskAdjustedComparison, useDailyReturns,
    useNAVHistory, useRollingInformationRatio, useExpectedVsActualReturn,
    useComparativeDrawdown, useNAVvsHighWatermark, useRollingTrackingError,
} from '../hooks/useJournalQueries';

interface MetricsGridProps { metrics: PortfolioMetrics | undefined; filters?: TradeFilters }

export default function MetricsGrid({ metrics, filters }: MetricsGridProps) {
    const { data: alphaCurveData, isLoading: l1 } = useAlphaCurve(filters);
    const { data: drawdownData, isLoading: l2 } = useDrawdownChart(filters);
    const { data: rollingMetricsData, isLoading: l3 } = useRollingMetricsChart(filters);
    const { data: rollingWinRateData, isLoading: l4 } = useRollingWinRate(filters);
    const { data: rMultipleData, isLoading: l5 } = useRMultipleDistribution(filters);
    const { data: riskAdjustedData, isLoading: l6 } = useRiskAdjustedComparison(filters);
    const { data: dailyReturnsData, isLoading: l7 } = useDailyReturns(filters);
    const { data: navHistoryData, isLoading: l8 } = useNAVHistory(filters);
    const { data: rollingInfoRatioData, isLoading: l9 } = useRollingInformationRatio(filters);
    const { data: expectedVsActualData, isLoading: l10 } = useExpectedVsActualReturn(filters);
    const { data: comparativeDrawdownData, isLoading: l11 } = useComparativeDrawdown(filters);
    const { data: navVsHWMData, isLoading: l12 } = useNAVvsHighWatermark(filters);
    const { data: rollingTEData, isLoading: l13 } = useRollingTrackingError(filters);

    if (!metrics) return null;

    const { displayMode } = useJournalStore.getState();
    const ib = metrics.initial_balance || 10000;

    const fmv = (v: number | null | undefined, suffix = '') => {
        if (v === null || v === undefined) return 'N/A';
        if (v === 0 && suffix !== '%' && suffix !== 'R') return 'N/A';
        return `${v.toFixed(2)}${suffix}`;
    };

    const cards: MetricCardData[] = [
        { title: 'TOTAL PROFIT', value: formatDisplayValue(metrics.total_profit || 0, displayMode, ib), icon: DollarSign, trend: (metrics.total_profit ?? 0) >= 0 ? 'positive' : 'negative', subtitle: `${metrics.portfolio_return?.toFixed(2) || '0.00'}% Return`, chart: <DailyReturnsChart data={dailyReturnsData} isLoading={l7} showTitle={false} /> },
        { title: 'EXCESS RETURN', value: metrics.excess_return != null ? `${metrics.excess_return.toFixed(2)}%` : 'N/A', icon: BarChart2, trend: (metrics.excess_return ?? 0) > 0 ? 'positive' : 'negative', subtitle: 'vs Benchmark', chart: <AlphaCurveChart data={alphaCurveData} isLoading={l1} showTitle={false} /> },
        { title: 'CURRENT NAV', value: formatNAV(metrics.current_nav || 0, displayMode, ib), icon: TrendingUp, subtitle: displayMode === 'currency' ? `From $${ib.toLocaleString()}` : 'Initial: 0.00%', chart: <NAVHistoryChart data={navHistoryData} isLoading={l8} showTitle={false} /> },
        { title: 'SHARPE RATIO', value: fmv(metrics.sharpe_ratio), icon: Percent, trend: (metrics.sharpe_ratio ?? 0) > 1 ? 'positive' : 'neutral', subtitle: !metrics.sharpe_ratio ? 'Insufficient Data' : 'Risk/Reward', chart: <RiskAdjustedComparisonChart data={riskAdjustedData} isLoading={l6} showTitle={false} metricType="Sharpe Ratio" /> },
        { title: 'SORTINO RATIO', value: fmv(metrics.sortino_ratio), icon: Shield, trend: (metrics.sortino_ratio ?? 0) > 1 ? 'positive' : (metrics.sortino_ratio ?? 0) > 0 ? 'neutral' : 'negative', subtitle: !metrics.sortino_ratio ? 'Insufficient Data' : 'Downside Risk', chart: <RiskAdjustedComparisonChart data={riskAdjustedData} isLoading={l6} showTitle={false} metricType="Sortino Ratio" /> },
        { title: 'INFO RATIO', value: fmv(metrics.information_ratio), icon: Zap, trend: (metrics.information_ratio ?? 0) > 1 ? 'positive' : (metrics.information_ratio ?? 0) > 0.5 ? 'neutral' : 'negative', subtitle: !metrics.information_ratio ? 'Insufficient Data' : (metrics.ir_interpretation || 'N/A'), chart: <RollingInformationRatioChart data={rollingInfoRatioData} isLoading={l9} showTitle={false} metricValue={metrics.information_ratio} /> },
        { title: 'BETA (β)', value: fmv(metrics.beta), icon: Activity, trend: Math.abs(metrics.beta ?? 0) > 1.5 ? 'negative' : 'neutral', subtitle: !metrics.beta ? 'Insufficient Data' : 'Correlation', chart: <RollingMetricsChart data={rollingMetricsData} isLoading={l3} showTitle={false} metricBeta={metrics.beta} metricSharpe={metrics.sharpe_ratio} /> },
        { title: 'EXP. RETURN', value: metrics.expected_return != null ? `${metrics.expected_return.toFixed(2)}%` : 'N/A', icon: Target, trend: (metrics.expected_return ?? 0) > 0 ? 'positive' : 'negative', subtitle: 'CAPM Model', chart: <ExpectedVsActualReturnChart data={expectedVsActualData} isLoading={l10} showTitle={false} /> },
        { title: 'WIN RATE', value: metrics.win_rate != null ? `${metrics.win_rate.toFixed(1)}%` : 'N/A', icon: Target, subtitle: `${metrics.winning_trades || 0}W / ${metrics.losing_trades || 0}L`, chart: <RollingWinRateChart data={rollingWinRateData} isLoading={l4} showTitle={false} metricValue={metrics.win_rate} winCount={metrics.winning_trades} loseCount={metrics.losing_trades} /> },
        { title: 'MAX DRAWDOWN', value: metrics.max_drawdown_portfolio != null ? `${metrics.max_drawdown_portfolio.toFixed(2)}%` : 'N/A', icon: AlertTriangle, trend: 'negative' as const, subtitle: 'Peak to Trough', chart: <DrawdownChart data={drawdownData} isLoading={l2} showTitle={false} maxDDPortfolio={metrics.max_drawdown_portfolio} maxDDBenchmark={metrics.max_drawdown_benchmark} /> },
        { title: 'DD OUTPERFORM', value: metrics.drawdown_outperformance != null ? `${metrics.drawdown_outperformance.toFixed(2)}%` : 'N/A', icon: Scale, trend: (metrics.drawdown_outperformance ?? 0) > 0 ? 'positive' : 'negative', subtitle: metrics.max_drawdown_benchmark != null ? `vs BTC ${metrics.max_drawdown_benchmark.toFixed(2)}%` : 'N/A', chart: <ComparativeDrawdownChart data={comparativeDrawdownData} isLoading={l11} showTitle={false} maxDDPortfolio={metrics.max_drawdown_portfolio} maxDDBenchmark={metrics.max_drawdown_benchmark} /> },
        { title: 'HIGH WATERMARK', value: formatNAV(metrics.high_watermark || 0, displayMode, ib), icon: TrendingUp, subtitle: 'Historical Peak', chart: <NAVvsHighWatermarkChart data={navVsHWMData} isLoading={l12} showTitle={false} /> },
        { title: 'TRACKING ERROR', value: fmv(metrics.tracking_error, '%'), icon: Activity, subtitle: !metrics.tracking_error ? 'Insufficient Data' : 'Volatility vs BTC', chart: <RollingTrackingErrorChart data={rollingTEData} isLoading={l13} showTitle={false} metricValue={metrics.tracking_error} /> },
        { title: 'TOTAL R MULTIPLE', value: metrics.total_r != null ? `${metrics.total_r.toFixed(2)}R` : 'N/A', icon: Gauge, subtitle: metrics.average_r != null ? `Avg: ${metrics.average_r.toFixed(2)}R` : 'N/A', chart: <RMultipleDistributionChart data={rMultipleData} isLoading={l5} showTitle={false} /> },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {cards.map((card, idx) => (
                <MetricCard key={idx} {...card} />
            ))}
        </div>
    );
}

// ── MetricCard ──

interface MetricCardData {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: 'positive' | 'negative' | 'neutral';
    subtitle: string;
    chart?: React.ReactNode;
}

function MetricCard({ title, value, icon: Icon, trend, subtitle, chart }: MetricCardData) {
    const [showInfo, setShowInfo] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const language = useJournalStore(s => s.language) as LangKey;

    const getMetricInfo = () => {
        const metricTranslation = (translations.metrics as Record<string, Record<LangKey, { title: string; description: string; interpretation: string[]; formula: string }>>)[title];
        if (!metricTranslation) return {};
        const langData = metricTranslation[language] || metricTranslation['en'];
        return langData || {};
    };

    const trendColor = !trend
        ? 'text-white/[0.82]'
        : trend === 'positive'
            ? 'text-green-400/90'
            : trend === 'negative'
                ? 'text-red-400/85'
                : 'text-white/[0.42]';

    return (
        <>
            <Card
                className="group min-h-[100px] flex flex-col justify-center relative overflow-hidden cursor-pointer"
                onClick={() => setShowCardModal(true)}
            >
                {/* Subtle chart indicator */}
                {chart && (
                    <div
                        className="absolute top-3 right-3 z-10 w-1.5 h-1.5 rounded-full bg-white/[0.08] group-hover:bg-white/[0.25] transition-colors duration-500"
                        onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                        title="View chart"
                    />
                )}

                <CardContent className="p-4 flex flex-col gap-2 relative">
                    {/* Title row */}
                    <div className="flex justify-between items-start gap-2">
                        <span className="text-[8.5px] uppercase tracking-[0.24em] font-sans font-medium text-white/[0.32] truncate">{title}</span>
                        <Icon size={12} className="text-white/[0.14] group-hover:text-white/[0.28] flex-shrink-0 transition-colors duration-700 mt-px" />
                    </div>
                    {/* Main value */}
                    <div className={`text-[14px] font-mono tracking-tight font-light leading-none ${trendColor} truncate`}>{value}</div>
                    {/* Subtitle row */}
                    <div className="flex items-center overflow-hidden">
                        <span className="text-[8px] text-white/[0.22] uppercase tracking-wider truncate">{subtitle}</span>
                    </div>
                </CardContent>
            </Card>

            <MetricCardModal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title={title} value={value} subtitle={subtitle} icon={Icon} />

            {showInfo && (
                <MetricInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} {...getMetricInfo()}>
                    {chart}
                </MetricInfoModal>
            )}
        </>
    );
}
