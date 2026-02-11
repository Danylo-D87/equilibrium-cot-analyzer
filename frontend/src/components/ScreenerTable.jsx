import React, { useState, useEffect, useMemo, useCallback } from 'react';

// =====================================================
// Build screener columns dynamically from groups
// =====================================================

function buildColumns(groups) {
    const fixed = [
        { key: 'name', label: 'Market', group: '', width: 180, align: 'left', sortable: true, type: 'text', sticky: true },
        { key: 'category_display', label: 'Category', group: '', width: 85, align: 'left', sortable: true, type: 'tag' },
        { key: 'exchange_code', label: 'Exch', group: '', width: 52, align: 'center', sortable: true, type: 'text' },
        { key: 'date', label: 'Date', group: '', width: 82, align: 'center', sortable: true, type: 'date' },
        { key: 'signals', label: 'Signals', group: '', width: 150, align: 'center', sortable: true, type: 'signal' },
        { key: 'open_interest', label: 'OI', group: 'Open Interest', width: 90, align: 'right', sortable: true, type: 'number' },
        { key: 'oi_change', label: 'OI Δ', group: 'Open Interest', width: 75, align: 'right', sortable: true, type: 'change' },
    ];

    const groupCols = (groups || []).flatMap(g => [
        { key: `${g.key}_net`, label: 'Net', group: g.short, width: 85, align: 'right', sortable: true, type: 'number' },
        { key: `${g.key}_change`, label: 'Δ Net', group: g.short, width: 75, align: 'right', sortable: true, type: 'change' },
        { key: `${g.key}_pct_oi`, label: '% OI', group: g.short, width: 52, align: 'right', sortable: true, type: 'pct' },
        { key: `cot_${g.key}_1y`, label: 'COT 1Y', group: g.short, width: 58, align: 'center', sortable: true, type: 'index' },
        { key: `crowded_${g.key}`, label: 'Crowd', group: g.short, width: 56, align: 'center', sortable: true, type: 'crowded', signalKey: `signal_${g.key}` },
    ]);

    return [...fixed, ...groupCols];
}

// =====================================================
// Category filter tags
// =====================================================

const CATEGORY_ORDER = [
    { key: 'all', label: 'All' },
    { key: 'currencies', label: 'FX' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'energy', label: 'Energy' },
    { key: 'metals', label: 'Metals' },
    { key: 'grains', label: 'Grains' },
    { key: 'softs', label: 'Softs' },
    { key: 'indices', label: 'Indices' },
    { key: 'rates', label: 'Rates' },
    { key: 'livestock', label: 'Livestock' },
    { key: 'other', label: 'Other' },
];

// =====================================================
// Color helpers
// =====================================================

const GREEN = [0, 176, 80];
const RED = [220, 53, 69];

function indexBg(v) {
    if (v == null) return '';
    const dev = Math.abs(v - 50) / 50;
    if (dev < 0.03) return '';
    const c = v > 50 ? GREEN : RED;
    const op = 0.05 + dev * 0.55;
    return `rgba(${c[0]},${c[1]},${c[2]},${op.toFixed(3)})`;
}

function changeBg(v) {
    if (v == null || v === 0) return '';
    const c = v > 0 ? GREEN : RED;
    return `rgba(${c[0]},${c[1]},${c[2]},0.10)`;
}

// =====================================================
// Formatters
// =====================================================

function fmtNum(v) {
    if (v == null) return '—';
    const n = Math.round(v);
    const s = n < 0 ? '-' : '';
    return s + Math.abs(n).toLocaleString('en-US').replace(/,/g, ' ');
}

function fmtPct(v) {
    if (v == null) return '—';
    return `${Math.round(v)}%`;
}

function fmtDate(d) {
    if (!d) return '—';
    const [y, m, dd] = d.split('-');
    return `${dd}.${m}.${y}`;
}

function fmtIndex(v) {
    if (v == null) return '—';
    return Math.round(v);
}

// =====================================================
// Category color
// =====================================================

