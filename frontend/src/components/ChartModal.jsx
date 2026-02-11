import React, { useState, useEffect, useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ReferenceLine,
} from 'recharts';

// =====================================================
// Constants
// =====================================================

const TIMEFRAMES = [
    { key: '6m', label: '6M', weeks: 26 },
    { key: '1y', label: '1Y', weeks: 52 },
    { key: '2y', label: '2Y', weeks: 104 },
    { key: 'all', label: 'ALL', weeks: Infinity },
];

const CHART_TABS = [
    { key: 'net', label: 'Net Positions' },
    { key: 'oi', label: 'Open Interest' },
    { key: 'cot_index', label: 'COT Index' },
];

const COLORS = {
    comm: '#10b981',      // emerald-500
    ls: '#f59e0b',        // amber-500
    st: '#ef4444',        // red-500
    oi: '#6366f1',        // indigo-500
    oiChange: '#6366f1',
    zero: '#262626',
    grid: '#262626',
    axis: '#525252',
    tooltipBg: '#0a0a0a',
    tooltipBorder: '#262626',
};

// =====================================================
// Formatters
// =====================================================

function formatCompact(val) {
    if (val == null) return '';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toString();
}

function formatNumber(val) {
    if (val == null) return '—';
    const num = Math.round(val);
    const sign = num < 0 ? '−' : '';
    const abs = Math.abs(num).toLocaleString('en-US').replace(/,/g, ' ');
    return sign + abs;
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y.slice(2)}`;
}

function formatDateTick(dateStr) {
    if (!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m)]} ${y.slice(2)}`;
}

// =====================================================
// Custom Tooltip
// =====================================================

function CustomTooltip({ active, payload, label, tab }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-sm px-3 py-2 shadow-xl">
            <div className="text-[10px] text-[#525252] mb-1.5">{formatDateShort(label)}</div>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[#a3a3a3] min-w-[80px]">{entry.name}</span>
                    <span className="text-white font-medium">
                        {tab === 'cot_index' ? `${Math.round(entry.value)}%` : formatNumber(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

// =====================================================
// Net Positions Chart
// =====================================================

function NetPositionsChart({ chartData }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDateTick}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                />
                <YAxis
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                />
                <Tooltip content={<CustomTooltip tab="net" />} />
                <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="line"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px' }}
                />
                <ReferenceLine y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                <Line
                    type="monotone"
                    dataKey="comm_net"
                    name="Commercials"
                    stroke={COLORS.comm}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.comm }}
                />
                <Line
                    type="monotone"
                    dataKey="ls_net"
                    name="Large Specs"
                    stroke={COLORS.ls}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.ls }}
                />
                <Line
                    type="monotone"
                    dataKey="st_net"
                    name="Small Traders"
                    stroke={COLORS.st}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.st }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// =====================================================
// Open Interest Chart
// =====================================================

function OpenInterestChart({ chartData }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDateTick}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                />
                <YAxis
                    yAxisId="left"
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 10, fill: '#444' }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                />
                <Tooltip content={<CustomTooltip tab="oi" />} />
                <Legend
                    verticalAlign="top"
                    height={28}
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px' }}
                />
                <ReferenceLine yAxisId="right" y={0} stroke={COLORS.zero} strokeDasharray="4 4" />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="open_interest"
                    name="Open Interest"
                    stroke={COLORS.oi}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.oi }}
                />
                <Bar
                    yAxisId="right"
                    dataKey="oi_change"
                    name="OI Change"
                    fill={COLORS.oiChange}
                    opacity={0.3}
                    barSize={3}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// =====================================================
// COT Index Chart
// =====================================================

