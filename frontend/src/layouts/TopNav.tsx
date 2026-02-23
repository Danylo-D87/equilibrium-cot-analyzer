
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
    const { user, isAuthenticated, hasPermission, isAdmin, logout } = useAuth();

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
    const visibleItems = [
        ...ALL_NAV_ITEMS.filter(item => !item.permission || hasPermission(item.permission)),
        ...(isAdmin() ? [{ to: '/admin', label: 'Admin', permission: undefined }] : []),
    ];

    async function handleLogout() {
        setMenuOpen(false);
        await logout();
        navigate('/');
    }

    return (
        <header className="flex-shrink-0 h-12 flex items-center px-6 app-topnav">
            {/* Brand */}
            <Link
                to="/"
                className="flex items-center gap-2.5 flex-shrink-0 select-none mr-8 group"
            >
                <span className="font-sans text-[14px] font-medium tracking-[0.12em] text-white/50 group-hover:text-white/80 transition-colors duration-300 uppercase">
                    Equilibrium
                </span>
            </Link>

            {/* Separator */}
            <div className="w-px h-4 bg-white/[0.06] flex-shrink-0 mr-5" />

            {/* App navigation */}
            <nav className="flex items-center gap-1">
                {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.1em] uppercase transition-all duration-300 rounded-pill ${isActive
                                ? 'text-black bg-white'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex-1" />

            {/* Right side */}
            {isAuthenticated && user ? (
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="flex items-center gap-2.5 px-2 py-1 rounded-pill hover:bg-white/[0.04] transition-colors"
                    >
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-[10px] font-sans font-medium text-white/60 uppercase">
                                {(user.nickname ?? user.email)[0]}
                            </span>
                        </div>
                        <span className="text-[11px] font-sans tracking-[0.04em] text-white/40 hidden sm:inline">
                            {user.nickname ?? user.email.split('@')[0]}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.5" className="text-white/20">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-[#111111] border border-white/[0.06] rounded-[16px] z-50 py-1 overflow-hidden"
                            style={{ animation: 'popoverIn 0.18s ease-out' }}>
                            <div className="px-4 py-3 border-b border-white/[0.04]">
                                <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                                <p className="text-[10px] text-white/25 mt-1 uppercase tracking-[0.1em]">{user.role}</p>
                            </div>
                            {isAdmin() && (
                                <Link
                                    to="/admin"
                                    onClick={() => setMenuOpen(false)}
                                    className="block w-full text-left px-4 py-3 text-[11px] tracking-[0.08em] text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-colors uppercase"
                                >
                                    Admin Panel
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-[11px] tracking-[0.08em] text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-colors uppercase"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link
                    to="/login"
                    className="px-5 py-2 text-[11px] font-sans font-medium tracking-[0.1em] bg-white text-black rounded-pill hover:bg-white/90 transition-all duration-300 uppercase"
                >
                    Sign In
                </Link>
            )}
        </header>
    );
}