const CAT_COLORS = {
    currencies: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
    crypto: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc' },
    energy: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
    metals: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
    grains: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
    softs: { bg: 'rgba(244,114,182,0.12)', text: '#f472b6' },
    indices: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
    rates: { bg: 'rgba(20,184,166,0.12)', text: '#2dd4bf' },
    livestock: { bg: 'rgba(251,146,60,0.12)', text: '#fb923c' },
    other: { bg: 'rgba(75,85,99,0.15)', text: '#6b7280' },
};

// =====================================================
// Main component
// =====================================================

export default function ScreenerTable({ onSelectMarket, reportType = 'legacy', subtype = 'fo' }) {
    const [data, setData] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sortKey, setSortKey] = useState('signals');
    const [sortDir, setSortDir] = useState('desc');
    const [signalFilter, setSignalFilter] = useState('all'); // 'all' | 'buy' | 'sell' | 'active'

    // Build columns dynamically from groups
    const COLUMNS = useMemo(() => buildColumns(groups), [groups]);
    const TOTAL_WIDTH = useMemo(() => COLUMNS.reduce((s, c) => s + c.width, 0), [COLUMNS]);

    // Fetch screener data + group definitions when report type/subtype changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const safeParse = async (url) => {
                    const r = await fetch(url);
                    if (!r.ok) return null;
                    const t = await r.text();
                    if (!t || t.trimStart().startsWith('<')) return null;
                    return JSON.parse(t);
                };
                const [screenerJson, groupsJson] = await Promise.all([
                    safeParse(`/data/screener_${reportType}_${subtype}.json`),
                    safeParse(`/data/groups_${reportType}.json`),
                ]);
                if (!screenerJson) throw new Error('Failed to load screener');
                if (cancelled) return;
                setData(screenerJson);
                setGroups(groupsJson || []);
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [reportType, subtype]);

    // Sort handler
    const handleSort = useCallback((key) => {
        setSortKey(prev => {
            if (prev === key) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return key;
            }
            setSortDir('desc');
            return key;
        });
    }, []);

    // Filter + sort
    const rows = useMemo(() => {
        if (!data) return [];
        let list = data;

        // Category filter
        if (category !== 'all') {
            list = list.filter(r => r.category === category);
        }

        // Signal filter
        if (signalFilter === 'active') {
            list = list.filter(r => r.signals && r.signals.length > 0);
        } else if (signalFilter === 'buy') {
            list = list.filter(r => r.signals && r.signals.some(s => s.signal === 'BUY'));
        } else if (signalFilter === 'sell') {
            list = list.filter(r => r.signals && r.signals.some(s => s.signal === 'SELL'));
        }

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.exchange_code?.toLowerCase().includes(q) ||
                r.code?.includes(q) ||
                r.category_display?.toLowerCase().includes(q)
            );
        }

        // Sort
        const dir = sortDir === 'asc' ? 1 : -1;
        list = [...list].sort((a, b) => {
            let va = a[sortKey];
            let vb = b[sortKey];

            // signals: sort by count of signals
            if (sortKey === 'signals') {
                const ha = va && va.length ? va.length : 0;
                const hb = vb && vb.length ? vb.length : 0;
                if (ha !== hb) return (ha - hb) * dir;
                return 0;
            }

            // Strings
            if (typeof va === 'string' || typeof vb === 'string') {
                return (va || '').localeCompare(vb || '') * dir;
            }

            // Nulls go last
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;

            return (va - vb) * dir;
        });

        return list;
    }, [data, category, search, sortKey, sortDir, signalFilter]);

    // Category counts
    const catCounts = useMemo(() => {
        if (!data) return {};
        const counts = { all: data.length };
        for (const r of data) {
            counts[r.category] = (counts[r.category] || 0) + 1;
        }
        return counts;
    }, [data]);

    // Signal counts
    const signalCounts = useMemo(() => {
        if (!data) return { all: 0, active: 0, buy: 0, sell: 0 };
        let list = category !== 'all' ? data.filter(r => r.category === category) : data;
        return {
            all: list.length,
            active: list.filter(r => r.signals && r.signals.length > 0).length,
            buy: list.filter(r => r.signals && r.signals.some(s => s.signal === 'BUY')).length,
            sell: list.filter(r => r.signals && r.signals.some(s => s.signal === 'SELL')).length,
        };
    }, [data, category]);

    // Group headers
    const groupHeaders = useMemo(() => {
        const hdrGroups = [];
        let cur = null;
        for (const col of COLUMNS) {
            const g = col.group || '';
            if (!cur || cur.name !== g) {
                cur = { name: g, span: 1 };
                hdrGroups.push(cur);
            } else {
                cur.span++;
            }
        }
        return hdrGroups;
    }, [COLUMNS]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#e5e5e5]" />
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div className="text-[#525252] text-center py-10 text-xs uppercase tracking-widest font-medium">
                No screener data available
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex-shrink-0 border-b border-[#262626] bg-[#0a0a0a] px-6 py-3 space-y-2.5">
                {/* Row 1: Search + Signal filters */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search market..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-60 pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-sm text-[11px] text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#404040] focus:bg-[#121212] transition-all duration-300"
                        />
                    </div>

                    {/* Signal filter pills */}
                    <div className="flex items-center gap-1.5 ml-1">
                        <span className="text-[10px] text-[#525252] mr-0.5 uppercase tracking-widest font-bold">Signals:</span>
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'active', label: '⚡ Active' },
                            { key: 'buy', label: '▲ BUY' },
                            { key: 'sell', label: '▼ SELL' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setSignalFilter(f.key)}
                                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${signalFilter === f.key
                                    ? f.key === 'buy' ? 'bg-green-500/12 text-green-400 border border-green-500/25'
                                        : f.key === 'sell' ? 'bg-red-500/12 text-red-400 border border-red-500/25'
                                            : 'bg-[#e5e5e5] text-black border border-transparent'
                                    : 'text-[#525252] hover:text-[#a3a3a3] border border-transparent hover:border-[#262626] hover:bg-[#121212]'
                                    }`}
                            >
                                {f.label}
                                <span className="ml-1.5 text-[#525252] font-medium">
                                    {f.key === 'all' ? signalCounts.all
                                        : f.key === 'active' ? signalCounts.active
                                            : f.key === 'buy' ? signalCounts.buy
                                                : signalCounts.sell}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Row count */}
                    <div className="ml-auto text-[10px] text-[#525252] tabular-nums font-bold uppercase tracking-wider">
                        {rows.length} markets
                    </div>
                </div>

                {/* Row 2: Category chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORY_ORDER.map(cat => {
                        const count = catCounts[cat.key] || 0;
                        const active = category === cat.key;
                        const colors = cat.key !== 'all' ? CAT_COLORS[cat.key] : null;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setCategory(cat.key)}
                                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${active
                                    ? cat.key === 'all'
                                        ? 'bg-[#e5e5e5] text-black border border-transparent'
                                        : 'border'
                                    : 'text-[#525252] hover:text-[#a3a3a3] border border-transparent hover:border-[#262626] hover:bg-[#121212]'
                                    }`}
                                style={active && colors ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.text + '30' } : undefined}
                            >
                                {cat.label}
                                {count > 0 && <span className="ml-1.5 text-[9px] opacity-50">{count}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="border-collapse text-[11px] leading-tight" style={{ minWidth: TOTAL_WIDTH }}>
                    <thead className="sticky top-0 z-20">
                        {/* Group headers */}
                        <tr className="bg-[#0a0a0a]">
                            {groupHeaders.map((g, i) => (
                                <th
                                    key={i}
                                    colSpan={g.span}
                                    className="px-1 py-2 text-[10px] font-bold text-[#525252] border-b border-r border-[#262626]/50 text-center whitespace-nowrap uppercase tracking-widest"
                                >
                                    {g.name}
                                </th>
                            ))}
                        </tr>
                        {/* Column headers */}
                        <tr className="bg-[#080808]">
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                    className={`px-1.5 py-2 text-[10px] font-bold border-b border-r border-[#262626]/50 whitespace-nowrap select-none uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-[#e5e5e5]' : ''
                                        } ${sortKey === col.key ? 'text-[#e5e5e5]' : 'text-[#525252]'} ${col.sticky ? 'sticky left-0 z-10 bg-[#080808]' : ''
                                        }`}
                                    style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                                >
                                    {col.label}
                                    {sortKey === col.key && (
                                        <span className="ml-0.5 text-[8px]">
                                            {sortDir === 'asc' ? '▲' : '▼'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr
                                key={row.code}
                                onClick={() => onSelectMarket && onSelectMarket(row.code)}
                                className="border-b border-[#262626]/30 hover:bg-[#121212]/50 cursor-pointer transition-colors duration-200 group"
                            >
                                {COLUMNS.map(col => (
                                    <td
                                        key={col.key}
                                        className={`px-1.5 py-[6px] border-r border-[#262626]/30 whitespace-nowrap ${col.sticky ? 'sticky left-0 z-10 bg-[#050505] group-hover:bg-[#121212] transition-colors' : ''
                                            }`}
                                        style={{
                                            width: col.width,
                                            minWidth: col.width,
                                            textAlign: col.align,
                                            backgroundColor: col.sticky ? undefined : getCellBg(row, col),
                                        }}
                                    >
                                        {renderCell(row, col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// =====================================================
// Cell background
// =====================================================

function getCellBg(row, col) {
    const v = row[col.key];
    switch (col.type) {
        case 'index':
        case 'crowded':
            return indexBg(v);
        case 'change':
            return changeBg(v);
        default:
            return undefined;
    }
}

// =====================================================
// Cell rendering
// =====================================================

function renderCell(row, col) {
    const v = row[col.key];

    switch (col.type) {
        case 'text':
            if (col.key === 'name') {
                const assetName = v ? v.split(' - ')[0] : '';
                return (
                    <span className="text-[#e5e5e5] group-hover:text-white font-medium transition-colors truncate block max-w-[180px]" title={v}>
                        {assetName}
                    </span>
                );
            }
            return <span className="text-[#a3a3a3]">{v || '—'}</span>;

        case 'tag': {
            const colors = CAT_COLORS[row.category] || CAT_COLORS.other;
            return (
                <span
                    className="inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                    {v}
                </span>
            );
        }

        case 'date':
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{fmtDate(v)}</span>;

        case 'number':
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{fmtNum(v)}</span>;

        case 'change': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-[#525252]';
            return (
                <span className={`tabular-nums ${color}`}>
                    {v > 0 ? '+' : ''}{fmtNum(v)}
                </span>
            );
        }

        case 'pct':
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{fmtPct(v)}</span>;

        case 'index': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v >= 70 ? 'text-green-300' : v <= 30 ? 'text-red-300' : 'text-[#a3a3a3]';
            return <span className={`tabular-nums font-medium ${color}`}>{fmtIndex(v)}</span>;
        }

        case 'crowded': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const signal = row[col.signalKey];
            if (signal === 'BUY') {
                return <span className="font-bold text-green-400 text-[10px]">BUY</span>;
            }
            if (signal === 'SELL') {
                return <span className="font-bold text-red-400 text-[10px]">SELL</span>;
            }
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{Math.round(v)}</span>;
        }

        case 'signal': {
            if (!v || !v.length) return <span className="text-[#262626]">—</span>;
            return (
                <span className="flex items-center justify-center gap-1 flex-wrap">
                    {v.map((s, i) => {
                        const isBuy = s.signal === 'BUY';
                        return (
                            <span
                                key={i}
                                className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${isBuy
                                    ? 'bg-green-500/12 text-green-400'
                                    : 'bg-red-500/12 text-red-400'
                                    }`}
                            >
                                {s.signal} ({s.group})
                            </span>
                        );
                    })}
                </span>
            );
        }

        default:
            return <span className="text-[#a3a3a3]">{v ?? '—'}</span>;
    }
}
