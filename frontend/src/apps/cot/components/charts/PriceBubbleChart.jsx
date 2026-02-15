import React, { useMemo, useCallback } from 'react';
import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import { TIMEFRAMES } from '../../utils/constants';
import { COLORS, COT_SIGNALS, detectCotSignal, fmtCompact, fmtNum, fmtSigned, fmtDate, fmtTick } from './chartConstants';

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function BubblePriceTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    const sig = d.signalKey ? COT_SIGNALS.find(s => s.key === d.signalKey) : null;
    const periodSig = d.periodSignalKey ? COT_SIGNALS.find(s => s.key === d.periodSignalKey) : null;

    return (
        <div className="bg-surface border border-border rounded-sm px-3 py-2.5 shadow-2xl min-w-[200px]">
            <div className="text-[10px] text-muted mb-1.5 uppercase tracking-wider">{fmtDate(label)}</div>
            {d.close != null && (
                <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">Price</span>
                    <span className="text-white font-medium font-mono">{fmtNum(d.close)}</span>
                </div>
            )}
            {periodSig && !sig && (
                <div className="flex items-center gap-1.5 text-[10px] mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: periodSig.color }} />
                    <span style={{ color: periodSig.color }}>{periodSig.label}</span>
                </div>
            )}
            {sig && (
                <>
                    <div className="h-px bg-border my-1.5" />
                    <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sig.color }} />
                        <span style={{ color: sig.color }} className="font-medium">
                            #{sig.num} {sig.label}
                        </span>
                    </div>
                    <div className="text-[10px] text-muted mb-1.5">{sig.desc}</div>
                    <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                        <span className="text-text-secondary uppercase tracking-wider text-[10px]">ΔNet</span>
                        <span className={d.deltaNet >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.deltaNet)}</span>
                    </div>
                    {d.aggChangeLong != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-text-secondary uppercase tracking-wider text-[10px]">Δ Long</span>
                            <span className={d.aggChangeLong >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.aggChangeLong)}</span>
                        </div>
                    )}
                    {d.aggChangeShort != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-text-secondary uppercase tracking-wider text-[10px]">Δ Short</span>
                            <span className={d.aggChangeShort <= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.aggChangeShort)}</span>
                        </div>
                    )}
                    {d.priceChange != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-text-secondary uppercase tracking-wider text-[10px]">Δ Price</span>
                            <span className={d.priceChange >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.priceChange)}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

