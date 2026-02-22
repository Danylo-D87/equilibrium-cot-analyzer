import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';
import type { DailyReturnPoint } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: DailyReturnPoint[]; isLoading?: boolean; showTitle?: boolean }

const fmt = (d: string) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="text-sm font-semibold font-mono" style={{ color: e.fill }}>{e.name}: {e.value >= 0 ? '+' : ''}{e.value.toFixed(2)}%</p>
            ))}
        </div>
    );
}

export default function DailyReturnsChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const rets = data.map(d => d.portfolio_return);
    const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
    const vol = Math.sqrt(rets.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / rets.length);

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Daily Returns</h3>}
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div><span className="text-[10px] text-text-muted uppercase tracking-wider">Avg Daily:</span><span className={`ml-2 font-mono font-bold ${avg >= 0 ? 'text-success-fg' : 'text-destructive-fg'}`}>{avg >= 0 ? '+' : ''}{avg.toFixed(2)}%</span></div>
                <div><span className="text-[10px] text-text-muted uppercase tracking-wider">Volatility:</span><span className="ml-2 font-mono font-bold text-blue-500">{vol.toFixed(2)}%</span></div>
                <div><span className="text-[10px] text-text-muted uppercase tracking-wider">Range:</span><span className="ml-2 text-sm font-mono"><span className="text-destructive-fg">{Math.min(...rets).toFixed(1)}%</span> / <span className="text-success-fg">+{Math.max(...rets).toFixed(1)}%</span></span></div>
            </div>
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <BarChart data={data}>
                    <XAxis dataKey="date" tickFormatter={fmt} style={{ fontSize: '10px' }} interval={Math.floor(data.length / 10)} />
                    <YAxis tickFormatter={v => `${v}%`} style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#525252" />
                    <Bar dataKey="portfolio_return" name="Portfolio" radius={[2, 2, 0, 0]}>
                        {data.map((e, i) => <Cell key={i} fill={e.portfolio_return >= 0 ? '#10b981' : '#ef4444'} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}
