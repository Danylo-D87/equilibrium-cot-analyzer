import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NAVvsHighWatermarkPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: NAVvsHighWatermarkPoint[]; isLoading?: boolean; showTitle?: boolean }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="text-sm font-semibold font-mono" style={{ color: e.color }}>{e.name}: ${e.value.toLocaleString()}</p>
            ))}
        </div>
    );
}

export default function NAVvsHighWatermarkChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1];

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">NAV vs High Watermark</h3>}
            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">NAV</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">${last.nav.toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">High Watermark</div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">${last.high_watermark.toLocaleString()}</div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="date" style={{ fontSize: '10px' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis style={{ fontSize: '10px' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} fill="url(#navGrad)" name="NAV" />
                    <Area type="monotone" dataKey="high_watermark" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="5 5" name="High Watermark" />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}
