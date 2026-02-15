import { useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid,
} from 'recharts';
import { TIMEFRAMES } from '../../utils/constants';
import { COLORS, fmtCompact, fmtNum, fmtDate, fmtTick } from './chartConstants';
import type { PricePoint } from '../../types';

// ---------------------------------------------------------------------------
// Price chart (top panel in Indicators view)
// ---------------------------------------------------------------------------

interface IndicatorPriceChartProps {
    prices: PricePoint[] | undefined;
    timeframe: string;
}

export default function IndicatorPriceChart({ prices, timeframe }: IndicatorPriceChartProps) {
    const chartData = useMemo(() => {
        if (!prices?.length) return [];
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        if (!tf) return prices;
        const daysBack = tf.weeks === Infinity ? Infinity : tf.weeks * 7;

        let bars = prices;
        if (daysBack !== Infinity) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysBack);
            const cutoffStr = cutoff.toISOString().slice(0, 10);
            bars = prices.filter(p => p.date >= cutoffStr);
        }
        return bars;
    }, [prices, timeframe]);

    if (!chartData.length) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted text-xs uppercase tracking-wider">Цінові дані недоступні</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 60, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis yAxisId="price" orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={55} domain={['auto', 'auto']} />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                            <div className="bg-surface border border-border rounded-sm px-3 py-2 shadow-xl">
                                <div className="text-[10px] text-muted mb-1">{fmtDate(label)}</div>
                                <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-text-secondary">Price</span>
                                    <span className="text-white font-medium font-mono">{fmtNum(d?.close)}</span>
                                </div>
                            </div>
                        );
                    }}
                    cursor={{ stroke: '#262626', strokeDasharray: '3 3' }}
                />
                <Line yAxisId="price" type="monotone" dataKey="close" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Price" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
