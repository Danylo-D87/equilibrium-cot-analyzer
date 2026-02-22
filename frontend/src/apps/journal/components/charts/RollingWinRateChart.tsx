import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { RollingWinRatePoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RollingWinRatePoint[]; isLoading?: boolean; showTitle?: boolean; metricValue?: number | null; winCount?: number; loseCount?: number }

const fmt = (d: string) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; };

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(d.date).toLocaleDateString()}</p>
            <p className="text-sm font-semibold font-mono text-blue-500">Win Rate: {d.win_rate.toFixed(1)}%</p>
            <p className="text-[10px] text-text-secondary">{d.winning_trades}W / {d.total_trades - d.winning_trades}L</p>
        </div>
    );
}

export default function RollingWinRateChart({ data, isLoading, showTitle = true, metricValue, winCount, loseCount }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1] ?? {};
    const headline = metricValue != null ? metricValue : (last.win_rate ?? 0);
    const showOverall = metricValue != null;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Rolling Win Rate</h3>}
            <div className="mb-4">
                <div className="text-2xl font-mono font-bold text-blue-500">{headline.toFixed(1)}%</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                    {showOverall
                        ? <>{winCount ?? 0}W / {loseCount ?? 0}L<span className="ml-3 text-blue-400/60">Rolling 20T: {last.win_rate?.toFixed(1)}%</span></>
                        : <>{last.winning_trades}W / {(last.total_trades ?? 0) - (last.winning_trades ?? 0)}L</>}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" tickFormatter={fmt} style={{ fontSize: '10px' }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine y={50} stroke="#525252" strokeDasharray="3 3" />
                    {metricValue != null && <ReferenceLine y={metricValue} stroke="#3b82f6" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Overall ${metricValue.toFixed(1)}%`, position: 'insideTopRight', fill: '#3b82f680', fontSize: 10 }} />}
                    <Line type="monotone" dataKey="win_rate" stroke="#3b82f6" strokeWidth={2} dot={false} name="Win Rate" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
