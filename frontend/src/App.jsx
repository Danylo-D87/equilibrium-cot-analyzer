import React, { useState, useEffect, useCallback } from 'react';
import MarketSelector from './components/MarketSelector';
import CotReportTable from './components/CotReportTable';
import DocumentationModal from './components/DocumentationModal';
import BubbleChartModal from './components/BubbleChartModal';
import ScreenerTable from './components/ScreenerTable';

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trimStart().startsWith('<')) return null;
    return JSON.parse(text);
}

const REPORT_TYPES = [
    { key: 'legacy', label: 'Legacy' },
    { key: 'disagg', label: 'Disaggregated' },
    { key: 'tff', label: 'TFF' },
];

const SUBTYPES = [
    { key: 'fo', label: 'Futures Only' },
    { key: 'co', label: 'Combined' },
];

function App() {
    const [markets, setMarkets] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState(null);
    const [docsOpen, setDocsOpen] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);
    const [fitMode, setFitMode] = useState(false);
    const [activeTab, setActiveTab] = useState('report'); // 'report' | 'screener'

    // Report type & subtype toggles
    const [reportType, setReportType] = useState(() => localStorage.getItem('reportType') || 'legacy');
    const [subtype, setSubtype] = useState(() => localStorage.getItem('subtype') || 'fo');

    // Persist report type / subtype
    useEffect(() => { localStorage.setItem('reportType', reportType); }, [reportType]);
    useEffect(() => { localStorage.setItem('subtype', subtype); }, [subtype]);

    // Load market list when report type or subtype changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchJson(`/data/markets_${reportType}_${subtype}.json`);
                if (!data) throw new Error(`No data for ${reportType}/${subtype} \u2014 run pipeline first`);
                if (cancelled) return;
                setMarkets(data);
                const savedCode = localStorage.getItem('selectedMarket');
                const found = savedCode && data.find(m => m.code === savedCode);
                if (found) {
                    setSelectedMarket(found);
                } else {
                    // Default to BITCOIN (133741) for TFF, or first market
                    const btc = reportType === 'tff' ? data.find(m => m.code === '133741') : null;
                    setSelectedMarket(btc || data[0] || null);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [reportType, subtype]);

    // Load market data when selection or report type/subtype changes
    useEffect(() => {
        if (!selectedMarket) return;
        let cancelled = false;
        (async () => {
            try {
                setDataLoading(true);
                const data = await fetchJson(`/data/market_${selectedMarket.code}_${reportType}_${subtype}.json`);
                if (!data) { setMarketData(null); return; }
                if (!cancelled) {
                    setMarketData(data);
                    localStorage.setItem('selectedMarket', selectedMarket.code);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setDataLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedMarket, reportType, subtype]);

    // Handler for screener row click — navigate to that market's report
    const handleScreenerSelect = useCallback((code) => {
        const found = markets.find(m => m.code === code);
        if (found) {
            setSelectedMarket(found);
            setActiveTab('report');
        }
    }, [markets]);

    if (loading) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#e5e5e5]" />
                    <span className="text-[#525252] text-xs tracking-[0.2em] uppercase font-medium">Loading data…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-12 h-12 mx-auto rounded-sm bg-[#450a0a]/20 flex items-center justify-center border border-[#450a0a]/30">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#f87171]">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <p className="text-[#f87171] text-sm font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs text-[#a3a3a3] hover:text-white transition-all duration-300 tracking-widest uppercase px-6 py-2.5 rounded-sm border border-[#262626] hover:border-[#a3a3a3] hover:bg-[#121212]"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 h-12 border-b border-[#262626] flex items-center px-5 gap-0 bg-[#0a0a0a]">
                {/* Brand */}
                <div className="flex items-baseline gap-1.5 flex-shrink-0 select-none mr-5">
                    <span className="text-[13px] font-semibold tracking-[0.08em] text-[#e5e5e5] uppercase">
                        Equilibrium
                    </span>
                    <span className="text-[9px] font-medium tracking-[0.12em] text-[#404040] uppercase hidden sm:inline">
                        COT
                    </span>
                </div>

                {/* View tabs — flat text */}
                <nav className="flex items-center gap-0 flex-shrink-0 mr-4">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase transition-colors duration-200 ${activeTab === 'report'
                            ? 'text-[#e5e5e5]'
                            : 'text-[#404040] hover:text-[#737373]'
                            }`}
                    >
                        Report
                    </button>
                    <span className="text-[#262626] text-[10px] select-none">·</span>
                    <button
                        onClick={() => setActiveTab('screener')}
                        className={`px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase transition-colors duration-200 ${activeTab === 'screener'
                            ? 'text-[#e5e5e5]'
                            : 'text-[#404040] hover:text-[#737373]'
                            }`}
                    >
                        Screener
                    </button>
                </nav>

                {/* Thin divider */}
                <div className="w-px h-4 bg-[#1a1a1a] flex-shrink-0 mr-4" />

                {/* Report Type — compact inline */}
                <div className="flex items-center gap-0 flex-shrink-0 mr-3">
                    {REPORT_TYPES.map((rt, i) => (
                        <React.Fragment key={rt.key}>
                            {i > 0 && <span className="text-[#1a1a1a] text-[8px] mx-0.5 select-none">/</span>}
                            <button
                                onClick={() => setReportType(rt.key)}
                                className={`px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase transition-colors duration-200 rounded-sm ${reportType === rt.key
                                    ? 'text-[#e5e5e5] bg-[#1a1a1a]'
                                    : 'text-[#404040] hover:text-[#737373]'
                                    }`}
                            >
                                {rt.key === 'disagg' ? 'Disagg' : rt.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Subtype — minimal two-letter toggle */}
                <div className="flex items-center gap-0 flex-shrink-0">
                    {SUBTYPES.map((st, i) => (
                        <React.Fragment key={st.key}>
                            {i > 0 && <span className="text-[#1a1a1a] text-[8px] mx-0.5 select-none">/</span>}
                            <button
                                onClick={() => setSubtype(st.key)}
                                className={`px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase transition-colors duration-200 rounded-sm ${subtype === st.key
                                    ? 'text-[#e5e5e5] bg-[#1a1a1a]'
                                    : 'text-[#404040] hover:text-[#737373]'
                                    }`}
                            >
                                {st.key === 'fo' ? 'FO' : 'CO'}
                            </button>
                        </React.Fragment>
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
                                onChange={setSelectedMarket}
                            />
                            <button
                                onClick={() => setChartOpen(true)}
                                className="h-7 w-7 flex items-center justify-center rounded-sm text-[#404040] hover:text-[#e5e5e5] hover:bg-[#141414] transition-colors duration-200"
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
                        className="h-7 w-7 flex items-center justify-center rounded-sm text-[#404040] hover:text-[#e5e5e5] hover:bg-[#141414] transition-colors duration-200"
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

            <DocumentationModal isOpen={docsOpen} onClose={() => setDocsOpen(false)} />
            <BubbleChartModal isOpen={chartOpen} onClose={() => setChartOpen(false)} data={marketData} />

            {/* Main content — switches by tab */}
            <main className="flex-1 overflow-hidden relative">
                {activeTab === 'report' ? (
                    <>
                        {dataLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#e5e5e5]" />
                            </div>
                        ) : marketData ? (
                            <CotReportTable data={marketData} fitMode={fitMode} />
                        ) : null}

                        {/* Fit to screen button */}
                        {marketData && (
                            <button
                                onClick={() => setFitMode(f => !f)}
                                className={`fixed bottom-5 right-5 z-40 w-10 h-10 flex items-center justify-center rounded-sm border transition-all duration-300 shadow-lg shadow-black/40 ${fitMode
                                    ? 'bg-[#e5e5e5]/10 border-[#e5e5e5]/30 text-[#e5e5e5]'
                                    : 'bg-[#0a0a0a]/90 border-[#262626] text-[#525252] hover:text-[#e5e5e5] hover:border-[#404040] hover:bg-[#121212]'
                                    } backdrop-blur-sm`}
                                title={fitMode ? 'Звичайний розмір' : 'Вмістити на екран'}
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
            </main>
        </div>
    );
}

export default App;
