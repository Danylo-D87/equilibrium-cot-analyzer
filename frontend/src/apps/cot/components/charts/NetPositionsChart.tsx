import {
    ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
    Tooltip, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import { COLORS, fmtCompact, fmtNum, fmtDate, fmtTick } from './chartConstants';
import type { GroupMeta } from './chartConstants';
import type { Week } from '../../types';

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipEntry {
    color: string;
    name: string;
    value: number;
}

function NetTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm px-3 py-2.5 shadow-2xl">
            <div className="text-[10px] text-muted mb-1.5 font-medium uppercase tracking-wider">{fmtDate(label)}</div>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-text-secondary min-w-[80px]">{entry.name}</span>
                    <span className="text-white font-medium font-mono">{fmtNum(entry.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

interface NetPositionsChartProps {
    chartData: Week[];
    groupsMeta: GroupMeta[];
    groupColors: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function NetPositionsChart({ chartData, groupsMeta, groupColors: _groupColors }: NetPositionsChartProps) {
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
