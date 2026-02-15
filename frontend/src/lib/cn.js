import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with deduplication and conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (last-win for conflicts).
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
