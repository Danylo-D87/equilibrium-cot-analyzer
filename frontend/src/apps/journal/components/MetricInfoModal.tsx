import { X } from 'lucide-react';
import { useJournalStore } from '../store/useJournalStore';
import { translations, createT, LangKey } from '../i18n/translations';

interface MetricInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    formula?: string;
    interpretation?: string[];
    children?: React.ReactNode;
}

export default function MetricInfoModal({ isOpen, onClose, title, description, formula, interpretation, children }: MetricInfoModalProps) {
    const language = useJournalStore(s => s.language) as LangKey;
    const t = createT(language);

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 bottom-0 left-0 right-[300px] z-[60] flex items-center justify-center journal-modal-overlay">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative journal-modal-panel max-w-4xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-white/[0.04] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-[5px] h-[5px] rounded-full bg-white/30" />
                        <h3 className="text-[9px] font-sans font-medium uppercase tracking-[0.28em] text-white/[0.40]">{title}</h3>
                    </div>
                    <button onClick={onClose} className="flex items-center justify-center p-2 transition-all duration-300 border rounded-full outline-none focus:outline-none text-white/[0.55] border-white/[0.06] hover:border-white/[0.15] hover:text-white/[0.80] hover:bg-white/[0.04]">
                        <X size={14} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Chart */}
                    {children && (
                        <div className="bg-white/[0.015] border border-white/[0.05] p-4">
                            {children}
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <div className="bg-white/[0.015] border border-white/[0.05] p-5">
                            <h4 className="text-[8px] font-medium text-white/[0.35] uppercase tracking-[0.28em] mb-3 pb-2 border-b border-white/[0.04]">{t(translations.metricInfo.descriptionHeader)}</h4>
                            <p className="text-[12px] font-light text-white/[0.55] leading-relaxed">{description}</p>
                        </div>
                    )}

                    {/* Interpretation */}
                    {interpretation && interpretation.length > 0 && (
                        <div className="bg-white/[0.015] border border-white/[0.05] p-5">
                            <h4 className="text-[8px] font-medium text-white/[0.35] uppercase tracking-[0.28em] mb-3 pb-2 border-b border-white/[0.04]">{t(translations.metricInfo.interpretationHeader)}</h4>
                            <div className="text-[12px] font-light text-white/[0.50] space-y-2">
                                {interpretation.map((item, idx) => {
                                    // Empty line → spacer
                                    if (!item.trim()) return <div key={idx} className="h-1.5" />;

                                    // Header line (ends with ':')
                                    const isHeader = item.endsWith(':') || (item === item.toUpperCase() && item.length > 5);
                                    if (isHeader) return <div key={idx} className="font-medium text-white/[0.65] mt-3 first:mt-0 text-[11px] tracking-[0.1em]">{item}</div>;

                                    // Bullet line (• item)
                                    if (item.startsWith('•')) {
                                        return (
                                            <div key={idx} className="flex items-start gap-2 pl-1">
                                                <span className="text-white/30 mt-0.5 flex-shrink-0">–</span>
                                                <span>{item.slice(1).trim()}</span>
                                            </div>
                                        );
                                    }

                                    // Indented sub-line (e.g. "  (β = 1.5: ...)")
                                    if (item.startsWith('  ')) {
                                        return (
                                            <div key={idx} className="pl-7 text-white/[0.40] text-[11.5px]">
                                                {item.trim()}
                                            </div>
                                        );
                                    }

                                    // Regular text line
                                    return <div key={idx}>{item}</div>;
                                })}
                            </div>
                        </div>
                    )}

                    {/* Formula */}
                    {formula && (
                        <div className="bg-white/[0.015] border border-white/[0.05] p-5">
                            <h4 className="text-[8px] font-medium text-white/[0.35] uppercase tracking-[0.28em] mb-3 pb-2 border-b border-white/[0.04]">{t(translations.metricInfo.formulaHeader)}</h4>
                            <div className="bg-white/[0.02] border border-white/[0.04] p-4">
                                <code className="text-[12px] text-white/[0.65] font-mono">{formula}</code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
