/**
 * LiveAssetsExposure – active (open) positions exposure summary.
 * Groups active trades by pair and shows long/short exposure.
 */

import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useJournalStore } from '../store/useJournalStore';
import { formatDisplayValue } from '../utils/formatters';
import type { Trade, PortfolioMetrics } from '../types';

interface Props {
    trades: Trade[];
    loading: boolean;
    metrics: PortfolioMetrics | undefined;
}

interface PairExposure {
    pair: string;
    longExposure: number;
    shortExposure: number;
    longCount: number;
    shortCount: number;
    totalRisk: number;
}

export default function LiveAssetsExposure({ trades, loading, metrics }: Props) {
    const displayMode = useJournalStore((s) => s.displayMode);

    if (loading) {
        return (
            <Card><CardHeader><CardTitle>Live Assets Exposure</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" /></div></CardContent>
            </Card>
        );
    }

    const activeTrades = trades?.filter((t) => t.status === 'Active') ?? [];

    if (!activeTrades.length) {
        return (
            <Card><CardHeader><CardTitle>Live Assets Exposure</CardTitle></CardHeader>
                <CardContent><div className="text-center text-text-secondary text-sm py-8">No active positions</div></CardContent>
            </Card>
        );
    }

    const byPair: Record<string, PairExposure> = {};
    activeTrades.forEach((t) => {
        if (!byPair[t.pair]) byPair[t.pair] = { pair: t.pair, longExposure: 0, shortExposure: 0, longCount: 0, shortCount: 0, totalRisk: 0 };
        const risk = Number(t.risk_amount ?? 0);
        byPair[t.pair].totalRisk += risk;
        if (t.direction === 'Long') { byPair[t.pair].longExposure += risk; byPair[t.pair].longCount++; }
        else if (t.direction === 'Short') { byPair[t.pair].shortExposure += risk; byPair[t.pair].shortCount++; }
    });

    const exposureData = Object.values(byPair).sort((a, b) => b.totalRisk - a.totalRisk);
    const totalLong = exposureData.reduce((s, e) => s + e.longExposure, 0);
    const totalShort = exposureData.reduce((s, e) => s + e.shortExposure, 0);
    const totalExposure = totalLong + totalShort;
    const netExposure = totalLong - totalShort;

    const fmtVal = (v: number) => {
        if (displayMode === 'percentage' && metrics?.initial_balance) return formatDisplayValue(v, displayMode, metrics.initial_balance);
        return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/[0.02]">
                <CardTitle>Live Assets Exposure</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-px bg-white/[0.02] border-b border-white/[0.04]">
                    <div className="bg-background/50 p-5">
                        <div className="text-[9px] font-sans font-medium text-white/[0.35] uppercase tracking-[0.2em] mb-2">Total Exposure</div>
                        <div className="text-xl font-light text-white/[0.85] font-mono">{fmtVal(totalExposure)}</div>
                    </div>
                    <div className="bg-background/50 p-5">
                        <div className="text-[9px] font-sans font-medium text-white/[0.35] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5"><TrendingUp size={10} className="text-green-400/70" /> Long</div>
                        <div className="text-xl font-light text-green-400/90 font-mono">{fmtVal(totalLong)}</div>
                    </div>
                    <div className="bg-background/50 p-5">
                        <div className="text-[9px] font-sans font-medium text-white/[0.35] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5"><TrendingDown size={10} className="text-red-400/70" /> Short</div>
                        <div className="text-xl font-light text-red-400/90 font-mono">{fmtVal(totalShort)}</div>
                    </div>
                    <div className="bg-background/50 p-5">
                        <div className="text-[9px] font-sans font-medium text-white/[0.35] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5"><AlertCircle size={10} className={netExposure > 0 ? 'text-green-400/70' : netExposure < 0 ? 'text-red-400/70' : 'text-white/[0.35]'} /> Net</div>
                        <div className={`text-xl font-light font-mono ${netExposure > 0 ? 'text-green-400/90' : netExposure < 0 ? 'text-red-400/90' : 'text-white/[0.85]'}`}>
                            {netExposure > 0 ? '+' : ''}{fmtVal(netExposure)}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.04]">
                                {['Pair', 'Long Exposure', 'Short Exposure', 'Net Exposure', 'Total Risk', 'Positions'].map((h) => (
                                    <th key={h} className={`px-5 py-4 text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-white/[0.28] ${h === 'Pair' ? 'text-left' : 'text-right'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {exposureData.map((e, idx) => {
                                const net = e.longExposure - e.shortExposure;
                                return (
                                    <tr key={idx} className="hover:bg-white/[0.025] transition-colors duration-500">
                                        <td className="px-5 py-4 text-[11px] font-medium text-white/[0.65] uppercase">{e.pair}</td>
                                        <td className="px-5 py-4 text-[11px] text-right font-mono text-green-400/80">
                                            {e.longExposure > 0 ? fmtVal(e.longExposure) : '-'}
                                            {e.longCount > 0 && <span className="text-[9px] text-white/[0.35] ml-2">({e.longCount})</span>}
                                        </td>
                                        <td className="px-5 py-4 text-[11px] text-right font-mono text-red-400/80">
                                            {e.shortExposure > 0 ? fmtVal(e.shortExposure) : '-'}
                                            {e.shortCount > 0 && <span className="text-[9px] text-white/[0.35] ml-2">({e.shortCount})</span>}
                                        </td>
                                        <td className={`px-5 py-4 text-[11px] text-right font-mono font-medium ${net > 0 ? 'text-green-400/80' : net < 0 ? 'text-red-400/80' : 'text-white/[0.45]'}`}>
                                            {net > 0 ? '+' : ''}{fmtVal(net)}
                                        </td>
                                        <td className="px-5 py-4 text-[11px] text-right font-mono text-white/[0.65]">{fmtVal(e.totalRisk)}</td>
                                        <td className="px-5 py-4 text-[11px] text-right text-white/[0.45]">{e.longCount + e.shortCount}</td>
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
