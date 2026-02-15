

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
                className="animate-spin rounded-full border-t border-b border-bronze/60"
                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
            />
            {message && <span className="text-muted text-xs tracking-[0.12em] uppercase">{message}</span>}
        </div>
    );
}
