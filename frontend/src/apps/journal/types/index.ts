/**
 * TypeScript types for the Journal module.
 * Maps 1:1 with backend Pydantic schemas (backend/app/modules/journal/schemas.py).
 */

// ── Enums ──────────────────────────────────────────────

export type TradeType = 'Option' | 'Futures';
export type TradeStyle = 'Swing' | 'Intraday' | 'Smart Idea';
export type TradeDirection = 'Long' | 'Short';
export type TradeStatus = 'TP' | 'SL' | 'BE' | 'Active';

// ── Settings ───────────────────────────────────────────

export interface JournalSettings {
    initial_balance: number;
    risk_free_rate: number;
    default_currency: string;
    display_mode: 'currency' | 'percentage';
    nickname?: string | null;
}

export interface JournalSettingsUpdate {
    initial_balance?: number;
    risk_free_rate?: number;
    default_currency?: string;
    display_mode?: 'currency' | 'percentage';
    nickname?: string | null;
}

// ── Portfolios ─────────────────────────────────────────

export interface Portfolio {
    id: string;
    name: string;
    initial_capital: number;
    description: string | null;
    is_active: boolean;
    total_profit: number;
    total_trades: number;
    current_capital: number;
    created_at: string | null;
}

export interface PortfolioCreate {
    name: string;
    initial_capital: number;
    description?: string | null;
    is_active?: boolean;
}

export interface PortfolioUpdate {
    name?: string;
    initial_capital?: number;
    description?: string | null;
    is_active?: boolean;
}

// ── Trade Images ───────────────────────────────────────

export interface TradeImage {
    id: string;
    filename: string;
    storage_path: string;
    sort_order: number;
    file_size: number | null;
    mime_type: string | null;
    caption: string | null;
    created_at: string | null;
}

// ── Trades ─────────────────────────────────────────────

export interface Trade {
    id: string;
    date: string;
    pair: string;
    type: TradeType | null;
    style: TradeStyle | null;
    direction: TradeDirection | null;
    status: TradeStatus | null;
    risk_amount: number | null;
    profit_amount: number | null;
    rr_ratio: number | null;
    entry_price: number | null;
    exit_price: number | null;
    notes: string | null;
    portfolio_id: string | null;
    portfolio_name: string | null;
    portfolio_initial_capital: number | null;
    images: TradeImage[];
    created_at: string | null;
    updated_at: string | null;
}

export interface TradeCreate {
    date: string;
    pair: string;
    type?: TradeType | null;
    style?: TradeStyle | null;
    direction?: TradeDirection | null;
    status?: TradeStatus | null;
    risk_amount: number;
    profit_amount: number;
    rr_ratio: number;
    notes?: string | null;
    portfolio_id: string;
    entry_price?: number | null;
    exit_price?: number | null;
}

export interface TradeUpdate {
    date?: string;
    pair?: string;
    type?: TradeType;
    style?: TradeStyle;
    direction?: TradeDirection;
    status?: TradeStatus;
    risk_amount?: number;
    profit_amount?: number;
    rr_ratio?: number;
    notes?: string | null;
    portfolio_id?: string;
    entry_price?: number | null;
    exit_price?: number | null;
}

export interface PaginatedTrades {
    items: Trade[];
    total: number;
    limit: number;
    offset: number;
}

export interface OrphanSummary {
    count: number;
    total_profit: number;
    unique_portfolio_ids: string[];
}

// ── Metrics ────────────────────────────────────────────

export interface PortfolioMetrics {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    initial_balance: number;
    current_nav: number;
    total_profit: number;
    portfolio_return: number;
    high_watermark: number;
    benchmark_return: number;
    excess_return: number;
    max_drawdown_portfolio: number;
    max_drawdown_benchmark: number;
    drawdown_outperformance: number;
    beta: number;
    expected_return: number;
    information_ratio: number;
    tracking_error: number;
    sharpe_ratio: number;
    sortino_ratio: number | null;
    correlation_30d: number;
    excess_return_30d_annualized: number;
    sharpe_30d: number;
    sortino_30d: number | null;
    total_r: number;
    average_r: number;
    ir_interpretation: string;
    risk_level: string;
}

// ── Chart data points ──────────────────────────────────

export interface EquityCurvePoint {
    date: string;
    portfolio_nav: number;
    benchmark_nav: number;
    portfolio_drawdown: number;
    benchmark_drawdown: number;
}

export interface AssetsExposureData {
    pair: string;
    long_count: number;
    short_count: number;
    long_profit: number;
    short_profit: number;
    total_profit: number;
    win_rate: number;
    total_trades: number;
}

export interface AlphaCurvePoint {
    date: string;
    cumulative_alpha: number;
}

export interface DrawdownPoint {
    date: string;
    portfolio_drawdown: number;
    benchmark_drawdown: number;
}

export interface RollingMetricsPoint {
    date: string;
    rolling_beta: number | null;
    rolling_correlation: number | null;
    rolling_sharpe: number | null;
}

export interface DailyReturnPoint {
    date: string;
    portfolio_return: number;
    benchmark_return: number;
}

export interface RollingWinRatePoint {
    date: string;
    win_rate: number;
    winning_trades: number;
    total_trades: number;
}

export interface RMultipleDistribution {
    r_bucket: string;
    count: number;
    percentage: number;
}

export interface RiskAdjustedComparison {
    metric_name: string;
    portfolio_value: number;
    benchmark_value: number;
}

export interface NAVHistoryPoint {
    date: string;
    nav: number;
}

export interface RollingInformationRatioPoint {
    date: string;
    information_ratio: number;
}

export interface ExpectedVsActualReturn {
    metric_name: string;
    return_value: number;
}

export interface ComparativeDrawdownPoint {
    date: string;
    portfolio_drawdown: number;
    btc_drawdown: number;
}

export interface NAVvsHighWatermarkPoint {
    date: string;
    nav: number;
    high_watermark: number;
}

export interface RollingTrackingErrorPoint {
    date: string;
    tracking_error: number;
}

// ── Filter params ──────────────────────────────────────

export interface TradeFilters {
    type?: string[];
    style?: string[];
    date_from?: string;
    date_to?: string;
    portfolio_id?: string[];
}

// ── Tab ────────────────────────────────────────────────

export type DashboardTab = 'main' | 'trades' | 'live';
export type DisplayMode = 'currency' | 'percentage';
