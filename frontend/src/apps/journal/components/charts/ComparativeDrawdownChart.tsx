import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { ComparativeDrawdownPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: ComparativeDrawdownPoint[]; isLoading?: boolean; showTitle?: boolean; maxDDPortfolio?: number | null; maxDDBenchmark?: number | null }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="text-sm font-semibold font-mono" style={{ color: e.color }}>{e.name}: {e.value.toFixed(2)}%</p>
            ))}
        </div>
    );
}

export default function ComparativeDrawdownChart({ data, isLoading, showTitle = true, maxDDPortfolio, maxDDBenchmark }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const minPort = maxDDPortfolio != null ? maxDDPortfolio : Math.min(...data.map(d => d.portfolio_drawdown));
    const minBench = maxDDBenchmark != null ? maxDDBenchmark : Math.min(...data.map(d => d.btc_drawdown));
    const diff = minPort - minBench;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Comparative Drawdown</h3>}
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Max DD · Portfolio</div>
                    <div className="text-xl font-mono font-bold text-purple-400">{minPort.toFixed(2)}%</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Max DD · BTC</div>
                    <div className="text-xl font-mono font-bold text-slate-400">{minBench.toFixed(2)}%</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Outperformance</div>
                    <div className={`text-xl font-mono font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}%</div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" style={{ fontSize: '10px' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis style={{ fontSize: '10px' }} tickFormatter={v => `${v.toFixed(0)}%`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#525252" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="portfolio_drawdown" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Portfolio" />
                    <Line type="monotone" dataKey="btc_drawdown" stroke="#64748b" strokeWidth={2} dot={false} name="BTC" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
