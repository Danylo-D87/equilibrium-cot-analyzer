/**
 * TradeViewModal – view / edit / delete a trade.
 * Two panels: 45% left (data card or edit form), 55% right (DnD images).
 * View mode renders an inline-style card for pixel-perfect screenshots.
 */

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
    Pencil, Trash2, Upload, GripVertical,
    Copy, Check, TrendingUp, TrendingDown,
} from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import DatePicker from './ui/DatePicker';
import Select from './ui/Select';
import { Input } from './ui/Input';
import PairSelector from './ui/PairSelector';
import { cn } from '@/lib/cn';
import { useJournalStore } from '../store/useJournalStore';
import {
    useEnums, usePortfolios,
    useUpdateTrade, useDeleteTrade,
    useUploadImage, useDeleteImage, useReorderImages, useUpdateImageCaption,
} from '../hooks/useJournalQueries';
import { getImageUrl, fetchTrade } from '../api/journalApi';
import { calculateProfit } from '../utils/constants';
import type { Trade, TradeUpdate } from '../types';

/* ─── Sortable Image ─────────────────────────────────── */

interface SortableImgProps {
    id: number;
    image: string;
    index: number;
    caption: string;
    onRemove: () => void;
    onCaptionChange: (caption: string) => void;
    isEditMode: boolean;
}

