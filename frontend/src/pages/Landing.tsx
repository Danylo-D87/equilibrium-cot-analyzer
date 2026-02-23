import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* Admin Bookmark Tab (visible to admins only) — rendered via portal to bypass overflow clipping */
function AdminBookmark() {
    return createPortal(
        <Link
            to="/admin"
            title="Admin Panel"
            className="group fixed left-0 bottom-20 z-[9999] opacity-50 hover:opacity-100 transition-opacity duration-400"
        >
            <div
                className="relative flex items-center justify-center bg-[#111111] border-r border-t border-b border-white/[0.10] group-hover:border-white/[0.25] transition-all duration-300 rounded-r-lg"
                style={{ width: '24px', height: '72px' }}
            >
                <span
                    className="text-[7px] font-sans font-medium tracking-[0.2em] text-white/40 group-hover:text-white/80 uppercase transition-colors duration-300 select-none"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    ADMIN
                </span>
            </div>
        </Link>,
        document.body,
    );
}

/* Tool-card definitions */
interface ToolCard {
    key: string;
    title: string;
    subtitle: string;
    status: 'AVAILABLE' | 'COMING SOON';
    to?: string;
    icon: React.ReactNode;
}

const TOOLS: ToolCard[] = [
    {
        key: 'cot',
        title: 'COT Analyzer',
        subtitle: 'Commitments of Traders report analysis, positioning signals, and market screener.',
        status: 'AVAILABLE',
        to: '/cot',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 4-6" />
            </svg>
        ),
    },
    {
        key: 'journal',
        title: 'Analytical Space',
        subtitle: 'Track, analyze, and optimize your trading performance with advanced metrics.',
        status: 'AVAILABLE',
        to: '/journal',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
            </svg>
        ),
    },
    {
        key: 'library',
        title: 'Research Library',
        subtitle: 'Curated repository of market studies, methodologies, and reference data.',
        status: 'COMING SOON',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
];

/* Landing Page */
export default function Landing() {
    const toolsRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, logout, isAdmin } = useAuth();
    const [showLogoutPopover, setShowLogoutPopover] = useState(false);
    const logoutRef = useRef<HTMLDivElement>(null);

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
            {isAdmin() && <AdminBookmark />}

            <div className="relative z-10">

                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 landing-nav">
                    <div className="px-6 md:px-10 h-[72px] flex items-center justify-between">
                        <Link to="/" className="group">
                            <span className="text-[14px] font-sans font-medium tracking-[0.12em] text-white/50 group-hover:text-white/80 transition-colors duration-300 uppercase">
                                Equilibrium
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">

                            {isAuthenticated ? (
                                <div ref={logoutRef} className="relative">
                                    <button
                                        onClick={() => setShowLogoutPopover(v => !v)}
                                        className="px-5 py-2 text-[11px] font-sans font-medium tracking-[0.1em] text-white/30 hover:text-white/60 uppercase transition-colors duration-300"
                                    >
                                        Log Out
                                    </button>

                                    {showLogoutPopover && (
                                        <div className="absolute right-0 top-[calc(100%+8px)] w-[180px] bg-[#111111] border border-white/[0.06] rounded-[16px] z-50 overflow-hidden"
                                            style={{ animation: 'popoverIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
                                            <div className="px-4 py-3 border-b border-white/[0.04]">
                                                <p className="text-[10px] font-sans font-medium tracking-[0.15em] text-white/40 uppercase text-center">Confirm</p>
                                            </div>
                                            <div className="p-2 flex flex-col gap-1">
                                                <button
                                                    onClick={() => { logout(); setShowLogoutPopover(false); }}
                                                    className="w-full py-2.5 text-[10px] font-sans font-medium tracking-[0.15em] uppercase text-red-400/60 hover:text-red-400 hover:bg-white/[0.03] transition-all duration-300 rounded-[10px]"
                                                >
                                                    Log Out
                                                </button>
                                                <button
                                                    onClick={() => setShowLogoutPopover(false)}
                                                    className="w-full py-2.5 text-[10px] font-sans font-medium tracking-[0.15em] uppercase text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-300 rounded-[10px]"
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
                                    className="px-6 py-2 text-[11px] font-sans font-medium tracking-[0.1em] bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 uppercase"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 lg:px-20 relative gap-16 lg:gap-32 pt-20 lg:pt-0">
                    {/* Left side: Brand */}
                    <div className="flex-1 flex flex-col items-start justify-center w-full">
                        <h1
                            className="hero-headline text-[clamp(4rem,10vw,10rem)] font-normal leading-[1] tracking-[0.06em] text-white/90 text-left"
                            style={{ fontFamily: "'Cinzel', serif", textShadow: '0 0 60px rgba(255,255,255,0.08)' }}
                        >
                            Equilibrium
                        </h1>
                        {/* Subtitle */}
                        <p className="mt-5 text-[11px] font-sans font-light text-white/35 tracking-[0.25em] uppercase" style={{ paddingLeft: '6px' }}>
                            Analytical ecosystem
                        </p>
                    </div>

                    {/* Right side: Tools */}
                    <div className="flex-1 w-full max-w-[500px] flex flex-col gap-4" ref={toolsRef} id="tools">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                            <span className="text-[9px] font-sans font-medium tracking-[0.3em] text-white/30 uppercase">
                                Tools
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                        
                        {TOOLS.map(tool => {
                            const isAvailable = tool.status === 'AVAILABLE' && tool.to;
                            const Wrapper = isAvailable ? Link : 'div';
                            const wrapperProps = isAvailable ? { to: tool.to! } : {};
                            return (
                                <Wrapper
                                    key={tool.key}
                                    {...wrapperProps as any}
                                    className={`group relative border border-white/[0.04] bg-[#111111]/50 backdrop-blur-sm overflow-hidden p-6 rounded-[20px] hover:border-white/[0.12] hover:bg-[#111111] transition-all duration-500 flex items-start gap-5 ${isAvailable ? 'cursor-pointer' : 'opacity-50'}`}
                                >
                                    {/* Icon */}
                                    <div className={`mt-1 flex-shrink-0 ${isAvailable ? 'text-white/40 group-hover:text-white/80 transition-colors' : 'text-white/15'}`}>
                                        {tool.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-[14px] font-sans font-medium tracking-[0.05em] uppercase ${
                                                isAvailable ? 'text-white/80 group-hover:text-white transition-colors duration-300' : 'text-white/30'
                                            }`}>
                                                {tool.title}
                                            </h3>
                                            <span className={`text-[8px] font-sans font-medium tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full border ${
                                                isAvailable
                                                    ? 'text-white/40 border-white/[0.08] bg-white/[0.03]'
                                                    : 'text-white/20 border-white/[0.04]'
                                            }`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                        <p className="text-[12px] font-sans font-light leading-[1.6] text-white/30 group-hover:text-white/50 transition-colors">
                                            {tool.subtitle}
                                        </p>
                                    </div>
                                </Wrapper>
                            );
                        })}
                    </div>
                </section>


            </div>
        </>
    );
}
