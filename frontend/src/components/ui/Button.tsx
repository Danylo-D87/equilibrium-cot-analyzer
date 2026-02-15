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
    ghost: 'text-muted hover:text-bronze hover:bg-bronze-glow transition-all duration-300',
    outline: 'text-text-secondary border border-border-subtle hover:border-bronze/20 hover:text-bronze hover:bg-bronze-glow transition-all duration-300',
    solid: 'bg-bronze text-black font-medium hover:bg-bronze-hover transition-all duration-300',
};

const SIZE: Record<ButtonSize, string> = {
    sm: 'h-7 px-2 text-[10px] font-medium tracking-[0.12em] uppercase rounded-sm',
    md: 'h-8 px-3 text-xs font-medium rounded-sm',
    icon: 'h-7 w-7 flex items-center justify-center rounded-sm',
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
