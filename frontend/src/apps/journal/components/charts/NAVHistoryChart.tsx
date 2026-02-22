import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { NAVHistoryPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: NAVHistoryPoint[]; isLoading?: boolean; showTitle?: boolean }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            <p className="text-sm font-semibold font-mono text-success-fg">NAV: ${payload[0].value.toLocaleString()}</p>
        </div>
    );
}

export default function NAVHistoryChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1];

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">NAV History</h3>}
            <div className="mb-4">
                <div className="text-2xl font-mono font-bold text-success-fg">${last.nav.toLocaleString()}</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">Net Asset Value over time</div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" style={{ fontSize: '10px' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis style={{ fontSize: '10px' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} dot={false} name="NAV" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
