/**
 * StatsTab — admin statistics panel.
 * Shows user counts, role/permission breakdown, and registration chart.
 * Default range: today (Kyiv timezone). Supports presets and custom date ranges.
 */
import { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────

interface AdminStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    verified_users: number;
    unverified_users: number;
    by_role: { admin: number; user: number };
    by_permission: { cot: number; journal: number };
    period_from: string;
    period_to: string;
    new_registrations: number;
    registrations_by_day: { date: string; count: number }[];
}

type Preset = 'today' | 'week' | 'month' | 'custom';

// ── Helpers ───────────────────────────────────────────────────

function getKyivToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kiev' });
}

function getKyivDate(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Kiev' });
}

function formatDisplayDate(iso: string): string {
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight = false }: { label: string; value: number; sub?: string; highlight?: boolean }) {
    return (
        <div className={`relative overflow-hidden border rounded-[20px] p-6 flex flex-col gap-2 transition-colors duration-500 ${highlight
            ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent'
            : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.02]'
            }`}>
            {highlight && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            )}
            <span className={`text-[9px] font-sans tracking-[0.22em] uppercase ${highlight ? 'text-white/40' : 'text-white/30'}`}>
                {label}
            </span>
            <span className={`text-[2.2rem] font-sans font-light leading-none ${highlight ? 'text-white/90' : 'text-white/80'}`}>
                {value.toLocaleString()}
            </span>
            {sub && (
                <span className="text-[10px] font-sans text-white/25 leading-tight mt-1">{sub}</span>
            )}
        </div>
    );
}

// ── Bar Chart ────────────────────────────────────────────────

