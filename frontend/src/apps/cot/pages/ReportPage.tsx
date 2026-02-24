/**
 * /cot/report/:code — Full report table page for a single market.
 * Wraps the existing CotReportTable with report-type/subtype switching.
 */

import { useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useCotStore } from '../store/useCotStore';
import { useMarkets, useMarketData } from '../hooks/useMarketQueries';
import { getAssetConfig } from '../utils/assetConfig';
import CotPageHeader from '../components/CotPageHeader';
import CotReportTable from '../components/CotReportTable';
import Spinner from '@/components/ui/Spinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const BubbleChartModal = lazy(() => import('../components/charts/BubbleChartModal'));

export default function ReportPage() {
    const { code } = useParams<{ code: string }>();
    const {
        reportType, setReportType,
        subtype, setSubtype,
        selectedMarketCode, setSelectedMarketCode,
        fitMode, toggleFitMode,
        chartOpen, setChartOpen,
        availableReports,
    } = useCotStore();

    // Set market code from URL param
    useEffect(() => {
        if (code && code !== selectedMarketCode) {
            setSelectedMarketCode(code);
        }
    }, [code, selectedMarketCode, setSelectedMarketCode]);

    // Auto-select primary report type for this market on mount
    useEffect(() => {
        if (code) {
            const cfg = getAssetConfig(code);
            setReportType(cfg.primaryReport);
        }
    }, [code, setReportType]);

    const { data: markets = [] } = useMarkets(reportType, subtype);
    const { data: marketData = null, isLoading } = useMarketData(reportType, subtype, code ?? null);

    const marketMeta = markets.find((m) => m.code === code);

    return (
        <>
            <CotPageHeader
                activePage="report"
                code={code}
                reportType={reportType}
                onReportTypeChange={setReportType}
                subtype={subtype}
                onSubtypeChange={setSubtype}
                availableReports={availableReports}
            >
                {marketMeta && (
                    <span className="text-[11px] text-white/40 mr-3">
                        {marketMeta.exchange || marketMeta.name}
                    </span>
                )}
                <button
                    onClick={() => setChartOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-300"
                    title="Charts"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" />
                    </svg>
                </button>
            </CotPageHeader>

            <Suspense fallback={null}>
                {chartOpen && (
                    <BubbleChartModal isOpen={chartOpen} onClose={() => setChartOpen(false)} data={marketData} />
                )}
            </Suspense>

            <main className="flex-1 overflow-hidden relative">
                <ErrorBoundary>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><Spinner /></div>
                    ) : marketData ? (
                        <CotReportTable data={marketData} fitMode={fitMode} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-white/30 text-sm">No data available for this market / report combination.</p>
                        </div>
                    )}
                    {marketData && (
                        <button
                            onClick={toggleFitMode}
                            className={`fixed bottom-5 right-5 z-40 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${fitMode ? 'bg-white text-black' : 'bg-[#111111] text-white/40 border border-white/[0.06] hover:text-white/70 hover:bg-[#1a1a1a]'}`}
                            title={fitMode ? 'Normal size' : 'Fit to screen'}
                        >
                            {fitMode ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 4 20 10 20" /><polyline points="20 10 20 4 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                            )}
                        </button>
                    )}
                </ErrorBoundary>
            </main>
        </>
    );
}
