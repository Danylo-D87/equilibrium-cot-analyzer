import { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/cn';
import { useTrades } from '../../hooks/useJournalQueries';

interface PairSelectorProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    existingPairs?: string[];
    placeholder?: string;
    className?: string;
    labelClassName?: string;
}

export default function PairSelector({
    label,
    value,
    onChange,
    existingPairs: _existingPairs,
    placeholder = 'BTC/USD',
    className,
    labelClassName,
}: PairSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch user's traded pairs
    const { data: trades = [] } = useTrades();
    const userPairs = Array.from(new Set(
        trades.map((t) => t.pair?.toUpperCase()).filter(Boolean) as string[],
    )).sort();

    // Filter based on current input
    const filtered = value
        ? userPairs.filter((p) => p.includes(value.toUpperCase()))
        : userPairs;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className={cn('relative space-y-1.5', className)}>
            {label && (
                <label className={cn('block text-[9px] font-medium uppercase tracking-[0.2em] text-white/[0.28] pl-0.5', labelClassName)}>
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value.toUpperCase());
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.06] rounded-md text-[12px] text-white/[0.80] placeholder:text-white/[0.18] focus:outline-none focus:border-bronze/25 focus:bg-bronze/[0.02] hover:border-white/[0.12] transition-all duration-500 font-mono uppercase"
                />
            </div>
            {isOpen && filtered.length > 0 && (
                <div
                    className="absolute z-50 top-full mt-1.5 w-full max-h-52 overflow-y-auto rounded-lg border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(20,20,20,0.97), rgba(10,10,10,0.98))',
                        backdropFilter: 'blur(24px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.06) transparent',
                    }}
                >
                    {filtered.map((pair) => (
                        <button
                            key={pair}
                            type="button"
                            onClick={() => {
                                onChange(pair);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'w-full text-left px-3.5 py-2 text-[11px] font-mono uppercase transition-all duration-200',
                                pair === value
                                    ? 'text-bronze bg-bronze/[0.07]'
                                    : 'text-white/[0.55] hover:bg-white/[0.04] hover:text-white/[0.85] hover:pl-4',
                            )}
                        >
                            {pair}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
