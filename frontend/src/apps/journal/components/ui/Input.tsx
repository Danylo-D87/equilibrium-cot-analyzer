import React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[9px] font-medium uppercase tracking-[0.2em] text-white/[0.28] pl-0.5">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    'w-full h-9 px-3 bg-white/[0.03] border border-white/[0.06] rounded-[12px] text-[12px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] hover:border-white/[0.12] transition-all duration-300 font-mono',
                    className,
                )}
                {...props}
            />
        </div>
    );
}
