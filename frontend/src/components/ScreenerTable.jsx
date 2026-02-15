import React, { useState, useMemo, useCallback, useRef } from 'react';
import { formatNumber, formatDate, formatPctSigned } from '../utils/formatters';
import { changeBg, CAT_COLORS } from '../utils/colors';
import { CATEGORY_ORDER } from '../utils/constants';
import { useScreenerData } from '../hooks/useMarketQueries';
import Spinner from './ui/Spinner';

// =====================================================
// Build screener columns dynamically from groups
// =====================================================

function buildColumns(groups) {
    const left = [
        { key: 'name', label: 'Market', group: '', width: 180, align: 'left', sortable: true, type: 'text', sticky: true },
        { key: 'category_display', label: 'Category', group: '', width: 85, align: 'left', sortable: true, type: 'tag' },
        { key: 'date', label: 'Date', group: '', width: 82, align: 'center', sortable: true, type: 'date' },
    ];

    const groupCols = (groups || []).flatMap(g => [
        { key: `${g.key}_total`, label: 'Pos', group: g.short, width: 80, align: 'right', sortable: true, type: 'number' },
        { key: `${g.key}_bar`, label: 'L/S', group: g.short, width: 80, align: 'center', sortable: true, type: 'bar', groupKey: g.key, sortBy: `${g.key}_short_ratio` },
        { key: `${g.key}_change_total`, label: 'О”', group: g.short, width: 68, align: 'right', sortable: true, type: 'change' },
        { key: `${g.key}_pct_oi_total`, label: '% OI', group: g.short, width: 58, align: 'right', sortable: true, type: 'pct' },
        { key: `${g.key}_pct_oi_total_change`, label: 'О”%', group: g.short, width: 52, align: 'right', sortable: true, type: 'pct_change' },
    ]);

    const oiCols = [
        { key: 'open_interest', label: 'OI', group: 'Open Interest', width: 90, align: 'right', sortable: true, type: 'number' },
        { key: 'oi_change', label: 'О” OI', group: 'Open Interest', width: 75, align: 'right', sortable: true, type: 'change' },
    ];

    const allCols = [
        { key: 'all_bar', label: 'L/S', group: 'Total', width: 80, align: 'center', sortable: true, type: 'bar', groupKey: 'all', sortBy: 'all_short_ratio' },
    ];

    return [...left, ...groupCols, ...oiCols, ...allCols];
}

// =====================================================
// Long/Short Position Bar with tooltip
// =====================================================

