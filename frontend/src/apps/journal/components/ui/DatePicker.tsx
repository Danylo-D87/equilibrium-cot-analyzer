import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    labelClassName?: string;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
}

function fmt(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parse(str: string) {
    const [y, m, d] = str.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
}

export default function DatePicker({ label, value, onChange, placeholder, className, labelClassName }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const today = new Date();
    const parsed = value ? parse(value) : null;
    const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

    useEffect(() => {
        if (value) {
            const p = parse(value);
            setViewYear(p.year);
            setViewMonth(p.month);
        }
    }, [value]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate());

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const selectDay = (day: number) => {
        onChange(fmt(viewYear, viewMonth, day));
        setIsOpen(false);
    };

    const displayValue = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

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
                    'w-full h-9 px-3 flex items-center justify-between text-[12px] transition-all duration-300 border rounded-[12px] outline-none',
                    'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]',
                    isOpen && 'border-white/[0.15]',
                    displayValue ? 'text-white/[0.80]' : 'text-white/[0.25]',
                )}
            >
                <span className="truncate font-mono">{displayValue || placeholder || 'Select date'}</span>
                <Calendar size={13} className={cn('text-white/[0.20] shrink-0 ml-2 transition-colors duration-300', isOpen && 'text-white/50')} />
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 top-full mt-1.5 w-[280px] rounded-[16px] border border-white/[0.06] p-4"
                    style={{
                        background: '#111111',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-md text-white/[0.25] hover:text-white/[0.70] hover:bg-white/[0.04] transition-all duration-200">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/[0.50]">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-md text-white/[0.25] hover:text-white/[0.70] hover:bg-white/[0.04] transition-all duration-200">
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1.5">
                        {DAYS.map((d) => (
                            <div key={d} className="text-center text-[8px] font-medium uppercase tracking-[0.12em] text-white/[0.18] py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-white/[0.04] mb-1" />

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = fmt(viewYear, viewMonth, day);
                            const isSelected = dateStr === value;
                            const isToday = dateStr === todayStr;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    className={cn(
                                        'h-8 w-full text-[11px] font-mono transition-all duration-200 relative rounded-md',
                                        isSelected
                                            ? 'text-black bg-white font-medium'
                                            : isToday
                                                ? 'text-white/[0.75] font-medium ring-1 ring-inset ring-white/20'
                                                : 'text-white/[0.40] hover:text-white/[0.80] hover:bg-white/[0.04]',
                                    )}
                                >
                                    {day}
                                    {isToday && !isSelected && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-white/60" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today button */}
                    <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <button
                            type="button"
                            onClick={() => { onChange(todayStr); setIsOpen(false); }}
                            className="w-full py-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/[0.25] hover:text-white/70 transition-colors duration-300"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
