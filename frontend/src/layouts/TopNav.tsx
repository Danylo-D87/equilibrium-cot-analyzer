
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { to: '/cot', label: 'COT Analyzer' },
    // Future apps go here
];

export default function TopNav() {
    const location = useLocation();

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
                {NAV_ITEMS.map((item) => {
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
        </header>
    );
}
