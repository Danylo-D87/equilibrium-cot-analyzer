

interface SpinnerProps {
    size?: number;
    message?: string;
}

/**
 * A simple centered loading spinner with optional message.
 */
export default function Spinner({ size = 6, message }: SpinnerProps) {
    return (
        <div className="flex items-center justify-center gap-3">
            <div
                className="animate-spin rounded-full border-t border-b border-white/30"
                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
            />
            {message && <span className="text-white/40 text-xs tracking-[0.1em] uppercase">{message}</span>}
        </div>
    );
}
