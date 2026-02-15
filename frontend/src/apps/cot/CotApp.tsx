import { useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCotStore } from './store/useCotStore';
import { useMarkets, useMarketData } from './hooks/useMarketQueries';
import { REPORT_TYPES, SUBTYPES, DEFAULT_MARKET_CODES } from './utils/constants';
import MarketSelector from './components/MarketSelector';
import CotReportTable from './components/CotReportTable';
import ScreenerTable from './components/ScreenerTable';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Spinner from '@/components/ui/Spinner';

// Lazy-load heavy modals — they're rarely opened
const DocumentationModal = lazy(() => import('./components/DocumentationModal'));
const BubbleChartModal = lazy(() => import('./components/charts/BubbleChartModal'));

// =====================================================
// COT Analyzer app — mounted at /cot
// =====================================================

export default function CotApp() {
    const {
        reportType, setReportType,
        subtype, setSubtype,
        selectedMarketCode, setSelectedMarketCode,
        fitMode, toggleFitMode,
        docsOpen, setDocsOpen,
        chartOpen, setChartOpen,
    } = useCotStore();

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL: /cot/screener → screener, /cot → report
    const activeTab = location.pathname === '/cot/screener' ? 'screener' : 'report';

    const setActiveTab = useCallback((tab: 'report' | 'screener') => {
        navigate(tab === 'screener' ? '/cot/screener' : '/cot', { replace: true });
    }, [navigate]);

    // --- Data fetching via React Query ---
    const { data: markets = [], isLoading: marketsLoading, error: marketsError } = useMarkets(reportType, subtype);
    const { data: marketData = null, isLoading: dataLoading } = useMarketData(reportType, subtype, selectedMarketCode);

    // --- Auto-select market when list loads or changes ---
    useEffect(() => {
        if (!markets.length) return;
        if (selectedMarketCode && markets.find(m => m.code === selectedMarketCode)) return;
        const def = markets.find(m => m.code === DEFAULT_MARKET_CODES[reportType]);
        setSelectedMarketCode(def?.code || markets[0]?.code || null);
    }, [markets, reportType, selectedMarketCode, setSelectedMarketCode]);

    // --- Screener row click → switch to report tab ---
    const handleScreenerSelect = useCallback((code: string) => {
        setSelectedMarketCode(code);
        setActiveTab('report');
    }, [setSelectedMarketCode, setActiveTab]);

    const selectedMarket = markets.find(m => m.code === selectedMarketCode) || null;

    if (marketsLoading && !markets.length) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner />
                    <span className="text-muted text-xs tracking-[0.14em] uppercase font-medium">Loading data…</span>
                </div>
            </div>
        );
    }

    if (marketsError) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-12 h-12 mx-auto rounded-sm bg-destructive/20 flex items-center justify-center border border-destructive/30">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive-fg">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <p className="text-destructive-fg text-sm font-medium">{marketsError.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs text-text-secondary hover:text-bronze transition-all duration-300 tracking-[0.14em] uppercase px-6 py-2.5 rounded-sm border border-border hover:border-bronze/20 hover:bg-bronze-glow"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Single unified header — brand + tabs + controls */}
            <header className="flex-shrink-0 h-11 flex items-center px-5 gap-0 app-topnav relative z-30">
                {/* Brand */}
                <Link
                    to="/"
                    className="flex items-center gap-2 flex-shrink-0 select-none group mr-5"
                >
                    <span className="font-serif text-[13px] font-medium tracking-[0.18em] text-white/50 uppercase group-hover:text-white/75 transition-colors duration-500">
                        Equilibrium
                    </span>
                </Link>

                {/* Separator */}
                <div className="w-px h-4 bg-white/[0.06] flex-shrink-0 mr-4" />

                {/* View tabs: Report / Screener */}
                <nav className="flex items-center gap-0 flex-shrink-0 mr-4">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 rounded-sm ${activeTab === 'report'
                            ? 'text-white/90'
                            : 'text-white/25 hover:text-white/50'
                            }`}
                    >
                        Report
                    </button>
                    <span className="text-white/[0.08] text-[8px] select-none mx-0.5">·</span>
                    <button
                        onClick={() => setActiveTab('screener')}
                        className={`px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 rounded-sm ${activeTab === 'screener'
                            ? 'text-white/90'
                            : 'text-white/25 hover:text-white/50'
                            }`}
                    >
                        Screener
                    </button>
                </nav>

                {/* Separator */}
                <div className="w-px h-4 bg-white/[0.06] flex-shrink-0 mr-3" />

                {/* Report Type pill group */}
                <div className="flex items-center gap-0.5 flex-shrink-0 mr-2 bg-white/[0.02] border border-white/[0.04] rounded-sm p-0.5">
                    {REPORT_TYPES.map((rt) => (
                        <button
                            key={rt.key}
                            onClick={() => setReportType(rt.key)}
                            className={`px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase transition-all duration-300 rounded-sm ${reportType === rt.key
                                ? 'text-white/80 bg-white/[0.06]'
                                : 'text-white/25 hover:text-white/45'
                                }`}
                        >
                            {rt.shortLabel}
                        </button>
                    ))}
                </div>

                {/* Subtype pill group */}
                <div className="flex items-center gap-0.5 flex-shrink-0 bg-white/[0.02] border border-white/[0.04] rounded-sm p-0.5">
                    {SUBTYPES.map((st) => (
                        <button
                            key={st.key}
                            onClick={() => setSubtype(st.key)}
                            className={`px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase transition-all duration-300 rounded-sm ${subtype === st.key
                                ? 'text-white/80 bg-white/[0.06]'
                                : 'text-white/25 hover:text-white/45'
                                }`}
                        >
                            {st.shortLabel}
                        </button>
                    ))}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right — search + actions */}
                <div className="flex-shrink-0 flex items-center gap-1.5">
                    {activeTab === 'report' && (
                        <>
                            <MarketSelector
                                markets={markets}
                                selected={selectedMarket}
                                onChange={(m) => setSelectedMarketCode(m.code)}
                            />
                            <button
                                onClick={() => setChartOpen(true)}
                                className="h-7 w-7 flex items-center justify-center rounded-sm text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-300"
                                title="Charts"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18" />
                                    <path d="M7 16l4-8 4 4 4-6" />
                                </svg>
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setDocsOpen(true)}
                        className="h-7 w-7 flex items-center justify-center rounded-sm text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-300"
                        title="Documentation"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M9 7h6" />
                            <path d="M9 11h6" />
                            <path d="M9 15h4" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Lazy-loaded modals */}
            <Suspense fallback={null}>
                {docsOpen && <DocumentationModal isOpen={docsOpen} onClose={() => setDocsOpen(false)} />}
            </Suspense>
            <Suspense fallback={null}>
                {chartOpen && <BubbleChartModal isOpen={chartOpen} onClose={() => setChartOpen(false)} data={marketData} />}
            </Suspense>

            {/* Main content */}
            <main className="flex-1 overflow-hidden relative">
                <ErrorBoundary>
                    {activeTab === 'report' ? (
                        <>
                            {dataLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Spinner />
                                </div>
                            ) : marketData ? (
                                <CotReportTable data={marketData} fitMode={fitMode} />
                            ) : null}

                            {/* Fit to screen button */}
                            {marketData && (
                                <button
                                    onClick={toggleFitMode}
                                    className="fixed bottom-5 right-5 z-40 w-10 h-10 flex items-center justify-center rounded-sm transition-all duration-300"
                                    style={{
                                        background: fitMode ? '#1a1611' : '#0e0e0e',
                                        border: fitMode
                                            ? '1px solid rgba(196,168,124,0.25)'
                                            : '1px solid #222',
                                        color: fitMode ? '#c4a87c' : '#555',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                                    }}
                                    onMouseEnter={e => {
                                        if (!fitMode) {
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,168,124,0.20)';
                                            (e.currentTarget as HTMLElement).style.color = '#c4a87c';
                                            (e.currentTarget as HTMLElement).style.background = '#151210';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!fitMode) {
                                            (e.currentTarget as HTMLElement).style.borderColor = '#222';
                                            (e.currentTarget as HTMLElement).style.color = '#555';
                                            (e.currentTarget as HTMLElement).style.background = '#0e0e0e';
                                        }
                                    }}
                                    title={fitMode ? 'Normal size' : 'Fit to screen'}
                                >
                                    {fitMode ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="15 3 21 3 21 9" />
                                            <polyline points="9 21 3 21 3 15" />
                                            <line x1="21" y1="3" x2="14" y2="10" />
                                            <line x1="3" y1="21" x2="10" y2="14" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="4 14 4 20 10 20" />
                                            <polyline points="20 10 20 4 14 4" />
                                            <line x1="14" y1="10" x2="21" y2="3" />
                                            <line x1="3" y1="21" x2="10" y2="14" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <ScreenerTable onSelectMarket={handleScreenerSelect} reportType={reportType} subtype={subtype} />
                    )}
                </ErrorBoundary>
            </main>
        </>
    );
}
