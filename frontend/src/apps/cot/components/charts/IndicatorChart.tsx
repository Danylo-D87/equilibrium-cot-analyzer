import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { COLORS, fmtDate, fmtTick } from './chartConstants';
import type { GroupMeta } from './chartConstants';
import type { Week } from '../../types';

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface IndicatorTooltipEntry {
    color: string;
    name: string;
    value: number | null;
}

function IndicatorTooltip({ active, payload, label, indicatorType }: { active?: boolean; payload?: IndicatorTooltipEntry[]; label?: string; indicatorType: string }) {
    if (!active || !payload?.length) return null;
    const title = indicatorType === 'wci' ? 'WCI' : 'COT Index';
    return (
        <div className="bg-surface border border-border rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-muted mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)} · {title}</div>
            {payload.filter(e => e.value != null).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-text-secondary min-w-[80px]">{entry.name}</span>
                    <span className="text-white font-medium font-mono">{Math.round(entry.value!)}%</span>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Chart (COT Index / WCI — bottom panel)
// ---------------------------------------------------------------------------

interface IndicatorChartProps {
    chartData: Week[];
    indicatorType: string;
    period: string;
    groupsMeta: GroupMeta[];
    activeGroups: string[];
}

export default function IndicatorChart({ chartData, indicatorType, period, groupsMeta, activeGroups }: IndicatorChartProps) {
    const getDataKey = (gk: string): string => {
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
