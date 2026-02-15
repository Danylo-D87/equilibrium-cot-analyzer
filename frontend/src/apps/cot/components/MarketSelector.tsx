import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CATEGORY_KEYS, CATEGORY_LABELS } from '../utils/constants';
import { useClickOutside } from '@/hooks/useClickOutside';
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
    const closeDropdown = useCallback(() => {
        setOpen(false);
        setQuery('');
        setActiveIdx(-1);
        setActiveCategory(null);
    }, []);
    useClickOutside(wrapperRef, closeDropdown, open);

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
        <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                    className="h-9 pl-10 pr-3 rounded-sm text-[12px] text-primary placeholder-muted focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        width: open ? '380px' : '200px',
                        borderColor: open ? 'rgba(196,168,124,0.30)' : 'rgba(255,255,255,0.06)',
                        border: open ? '1px solid rgba(196,168,124,0.30)' : '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: open ? '#0e0d0a' : 'rgba(255,255,255,0.03)',
                        boxShadow: open ? '0 0 0 1px rgba(196,168,124,0.08), 0 10px 40px rgba(0,0,0,0.5)' : 'none',
                    }}
                />
                {/* Selected market exchange badge */}
                {!open && selected?.exchange_code && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="text-[9px] font-bold tracking-[0.15em] text-muted uppercase">
                            {selected.exchange_code}
                        </span>
                    </div>
                )}
            </div>

            {/* Dropdown popover */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 6,
                        width: 380,
                        maxHeight: 420,
                        overflow: 'hidden',
                        zIndex: 50,
                        borderRadius: 3,
                        background: '#0a0a08',
                        border: '1px solid rgba(196,168,124,0.12)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(196,168,124,0.03)',
                        animation: 'popoverIn 0.18s ease-out',
                    }}
                >
                    {/* Category pills navigation */}
                    {!query && grouped.length > 1 && (
                        <div
                            className="flex-shrink-0 px-3 py-2 flex gap-1 flex-wrap"
                            style={{ background: 'linear-gradient(180deg, rgba(196,168,124,0.04) 0%, rgba(196,168,124,0.01) 100%)', borderBottom: '1px solid rgba(196,168,124,0.06)' }}
                        >
                            {grouped.map(g => {
                                const isActive = activeCategory === g.category;
                                return (
                                    <button
                                        key={g.category}
                                        onClick={() => scrollToCategory(g.category)}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: 2,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase' as const,
                                            background: isActive ? 'rgba(196,168,124,0.12)' : 'transparent',
                                            color: isActive ? '#c4a87c' : 'rgba(255,255,255,0.30)',
                                            border: isActive ? '1px solid rgba(196,168,124,0.18)' : '1px solid transparent',
                                            transition: 'all 0.3s',
                                        }}
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
                        style={{ maxHeight: !query && grouped.length > 1 ? 'calc(420px - 40px)' : '420px', background: '#0a0a08' }}
                    >
                        {flat.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}>No markets found</p>
                                <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10, marginTop: 6, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Try a different search</p>
                            </div>
                        ) : (
                            grouped.map(group => (
                                <div key={group.category}>
                                    {/* Category header */}
                                    <div
                                        ref={el => { categoryRefs.current[group.category] = el; }}
                                        className="sticky top-0 z-10"
                                        style={{
                                            padding: '8px 14px',
                                            background: '#0c0b09',
                                            borderBottom: '1px solid rgba(196,168,124,0.05)',
                                        }}
                                    >
                                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(196,168,124,0.50)', textTransform: 'uppercase' }}>
                                            {group.display}
                                        </span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginLeft: 8, fontWeight: 500 }}>{group.markets.length}</span>
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
                                                className="w-full text-left flex items-center gap-2.5 cursor-pointer transition-all duration-200"
                                                style={{
                                                    padding: '7px 14px',
                                                    background: isActive
                                                        ? 'rgba(196,168,124,0.06)'
                                                        : isSelected
                                                            ? 'rgba(196,168,124,0.03)'
                                                            : 'transparent',
                                                    borderLeft: isSelected ? '2px solid rgba(196,168,124,0.40)' : '2px solid transparent',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(196,168,124,0.04)';
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLElement).style.background = isActive
                                                        ? 'rgba(196,168,124,0.06)'
                                                        : isSelected ? 'rgba(196,168,124,0.03)' : 'transparent';
                                                }}
                                            >
                                                {/* Selected indicator */}
                                                <div style={{ width: 5, flexShrink: 0 }}>
                                                    {isSelected && (
                                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4a87c' }} />
                                                    )}
                                                </div>

                                                {/* Name */}
                                                <span style={{
                                                    fontSize: 11.5,
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    color: isSelected ? '#c4a87c' : 'rgba(255,255,255,0.55)',
                                                    fontWeight: isSelected ? 500 : 400,
                                                }}>
                                                    {m.name.split(' - ')[0]}
                                                </span>

                                                {/* Exchange tag */}
                                                <span style={{
                                                    fontSize: 8,
                                                    flexShrink: 0,
                                                    fontWeight: 700,
                                                    letterSpacing: '0.16em',
                                                    textTransform: 'uppercase',
                                                    color: 'rgba(255,255,255,0.18)',
                                                    padding: '2px 6px',
                                                    borderRadius: 2,
                                                    background: 'rgba(196,168,124,0.03)',
                                                    border: '1px solid rgba(196,168,124,0.06)',
                                                }}>
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
