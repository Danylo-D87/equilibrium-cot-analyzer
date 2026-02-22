import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { DrawdownPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: DrawdownPoint[]; isLoading?: boolean; showTitle?: boolean; maxDDPortfolio?: number | null; maxDDBenchmark?: number | null }

const fmt = (d: string) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; };

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

export default function DrawdownChart({ data, isLoading, showTitle = true, maxDDPortfolio, maxDDBenchmark }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const last = data[data.length - 1];
    const minPort = maxDDPortfolio != null ? maxDDPortfolio : Math.min(...data.map(d => d.portfolio_drawdown));
    const minBench = maxDDBenchmark != null ? maxDDBenchmark : Math.min(...data.map(d => d.benchmark_drawdown));
    const currentPort = last?.portfolio_drawdown ?? 0;
    const currentBench = last?.benchmark_drawdown ?? 0;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Drawdown</h3>}
            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Max DD · Portfolio</div>
                    <div className={`text-2xl font-mono font-bold ${Math.abs(minPort) < 5 ? 'text-success-fg' : Math.abs(minPort) < 15 ? 'text-yellow-500' : 'text-destructive-fg'}`}>
                        {minPort.toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-text-secondary">Current: {currentPort.toFixed(2)}%</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Max DD · BTC</div>
                    <div className="text-2xl font-mono font-bold text-orange-500">{minBench.toFixed(2)}%</div>
                    <div className="text-[9px] text-text-secondary">Current: {currentBench.toFixed(2)}%</div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="ddPort" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                        <linearGradient id="ddBench" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmt} style={{ fontSize: '10px' }} />
                    <YAxis tickFormatter={v => `${v}%`} style={{ fontSize: '10px' }} domain={['auto', 0]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#525252" />
                    <Area type="monotone" dataKey="portfolio_drawdown" stroke="#3b82f6" fillOpacity={1} fill="url(#ddPort)" name="Portfolio DD" />
                    <Area type="monotone" dataKey="benchmark_drawdown" stroke="#f97316" fillOpacity={1} fill="url(#ddBench)" name="BTC DD" />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}
