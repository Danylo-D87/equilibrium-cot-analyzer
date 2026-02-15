
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { to: '/cot', label: 'COT Analyzer' },
    // Future apps go here
];

export default function TopNav() {
    const location = useLocation();

    return (
        <header className="flex-shrink-0 h-11 border-b border-border flex items-center px-5 bg-surface">
            {/* Brand — always links home */}
            <Link
                to="/"
                className="flex items-baseline gap-1.5 flex-shrink-0 select-none mr-6 group"
            >
                <span className="text-[13px] font-semibold tracking-[0.08em] text-primary uppercase group-hover:text-primary-hover transition-colors duration-200">
                    Equilibrium
                </span>
            </Link>

            {/* App navigation */}
            <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase transition-colors duration-200 rounded-sm ${isActive
                                    ? 'text-primary bg-surface-highlight'
                                    : 'text-muted hover:text-text-secondary'
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
