import { useState, useEffect, useRef } from 'react';

/**
 * Parses a formatted value string like "$1,234.56", "-45.2%", "2.50" etc.
 * Returns { prefix, number, suffix } or null if not parseable.
 */
function parseFormattedValue(val: string) {
    const m = val.match(/^([^0-9\-]*)([-]?\d[\d,]*\.?\d*)\s*(%?)(.*)$/);
    if (!m) return null;
    const prefix = m[1];
    const num = parseFloat(m[2].replace(/,/g, ''));
    const suffix = m[3] + m[4];
    if (isNaN(num)) return null;
    return { prefix, num, suffix };
}

/**
 * Rebuilds a formatted string preserving the original format (commas, decimals).
 */
function formatLike(original: string, num: number): string {
    const parsed = parseFormattedValue(original);
    if (!parsed) return original;

    // Detect decimal places from original
    const numStr = original.replace(/[^0-9.\-]/g, '');
    const dotIdx = numStr.indexOf('.');
    const decimals = dotIdx >= 0 ? numStr.length - dotIdx - 1 : 0;

    // Format number
    const abs = Math.abs(num);
    const fixed = abs.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');

    // Add commas
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Handle negative: check if prefix contains `-` or `−` pattern like `-$`
    const isNeg = num < 0;
    let prefix = parsed.prefix;

    // If original had negative sign before prefix like -$
    if (isNeg && !prefix.includes('-')) {
        prefix = '-' + prefix;
    } else if (!isNeg) {
        prefix = prefix.replace(/^-/, '');
    }

    return `${prefix}${withCommas}${decPart !== undefined ? '.' + decPart : ''}${parsed.suffix}`;
}

const DURATION = 600; // ms

function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
}

/**
 * Hook that animates between formatted value strings.
 * Returns the current display string with smooth number transition.
 */
export function useAnimatedValue(targetValue: string): string {
    const [display, setDisplay] = useState(targetValue);
    const prevParsed = useRef<{ num: number } | null>(null);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const target = parseFormattedValue(targetValue);

        // If not parseable, just set it immediately
        if (!target) {
            prevParsed.current = null;
            setDisplay(targetValue);
            return;
        }

        const from = prevParsed.current?.num ?? target.num;
        const to = target.num;

        // If same value, skip animation
        if (from === to) {
            prevParsed.current = { num: to };
            setDisplay(targetValue);
            return;
        }

        // Cancel any running animation
        if (rafId.current) cancelAnimationFrame(rafId.current);

        const start = performance.now();
        const diff = to - from;

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / DURATION, 1);
            const eased = easeOutQuart(progress);
            const current = from + diff * eased;

            setDisplay(formatLike(targetValue, current));

            if (progress < 1) {
                rafId.current = requestAnimationFrame(tick);
            } else {
                prevParsed.current = { num: to };
                setDisplay(targetValue); // ensure exact final value
            }
        };

        rafId.current = requestAnimationFrame(tick);

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [targetValue]);

    return display;
}
