import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    Legend,
} from 'recharts';
import { formatNumber, formatCompact, formatSigned, formatDateShort, formatDateTick } from '../utils/formatters';
import { TIMEFRAMES, CHART_COLORS, GROUP_COLOR_PALETTE } from '../utils/constants';
import { useEscapeKey } from '@/hooks/useEscapeKey';

// =====================================================
// Constants
// =====================================================

const GROUPS_FALLBACK = [
    { key: 'g1', label: 'G1', full: 'Group 1', color: '#10b981' },
    { key: 'g2', label: 'G2', full: 'Group 2', color: '#f59e0b' },
    { key: 'g3', label: 'G3', full: 'Group 3', color: '#ef4444' },
];

function buildGroupsMeta(dataGroups) {
    if (!dataGroups || !dataGroups.length) return GROUPS_FALLBACK;
    return dataGroups.map((g, i) => ({
        key: g.key,
        label: g.short,
        full: g.name,
        color: GROUP_COLOR_PALETTE[i] || GROUP_COLOR_PALETTE[i % GROUP_COLOR_PALETTE.length],
    }));
}

function buildGroupColors(groupsMeta) {
    const colors = {};
    for (const g of groupsMeta) colors[g.key] = g.color;
    return colors;
}

const COLORS = CHART_COLORS;

// 8-signal COT matrix: Price + Longs + Shorts
const COT_SIGNALS = [
    // Bullish group
    { key: 'strongBullish', num: 1, label: 'Strong Bullish', desc: 'Price↑ Long↑ Short↓', color: '#22c55e', group: 'bullish' },
    { key: 'accumulation', num: 2, label: 'Accumulation', desc: 'Price↓ Long↑ Short↓', color: '#10b981', group: 'bullish' },
    { key: 'floorBuilding', num: 3, label: 'Floor Building', desc: 'Price↓ Long↑ Short↑', color: '#84cc16', group: 'bullish' },
    // Bearish group
    { key: 'strongBearish', num: 4, label: 'Strong Bearish', desc: 'Price↓ Long↓ Short↑', color: '#ef4444', group: 'bearish' },
    { key: 'distribution', num: 5, label: 'Distribution', desc: 'Price↑ Long↓ Short↑', color: '#dc2626', group: 'bearish' },
    { key: 'toppingOut', num: 6, label: 'Topping Out', desc: 'Price↑ Long↑ Short↑', color: '#f97316', group: 'bearish' },
    // Exhaustion group
    { key: 'profitTaking', num: 7, label: 'Profit Taking', desc: 'Price↑ Long↓ Short↓', color: '#38bdf8', group: 'exhaustion' },
    { key: 'liquidation', num: 8, label: 'Liquidation', desc: 'Price↓ Long↓ Short↓', color: '#a855f7', group: 'exhaustion' },
];

function detectCotSignal(priceUp, longsUp, shortsUp) {
    if (priceUp && longsUp && !shortsUp) return 'strongBullish';
    if (!priceUp && longsUp && !shortsUp) return 'accumulation';
    if (!priceUp && longsUp && shortsUp) return 'floorBuilding';
    if (!priceUp && !longsUp && shortsUp) return 'strongBearish';
    if (priceUp && !longsUp && shortsUp) return 'distribution';
    if (priceUp && longsUp && shortsUp) return 'toppingOut';
    if (priceUp && !longsUp && !shortsUp) return 'profitTaking';
    return 'liquidation';
}

const COT_INDEX_PERIODS = [
    { key: '3m', label: '3M' },
    { key: '1y', label: '1Y' },
    { key: '3y', label: '3Y' },
];

const INDICATOR_TYPES = [
    { key: 'cot_index', label: 'COT Index' },
    { key: 'wci', label: 'WCI' },
];

// Aliases for brevity within this file
const fmtCompact = formatCompact;
const fmtNum = formatNumber;
const fmtSigned = formatSigned;
const fmtDate = formatDateShort;
const fmtTick = formatDateTick;

