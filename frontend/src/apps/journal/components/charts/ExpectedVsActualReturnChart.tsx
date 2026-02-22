import { BarChart, Bar, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { ExpectedVsActualReturn } from '../../types';
import { Card } from '../ui/Card';

interface Props { data?: ExpectedVsActualReturn[]; isLoading?: boolean; showTitle?: boolean }

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-1">{payload[0].payload.metric}</p>
            <p className="text-sm font-semibold font-mono" style={{ color: payload[0].fill }}>{payload[0].value.toFixed(2)}%</p>
        </div>
    );
}

export default function ExpectedVsActualReturnChart({ data, isLoading, showTitle = true }: Props) {
    if (isLoading) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">Loading...</div></Card>;
    if (!data?.length) return <Card className="p-6"><div className="h-64 flex items-center justify-center text-text-muted text-xs uppercase tracking-widest">No data</div></Card>;

    const chartData = data.map(i => ({ metric: i.metric_name.replace(' Return', ''), value: i.return_value }));

    return (
        <Card className="p-6">
            {showTitle && <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Expected vs Actual Return</h3>}
            <ResponsiveContainer width="100%" height={showTitle ? 300 : 400}>
                <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Bar dataKey="value" fill="#8b5cf6" name="Return %" isAnimationActive={false} maxBarSize={64}>
                        <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#8b5cf6' }} formatter={(v: number) => `${v.toFixed(2)}%`} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
}
