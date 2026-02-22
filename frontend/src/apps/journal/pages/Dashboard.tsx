/**
 * Dashboard – main journal page.
 * Assembles: equity curve, MetricsGrid, TradesTable, LiveAssetsExposure, AssetsExposure, FilterSidebar.
 * Uses TanStack Query hooks + Zustand store instead of local state.
 */

import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import MetricsGrid from '../components/MetricsGrid';
import AssetsExposure from '../components/AssetsExposure';
import LiveAssetsExposure from '../components/LiveAssetsExposure';
import FilterSidebar from '../components/FilterSidebar';
import TradesTable from '../components/TradesTable';
import TradeFormModal from '../components/TradeFormModal';
import TradeViewModal from '../components/TradeViewModal';
import SettingsModal from '../components/SettingsModal';
import ChartCardModal from '../components/ChartCardModal';
import { useJournalStore } from '../store/useJournalStore';
import {
    useTrades, useMetrics, useEquityCurve, useAssetsExposure, useSettings,
} from '../hooks/useJournalQueries';

export default function Dashboard() {
    const qc = useQueryClient();
    useEffect(() => {
        qc.invalidateQueries({ queryKey: ['journal'] });
    }, []);

    const displayMode = useJournalStore((s) => s.displayMode);
    const activeTab = useJournalStore((s) => s.activeTab);
    const filters = useJournalStore((s) => s.filters);
    const showEquityCurveModal = useJournalStore((s) => s.showEquityCurveModal);
    const setShowEquityCurveModal = useJournalStore((s) => s.setShowEquityCurveModal);
    const setSelectedTrade = useJournalStore((s) => s.setSelectedTrade);
    const setViewModalOpen = useJournalStore((s) => s.setViewModalOpen);
    const setCreateModalOpen = useJournalStore((s) => s.setCreateModalOpen);
    const setNickname = useJournalStore((s) => s.setNickname);

    // Queries
    const { data: metrics, isLoading: metricsLoading } = useMetrics(filters);
    const { data: equityData = [] } = useEquityCurve(filters);
    const { data: trades = [], isLoading: tradesLoading } = useTrades(filters);
    const { data: exposureData = [], isLoading: exposureLoading } = useAssetsExposure(filters);
    const { data: settings } = useSettings();

    // Sync server-side nickname to the store (ensures correctness when switching accounts)
    useEffect(() => {
        if (settings?.nickname !== undefined) {
            setNickname(settings.nickname ?? '');
        }
    }, [settings?.nickname]);

    const loading = metricsLoading && !metrics;

    const handleTradeClick = (trade: any) => {
        setSelectedTrade(trade);
        setViewModalOpen(true);
    };

    // Sort trades by date descending
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    /* ── Equity-curve tooltip ── */
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-surface border border-border p-3 shadow-xl rounded-sm">
                <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
                    {new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {payload.map((entry: any, i: number) => {
                    const val = entry.value;
                    const disp = displayMode === 'percentage' && metrics?.initial_balance
                        ? `${(((val - metrics.initial_balance) / metrics.initial_balance) * 100).toFixed(2)}%`
                        : `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return (
                        <p key={i} className="text-sm font-mono font-medium" style={{ color: entry.color }}>
                            {entry.name}: <span className="text-text-primary">{disp}</span>
                        </p>
                    );
                })}
            </div>
        );
    };

    const yTickFormatter = (val: number) => {
        if (displayMode === 'percentage' && metrics?.initial_balance) {
            return `${(((val - metrics.initial_balance) / metrics.initial_balance) * 100).toFixed(0)}%`;
        }
        return `$${(val / 1000).toFixed(0)}k`;
    };

    if (loading) {
        return (
            <div className="journal-root flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-7 w-7 border-t border-b border-bronze/50" />
            </div>
        );
    }

    return (
        <div className="journal-root relative min-h-screen">
            {/* Subtle background grid with radial mask */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.15]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)',
            }} />

            {/* ── Journal top header ── */}
            <div className="fixed top-0 left-0 journal-header z-50" style={{ right: '300px' }}>
                <div className="px-6 h-[52px] flex items-center">
                    <Link to="/" className="flex items-center bg-[#060606]/80 backdrop-blur-md h-[34px] px-4 rounded-full border border-white/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:bg-[#0a0a0a]/90 hover:border-white/[0.08] transition-all duration-500 group overflow-hidden">
                        <div className="flex items-center overflow-hidden transition-all duration-500 w-0 opacity-0 group-hover:w-[12px] group-hover:opacity-100">
                            <div className="w-[5px] h-[5px] rounded-full bg-bronze shadow-[0_0_8px_rgba(196,168,124,0.6)]" />
                        </div>
                        <span className="font-serif text-[11px] font-normal tracking-[0.22em] text-white/[0.65] group-hover:text-white/[0.85] uppercase mt-[1px] pl-[0.22em] transition-colors duration-500 whitespace-nowrap">Equilibrium</span>
                    </Link>
                </div>
            </div>

            {/* Main content — offset for sidebar and header */}
            <div className="relative z-10 pr-[320px] pl-4 space-y-8 pb-12 pt-[68px]">
                {/* ── Main Tab ── */}
                {activeTab === 'main' && (
                    <>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Equity Curve */}
                            <Card
                                className="group relative overflow-hidden h-full flex flex-col cursor-pointer"
                                onClick={() => setShowEquityCurveModal(true)}
                            >
                                {/* top-left corner L-bracket accent */}
                                <div className="absolute top-0 left-0 w-5 h-px bg-bronze/25 group-hover:bg-bronze/60 transition-colors duration-700" />
                                <div className="absolute top-0 left-0 w-px h-5 bg-bronze/25 group-hover:bg-bronze/60 transition-colors duration-700" />
                                {/* bottom accent line - thinner */}
                                <div className="absolute bottom-0 left-0 right-0 h-[0.5px]">
                                    <div className="h-full bg-gradient-to-r from-transparent via-bronze/[0.05] to-transparent group-hover:via-bronze/[0.20] transition-all duration-700" />
                                </div>

                                {/* Folded corner bottom-right — opens chart modal */}
                                <div
                                    className="absolute bottom-0 right-0 z-10"
                                    title="Expand chart"
                                >
                                    <div style={{
                                        width: 0, height: 0,
                                        borderStyle: 'solid',
                                        borderWidth: '0 0 14px 14px',
                                        borderColor: 'transparent transparent rgba(196,168,124,0.18) transparent',
                                        position: 'absolute', bottom: 0, right: 0,
                                        transition: 'border-color 0.3s',
                                    }}
                                        className="group-hover:[border-bottom-color:rgba(196,168,124,0.42)!important]"
                                    />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.02]">
                                    <CardTitle>Equity Curve</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 pt-4">
                                    <ResponsiveContainer width="100%" height={520}>
                                        <LineChart data={equityData}>
                                            <CartesianGrid stroke="#262626" vertical={false} strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date" stroke="#525252"
                                                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                fontSize={10} tickLine={false} axisLine={false} dy={10}
                                            />
                                            <YAxis
                                                stroke="#525252" fontSize={10} tickLine={false} axisLine={false}
                                                tickFormatter={yTickFormatter} dx={-10}
                                                domain={['dataMin - 5000', 'dataMax + 5000']}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626' }} />
                                            <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                                            <Line type="monotone" dataKey="portfolio_nav" name="Portfolio" stroke="#e5e5e5" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#e5e5e5', stroke: '#000' }} />
                                            <Line type="monotone" dataKey="benchmark_nav" name="Benchmark (BTC)" stroke="#525252" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 4, fill: '#525252' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Metrics Grid */}
                            <div className="pl-2">
                                <MetricsGrid metrics={metrics} filters={filters} />
                            </div>
                        </div>

                        <AssetsExposure exposureData={exposureData} loading={exposureLoading} metrics={metrics} />
                    </>
                )}

                {/* ── Trades Tab ── */}
                {activeTab === 'trades' && (
                    <div className="space-y-4">
                        <h2 className="journal-section-label"><span className="text-bronze/50">—</span>&nbsp;Trades</h2>
                        <TradesTable
                            trades={sortedTrades}
                            loading={tradesLoading}
                            onTradeClick={handleTradeClick}
                            metrics={metrics}
                        />
                    </div>
                )}

                {/* ── Live Tab ── */}
                {activeTab === 'live' && (
                    <div className="space-y-6">
                        <h2 className="journal-section-label"><span className="text-bronze/50">—</span>&nbsp;Live Dashboard</h2>
                        <LiveAssetsExposure trades={trades} loading={tradesLoading} metrics={metrics} />
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className="fixed right-0 top-0 h-screen w-[300px] journal-sidebar border-l border-white/[0.04] z-50">
                <FilterSidebar onAddTradeClick={() => setCreateModalOpen(true)} />
            </div>

            {/* Modals */}
            <TradeFormModal />
            <TradeViewModal />
            <SettingsModal />

            <ChartCardModal
                isOpen={showEquityCurveModal}
                onClose={() => setShowEquityCurveModal(false)}
                title="Equity Curve"
            >
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityData}>
                            <CartesianGrid stroke="#262626" vertical={false} strokeDasharray="3 3" strokeWidth={1.5} />
                            <XAxis
                                dataKey="date" stroke="#525252"
                                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                fontSize={12} tickLine={false} axisLine={false} dy={10} interval="preserveStartEnd" minTickGap={50}
                            />
                            <YAxis
                                stroke="#525252" fontSize={14} tickLine={false} axisLine={false}
                                tickFormatter={yTickFormatter} dx={-10}
                                domain={['auto', 'auto']} tickCount={8}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 2 }} />
                            <Legend iconType="rect" wrapperStyle={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px', fontWeight: 600 }} />
                            <Line type="monotone" dataKey="portfolio_nav" name="Portfolio" stroke="#e5e5e5" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#e5e5e5', stroke: '#000', strokeWidth: 2 }} />
                            <Line type="monotone" dataKey="benchmark_nav" name="Benchmark (BTC)" stroke="#525252" strokeWidth={3} strokeDasharray="6 6" dot={false} activeDot={{ r: 6, fill: '#525252', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </ChartCardModal>
        </div>
    );
}
