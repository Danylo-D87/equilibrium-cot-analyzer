/**
 * SettingsModal – Profile (nickname, language), Portfolios CRUD.
 * Ported from Fundamental → Equilibrium design system, using TanStack Query + Zustand.
 */

import { useState, useEffect } from 'react';
import {
    X, Trash2, AlertCircle, CheckCircle,
    Briefcase, Plus, Pencil, User, Globe,
} from 'lucide-react';
import { Input } from './ui/Input';
import { useJournalStore } from '../store/useJournalStore';
import {
    usePortfolios, useCreatePortfolio, useUpdatePortfolio,
    useDeletePortfolio, useUpdateSettings,
} from '../hooks/useJournalQueries';

import { languageNames } from '../i18n/translations';
import type { Portfolio, PortfolioCreate, PortfolioUpdate } from '../types';

type Section = 'profile' | 'portfolios';
interface Msg { type: 'success' | 'error'; text: string }

export default function SettingsModal() {
    const isOpen = useJournalStore((s) => s.isSettingsOpen);
    const close = useJournalStore((s) => s.setSettingsOpen);
    const language = useJournalStore((s) => s.language);
    const setLanguage = useJournalStore((s) => s.setLanguage);
    const nickname = useJournalStore((s) => s.nickname);
    const setNickname = useJournalStore((s) => s.setNickname);

    const { data: portfolios = [] } = usePortfolios();
    const createPortfolioMut = useCreatePortfolio();
    const updatePortfolioMut = useUpdatePortfolio();
    const deletePortfolioMut = useDeletePortfolio();
    const updateSettingsMut = useUpdateSettings();

    const [section, setSection] = useState<Section>('profile');
    const [message, setMessage] = useState<Msg | null>(null);
    const [tempNickname, setTempNickname] = useState(nickname);

    // Portfolio state
    const [editingPortfolio, setEditingPortfolio] = useState<(Portfolio & { initial_capital: number | string }) | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPort, setNewPort] = useState({ name: '', initial_capital: '', description: '' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => { if (isOpen) setTempNickname(nickname); }, [isOpen, nickname]);

    const flash = (msg: Msg) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); };

    /* ── Portfolio handlers ── */

    const handleCreatePortfolio = async () => {
        if (!newPort.name || !newPort.initial_capital) { flash({ type: 'error', text: 'Name and initial capital required' }); return; }
        try {
            await createPortfolioMut.mutateAsync({
                name: newPort.name,
                initial_capital: parseFloat(newPort.initial_capital),
                description: newPort.description || null,
            } as PortfolioCreate);
            flash({ type: 'success', text: 'Portfolio created' });
            setNewPort({ name: '', initial_capital: '', description: '' });
            setShowNewForm(false);
        } catch (err: any) { flash({ type: 'error', text: err.message || 'Create failed' }); }
    };

    const handleUpdatePortfolio = async () => {
        if (!editingPortfolio) return;
        try {
            await updatePortfolioMut.mutateAsync({
                id: editingPortfolio.id,
                data: {
                    name: editingPortfolio.name,
                    initial_capital: Number(editingPortfolio.initial_capital),
                    description: editingPortfolio.description || null,
                } as PortfolioUpdate,
            });
            flash({ type: 'success', text: 'Portfolio updated' });
            setEditingPortfolio(null);
        } catch (err: any) { flash({ type: 'error', text: err.message || 'Update failed' }); }
    };

    const handleDeletePortfolio = async (id: string) => {
        try {
            await deletePortfolioMut.mutateAsync(id);
            flash({ type: 'success', text: 'Portfolio deleted' });
            setDeleteConfirm(null);
        } catch (err: any) { flash({ type: 'error', text: err.message || 'Delete failed' }); }
    };

    if (!isOpen) return null;

    const fmt$ = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
    const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

    const sections: { id: Section; label: string; icon: typeof User }[] = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'portfolios', label: 'Portfolios', icon: Briefcase },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/20" onClick={() => close(false)}>
            <div className="w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col journal-modal-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 py-4 flex items-center justify-between shrink-0 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-[5px] h-[5px] rounded-full bg-white/30" />
                        <h2 className="text-[9px] font-sans font-medium tracking-[0.28em] text-white/[0.35] uppercase">Settings</h2>
                    </div>
                    <button onClick={() => close(false)} className="p-1.5 text-white/[0.20] hover:text-white/[0.55] hover:bg-white/[0.03] transition-all duration-500">
                        <X size={16} strokeWidth={1} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/[0.04] p-6">
                        <nav className="space-y-1">
                            {sections.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSection(id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-400 text-[9px] font-sans tracking-[0.18em] uppercase rounded-[12px] ${section === id
                                        ? 'bg-white/[0.08] text-white border-l-2 border-l-white/60'
                                        : 'text-white/[0.22] hover:text-white/[0.40] border-l-2 border-l-transparent hover:border-l-white/[0.08]'
                                        }`}
                                >
                                    <Icon size={13} strokeWidth={1} className={section === id ? 'text-white/60' : 'text-white/[0.20]'} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {/* Message */}
                        {message && (
                            <div className={`mb-6 p-4 flex items-start gap-3 border ${message.type === 'success'
                                ? 'bg-green-500/[0.05] border-green-500/15'
                                : 'bg-red-500/[0.05] border-red-500/15'
                                }`}>
                                {message.type === 'success' ? <CheckCircle className="text-green-400 shrink-0" size={18} /> : <AlertCircle className="text-red-400 shrink-0" size={18} />}
                                <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>{message.text}</p>
                            </div>
                        )}

                        {/* ─── Profile ─── */}
                        {section === 'profile' && (
                            <div className="space-y-6">
                                {/* Nickname */}
                                <div className="bg-white/[0.015] border border-white/[0.03] p-6 space-y-4">
                                    <div>
                                        <h3 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.55] uppercase mb-2">Nickname</h3>
                                        <p className="text-[11px] text-white/[0.28]">Displayed on screenshot cards for branding.</p>
                                    </div>
                                    <Input label="Nickname" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} placeholder="Your nickname" />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateSettingsMut.mutateAsync({ nickname: tempNickname || null });
                                                    setNickname(tempNickname);
                                                    flash({ type: 'success', text: 'Nickname saved' });
                                                } catch { flash({ type: 'error', text: 'Failed to save nickname' }); }
                                            }}
                                            disabled={updateSettingsMut.isPending}
                                            className="flex-1 px-4 py-3 border border-white/[0.06] text-white/[0.35] hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.04] text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >Save</button>
                                        {tempNickname && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await updateSettingsMut.mutateAsync({ nickname: null });
                                                        setTempNickname('');
                                                        setNickname('');
                                                        flash({ type: 'success', text: 'Nickname cleared' });
                                                    } catch { flash({ type: 'error', text: 'Failed to clear nickname' }); }
                                                }}
                                                className="px-4 py-3 border border-white/[0.04] text-white/[0.22] hover:text-white/[0.50] hover:border-white/[0.10] text-[10px] font-sans tracking-[0.15em] uppercase transition-all duration-300"
                                            >Clear</button>
                                        )}
                                    </div>
                                    {tempNickname && (
                                        <div className="p-3 bg-white/[0.015] border border-white/[0.03]">
                                            <p className="text-[9px] text-white/[0.20] tracking-[0.2em] uppercase mb-2">Preview</p>
                                            <p className="text-white/[0.45] text-[11px] font-sans tracking-[0.3em] uppercase">Equilibrium × {tempNickname}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Language */}
                                <div className="bg-white/[0.015] border border-white/[0.03] p-6 space-y-4">
                                    <div>
                                        <h3 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.55] uppercase mb-2 flex items-center gap-2">
                                            <Globe size={13} strokeWidth={1.5} className="text-white/40" /> Language
                                        </h3>
                                        <p className="text-[11px] text-white/[0.28]">Interface language for the journal module.</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['uk', 'en', 'ru'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setLanguage(lang)}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 transition-all duration-300 text-[10px] font-sans tracking-[0.12em] uppercase rounded-full focus:outline-none ${language === lang ? 'bg-white/[0.10] text-white border border-white/[0.15]' : 'bg-transparent text-white/[0.22] hover:text-white/[0.50] border border-white/[0.03] hover:border-white/[0.08]'
                                                    }`}
                                            >
                                                <span className="text-base">{lang === 'uk' ? '🇺🇦' : lang === 'en' ? '🇬🇧' : '🇷🇺'}</span>
                                                <span>{(languageNames as any)[lang]?.[language] ?? lang}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Portfolios ─── */}
                        {section === 'portfolios' && (
                            <div className="space-y-6">
                                {/* New portfolio */}
                                <div className="bg-white/[0.015] border border-white/[0.03] p-6">
                                    {!showNewForm ? (
                                        <button onClick={() => setShowNewForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/[0.06] text-white/[0.35] hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.04] text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-all duration-300">
                                            <Plus size={13} /> New Portfolio
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.55] uppercase">New Portfolio</h3>
                                            <Input label="Name" value={newPort.name} onChange={(e) => setNewPort({ ...newPort, name: e.target.value })} placeholder="Portfolio name" />
                                            <Input label="Initial Capital" type="number" value={newPort.initial_capital} onChange={(e) => setNewPort({ ...newPort, initial_capital: e.target.value })} placeholder="10000" />
                                            <Input label="Description" value={newPort.description} onChange={(e) => setNewPort({ ...newPort, description: e.target.value })} placeholder="Optional" />
                                            <div className="flex gap-3">
                                                <button onClick={() => { setShowNewForm(false); setNewPort({ name: '', initial_capital: '', description: '' }); }} className="flex-1 px-4 py-3 border border-white/[0.04] text-white/[0.22] hover:text-white/[0.50] hover:border-white/[0.10] text-[10px] font-sans tracking-[0.15em] uppercase transition-all duration-300">Cancel</button>
                                                <button onClick={handleCreatePortfolio} className="flex-1 px-4 py-3 border border-white/[0.06] text-white/[0.35] hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.04] text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-all duration-300">Create</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* List */}
                                {portfolios.map((p) => (
                                    <div key={p.id} className="bg-white/[0.015] border border-white/[0.03] p-6">
                                        {editingPortfolio?.id === p.id ? (
                                            <div className="space-y-4">
                                                <h3 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.55] uppercase">Edit Portfolio</h3>
                                                <Input label="Name" value={editingPortfolio.name} onChange={(e) => setEditingPortfolio({ ...editingPortfolio, name: e.target.value })} />
                                                <Input label="Initial Capital" type="number" value={String(editingPortfolio.initial_capital)} onChange={(e) => setEditingPortfolio({ ...editingPortfolio, initial_capital: Number(e.target.value) })} />
                                                <Input label="Description" value={editingPortfolio.description ?? ''} onChange={(e) => setEditingPortfolio({ ...editingPortfolio, description: e.target.value })} />
                                                <div className="flex gap-3">
                                                    <button onClick={() => setEditingPortfolio(null)} className="flex-1 px-4 py-3 border border-white/[0.04] text-white/[0.22] hover:text-white/[0.50] hover:border-white/[0.10] text-[10px] font-sans tracking-[0.15em] uppercase transition-all duration-300">Cancel</button>
                                                    <button onClick={handleUpdatePortfolio} className="flex-1 px-4 py-3 border border-white/[0.06] text-white/[0.35] hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.04] text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-all duration-300">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-[13px] font-sans font-medium text-white/[0.70] tracking-wide">{p.name}</h3>
                                                        {p.description && <p className="text-white/[0.28] text-[11px] mt-1">{p.description}</p>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setEditingPortfolio({ ...p, initial_capital: p.initial_capital })} className="p-1.5 text-white/[0.25] hover:text-white/70 hover:bg-white/[0.05] rounded-full transition-all duration-300">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-white/[0.25] hover:text-red-400/70 hover:bg-red-500/[0.08] rounded-full transition-all duration-300">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    {[
                                                        { label: 'Initial Capital', value: fmt$(p.initial_capital) },
                                                        { label: 'Current Capital', value: fmt$(p.current_capital) },
                                                        { label: 'Total Profit', value: `${fmt$(p.total_profit)} (${fmtPct((p.total_profit / p.initial_capital) * 100)})`, colored: true, profit: p.total_profit },
                                                        { label: 'Trades', value: String(p.total_trades) },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-white/[0.015] border border-white/[0.025] p-3">
                                                            <p className="text-[9px] text-white/[0.28] tracking-[0.2em] uppercase mb-1.5">{item.label}</p>
                                                            <p className={`text-[13px] font-mono font-light ${'profit' in item ? ((item as { profit: number }).profit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white/[0.65]'}`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {deleteConfirm === p.id && (
                                                    <div className="mt-4 space-y-3">
                                                        <div className="bg-red-500/[0.06] border border-red-500/15 p-4 flex items-start gap-3">
                                                            <AlertCircle className="text-red-400/70 shrink-0" size={16} />
                                                            <div>
                                                                <p className="text-[11px] text-red-400/80 font-medium mb-1">Delete this portfolio?</p>
                                                                <p className="text-[11px] text-white/[0.28]">All associated trades will become orphaned.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-white/[0.04] text-white/[0.22] hover:text-white/[0.50] hover:border-white/[0.10] text-[10px] font-sans tracking-[0.15em] uppercase transition-all duration-300">Cancel</button>
                                                            <button onClick={() => handleDeletePortfolio(p.id)} className="flex-1 px-4 py-2.5 bg-red-500/[0.10] text-red-400/80 border border-red-500/25 hover:bg-red-500/20 text-[10px] font-sans tracking-[0.15em] uppercase transition-all duration-300">Delete</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
}
