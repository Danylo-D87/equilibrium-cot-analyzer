import { useEffect } from 'react';

/**
 * Hook that calls `onEscape` when Escape key is pressed.
 * Only active when `enabled` is true.
 *
 * @param {function} onEscape - callback to run on Escape
 * @param {boolean} enabled  - whether the hook is active
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onEscape();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onEscape, enabled]);
}
