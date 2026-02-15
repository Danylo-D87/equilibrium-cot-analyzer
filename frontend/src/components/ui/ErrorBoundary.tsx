import React from 'react';

interface ErrorBoundaryProps {
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    resetKey: number;
}

/**
 * React Error Boundary — catches render errors in children and shows
 * a fallback UI instead of a blank white screen.
 *
 * Uses a resetKey to force remount children on retry, ensuring
 * persistent errors don't immediately re-trigger.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, resetKey: 0 };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            const fallback = this.props.fallback;
            if (fallback) return fallback;

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                    <div className="text-red-400 text-lg font-semibold">Something went wrong</div>
                    <div className="text-muted text-xs max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </div>
                    <button
                        onClick={() => this.setState(prev => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }))}
                        className="mt-2 px-4 py-1.5 text-xs bg-border-subtle border border-border rounded hover:bg-surface-hover text-text-secondary transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
    }
}
