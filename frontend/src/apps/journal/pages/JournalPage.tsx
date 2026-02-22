/**
 * JournalPage – orphan/inactive trade management.
 * Shows trades without an active portfolio. Allows bulk reassignment.
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Select from '../components/ui/Select';
import { useOrphanTrades, usePortfolios, useUpdateTrade } from '../hooks/useJournalQueries';
import { useJournalStore } from '../store/useJournalStore';
import TradeViewModal from '../components/TradeViewModal';
import type { Trade } from '../types';

export default function JournalPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isOrphanMode = searchParams.get('orphan') === 'true';
    const isInactiveMode = searchParams.get('inactive') === 'true';

    const { data: orphanTrades = [], isLoading, refetch } = useOrphanTrades();
    const { data: portfolios = [] } = usePortfolios();
    const updateTrade = useUpdateTrade();

    const setSelectedTrade = useJournalStore((s) => s.setSelectedTrade);
    const setViewModalOpen = useJournalStore((s) => s.setViewModalOpen);

    const [reassignPortfolioId, setReassignPortfolioId] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [reassigning, setReassigning] = useState(false);

    const activePortfolios = portfolios.filter((p) => p.is_active);
    const trades = orphanTrades;

    const handleTradeClick = (trade: Trade) => {
        if (isOrphanMode || isInactiveMode) return;
        setSelectedTrade(trade);
        setViewModalOpen(true);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    };

    const selectAll = () => {
        setSelectedIds((p) => p.length === trades.length ? [] : trades.map((t) => t.id));
    };

    const handleReassign = async () => {
        if (!reassignPortfolioId || !selectedIds.length) return;
        setReassigning(true);
        try {
            for (const id of selectedIds) {
                const trade = trades.find((t) => t.id === id);
                if (!trade) continue;
                await updateTrade.mutateAsync({ id, data: { portfolio_id: reassignPortfolioId } });
            }
            setSelectedIds([]);
            setReassignPortfolioId('');
            refetch();
        } catch (err) {
            console.error('Reassign failed:', err);
        } finally {
            setReassigning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-t border-b border-bronze/50" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-surface border border-white/[0.06] p-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/journal')} className="flex items-center gap-2 px-3 py-2 text-white/[0.30] hover:text-bronze/70 border border-white/[0.06] hover:border-bronze/15 hover:bg-bronze/[0.04] transition-all duration-300">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-sans tracking-[0.15em] uppercase">Back</span>
                    </button>
                    <div className="w-px h-4 bg-white/[0.06]" />
                    <div>
                        <h1 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/[0.55] flex items-center gap-3 uppercase">
                            <AlertTriangle className="w-4 h-4 text-orange-400/70" />
                            {isOrphanMode ? 'Orphan Trades' : isInactiveMode ? 'Inactive Portfolio Trades' : 'Journal'}
                        </h1>
                        <p className="text-white/[0.25] text-[9px] mt-1 uppercase tracking-[0.2em]">
                            {trades.length} trades found
                        </p>
                    </div>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 text-white/[0.30] hover:text-bronze/70 border border-white/[0.06] hover:border-bronze/15 hover:bg-bronze/[0.04] transition-all duration-300">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-sans tracking-[0.2em] uppercase">Refresh</span>
                </button>
            </div>

            {/* Reassign panel */}
            {trades.length > 0 && (
                <Card className="border-orange-400/15 bg-orange-500/[0.03]">
                    <CardHeader>
                        <CardTitle className="text-[10px] font-sans tracking-[0.2em] flex items-center gap-2 uppercase text-orange-400/70">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Assign Portfolio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[9px] text-white/[0.28] mb-2 uppercase tracking-[0.18em] font-sans">Select Portfolio</label>
                                <Select
                                    value={reassignPortfolioId}
                                    onChange={setReassignPortfolioId}
                                    options={[
                                        { value: '', label: 'Choose portfolio...' },
                                        ...activePortfolios.map((p) => ({ value: p.id, label: p.name })),
                                    ]}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={selectAll} className="px-4 py-2 text-[9px] font-sans tracking-[0.18em] uppercase text-white/[0.30] hover:text-white/[0.60] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300">
                                    {selectedIds.length === trades.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                    onClick={handleReassign}
                                    disabled={!reassignPortfolioId || !selectedIds.length || reassigning}
                                    className="px-4 py-2 text-[9px] font-sans tracking-[0.18em] uppercase bg-orange-500/80 hover:bg-orange-500 text-black disabled:opacity-40 transition-all duration-300"
                                >
                                    {reassigning ? 'Assigning...' : `Assign (${selectedIds.length})`}
                                </button>
                            </div>
                        </div>
                        {selectedIds.length > 0 && (
                            <p className="text-[9px] text-white/[0.25] mt-3 uppercase tracking-[0.18em]">
                                {selectedIds.length} of {trades.length} selected
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Trades Table */}
            {trades.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-black/30 border-b border-white/[0.04]">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input type="checkbox" checked={selectedIds.length === trades.length && trades.length > 0} onChange={selectAll} className="rounded border-white/[0.15] bg-surface-highlight cursor-pointer" />
                                        </th>
                                        {['Date', 'Pair', 'Portfolio', 'Direction', 'Status', 'Risk', 'P&L', 'R'].map((h) => (
                                            <th key={h} className={`px-4 py-3 text-[9px] font-sans font-medium text-white/[0.28] uppercase tracking-[0.2em] ${h === 'Risk' || h === 'P&L' || h === 'R' ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {trades.map((trade) => (
                                        <tr
                                            key={trade.id}
                                            className="border-b border-white/[0.03] hover:bg-white/[0.025] cursor-pointer transition-all duration-500 group"
                                            onClick={() => handleTradeClick(trade)}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedIds.includes(trade.id)} onChange={() => toggleSelection(trade.id)} className="rounded border-white/[0.15]" />
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-white/[0.35] font-mono">{new Date(trade.date).toLocaleDateString('en-US')}</td>
                                            <td className="px-4 py-3 text-[11px] font-medium text-white/[0.65] tracking-wide uppercase group-hover:text-white/[0.85] transition-colors duration-500">{trade.pair}</td>
                                            <td className="px-4 py-3 text-[11px] text-white/[0.35] uppercase tracking-wide">{trade.portfolio_name || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] border ${trade.direction === 'Long' ? 'border-success/25 text-success-fg/80' : 'border-destructive/25 text-destructive-fg/80'
                                                    }`}>{trade.direction}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] border ${trade.status === 'TP' ? 'border-success/25 text-success-fg/80'
                                                        : trade.status === 'SL' ? 'border-destructive/25 text-destructive-fg/80'
                                                            : 'border-white/[0.10] text-white/[0.40]'
                                                    }`}>{trade.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-right text-white/[0.35] font-mono">${trade.risk_amount?.toFixed(2)}</td>
                                            <td className={`px-4 py-3 text-[11px] text-right font-mono font-medium ${(trade.profit_amount ?? 0) > 0 ? 'text-green-400' : (trade.profit_amount ?? 0) < 0 ? 'text-red-400' : 'text-white/[0.35]'
                                                }`}>
                                                {(trade.profit_amount ?? 0) > 0 ? '+' : ''}{trade.profit_amount?.toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-3 text-[11px] text-right font-mono font-medium ${(trade.profit_amount ?? 0) > 0 ? 'text-green-400' : (trade.profit_amount ?? 0) < 0 ? 'text-red-400' : 'text-white/[0.35]'
                                                }`}>
                                                {trade.risk_amount ? ((trade.profit_amount ?? 0) / trade.risk_amount).toFixed(2) : '0.00'}R
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-white/[0.22] text-[9px] uppercase tracking-[0.25em]">
                            No orphan trades found. Everything is properly assigned!
                        </p>
                    </CardContent>
                </Card>
            )}

            <TradeViewModal />
        </div>
    );
}
