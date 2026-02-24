/**
 * Block 4 — Distribution Histogram.
 *
 * Bar chart showing the distribution of net positions over the lookback
 * window. The bin containing the current value is highlighted.
 *
 * Plan reference: Section 4.5
 */

import { useMemo } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { D, MARGIN_NARROW, fmtK, TOOLTIP_STYLE } from './chartTheme';
import { extractSeries, buildHistogram } from '../../utils/calculations';
import type { DashboardData } from '../../types/dashboard';
import PricePanel from './PricePanel';

interface DistributionHistogramProps {
    data: DashboardData;
}

export default function DistributionHistogram({ data }: DistributionHistogramProps) {
    const { weeks, specGroupKey, currentPercentile, priceSeries } = data;
    const lookbackWeeks = weeks.length;

    const specNetKey = `${specGroupKey}_net`;
    const currentNet = typeof weeks[0]?.[specNetKey] === 'number' ? (weeks[0][specNetKey] as number) : null;

    const bins = useMemo(() => {
        const series = extractSeries(weeks, specNetKey);
        return buildHistogram(series, lookbackWeeks);
    }, [weeks, specNetKey, lookbackWeeks]);

    if (bins.length === 0) {
        return <div className="h-full flex items-center justify-center text-white/20 text-xs">Not enough data</div>;
    }

    const chartData = bins.map((b) => ({
        label: fmtK((b.min + b.max) / 2),
        midpoint: (b.min + b.max) / 2,
        count: b.count,
        isCurrent: b.isCurrent,
    }));

    return (
        <div className="flex flex-col h-full">
            {/* Price line — 70% */}
            <div className="h-[70%]">
                <PricePanel priceSeries={priceSeries} weeks={weeks} />
            </div>

            {/* Histogram — 30% */}
            <div className="h-[30%] flex flex-col border-t border-white/[0.03]">
                <div className="flex items-center justify-between px-4 pt-1 flex-shrink-0">
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">
                        {lookbackWeeks}w distribution
                    </span>
                    {currentNet != null && (
                        <span className="text-[10px] font-mono text-white/50">
                            Current: <span className={`font-medium ${currentNet > 0 ? 'text-emerald-400' : currentNet < 0 ? 'text-red-400' : 'text-white/60'}`}>
                                {fmtK(currentNet)}
                            </span>
                            <span className="text-white/25 ml-1.5">(P{currentPercentile.toFixed(0)})</span>
                        </span>
                    )}
                </div>
                <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ ...MARGIN_NARROW, bottom: 16 }}>
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 8, fill: D.axis }}
                            axisLine={{ stroke: '#222' }}
                            tickLine={false}
                            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: D.axis }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                        />

                        {/* Current value reference line */}
                        {currentNet != null && (
                            <ReferenceLine
                                x={chartData.find((d) => d.isCurrent)?.label}
                                stroke="#fff"
                                strokeWidth={1.5}
                                strokeDasharray="3 3"
                            />
                        )}

                        <Tooltip
                            {...TOOLTIP_STYLE}
                            formatter={(v: number) => [v, 'Weeks']}
                            labelFormatter={(l) => `Net Position ≈ ${l}`}
                        />

                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                            {chartData.map((entry, idx) => (
                                <Cell
                                    key={idx}
                                    fill={
                                        entry.isCurrent
                                            ? currentPercentile >= 90
                                                ? D.extremeLong
                                                : currentPercentile <= 10
                                                    ? D.extremeShort
                                                    : D.specLine
                                            : 'rgba(255,255,255,0.06)'
                                    }
                                    stroke={entry.isCurrent ? '#fff' : 'transparent'}
                                    strokeWidth={entry.isCurrent ? 1 : 0}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