function CotIndexChart({ chartData, period }) {
    const commKey = `cot_index_comm_${period}`;
    const lsKey = `cot_index_ls_${period}`;
    const stKey = `cot_index_st_${period}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDateTick}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={60}
                />
                <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    ticks={[0, 20, 50, 80, 100]}
                />
                <Tooltip content={<CustomTooltip tab="cot_index" />} />
                <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="line"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px' }}
                />
                <ReferenceLine y={80} stroke="#10b98133" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke={COLORS.zero} strokeDasharray="4 4" />
                <ReferenceLine y={20} stroke="#ef444433" strokeDasharray="3 3" />
                <Line
                    type="monotone"
                    dataKey={commKey}
                    name="Commercials"
                    stroke={COLORS.comm}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.comm }}
                    connectNulls
                />
                <Line
                    type="monotone"
                    dataKey={lsKey}
                    name="Large Specs"
                    stroke={COLORS.ls}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.ls }}
                    connectNulls
                />
                <Line
                    type="monotone"
                    dataKey={stKey}
                    name="Small Traders"
                    stroke={COLORS.st}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: COLORS.st }}
                    connectNulls
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// =====================================================
// COT Index period sub-tabs
// =====================================================

const COT_INDEX_PERIODS = [
    { key: '3m', label: '3M' },
    { key: '1y', label: '1Y' },
    { key: '3y', label: '3Y' },
];

// =====================================================
// Main Modal
// =====================================================

export default function ChartModal({ isOpen, onClose, data }) {
    const [activeTab, setActiveTab] = useState('net');
    const [timeframe, setTimeframe] = useState('1y');
    const [cotPeriod, setCotPeriod] = useState('1y');

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prepare chart data (reverse weeks — they come newest-first, chart needs oldest-first)
    const chartData = useMemo(() => {
        if (!data?.weeks) return [];
        const weeks = [...data.weeks].reverse();
        const tf = TIMEFRAMES.find(t => t.key === timeframe);
        const sliced = tf.weeks === Infinity ? weeks : weeks.slice(-tf.weeks);
        return sliced;
    }, [data, timeframe]);

    const marketName = data?.market?.name || 'Market';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-[96vw] max-w-[1600px] h-[90vh] bg-[#0a0a0a] border border-[#262626] rounded-sm shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex-shrink-0 h-12 border-b border-[#262626] flex items-center justify-between px-5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <span className="text-[13px] font-semibold text-white tracking-wider uppercase">
                            {marketName}
                        </span>
                        <span className="text-[10px] text-[#262626]">│</span>

                        {/* Chart tabs */}
                        <div className="flex gap-1">
                            {CHART_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${activeTab === tab.key
                                        ? 'bg-[#e5e5e5] text-black'
                                        : 'text-[#525252] hover:text-[#a3a3a3] hover:bg-[#121212]'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* COT Index period sub-tabs */}
                        {activeTab === 'cot_index' && (
                            <>
                                <span className="text-[10px] text-[#262626]">│</span>
                                <div className="flex gap-0.5">
                                    {COT_INDEX_PERIODS.map(p => (
                                        <button
                                            key={p.key}
                                            onClick={() => setCotPeriod(p.key)}
                                            className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition-colors ${cotPeriod === p.key
                                                ? 'bg-[#e5e5e5] text-black'
                                                : 'text-[#525252] hover:text-[#a3a3a3]'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Timeframe selector */}
                        <div className="flex gap-0.5 bg-[#050505] rounded-sm p-0.5">
                            {TIMEFRAMES.map(tf => (
                                <button
                                    key={tf.key}
                                    onClick={() => setTimeframe(tf.key)}
                                    className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition-colors ${timeframe === tf.key
                                        ? 'bg-[#e5e5e5] text-black'
                                        : 'text-[#525252] hover:text-[#a3a3a3]'
                                        }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-sm text-[#525252] hover:text-white hover:bg-[#121212] border border-transparent hover:border-[#262626] transition-all duration-300"
                            title="Закрити (Esc)"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M1 1l12 12M13 1L1 13" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Chart area */}
                <div className="flex-1 p-4 min-h-0">
                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-[#525252] text-xs uppercase tracking-wider">
                            No data available
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            {activeTab === 'net' && <NetPositionsChart chartData={chartData} />}
                            {activeTab === 'oi' && <OpenInterestChart chartData={chartData} />}
                            {activeTab === 'cot_index' && <CotIndexChart chartData={chartData} period={cotPeriod} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
