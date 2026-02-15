import React, { useMemo, useRef, useEffect, useState } from 'react';
import { formatNumber, formatPct, formatDate } from '../utils/formatters';
import { GREEN, RED, getColorBySign, getColorMono, getColorCentered, getColorCrowded } from '../utils/colors';

/**
 * COT Report Table — dynamic columns based on group metadata.
 * Supports Legacy (3 groups), Disaggregated (5 groups), TFF (5 groups).
 * Gradient heatmap, arrows, BUY/SELL signals.
 */

// =====================================================
// Arrow component
// =====================================================

function Arrow({ value }) {
    if (value == null || value === 0) return null;
    if (value > 0) return <span className="text-green-500 text-[10px] ml-0.5">▲</span>;
    return <span className="text-red-500 text-[10px] ml-0.5">▼</span>;
}

// =====================================================
// Build column definitions dynamically from groups
// =====================================================

function buildColumnDefs(groups) {
    if (!groups || !groups.length) return [];

    const cols = [
        { key: 'date', label: 'Date', group: 'date', type: 'date', width: 80, sticky: true },
    ];

    // Per-group columns
    for (const g of groups) {
        const gk = g.key;
        const gName = g.name;
        cols.push(
            { key: `${gk}_change_long`, label: 'Ch (Long)', group: gName, type: 'change_long', width: 85 },
            { key: `${gk}_change_short`, label: 'Ch (Short)', group: gName, type: 'change_short', width: 85 },
            { key: `${gk}_pct_net_oi`, label: '% net/OI', group: gName, type: 'pct', width: 65 },
            { key: `${gk}_change`, label: 'Change', group: gName, type: 'change', width: 75 },
            { key: `${gk}_net`, label: 'Net Position', group: gName, type: 'net', width: 95 },
        );
    }

    // OI
    cols.push(
        { key: 'oi_pct', label: '% OI', group: 'Open Interest', type: 'pct_plain', width: 55 },
        { key: 'oi_change', label: 'Change', group: 'Open Interest', type: 'change', width: 80 },
        { key: 'open_interest', label: 'OI', group: 'Open Interest', type: 'plain', width: 90 },
    );

    // WCI per group
    for (const g of groups) {
        cols.push({ key: `wci_${g.key}`, label: g.short, group: 'WCI (26w)', type: 'centered', width: 55 });
    }

    // COT Index per period per group
    for (const suffix of ['3m', '1y', '3y']) {
        for (const g of groups) {
            cols.push({ key: `cot_index_${g.key}_${suffix}`, label: g.short, group: `COT Index (${suffix})`, type: 'centered', width: 55 });
        }
    }

    // Crowded Level per group
    for (const g of groups) {
        cols.push({ key: `crowded_${g.key}`, label: g.short, group: 'Crowded Level (%)', type: 'crowded', width: 60 });
    }

    return cols;
}

// =====================================================
// Main component
// =====================================================

