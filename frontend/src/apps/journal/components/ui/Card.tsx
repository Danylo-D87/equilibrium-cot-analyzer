import React from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function Card({ className, children, onClick, onMouseEnter, onMouseLeave }: CardProps) {
    return (
        <div
            className={cn(
                'journal-card border border-white/[0.06] transition-all duration-500 rounded-[20px]',
                className,
            )}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
    return <h3 className={cn('text-[10px] font-sans font-medium tracking-[0.25em] text-white/[0.45] uppercase', className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('p-5 pt-0', className)}>{children}</div>;
}
