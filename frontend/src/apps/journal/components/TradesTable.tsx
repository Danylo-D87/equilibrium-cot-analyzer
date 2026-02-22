import type { Trade, PortfolioMetrics } from '../types';
import { useJournalStore } from '../store/useJournalStore';
import { formatDisplayValue } from '../utils/formatters';
import { Card, CardContent } from './ui/Card';

interface TradesTableProps {
    trades?: Trade[];
    loading?: boolean;
    onTradeClick?: (trade: Trade) => void;
    metrics?: PortfolioMetrics;
}

export default function TradesTable({ trades, loading, onTradeClick, metrics }: TradesTableProps) {
    const { displayMode } = useJournalStore();
    const initialBalance = metrics?.initial_balance || 10000;

    if (loading) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-5 w-5 border-t border-b border-bronze/40 mb-4" />
                <div className="text-white/[0.18] text-[8px] tracking-[0.30em] uppercase">Loading data...</div>
            </Card>
        );
    }

    if (!trades?.length) {
        return (
            <Card className="p-12 text-center min-h-[200px] flex items-center justify-center">
                <div className="text-white/[0.15] text-[8px] tracking-[0.30em] uppercase">No trades recorded</div>
            </Card>
        );
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'TP': return 'text-green-400/80';
            case 'SL': return 'text-red-400/80';
            case 'BE':
            case 'Active':
                return 'text-white/[0.80]';
            default: return 'text-white/[0.45]';
        }
    };

    const headers = [
        'Date', 'Pair', 'Portfolio', 'Type', 'Style', 'Direction',
        displayMode === 'percentage' ? 'Risk (%)' : 'Risk ($)',
        'Status', 'RR Target', 'R Multiple',
        displayMode === 'percentage' ? 'PnL (%)' : 'PnL ($)',
    ];

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                {headers.map((h, i) => (
                                    <th key={i} className={`px-6 py-4 text-[8px] font-sans font-medium text-white/[0.25] uppercase tracking-[0.22em] ${i > 5 ? 'text-right' : 'text-left'}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {trades.map((trade, idx) => {
                                const pnl = trade.profit_amount ?? 0;
                                const pnlColor = pnl > 0 ? 'text-green-400/80' : pnl < 0 ? 'text-red-400/80' : 'text-white/[0.45]';
                                const tradeBalance = trade.portfolio_initial_capital || initialBalance;

                                return (
                                    <tr
                                        key={trade.id || idx}
                                        className="hover:bg-white/[0.025] transition-colors duration-500 cursor-pointer group"
                                        onClick={() => onTradeClick?.(trade)}
                                    >
                                        <td className="px-6 py-3.5 text-[11px] text-white/[0.45] font-mono">
                                            {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-3.5 text-[11px] font-medium text-white/[0.75] uppercase tracking-wide group-hover:text-white/[0.95] transition-colors duration-500">{trade.pair}</td>
                                        <td className="px-6 py-3.5 text-[11px] text-white/[0.45]">{trade.portfolio_name || '-'}</td>
                                        <td className="px-6 py-3.5 text-[11px] text-white/[0.45] uppercase">{trade.type || '-'}</td>
                                        <td className="px-6 py-3.5 text-[11px] text-white/[0.45] capitalize">{trade.style || '-'}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`px-2 py-0.5 text-[9px] uppercase font-medium tracking-[0.15em] border ${trade.direction === 'Long' ? 'border-green-500/25 text-green-400/80' : 'border-red-500/25 text-red-400/80'
                                                }`}>
                                                {trade.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-[11px] text-right text-white/[0.45] font-mono">
                                            {formatDisplayValue(Number(trade.risk_amount || 0), displayMode, tradeBalance)}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className={`flex items-center justify-end gap-2 text-[9px] font-medium uppercase tracking-[0.15em] ${getStatusColor(trade.status)}`}>
                                                {trade.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-[11px] text-right text-white/[0.45] font-mono">{trade.rr_ratio || '-'}</td>
                                        <td className="px-6 py-3.5 text-[11px] text-right text-white/[0.65] font-mono">
                                            {trade.risk_amount ? (pnl / trade.risk_amount).toFixed(2) : '0.00'}R
                                        </td>
                                        <td className={`px-6 py-3.5 text-[11px] text-right font-mono font-medium ${pnlColor}`}>
                                            {displayMode === 'percentage'
                                                ? formatDisplayValue(pnl, displayMode, tradeBalance)
                                                : `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
