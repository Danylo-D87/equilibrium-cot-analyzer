import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { RMultipleDistribution } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RMultipleDistribution[]; isLoading?: boolean; showTitle?: boolean }

function getBarColor(bucket: string) {
    if (bucket.includes('>3R') || bucket.includes('2R to 3R')) return '#22c55e';
    if (bucket.includes('1R to 2R')) return '#86efac';
    if (bucket.includes('0R to 1R')) return '#fde047';
    if (bucket.includes('-1R to 0R')) return '#fb923c';
    return '#ef4444';
}

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as RMultipleDistribution;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-sm font-semibold text-text-primary mb-1">{d.r_bucket}</p>
            <p className="text-[10px] text-text-secondary">Count: {d.count}</p>
            <p className="text-[10px] text-text-secondary">{d.percentage.toFixed(1)}% of trades</p>
        </div>
    );
}

export default function RMultipleDistributionChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">R-Multiple Distribution</h3>}
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <BarChart data={data}>
                    <XAxis dataKey="r_bucket" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis style={{ fontSize: '10px' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Trades">
                        {data.map((e, i) => <Cell key={i} fill={getBarColor(e.r_bucket)} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}
