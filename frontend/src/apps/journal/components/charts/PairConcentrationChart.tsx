/**
 * PairConcentrationChart – treemap-style bar chart showing pair concentration.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AssetsExposureData } from '../../types';

interface Props {
    exposureData: AssetsExposureData[];
    loading?: boolean;
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899'];

export default function PairConcentrationChart({ exposureData, loading }: Props) {
    if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full" /></div>;
    if (!exposureData?.length) return <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>;

    const totalTrades = exposureData.reduce((s, e) => s + e.total_trades, 0);
    const data = exposureData
        .map((e) => ({ pair: e.pair, trades: e.total_trades, pct: totalTrades ? ((e.total_trades / totalTrades) * 100) : 0 }))
        .sort((a, b) => b.trades - a.trades);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="bg-surface border border-border rounded-sm shadow-2xl px-3 py-2">
                <p className="text-xs font-medium text-text-primary uppercase">{d.pair}</p>
                <p className="text-xs text-text-secondary">{d.trades} trades ({d.pct.toFixed(1)}%)</p>
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <XAxis dataKey="pair" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
