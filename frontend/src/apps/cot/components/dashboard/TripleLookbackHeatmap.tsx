/**
 * Triple Lookback Heatmap — Multi-timeframe percentile alignment.
 *
 * CSS Grid matrix:
 *   Rows: 1Y (52w), 3Y (156w), 5Y (252w)
 *   Cols: Net Position, Percentile, Z-Score
 *
 * Cell colors:
 *   Neutral   (25–75 percentile) → gray
 *   Long Ext  (>90)              → bright green
 *   Short Ext (<10)              → bright red
 *   Moderate  (75–90 / 10–25)    → moderate shade
 *
 * Alignment alert when all 3 timeframes are in the same extreme.
 *
 * Plan reference: Section 4.12
 */

import type { TripleLookbackRow, DashboardData } from '../../types/dashboard';
import { fmtK } from './chartTheme';
import PricePanel from './PricePanel';

// ─── Color helpers ───────────────────────────────────────────

function cellColor(percentile: number): { bg: string; text: string } {
    if (percentile >= 90) return { bg: 'rgba(239,68,68,0.25)', text: '#f87171' };
    if (percentile >= 75) return { bg: 'rgba(239,68,68,0.10)', text: '#fb923c' };
    if (percentile <= 10) return { bg: 'rgba(34,197,94,0.25)', text: '#4ade80' };
    if (percentile <= 25) return { bg: 'rgba(34,197,94,0.10)', text: '#22c55e' };
    return { bg: 'rgba(255,255,255,0.03)', text: 'rgba(255,255,255,0.45)' };
}

function zColor(z: number): string {
    const abs = Math.abs(z);
    if (abs >= 2) return z > 0 ? '#ef4444' : '#22c55e';
    if (abs >= 1.5) return '#f59e0b';
    return 'rgba(255,255,255,0.45)';
}

// ─── Alignment detection ─────────────────────────────────────

function detectAlignment(rows: TripleLookbackRow[]): string | null {
    if (rows.length < 3) return null;
    if (rows.every((r) => r.percentile >= 90)) {
        return 'All timeframes aligned at Long Extreme';
    }
    if (rows.every((r) => r.percentile <= 10)) {
        return 'All timeframes aligned at Short Extreme';
    }
    return null;
}

// ─── Component ───────────────────────────────────────────────

interface TripleLookbackHeatmapProps {
    data: DashboardData;
}

export default function TripleLookbackHeatmap({ data }: TripleLookbackHeatmapProps) {
    const { tripleLookback } = data;
    if (!tripleLookback?.length) {
        return (
            <div className="h-full flex items-center justify-center">
                <span className="text-white/20 text-xs tracking-wider uppercase">No lookback data</span>
            </div>
        );
    }

    const alignment = detectAlignment(tripleLookback);

    return (
        <div className="flex flex-col h-full">
            {/* Price panel — 70% */}
            <div className="h-[70%]">
                <PricePanel priceSeries={data.priceSeries} weeks={data.weeks} />
            </div>

            {/* Heatmap — 30% */}
            <div className="h-[30%] overflow-auto border-t border-white/[0.03] p-2 space-y-1">
            {/* Alignment alert */}
            {alignment && (
                <div className="px-3 py-1.5 rounded text-[10px] font-medium tracking-wide bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center">
                    <span className="mr-1">{'🚨'}</span>
                    Historic Reversal Zone — {alignment}
                </div>
            )}

            {/* Heatmap grid */}
            <div className="grid grid-cols-[72px_1fr_1fr_1fr] gap-px bg-white/[0.03] rounded overflow-hidden">
                {/* Header row */}
                <div className="bg-[#0a0a0a] p-2" />
                <HeaderCell label="Net Position" />
                <HeaderCell label="Percentile" />
                <HeaderCell label="Z-Score" />

                {/* Data rows */}
                {tripleLookback.map((row) => {
                    const pColor = cellColor(row.percentile);
                    const zBg = cellColor(row.percentile); // color the Z cell by percentile zone too
                    return (
                        <div key={row.label} className="contents">
                            {/* Row label */}
                            <div className="bg-[#0a0a0a] p-2 flex items-center">
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                                    {row.label}
                                </span>
                            </div>

                            {/* Net Position */}
                            <div
                                className="p-2 flex items-center justify-center"
                                style={{ backgroundColor: pColor.bg }}
                            >
                                <span className="font-mono text-[12px] font-semibold" style={{ color: pColor.text }}>
                                    {fmtK(row.netPosition)}
                                </span>
                            </div>

                            {/* Percentile */}
                            <div
                                className="p-2 flex items-center justify-center gap-1.5"
                                style={{ backgroundColor: pColor.bg }}
                            >
                                {/* Mini bar */}
                                <div className="w-10 h-[4px] rounded-full overflow-hidden bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.max(3, row.percentile)}%`,
                                            backgroundColor: pColor.text,
                                        }}
                                    />
                                </div>
                                <span className="font-mono text-[12px] font-semibold" style={{ color: pColor.text }}>
                                    {row.percentile.toFixed(0)}
                                </span>
                            </div>

                            {/* Z-Score */}
                            <div
                                className="p-2 flex items-center justify-center"
                                style={{ backgroundColor: zBg.bg }}
                            >
                                <span
                                    className="font-mono text-[12px] font-semibold"
                                    style={{ color: zColor(row.zScore) }}
                                >
                                    {row.zScore > 0 ? '+' : ''}
                                    {row.zScore.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
    );
}

function HeaderCell({ label }: { label: string }) {
    return (
        <div className="bg-[#0a0a0a] p-2 flex items-center justify-center">
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-medium">{label}</span>
        </div>
    );
}
