/**
 * /cot/screener — Main screener page.
 * Shows all markets in a single list; metrics use each asset’s
 * primary report type (resolved server-side via screener-v2).
 */

import { useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCotStore } from '../store/useCotStore';
import ScreenerTable from '../components/ScreenerTable';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function ScreenerPage() {
    const { docsOpen, setDocsOpen } = useCotStore();
    const navigate = useNavigate();

    const handleSelectMarket = useCallback(
        (code: string) => {
            navigate(`/cot/dashboard/${code}`);
        },
        [navigate],
    );

    return (
        <>
            <header className="flex-shrink-0 h-12 flex items-center px-5 gap-0 app-topnav relative z-30">
                <Link to="/" className="flex items-center gap-2 flex-shrink-0 select-none group mr-5">
                    <span className="font-sans text-[14px] font-medium tracking-[0.12em] text-white/50 uppercase group-hover:text-white/80 transition-colors duration-300">
                        Equilibrium
                    </span>
                </Link>

                <div className="w-px h-4 bg-white/[0.06] flex-shrink-0 mr-4" />

                <nav className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase text-black bg-white rounded-full">
                        Screener
                    </span>
                </nav>

                <div className="flex-1" />

                <button
                    onClick={() => setDocsOpen(!docsOpen)}
                    className="h-8 w-8 flex items-center justify-center rounded-full text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-300"
                    title="Documentation"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        <path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" />
                    </svg>
                </button>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <ErrorBoundary>
                    <ScreenerTable onSelectMarket={handleSelectMarket} />
                </ErrorBoundary>
            </main>
        </>
    );
}
