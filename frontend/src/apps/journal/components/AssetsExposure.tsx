/**
 * AssetsExposure – pair exposure table with summary stats and PairConcentrationChart modal.
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import MetricInfoModal from './MetricInfoModal';
import PairConcentrationChart from './charts/PairConcentrationChart';
import { useJournalStore } from '../store/useJournalStore';
import { formatDisplayValue } from '../utils/formatters';
import type { AssetsExposureData, PortfolioMetrics } from '../types';

interface Props {
    exposureData: AssetsExposureData[];
    loading: boolean;
    metrics: PortfolioMetrics | undefined;
}

export default function AssetsExposure({ exposureData, loading, metrics }: Props) {
    const displayMode = useJournalStore((s) => s.displayMode);
    const [showChart, setShowChart] = useState(false);

    if (loading) {
        return (
            <Card><CardHeader><CardTitle>Assets Exposure</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-5 w-5 border-t border-b border-white/30" /></div></CardContent>
            </Card>
        );
    }

    if (!exposureData?.length) {
        return (
            <Card><CardHeader><CardTitle>Assets Exposure</CardTitle></CardHeader>
                <CardContent><div className="text-center text-white/[0.22] text-[9px] tracking-[0.25em] uppercase py-8">No exposure data available</div></CardContent>
            </Card>
        );
    }

    const fmtVal = (v: number) => {
        if (displayMode === 'percentage' && metrics?.initial_balance) return formatDisplayValue(v, displayMode, metrics.initial_balance);
        return v.toFixed(2);
    };

    const totalPnl = exposureData.reduce((s, a) => s + a.total_profit, 0);

    return (
        <>
            <Card
                className="relative overflow-hidden group"
            >
                {/* Corner indicator */}
                <div
                    className="absolute top-3 right-3 z-10 w-1.5 h-1.5 rounded-full bg-white/[0.08] group-hover:bg-white/[0.25] transition-colors duration-500 cursor-pointer"
                    onClick={() => setShowChart(true)}
                    title="View chart"
                />
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.02]">
                    <CardTitle>Assets Exposure Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    {['Pair', 'Long', 'Short', 'Long P&L', 'Short P&L', 'Total P&L', 'Win Rate', 'Trades'].map((h) => (
                                        <th key={h} className={`px-5 py-4 text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-white/[0.28] ${h === 'Pair' ? 'text-left' : 'text-right'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {exposureData.map((a, idx) => {
                                    const totalColor = a.total_profit > 0 ? 'text-green-400/80' : a.total_profit < 0 ? 'text-red-400/80' : 'text-white/[0.45]';
                                    return (
                                        <tr key={idx} className="hover:bg-white/[0.025] transition-colors duration-500">
                                            <td className="px-5 py-4 text-[11px] font-medium text-white/[0.65] uppercase">{a.pair}</td>
                                            <td className="px-5 py-4 text-[11px] text-right font-mono">
                                                <div className="flex items-center justify-end gap-2"><TrendingUp size={12} className="text-green-400/50" /><span className="text-white/[0.45]">{a.long_count}</span></div>
                                            </td>
                                            <td className="px-5 py-4 text-[11px] text-right font-mono">
                                                <div className="flex items-center justify-end gap-2"><TrendingDown size={12} className="text-red-400/50" /><span className="text-white/[0.45]">{a.short_count}</span></div>
                                            </td>
                                            <td className={`px-5 py-4 text-[11px] text-right font-mono ${a.long_profit > 0 ? 'text-green-400/80' : a.long_profit < 0 ? 'text-red-400/80' : 'text-white/[0.45]'}`}>
                                                {a.long_profit > 0 ? '+' : ''}{fmtVal(a.long_profit)}
                                            </td>
                                            <td className={`px-5 py-4 text-[11px] text-right font-mono ${a.short_profit > 0 ? 'text-green-400/80' : a.short_profit < 0 ? 'text-red-400/80' : 'text-white/[0.45]'}`}>
                                                {a.short_profit > 0 ? '+' : ''}{fmtVal(a.short_profit)}
                                            </td>
                                            <td className={`px-5 py-4 text-[11px] text-right font-mono font-medium ${totalColor}`}>
                                                {a.total_profit > 0 ? '+' : ''}{fmtVal(a.total_profit)}
                                            </td>
                                            <td className="px-5 py-4 text-[11px] text-right font-mono text-white/[0.45]">{a.win_rate.toFixed(1)}%</td>
                                            <td className="px-5 py-4 text-[11px] text-right font-mono text-white/[0.45]">{a.total_trades}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-2 p-6 border-t border-white/[0.04] grid grid-cols-3 gap-4 bg-white/[0.01]">
                        <div className="text-center">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-white/[0.35] mb-2">Total Pairs</div>
                            <div className="text-2xl font-mono font-light text-white/[0.80]">{exposureData.length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-white/[0.35] mb-2">Total Trades</div>
                            <div className="text-2xl font-mono font-light text-white/[0.80]">{exposureData.reduce((s, a) => s + a.total_trades, 0)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-white/[0.35] mb-2">Total P&L</div>
                            <div className={`text-2xl font-mono font-light ${totalPnl > 0 ? 'text-green-400/90' : totalPnl < 0 ? 'text-red-400/90' : 'text-white/[0.80]'}`}>
                                {displayMode === 'percentage' && metrics?.initial_balance ? fmtVal(totalPnl) : `$${totalPnl.toFixed(2)}`}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {showChart && (
                <MetricInfoModal
                    isOpen={showChart}
                    onClose={() => setShowChart(false)}
                    title="Pair Concentration"
                    description="Shows the distribution of trades across different trading pairs."
                    interpretation={['Higher concentration: indicates specialization in fewer pairs', 'Lower concentration: more diversified trading across pairs']}
                >
                    <PairConcentrationChart exposureData={exposureData} loading={loading} />
                </MetricInfoModal>
            )}
        </>
    );
}
