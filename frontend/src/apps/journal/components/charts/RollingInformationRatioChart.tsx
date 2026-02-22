import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RollingInformationRatioPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RollingInformationRatioPoint[]; isLoading?: boolean; showTitle?: boolean; metricValue?: number | null }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            <p className="text-sm font-semibold font-mono text-blue-400">IR: {payload[0].value.toFixed(2)}</p>
        </div>
    );
}

export default function RollingInformationRatioChart({ data, isLoading, showTitle = true, metricValue }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1];
    const headline = metricValue != null ? metricValue : last.information_ratio;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Rolling Information Ratio</h3>}
            <div className="mb-4">
                <div className="text-2xl font-mono font-bold text-blue-400">{headline.toFixed(2)}</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                    {metricValue != null ? 'Full-period IR' : '30-day rolling window'}
                    {metricValue != null && <span className="ml-3 text-blue-400/60">Rolling 20D: {last.information_ratio.toFixed(2)}</span>}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" style={{ fontSize: '10px' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#525252" strokeDasharray="3 3" />
                    {metricValue != null && <ReferenceLine y={metricValue} stroke="#60a5fa" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Overall ${metricValue.toFixed(2)}`, position: 'insideTopRight', fill: '#60a5fa80', fontSize: 10 }} />}
                    <Line type="monotone" dataKey="information_ratio" stroke="#60a5fa" strokeWidth={2} dot={false} name="IR" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