// =====================================================
// Net Positions Chart
// =====================================================

function NetPositionsChart({ chartData, groupsMeta, groupColors }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: COLORS.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={60} />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<NetTooltip />} />
                <Legend verticalAlign="top" height={28} iconType="line" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                {groupsMeta.map(g => (
                    <Line key={g.key} type="monotone" dataKey={`${g.key}_net`} name={g.full} stroke={g.color} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: g.color }} />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    );
}

function NetTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-[#525252] mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)}</div>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[#a3a3a3] min-w-[80px]">{entry.name}</span>
                    <span className="text-white font-medium font-mono">{fmtNum(entry.value)}</span>
                </div>
            ))}
        </div>
    );
}

// =====================================================
// Indicator Chart (COT Index / WCI) — bottom panel
// =====================================================

function IndicatorChart({ chartData, indicatorType, period, groupsMeta, activeGroups }) {
    const getDataKey = (gk) => {
        if (indicatorType === 'wci') return `wci_${gk}`;
        return `cot_index_${gk}_${period}`;
    };

    const visibleGroups = groupsMeta.filter(g => activeGroups.includes(g.key));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 60, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: COLORS.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={40} ticks={[0, 20, 50, 80, 100]} orientation="right" />
                <Tooltip content={<IndicatorTooltip indicatorType={indicatorType} />} cursor={{ stroke: '#262626', strokeDasharray: '3 3' }} />
                <ReferenceLine y={80} stroke="#10b98133" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke={COLORS.zero} strokeDasharray="4 4" />
                <ReferenceLine y={20} stroke="#ef444433" strokeDasharray="3 3" />
                {visibleGroups.map(g => (
                    <Line key={g.key} type="monotone" dataKey={getDataKey(g.key)} name={g.full} stroke={g.color} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: g.color }} connectNulls />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    );
}

function IndicatorTooltip({ active, payload, label, indicatorType }) {
    if (!active || !payload?.length) return null;
    const title = indicatorType === 'wci' ? 'WCI' : 'COT Index';
    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-[#525252] mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)} · {title}</div>
            {payload.filter(e => e.value != null).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[#a3a3a3] min-w-[80px]">{entry.name}</span>
                    <span className="text-white font-medium font-mono">{Math.round(entry.value)}%</span>
                </div>
            ))}
        </div>
    );
}

// =====================================================
// Lines Tooltip (Recharts)
// =====================================================

function LinesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-[#525252] mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)}</div>
            {payload.filter(e => e.value != null).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    {e.strokeDasharray ? (
                        <svg width="10" height="2"><line x1="0" y1="1" x2="10" y2="1" stroke={e.color} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                    ) : (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    )}
                    <span className="text-[#a3a3a3] min-w-[100px]">{e.name}</span>
                    <span className="text-white font-medium font-mono">{fmtNum(e.value)}</span>
                </div>
            ))}
        </div>
    );
}

// =====================================================
// Price Chart (top panel for Indicators mode)
// =====================================================

