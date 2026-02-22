import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { AlphaCurvePoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: AlphaCurvePoint[]; isLoading?: boolean; showTitle?: boolean }

const fmt = (d: string) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = new Date(payload[0].payload.date);
    const v = payload[0].value as number;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{d.toLocaleDateString()}</p>
            <p className={`text-sm font-semibold font-mono ${v >= 0 ? 'text-success-fg' : 'text-destructive-fg'}`}>
                Alpha: {v >= 0 ? '+' : ''}{v.toFixed(2)}%
            </p>
        </div>
    );
}

export default function AlphaCurveChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1]?.cumulative_alpha ?? 0;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Alpha Curve</h3>}
            <div className="mb-4">
                <div className="text-2xl font-mono font-bold" style={{ color: last >= 0 ? '#4ade80' : '#f87171' }}>
                    {last >= 0 ? '+' : ''}{last.toFixed(2)}%
                </div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                    {last >= 0 ? 'Outperforming benchmark' : 'Underperforming benchmark'}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" tickFormatter={fmt} style={{ fontSize: '10px' }} />
                    <YAxis tickFormatter={v => `${v}%`} style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#525252" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="cumulative_alpha" stroke={last >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2.5} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
