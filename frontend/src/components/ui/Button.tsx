import React from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'ghost' | 'outline' | 'solid';
type ButtonSize = 'sm' | 'md' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    children?: React.ReactNode;
}

/**
 * Shared Button component with variant + size system.
 *
 * Variants: ghost (no bg), outline (border), solid (filled)
 * Sizes: sm, md, icon
 */

const VARIANT: Record<ButtonVariant, string> = {
    ghost: 'text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-300',
    outline: 'text-white/60 border border-white/[0.06] hover:border-white/[0.12] hover:text-white hover:bg-white/[0.04] transition-all duration-300',
    solid: 'bg-white text-black font-medium hover:bg-white/90 transition-all duration-300',
};

const SIZE: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-[11px] font-medium tracking-[0.08em] uppercase rounded-full',
    md: 'h-9 px-4 text-xs font-medium rounded-full',
    icon: 'h-8 w-8 flex items-center justify-center rounded-full',
};

export default function Button({
    variant = 'ghost',
    size = 'md',
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(VARIANT[variant], SIZE[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
