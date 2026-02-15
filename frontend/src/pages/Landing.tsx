
import { Link } from 'react-router-dom';

interface AppDef {
    key: string;
    name: string;
    description: string;
    to: string;
    ready: boolean;
}

const APPS: AppDef[] = [
    {
        key: 'cot',
        name: 'COT Analyzer',
        description: 'Commitments of Traders report analysis, screener, and signals.',
        to: '/cot',
        ready: true,
    },
    {
        key: 'coming',
        name: 'More Tools',
        description: 'Additional market analysis tools are on the way.',
        to: '#',
        ready: false,
    },
];

function AppCard({ app }: { app: AppDef }) {
    const content = (
        <div
            className={`group relative rounded-lg border p-6 transition-all duration-300 ${app.ready
                ? 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover cursor-pointer'
                : 'border-border-subtle bg-surface opacity-50 cursor-default'
                }`}
        >
            {/* Icon area */}
            <div
                className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 ${app.ready
                    ? 'bg-surface-highlight text-text-secondary group-hover:text-primary transition-colors duration-300'
                    : 'bg-surface-hover text-muted'
                    }`}
            >
                {app.key === 'cot' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="M7 16l4-8 4 4 4-6" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                )}
            </div>

            <h3 className="text-sm font-semibold text-primary mb-1 tracking-wide">
                {app.name}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
                {app.description}
            </p>

            {app.ready && (
                <div className="mt-4 flex items-center text-[10px] font-medium tracking-[0.08em] uppercase text-muted group-hover:text-text-secondary transition-colors duration-300">
                    Open
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
            )}

            {!app.ready && (
                <div className="mt-4 text-[10px] font-medium tracking-[0.12em] uppercase text-muted">
                    Coming soon
                </div>
            )}
        </div>
    );

    if (!app.ready) return content;
    return <Link to={app.to} className="block">{content}</Link>;
}

export default function Landing() {
    return (
        <div className="h-screen bg-background flex flex-col items-center justify-center px-6">
            {/* Brand */}
            <div className="mb-12 text-center">
                <h1 className="text-2xl font-semibold tracking-[0.12em] text-primary uppercase mb-2">
                    Equilibrium
                </h1>
                <p className="text-xs text-muted tracking-[0.08em] uppercase">
                    Market analysis toolkit
                </p>
            </div>

            {/* App cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                {APPS.map((app) => (
                    <AppCard key={app.key} app={app} />
                ))}
            </div>

            {/* Footer hint */}
            <p className="mt-16 text-[10px] text-muted tracking-[0.1em] uppercase">
                Select an application to begin
            </p>
        </div>
    );
}
