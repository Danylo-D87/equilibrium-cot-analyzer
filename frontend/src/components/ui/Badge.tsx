import React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'destructive' | 'warning' | 'muted' | 'blue' | 'purple';

interface BadgeProps {
    variant?: BadgeVariant;
    className?: string;
    children: React.ReactNode;
}

/**
 * Badge component — small label with semantic variants.
 */

const VARIANT: Record<BadgeVariant, string> = {
    default: 'bg-white/[0.05] text-white/80 border-white/[0.06]',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    muted: 'bg-white/[0.03] text-white/40 border-white/[0.04]',
    blue: 'bg-white/[0.04] text-white/60 border-white/[0.06]',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function Badge({ variant = 'default', className, children }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full border uppercase tracking-[0.1em]',
                VARIANT[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