function RegistrationChart({ data }: { data: { date: string; count: number }[] }) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="border border-white/[0.04] bg-white/[0.015] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

            <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-sans tracking-[0.25em] uppercase text-white/40">
                    Registration Activity
                </p>
                <span className="text-[9px] font-sans tracking-[0.15em] text-white/20 uppercase">
                    {data.length} Days
                </span>
            </div>

            {data.length === 0 ? (
                <p className="text-[11px] text-white/20 text-center py-10">No data available for this period</p>
            ) : (
                <div className="relative">
                    {/* Background grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-full h-px bg-white/[0.05]" />
                        ))}
                    </div>

                    <div className="flex items-end gap-2 h-36 overflow-x-auto relative z-10 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {data.map(d => {
                            const heightPct = Math.max((d.count / maxCount) * 100, d.count > 0 ? 4 : 0);
                            return (
                                <div
                                    key={d.date}
                                    className="group flex flex-col items-center gap-2 flex-shrink-0"
                                    style={{ minWidth: data.length > 14 ? '24px' : '32px' }}
                                >
                                    {/* Tooltip */}
                                    <div className="relative flex-1 flex flex-col items-center justify-end w-full">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111111] border border-white/[0.08] rounded-[12px] px-2.5 py-1 text-[9px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 shadow-lg shadow-black/50 transform group-hover:-translate-y-1">
                                            {d.count} reg
                                        </div>
                                        <div
                                            className="w-full bg-gradient-to-t from-white/15 to-white/30 group-hover:from-white/30 group-hover:to-white/50 transition-all duration-300 rounded-t-sm"
                                            style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                                        />
                                    </div>
                                    {data.length <= 31 && (
                                        <span className="text-[8px] text-white/25 font-sans tracking-wider group-hover:text-white/50 transition-colors">
                                            {formatDisplayDate(d.date).slice(0, 5)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────

export default function StatsTab() {
    const today = getKyivToday();

    const [preset, setPreset] = useState<Preset>('today');
    const [customFrom, setCustomFrom] = useState(today);
    const [customTo, setCustomTo] = useState(today);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const presets: { key: Preset; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
        { key: 'custom', label: 'Custom' },
    ];

    const getRange = useCallback((): [string, string] => {
        if (preset === 'today') return [today, today];
        if (preset === 'week') return [getKyivDate(6), today];
        if (preset === 'month') return [getKyivDate(29), today];
        return [customFrom, customTo];
    }, [preset, customFrom, customTo, today]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [from, to] = getRange();
            const data = await fetchJson<AdminStats>(
                `/api/v1/admin/stats?date_from=${from}&date_to=${to}`
            );
            setStats(data);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    }, [getRange]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-6">
            {/* ── Date range selector ── */}
            <div className="flex flex-wrap items-center gap-3">
                {presets.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPreset(p.key)}
                        className={`px-4 py-1.5 text-[9px] font-sans tracking-[0.18em] uppercase border rounded-full transition-all duration-300 ${preset === p.key
                            ? 'border-white/20 text-white/80 bg-white/[0.06]'
                            : 'border-white/[0.06] text-white/25 hover:border-white/[0.12] hover:text-white/40'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}

                {preset === 'custom' && (
                    <div className="flex items-center gap-2 ml-2">
                        <input
                            type="date"
                            value={customFrom}
                            max={customTo}
                            onChange={e => setCustomFrom(e.target.value)}
                            className="bg-transparent border border-white/[0.08] rounded-[12px] text-white/40 text-[10px] px-2 py-1 focus:border-white/[0.15] focus:text-white/60 outline-none transition-colors"
                        />
                        <span className="text-white/20 text-[10px]">—</span>
                        <input
                            type="date"
                            value={customTo}
                            min={customFrom}
                            max={today}
                            onChange={e => setCustomTo(e.target.value)}
                            className="bg-transparent border border-white/[0.08] rounded-[12px] text-white/40 text-[10px] px-2 py-1 focus:border-white/[0.15] focus:text-white/60 outline-none transition-colors"
                        />
                    </div>
                )}

                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="ml-auto px-4 py-1.5 text-[9px] font-sans tracking-[0.18em] uppercase border border-white/[0.08] rounded-full text-white/40 hover:border-white/[0.15] hover:text-white/60 transition-all duration-300 disabled:opacity-40"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* ── Period label ── */}
            {stats && (
                <p className="text-[9px] font-sans tracking-[0.15em] text-white/20 uppercase">
                    Period: {formatDisplayDate(stats.period_from)} — {formatDisplayDate(stats.period_to)}
                </p>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="border border-red-900/40 bg-red-950/20 p-4 text-[11px] text-red-400/70">
                    {error}
                </div>
            )}

            {/* ── Stats cards ── */}
            {stats && (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left column: Main metrics */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[8px] font-sans tracking-[0.25em] uppercase text-white/20 mb-1">
                                Key Metrics
                            </h3>
                            <StatCard label="Total Users" value={stats.total_users} highlight />
                            <StatCard label="New Registrations" value={stats.new_registrations} sub="In selected period" />
                        </div>

                        {/* Middle column: Status */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[8px] font-sans tracking-[0.25em] uppercase text-white/20 mb-1">
                                Account Status
                            </h3>
                            <StatCard label="Active Users" value={stats.active_users} sub={`${stats.inactive_users} inactive`} />
                            <StatCard label="Verified Email" value={stats.verified_users} sub={`${stats.unverified_users} unverified`} />
                        </div>

                        {/* Right column: Access */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[8px] font-sans tracking-[0.25em] uppercase text-white/20 mb-1">
                                Access & Roles
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="Admins" value={stats.by_role.admin} />
                                <StatCard label="Users" value={stats.by_role.user} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="COT Access" value={stats.by_permission.cot} />
                                <StatCard label="Journal Access" value={stats.by_permission.journal} />
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <RegistrationChart data={stats.registrations_by_day} />
                </div>
            )}

            {/* ── Skeleton placeholder while loading first time ── */}
            {loading && !stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border border-white/[0.03] bg-white/[0.01] p-5 h-24 animate-pulse" />
                    ))}
                </div>
            )}
        </div>
    );
}
