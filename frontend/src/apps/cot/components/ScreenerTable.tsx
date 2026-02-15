import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatNumber, formatDate, formatPctSigned } from '../utils/formatters';
import { changeBg, CAT_COLORS } from '../utils/colors';
import { CATEGORY_ORDER } from '../utils/constants';
import { useScreenerData } from '../hooks/useMarketQueries';
import { enrichRows } from '../utils/enrichment';
import Spinner from '@/components/ui/Spinner';
import type { Group, EnrichedScreenerRow } from '../types';

const ROW_HEIGHT = 26;

interface ScreenerTableProps {
    onSelectMarket: (code: string) => void;
    reportType?: string;
    subtype?: string;
}

interface ScreenerColumn {
    key: string;
    label: string;
    group: string;
    width: number;
    align: 'left' | 'right' | 'center';
    sortable: boolean;
    type: string;
    sticky?: boolean;
    groupKey?: string;
    sortBy?: string;
}

// =====================================================
// Build screener columns dynamically from groups
// =====================================================

function buildColumns(groups: Group[] | null): ScreenerColumn[] {
    const left: ScreenerColumn[] = [
        { key: 'name', label: 'Market', group: '', width: 180, align: 'left', sortable: true, type: 'text', sticky: true },
        { key: 'category_display', label: 'Category', group: '', width: 85, align: 'left', sortable: true, type: 'tag' },
        { key: 'date', label: 'Date', group: '', width: 82, align: 'center', sortable: true, type: 'date' },
    ];

    const groupCols: ScreenerColumn[] = (groups || []).flatMap(g => [
        { key: `${g.key}_total`, label: 'Position', group: g.short, width: 85, align: 'right', sortable: true, type: 'number' },
        { key: `${g.key}_bar`, label: 'Long / Short', group: g.short, width: 88, align: 'center', sortable: true, type: 'bar', groupKey: g.key, sortBy: `${g.key}_short_ratio` },
        { key: `${g.key}_change_total`, label: 'Change', group: g.short, width: 72, align: 'right', sortable: true, type: 'change' },
        { key: `${g.key}_pct_oi_total`, label: '% of OI', group: g.short, width: 62, align: 'right', sortable: true, type: 'pct' },
        { key: `${g.key}_pct_oi_total_change`, label: '% Change', group: g.short, width: 72, align: 'right', sortable: true, type: 'pct_change' },
    ]);

    const oiCols: ScreenerColumn[] = [
        { key: 'open_interest', label: 'Open Interest', group: 'Open Interest', width: 105, align: 'right', sortable: true, type: 'number' },
        { key: 'oi_change', label: 'OI Change', group: 'Open Interest', width: 82, align: 'right', sortable: true, type: 'change' },
    ];

    const allCols: ScreenerColumn[] = [
        { key: 'all_bar', label: 'Long / Short', group: 'Total', width: 88, align: 'center', sortable: true, type: 'bar', groupKey: 'all', sortBy: 'all_short_ratio' },
    ];

    return [...left, ...groupCols, ...oiCols, ...allCols];
}

// =====================================================
// Long/Short Position Bar with tooltip
// =====================================================

