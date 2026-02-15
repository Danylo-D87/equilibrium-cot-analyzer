import React from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { cn } from '@/lib/cn';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type BackdropBlur = 'sm' | 'md';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    size?: ModalSize;
    className?: string;
    children: React.ReactNode;
    backdropBlur?: BackdropBlur;
}

interface ModalHeaderProps {
    title: string;
    onClose?: () => void;
    children?: React.ReactNode;
}

/**
 * Shared modal shell — backdrop + centered container + optional close button.
 *
 * Props:
 *  - isOpen: boolean — controls visibility
 *  - onClose: () => void — called on Escape key and backdrop click
 *  - size: 'sm' | 'md' | 'lg' | 'xl' | 'full' — predefined sizes
 *  - className: string — extra classes for the container
 *  - children: ReactNode
 *  - backdropBlur: 'sm' | 'md' — backdrop blur intensity (default: 'sm')
 */

const SIZE_MAP: Record<ModalSize, string> = {
    sm: 'w-[90vw] max-w-[480px] max-h-[60vh]',
    md: 'w-[90vw] max-w-[640px] max-h-[75vh]',
    lg: 'w-[90vw] max-w-[1100px] h-[85vh]',
    xl: 'w-[96vw] max-w-[1600px] h-[90vh]',
    full: 'w-[98vw] h-[95vh]',
};

const BLUR_MAP: Record<BackdropBlur, string> = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
};

export default function Modal({
    isOpen,
    onClose,
    size = 'lg',
    className,
    children,
    backdropBlur = 'sm',
}: ModalProps) {
    useEscapeKey(onClose, isOpen);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={cn('absolute inset-0 bg-black/65', BLUR_MAP[backdropBlur])}
                onClick={onClose}
                style={{ animation: 'modalFadeIn 0.2s ease-out' }}
            />

            {/* Container */}
            <div
                className={cn(
                    'relative bg-surface border border-border rounded-sm shadow-2xl flex flex-col overflow-hidden',
                    SIZE_MAP[size],
                    className,
                )}
                style={{ animation: 'modalSlideIn 0.25s ease-out' }}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

/**
 * Standard modal header with title and close button.
 */
export function ModalHeader({ title, onClose, children }: ModalHeaderProps) {
    return (
        <header className="flex-shrink-0 h-10 border-b border-border flex items-center justify-between px-4 bg-surface">
            <span className="text-xs font-medium tracking-wider uppercase text-text-secondary">
                {title}
            </span>
            <div className="flex items-center gap-2">
                {children}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm text-muted hover:text-white hover:bg-surface-hover border border-transparent hover:border-border transition-all duration-200"
                        title="Close (Esc)"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M1 1l12 12M13 1L1 13" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}
