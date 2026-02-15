import React from 'react';

/**
 * React Error Boundary — catches render errors in children and shows
 * a fallback UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            const fallback = this.props.fallback;
            if (fallback) return fallback;

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                    <div className="text-red-400 text-lg font-semibold">Something went wrong</div>
                    <div className="text-[#525252] text-xs max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-2 px-4 py-1.5 text-xs bg-[#1a1a1a] border border-[#333] rounded hover:bg-[#252525] text-[#a3a3a3] transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
