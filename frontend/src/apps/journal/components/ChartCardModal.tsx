import { useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { domToSvg } from 'modern-screenshot';
import { useJournalStore } from '../store/useJournalStore';

interface ChartCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
}

export default function ChartCardModal({ isOpen, onClose, title, children }: ChartCardModalProps) {
    const { nickname } = useJournalStore();
    const cardRef = useRef<HTMLDivElement>(null);
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        try {
            setCopying(true);
            await new Promise(r => setTimeout(r, 500));
            const svgDataUrl = await domToSvg(cardRef.current, { scale: 3, backgroundColor: '#1a1a1a' });
            const img = new Image();
            img.src = svgDataUrl;
            await new Promise<void>(resolve => { img.onload = () => resolve(); });
            const canvas = document.createElement('canvas');
            const scale = 6;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            if (!blob) throw new Error('Blob creation failed');

            if (navigator.clipboard?.write) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
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
            <div className="relative max-w-6xl w-full mx-4">
                <div className="absolute -top-14 right-0 z-10">
                    <button onClick={onClose} className="flex items-center justify-center gap-2.5 px-8 py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border rounded-full outline-none focus:outline-none text-white/[0.55] border-white/[0.06] hover:border-white/[0.15] hover:text-white/[0.80] hover:bg-white/[0.04]">
                        <X size={14} strokeWidth={1.5} />
                        <span>Close</span>
                    </button>
                </div>

                <div ref={cardRef} className="bg-[#111111] border border-white/[0.06] rounded-[20px] overflow-hidden relative">
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                                radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%),
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

                    <div className="relative p-12 min-h-[400px] flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start w-full mb-8">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-sans font-medium tracking-[0.25em] text-white/40 uppercase">
                                    {nickname ? `Equilibrium × ${nickname}` : 'Equilibrium'}
                                </span>
                                <span className="text-[8px] font-sans tracking-[0.2em] text-white/30 uppercase">
                                    Analytical Space
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1">
                            <div className="mb-8">
                                <h2 className="text-[11px] font-sans tracking-[0.35em] text-white/40 uppercase text-center">
                                    {title}
                                </h2>
                            </div>
                            <div className="w-full flex-1">{children}</div>
                        </div>

                        {/* Footer line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button onClick={handleCopyImage} disabled={copying} className="flex items-center justify-center gap-2.5 px-8 py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border rounded-full outline-none focus:outline-none bg-white text-black hover:bg-white/90 disabled:opacity-40">
                        {copied ? <><Check size={14} strokeWidth={1.5} /><span>Image copied!</span></> : copying ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-white/50" /><span>Creating...</span></> : <><Copy size={14} strokeWidth={1.5} /><span>Copy chart</span></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
