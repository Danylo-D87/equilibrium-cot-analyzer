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
                    'w-full h-9 px-3 bg-white/[0.02] border border-white/[0.06] rounded-md text-[12px] text-white/[0.80] placeholder:text-white/[0.18] focus:outline-none focus:border-bronze/25 focus:bg-bronze/[0.02] hover:border-white/[0.12] transition-all duration-500 font-mono',
                    className,
                )}
                {...props}
            />
        </div>
    );
}
