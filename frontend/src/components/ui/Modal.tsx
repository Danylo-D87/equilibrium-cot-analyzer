import React, { useEffect, useRef } from 'react';
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
 * Accessibility:
 *  - role="dialog" + aria-modal="true"
 *  - Body scroll lock while open
 *  - Focus trap (Tab cycles within modal)
 *  - Escape key closes
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

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({
    isOpen,
    onClose,
    size = 'lg',
    className,
    children,
    backdropBlur = 'sm',
}: ModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEscapeKey(onClose, isOpen);

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
        if (!isOpen) return;
        const el = containerRef.current;
        if (!el) return;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        el.addEventListener('keydown', handleTab);
        // Auto-focus first focusable element
        const first = el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus();

        return () => el.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={cn('absolute inset-0 bg-black/65', BLUR_MAP[backdropBlur])}
                onClick={onClose}
                aria-hidden="true"
                style={{ animation: 'modalFadeIn 0.2s ease-out' }}
            />

            {/* Container */}
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
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