function IndicatorPriceChart({ prices, timeframe }) {
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
        return bars;
    }, [prices, timeframe]);

    if (!chartData.length) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-[#525252] text-xs uppercase tracking-wider">Цінові дані недоступні</p>
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
                            <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2 shadow-xl">
                                <div className="text-[10px] text-[#525252] mb-1">{fmtDate(label)}</div>
                                <div className="flex items-center justify-between gap-3 text-[11px]">
                                    <span className="text-[#a3a3a3]">Price</span>
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

// =====================================================
// Price + Bubble Chart (Recharts)
// =====================================================

function BubblePriceTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    const sig = d.signalKey ? COT_SIGNALS.find(s => s.key === d.signalKey) : null;
    const periodSig = d.periodSignalKey ? COT_SIGNALS.find(s => s.key === d.periodSignalKey) : null;

    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2.5 shadow-2xl min-w-[200px]">
            <div className="text-[10px] text-[#525252] mb-1.5 uppercase tracking-wider">{fmtDate(label)}</div>
            {d.close != null && (
                <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                    <span className="text-[#a3a3a3] uppercase tracking-wider text-[10px]">Price</span>
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
                    <div className="h-px bg-[#262626] my-1.5" />
                    <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sig.color }} />
                        <span style={{ color: sig.color }} className="font-medium">
                            #{sig.num} {sig.label}
                        </span>
                    </div>
                    <div className="text-[10px] text-[#525252] mb-1.5">{sig.desc}</div>
                    <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                        <span className="text-[#a3a3a3] uppercase tracking-wider text-[10px]">ΔNet</span>
                        <span className={d.deltaNet >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.deltaNet)}</span>
                    </div>
                    {d.aggChangeLong != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-[#a3a3a3] uppercase tracking-wider text-[10px]">Δ Long</span>
                            <span className={d.aggChangeLong >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.aggChangeLong)}</span>
                        </div>
                    )}
                    {d.aggChangeShort != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-[#a3a3a3] uppercase tracking-wider text-[10px]">Δ Short</span>
                            <span className={d.aggChangeShort <= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.aggChangeShort)}</span>
                        </div>
                    )}
                    {d.priceChange != null && (
                        <div className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                            <span className="text-[#a3a3a3] uppercase tracking-wider text-[10px]">Δ Price</span>
                            <span className={d.priceChange >= 0 ? 'text-green-400 font-medium font-mono' : 'text-red-400 font-medium font-mono'}>{fmtSigned(d.priceChange)}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function PriceBubbleChart({ prices, weeksData, timeframe }) {
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
            const deltaNet = cl - cs; // = agg_change

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
                // Connect the previous signal's line to this point
                result[i][`close_${prevSig}`] = result[i].close;
            }
        }

        return result;
    }, [prices, weeksData, timeframe]);

    // Check if we have any signal data
    const hasSignals = useMemo(() =>
        chartData.some(d => d.periodSignalKey != null),
        [chartData]
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
                <p className="text-[#525252] text-xs uppercase tracking-wider">Цінові дані недоступні</p>
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
                        <span className="text-[8px] text-[#525252]">#{s.num}</span>
                    </div>
                ))}
                <span className="text-[8px] text-[#525252] ml-0.5">Розмір баблу = |ΔNet|</span>
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

// =====================================================
// Delta Histogram (Recharts bars for bubbles view)
// =====================================================