function PositionBar({ long, short, changeLong, changeShort }) {
    const [hover, setHover] = useState(false);
    const ref = useRef(null);
    const [tip, setTip] = useState({ x: 0, y: 0 });

    if (!long || !short) {
        return <span style={{ color: '#525252', fontSize: 9 }}>—</span>;
    }

    const total = Math.abs(long) + Math.abs(short);
    const longPct = (Math.abs(long) / total) * 100;
    const shortPct = (Math.abs(short) / total) * 100;

    const onEnter = () => {
        const r = ref.current?.getBoundingClientRect();
        if (r) setTip({ x: r.left + r.width / 2, y: r.top });
        setHover(true);
    };

    return (
        <div
            ref={ref}
            onMouseEnter={onEnter}
            onMouseLeave={() => setHover(false)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 70, height: 14, borderRadius: 2, overflow: 'hidden', background: '#1a1a1a', cursor: 'default' }}
        >
            <div style={{ height: '100%', width: `${shortPct}%`, background: 'rgba(239,68,68,0.45)' }} />
            <div style={{ height: '100%', width: `${longPct}%`, background: 'rgba(34,197,94,0.45)' }} />
            {hover && (
                <div
                    style={{
                        position: 'fixed', left: tip.x, top: tip.y - 8,
                        transform: 'translate(-50%, -100%)', zIndex: 9999,
                        pointerEvents: 'none',
                    }}
                >
                    <div style={{
                        background: '#1a1a1a', border: '1px solid #333',
                        borderRadius: 4, padding: '6px 10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        fontSize: 10, whiteSpace: 'nowrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 1, background: 'rgba(34,197,94,0.7)' }} />
                            <span style={{ color: '#a3a3a3' }}>Long:</span>
                            <span style={{ color: '#e5e5e5', fontFamily: 'monospace', fontWeight: 600 }}>{formatNumber(long)}</span>
                            <span style={{ color: '#525252', fontFamily: 'monospace' }}>({longPct.toFixed(1)}%)</span>
                            {changeLong != null && (
                                <span style={{ fontFamily: 'monospace', color: changeLong > 0 ? '#4ade80' : changeLong < 0 ? '#f87171' : '#525252' }}>
                                    {changeLong > 0 ? '+' : ''}{formatNumber(changeLong)}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 1, background: 'rgba(239,68,68,0.7)' }} />
                            <span style={{ color: '#a3a3a3' }}>Short:</span>
                            <span style={{ color: '#e5e5e5', fontFamily: 'monospace', fontWeight: 600 }}>{formatNumber(short)}</span>
                            <span style={{ color: '#525252', fontFamily: 'monospace' }}>({shortPct.toFixed(1)}%)</span>
                            {changeShort != null && (
                                <span style={{ fontFamily: 'monospace', color: changeShort > 0 ? '#4ade80' : changeShort < 0 ? '#f87171' : '#525252' }}>
                                    {changeShort > 0 ? '+' : ''}{formatNumber(changeShort)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =====================================================
// Pure function: enrich screener rows with computed cols
// =====================================================

function enrichRows(rows, groups) {
    const gs = groups || [];
    for (const row of rows) {
        const oi = row.open_interest || 0;
        let allLong = 0, allShort = 0, allValid = false;
        let allCL = 0, allCS = 0, allChangeValid = false;
        for (const g of gs) {
            const gk = g.key;
            const l = row[`${gk}_long`];
            const s = row[`${gk}_short`];
            const cl = row[`${gk}_change_long`];
            const cs = row[`${gk}_change_short`];
            row[`${gk}_total`] = (l != null && s != null) ? l + s : null;
            const tot = (l != null && s != null) ? l + s : 0;
            row[`${gk}_short_ratio`] = tot > 0 ? s / tot : null;
            row[`${gk}_change_total`] = (cl != null && cs != null) ? cl + cs : null;
            const total = row[`${gk}_total`];
            row[`${gk}_pct_oi_total`] = (total != null && oi) ? Math.round((total / oi) * 1000) / 10 : null;
            const ct = row[`${gk}_change_total`];
            row[`${gk}_pct_oi_total_change`] = (ct != null && oi) ? Math.round((ct / oi) * 1000) / 10 : null;
            if (l != null && s != null) { allLong += l; allShort += s; allValid = true; }
            if (cl != null && cs != null) { allCL += cl; allCS += cs; allChangeValid = true; }
        }
        row.all_long = allValid ? allLong : null;
        row.all_short = allValid ? allShort : null;
        row.all_change_long = allChangeValid ? allCL : null;
        row.all_change_short = allChangeValid ? allCS : null;
        const allTotal = allValid ? allLong + allShort : 0;
        row.all_short_ratio = allTotal > 0 ? allShort / allTotal : null;
    }
    return rows;
}

// =====================================================
// Main component
// =====================================================

export default function ScreenerTable({ onSelectMarket, reportType = 'legacy', subtype = 'fo' }) {
    const { screenerData, groups, isLoading: loading, error } = useScreenerData(reportType, subtype);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sortKey, setSortKey] = useState('open_interest');
    const [sortDir, setSortDir] = useState('desc');

    // Enrich raw screener data with computed columns
    const data = useMemo(() => {
        if (!screenerData) return null;
        return enrichRows([...screenerData], groups);
    }, [screenerData, groups]);

    // Build columns dynamically from groups
    const COLUMNS = useMemo(() => buildColumns(groups), [groups]);
    const TOTAL_WIDTH = useMemo(() => COLUMNS.reduce((s, c) => s + c.width, 0), [COLUMNS]);

    // Sort handler
    const handleSort = useCallback((key, sortBy) => {
        const realKey = sortBy || key;
        setSortKey(prev => {
            if (prev === realKey) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return realKey;
            }
            setSortDir('desc');
            return realKey;
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
    }, [data, category, search, sortKey, sortDir]);

    // Category counts
    const catCounts = useMemo(() => {
        if (!data) return {};
        const counts = { all: data.length };
        for (const r of data) {
            counts[r.category] = (counts[r.category] || 0) + 1;
        }
        return counts;
    }, [data]);

    // Group headers for multi-row header
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
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-[#f87171] text-sm font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-[#a3a3a3] hover:text-white transition-all duration-300 tracking-widest uppercase px-6 py-2.5 rounded-sm border border-[#262626] hover:border-[#a3a3a3] hover:bg-[#121212]"
                >
                    Reload
                </button>
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
                {/* Row count */}
                <div className="flex items-center">
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
                                    onClick={() => col.sortable && handleSort(col.key, col.sortBy)}
                                    className={`px-1.5 py-2 text-[10px] font-bold border-b border-r border-[#262626]/50 whitespace-nowrap select-none uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-[#e5e5e5]' : ''
                                        } ${sortKey === (col.sortBy || col.key) ? 'text-[#e5e5e5]' : 'text-[#525252]'} ${col.sticky ? 'sticky left-0 z-10 bg-[#080808]' : ''
                                        }`}
                                    style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                                >
                                    {col.label}
                                    {sortKey === (col.sortBy || col.key) && (
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

            {/* Bar legend */}
            <div className="flex-shrink-0 h-8 border-t border-[#262626] flex items-center justify-center gap-6 px-4 bg-[#050505]">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2.5 rounded-[1px]" style={{ background: 'rgba(239,68,68,0.45)' }} />
                    <span className="text-[9px] text-[#525252] uppercase tracking-wider">Short (Sell)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2.5 rounded-[1px]" style={{ background: 'rgba(34,197,94,0.45)' }} />
                    <span className="text-[9px] text-[#525252] uppercase tracking-wider">Long (Buy)</span>
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Cell background
// =====================================================

function getCellBg(row, col) {
    const v = row[col.key];
    if (col.type === 'change' || col.type === 'pct_change') return changeBg(v);
    if (col.type === 'net') {
        if (v == null || v === 0) return '';
        const c = v > 0 ? [0, 176, 80] : [220, 53, 69];
        return `rgba(${c[0]},${c[1]},${c[2]},0.06)`;
    }
    return undefined;
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
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{formatDate(v)}</span>;

        case 'number':
            return <span className="text-[#a3a3a3] tabular-nums font-mono">{formatNumber(v)}</span>;

        case 'change': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-[#525252]';
            return (
                <span className={`tabular-nums font-mono ${color}`}>
                    {v > 0 ? '+' : ''}{formatNumber(v)}
                </span>
            );
        }

        case 'net': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-[#a3a3a3]';
            return <span className={`tabular-nums font-mono font-medium ${color}`}>{formatNumber(v)}</span>;
        }

        case 'pct': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v > 0 ? 'text-green-400/80' : v < 0 ? 'text-red-400/80' : 'text-[#a3a3a3]';
            return <span className={`tabular-nums font-mono text-[10px] ${color}`}>{formatPctSigned(v)}</span>;
        }

        case 'pct_change': {
            if (v == null) return <span className="text-[#525252]">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-[#525252]';
            return (
                <span className={`tabular-nums font-mono text-[10px] ${color}`}>
                    {v > 0 ? '+' : ''}{v.toFixed(1)}
                </span>
            );
        }

        case 'bar': {
            const gk = col.groupKey;
            return (
                <PositionBar
                    long={row[`${gk}_long`]}
                    short={row[`${gk}_short`]}
                    changeLong={row[`${gk}_change_long`]}
                    changeShort={row[`${gk}_change_short`]}
                />
            );
        }

        default:
            return <span className="text-[#a3a3a3]">{v ?? '—'}</span>;
    }
}
