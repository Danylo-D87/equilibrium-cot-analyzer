import { useRef } from 'react';
import { Link } from 'react-router-dom';
import ViscousBackground from '../components/landing/ViscousBackground';
import WaveformVisualization from '../components/landing/WaveformVisualization';
import SwotVisualization from '../components/landing/SwotVisualization';
import RadarVisualization from '../components/landing/RadarVisualization';
import GridVisualization from '../components/landing/GridVisualization';

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

/** Featured tool (shown large) */
const FEATURED_TOOL: ToolCard = {
    key: 'cot',
    title: 'COT ANALYZER',
    subtitle: 'Commitments of Traders report analysis, positioning signals, and market screener.',
    status: 'AVAILABLE',
    to: '/cot',
    visualization: <GridVisualization />,
};

/** Secondary tools (shown in 3-col row) */
const SECONDARY_TOOLS: ToolCard[] = [
    {
        key: 'models',
        title: 'STATISTICAL MODELS',
        subtitle: 'Quantitative frameworks for pattern recognition and probabilistic forecasting.',
        status: 'COMING SOON',
        visualization: <SwotVisualization />,
    },
    {
        key: 'workspace',
        title: 'ANALYTICAL WORKSPACE',
        subtitle: 'Interactive environment for custom research, backtesting, and data exploration.',
        status: 'COMING SOON',
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
    { label: 'WHO WE ARE', href: '#about' },
    { label: 'APPROACH', href: '#approach' },
    { label: 'TOOLS & ANALYTICS', href: '#tools', accent: true },
];

/* ──────────────────────────────────────────────
   Landing Page
   ────────────────────────────────────────────── */
export default function Landing() {
    const toolsRef = useRef<HTMLDivElement>(null);

    const scrollToTools = (e: React.MouseEvent) => {
        e.preventDefault();
        toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="landing-root relative min-h-screen overflow-x-hidden">
            {/* === Viscous liquid background === */}
            <ViscousBackground />

            {/* === Overlay gradient for content readability === */}
            <div className="fixed inset-0 z-[1] pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(3,3,3,0.3) 0%, rgba(3,3,3,0.75) 100%)',
                }}
            />

            {/* === Content layer === */}
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
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
                    {/* Thin horizontal rule */}
                    <div className="w-[60px] h-px bg-white/[0.08] mb-12" />

                    {/* Main headline */}
                    <h1 className="font-serif text-[clamp(2.2rem,5.5vw,5.5rem)] font-medium leading-[1.05] tracking-[0.06em] text-white/[0.88] text-center mb-6">
                        Equilibrium Capital
                    </h1>

                    {/* Subline */}
                    <p className="text-[13px] md:text-[14px] font-sans font-light tracking-[0.15em] text-white/[0.45] text-center uppercase max-w-xl leading-relaxed">
                        Capital management in a volatile world.
                    </p>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-12 flex flex-col items-center gap-3 animate-pulse">
                        <span className="text-[8px] font-sans tracking-[0.3em] text-white/[0.25] uppercase">
                            Explore
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1" className="text-white/[0.2]">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </section>

                {/* ── About & Approach (brief) ── */}
                <section id="about" className="py-32 px-6">
                    <div className="max-w-[900px] mx-auto text-center">
                        <div className="w-[40px] h-px bg-white/[0.06] mx-auto mb-10" />
                        <p className="text-[11px] font-sans tracking-[0.25em] text-[#8a7a62]/60 uppercase mb-6">
                            Who We Are
                        </p>
                        <p className="text-[16px] md:text-[18px] font-sans font-light leading-[1.9] text-white/[0.50] max-w-2xl mx-auto">
                            Equilibrium Capital is where clarity is found amid chaos, instability, and uncertainty.
                            We reduce noise to structure. Disorder becomes measured calm.
                            Every decision is grounded in data, executed with discipline, and held with conviction.
                        </p>
                    </div>
                </section>

                <section id="approach" className="py-20 px-6">
                    <div className="max-w-[900px] mx-auto text-center">
                        <div className="w-[40px] h-px bg-white/[0.06] mx-auto mb-10" />
                        <p className="text-[11px] font-sans tracking-[0.25em] text-[#8a7a62]/60 uppercase mb-6">
                            Approach
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-14">
                            {[
                                { num: '01', title: 'QUANTITATIVE EDGE', desc: 'Proprietary models built on deep historical data. Orientation solely on numbers — no narratives, no sentiment.' },
                                { num: '02', title: 'RISK ARCHITECTURE', desc: 'Systematic risk control embedded at every level. Defined protocols that preserve capital through any market condition.' },
                                { num: '03', title: 'GLOBAL REACH', desc: 'Broad coverage across a wide spectrum of global markets, asset classes, and instruments.' },
                            ].map(item => (
                                <div key={item.num} className="text-left">
                                    <span className="text-[10px] font-sans tracking-[0.2em] text-white/[0.22]">
                                        {item.num}
                                    </span>
                                    <h3 className="text-[10px] font-sans font-medium tracking-[0.2em] text-white/[0.55] mt-3 mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-[12px] font-sans font-light leading-[1.8] text-white/[0.38]">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Tools Section ── */}
                <section ref={toolsRef} id="tools" className="py-32 px-6">
                    <div className="max-w-[1200px] mx-auto">
                        {/* Section header */}
                        <div className="text-center mb-20">
                            <div className="w-[40px] h-px bg-white/[0.06] mx-auto mb-10" />
                            <p className="text-[10px] font-sans tracking-[0.3em] text-[#8a7a62]/50 uppercase mb-4">
                                Open Platform
                            </p>
                            <h2 className="font-serif text-[clamp(1.4rem,3vw,2.8rem)] font-medium tracking-[0.03em] text-white/[0.75]">
                                ANALYTICS SUITE
                            </h2>
                        </div>

                        {/* Featured tool — COT Analyzer */}
                        <Link to={FEATURED_TOOL.to!} className="block mb-5">
                            <div className="tool-card group relative border border-white/[0.06] bg-black/40 backdrop-blur-sm overflow-hidden transition-all duration-700 hover:border-white/[0.12] cursor-pointer">
                                <div className="flex flex-col md:flex-row">
                                    {/* Visualization */}
                                    <div className="md:w-1/2 px-5 py-4 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                                        {FEATURED_TOOL.visualization}
                                    </div>
                                    {/* Content */}
                                    <div className="md:w-1/2 flex flex-col justify-center px-5 py-6 md:py-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-[5px] h-[5px] rounded-full bg-[#8a7a62]/50 tool-card-pulse" />
                                            <span className="text-[8px] font-sans tracking-[0.25em] text-white/[0.3] uppercase">
                                                {FEATURED_TOOL.status}
                                            </span>
                                        </div>
                                        <h3 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.6] group-hover:text-white/[0.85] transition-colors duration-700 mb-3">
                                            {FEATURED_TOOL.title}
                                        </h3>
                                        <p className="text-[12px] font-sans font-light leading-[1.7] text-white/[0.35] group-hover:text-white/[0.5] transition-colors duration-700">
                                            {FEATURED_TOOL.subtitle}
                                        </p>
                                        <div className="mt-5 flex items-center gap-2">
                                            <span className="text-[9px] font-sans tracking-[0.2em] text-white/[0.25] group-hover:text-white/[0.5] transition-colors duration-500 uppercase">
                                                Open
                                            </span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                strokeWidth="1.5" className="text-white/[0.2] group-hover:text-white/[0.45] transition-all duration-500 group-hover:translate-x-0.5">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8a7a62]/[0.08] to-transparent group-hover:via-[#8a7a62]/[0.25] transition-all duration-700" />
                            </div>
                        </Link>

                        {/* Secondary tools — 3 in a row, equal size */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {SECONDARY_TOOLS.map(tool => (
                                <div key={tool.key} className="tool-card group relative border border-white/[0.03] bg-black/20 overflow-hidden transition-all duration-700 hover:border-white/[0.06]">
                                    {/* Status */}
                                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-[5px] h-[5px] rounded-full bg-white/[0.12]" />
                                            <span className="text-[8px] font-sans tracking-[0.25em] text-white/[0.18] uppercase">
                                                {tool.status}
                                            </span>
                                        </div>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                            strokeWidth="1" className="text-white/[0.1]">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>

                                    {/* Visualization */}
                                    <div className="px-5 py-2 opacity-40">
                                        {tool.visualization}
                                    </div>

                                    {/* Text */}
                                    <div className="px-5 pb-6 pt-3">
                                        <h3 className="text-[10px] font-sans font-medium tracking-[0.2em] text-white/[0.32] mb-2">
                                            {tool.title}
                                        </h3>
                                        <p className="text-[11px] font-sans font-light leading-[1.7] text-white/[0.22]">
                                            {tool.subtitle}
                                        </p>
                                    </div>

                                    {/* Bottom line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="py-16 px-6 border-t border-white/[0.04]">
                    <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <span className="text-[9px] font-sans tracking-[0.2em] text-white/[0.22] uppercase">
                            © 2026 Equilibrium Capital. All rights reserved.
                        </span>
                        <div className="flex items-center gap-8">
                            {['Privacy', 'Terms', 'Contact'].map(item => (
                                <a
                                    key={item}
                                    href="#"
                                    className="text-[9px] font-sans tracking-[0.15em] text-white/[0.22] hover:text-white/[0.45] transition-colors duration-400 uppercase"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
