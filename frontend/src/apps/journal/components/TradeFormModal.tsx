/**
 * TradeFormModal – create new trade entry.
 * 45% left form / 55% right DnD image gallery.
 * Ported from Fundamental → Equilibrium design system.
 */

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Upload, GripVertical, Trash2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import DatePicker from './ui/DatePicker';
import Select from './ui/Select';
import { Input } from './ui/Input';
import PairSelector from './ui/PairSelector';
import { cn } from '@/lib/cn';
import { useJournalStore } from '../store/useJournalStore';
import { useEnums, usePortfolios, useCreateTrade, useUploadImage, useUpdateImageCaption } from '../hooks/useJournalQueries';
import { calculateProfit, getTodayKyiv } from '../utils/constants';
import type { TradeCreate } from '../types';

/* ------------------------------------------------------------------ */
/* Sortable image item for DnD                                        */
/* ------------------------------------------------------------------ */

interface SortableImageItemProps {
    id: number;
    image: string;
    index: number;
    caption: string;
    onRemove: (i: number) => void;
    onCaptionChange: (i: number, caption: string) => void;
}

function SortableImageItem({ id, image, index, caption, onRemove, onCaptionChange }: SortableImageItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group bg-[#111111] border border-white/[0.06] rounded-[20px] overflow-hidden flex flex-col">
            <div className="relative w-full flex-1 flex items-center justify-center bg-black/40 overflow-hidden">
                <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-full max-h-[600px] object-contain"
                />
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-4 left-4 p-2.5 bg-black/80 rounded-xl cursor-move hover:bg-black opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10"
                >
                    <GripVertical size={18} className="text-white/70" />
                </div>
                <button
                    onClick={() => onRemove(index)}
                    className="absolute top-4 right-4 p-2.5 bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 border border-red-500/30"
                >
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
                        onCaptionChange(index, e.target.value);
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

/* ------------------------------------------------------------------ */
/* TradeFormModal                                                      */
/* ------------------------------------------------------------------ */

interface FormData {
    date: string;
    pair: string;
    type: string;
    style: string;
    direction: string;
    risk_amount: string;
    rr_ratio: string;
    status: string;
    notes: string;
    portfolio_id: string;
    entry_price: string;
    exit_price: string;
}

const INITIAL_FORM: FormData = {
    date: '',
    pair: '',
    type: '',
    style: '',
    direction: '',
    risk_amount: '',
    rr_ratio: '',
    status: '',
    notes: '',
    portfolio_id: '',
    entry_price: '',
    exit_price: '',
};

export default function TradeFormModal() {
    const isOpen = useJournalStore((s) => s.isCreateModalOpen);
    const close = useJournalStore((s) => s.setCreateModalOpen);

    const { data: enums } = useEnums();
    const { data: portfolios = [] } = usePortfolios();
    const createTrade = useCreateTrade();
    const uploadImage = useUploadImage();
    const updateCaptionMut = useUpdateImageCaption();

    const activePortfolios = portfolios.filter((p) => p.is_active);

    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [riskMode, setRiskMode] = useState<'$' | '%'>('$');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageCaptions, setImageCaptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({ ...INITIAL_FORM, date: getTodayKyiv() });
            setImageFiles([]);
            setImagePreviews([]);
            setImageCaptions([]);
            setErrors([]);
        }
    }, [isOpen]);

    // Revoke blob URLs on close
    useEffect(() => {
        if (!isOpen) {
            imagePreviews.forEach((p) => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); });
        }
    }, [isOpen]);

    // Global paste
    useEffect(() => {
        const handler = (e: ClipboardEvent) => {
            if (!isOpen) return;
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
        if (isOpen) document.addEventListener('paste', handler);
        return () => document.removeEventListener('paste', handler);
    }, [isOpen, imagePreviews]);

    // ── Handlers ────────────────────────────────

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
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
        setImageFiles((p) => p.filter((_, i) => i !== index));
        setImagePreviews((p) => p.filter((_, i) => i !== index));
        setImageCaptions((p) => p.filter((_, i) => i !== index));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = Number(active.id);
        const newIndex = Number(over.id);
        setImagePreviews((items) => arrayMove(items, oldIndex, newIndex));
        setImageFiles((items) => arrayMove(items, oldIndex, newIndex));
        setImageCaptions((items) => arrayMove(items, oldIndex, newIndex));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const validationErrors: string[] = [];

        if (!formData.date?.trim()) validationErrors.push('date');
        if (!formData.pair?.trim()) validationErrors.push('pair');
        if (!formData.portfolio_id) validationErrors.push('portfolio');
        if (!formData.style?.trim()) validationErrors.push('style');
        if (!formData.type?.trim()) validationErrors.push('type');
        if (!formData.direction?.trim()) validationErrors.push('direction');
        if (!formData.status?.trim()) validationErrors.push('status');
        if (!formData.risk_amount?.trim()) validationErrors.push('risk');
        if (!formData.rr_ratio?.trim()) validationErrors.push('rr');

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors([]);
        setLoading(true);
        try {
            // Convert risk to dollars if in % mode
            const actualRisk = riskMode === '%' && selectedPortfolio?.initial_capital
                ? (parseFloat(formData.risk_amount) || 0) / 100 * selectedPortfolio.initial_capital
                : parseFloat(formData.risk_amount) || 0;

            const profit = calculateProfit(
                actualRisk,
                parseFloat(formData.rr_ratio) || 0,
                formData.status,
            );

            const payload: TradeCreate = {
                date: formData.date,
                pair: formData.pair.trim().toUpperCase(),
                type: formData.type ? formData.type as TradeCreate['type'] : null,
                style: formData.style ? formData.style as TradeCreate['style'] : null,
                direction: formData.direction ? formData.direction as TradeCreate['direction'] : null,
                status: formData.status ? formData.status as TradeCreate['status'] : null,
                risk_amount: actualRisk,
                profit_amount: profit,
                rr_ratio: parseFloat(formData.rr_ratio) || 0,
                notes: formData.notes?.trim() || null,
                portfolio_id: formData.portfolio_id,
                entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
                exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
            };

            const created = await createTrade.mutateAsync(payload);

            // Upload images sequentially, then set captions
            for (let i = 0; i < imageFiles.length; i++) {
                const uploaded = await uploadImage.mutateAsync({ tradeId: created.id, file: imageFiles[i] });
                if (imageCaptions[i]?.trim()) {
                    await updateCaptionMut.mutateAsync({ imageId: uploaded.id, caption: imageCaptions[i].trim() });
                }
            }

            close(false);
        } catch (err) {
            console.error('Failed to create trade:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // ── Computed ─────────────────────────────────

    const selectedPortfolio = activePortfolios.find((p) => p.id === formData.portfolio_id);
    const portfolioCapital = selectedPortfolio?.initial_capital || 0;

    // Convert displayed risk to dollar amount
    const riskInDollars = riskMode === '%' && portfolioCapital > 0
        ? (parseFloat(formData.risk_amount) || 0) / 100 * portfolioCapital
        : parseFloat(formData.risk_amount) || 0;

    const profit = calculateProfit(
        riskInDollars,
        parseFloat(formData.rr_ratio) || 0,
        formData.status,
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60" onClick={() => close(false)}>
            <div className="w-full max-w-[1600px] h-full max-h-[900px] flex gap-8" onClick={(e) => e.stopPropagation()}>

                {/* ── Left: Form Island (400px) ── */}
                <div className="w-[420px] shrink-0 flex flex-col gap-5 h-full">
                    {/* Form Island */}
                    <div className="flex-1 bg-[#111111] border border-white/[0.06] rounded-[20px] p-8 overflow-y-auto flex flex-col gap-6 custom-scrollbar-left pl-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-white/50 pb-4 border-b border-white/10">
                            New Trade
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
                                {riskMode === '%' && portfolioCapital > 0 && formData.risk_amount && (
                                    <div className="text-[10px] font-mono text-white/40 pl-1 pt-1">
                                        = ${riskInDollars.toFixed(2)}
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
                                {/* Calculated P&L – Compact */}
                                {formData.risk_amount && formData.rr_ratio && formData.status && (
                                    <div className="text-[10px] font-mono text-white/40 pl-1 pt-1">
                                        = {profit >= 0 ? '+' : ''}{profit.toFixed(2)} $ {selectedPortfolio?.initial_capital && `(${((profit / selectedPortfolio.initial_capital) * 100) >= 0 ? '+' : ''}${((profit / selectedPortfolio.initial_capital) * 100).toFixed(2)}%)`}
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
                            onClick={() => close(false)}
                            className="px-6 py-3 text-xs font-medium tracking-widest uppercase text-white/40 hover:text-white/90 hover:bg-white/5 rounded-full transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-300 outline-none focus:outline-none bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Log Trade'}
                        </button>
                    </div>
                </div>

                {/* ── Right: Image Islands (Flex-1) ── */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4 pb-10 h-full">
                    {imagePreviews.length > 0 && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={imagePreviews.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-6">
                                    {imagePreviews.map((preview, idx) => (
                                        <SortableImageItem
                                            key={idx}
                                            id={idx}
                                            image={preview}
                                            index={idx}
                                            caption={imageCaptions[idx] ?? ''}
                                            onRemove={removeImage}
                                            onCaptionChange={(i, c) => setImageCaptions((p) => { const n = [...p]; n[i] = c; return n; })}
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
        </div>
    );
}
