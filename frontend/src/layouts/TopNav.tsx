
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** All nav items with their required permission. */
const ALL_NAV_ITEMS = [
    { to: '/cot', label: 'COT Analyzer', permission: 'cot' },
    { to: '/journal', label: 'Journal', permission: 'journal' },
];

export default function TopNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, hasPermission, logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    // Only show nav items the user has access to
    const visibleItems = ALL_NAV_ITEMS.filter(
        item => !item.permission || hasPermission(item.permission),
    );

    async function handleLogout() {
        setMenuOpen(false);
        await logout();
        navigate('/');
    }

    return (
        <header className="flex-shrink-0 h-11 flex items-center px-6 app-topnav">
            {/* Brand — serif logo, links home */}
            <Link
                to="/"
                className="flex items-center gap-2.5 flex-shrink-0 select-none mr-8 group"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-bronze/60 group-hover:bg-bronze transition-colors duration-500" />
                <span className="font-serif text-[15px] font-normal tracking-[0.18em] text-bronze uppercase group-hover:text-bronze-hover transition-colors duration-300">
                    Equilibrium
                </span>
            </Link>

            {/* Thin separator */}
            <div className="w-px h-4 bg-bronze/10 flex-shrink-0 mr-5" />

            {/* App navigation */}
            <nav className="flex items-center gap-0.5">
                {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 rounded-sm border ${isActive
                                ? 'text-bronze bg-bronze/[0.07] border-bronze/15'
                                : 'text-muted hover:text-bronze/70 border-transparent'
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex-1" />

            {/* Right side — auth controls */}
            {isAuthenticated && user ? (
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-white/[0.03] transition-colors"
                    >
                        {/* Avatar circle */}
                        <div className="w-6 h-6 rounded-full bg-bronze/15 border border-bronze/20 flex items-center justify-center">
                            <span className="text-[9px] font-sans font-semibold text-bronze/70 uppercase">
                                {(user.nickname ?? user.email)[0]}
                            </span>
                        </div>
                        <span className="text-[10px] font-sans tracking-[0.08em] text-white/40 hidden sm:inline">
                            {user.nickname ?? user.email.split('@')[0]}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" className="text-white/20">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#0e0e0e] border border-white/[0.08] rounded-sm shadow-xl z-50 py-1">
                            <div className="px-3 py-2 border-b border-white/[0.06]">
                                <p className="text-[10px] text-white/50 truncate">{user.email}</p>
                                <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-wider">{user.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 text-[10px] tracking-[0.1em] text-white/35 hover:text-white/60 hover:bg-white/[0.03] transition-colors uppercase"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link
                    to="/login"
                    className="px-3 py-1.5 text-[10px] font-sans font-medium tracking-[0.15em] text-bronze/50 hover:text-bronze border border-bronze/15 hover:border-bronze/30 rounded-sm transition-all duration-300 uppercase"
                >
                    Sign In
                </Link>
            )}
        </header>
    );
}

