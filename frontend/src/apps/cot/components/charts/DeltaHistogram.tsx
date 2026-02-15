import { useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
    Tooltip, ReferenceLine,
} from 'recharts';
import { TIMEFRAMES } from '../../utils/constants';
import { COLORS, fmtCompact, fmtSigned, fmtDate, fmtTick } from './chartConstants';
import type { GroupMeta } from './chartConstants';

// ---------------------------------------------------------------------------
// Delta Histogram (bar chart for Bubbles view — bottom panel)
// ---------------------------------------------------------------------------

interface WeekRow {
    date: string;
    [key: string]: unknown;
}

interface DeltaHistogramProps {
    weeksData: WeekRow[];
    timeframe: string;
    activeGroups: string[];
    groupsMeta: GroupMeta[];
}

export default function DeltaHistogram({ weeksData, timeframe, activeGroups, groupsMeta }: DeltaHistogramProps) {
    const chartData = useMemo(() => {
        if (!weeksData?.length) return [];
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        const weeks = [...weeksData].map(w => {
            const transformed: Record<string, unknown> = { ...w };
            activeGroups.forEach(g => {
                const longVal = Number(w[`${g}_change_long`]) || 0;
                const shortVal = Number(w[`${g}_change_short`]) || 0;
                const netDelta = longVal - shortVal;
                transformed[`${g}_delta`] = Math.abs(netDelta);
                transformed[`${g}_delta_original`] = netDelta;
                transformed[`${g}_change_long_original`] = longVal;
                transformed[`${g}_change_short_original`] = shortVal;
            });
            return transformed;
        });
        if (!tf) return weeks;
        return tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
    }, [weeksData, timeframe, activeGroups]);

    const renderBar = (props: { x?: number; y?: number; width?: number; height?: number; payload?: Record<string, unknown> }, group: string) => {
        const { x, y, width, height, payload } = props;
        if (!payload) return <g />;
        const netDelta = payload[`${group}_delta_original`] as number | undefined;
        if (netDelta == null || netDelta === 0) return <g />;
        const color = netDelta > 0 ? '#22c55e' : '#ef4444';
        return (
            <rect x={x} y={y} width={width} height={Math.abs(height ?? 0)} fill={color} opacity={0.75} />
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
                            <div className="bg-surface border border-border rounded-sm px-3 py-2 shadow-xl min-w-[160px]">
                                <div className="text-[10px] text-muted mb-1.5">{fmtDate(label)}</div>
                                {activeGroups.map(gk => {
                                    const g = groupsMeta.find(x => x.key === gk);
                                    if (!g) return null;
                                    const chl = d[`${gk}_change_long_original`] as number | undefined;
                                    const chs = d[`${gk}_change_short_original`] as number | undefined;
                                    const delta = d[`${gk}_delta_original`] as number | undefined;
                                    if (delta == null) return null;
                                    return (
                                        <div key={gk} className="mb-1.5">
                                            <div className="text-[10px] font-medium mb-0.5" style={{ color: g.color }}>{g.full}</div>
                                            <div className="flex items-center justify-between gap-3 text-[11px] mb-0.5">
                                                <span className="text-text-secondary">Net Δ</span>
                                                <span className={delta > 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{fmtSigned(delta)}</span>
                                            </div>
                                            {chl != null && (
                                                <div className="flex items-center justify-between gap-3 text-[10px]">
                                                    <span className="text-muted">Long</span>
                                                    <span className="text-text-secondary">{fmtSigned(chl)}</span>
                                                </div>
                                            )}
                                            {chs != null && (
                                                <div className="flex items-center justify-between gap-3 text-[10px]">
                                                    <span className="text-muted">Short</span>
                                                    <span className="text-text-secondary">{fmtSigned(chs)}</span>
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
                    <Bar key={g} dataKey={`${g}_delta`} shape={(props: any) => renderBar(props, g)} isAnimationActive={false} />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    );
}
