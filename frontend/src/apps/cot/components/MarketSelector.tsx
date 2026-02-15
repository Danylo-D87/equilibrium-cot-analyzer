import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORY_KEYS, CATEGORY_LABELS } from '../utils/constants';
import type { Market } from '../types';

interface MarketSelectorProps {
    markets: Market[];
    selected: Market | null;
    onChange: (market: Market) => void;
}

export default function MarketSelector({ markets, selected, onChange }: MarketSelectorProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(-1);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
                setActiveIdx(-1);
                setActiveCategory(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter and group markets
    const { flat, grouped } = useMemo(() => {
        const q = query.toLowerCase().trim();
        const list = q
            ? markets.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.exchange_code?.toLowerCase().includes(q) ||
                m.code.includes(q) ||
                m.category_display?.toLowerCase().includes(q)
            )
            : markets;

        // Group by category
        const groups: Record<string, Market[]> = {};
        for (const m of list) {
            const cat = m.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(m);
        }

        // Build ordered groups
        const ordered: { category: string; display: string; markets: Market[] }[] = [];
        const flatList: Market[] = [];
        for (const cat of CATEGORY_KEYS) {
            if (groups[cat]?.length) {
                ordered.push({ category: cat, display: groups[cat][0].category_display || cat, markets: groups[cat] });
                flatList.push(...groups[cat]);
            }
        }
        // Any remaining categories
        for (const cat of Object.keys(groups)) {
            if (!CATEGORY_KEYS.includes(cat)) {
                ordered.push({ category: cat, display: cat, markets: groups[cat] });
                flatList.push(...groups[cat]);
            }
        }

        return { flat: flatList, grouped: ordered };
    }, [markets, query]);

    const handleSelect = useCallback((m: Market) => {
        onChange(m);
        setOpen(false);
        setQuery('');
        setActiveIdx(-1);
        setActiveCategory(null);
        inputRef.current?.blur();
    }, [onChange]);

    const handleInputClick = () => {
        setOpen(true);
        setQuery('');
        setActiveIdx(-1);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setOpen(true);
                setActiveIdx(0);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIdx(prev => Math.min(prev + 1, flat.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIdx(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIdx >= 0 && flat[activeIdx]) {
                    handleSelect(flat[activeIdx]);
                } else if (flat.length > 0) {
                    handleSelect(flat[0]);
                }
                break;
            case 'Escape':
                setOpen(false);
                setQuery('');
                setActiveIdx(-1);
                setActiveCategory(null);
                inputRef.current?.blur();
                break;
        }
    };

    // Scroll active item into view
    useEffect(() => {
        if (activeIdx < 0 || !listRef.current) return;
        const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    // Scroll to category when pill is clicked
    const scrollToCategory = useCallback((cat: string) => {
        setActiveCategory(cat);
        setQuery(''); // clear search to show all
        // Small delay to allow re-render after clearing query
        requestAnimationFrame(() => {
            const el = categoryRefs.current[cat];
            if (el && listRef.current) {
                // Offset for the category pills bar height (~36px)
                const listTop = listRef.current.getBoundingClientRect().top;
                const elTop = el.getBoundingClientRect().top;
                const pillBarHeight = 36;
                listRef.current.scrollTop += (elTop - listTop - pillBarHeight);
            }
        });
    }, []);

    // Track which category is visible during scroll
    useEffect(() => {
        if (!open || !listRef.current) return;
        const container = listRef.current;
        const handleScroll = () => {
            const pillBarHeight = 36;
            let closestCat: string | null = null;
            let closestDist = Infinity;
            for (const [cat, el] of Object.entries(categoryRefs.current)) {
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const dist = Math.abs(rect.top - containerRect.top - pillBarHeight);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestCat = cat;
                }
            }
            if (closestCat) setActiveCategory(closestCat);
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [open]);

    // Search icon
    const SearchIcon = () => (
        <svg className="w-3.5 h-3.5 text-[#525252]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );

    let flatIdx = -1;

    return (
        <div ref={wrapperRef} className="relative">
            {/* Input */}
            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={open ? query : (selected?.name ? selected.name.split(' - ')[0] : '')}
                    placeholder="Search market..."
                    onClick={handleInputClick}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(0); setActiveCategory(null); }}
                    onKeyDown={handleKeyDown}
                    className="
                        h-9 pl-10 pr-3
                        bg-[#0a0a0a] border rounded-sm
                        text-[12px] text-[#e5e5e5] placeholder-[#525252]
                        focus:outline-none
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    "
                    style={{
                        width: open ? '380px' : '200px',
                        borderColor: open ? '#404040' : '#262626',
                        backgroundColor: open ? '#121212' : '#0a0a0a',
                        boxShadow: open ? '0 10px 40px rgba(0,0,0,0.4)' : 'none',
                    }}
                />
                {/* Selected market exchange badge */}
                {!open && selected?.exchange_code && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-[9px] font-bold tracking-[0.15em] text-[#525252] uppercase">
                            {selected.exchange_code}
                        </span>
                    </div>
                )}
            </div>

            {/* Dropdown popover */}
            {open && (
                <div
                    className="
                        absolute top-full left-0 mt-2
                        bg-[#0a0a0a] border border-[#262626] rounded-sm
                        shadow-2xl shadow-black/70
                        max-h-[420px] overflow-hidden
                        z-50
                    "
                    style={{
                        width: '380px',
                        animation: 'popoverIn 0.18s ease-out',
                    }}
                >
                    {/* Category pills navigation */}
                    {!query && grouped.length > 1 && (
                        <div className="flex-shrink-0 border-b border-[#262626] px-2.5 py-2 flex gap-1 flex-wrap bg-[#0a0a0a]">
                            {grouped.map(g => {
                                const isActive = activeCategory === g.category;
                                return (
                                    <button
                                        key={g.category}
                                        onClick={() => scrollToCategory(g.category)}
                                        className={`
                                            px-2 py-0.5 rounded-sm text-[9px] font-semibold tracking-wider uppercase
                                            transition-all duration-200
                                            ${isActive
                                                ? 'bg-[#e5e5e5] text-black'
                                                : 'text-[#525252] hover:text-[#a3a3a3] hover:bg-[#121212] border border-[#262626]'
                                            }
                                        `}
                                    >
                                        {CATEGORY_LABELS[g.category] || g.display}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Scrollable list */}
                    <div
                        ref={listRef}
                        className="overflow-y-auto overflow-x-hidden"
                        style={{ maxHeight: !query && grouped.length > 1 ? 'calc(420px - 40px)' : '420px' }}
                    >
                        {flat.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <p className="text-[#525252] text-xs font-medium uppercase tracking-wider">No markets found</p>
                                <p className="text-[#262626] text-[10px] mt-1.5 uppercase tracking-wide">Try a different search</p>
                            </div>
                        ) : (
                            grouped.map(group => (
                                <div key={group.category}>
                                    {/* Category header */}
                                    <div
                                        ref={el => { categoryRefs.current[group.category] = el; }}
                                        className="sticky top-0 z-10 px-3.5 py-2 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#262626]/50"
                                    >
                                        <span className="text-[9px] font-bold tracking-[0.15em] text-[#525252] uppercase">
                                            {group.display}
                                        </span>
                                        <span className="text-[9px] text-[#262626] ml-2 font-medium">{group.markets.length}</span>
                                    </div>

                                    {/* Market items */}
                                    {group.markets.map(m => {
                                        flatIdx++;
                                        const idx = flatIdx;
                                        const isActive = idx === activeIdx;
                                        const isSelected = selected?.code === m.code;

                                        return (
                                            <button
                                                key={m.code}
                                                data-idx={idx}
                                                onClick={() => handleSelect(m)}
                                                className={`
                                                    w-full text-left px-3.5 py-[7px] flex items-center gap-2.5
                                                    transition-all duration-200 cursor-pointer
                                                    ${isActive
                                                        ? 'bg-[#121212]'
                                                        : 'hover:bg-[#121212]/60'
                                                    }
                                                `}
                                            >
                                                {/* Selected dot */}
                                                <div className="w-1.5 flex-shrink-0">
                                                    {isSelected && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]" />
                                                    )}
                                                </div>

                                                {/* Name */}
                                                <span className={`
                                                    text-[11.5px] truncate flex-1
                                                    ${isSelected ? 'text-white font-medium' : 'text-[#a3a3a3]'}
                                                `}>
                                                    {m.name.split(' - ')[0]}
                                                </span>

                                                {/* Exchange tag */}
                                                <span className="text-[9px] text-[#525252] flex-shrink-0 font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#0a0a0a] border border-[#262626]">
                                                    {m.exchange_code || m.exchange}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
