/**
 * Indicator 1 — Market Power.
 *
 * Stacked area chart showing Long Power (%) and Short Power (%)
 * as proportions of Open Interest.
 * Threshold reference lines at 30% (dominance indicator).
 * Background alert zones when power exceeds 30%.
 *
 * Plan reference: Section 4.8 — Advanced Indicators
 */

import { useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, Area, ReferenceArea,
    XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { D, MARGIN_NARROW, fmtTick, fmtDateShort, TOOLTIP_STYLE } from './chartTheme';
import type { DashboardData } from '../../types/dashboard';
import PricePanel from './PricePanel';

interface MarketPowerChartProps {
    data: DashboardData;
}

/** Build contiguous date ranges where a given power series exceeds threshold. */
function findAlertZones(
    chartData: { date: string; longPower: number; shortPower: number }[],
    key: 'longPower' | 'shortPower',
    threshold: number,
): { start: string; end: string }[] {
    const zones: { start: string; end: string }[] = [];
    let current: { start: string; end: string } | null = null;

    for (const pt of chartData) {
        if (pt[key] > threshold) {
            if (!current) current = { start: pt.date, end: pt.date };
            else current.end = pt.date;
        } else {
            if (current) {
                zones.push(current);
                current = null;
            }
        }
    }
    if (current) zones.push(current);
    return zones;
}

export default function MarketPowerChart({ data }: MarketPowerChartProps) {
    const { marketPower } = data;

    const chartData = useMemo(
        () =>
            marketPower.map((p) => ({
                date: p.date,
                longPower: +p.longPower.toFixed(1),
                shortPower: +p.shortPower.toFixed(1),
            })),
        [marketPower],
    );

    const latest = chartData[chartData.length - 1];

    // Compute background alert zones where power > 30%
    const longAlertZones = useMemo(() => findAlertZones(chartData, 'longPower', 30), [chartData]);
    const shortAlertZones = useMemo(() => findAlertZones(chartData, 'shortPower', 30), [chartData]);

    if (chartData.length === 0) {
        return <div className="h-full flex items-center justify-center text-white/20 text-xs">No data</div>;
    }

    // Alert badges
    const longAlert = latest && latest.longPower > 30;
    const shortAlert = latest && latest.shortPower > 30;

    return (
        <div className="flex flex-col h-full">
            {/* Price line — 70% */}
            <div className="h-[70%]">
                <PricePanel priceSeries={data.priceSeries} weeks={data.weeks} />
            </div>

            {/* Market Power — 30% */}
            <div className="h-[30%] flex flex-col border-t border-white/[0.03]">
                {/* Latest badges + alerts */}
                <div className="flex items-center gap-3 px-1 pt-1 flex-shrink-0 flex-wrap">
                <span className="text-[10px] text-white/30">Latest:</span>
                <span className="text-[10px] text-emerald-400">
                    L {latest?.longPower ?? 0}%
                </span>
                <span className="text-[10px] text-red-400">
                    S {latest?.shortPower ?? 0}%
                </span>
                {shortAlert && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        ⚠ Short Squeeze Risk
                    </span>
                )}
                {longAlert && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ⚠ Long Liquidation Risk
                    </span>
                )}
            </div>

                <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={MARGIN_NARROW}>
                        <CartesianGrid strokeDasharray="3 3" stroke={D.grid} vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={fmtTick}
                            tick={{ fontSize: 9, fill: D.axis }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            minTickGap={60}
                        />
                        <YAxis
                            orientation="right"
                            tick={{ fontSize: 9, fill: D.axis }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                            domain={[0, 'auto']}
                            tickFormatter={(v: number) => `${v}%`}
                        />

                        {/* Background alert zones: short squeeze risk (red tint) */}
                        {shortAlertZones.map((z, i) => (
                            <ReferenceArea
                                key={`short-${i}`}
                                x1={z.start}
                                x2={z.end}
                                fill="#EF444410"
                                fillOpacity={1}
                                ifOverflow="extendDomain"
                            />
                        ))}

                        {/* Background alert zones: long liquidation risk (green tint) */}
                        {longAlertZones.map((z, i) => (
                            <ReferenceArea
                                key={`long-${i}`}
                                x1={z.start}
                                x2={z.end}
                                fill="#22C55E10"
                                fillOpacity={1}
                                ifOverflow="extendDomain"
                            />
                        ))}

                        <Tooltip
                            {...TOOLTIP_STYLE}
                            labelFormatter={fmtDateShort}
                            formatter={(value: number, name: string) => [
                                `${value.toFixed(1)}%`,
                                name === 'longPower' ? 'Long Power' : 'Short Power',
                            ]}
                        />

                        {/* 30% dominance threshold */}
                        <ReferenceLine y={30} yAxisId={0} stroke={D.warningDiamond} strokeDasharray="4 4" strokeWidth={0.8} />

                        {/* Overlapping areas (independent comparison) */}
                        <Area
                            type="monotone"
                            dataKey="longPower"
                            fill={D.lPower}
                            stroke="rgba(34,197,94,0.6)"
                            strokeWidth={1}
                        />
                        <Area
                            type="monotone"
                            dataKey="shortPower"
                            fill={D.sPower}
                            stroke="rgba(239,68,68,0.6)"
                            strokeWidth={1}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="h-5 flex items-center justify-center gap-4 text-[9px] text-white/30">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(34,197,94,0.5)' }} />
                        Long Power
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.5)' }} />
                        Short Power
                    </span>
                    <span className="text-white/20">— 30% threshold</span>
                </div>
            </div>
        </div>
    );
}
