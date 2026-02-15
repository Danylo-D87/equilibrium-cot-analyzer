

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
                className={`animate-spin rounded-full border-t-2 border-b-2 border-[#e5e5e5]`}
                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
            />
            {message && <span className="text-[#525252] text-xs">{message}</span>}
        </div>
    );
}
