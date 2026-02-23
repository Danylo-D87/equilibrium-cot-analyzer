/**
 * AdminPanel — main admin interface.
 * Tabs: Statistics | Users
 * Design mirrors the main Landing page aesthetic (dark, monochrome, clean minimalism).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsTab from './tabs/StatsTab';
import UsersTab from './tabs/UsersTab';

type Tab = 'stats' | 'users';

const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Statistics' },
    { key: 'users', label: 'Users' },
];

export default function AdminPanel() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('stats');

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* ── Top nav ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050505]/90 backdrop-blur-sm">
                <div className="px-6 md:px-10 h-[72px] flex items-center justify-between">
                    {/* Logo / back */}
                    <div className="flex items-center gap-5">
                        <Link
                            to="/"
                            className="text-[11px] font-sans tracking-[0.2em] text-white/25 hover:text-white/50 uppercase transition-colors duration-400"
                        >
                            ← Equilibrium
                        </Link>
                        <div className="w-px h-4 bg-white/[0.06]" />
                        <span className="text-[11px] font-sans tracking-[0.2em] text-white/40 uppercase">
                            Admin Panel
                        </span>
                    </div>

                    {/* User + logout */}
                    <div className="flex items-center gap-5">
                        {user && (
                            <span className="hidden md:block text-[9px] font-sans tracking-[0.15em] text-white/20 uppercase">
                                {user.email}
                            </span>
                        )}
                        <button
                            onClick={() => logout()}
                            className="text-[9px] font-sans tracking-[0.18em] text-white/25 hover:text-white/50 uppercase transition-colors duration-400"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Content ── */}
            <div className="pt-[72px] px-6 md:px-10 py-12 max-w-[1200px] mx-auto">
                {/* Page header */}
                <div className="mb-10">
                    <h1 className="font-sans text-[clamp(1.6rem,3vw,2.8rem)] font-light tracking-[0.04em] text-white/[0.85]">
                        Administration
                    </h1>
                    <p className="mt-2 text-[11px] font-sans tracking-[0.15em] text-white/25 uppercase">
                        Platform management and analytics
                    </p>
                </div>

                {/* Tab bar */}
                <div className="flex items-end gap-0 border-b border-white/[0.04] mb-8">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-6 py-3 text-[9px] font-sans tracking-[0.22em] uppercase transition-all duration-300 ${activeTab === tab.key
                                ? 'text-white'
                                : 'text-white/25 hover:text-white/45'
                                }`}
                        >
                            {tab.label}
                            {/* Active indicator */}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/60" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div>
                    {activeTab === 'stats' && <StatsTab />}
                    {activeTab === 'users' && <UsersTab />}
                </div>
            </div>
        </div>
    );
}
