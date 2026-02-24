/**
 * Indicator 2 — Velocity (Rate of Change).
 *
 * MACD-style histogram oscillator showing the velocity (weekly rate of change)
 * of speculator net positions.
 * Green bars = increasing long, Red bars = decreasing / reversing.
 * Warning diamonds when velocity opposes net position direction.
 *
 * Plan reference: Section 4.8 — Advanced Indicators
 */

import { useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, Bar, Line,
    XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { D, MARGIN_NARROW, fmtK, fmtTick, fmtDateShort, TOOLTIP_STYLE } from './chartTheme';
import PricePanel from './PricePanel';
import type { DashboardData } from '../../types/dashboard';

interface VelocityChartProps {
    data: DashboardData;
}

export default function VelocityChart({ data }: VelocityChartProps) {
    const { velocity } = data;

    const chartData = useMemo(
        () =>
            velocity.map((v) => ({
                date: v.date,
                velocity: v.velocity,
                netPosition: v.netPosition,
                warning: v.warning,
            })),
        [velocity],
    );

    const warningCount = useMemo(
        () => chartData.filter((d) => d.warning).length,
        [chartData],
    );

    const latest = chartData[chartData.length - 1];

    if (chartData.length === 0) {
        return <div className="h-full flex items-center justify-center text-white/20 text-xs">No data</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Price panel — 70% */}
            <div className="h-[70%]">
                <PricePanel priceSeries={data.priceSeries} weeks={data.weeks} />
            </div>

            {/* Velocity — 30% */}
            <div className="h-[30%] flex flex-col border-t border-white/[0.03]">
            {/* Latest badges */}
            <div className="flex items-center gap-3 px-1 pt-1 flex-shrink-0">
                <span className="text-[10px] text-white/30">Velocity:</span>
                <span className={`text-[10px] font-medium ${latest && latest.velocity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {latest ? fmtK(latest.velocity) : '—'}
                </span>
                {warningCount > 0 && (
                    <span className="text-[10px] text-yellow-400 ml-auto">
                        ⚠ {warningCount} warnings
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={MARGIN_NARROW}>
                        <CartesianGrid strokeDasharray="3 3" stroke={D.grid} vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={fmtTick}
                            tick={{ fontSize: 9, fill: D.axis }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            minTickGap={60}
                        />
                        <YAxis
                            yAxisId="vel"
                            orientation="right"
                            tickFormatter={fmtK}
                            tick={{ fontSize: 9, fill: D.axis }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                        />

                        <Tooltip
                            {...TOOLTIP_STYLE}
                            labelFormatter={fmtDateShort}
                            formatter={(value: number, name: string) => {
                                if (name === 'velocity') return [fmtK(value), 'Velocity'];
                                if (name === 'netPosition') return [fmtK(value), 'Net Position'];
                                return [value, name];
                            }}
                        />

                        {/* Zero line */}
                        <ReferenceLine yAxisId="vel" y={0} stroke={D.axis} strokeDasharray="3 3" />

                        {/* Velocity histogram bars + inline warning diamonds */}
                        <Bar
                            yAxisId="vel"
                            dataKey="velocity"
                            maxBarSize={4}
                            shape={((props: { x: number; y: number; width: number; height: number; payload: { velocity: number; warning: boolean } }) => {
                                const { x, y, width, height, payload } = props;
                                if (!payload) return null;
                                const fill = payload.velocity >= 0 ? D.velocityPos : D.velocityNeg;
                                const cx = x + width / 2;
                                // Normalise rect coords — SVG <rect> requires positive height
                                const rectY = height < 0 ? y + height : y;
                                const rectH = Math.abs(height);
                                // Place diamond just above (positive) or below (negative) the bar tip
                                const tipY = payload.velocity >= 0 ? rectY - 6 : rectY + rectH + 6;
                                return (
                                    <g>
                                        <rect x={x} y={rectY} width={width} height={rectH} fill={fill} fillOpacity={0.7} />
                                        {payload.warning && (
                                            <polygon
                                                points={`${cx},${tipY - 4} ${cx + 4},${tipY} ${cx},${tipY + 4} ${cx - 4},${tipY}`}
                                                fill={D.warningDiamond}
                                                fillOpacity={0.9}
                                            />
                                        )}
                                    </g>
                                );
                            }) as any}
                        />

                        {/* Net position faint line overlay */}
                        <Line
                            yAxisId="vel"
                            type="monotone"
                            dataKey="netPosition"
                            stroke={D.specLine}
                            dot={false}
                            strokeWidth={1}
                            strokeOpacity={0.3}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="h-5 flex items-center justify-center gap-4 text-[9px] text-white/30 flex-shrink-0">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: D.velocityPos }} />
                    Positive
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: D.velocityNeg }} />
                    Negative
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2" style={{ background: D.warningDiamond, transform: 'rotate(45deg)' }} />
                    Warning
                </span>
            </div>
            </div>
        </div>
    );
}
