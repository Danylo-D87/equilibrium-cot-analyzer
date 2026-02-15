import React from 'react';

/* =====================================================
   Shared documentation helper components
   ===================================================== */

export type TagColor = 'emerald' | 'red' | 'amber' | 'blue' | 'gray' | 'green' | 'purple';

export function Formula({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-3 px-4 py-3 bg-surface border border-border rounded-sm font-mono text-[11.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">
            {children}
        </div>
    );
}

export function Tag({ color = 'emerald', children }: { color?: TagColor; children: React.ReactNode }) {
    const colors: Record<TagColor, string> = {
        emerald: 'bg-white/5 text-text-primary border-border',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        blue: 'bg-white/[0.04] text-text-secondary border-border',
        gray: 'bg-surface text-muted border-border',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return (
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${colors[color]}`}>
            {children}
        </span>
    );
}

export function Note({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 px-4 py-3 bg-surface border-l-2 border-border-hover rounded-r-sm text-[11.5px] text-text-secondary leading-relaxed">
            <span className="text-text-primary font-semibold mr-1.5">📌</span>
            {children}
        </div>
    );
}

export function InfoTable({ rows }: { rows: [string, string][] }) {
    return (
        <div className="my-4 space-y-2 text-[11.5px]">
            {rows.map((r, i) => (
                <div key={i} className="flex gap-3">
                    <span className="text-muted min-w-[140px] flex-shrink-0">{r[0]}</span>
                    <span className="text-text-primary">{r[1]}</span>
                </div>
            ))}
        </div>
    );
}

export function ParticipantCard({ name, tag, tagColor, description }: { name: string; tag: string; tagColor: TagColor; description: string }) {
    return (
        <div className="px-4 py-3 bg-white/[0.02] border border-border rounded-sm mb-3">
            <div className="flex items-center gap-2 mb-2">
                <Tag color={tagColor}>{tag}</Tag>
                <span className="text-text-primary font-semibold text-[12px]">{name}</span>
            </div>
            <div className="text-[11.5px] text-text-secondary leading-relaxed">{description}</div>
        </div>
    );
}

/** Bilingual helper — picks UA or EN string based on lang */
export function L(lang: string, ua: string, en: string): string {
    return lang === 'ua' ? ua : en;
}
