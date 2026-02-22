import { BarChart, Bar, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import type { RiskAdjustedComparison } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: RiskAdjustedComparison[]; isLoading?: boolean; showTitle?: boolean; metricType?: string }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{payload[0].payload.metric}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} className="text-sm font-semibold font-mono" style={{ color: e.fill }}>{e.name}: {e.value.toFixed(2)}</p>
            ))}
        </div>
    );
}

export default function RiskAdjustedComparisonChart({ data, isLoading, showTitle = true, metricType = 'Sharpe Ratio' }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const filtered = data.filter(i => i.metric_name === metricType);
    const chartData = filtered.map(i => ({ metric: i.metric_name.replace(' Ratio', ''), Portfolio: i.portfolio_value, BTC: i.benchmark_value }));
    if (!chartData.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data for {metricType}</div></Card>;

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Risk-Adjusted Comparison</h3>}
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Legend />
                    <Bar dataKey="Portfolio" fill="#8b5cf6" name="Portfolio" isAnimationActive={false} maxBarSize={64}>
                        <LabelList dataKey="Portfolio" position="top" style={{ fontSize: '11px', fill: '#8b5cf6' }} />
                    </Bar>
                    <Bar dataKey="BTC" fill="#64748b" name="BTC" isAnimationActive={false} maxBarSize={64}>
                        <LabelList dataKey="BTC" position="top" style={{ fontSize: '11px', fill: '#64748b' }} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}
