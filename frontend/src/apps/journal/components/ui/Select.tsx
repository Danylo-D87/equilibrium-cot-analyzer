import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: (string | SelectOption)[];
    placeholder?: string;
    className?: string;
    labelClassName?: string;
}

export default function Select({ label, value, onChange, options, placeholder, className, labelClassName }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const normalizedOpts: SelectOption[] = options.map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
    );

    const selectedLabel = normalizedOpts.find((o) => o.value === value)?.label;

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
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full h-9 px-3 flex items-center justify-between text-[12px] transition-all duration-500 border rounded-md outline-none',
                    'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]',
                    isOpen && 'border-bronze/25 bg-bronze/[0.02]',
                    selectedLabel ? 'text-white/[0.80]' : 'text-white/[0.25]',
                )}
            >
                <span className="truncate">{selectedLabel || placeholder || 'Select...'}</span>
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 top-full mt-1.5 w-full max-h-52 overflow-y-auto rounded-lg border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(20,20,20,0.97), rgba(10,10,10,0.98))',
                        backdropFilter: 'blur(24px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.06) transparent',
                    }}
                >
                    {placeholder && (
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className={cn(
                                'w-full text-left px-3.5 py-2 text-[11px] text-white/[0.22] hover:bg-white/[0.03] transition-colors duration-200 rounded-sm mx-auto',
                                !value && 'text-white/[0.35]',
                            )}
                        >
                            {placeholder}
                        </button>
                    )}
                    {normalizedOpts.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={cn(
                                'w-full text-left px-3.5 py-2 text-[11px] transition-all duration-200',
                                opt.value === value
                                    ? 'text-bronze bg-bronze/[0.07]'
                                    : 'text-white/[0.55] hover:bg-white/[0.04] hover:text-white/[0.85] hover:pl-4',
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
