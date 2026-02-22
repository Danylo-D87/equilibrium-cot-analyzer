import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RollingTrackingErrorPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RollingTrackingErrorPoint[]; isLoading?: boolean; showTitle?: boolean; metricValue?: number | null }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            <p className="text-sm font-semibold font-mono text-orange-400">TE: {payload[0].value.toFixed(2)}%</p>
        </div>
    );
}

export default function RollingTrackingErrorChart({ data, isLoading, showTitle = true, metricValue }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1];
    const headline = metricValue != null ? metricValue : last.tracking_error;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Rolling Tracking Error</h3>}
            <div className="mb-4">
                <div className="text-2xl font-mono font-bold text-orange-400">{headline.toFixed(2)}%</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                    {metricValue != null ? 'Full-period TE' : 'Volatility deviation from benchmark'}
                    {metricValue != null && <span className="ml-3 text-orange-400/60">Rolling 20D: {last.tracking_error.toFixed(2)}%</span>}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" style={{ fontSize: '10px' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis style={{ fontSize: '10px' }} tickFormatter={v => `${v.toFixed(1)}%`} />
                    <Tooltip content={<ChartTooltip />} />
                    {metricValue != null && <ReferenceLine y={metricValue} stroke="#fb923c" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Overall ${metricValue.toFixed(1)}%`, position: 'insideTopRight', fill: '#fb923c80', fontSize: 10 }} />}
                    <Line type="monotone" dataKey="tracking_error" stroke="#fb923c" strokeWidth={2} dot={false} name="Tracking Error" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