export default function PriceBubbleChart({ prices, weeksData, timeframe }) {
    const chartData = useMemo(() => {
        if (!prices?.length) return [];
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        const daysBack = tf.weeks === Infinity ? Infinity : tf.weeks * 7;

        let bars = prices;
        if (daysBack !== Infinity) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysBack);
            const cutoffStr = cutoff.toISOString().slice(0, 10);
            bars = prices.filter(p => p.date >= cutoffStr);
        }

        if (!weeksData?.length || !bars.length) {
            return bars.map(b => ({ date: b.date, close: b.close }));
        }

        // Price lookup map
        const priceMap = new Map(bars.map(p => [p.date, p.close]));
        const priceDateSet = new Set(bars.map(p => p.date));
        const findNearest = (cotDate) => {
            for (let off = 0; off <= 5; off++) {
                const d = new Date(cotDate);
                d.setDate(d.getDate() - off);
                const ds = d.toISOString().slice(0, 10);
                if (priceDateSet.has(ds)) return ds;
            }
            for (let off = 1; off <= 3; off++) {
                const d = new Date(cotDate);
                d.setDate(d.getDate() + off);
                const ds = d.toISOString().slice(0, 10);
                if (priceDateSet.has(ds)) return ds;
            }
            return null;
        };

        // ΔNet = change_long - change_short = agg_change
        const absDeltas = weeksData.map(w => Math.abs(w.agg_change || 0)).filter(v => v > 0).sort((a, b) => a - b);
        const maxAbsDelta = absDeltas.length ? absDeltas[absDeltas.length - 1] : 1;

        // Sort COT entries chronologically for period detection
        const sortedWeeks = [...weeksData].sort((a, b) => a.date.localeCompare(b.date));

        // For each COT week, detect the signal from Price + Longs + Shorts
        const cotSignalEntries = [];
        const bubbleMap = new Map();

        for (let i = 0; i < sortedWeeks.length; i++) {
            const w = sortedWeeks[i];
            if (w.date < bars[0].date) continue;
            const t = findNearest(w.date);
            if (!t) continue;

            const cl = w.agg_change_long || 0;
            const cs = w.agg_change_short || 0;
            const deltaNet = cl - cs;

            // Price direction: compare close at this COT date vs previous COT date
            let priceUp = true;
            let actualPriceChange = null;
            if (i > 0) {
                const prevT = findNearest(sortedWeeks[i - 1].date);
                if (prevT) {
                    const prevClose = priceMap.get(prevT);
                    const currClose = priceMap.get(t);
                    if (prevClose != null && currClose != null) {
                        priceUp = currClose >= prevClose;
                        actualPriceChange = currClose - prevClose;
                    }
                }
            }

            const longsUp = cl >= 0;
            const shortsUp = cs >= 0;
            const sigKey = detectCotSignal(priceUp, longsUp, shortsUp);
            const sig = COT_SIGNALS.find(s => s.key === sigKey);

            const norm = Math.abs(deltaNet) / maxAbsDelta; // 0..1

            cotSignalEntries.push({
                date: w.date,
                signalKey: sigKey,
                color: sig?.color || '#888',
            });

            bubbleMap.set(t, {
                norm,
                deltaNet,
                signalKey: sigKey,
                bubbleColor: sig?.color || '#888',
                aggChangeLong: cl,
                aggChangeShort: cs,
                priceChange: actualPriceChange,
            });
        }

        // Build period map: for each price date, find which COT signal period it belongs to
        const signalPeriods = cotSignalEntries.sort((a, b) => a.date.localeCompare(b.date));

        function getPeriodSignal(priceDate) {
            for (let i = 0; i < signalPeriods.length; i++) {
                if (signalPeriods[i].date >= priceDate) {
                    return signalPeriods[i];
                }
            }
            return signalPeriods.length ? signalPeriods[signalPeriods.length - 1] : null;
        }

        // Create per-signal close fields
        const result = bars.map(b => {
            const bub = bubbleMap.get(b.date);
            const period = getPeriodSignal(b.date);
            const sigKey = period?.signalKey || null;

            const row = {
                date: b.date,
                close: b.close,
                periodSignalKey: sigKey,
            };

            // Assign close to the correct signal's line
            COT_SIGNALS.forEach(s => {
                row[`close_${s.key}`] = sigKey === s.key ? b.close : null;
            });

            // Bubble data on COT report dates
            if (bub && bub.norm >= 0.05) {
                row.bubbleY = b.close;
                row.norm = bub.norm;
                row.signalKey = bub.signalKey;
                row.bubbleColor = bub.bubbleColor;
                row.deltaNet = bub.deltaNet;
                row.aggChangeLong = bub.aggChangeLong;
                row.aggChangeShort = bub.aggChangeShort;
                row.priceChange = bub.priceChange;
            }

            return row;
        });

        // At signal transitions, duplicate the boundary point in both series
        for (let i = 1; i < result.length; i++) {
            const prevSig = result[i - 1].periodSignalKey;
            const currSig = result[i].periodSignalKey;
            if (prevSig && currSig && prevSig !== currSig) {
                result[i][`close_${prevSig}`] = result[i].close;
            }
        }

        return result;
    }, [prices, weeksData, timeframe]);

    // Check if we have any signal data
    const hasSignals = useMemo(() =>
        chartData.some(d => d.periodSignalKey != null),
        [chartData],
    );

    const renderBubble = useCallback((props) => {
        const { cx, cy, payload, index } = props;
        if (cx == null || cy == null || !payload?.bubbleColor) return null;

        const n = payload.norm || 0;
        const minR = 3, maxR = 22;
        const r = minR + n * (maxR - minR);
        const opacity = 0.2 + n * 0.5;

        return (
            <circle
                key={`bub-${index}`}
                cx={cx} cy={cy} r={r}
                fill={payload.bubbleColor}
                fillOpacity={opacity}
                stroke={payload.bubbleColor}
                strokeWidth={1.5}
                strokeOpacity={Math.min(opacity + 0.15, 0.85)}
            />
        );
    }, []);

    const renderBubbleActive = useCallback((props) => {
        const { cx, cy, payload, index } = props;
        if (cx == null || cy == null || !payload?.bubbleColor) return null;

        const n = payload.norm || 0;
        const minR = 5, maxR = 26;
        const r = minR + n * (maxR - minR);

        return (
            <circle
                key={`bub-a-${index}`}
                cx={cx} cy={cy} r={r}
                fill={payload.bubbleColor}
                fillOpacity={0.55}
                stroke={payload.bubbleColor}
                strokeWidth={2}
                strokeOpacity={0.9}
            />
        );
    }, []);

    if (!prices?.length) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted text-xs uppercase tracking-wider">Цінові дані недоступні</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {/* Inline signal legend */}
            <div className="absolute top-0 left-4 z-10 flex flex-wrap gap-x-2.5 gap-y-0.5 items-center max-w-[70%]">
                {COT_SIGNALS.map(s => (
                    <div key={s.key} className="flex items-center gap-1">
                        <svg width="8" height="4"><line x1="0" y1="2" x2="8" y2="2" stroke={s.color} strokeWidth="2" /></svg>
                        <span className="text-[8px] text-muted">#{s.num}</span>
                    </div>
                ))}
                <span className="text-[8px] text-muted ml-0.5">Розмір баблу = |ΔNet|</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 60, bottom: 8, left: 8 }}>
                    <XAxis
                        dataKey="date"
                        tickFormatter={fmtTick}
                        tick={{ fontSize: 10, fill: COLORS.axis }}
                        axisLine={{ stroke: '#1a1a1a' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={80}
                    />
                    <YAxis
                        yAxisId="price"
                        orientation="right"
                        tickFormatter={fmtCompact}
                        tick={{ fontSize: 10, fill: COLORS.axis }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        content={<BubblePriceTooltip />}
                        cursor={{ stroke: '#262626', strokeDasharray: '3 3' }}
                    />
                    {hasSignals ? (
                        COT_SIGNALS.map(s => (
                            <Line
                                key={s.key}
                                yAxisId="price"
                                type="monotone"
                                dataKey={`close_${s.key}`}
                                stroke={s.color}
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                                legendType="none"
                                name={`Price (${s.label})`}
                            />
                        ))
                    ) : (
                        <Line
                            yAxisId="price"
                            type="monotone"
                            dataKey="close"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                            name="Price"
                        />
                    )}
                    <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="bubbleY"
                        stroke="transparent"
                        strokeWidth={0}
                        dot={renderBubble}
                        activeDot={renderBubbleActive}
                        isAnimationActive={false}
                        connectNulls={false}
                        legendType="none"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
