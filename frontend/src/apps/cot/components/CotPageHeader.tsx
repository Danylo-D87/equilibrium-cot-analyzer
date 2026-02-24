/**
 * Shared header bar for Screener and Report pages.
 * Renders brand logo, page nav, report-type/subtype selectors, and an optional right-side slot.
 *
 * Eliminates header duplication between ScreenerPage and ReportPage.
 */

import { Link } from 'react-router-dom';
import { REPORT_TYPES, SUBTYPES } from '../utils/constants';
import type { ReportType, Subtype } from '../types';

// ─── Sub-components ──────────────────────────────────────────

function Separator({ className = '' }: { className?: string }) {
    return <div className={`w-px h-4 bg-white/[0.06] flex-shrink-0 ${className}`} />;
}

// ─── Main component ──────────────────────────────────────────

interface CotPageHeaderProps {
    /** Which page is currently active — controls nav highlighting. */
    activePage: 'screener' | 'report';
    /** Market code — enables Dashboard link in nav (Report page). */
    code?: string;
    reportType: ReportType;
    onReportTypeChange: (rt: ReportType) => void;
    subtype: Subtype;
    onSubtypeChange: (st: Subtype) => void;
    /**
     * Report types available for the current market.
     * Empty array = all available. Used on Report page to dim unavailable types.
     */
    availableReports?: ReportType[];
    /** Right-side actions slot (e.g. docs button, chart button, market name). */
    children?: React.ReactNode;
}

export default function CotPageHeader({
    activePage,
    code,
    reportType,
    onReportTypeChange,
    subtype,
    onSubtypeChange,
    availableReports = [],
    children,
}: CotPageHeaderProps) {
    return (
        <header className="flex-shrink-0 h-12 flex items-center px-5 gap-0 app-topnav relative z-30">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 select-none group mr-5">
                <span className="font-sans text-[14px] font-medium tracking-[0.12em] text-white/50 uppercase group-hover:text-white/80 transition-colors duration-300">
                    Equilibrium
                </span>
            </Link>

            <Separator className="mr-4" />

            {/* Navigation */}
            <nav className="flex items-center gap-1 flex-shrink-0 mr-4">
                {activePage === 'screener' ? (
                    <span className="px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase text-black bg-white rounded-full">
                        Screener
                    </span>
                ) : (
                    <Link
                        to="/cot/screener"
                        className="px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase text-white/30 hover:text-white/60 transition-all duration-300 rounded-full"
                    >
                        Screener
                    </Link>
                )}
                {code && activePage === 'report' && (
                    <Link
                        to={`/cot/dashboard/${code}`}
                        className="px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase text-white/30 hover:text-white/60 transition-all duration-300 rounded-full"
                    >
                        Dashboard
                    </Link>
                )}
                {activePage === 'report' && (
                    <span className="px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase text-black bg-white rounded-full">
                        Report
                    </span>
                )}
            </nav>

            <Separator className="mr-3" />

            {/* Report type pills */}
            <div className="flex items-center gap-0.5 flex-shrink-0 mr-2 bg-white/[0.03] border border-white/[0.04] rounded-full p-0.5">
                {REPORT_TYPES.map((rt) => {
                    const available = availableReports.length === 0 || availableReports.includes(rt.key as ReportType);
                    return (
                        <button
                            key={rt.key}
                            onClick={() => available && onReportTypeChange(rt.key as ReportType)}
                            disabled={!available}
                            className={`px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] uppercase transition-all duration-300 rounded-full ${
                                !available
                                    ? 'text-white/10 cursor-not-allowed'
                                    : reportType === rt.key
                                        ? 'text-white/90 bg-white/[0.08]'
                                        : 'text-white/30 hover:text-white/50'
                            }`}
                            title={!available ? `${rt.label} not available for this market` : undefined}
                        >
                            {rt.shortLabel}
                        </button>
                    );
                })}
            </div>

            {/* Subtype pills */}
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-white/[0.03] border border-white/[0.04] rounded-full p-0.5">
                {SUBTYPES.map((st) => (
                    <button
                        key={st.key}
                        onClick={() => onSubtypeChange(st.key as Subtype)}
                        className={`px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] uppercase transition-all duration-300 rounded-full ${subtype === st.key ? 'text-white/90 bg-white/[0.08]' : 'text-white/30 hover:text-white/50'}`}
                    >
                        {st.shortLabel}
                    </button>
                ))}
            </div>

            <div className="flex-1" />

            {/* Right-side slot */}
            {children}
        </header>
    );
}
