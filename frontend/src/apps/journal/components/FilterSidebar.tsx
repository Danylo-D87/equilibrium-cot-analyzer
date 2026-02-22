import { useState } from 'react';
import { DollarSign, Percent, Settings, Calendar, Briefcase } from 'lucide-react';
import { useJournalStore } from '../store/useJournalStore';
import { usePortfolios } from '../hooks/useJournalQueries';
import DatePicker from './ui/DatePicker';
import { getTodayKyiv, getNowKyiv, formatDateLocal } from '../utils/constants';

interface FilterSidebarProps {
    onAddTradeClick: () => void;
}

export default function FilterSidebar({ onAddTradeClick }: FilterSidebarProps) {
    const {
        displayMode, toggleDisplayMode,
        activeTab, setActiveTab,
        filters, setFilters, clearFilters,
        setSettingsOpen,
    } = useJournalStore();

    const { data: portfolios = [] } = usePortfolios();
    const activePortfolios = portfolios.filter(p => p.is_active);

    const [showCustomDates, setShowCustomDates] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>('all');

    // ── Date presets ──
    const getDatePresets = () => {
        const today = getNowKyiv();
        const year = today.getFullYear();
        const month = today.getMonth();
        const date = today.getDate();
        const day = today.getDay();

        const monday = new Date(today);
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(date + diff);

        const monthStart = new Date(year, month, 1);
        const quarter = Math.floor(month / 3);
        const quarterStart = new Date(year, quarter * 3, 1);
        const yearStart = new Date(year, 0, 1);

        return {
            week: formatDateLocal(monday),
            month: formatDateLocal(monthStart),
            quarter: formatDateLocal(quarterStart),
            year: formatDateLocal(yearStart),
            today: getTodayKyiv(),
        };
    };

    const applyDatePreset = (preset: string) => {
        if (preset === 'all') {
            clearDateFilter();
            setActivePreset('all');
            return;
        }
        const presets = getDatePresets();
        setFilters(prev => ({
            ...prev,
            date_from: presets[preset as keyof typeof presets],
            date_to: presets.today,
        }));
        setActivePreset(preset);
        setShowCustomDates(false);
    };

    const clearDateFilter = () => {
        setFilters(prev => {
            const { date_from, date_to, ...rest } = prev;
            void date_from;
            void date_to;
            return rest;
        });
        setActivePreset('all');
        setShowCustomDates(false);
    };

    const toggleFilter = (category: 'type' | 'style' | 'portfolio_id', value: string) => {
        setFilters(prev => {
            const current = (prev[category] as string[] | undefined) || [];
            const isSelected = current.includes(value);
            return {
                ...prev,
                [category]: isSelected ? current.filter(v => v !== value) : [...current, value],
            };
        });
    };

    const isSelected = (category: string, value: string) => {
        const arr = (filters as Record<string, string[] | string | undefined>)[category];
        if (Array.isArray(arr)) return arr.includes(value);
        return false;
    };

    const isAllPortfoliosSelected = () => {
        return !filters.portfolio_id || filters.portfolio_id.length === 0;
    };

    const handleAllPortfoliosClick = () => {
        setFilters(prev => {
            const { portfolio_id, ...rest } = prev;
            void portfolio_id;
            return rest;
        });
    };

    const hasActiveFilters = Object.keys(filters).length > 0 &&
        Object.values(filters).some(val =>
            Array.isArray(val) ? val.length > 0 : val !== undefined && val !== '',
        );

    const types = ['Futures', 'Option', 'Crypto'];
    const styles = ['Swing', 'Intraday', 'Smart Idea'];
    const presetBtns = [
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'quarter', label: 'Quarter' },
        { key: 'year', label: 'Year' },
        { key: 'all', label: 'All Time' },
    ];
    const tabBtns: { key: 'live' | 'main' | 'trades'; label: string }[] = [
        { key: 'live', label: 'Live' },
        { key: 'main', label: 'Metrics' },
        { key: 'trades', label: 'Trades' },
    ];

    const pillActive = 'text-white/[0.55] [background:rgba(196,168,124,0.03)] [border-color:rgba(196,168,124,0.12)]';
    const pillInactive = 'bg-transparent text-white/[0.22] [border-color:rgba(255,255,255,0.04)] hover:[border-color:rgba(255,255,255,0.08)] hover:text-white/[0.42]';
    const pillClass = 'px-2 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] transition-all duration-300 border outline-none focus:outline-none';

    return (
        <div className="w-72 bg-transparent flex flex-col h-full z-40 relative">
            {/* Sidebar header */}
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-white/[0.04] shrink-0">
                {/* Display Mode Toggle - compact, left side */}
                <div className="flex items-center gap-0.5 bg-white/[0.02] p-0.5 border border-white/[0.05]">
                    <button
                        onClick={toggleDisplayMode}
                        className={`flex items-center justify-center w-7 h-6 text-[8px] font-medium uppercase tracking-wider transition-all duration-300 ${
                            displayMode === 'currency' ? 'bg-bronze/[0.08] text-bronze' : 'bg-transparent text-white/[0.22] hover:text-white/[0.48]'
                        }`}
                        title="Currency mode"
                    >
                        <DollarSign size={9} />
                    </button>
                    <button
                        onClick={toggleDisplayMode}
                        className={`flex items-center justify-center w-7 h-6 text-[8px] font-medium uppercase tracking-wider transition-all duration-300 ${
                            displayMode === 'percentage' ? 'bg-bronze/[0.08] text-bronze' : 'bg-transparent text-white/[0.22] hover:text-white/[0.48]'
                        }`}
                        title="Percentage mode"
                    >
                        <Percent size={9} />
                    </button>
                </div>
                {/* Settings */}
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center justify-center w-7 h-7 border border-white/[0.05] text-white/[0.22] hover:text-bronze/60 hover:border-bronze/20 hover:bg-bronze/[0.03] transition-all duration-500"
                    title="Settings"
                >
                    <Settings size={12} strokeWidth={1} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                {/* Tab Navigation */}
                <div className="space-y-1">
                    {tabBtns.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`w-full text-center py-2.5 px-2 text-[9px] font-medium uppercase tracking-[0.18em] transition-all duration-300 border outline-none focus:outline-none ${
                                activeTab === t.key ? pillActive : pillInactive
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Filters Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                    <h3 className="text-[8px] font-sans tracking-[0.30em] text-bronze/35 uppercase">Filters</h3>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-[9px] text-white/[0.28] hover:text-bronze/60 transition-colors uppercase tracking-wider font-medium">
                            Reset
                        </button>
                    )}
                </div>

                {/* Portfolio Filter */}
                {activePortfolios.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[9px] font-sans tracking-[0.2em] text-white/[0.30] uppercase flex items-center gap-2">
                            <Briefcase size={11} className="text-bronze/40" />
                            Portfolio
                        </label>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleAllPortfoliosClick}
                                className={`${pillClass} text-left ${isAllPortfoliosSelected() ? pillActive : pillInactive}`}
                            >
                                ALL
                            </button>
                            {activePortfolios.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleFilter('portfolio_id', p.id)}
                                    className={`${pillClass} text-left ${isSelected('portfolio_id', p.id) ? pillActive : pillInactive}`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Type & Style */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-[9px] font-sans tracking-[0.2em] text-white/[0.30] uppercase block">Type</label>
                        <div className="flex flex-col gap-2">
                            {types.map(t => (
                                <button key={t} onClick={() => toggleFilter('type', t)} className={`${pillClass} ${isSelected('type', t) ? pillActive : pillInactive}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-sans tracking-[0.2em] text-white/[0.30] uppercase block">Class</label>
                        <div className="flex flex-col gap-2">
                            {styles.map(s => (
                                <button key={s} onClick={() => toggleFilter('style', s)} className={`${pillClass} ${isSelected('style', s) ? pillActive : pillInactive}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-sans tracking-[0.2em] text-white/[0.30] uppercase block">Date Range</label>
                        {(filters.date_from || filters.date_to) && (
                            <button onClick={clearDateFilter} className="text-[9px] text-white/[0.28] hover:text-bronze/60 transition-colors uppercase tracking-wider font-medium">
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {presetBtns.map(p => (
                            <button
                                key={p.key}
                                onClick={() => applyDatePreset(p.key)}
                                className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border ${activePreset === p.key ? pillActive : pillInactive
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowCustomDates(!showCustomDates)}
                        className="flex items-center gap-2 text-[10px] text-white/[0.28] hover:text-bronze/60 transition-colors uppercase tracking-wider font-medium"
                    >
                        <Calendar size={11} className="text-bronze/40" />
                        <span>Custom Range</span>
                    </button>

                    {showCustomDates && (
                        <div className="space-y-4 pt-2">
                            <DatePicker
                                label="From"
                                value={filters.date_from || ''}
                                onChange={(date) => {
                                    setFilters(prev => ({ ...prev, date_from: date }));
                                    setActivePreset(null);
                                }}
                                placeholder="Select start date"
                            />
                            <DatePicker
                                label="To"
                                value={filters.date_to || ''}
                                onChange={(date) => {
                                    setFilters(prev => ({ ...prev, date_to: date }));
                                    setActivePreset(null);
                                }}
                                placeholder="Select end date"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* New Entry Button */}
            <div className="p-4 border-t border-white/[0.04] relative">
                <button
                    onClick={onAddTradeClick}
                    className="w-full py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border outline-none focus:outline-none text-white/[0.55] [background:rgba(196,168,124,0.03)] [border-color:rgba(196,168,124,0.12)] hover:[border-color:rgba(196,168,124,0.18)] hover:text-white/[0.68]"
                >
                    + New Entry
                </button>
            </div>
        </div>
    );
}
