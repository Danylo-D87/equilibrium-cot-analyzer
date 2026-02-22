import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaveformVisualization from '../components/landing/WaveformVisualization';
import RadarVisualization from '../components/landing/RadarVisualization';
import GridVisualization from '../components/landing/GridVisualization';

/* ──────────────────────────────────────────────
   Admin Bookmark Tab (visible to admins only)
   ────────────────────────────────────────────── */
function AdminBookmark() {
    return (
        <Link
            to="/admin"
            title="Admin Panel"
            className="group fixed left-0 top-[85%] -translate-y-1/2 z-50 opacity-60 hover:opacity-100 transition-opacity duration-500"
            style={{ filter: 'drop-shadow(2px 0 6px rgba(196,168,124,0.08))' }}
        >
            {/* Bookmark shape: simple rectangle */}
            <div
                className="relative flex items-center justify-center bg-[#1a1610] border-r border-t border-b border-[#c4a87c]/20 group-hover:border-[#c4a87c]/40 group-hover:bg-[#211d14] transition-all duration-400 rounded-r-sm"
                style={{
                    width: '22px',
                    height: '72px',
                }}
            >
                {/* Bronze glow */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-r-sm"
                    style={{ background: 'linear-gradient(180deg, rgba(196,168,124,0.05) 0%, transparent 100%)' }}
                />
                {/* Vertical text */}
                <span
                    className="text-[6.5px] font-sans font-medium tracking-[0.3em] text-[#c4a87c]/40 group-hover:text-[#c4a87c]/70 uppercase transition-colors duration-400 select-none"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    STAFF
                </span>
            </div>
        </Link>
    );
}

/* ──────────────────────────────────────────────
   Tool-card definitions
   ────────────────────────────────────────────── */
interface ToolCard {
    key: string;
    title: string;
    subtitle: string;
    status: 'AVAILABLE' | 'COMING SOON';
    to?: string;
    visualization: React.ReactNode;
}

/** Tools (shown in 3-col row) */
const TOOLS: ToolCard[] = [
    {
        key: 'cot',
        title: 'COT ANALYZER',
        subtitle: 'Commitments of Traders report analysis, positioning signals, and market screener.',
        status: 'AVAILABLE',
        to: '/cot',
        visualization: <GridVisualization />,
    },
    {
        key: 'journal',
        title: 'ANALYTICAL SPACE',
        subtitle: 'Track, analyze, and optimize your trading performance with advanced metrics.',
        status: 'AVAILABLE',
        to: '/journal',
        visualization: <RadarVisualization />,
    },
    {
        key: 'library',
        title: 'RESEARCH LIBRARY',
        subtitle: 'Curated repository of market studies, methodologies, and reference data.',
        status: 'COMING SOON',
        visualization: <WaveformVisualization />,
    },
];

/* ──────────────────────────────────────────────
   Navigation items
   ────────────────────────────────────────────── */
const NAV_ITEMS = [
    { label: 'TOOLS', href: '#tools', accent: true },
];

/* ──────────────────────────────────────────────
   Landing Page
   ────────────────────────────────────────────── */
export default function Landing() {
    const toolsRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, logout, isAdmin } = useAuth();
    const [showLogoutPopover, setShowLogoutPopover] = useState(false);
    const logoutRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click
    useEffect(() => {
        if (!showLogoutPopover) return;
        function handler(e: MouseEvent) {
            if (logoutRef.current && !logoutRef.current.contains(e.target as Node)) {
                setShowLogoutPopover(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showLogoutPopover]);

    const scrollToTools = (e: React.MouseEvent) => {
        e.preventDefault();
        toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            {/* === Admin bookmark (admins only) === */}
            {isAdmin() && <AdminBookmark />}

            <div className="relative z-10">

                {/* ── Navigation ── */}
                <nav className="fixed top-0 left-0 right-0 z-50 landing-nav">
                    <div className="px-6 md:px-10 h-[72px] flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="group">
                            <span className="text-[13px] font-serif font-medium tracking-[0.18em] text-white/50 group-hover:text-white/75 transition-colors duration-500 uppercase">
                                Equilibrium
                            </span>
                        </Link>

                        {/* Nav links */}
                        <div className="hidden md:flex items-center gap-10">
                            {NAV_ITEMS.map(item => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={item.href === '#tools' ? scrollToTools : undefined}
                                    className={`text-[10px] font-sans font-medium tracking-[0.2em] uppercase transition-colors duration-400 ${item.accent
                                        ? 'text-[#8a7a62] hover:text-[#b8a682]'
                                        : 'text-white/30 hover:text-white/60'
                                        }`}
                                >
                                    {item.label}
                                </a>
                            ))}

                            {/* Auth buttons */}
                            <div className="w-px h-4 bg-white/[0.06] mx-1" />
                            {isAuthenticated ? (
                                <div ref={logoutRef} className="relative">
                                    <button
                                        onClick={() => setShowLogoutPopover(v => !v)}
                                        className="px-4 py-1.5 text-[10px] font-sans font-medium tracking-[0.15em] text-white/30 hover:text-white/60 uppercase transition-colors duration-400"
                                    >
                                        Log Out
                                    </button>

                                    {showLogoutPopover && (
                                        <div className="absolute right-0 top-[calc(100%+12px)] w-[160px] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.04] rounded-sm shadow-2xl z-50 overflow-hidden"
                                            style={{ animation: 'popoverIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
                                            <div className="px-4 py-3 border-b border-white/[0.03]">
                                                <p className="text-[8px] font-sans font-medium tracking-[0.25em] text-white/40 uppercase text-center">Confirm Action</p>
                                            </div>
                                            <div className="p-2 flex flex-col gap-1">
                                                <button
                                                    onClick={() => { logout(); setShowLogoutPopover(false); }}
                                                    className="w-full py-2 text-[9px] font-sans font-medium tracking-[0.2em] uppercase text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.05] transition-all duration-300 rounded-sm"
                                                >
                                                    Log Out
                                                </button>
                                                <button
                                                    onClick={() => setShowLogoutPopover(false)}
                                                    className="w-full py-2 text-[9px] font-sans font-medium tracking-[0.2em] uppercase text-white/30 hover:text-white/70 hover:bg-white/[0.03] transition-all duration-300 rounded-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-4 py-1.5 text-[10px] font-sans font-medium tracking-[0.15em] text-[#8a7a62] border border-[#8a7a62]/25 hover:border-[#8a7a62]/50 hover:bg-[#8a7a62]/[0.06] rounded-sm uppercase transition-all duration-400"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
                    {/* Volumetric glow behind headline */}
                    <div className="hero-glow" />

                    {/* Main headline */}
                    <h1 className="hero-headline font-serif text-[clamp(2.4rem,6vw,6rem)] font-normal leading-[1.02] tracking-[0.06em] text-white/[0.92] text-center mb-8">
                        Equilibrium
                    </h1>

                    {/* Subline */}
                    <p className="hero-sub text-[12px] md:text-[13px] font-sans font-extralight tracking-[0.2em] text-white/[0.35] text-center uppercase max-w-lg leading-[2]">
                        Capital management in a volatile world
                    </p>

                    {/* Scroll indicator */}
                    <div className="scroll-breathe absolute bottom-16 flex flex-col items-center gap-4">
                        <span className="text-[9px] font-sans tracking-[0.35em] text-white/[0.4] uppercase">
                            Explore
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1" className="text-white/[0.3]">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </section>

                {/* ── Tools Section ── */}
                <section ref={toolsRef} id="tools" className="py-40 px-6">
                    <div className="max-w-[1200px] mx-auto">
                        {/* Section header */}
                        <div className="text-center mb-24">
                            <h2 className="font-serif text-[clamp(1.6rem,3.5vw,3.2rem)] font-normal tracking-[0.04em] text-white/[0.7]">
                                Analytics Suite
                            </h2>
                        </div>

                        {/* Tools Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {TOOLS.map(tool => {
                                const isAvailable = tool.status === 'AVAILABLE' && tool.to;
                                const Wrapper = isAvailable ? Link : 'div';
                                const wrapperProps = isAvailable ? { to: tool.to! } : {};
                                return (
                                    <Wrapper key={tool.key} {...wrapperProps as any} className={`tool-card group relative border border-white/[0.03] overflow-hidden transition-all duration-700 hover:border-white/[0.08] ${isAvailable ? 'cursor-pointer' : 'opacity-70'}`}>
                                        {/* Status */}
                                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-[5px] h-[5px] rounded-full ${isAvailable ? 'bg-bronze/60' : 'bg-white/[0.12]'}`} />
                                                <span className={`text-[8px] font-sans tracking-[0.25em] uppercase ${isAvailable ? 'text-bronze/40' : 'text-white/[0.18]'}`}>
                                                    {tool.status}
                                                </span>
                                            </div>
                                            {!isAvailable && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="1" className="text-white/[0.1]">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            )}
                                            {isAvailable && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="1" className="text-bronze/30 group-hover:text-bronze/60 transition-colors">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Visualization */}
                                        <div className={`px-5 py-2 ${isAvailable ? 'opacity-60' : 'opacity-40'}`}>
                                            {tool.visualization}
                                        </div>

                                        {/* Text */}
                                        <div className="px-5 pb-7 pt-3">
                                            <h3 className={`text-[9px] font-sans font-medium tracking-[0.22em] mb-3 ${isAvailable ? 'text-white/[0.45] group-hover:text-[#8a7a62]/70 transition-colors duration-500' : 'text-white/[0.28]'}`}>
                                                {tool.title}
                                            </h3>
                                            <p className="text-[11px] font-sans font-extralight leading-[1.8] text-white/[0.2]">
                                                {tool.subtitle}
                                            </p>
                                        </div>

                                        {/* Bottom line */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${isAvailable ? 'via-[#8a7a62]/[0.08] group-hover:via-[#8a7a62]/[0.25]' : 'via-white/[0.02]'} to-transparent transition-all duration-700`} />
                                    </Wrapper>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="py-20 px-6 border-t border-white/[0.03]">
                    <div className="max-w-[1200px] mx-auto">
                        {/* Minimal divider */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <span className="font-serif text-[11px] tracking-[0.15em] text-white/[0.18]">
                                    Equilibrium
                                </span>
                                <div className="w-px h-3 bg-[#8a7a62]/[0.15]" />
                                <span className="text-[8px] font-sans tracking-[0.2em] text-white/[0.14] uppercase">
                                    © 2026
                                </span>
                            </div>
                            <div className="flex items-center gap-10">
                                {['Privacy', 'Terms', 'Contact'].map(item => (
                                    <a
                                        key={item}
                                        href="#"
                                        className="text-[8px] font-sans tracking-[0.2em] text-white/[0.16] hover:text-white/[0.4] transition-colors duration-500 uppercase"
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