function PositionBar({ long, short, changeLong, changeShort }: { long: number | null; short: number | null; changeLong?: number | null; changeShort?: number | null }) {
    const [hover, setHover] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [tip, setTip] = useState({ x: 0, y: 0 });

    if (long == null || short == null) {
        return <span className="text-muted text-[9px]">—</span>;
    }

    const total = Math.abs(long) + Math.abs(short);
    if (total === 0) {
        return <span className="text-muted text-[9px]">—</span>;
    }
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
            style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 70, height: 14, borderRadius: 2, overflow: 'hidden', background: 'var(--color-border-subtle)', cursor: 'default' }}
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
                        background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)',
                        borderRadius: 4, padding: '6px 10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        fontSize: 10, whiteSpace: 'nowrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 1, background: 'rgba(34,197,94,0.7)' }} />
                            <span style={{ color: 'var(--color-text-secondary)' }}>Long:</span>
                            <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{formatNumber(long)}</span>
                            <span style={{ color: 'var(--color-muted)', fontFamily: 'monospace' }}>({longPct.toFixed(1)}%)</span>
                            {changeLong != null && (
                                <span style={{ fontFamily: 'monospace', color: changeLong > 0 ? 'var(--color-success-fg)' : changeLong < 0 ? 'var(--color-destructive-fg)' : 'var(--color-muted)' }}>
                                    {changeLong > 0 ? '+' : ''}{formatNumber(changeLong)}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 1, background: 'rgba(239,68,68,0.7)' }} />
                            <span style={{ color: 'var(--color-text-secondary)' }}>Short:</span>
                            <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{formatNumber(short)}</span>
                            <span style={{ color: 'var(--color-muted)', fontFamily: 'monospace' }}>({shortPct.toFixed(1)}%)</span>
                            {changeShort != null && (
                                <span style={{ fontFamily: 'monospace', color: changeShort > 0 ? 'var(--color-success-fg)' : changeShort < 0 ? 'var(--color-destructive-fg)' : 'var(--color-muted)' }}>
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
// =====================================================
// Main component
// =====================================================

export default function ScreenerTable({ onSelectMarket, reportType = 'legacy', subtype = 'fo' }: ScreenerTableProps) {
    const { screenerData, groups, isLoading: loading, error } = useScreenerData(reportType, subtype);
    const [search, _setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const tableScrollRef = useRef<HTMLDivElement>(null);

    // Enrich raw screener data with computed columns
    const data = useMemo(() => {
        if (!screenerData || !Array.isArray(screenerData)) return null;
        return enrichRows(screenerData, groups);
    }, [screenerData, groups]);

    // Build columns dynamically from groups
    const COLUMNS = useMemo(() => buildColumns(groups), [groups]);
    const TOTAL_WIDTH = useMemo(() => COLUMNS.reduce((s, c) => s + c.width, 0), [COLUMNS]);

    // Sort handler
    const handleSort = useCallback((key: string, sortBy?: string) => {
        const realKey = sortBy || key;
        if (sortKey === realKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(realKey);
            setSortDir('desc');
        }
    }, [sortKey]);

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
                return String(va || '').localeCompare(String(vb || '')) * dir;
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
        if (!data) return {} as Record<string, number>;
        const counts: Record<string, number> = { all: data.length };
        for (const r of data) {
            counts[r.category] = (counts[r.category] || 0) + 1;
        }
        return counts;
    }, [data]);

    // Virtualizer for data rows
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableScrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 15,
    });

    // Group headers for multi-row header
    const groupHeaders = useMemo(() => {
        const hdrGroups: { name: string; span: number }[] = [];
        let cur: { name: string; span: number } | null = null;
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
                <p className="text-destructive-fg text-sm font-medium">{error?.message || 'Unknown error'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-text-secondary hover:text-bronze transition-all duration-300 tracking-[0.14em] uppercase px-6 py-2.5 rounded-sm border border-border hover:border-bronze/20 hover:bg-bronze-glow"
                >
                    Reload
                </button>
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div className="text-muted text-center py-10 text-xs uppercase tracking-[0.14em] font-medium">
                No screener data available
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex-shrink-0 border-b border-border-subtle bg-background/50 px-6 py-2.5">
                {/* Category chips + count in one row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORY_ORDER.map(cat => {
                        const count = catCounts[cat.key] || 0;
                        const active = category === cat.key;
                        const colors = cat.key !== 'all' ? CAT_COLORS[cat.key] : null;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setCategory(cat.key)}
                                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ${active
                                    ? cat.key === 'all'
                                        ? 'bg-white/[0.10] text-white/90 border border-white/[0.08]'
                                        : 'border'
                                    : 'text-muted hover:text-text-secondary border border-transparent hover:border-border-subtle hover:bg-surface-hover'
                                    }`}
                                style={active && colors ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.text + '30' } : undefined}
                            >
                                {cat.label}
                                {count > 0 && <span className="ml-1.5 text-[9px] opacity-40">{count}</span>}
                            </button>
                        );
                    })}
                    <div className="ml-auto text-[10px] text-muted tabular-nums font-medium uppercase tracking-[0.14em] flex-shrink-0">
                        {rows.length} <span className="text-border-hover">markets</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto" ref={tableScrollRef}>
                <table className="text-[11px] leading-tight" style={{ minWidth: TOTAL_WIDTH, borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead className="sticky top-0 z-20">
                        {/* Group headers */}
                        <tr style={{ background: '#0c0b09' }}>
                            {groupHeaders.map((g, i) => (
                                <th
                                    key={i}
                                    colSpan={g.span}
                                    className="px-1 py-2 text-[10px] font-medium text-muted border-r border-border-subtle text-center whitespace-nowrap uppercase tracking-[0.14em]"
                                    style={{ background: '#0c0b09', boxShadow: 'inset 0 -1px 0 var(--color-border-subtle)' }}
                                >
                                    {g.name}
                                </th>
                            ))}
                        </tr>
                        {/* Column headers */}
                        <tr style={{ background: '#0a0907' }}>
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && handleSort(col.key, col.sortBy)}
                                    className={`px-1.5 py-2 text-[10px] font-medium border-b border-r border-border-subtle select-none uppercase tracking-[0.10em] ${col.sortable ? 'cursor-pointer hover:text-bronze' : ''
                                        } ${sortKey === (col.sortBy || col.key) ? 'text-bronze' : 'text-muted'} ${col.sticky ? 'sticky left-0 z-10' : ''
                                        }`}
                                    style={{ width: col.width, minWidth: col.width, maxWidth: col.width, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: col.align, background: '#0a0907' }}
                                    title={col.label}
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
                        {rowVirtualizer.getVirtualItems()[0]?.start > 0 && (
                            <tr><td colSpan={COLUMNS.length} style={{ height: rowVirtualizer.getVirtualItems()[0].start, padding: 0, border: 'none' }} /></tr>
                        )}
                        {rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const row = rows[virtualRow.index];
                            return (
                                <tr
                                    key={row.code}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    onClick={() => onSelectMarket && onSelectMarket(row.code)}
                                    className="border-b border-border-subtle hover:bg-surface-hover/30 cursor-pointer transition-colors duration-300 group"
                                >
                                    {COLUMNS.map(col => (
                                        <td
                                            key={col.key}
                                            className={`px-1.5 py-[6px] border-r border-border-subtle whitespace-nowrap ${col.sticky ? 'sticky left-0 z-10 bg-background group-hover:bg-surface-hover transition-colors' : ''
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
                            );
                        })}
                        {(() => {
                            const items = rowVirtualizer.getVirtualItems();
                            const last = items[items.length - 1];
                            const pad = last ? rowVirtualizer.getTotalSize() - last.end : 0;
                            return pad > 0 ? <tr><td colSpan={COLUMNS.length} style={{ height: pad, padding: 0, border: 'none' }} /></tr> : null;
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Bar legend */}
            <div className="flex-shrink-0 h-8 border-t border-border-subtle flex items-center justify-center gap-6 px-4 bg-background/50">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2.5 rounded-[1px]" style={{ background: 'rgba(239,68,68,0.45)' }} />
                    <span className="text-[9px] text-muted uppercase tracking-wider">Short (Sell)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2.5 rounded-[1px]" style={{ background: 'rgba(34,197,94,0.45)' }} />
                    <span className="text-[9px] text-muted uppercase tracking-wider">Long (Buy)</span>
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Cell background
// =====================================================

function getCellBg(row: EnrichedScreenerRow, col: ScreenerColumn): string | undefined {
    const v = row[col.key] as number | null | undefined;
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

function renderCell(row: EnrichedScreenerRow, col: ScreenerColumn): React.ReactNode {
    const raw = row[col.key];

    switch (col.type) {
        case 'text': {
            const v = raw as string | null | undefined;
            if (col.key === 'name') {
                const assetName = v ? v.split(' - ')[0] : '';
                return (
                    <span className="text-primary group-hover:text-bronze font-medium transition-colors truncate block max-w-[180px]" title={v ?? undefined}>
                        {assetName}
                    </span>
                );
            }
            return <span className="text-text-secondary">{v || '—'}</span>;
        }

        case 'tag': {
            const colors = CAT_COLORS[row.category] || CAT_COLORS.other;
            return (
                <span
                    className="inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                    {raw}
                </span>
            );
        }

        case 'date':
            return <span className="text-text-secondary tabular-nums font-mono">{formatDate(raw as string | null | undefined)}</span>;

        case 'number':
            return <span className="text-text-secondary tabular-nums font-mono">{formatNumber(raw as number | null | undefined)}</span>;

        case 'change': {
            const v = raw as number | null | undefined;
            if (v == null) return <span className="text-muted">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted';
            return (
                <span className={`tabular-nums font-mono ${color}`}>
                    {v > 0 ? '+' : ''}{formatNumber(v)}
                </span>
            );
        }

        case 'net': {
            const v = raw as number | null | undefined;
            if (v == null) return <span className="text-muted">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-text-secondary';
            return <span className={`tabular-nums font-mono font-medium ${color}`}>{formatNumber(v)}</span>;
        }

        case 'pct': {
            const v = raw as number | null | undefined;
            if (v == null) return <span className="text-muted">—</span>;
            const color = v > 0 ? 'text-green-400/80' : v < 0 ? 'text-red-400/80' : 'text-text-secondary';
            return <span className={`tabular-nums font-mono text-[10px] ${color}`}>{formatPctSigned(v)}</span>;
        }

        case 'pct_change': {
            const v = raw as number | null | undefined;
            if (v == null) return <span className="text-muted">—</span>;
            const color = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted';
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
                    long={row[`${gk}_long`] as number | null}
                    short={row[`${gk}_short`] as number | null}
                    changeLong={row[`${gk}_change_long`] as number | null | undefined}
                    changeShort={row[`${gk}_change_short`] as number | null | undefined}
                />
            );
        }

        default:
            return <span className="text-text-secondary">{(raw as string | number) ?? '—'}</span>;
    }
}
