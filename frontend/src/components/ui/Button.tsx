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
    ghost: 'text-muted hover:text-primary hover:bg-surface-hover transition-colors duration-200',
    outline: 'text-text-secondary border border-border hover:border-border-hover hover:text-primary hover:bg-surface-hover transition-all duration-200',
    solid: 'bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200',
};

const SIZE: Record<ButtonSize, string> = {
    sm: 'h-7 px-2 text-[10px] font-medium tracking-wider uppercase rounded-sm',
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
