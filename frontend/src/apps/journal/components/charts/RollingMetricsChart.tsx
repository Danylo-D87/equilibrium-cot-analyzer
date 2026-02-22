import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { RollingMetricsPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RollingMetricsPoint[]; isLoading?: boolean; showTitle?: boolean; metricBeta?: number | null; metricSharpe?: number | null }

const fmt = (d: string) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; };

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="text-sm font-semibold font-mono" style={{ color: e.color }}>{e.name}: {e.value?.toFixed(4) ?? 'N/A'}</p>
            ))}
        </div>
    );
}

export default function RollingMetricsChart({ data, isLoading, showTitle = true, metricBeta, metricSharpe }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1] ?? {};
    const showOverall = metricBeta != null;
    const betaVal = metricBeta != null ? metricBeta : (last.rolling_beta ?? null);
    const sharpeVal = metricSharpe != null ? metricSharpe : (last.rolling_sharpe ?? null);

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Rolling Metrics</h3>}
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Beta</div>
                    <div className="text-xl font-mono font-bold text-blue-500">{betaVal?.toFixed(3) ?? 'N/A'}</div>
                    {showOverall && <div className="text-[9px] text-blue-400/50">Rolling: {last.rolling_beta?.toFixed(3) ?? 'N/A'}</div>}
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Correlation</div>
                    <div className="text-xl font-mono font-bold text-purple-500">{last.rolling_correlation?.toFixed(3) ?? 'N/A'}</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Sharpe</div>
                    <div className="text-xl font-mono font-bold text-green-500">{sharpeVal?.toFixed(2) ?? 'N/A'}</div>
                    {showOverall && <div className="text-[9px] text-green-400/50">Rolling: {last.rolling_sharpe?.toFixed(2) ?? 'N/A'}</div>}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" tickFormatter={fmt} style={{ fontSize: '10px' }} />
                    <YAxis yAxisId="left" style={{ fontSize: '10px' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine yAxisId="left" y={1} stroke="#525252" strokeDasharray="3 3" />
                    <ReferenceLine yAxisId="right" y={0} stroke="#525252" strokeDasharray="3 3" />
                    <Line yAxisId="left" type="monotone" dataKey="rolling_beta" stroke="#3b82f6" strokeWidth={2} dot={false} name="Beta" />
                    <Line yAxisId="right" type="monotone" dataKey="rolling_correlation" stroke="#a855f7" strokeWidth={2} dot={false} name="Correlation" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
