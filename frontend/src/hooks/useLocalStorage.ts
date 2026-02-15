import { useState, useCallback } from 'react';

/**
 * Type-safe localStorage hook with error handling.
 * Works safely in private browsing / restricted environments.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? (JSON.parse(item) as T) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setStoredValue(prev => {
                const next = value instanceof Function ? value(prev) : value;
                try {
                    localStorage.setItem(key, JSON.stringify(next));
                } catch {
                    // Silently fail (quota exceeded, private browsing, etc.)
                }
                return next;
            });
        },
        [key],
    );

    return [storedValue, setValue];
}

/**
 * Simple string variant (no JSON.parse/stringify).
 */
export function useLocalStorageString(key: string, initialValue: string): [string, (value: string) => void] {
    const [storedValue, setStoredValue] = useState<string>(() => {
        try {
            return localStorage.getItem(key) ?? initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: string) => {
            setStoredValue(value);
            try {
                localStorage.setItem(key, value);
            } catch {
                // Silently fail
            }
        },
        [key],
    );

    return [storedValue, setValue];
}
