import { useEffect, type RefObject } from 'react';

/**
 * Hook that fires callback when clicking outside the referenced element.
 */
export function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    callback: () => void,
    enabled = true,
): void {
    useEffect(() => {
        if (!enabled) return;

        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, callback, enabled]);
}