export default function CotReportTable({ data, fitMode = false }) {
    const { weeks = [], stats = {}, market = {}, groups = [] } = data || {};
    const containerRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Build columns dynamically from groups
    const COLUMN_DEFS = useMemo(() => buildColumnDefs(groups), [groups]);

    // Total width of all columns
    const totalWidth = useMemo(() => COLUMN_DEFS.reduce((sum, c) => sum + c.width, 0), [COLUMN_DEFS]);

    // Calculate zoom so the full table width fits the viewport
    useEffect(() => {
        if (!fitMode) {
            setZoomLevel(1);
            return;
        }

        const calculate = () => {
            const container = containerRef.current;
            if (!container) return;
            const viewportWidth = container.clientWidth;
            const needed = totalWidth + 10;
            const z = Math.min(viewportWidth / needed, 1);
            setZoomLevel(Math.max(0.35, z));
        };

        const timer = setTimeout(calculate, 50);
        window.addEventListener('resize', calculate);
        return () => { clearTimeout(timer); window.removeEventListener('resize', calculate); };
    }, [fitMode, weeks.length, totalWidth]);

    // Pre-compute max absolute values per column for normalization
    const maxAbs = useMemo(() => {
        const result = {};
        for (const col of COLUMN_DEFS) {
            if (col.type === 'change' || col.type === 'change_long' || col.type === 'change_short' || col.type === 'net' || col.type === 'pct') {
                let max = 0;
                for (const w of weeks) {
                    const v = col.type === 'crowded'
                        ? w[col.key]?.value
                        : w[col.key];
                    if (v != null) max = Math.max(max, Math.abs(v));
                }
                result[col.key] = max;
            }
        }
        return result;
    }, [weeks, COLUMN_DEFS]);

    // Build group headers (level 1)
    const groupHeaders = useMemo(() => {
        const hdrGroups = [];
        let currentGroup = null;

        for (const col of COLUMN_DEFS) {
            const gName = col.group;
            if (!currentGroup || currentGroup.name !== gName) {
                currentGroup = { name: gName, span: 1, key: gName + '_' + hdrGroups.length };
                hdrGroups.push(currentGroup);
            } else {
                currentGroup.span++;
            }
        }
        return hdrGroups;
    }, [COLUMN_DEFS]);

    if (!weeks.length) {
        return <div className="text-[#525252] text-center py-12 text-xs uppercase tracking-widest font-medium">No data available</div>;
    }

    // Stat rows order
    const statRows = [
        { key: 'max', label: 'Max.' },
        { key: 'min', label: 'Min.' },
        { key: 'max_5y', label: 'Max. 5y' },
        { key: 'min_5y', label: 'Min. 5y' },
        { key: 'avg_13w', label: '13 week avg' },
    ];

    return (
        <div
            ref={containerRef}
            className={`h-full ${fitMode ? 'overflow-y-auto overflow-x-hidden' : 'overflow-auto'}`}
            style={fitMode ? { zoom: zoomLevel } : undefined}
        >
            <table
                className="text-[11px] leading-tight"
                style={{ minWidth: totalWidth, borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', width: totalWidth }}
            >
                {/* Header Level 1 — Group names */}
                <thead className="sticky top-0 z-20">
                    <tr className="bg-[#0a0a0a]">
                        {groupHeaders.map(g => {
                            const isMarketName = g.name === 'date';
                            return (
                                <th
                                    key={g.key}
                                    colSpan={g.span}
                                    className={`px-1 py-2 text-[10px] font-bold text-[#525252] border-b border-r border-[#262626]/50 text-center uppercase tracking-widest bg-[#0a0a0a] ${isMarketName ? 'overflow-hidden text-ellipsis' : 'whitespace-nowrap'}`}
                                    style={isMarketName ? { maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : undefined}
                                    title={isMarketName ? (market.name ? market.name.split(' - ')[0] : '') : undefined}
                                >
                                    {isMarketName ? (market.name ? market.name.split(' - ')[0] : '') : g.name}
                                </th>
                            );
                        })}
                    </tr>

                    {/* Header Level 2 — Column names */}
                    <tr className="bg-[#080808]">
                        {COLUMN_DEFS.map(col => (
                            <th
                                key={col.key}
                                className={`px-1 py-1.5 text-[10px] font-bold text-[#525252] border-b border-r border-[#262626]/50 text-center whitespace-nowrap uppercase tracking-wider bg-[#080808] ${col.sticky ? 'sticky left-0 z-30 bg-[#080808]' : ''
                                    }`}
                                style={{ width: col.width, minWidth: col.width, maxWidth: col.sticky ? col.width : undefined }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {/* Stat rows */}
                    {statRows.map(sr => {
                        const rowData = stats[sr.key];
                        if (!rowData) return null;
                        return (
                            <tr key={sr.key} className="bg-[#080808] border-b border-[#262626]/40">
                                {COLUMN_DEFS.map(col => (
                                    <td
                                        key={col.key}
                                        className={`px-1 py-1 text-right text-[#525252] font-medium border-r border-[#262626]/30 whitespace-nowrap ${col.sticky ? 'sticky left-0 z-10 bg-[#080808] text-left font-bold text-[#a3a3a3] uppercase tracking-wider' : ''
                                            }`}
                                        style={{ width: col.width, minWidth: col.width, maxWidth: col.sticky ? col.width : undefined }}
                                    >
                                        {col.key === 'date'
                                            ? sr.label
                                            : (col.type === 'centered' || col.type === 'crowded')
                                                ? ''
                                                : formatCellValue(rowData[col.key], col.type)
                                        }
                                    </td>
                                ))}
                            </tr>
                        );
                    })}

                    {/* Separator */}
                    <tr>
                        <td colSpan={COLUMN_DEFS.length} className="h-px bg-[#e5e5e5]/20" />
                    </tr>

                    {/* Data rows (newest first) */}
                    {weeks.map((week, i) => (
                        <tr
                            key={week.date || i}
                            className="border-b border-[#262626]/30 hover:bg-[#121212]/50 transition-colors duration-200"
                        >
                            {COLUMN_DEFS.map(col => {
                                const raw = week[col.key];
                                const bg = getCellBg(raw, col.type, maxAbs[col.key]);

                                return (
                                    <td
                                        key={col.key}
                                        className={`px-1 py-0.5 text-right whitespace-nowrap border-r border-[#262626]/30 ${col.sticky ? 'sticky left-0 z-10 bg-[#050505] text-left text-[#a3a3a3]' : ''
                                            }`}
                                        style={{
                                            width: col.width,
                                            minWidth: col.width,
                                            maxWidth: col.sticky ? col.width : undefined,
                                            backgroundColor: col.sticky ? undefined : bg,
                                        }}
                                    >
                                        {renderCellContent(raw, col, week)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// =====================================================
// Cell rendering helpers
// =====================================================

function getCellBg(value, type, maxAbs) {
    switch (type) {
        case 'change_long':
            return getColorMono(value, maxAbs, GREEN);
        case 'change_short':
            return getColorMono(value, maxAbs, RED);
        case 'change':
        case 'net':
        case 'pct':
            return getColorBySign(value, maxAbs);
        case 'centered':
            return getColorCentered(value);
        case 'crowded':
            return getColorCrowded(value);
        default:
            return '';
    }
}

function formatCellValue(value, type) {
    if (type === 'crowded') {
        const v = value?.value ?? value;
        return v != null ? formatPct(v) : '—';
    }
    if (type === 'centered') return value != null ? formatPct(value) : '—';
    if (type === 'pct' || type === 'pct_plain') return value != null ? formatPct(value) : '—';
    if (type === 'date') return '';
    return formatNumber(value);
}

function renderCellContent(raw, col, week) {
    const { type, key } = col;

    // Date column
    if (type === 'date') {
        return <span className="text-[#a3a3a3] font-mono">{formatDate(raw)}</span>;
    }

    // Crowded level with BUY/SELL overlay
    if (type === 'crowded') {
        if (!raw || raw.value == null) return <span className="text-[#525252]">—</span>;

        const signal = raw.signal;
        if (signal === 'BUY') {
            return (
                <span className="font-bold text-green-400 text-[10px]">
                    BUY <span className="text-gray-500 font-normal">{Math.round(raw.value)}</span>
                </span>
            );
        }
        if (signal === 'SELL') {
            return (
                <span className="font-bold text-red-400 text-[10px]">
                    SELL <span className="text-gray-500 font-normal">{Math.round(raw.value)}</span>
                </span>
            );
        }
        return <span>{formatPct(raw.value)}</span>;
    }

    // Centered (COT Index, WCI) — just percentage
    if (type === 'centered') {
        if (raw == null) return <span className="text-[#525252]">—</span>;
        return <span>{formatPct(raw)}</span>;
    }

    // Percentage columns
    if (type === 'pct') {
        if (raw == null) return <span className="text-[#525252]">—</span>;
        return (
            <span>
                {formatPct(raw)}
                <Arrow value={raw} />
            </span>
        );
    }

    if (type === 'pct_plain') {
        return <span>{raw != null ? formatPct(raw) : '—'}</span>;
    }

    // Change columns — with arrows
    if (type === 'change' || type === 'change_long' || type === 'change_short') {
        if (raw == null) return <span className="text-[#525252]">—</span>;
        return (
            <span>
                {formatNumber(raw)}
                <Arrow value={raw} />
            </span>
        );
    }

    // Net position
    if (type === 'net') {
        if (raw == null) return <span className="text-[#525252]">—</span>;
        return <span>{formatNumber(raw)}</span>;
    }

    // Plain numbers (OI)
    return <span>{raw != null ? formatNumber(raw) : '—'}</span>;
}