function SortableImageItem({ id, image, index, caption, onRemove, onCaptionChange, isEditMode }: SortableImgProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    if (isEditMode) {
        return (
            <div ref={setNodeRef} style={style} className="relative group bg-[#111111] border border-white/[0.06] rounded-[20px] overflow-hidden flex flex-col">
                <div className="relative w-full flex-1 flex items-center justify-center bg-black/40 overflow-hidden">
                    <img src={image} alt={`Preview ${index + 1}`} className="w-full max-h-[600px] object-contain" />
                    <div {...attributes} {...listeners} className="absolute top-4 left-4 p-2.5 bg-black/80 rounded-xl cursor-move hover:bg-black opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                        <GripVertical size={18} className="text-white/70" />
                    </div>
                    <button onClick={onRemove} className="absolute top-4 right-4 p-2.5 bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 border border-red-500/30">
                        <Trash2 size={18} />
                    </button>
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 rounded-lg text-xs font-medium text-white/70 border border-white/10">
                        #{index + 1}
                    </div>
                </div>
                <div className="p-5 bg-transparent border-t border-white/[0.05]">
                    <textarea
                        value={caption}
                        onChange={(e) => {
                            onCaptionChange(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-none text-sm text-white/90 placeholder:text-white/30 focus:outline-none font-sans transition-colors duration-300 resize-none overflow-hidden min-h-[24px]"
                        rows={1}
                    />
                </div>
            </div>
        );
    }

    // View mode
    return (
        <div ref={setNodeRef} style={style} className="relative group bg-[#060606] border border-white/[0.06] overflow-hidden">
            <img src={image} alt={`Screenshot ${index + 1}`} className="w-full min-h-[400px] max-h-[600px] object-contain bg-black/50" />
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-sm text-xs text-white/[0.55]">#{index + 1}</div>
            {caption ? (
                <div className="px-3 py-2 bg-black/30">
                    <span className="text-[11px] text-white/[0.40] font-mono">{caption}</span>
                </div>
            ) : null}
        </div>
    );
}

/* ─── Form Data ──────────────────────────────────────── */

interface FormState {
    date: string; pair: string; type: string; style: string;
    direction: string; risk_amount: string; rr_ratio: string;
    status: string; notes: string; portfolio_id: string;
    entry_price: string; exit_price: string;
}

function tradeToForm(t: Trade): FormState {
    const d = t.date?.includes('T') ? t.date.split('T')[0] : (t.date ?? '');
    return {
        date: d, pair: t.pair ?? '', type: t.type ?? '', style: t.style ?? '',
        direction: t.direction ?? '', risk_amount: String(t.risk_amount ?? ''),
        rr_ratio: String(t.rr_ratio ?? ''), status: t.status ?? '', notes: t.notes ?? '',
        portfolio_id: t.portfolio_id ?? '', entry_price: String(t.entry_price ?? ''),
        exit_price: String(t.exit_price ?? ''),
    };
}

/* ─── Main Component ─────────────────────────────────── */

export default function TradeViewModal() {
    const isOpen = useJournalStore((s) => s.isViewModalOpen);
    const trade = useJournalStore((s) => s.selectedTrade);
    const setOpen = useJournalStore((s) => s.setViewModalOpen);
    const setSelectedTrade = useJournalStore((s) => s.setSelectedTrade);
    const displayMode = useJournalStore((s) => s.displayMode);
    const nickname = useJournalStore((s) => s.nickname);

    const { data: enums } = useEnums();
    const { data: portfolios = [] } = usePortfolios();
    const updateTradeMut = useUpdateTrade();
    const deleteTradeMut = useDeleteTrade();
    const uploadImageMut = useUploadImage();
    const deleteImageMut = useDeleteImage();
    const reorderImagesMut = useReorderImages();
    const updateCaptionMut = useUpdateImageCaption();

    const activePortfolios = portfolios.filter((p) => p.is_active);

    const [localTrade, setLocalTrade] = useState<Trade | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormState>({} as FormState);

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<{ id: string; filename: string }[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [imageOrderChanged, setImageOrderChanged] = useState(false);
    const [imageCaptions, setImageCaptions] = useState<string[]>([]);
    const [riskMode, setRiskMode] = useState<'$' | '%'>('$');
    const [errors, setErrors] = useState<string[]>([]);

    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Sync trade prop
    useEffect(() => { if (trade) setLocalTrade(trade); }, [trade]);

    // Init on open
    useEffect(() => {
        if (!isOpen || !localTrade) return;
        setIsEditMode(false);
        setShowDeleteConfirm(false);
        setImageFiles([]);
        setImagesToDelete([]);
        setImageOrderChanged(false);
        setRiskMode('$');
        setErrors([]);
        setFormData(tradeToForm(localTrade));

        // Build image previews from existing images
        if (localTrade.images?.length) {
            setExistingImages(localTrade.images.map((img) => ({ id: img.id, filename: img.filename })));
            setImagePreviews(localTrade.images.map((img) => getImageUrl(img.id)));
            setImageCaptions(localTrade.images.map((img) => img.caption ?? ''));
        } else {
            setExistingImages([]);
            setImagePreviews([]);
            setImageCaptions([]);
        }
    }, [isOpen, localTrade]);

    // Revoke blobs
    useEffect(() => {
        if (!isOpen) imagePreviews.forEach((p) => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); });
    }, [isOpen]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && formData.notes) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [formData.notes]);

    // Global paste in edit mode
    useEffect(() => {
        const handler = (e: ClipboardEvent) => {
            if (!isOpen || !isEditMode) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image')) {
                    const blob = items[i].getAsFile();
                    if (blob) files.push(new File([blob], `pasted-${Date.now()}.png`, { type: blob.type }));
                }
            }
            if (files.length) { addFiles(files); e.preventDefault(); }
        };
        if (isOpen && isEditMode) document.addEventListener('paste', handler);
        return () => document.removeEventListener('paste', handler);
    }, [isOpen, isEditMode]);

    /* ── helpers ── */

    const getInitialBalance = () => {
        if (!localTrade?.portfolio_id || !portfolios.length) {
            return portfolios.reduce((s, p) => s + (p.initial_capital || 0), 0) || 10000;
        }
        return portfolios.find((p) => p.id === localTrade.portfolio_id)?.initial_capital || 10000;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        setErrors([]);
        if (name === 'notes' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const addFiles = (files: File[]) => {
        setImageFiles((p) => [...p, ...files]);
        setImagePreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
        setImageCaptions((p) => [...p, ...files.map(() => '')]);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) addFiles(Array.from(e.target.files));
    };

    const removeImage = (index: number) => {
        const preview = imagePreviews[index];
        if (preview && !preview.startsWith('blob:')) {
            const existing = existingImages.find((img) => preview.includes(img.id));
            if (existing) {
                setImagesToDelete((p) => [...p, existing.id]);
                setExistingImages((p) => p.filter((i) => i.id !== existing.id));
            }
        } else if (preview?.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
            const fileIndex = index - existingImages.length;
            if (fileIndex >= 0) setImageFiles((p) => p.filter((_, i) => i !== fileIndex));
        }
        setImagePreviews((p) => p.filter((_, i) => i !== index));
        setImageCaptions((p) => p.filter((_, i) => i !== index));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = Number(active.id);
        const newIdx = Number(over.id);
        setImagePreviews((items) => arrayMove(items, oldIdx, newIdx));
        setExistingImages((items) => items.length ? arrayMove(items, oldIdx, newIdx) : items);
        setImageCaptions((items) => arrayMove(items, oldIdx, newIdx));
        setImageOrderChanged(true);
    };

    /* ── Save / Delete ── */

    const handleSave = async () => {
        if (!localTrade) return;
        setLoading(true);
        try {
            // Convert risk to dollars if in % mode
            const editPortfolio = activePortfolios.find((p) => p.id === formData.portfolio_id);
            const actualRisk = riskMode === '%' && editPortfolio?.initial_capital
                ? (parseFloat(formData.risk_amount) || 0) / 100 * editPortfolio.initial_capital
                : parseFloat(formData.risk_amount) || 0;

            const profit = calculateProfit(actualRisk, parseFloat(formData.rr_ratio) || 0, formData.status);
            const payload: TradeUpdate = {
                date: formData.date || undefined,
                pair: formData.pair?.trim().toUpperCase() || undefined,
                type: (formData.type || undefined) as TradeUpdate['type'],
                style: (formData.style || undefined) as TradeUpdate['style'],
                direction: (formData.direction || undefined) as TradeUpdate['direction'],
                status: (formData.status || undefined) as TradeUpdate['status'],
                risk_amount: actualRisk,
                profit_amount: profit,
                rr_ratio: parseFloat(formData.rr_ratio) || 0,
                notes: formData.notes?.trim() || null,
                portfolio_id: formData.portfolio_id || undefined,
                entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
                exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
            };

            console.log('[TradeViewModal] PUT payload:', JSON.stringify(payload, null, 2));
            await updateTradeMut.mutateAsync({ id: localTrade.id, data: payload });

            for (const imgId of imagesToDelete) {
                await deleteImageMut.mutateAsync({ tradeId: localTrade.id, imageId: imgId });
            }
            for (let i = 0; i < imageFiles.length; i++) {
                const uploaded = await uploadImageMut.mutateAsync({ tradeId: localTrade.id, file: imageFiles[i] });
                const captionIdx = existingImages.length + i;
                if (imageCaptions[captionIdx]?.trim()) {
                    await updateCaptionMut.mutateAsync({ imageId: uploaded.id, caption: imageCaptions[captionIdx].trim() });
                }
            }
            if (imageOrderChanged && existingImages.length > 0) {
                await reorderImagesMut.mutateAsync({
                    tradeId: localTrade.id,
                    imageIds: existingImages.map((i) => i.id),
                });
            }

            // Update captions for existing images
            for (let i = 0; i < existingImages.length; i++) {
                const oldCaption = localTrade.images?.find((img) => img.id === existingImages[i].id)?.caption ?? '';
                const newCaption = imageCaptions[i]?.trim() ?? '';
                if (newCaption !== (oldCaption || '')) {
                    await updateCaptionMut.mutateAsync({ imageId: existingImages[i].id, caption: newCaption || null });
                }
            }

            // Fetch fresh trade so images are up-to-date in view mode
            const fresh = await fetchTrade(localTrade.id);
            setLocalTrade(fresh);
            setIsEditMode(false);
            setImagesToDelete([]);
            setImageFiles([]);
            setImageOrderChanged(false);
        } catch (err) {
            console.error('[TradeViewModal] Failed to save trade:', err instanceof Error ? err.message : err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!localTrade) return;
        setLoading(true);
        try {
            await deleteTradeMut.mutateAsync(localTrade.id);
            setOpen(false);
            setSelectedTrade(null);
        } catch (err) {
            console.error('Failed to delete trade:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ── Copy screenshot ── */

    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        try {
            setCopying(true);
            await new Promise((r) => setTimeout(r, 300));
            const dataUrl = await domToPng(cardRef.current, {
                scale: 5, quality: 1.0, backgroundColor: '#1a1a1a',
                style: { margin: '0', padding: '0', transform: 'scale(1)', transformOrigin: 'top left' },
            });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            } catch {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trade-${localTrade?.pair}-${localTrade?.date}.png`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Image copy error:', err);
        } finally {
            setCopying(false);
        }
    };

    const handleClose = () => { setOpen(false); setSelectedTrade(null); };

    if (!isOpen || !localTrade) return null;

    // ── Computed (edit mode) ─────────────────────────────
    const editSelectedPortfolio = activePortfolios.find((p) => p.id === formData.portfolio_id);
    const editPortfolioCapital = editSelectedPortfolio?.initial_capital || 0;
    const editRiskInDollars = riskMode === '%' && editPortfolioCapital > 0
        ? (parseFloat(formData.risk_amount) || 0) / 100 * editPortfolioCapital
        : parseFloat(formData.risk_amount) || 0;

    const profit = calculateProfit(
        editRiskInDollars,
        parseFloat(formData.rr_ratio) || 0,
        formData.status,
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60" onClick={handleClose}>
            {isEditMode ? (
                /* ══════════════════════════════════════════════
                   Edit Mode – matches TradeFormModal layout
                   ══════════════════════════════════════════════ */
                <div className="w-full max-w-[1600px] h-full max-h-[900px] flex gap-8" onClick={(e) => e.stopPropagation()}>

                    {/* ── Left: Form Island (420px) ── */}
                    <div className="w-[420px] shrink-0 flex flex-col gap-5 h-full">
                        {/* Form Island */}
                        <div className="flex-1 bg-[#111111] border border-white/[0.06] rounded-[20px] p-8 overflow-y-auto flex flex-col gap-6 custom-scrollbar-left pl-4">
                            <h2 className="text-xs font-medium uppercase tracking-widest text-white/50 pb-4 border-b border-white/10">
                                Edit Trade
                            </h2>

                            {/* Date + Pair */}
                            <div className="grid grid-cols-2 gap-5">
                                <DatePicker
                                    label="Date"
                                    value={formData.date}
                                    onChange={(d) => { setFormData((p) => ({ ...p, date: d })); setErrors([]); }}
                                    labelClassName={errors.includes('date') ? 'text-red-400' : ''}
                                />
                                <PairSelector
                                    label="Pair"
                                    value={formData.pair}
                                    onChange={(v) => { setFormData((p) => ({ ...p, pair: v })); setErrors([]); }}
                                    existingPairs={[]}
                                    placeholder="BTC/USD"
                                    labelClassName={errors.includes('pair') ? 'text-red-400' : ''}
                                />
                            </div>

                            {/* Portfolio (Full width) */}
                            {activePortfolios.length > 0 && (
                                <Select
                                    label="Portfolio"
                                    value={formData.portfolio_id}
                                    onChange={(v) => { setFormData((p) => ({ ...p, portfolio_id: v })); setErrors([]); }}
                                    options={activePortfolios.map((p) => ({
                                        value: p.id,
                                        label: `${p.name} ($${p.initial_capital?.toLocaleString()})`,
                                    }))}
                                    placeholder="Select Portfolio"
                                    labelClassName={errors.includes('portfolio') ? 'text-red-400' : ''}
                                />
                            )}

                            {/* Style + Type */}
                            <div className="grid grid-cols-2 gap-5">
                                <Select
                                    label="Style"
                                    value={formData.style}
                                    onChange={(v) => { setFormData((p) => ({ ...p, style: v })); setErrors([]); }}
                                    options={enums?.styles ?? []}
                                    placeholder="Select Style"
                                    labelClassName={errors.includes('style') ? 'text-red-400' : ''}
                                />
                                <Select
                                    label="Type"
                                    value={formData.type}
                                    onChange={(v) => { setFormData((p) => ({ ...p, type: v })); setErrors([]); }}
                                    options={enums?.types ?? []}
                                    placeholder="Select Type"
                                    labelClassName={errors.includes('type') ? 'text-red-400' : ''}
                                />
                            </div>

                            {/* Direction + Status */}
                            <div className="grid grid-cols-2 gap-5">
                                <Select
                                    label="Direction"
                                    value={formData.direction}
                                    onChange={(v) => { setFormData((p) => ({ ...p, direction: v })); setErrors([]); }}
                                    options={enums?.directions ?? []}
                                    placeholder="Select Direction"
                                    labelClassName={errors.includes('direction') ? 'text-red-400' : ''}
                                />
                                <Select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(v) => { setFormData((p) => ({ ...p, status: v })); setErrors([]); }}
                                    options={enums?.statuses ?? []}
                                    placeholder="Select Status"
                                    labelClassName={errors.includes('status') ? 'text-red-400' : ''}
                                />
                            </div>

                            {/* Risk + RR */}
                            <div className="grid grid-cols-2 gap-5 items-start">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between h-[16px] pl-0.5 pr-0.5">
                                        <label className={cn('text-[10px] font-medium uppercase tracking-widest text-white/40', errors.includes('risk') ? 'text-red-400' : '')}>
                                            Risk
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setRiskMode(riskMode === '$' ? '%' : '$'); setErrors([]); }}
                                            className="flex items-center gap-1 text-[10px] font-mono transition-colors duration-300"
                                        >
                                            <span className={riskMode === '$' ? 'text-white' : 'text-white/30'}>$</span>
                                            <span className="text-white/20">/</span>
                                            <span className={riskMode === '%' ? 'text-white' : 'text-white/30'}>%</span>
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step={riskMode === '%' ? '0.1' : '0.01'}
                                        name="risk_amount"
                                        placeholder={riskMode === '%' ? '1.0' : '100'}
                                        value={formData.risk_amount}
                                        onChange={handleChange}
                                        className="w-full h-10 px-4 bg-white/[0.03] border border-white/[0.06] rounded-[12px] text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] hover:border-white/[0.12] transition-all duration-300 font-mono"
                                    />
                                    {riskMode === '%' && editPortfolioCapital > 0 && formData.risk_amount && (
                                        <div className="text-[10px] font-mono text-white/40 pl-1 pt-1">
                                            = ${editRiskInDollars.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center h-[16px] pl-0.5">
                                        <label className={cn('text-[10px] font-medium uppercase tracking-widest text-white/40', errors.includes('rr') ? 'text-red-400' : '')}>Target RR</label>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="rr_ratio"
                                        placeholder="2.5"
                                        value={formData.rr_ratio}
                                        onChange={handleChange}
                                        className="w-full h-10 px-4 bg-white/[0.03] border border-white/[0.06] rounded-[12px] text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] hover:border-white/[0.12] transition-all duration-300 font-mono"
                                    />
                                    {formData.risk_amount && formData.rr_ratio && formData.status && (
                                        <div className="text-[10px] font-mono text-white/40 pl-1 pt-1">
                                            = {profit >= 0 ? '+' : ''}{profit.toFixed(2)} $ {editSelectedPortfolio?.initial_capital && `(${((profit / editSelectedPortfolio.initial_capital) * 100) >= 0 ? '+' : ''}${((profit / editSelectedPortfolio.initial_capital) * 100).toFixed(2)}%)`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Entry + Exit */}
                            <div className="grid grid-cols-2 gap-5">
                                <Input label="Entry Price" type="number" step="0.0001" name="entry_price" placeholder="Optional" value={formData.entry_price} onChange={handleChange} />
                                <Input label="Exit Price" type="number" step="0.0001" name="exit_price" placeholder="Optional" value={formData.exit_price} onChange={handleChange} />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-medium uppercase tracking-widest text-white/40 pl-1">Notes</label>
                                <textarea
                                    ref={textareaRef}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Add your trade comment..."
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm font-light text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all duration-300 resize-none overflow-hidden min-h-[80px] max-h-[200px] leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Buttons Island */}
                        <div className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-4 flex justify-between items-center shrink-0">
                            <button
                                type="button"
                                onClick={() => { setIsEditMode(false); setFormData(tradeToForm(localTrade)); setErrors([]); }}
                                className="px-6 py-3 text-xs font-medium tracking-widest uppercase text-white/40 hover:text-white/90 hover:bg-white/5 rounded-xl transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-3 text-xs font-medium tracking-widest uppercase text-red-400/40 hover:text-red-400/90 hover:bg-red-500/10 rounded-full transition-all duration-300"
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-300 outline-none focus:outline-none bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Image Islands (Flex-1) ── */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4 pb-10 h-full">
                        {imagePreviews.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={imagePreviews.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-6">
                                        {imagePreviews.map((img, idx) => (
                                            <SortableImageItem
                                                key={idx}
                                                id={idx}
                                                image={img}
                                                index={idx}
                                                caption={imageCaptions[idx] ?? ''}
                                                onRemove={() => removeImage(idx)}
                                                onCaptionChange={(c) => setImageCaptions((p) => { const n = [...p]; n[idx] = c; return n; })}
                                                isEditMode={true}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {/* Upload Island */}
                        <label className="group flex flex-col items-center justify-center gap-4 p-12 bg-[#111111] border-2 border-dashed border-white/[0.06] rounded-[20px] cursor-pointer hover:border-white/[0.15] hover:bg-[#161616] transition-all duration-500 min-h-[200px]">
                            <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500">
                                <Upload size={24} className="text-white/50 group-hover:text-white/90 transition-colors duration-500" />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium tracking-widest uppercase text-white/60 group-hover:text-white/90 transition-colors duration-500 mb-2">
                                    Upload Images
                                </div>
                                <div className="text-xs text-white/30 font-mono">
                                    Drag & Drop or Paste (Ctrl+V)
                                </div>
                            </div>
                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>
            ) : (
                /* ══════════════════════════════════════════════
                   View Mode – original layout
                   ══════════════════════════════════════════════ */
                <div className="w-full max-w-[94vw] max-h-[94vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[9px] font-sans font-medium uppercase tracking-[0.25em] text-white/[0.35]">
                                Trade Details
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsEditMode(true)} className="p-1.5 text-white/[0.20] hover:text-white/[0.85] hover:bg-white/[0.04] transition-all duration-500" title="Edit">
                                <Pencil size={14} strokeWidth={1} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* ── Left 45% ── */}
                        <div className="w-[45%] flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col trade-form-scroll">
                                <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
                                    <div
                                        ref={cardRef}
                                        className="bg-[#0a0a0a] border border-white/[0.06] shadow-2xl overflow-hidden relative"
                                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                                    >
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

                                        <div className="relative p-12 flex flex-col">
                                            {/* Branding + Direction */}
                                            <div className="flex justify-between items-start w-full mb-8">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-sans font-medium tracking-[0.25em] text-white/40 uppercase">
                                                        {nickname ? `Equilibrium × ${nickname}` : 'Equilibrium'}
                                                    </span>
                                                    <span className="text-[8px] font-sans tracking-[0.2em] text-white/30 uppercase">
                                                        Analytical Space
                                                    </span>
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-1 border ${localTrade.direction === 'Long' ? 'border-green-400/20 text-green-400' : 'border-red-400/20 text-red-400'}`}>
                                                    {localTrade.direction === 'Long' ? <TrendingUp size={11} strokeWidth={1.5} /> : <TrendingDown size={11} strokeWidth={1.5} />}
                                                    <span className="text-[8px] font-sans font-semibold uppercase tracking-[0.12em]">{localTrade.direction}</span>
                                                </div>
                                            </div>

                                            {/* Pair + Date */}
                                            <div className="mb-7">
                                                <h3 className="text-2xl font-sans font-semibold text-white/[0.9] uppercase tracking-[0.05em] leading-tight m-0">{localTrade.pair}</h3>
                                                <div className="mt-2 text-[10px] font-sans text-white/[0.22] font-light">
                                                    {new Date(localTrade.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                            </div>

                                            <div className="h-px bg-white/[0.05] mb-7" />

                                            {/* P&L */}
                                            <div className="mb-7">
                                                <div className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-white/[0.22] mb-3">P&L</div>
                                                <div className={`text-4xl font-sans font-thin tracking-tight leading-tight ${(localTrade.profit_amount ?? 0) > 0 ? 'text-green-400/90' : (localTrade.profit_amount ?? 0) < 0 ? 'text-red-400/90' : 'text-white/[0.45]'
                                                    }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {displayMode === 'percentage' ? (
                                                        <>{(localTrade.profit_amount ?? 0) > 0 ? '+' : ''}{(((localTrade.profit_amount ?? 0) / getInitialBalance()) * 100).toFixed(2)}<span className="text-lg ml-1 opacity-40">%</span></>
                                                    ) : (
                                                        <>{(localTrade.profit_amount ?? 0) > 0 ? '+' : ''}{Number(localTrade.profit_amount ?? 0).toFixed(2)}<span className="text-lg ml-1 opacity-40">$</span></>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className={`px-2 py-0.5 text-[8px] font-sans font-semibold uppercase tracking-[0.1em] border ${localTrade.status === 'TP' ? 'bg-green-400/[0.08] text-green-400/[0.75] border-green-400/[0.12]'
                                                        : localTrade.status === 'SL' ? 'bg-red-400/[0.08] text-red-400/[0.75] border-red-400/[0.12]'
                                                            : 'bg-white/[0.03] text-white/[0.35] border-white/[0.06]'
                                                        }`}>{localTrade.status}</span>
                                                    {localTrade.risk_amount ? (
                                                        <span className="text-[11px] font-sans text-white/[0.18] font-light">
                                                            {((localTrade.profit_amount ?? 0) / localTrade.risk_amount).toFixed(2)}R
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Data rows */}
                                            <div className="flex flex-col gap-3.5 mb-0">
                                                {[
                                                    { label: 'Risk', value: displayMode === 'percentage' ? `${(((localTrade.risk_amount ?? 0) / getInitialBalance()) * 100).toFixed(2)}%` : `$${Number(localTrade.risk_amount ?? 0).toFixed(2)}` },
                                                    { label: 'Type', value: localTrade.type ?? '' },
                                                    { label: 'Style', value: localTrade.style ?? '' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-baseline">
                                                        <span className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-white/[0.22]">{item.label}</span>
                                                        <span className="text-[13px] font-sans font-light text-white/[0.65]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
                                                    </div>
                                                ))}
                                                <div className="h-px bg-white/[0.04]" />
                                                {[
                                                    ...(localTrade.entry_price ? [{ label: 'Entry', value: Number(localTrade.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) }] : []),
                                                    ...(localTrade.exit_price ? [{ label: 'Exit', value: Number(localTrade.exit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) }] : []),
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-baseline">
                                                        <span className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-white/[0.22]">{item.label}</span>
                                                        <span className="text-[12px] font-sans font-light text-white/[0.45]">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Notes */}
                                            {localTrade.notes && (
                                                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                                                    <div className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-white/[0.18] mb-2">Notes</div>
                                                    <div className="text-[12px] font-sans text-white/[0.32] whitespace-pre-wrap leading-relaxed break-words font-light">{localTrade.notes}</div>
                                                </div>
                                            )}

                                            {/* Footer line */}
                                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                                        </div>
                                    </div>

                                    {/* Copy button */}
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={handleCopyImage}
                                            disabled={copying}
                                            className="flex items-center justify-center gap-2.5 px-8 py-3 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 border rounded-full outline-none focus:outline-none bg-white text-black hover:bg-white/90 disabled:opacity-40"
                                        >
                                            {copied ? <><Check size={14} strokeWidth={1.5} /><span>Copied!</span></> : copying ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-white/50" /><span>Creating...</span></> : <><Copy size={14} strokeWidth={1.5} /><span>Copy Card</span></>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Right 55% – Images ── */}
                        <div className="w-[55%] flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                                {imagePreviews.length > 0 ? (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={imagePreviews.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-3">
                                                {imagePreviews.map((img, idx) => (
                                                    <SortableImageItem
                                                        key={idx}
                                                        id={idx}
                                                        image={img}
                                                        index={idx}
                                                        caption={imageCaptions[idx] ?? ''}
                                                        onRemove={() => removeImage(idx)}
                                                        onCaptionChange={(c) => setImageCaptions((p) => { const n = [...p]; n[idx] = c; return n; })}
                                                        isEditMode={false}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center h-full text-white/[0.18]">
                                        <div className="text-[9px] uppercase tracking-[0.25em]">No screenshots</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm overlay */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm bg-black/40" onClick={(e) => e.stopPropagation()}>
                    <div className="relative border border-white/[0.06] max-w-xs w-full overflow-hidden"
                        style={{ background: 'rgba(6,6,6,0.97)', boxShadow: '0 24px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                        {/* Corner accent */}
                        <div className="absolute top-0 left-0 w-5 h-px bg-red-400/30" />
                        <div className="absolute top-0 left-0 w-px h-5 bg-red-400/30" />
                        <div className="p-8 text-center">
                            <div className="mb-6">
                                <div className="text-[8px] font-sans font-medium tracking-[0.30em] text-white/[0.22] uppercase mb-3">Confirm Action</div>
                                <div className="text-[15px] font-light tracking-wide text-white/[0.80]">Delete this trade?</div>
                                <div className="text-[11px] text-white/[0.28] mt-2 font-light">This action cannot be undone.</div>
                            </div>
                            <div className="h-px bg-white/[0.04] mb-6" />
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-5 py-2.5 text-[9px] font-sans tracking-[0.18em] uppercase text-white/[0.30] hover:text-white/[0.65] transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-2.5 text-[9px] font-sans font-medium tracking-[0.18em] uppercase border border-red-400/30 text-red-400/70 hover:text-red-300 hover:border-red-400/55 hover:bg-red-500/[0.06] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/[0.10] to-transparent" />
                    </div>
                </div>
            )}
        </div>
    );
}
