import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { TIMEFRAMES } from '../../utils/constants';
import Modal from '@/components/ui/Modal';
import type { MarketData } from '../../types';

import {
    COLORS, COT_SIGNALS, COT_INDEX_PERIODS, INDICATOR_TYPES,
    buildGroupsMeta, buildGroupColors, fmtCompact, fmtTick,
} from './chartConstants';
import { LinesTooltip } from './BubbleFallbackChart';

import NetPositionsChart from './NetPositionsChart';
import IndicatorChart from './IndicatorChart';
import IndicatorPriceChart from './IndicatorPriceChart';
import PriceBubbleChart from './PriceBubbleChart';
import DeltaHistogram from './DeltaHistogram';
import BubbleFallbackChart from './BubbleFallbackChart';

// =====================================================
// Main BubbleChartModal — orchestrator
// =====================================================

interface BubbleChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: MarketData | null;
}

export default function BubbleChartModal({ isOpen, onClose, data }: BubbleChartModalProps) {
    const [timeframe, setTimeframe] = useState('1y');
    const [viewMode, setViewMode] = useState('bubbles');
    const [cotPeriod, setCotPeriod] = useState('1y');
    const [indicatorType, setIndicatorType] = useState('cot_index');

    // Derive groups from data
    const groupsMeta = useMemo(() => buildGroupsMeta(data?.groups), [data?.groups]);
    const groupColors = useMemo(() => buildGroupColors(groupsMeta), [groupsMeta]);

    // Default active groups to first group (for bubbles)
    const [activeGroups, setActiveGroups] = useState<string[]>([]);
    // Indicator groups — default all on
    const [indicatorGroups, setIndicatorGroups] = useState<string[]>([]);

    // Reset active groups when groupsMeta changes
    useEffect(() => {
        if (groupsMeta.length > 0) {
            setActiveGroups([groupsMeta[0].key]);
            setIndicatorGroups(groupsMeta.map(g => g.key));
        }
    }, [groupsMeta]);

    const toggleGroup = useCallback((key: string) => {
        setActiveGroups(prev =>
            prev.includes(key)
                ? prev.length > 1 ? prev.filter(g => g !== key) : prev
                : [...prev, key]
        );
    }, []);

    const toggleIndicatorGroup = useCallback((key: string) => {
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
        if (!tf) return weeks;
        const sliced = tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
        return sliced.map(w => {
            const aggLong = activeGroups.reduce((s, g) => s + (Number(w[`${g}_long`]) || 0), 0);
            const aggShort = activeGroups.reduce((s, g) => s + (Number(w[`${g}_short`]) || 0), 0);
            const aggChange = activeGroups.reduce((s, g) => s + (Number(w[`${g}_change`]) || 0), 0);
            const aggChangeLong = activeGroups.reduce((s, g) => s + (Number(w[`${g}_change_long`]) || 0), 0);
            const aggChangeShort = activeGroups.reduce((s, g) => s + (Number(w[`${g}_change_short`]) || 0), 0);
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
        if (!tf) return weeks;
        return tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
    }, [data, timeframe]);

    const marketName = data?.market?.name ? data.market.name.split(' - ')[0] : 'Market';
    const hasPrices = (data?.prices?.length ?? 0) > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" backdropBlur="sm">
            {/* Header */}
            <div className="flex-shrink-0 h-[52px] border-b border-border flex items-center justify-between px-6 bg-surface">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-text-primary tracking-widest uppercase">
                        {marketName}
                    </span>
                    <span className="text-[10px] text-border">│</span>

                    {/* View toggle */}
                    <div className="flex gap-0.5 bg-surface border border-border rounded-sm p-0.5">
                        {['bubbles', 'net', 'indicators'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === mode ? 'bg-text-primary text-black' : 'text-muted hover:text-text-secondary'}`}
                            >
                                {mode === 'bubbles' ? 'Bubbles' : mode === 'net' ? 'Net Positions' : 'Indicators'}
                            </button>
                        ))}
                    </div>

                    {/* Indicator type & period sub-tabs */}
                    {viewMode === 'indicators' && (
                        <>
                            <span className="text-[10px] text-border">│</span>
                            <div className="flex gap-0.5 bg-surface border border-border rounded-sm p-0.5">
                                {INDICATOR_TYPES.map(it => (
                                    <button
                                        key={it.key}
                                        onClick={() => setIndicatorType(it.key)}
                                        className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${indicatorType === it.key ? 'bg-text-primary text-black' : 'text-muted hover:text-text-secondary'}`}
                                    >
                                        {it.label}
                                    </button>
                                ))}
                            </div>
                            {indicatorType === 'cot_index' && (
                                <>
                                    <span className="text-[10px] text-border">│</span>
                                    <div className="flex gap-0.5">
                                        {COT_INDEX_PERIODS.map(p => (
                                            <button
                                                key={p.key}
                                                onClick={() => setCotPeriod(p.key)}
                                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${cotPeriod === p.key ? 'bg-text-primary text-black' : 'text-muted hover:text-text-secondary'}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                            {indicatorType === 'wci' && (
                                <>
                                    <span className="text-[10px] text-border">│</span>
                                    <span className="text-[10px] text-muted tracking-wider">26W lookback</span>
                                </>
                            )}
                        </>
                    )}

                    {weeksData.length > 0 && viewMode === 'bubbles' && (() => {
                        const latest = weeksData[weeksData.length - 1];
                        const net = (Number(latest.agg_long) || 0) - (Number(latest.agg_short) || 0);
                        const isLong = net >= 0;
                        return (
                            <>
                                <span className="text-[10px] text-border">│</span>
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
                                                : 'border-transparent text-muted hover:text-text-secondary opacity-40'
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
                            <span className="text-[10px] text-border">│</span>
                        </>
                    )}

                    {/* Timeframe */}
                    <div className="flex gap-0.5 bg-surface border border-border rounded-sm p-0.5">
                        {TIMEFRAMES.map(tf => (
                            <button
                                key={tf.key}
                                onClick={() => setTimeframe(tf.key)}
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${timeframe === tf.key
                                    ? 'bg-text-primary text-black'
                                    : 'text-muted hover:text-text-secondary'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm text-muted hover:text-white hover:bg-surface-hover border border-transparent hover:border-border transition-all duration-300"
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
                            <div className="flex items-center justify-center h-full text-muted text-xs uppercase tracking-wider">No data available</div>
                        ) : (
                            <NetPositionsChart chartData={chartData} groupsMeta={groupsMeta} groupColors={groupColors} />
                        )}
                    </div>
                ) : viewMode === 'indicators' ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                        {hasPrices && (
                            <div style={{ flex: '65 1 0%' }} className="min-h-0 px-2 pt-1">
                                <IndicatorPriceChart prices={data?.prices} timeframe={timeframe} />
                            </div>
                        )}
                        {hasPrices && (
                            <div className="flex-shrink-0 h-px bg-border relative my-1">
                                <span className="absolute left-4 -top-2.5 text-[9px] text-muted bg-surface px-1.5 tracking-widest uppercase font-bold">
                                    {indicatorType === 'wci' ? 'WCI (26W)' : `COT Index (${cotPeriod.toUpperCase()})`}
                                </span>
                            </div>
                        )}
                        <div style={{ flex: hasPrices ? '35 1 0%' : '1 1 0%' }} className="min-h-0 px-2 pb-1">
                            {chartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted text-xs uppercase tracking-wider">No data available</div>
                            ) : (
                                <IndicatorChart chartData={chartData} indicatorType={indicatorType} period={cotPeriod} groupsMeta={groupsMeta} activeGroups={indicatorGroups} />
                            )}
                        </div>
                    </div>
                ) : hasPrices ? (
                    /* Bubbles + Delta histogram */
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div style={{ flex: '60 1 0%' }} className="min-h-0 px-2 pt-1">
                            <PriceBubbleChart prices={data?.prices} weeksData={weeksData} timeframe={timeframe} />
                        </div>
                        <div className="flex-shrink-0 h-px bg-border relative my-1">
                            <span className="absolute left-4 -top-2.5 text-[9px] text-muted bg-surface px-1.5 tracking-widest uppercase font-bold">
                                Delta Long / Short
                            </span>
                        </div>
                        <div style={{ flex: '40 1 0%' }} className="min-h-0 px-2 pb-1">
                            <DeltaHistogram weeksData={weeksData} timeframe={timeframe} activeGroups={activeGroups} groupsMeta={groupsMeta} />
                        </div>
                    </div>
                ) : (
                    /* No-price fallback */
                    <>
                        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[9px] text-muted uppercase tracking-widest">Bubble Chart · OI & Long / Short</span>
                            <div className="h-px flex-1 bg-border" />
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
            <div className="flex-shrink-0 h-9 border-t border-border flex items-center justify-center gap-6 px-4 bg-background">
                {viewMode === 'bubbles' && hasPrices ? (
                    <>
                        {COT_SIGNALS.map(s => (
                            <div key={s.key} className="flex items-center gap-1">
                                <svg width="10" height="4"><line x1="0" y1="2" x2="10" y2="2" stroke={s.color} strokeWidth="2" /></svg>
                                <span className="text-[9px] text-muted">#{s.num} {s.label}</span>
                            </div>
                        ))}
                        <span className="text-[9px] text-border">│</span>
                        <span className="text-[9px] text-muted">Колір лінії = COT сигнал періоду</span>
                    </>
                ) : viewMode === 'net' ? (
                    <>
                        {groupsMeta.map(g => (
                            <div key={g.key} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: g.color }} />
                                <span className="text-[10px] text-muted uppercase tracking-wider">{g.full}</span>
                            </div>
                        ))}
                    </>
                ) : viewMode === 'indicators' ? (
                    <>
                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                            {indicatorType === 'wci' ? 'WCI 26W' : `COT Index ${cotPeriod.toUpperCase()}`}
                        </span>
                        <span className="text-[10px] text-border">│</span>
                        {groupsMeta.filter(g => indicatorGroups.includes(g.key)).map(g => (
                            <div key={g.key} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: g.color }} />
                                <span className="text-[10px] text-muted uppercase tracking-wider">{g.full}</span>
                            </div>
                        ))}
                        <span className="text-[10px] text-border">│</span>
                        <span className="text-[10px] text-muted">80% — перекуплено · 20% — перепродано</span>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 10 10">
                                <polygon points="5,1 9,9 1,9" fill={COLORS.buy} />
                            </svg>
                            <span className="text-[10px] text-muted">Купівля (Net ↑)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 10 10">
                                <polygon points="5,9 9,1 1,1" fill={COLORS.sell} />
                            </svg>
                            <span className="text-[10px] text-muted">Продаж (Net ↓)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 10 10">
                                <circle cx="5" cy="5" r="4" fill={COLORS.mixed} />
                            </svg>
                            <span className="text-[10px] text-muted">Змішаний сигнал</span>
                        </div>
                        <span className="text-[10px] text-border">│</span>
                        <span className="text-[10px] text-muted">Розмір маркера = величина зміни</span>
                    </>
                )}
            </div>
        </Modal>
    );
}