function DeltaHistogram({ weeksData, timeframe, activeGroups, groupsMeta }) {
    const chartData = useMemo(() => {
        if (!weeksData?.length) return [];
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        const weeks = [...weeksData].map(w => {
            const transformed = { ...w };
            activeGroups.forEach(g => {
                const longVal = w[`${g}_change_long`] || 0;
                const shortVal = w[`${g}_change_short`] || 0;
                const netDelta = longVal - shortVal;
                transformed[`${g}_delta`] = Math.abs(netDelta);
                transformed[`${g}_delta_original`] = netDelta;
                transformed[`${g}_change_long_original`] = longVal;
                transformed[`${g}_change_short_original`] = shortVal;
            });
            return transformed;
        });
        return tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
    }, [weeksData, timeframe, activeGroups]);

    const renderBar = (props, group) => {
        const { x, y, width, height, payload } = props;
        if (!payload) return null;
        const netDelta = payload[`${group}_delta_original`];
        if (netDelta == null || netDelta === 0) return null;
        const color = netDelta > 0 ? '#22c55e' : '#ef4444';
        return (
            <rect x={x} y={y} width={width} height={Math.abs(height)} fill={color} opacity={0.75} />
        );
    };

    if (!weeksData?.length) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 60, bottom: 8, left: 8 }}>
                <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: '#1a1a1a' }} tickLine={false} interval="preserveStartEnd" minTickGap={80} />
                <YAxis orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        if (!d) return null;
                        return (
                            <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2 shadow-xl min-w-[160px]">
                                <div className="text-[10px] text-[#525252] mb-1.5">{fmtDate(label)}</div>
                                {activeGroups.map(gk => {
                                    const g = groupsMeta.find(x => x.key === gk);
                                    const chl = d[`${gk}_change_long_original`];
                                    const chs = d[`${gk}_change_short_original`];
                                    const delta = d[`${gk}_delta_original`];
                                    if (delta == null) return null;
                                    return (
                                        <div key={gk} className="mb-1.5">
                                            <div className="text-[10px] font-medium mb-0.5" style={{ color: g.color }}>{g.full}</div>
                                            <div className="flex items-center justify-between gap-3 text-[11px] mb-0.5">
                                                <span className="text-[#a3a3a3]">Net Δ</span>
                                                <span className={delta > 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{fmtSigned(delta)}</span>
                                            </div>
                                            {chl != null && (
                                                <div className="flex items-center justify-between gap-3 text-[10px]">
                                                    <span className="text-[#525252]">Long</span>
                                                    <span className="text-[#a3a3a3]">{fmtSigned(chl)}</span>
                                                </div>
                                            )}
                                            {chs != null && (
                                                <div className="flex items-center justify-between gap-3 text-[10px]">
                                                    <span className="text-[#525252]">Short</span>
                                                    <span className="text-[#a3a3a3]">{fmtSigned(chs)}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }}
                    cursor={{ stroke: '#262626', strokeDasharray: '3 3' }}
                />
                <ReferenceLine y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                {activeGroups.map(g => (
                    <Bar key={g} dataKey={`${g}_delta`} shape={(props) => renderBar(props, g)} isAnimationActive={false} />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// =====================================================
// Main Modal
// =====================================================

export default function BubbleChartModal({ isOpen, onClose, data }) {
    const [timeframe, setTimeframe] = useState('1y');
    const [viewMode, setViewMode] = useState('bubbles');
    const [cotPeriod, setCotPeriod] = useState('1y');
    const [indicatorType, setIndicatorType] = useState('cot_index');

    // Derive groups from data
    const groupsMeta = useMemo(() => buildGroupsMeta(data?.groups), [data?.groups]);
    const groupColors = useMemo(() => buildGroupColors(groupsMeta), [groupsMeta]);

    // Default active groups to first group (for bubbles)
    const [activeGroups, setActiveGroups] = useState([]);
    // Indicator groups — default all on
    const [indicatorGroups, setIndicatorGroups] = useState([]);

    // Reset active groups when groupsMeta changes
    useEffect(() => {
        if (groupsMeta.length > 0) {
            setActiveGroups([groupsMeta[0].key]);
            setIndicatorGroups(groupsMeta.map(g => g.key));
        }
    }, [groupsMeta]);

    useEscapeKey(onClose, isOpen);

    const toggleGroup = useCallback((key) => {
        setActiveGroups(prev =>
            prev.includes(key)
                ? prev.length > 1 ? prev.filter(g => g !== key) : prev
                : [...prev, key]
        );
    }, []);

    const toggleIndicatorGroup = useCallback((key) => {
        setIndicatorGroups(prev =>
            prev.includes(key)
                ? prev.length > 1 ? prev.filter(g => g !== key) : prev
                : [...prev, key]
        );
    }, []);

    // Weeks data (oldest-first) with aggregated Long/Short
    const weeksData = useMemo(() => {
        if (!data?.weeks) return [];
        const weeks = [...data.weeks].reverse();
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        const sliced = tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
        return sliced.map(w => {
            const aggLong = activeGroups.reduce((s, g) => s + (w[`${g}_long`] || 0), 0);
            const aggShort = activeGroups.reduce((s, g) => s + (w[`${g}_short`] || 0), 0);
            const aggChange = activeGroups.reduce((s, g) => s + (w[`${g}_change`] || 0), 0);
            const aggChangeLong = activeGroups.reduce((s, g) => s + (w[`${g}_change_long`] || 0), 0);
            const aggChangeShort = activeGroups.reduce((s, g) => s + (w[`${g}_change_short`] || 0), 0);
            return {
                ...w,
                agg_long: aggLong, agg_short: aggShort, agg_oi: aggLong + aggShort,
                agg_change: aggChange, agg_change_long: aggChangeLong, agg_change_short: aggChangeShort,
            };
        });
    }, [data, timeframe, activeGroups]);

    // Chart data for net/cot_index views (oldest-first, no aggregation needed)
    const chartData = useMemo(() => {
        if (!data?.weeks) return [];
        const weeks = [...data.weeks].reverse();
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        return tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
    }, [data, timeframe]);

    const marketName = data?.market?.name ? data.market.name.split(' - ')[0] : 'Market';
    const hasPrices = data?.prices?.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                style={{ animation: 'modalFadeIn 0.2s ease-out' }}
            />

            <div
                className="relative w-[96vw] max-w-[1600px] h-[90vh] bg-[#0a0a0a] border border-[#262626] rounded-sm shadow-2xl flex flex-col overflow-hidden"
                style={{ animation: 'modalSlideIn 0.25s ease-out' }}
            >
                {/* Header */}
                <div className="flex-shrink-0 h-[52px] border-b border-[#262626] flex items-center justify-between px-6 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-[#e5e5e5] tracking-widest uppercase">
                            {marketName}
                        </span>
                        <span className="text-[10px] text-[#262626]">│</span>

                        {/* View toggle */}
                        <div className="flex gap-0.5 bg-[#0a0a0a] border border-[#262626] rounded-sm p-0.5">
                            <button
                                onClick={() => setViewMode('bubbles')}
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === 'bubbles' ? 'bg-[#e5e5e5] text-black' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                            >
                                Bubbles
                            </button>
                            <button
                                onClick={() => setViewMode('net')}
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === 'net' ? 'bg-[#e5e5e5] text-black' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                            >
                                Net Positions
                            </button>
                            <button
                                onClick={() => setViewMode('indicators')}
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === 'indicators' ? 'bg-[#e5e5e5] text-black' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                            >
                                Indicators
                            </button>
                        </div>

                        {/* Indicator type & period sub-tabs */}
                        {viewMode === 'indicators' && (
                            <>
                                <span className="text-[10px] text-[#262626]">│</span>
                                <div className="flex gap-0.5 bg-[#0a0a0a] border border-[#262626] rounded-sm p-0.5">
                                    {INDICATOR_TYPES.map(it => (
                                        <button
                                            key={it.key}
                                            onClick={() => setIndicatorType(it.key)}
                                            className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${indicatorType === it.key ? 'bg-[#e5e5e5] text-black' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                                        >
                                            {it.label}
                                        </button>
                                    ))}
                                </div>
                                {indicatorType === 'cot_index' && (
                                    <>
                                        <span className="text-[10px] text-[#262626]">│</span>
                                        <div className="flex gap-0.5">
                                            {COT_INDEX_PERIODS.map(p => (
                                                <button
                                                    key={p.key}
                                                    onClick={() => setCotPeriod(p.key)}
                                                    className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${cotPeriod === p.key ? 'bg-[#e5e5e5] text-black' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {indicatorType === 'wci' && (
                                    <>
                                        <span className="text-[10px] text-[#262626]">│</span>
                                        <span className="text-[10px] text-[#525252] tracking-wider">26W lookback</span>
                                    </>
                                )}
                            </>
                        )}

                        {weeksData.length > 0 && viewMode === 'bubbles' && (() => {
                            const latest = weeksData[weeksData.length - 1];
                            const net = (latest.agg_long || 0) - (latest.agg_short || 0);
                            const isLong = net >= 0;
                            return (
                                <>
                                    <span className="text-[10px] text-[#262626]">│</span>
                                    <span className={`text-[11px] font-medium ${isLong ? 'text-green-400' : 'text-red-400'}`}>
                                        {isLong ? 'Net Long' : 'Net Short'} {fmtCompact(Math.abs(net))}
                                    </span>
                                </>
                            );
                        })()}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Group toggles (bubbles + indicators) */}
                        {(viewMode === 'bubbles' || viewMode === 'indicators') && (
                            <>
                                <div className="flex gap-1">
                                    {groupsMeta.map(g => {
                                        const groups = viewMode === 'indicators' ? indicatorGroups : activeGroups;
                                        const toggle = viewMode === 'indicators' ? toggleIndicatorGroup : toggleGroup;
                                        const on = groups.includes(g.key);
                                        return (
                                            <button
                                                key={g.key}
                                                onClick={() => toggle(g.key)}
                                                className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold transition-all duration-200 border ${on
                                                    ? ''
                                                    : 'border-transparent text-[#525252] hover:text-[#a3a3a3] opacity-40'
                                                    }`}
                                                style={on ? {
                                                    backgroundColor: `${g.color}15`,
                                                    borderColor: `${g.color}40`,
                                                    color: g.color,
                                                } : {}}
                                            >
                                                {g.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <span className="text-[10px] text-[#262626]">│</span>
                            </>
                        )}

                        {/* Timeframe */}
                        <div className="flex gap-0.5 bg-[#0a0a0a] border border-[#262626] rounded-sm p-0.5">
                            {TIMEFRAMES.map(tf => (
                                <button
                                    key={tf.key}
                                    onClick={() => setTimeframe(tf.key)}
                                    className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${timeframe === tf.key
                                        ? 'bg-[#e5e5e5] text-black'
                                        : 'text-[#525252] hover:text-[#a3a3a3]'
                                        }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-sm text-[#525252] hover:text-white hover:bg-[#121212] border border-transparent hover:border-[#262626] transition-all duration-300"
                            title="Закрити (Esc)"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M1 1l12 12M13 1L1 13" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Charts area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {viewMode === 'net' ? (
                        <div className="flex-1 min-h-0 p-4">
                            {chartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[#525252] text-xs uppercase tracking-wider">No data available</div>
                            ) : (
                                <NetPositionsChart chartData={chartData} groupsMeta={groupsMeta} groupColors={groupColors} />
                            )}
                        </div>
                    ) : viewMode === 'indicators' ? (
                        <div className="flex-1 min-h-0 flex flex-col">
                            {hasPrices ? (
                                <div style={{ flex: '65 1 0%' }} className="min-h-0 px-2 pt-1">
                                    <IndicatorPriceChart prices={data?.prices} timeframe={timeframe} />
                                </div>
                            ) : null}
                            {hasPrices && (
                                <div className="flex-shrink-0 h-px bg-[#262626] relative my-1">
                                    <span className="absolute left-4 -top-2.5 text-[9px] text-[#525252] bg-[#0a0a0a] px-1.5 tracking-widest uppercase font-bold">
                                        {indicatorType === 'wci' ? 'WCI (26W)' : `COT Index (${cotPeriod.toUpperCase()})`}
                                    </span>
                                </div>
                            )}
                            <div style={{ flex: hasPrices ? '35 1 0%' : '1 1 0%' }} className="min-h-0 px-2 pb-1">
                                {chartData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-[#525252] text-xs uppercase tracking-wider">No data available</div>
                                ) : (
                                    <IndicatorChart chartData={chartData} indicatorType={indicatorType} period={cotPeriod} groupsMeta={groupsMeta} activeGroups={indicatorGroups} />
                                )}
                            </div>
                        </div>
                    ) : hasPrices ? (
                        /* Bubbles + Delta histogram */
                        <div className="flex-1 min-h-0 flex flex-col">
                            <div style={{ flex: '60 1 0%' }} className="min-h-0 px-2 pt-1">
                                <PriceBubbleChart
                                    prices={data?.prices}
                                    weeksData={weeksData}
                                    timeframe={timeframe}
                                />
                            </div>
                            <div className="flex-shrink-0 h-px bg-[#262626] relative my-1">
                                <span className="absolute left-4 -top-2.5 text-[9px] text-[#525252] bg-[#0a0a0a] px-1.5 tracking-widest uppercase font-bold">
                                    Delta Long / Short
                                </span>
                            </div>
                            <div style={{ flex: '40 1 0%' }} className="min-h-0 px-2 pb-1">
                                <DeltaHistogram
                                    weeksData={weeksData}
                                    timeframe={timeframe}
                                    activeGroups={activeGroups}
                                    groupsMeta={groupsMeta}
                                />
                            </div>
                        </div>
                    ) : (
                        /* No-price fallback */
                        <>
                            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1">
                                <div className="h-px flex-1 bg-[#262626]" />
                                <span className="text-[9px] text-[#525252] uppercase tracking-widest">Bubble Chart · OI & Long / Short</span>
                                <div className="h-px flex-1 bg-[#262626]" />
                            </div>
                            <div className="flex-1 min-h-0 flex flex-col gap-1 px-4 pb-3">
                                <div style={{ flex: '50 1 0%' }} className="min-h-0">
                                    <BubbleFallbackChart weeksData={weeksData} activeGroups={activeGroups} groupsMeta={groupsMeta} />
                                </div>
                                <div style={{ flex: '50 1 0%' }} className="min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={weeksData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                                            <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: COLORS.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={60} />
                                            <YAxis yAxisId="oi" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: '#f59e0b80' }} axisLine={false} tickLine={false} width={55} />
                                            <YAxis yAxisId="net" orientation="right" tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={55} />
                                            <Tooltip content={<LinesTooltip />} cursor={{ stroke: '#262626', strokeDasharray: '3 3' }} />
                                            <ReferenceLine yAxisId="net" y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                                            <Line yAxisId="oi" type="monotone" dataKey="agg_oi" name="OI" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3" dot={false} />
                                            <Line yAxisId="net" type="monotone" dataKey="agg_long" name="Long" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                                            <Line yAxisId="net" type="monotone" dataKey="agg_short" name="Short" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Legend bar */}
                <div className="flex-shrink-0 h-9 border-t border-[#262626] flex items-center justify-center gap-6 px-4 bg-[#050505]">
                    {viewMode === 'bubbles' && hasPrices ? (
                        <>
                            {COT_SIGNALS.map(s => (
                                <div key={s.key} className="flex items-center gap-1">
                                    <svg width="10" height="4"><line x1="0" y1="2" x2="10" y2="2" stroke={s.color} strokeWidth="2" /></svg>
                                    <span className="text-[9px] text-[#525252]">#{s.num} {s.label}</span>
                                </div>
                            ))}
                            <span className="text-[9px] text-[#262626]">│</span>
                            <span className="text-[9px] text-[#525252]">Колір лінії = COT сигнал періоду</span>
                        </>
                    ) : viewMode === 'net' ? (
                        <>
                            {groupsMeta.map(g => (
                                <div key={g.key} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: g.color }} />
                                    <span className="text-[10px] text-[#525252] uppercase tracking-wider">{g.full}</span>
                                </div>
                            ))}
                        </>
                    ) : viewMode === 'indicators' ? (
                        <>
                            <span className="text-[10px] text-[#a3a3a3] font-medium uppercase tracking-wider">
                                {indicatorType === 'wci' ? 'WCI 26W' : `COT Index ${cotPeriod.toUpperCase()}`}
                            </span>
                            <span className="text-[10px] text-[#262626]">│</span>
                            {groupsMeta.filter(g => indicatorGroups.includes(g.key)).map(g => (
                                <div key={g.key} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: g.color }} />
                                    <span className="text-[10px] text-[#525252] uppercase tracking-wider">{g.full}</span>
                                </div>
                            ))}
                            <span className="text-[10px] text-[#262626]">│</span>
                            <span className="text-[10px] text-[#525252]">80% — перекуплено · 20% — перепродано</span>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <svg width="10" height="10" viewBox="0 0 10 10">
                                    <polygon points="5,1 9,9 1,9" fill={COLORS.buy} />
                                </svg>
                                <span className="text-[10px] text-[#525252]">Купівля (Net ↑)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="10" height="10" viewBox="0 0 10 10">
                                    <polygon points="5,9 9,1 1,1" fill={COLORS.sell} />
                                </svg>
                                <span className="text-[10px] text-[#525252]">Продаж (Net ↓)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="10" height="10" viewBox="0 0 10 10">
                                    <circle cx="5" cy="5" r="4" fill={COLORS.mixed} />
                                </svg>
                                <span className="text-[10px] text-[#525252]">Змішаний сигнал</span>
                            </div>
                            <span className="text-[10px] text-[#262626]">│</span>
                            <span className="text-[10px] text-[#525252]">Розмір маркера = величина зміни</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Fallback bubble chart (when no price data)
// =====================================================

function BubbleFallbackChart({ weeksData, activeGroups, groupsMeta }) {
    const enriched = useMemo(() => {
        return weeksData.map(w => {
            const combined = activeGroups.reduce((s, g) => s + (w[`${g}_change`] || 0), 0);
            return { ...w, bubbleValue: combined };
        });
    }, [weeksData, activeGroups]);

    const maxAbs = useMemo(() =>
        Math.max(1, ...enriched.map(d => Math.abs(d.bubbleValue || 0))),
        [enriched]
    );

    const renderBubble = (props, isActive = false) => {
        const { cx, cy, payload, index } = props;
        if (cx == null || cy == null) return null;
        const val = payload?.bubbleValue;
        if (!val) return null;

        const abs = Math.abs(val);
        const minR = 3, maxR = 16;
        const r = minR + (abs / maxAbs) * (maxR - minR) + (isActive ? 2 : 0);
        const color = val > 0 ? COLORS.buy : COLORS.sell;

        return (
            <circle
                key={`b${isActive ? 'a' : ''}-${index}`}
                cx={cx} cy={cy} r={r}
                fill={color} fillOpacity={isActive ? 0.55 : 0.3}
                stroke={color} strokeWidth={isActive ? 2 : 1.5}
                strokeOpacity={isActive ? 0.9 : 0.7}
            />
        );
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={enriched} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis dataKey="date" tickFormatter={fmtTick} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={{ stroke: COLORS.grid }} tickLine={false} interval="preserveStartEnd" minTickGap={60} />
                <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: COLORS.axis }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<BubbleFallbackTooltip activeGroups={activeGroups} groupsMeta={groupsMeta} />} cursor={{ stroke: '#262626', strokeDasharray: '3 3' }} />
                <ReferenceLine y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="bubbleValue" stroke="rgba(255,255,255,0.05)" strokeWidth={1} dot={renderBubble} activeDot={(props) => renderBubble(props, true)} isAnimationActive={false} name="Net Change" legendType="none" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

function BubbleFallbackTooltip({ active, payload, label, activeGroups, groupsMeta }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2.5 shadow-xl min-w-[180px]">
            <div className="text-[10px] text-[#525252] mb-2">{fmtDate(label)}</div>
            {activeGroups.map(gk => {
                const g = (groupsMeta || []).find(x => x.key === gk);
                const ch = d[`${gk}_change`];
                if (ch == null) return null;
                return (
                    <div key={gk} className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                            <span className="text-[#a3a3a3]">{g.full}</span>
                        </div>
                        <span className="text-white font-medium">{fmtSigned(ch)}</span>
                    </div>
                );
            })}
        </div>
    );
}
