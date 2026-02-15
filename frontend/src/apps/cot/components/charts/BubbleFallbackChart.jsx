import React, { useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { COLORS, fmtCompact, fmtNum, fmtSigned, fmtDate, fmtTick } from './chartConstants';

// ---------------------------------------------------------------------------
// LinesTooltip (shared between fallback and no-price views)
// ---------------------------------------------------------------------------

export function LinesTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-surface border border-border rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-muted mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)}</div>
            {payload.filter(e => e.value != null).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    {e.strokeDasharray ? (
                        <svg width="10" height="2"><line x1="0" y1="1" x2="10" y2="1" stroke={e.color} strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                    ) : (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    )}
                    <span className="text-text-secondary min-w-[100px]">{e.name}</span>
                    <span className="text-white font-medium font-mono">{fmtNum(e.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// BubbleFallbackTooltip
// ---------------------------------------------------------------------------

function BubbleFallbackTooltip({ active, payload, label, activeGroups, groupsMeta }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    return (
        <div className="bg-surface border border-border rounded-sm px-3 py-2.5 shadow-xl min-w-[180px]">
            <div className="text-[10px] text-muted mb-2">{fmtDate(label)}</div>
            {activeGroups.map(gk => {
                const g = (groupsMeta || []).find(x => x.key === gk);
                const ch = d[`${gk}_change`];
                if (ch == null) return null;
                return (
                    <div key={gk} className="flex items-center justify-between gap-4 text-[11px] mb-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                            <span className="text-text-secondary">{g.full}</span>
                        </div>
                        <span className="text-white font-medium">{fmtSigned(ch)}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Fallback bubble chart (when no price data available)
// ---------------------------------------------------------------------------

export default function BubbleFallbackChart({ weeksData, activeGroups, groupsMeta }) {
    const enriched = useMemo(() => {
        return weeksData.map(w => {
            const combined = activeGroups.reduce((s, g) => s + (w[`${g}_change`] || 0), 0);
            return { ...w, bubbleValue: combined };
        });
    }, [weeksData, activeGroups]);

    const maxAbs = useMemo(() =>
        Math.max(1, ...enriched.map(d => Math.abs(d.bubbleValue || 0))),
        [enriched],
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
