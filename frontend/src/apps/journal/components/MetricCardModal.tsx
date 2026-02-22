import { useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import { useJournalStore } from '../store/useJournalStore';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import type { LucideIcon } from 'lucide-react';

interface MetricCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
}

export default function MetricCardModal({ isOpen, onClose, title, value, subtitle: _subtitle, icon: Icon }: MetricCardModalProps) {
    const { nickname } = useJournalStore();
    const cardRef = useRef<HTMLDivElement>(null);
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);
    const animatedValue = useAnimatedValue(value);

    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        try {
            setCopying(true);
            await new Promise(r => setTimeout(r, 200));
            const dataUrl = await domToPng(cardRef.current, {
                scale: 5,
                quality: 1.0,
                backgroundColor: '#1a1a1a',
            });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            if (navigator.clipboard?.write) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `metric-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Image generation error:', e);
        } finally {
            setCopying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 bottom-0 left-0 right-[300px] z-[60] flex items-center justify-center journal-modal-overlay">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative max-w-4xl w-full mx-4">
                <div className="absolute -top-14 right-0 z-10">
                    <button onClick={onClose} className="flex items-center justify-center gap-2.5 px-8 py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border outline-none focus:outline-none text-white/[0.55] [background:rgba(196,168,124,0.03)] [border-color:rgba(196,168,124,0.12)] hover:[border-color:rgba(196,168,124,0.18)] hover:text-white/[0.68]">
                        <X size={14} strokeWidth={1.5} />
                        <span>Close</span>
                    </button>
                </div>

                <div ref={cardRef} className="bg-[#0a0a0a] border border-white/[0.06] shadow-2xl overflow-hidden relative">
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                                radial-gradient(circle at 50% 0%, rgba(138,122,98,0.08) 0%, transparent 70%),
                                radial-gradient(circle at 50% 100%, rgba(255,255,255,0.02) 0%, transparent 50%)
                            `,
                        }}
                    />

                    {/* Subtle grid */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
                    }} />

                    <div className="relative p-16 min-h-[400px] flex flex-col justify-between">
                        {/* Header */}
                        <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-sans font-medium tracking-[0.25em] text-white/40 uppercase">
                                    {nickname ? `Equilibrium × ${nickname}` : 'Equilibrium'}
                                </span>
                                <span className="text-[8px] font-sans tracking-[0.2em] text-[#8a7a62]/60 uppercase">
                                    Analytical Space
                                </span>
                            </div>
                            {Icon && (
                                <div className="text-white/20">
                                    <Icon size={20} strokeWidth={1} />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col items-center justify-center flex-1 py-16">
                            <div className="mb-8">
                                <h2 className="text-[11px] font-sans tracking-[0.35em] text-white/40 uppercase text-center">
                                    {title}
                                </h2>
                            </div>
                            <div className="font-sans text-[clamp(4rem,8vw,7rem)] font-thin text-transparent bg-clip-text bg-gradient-to-b from-white via-white/[0.8] to-white/[0.2] text-center tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {animatedValue}
                            </div>
                            {_subtitle && (
                                <div className="mt-8 text-[10px] font-sans tracking-[0.2em] text-[#8a7a62]/50 uppercase text-center">
                                    {_subtitle}
                                </div>
                            )}
                        </div>

                        {/* Footer line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8a7a62]/20 to-transparent" />
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button onClick={handleCopyImage} disabled={copying} className="flex items-center justify-center gap-2.5 px-8 py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border outline-none focus:outline-none text-white/[0.55] [background:rgba(196,168,124,0.03)] [border-color:rgba(196,168,124,0.12)] hover:[border-color:rgba(196,168,124,0.18)] hover:text-white/[0.68] disabled:opacity-40">
                        {copied ? <><Check size={14} strokeWidth={1.5} /><span>Image copied!</span></> : copying ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-bronze/50" /><span>Creating...</span></> : <><Copy size={14} strokeWidth={1.5} /><span>Copy card</span></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
