/**
 * TanStack Query hooks for the Journal module.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
    fetchTrades,
    fetchTrade,
    createTrade,
    updateTrade,
    deleteTrade,
    fetchOrphanTrades,
    fetchPortfolios,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    fetchMetrics,
    fetchEquityCurve,
    fetchAssetsExposure,
    fetchAlphaCurve,
    fetchDrawdown,
    fetchRollingMetrics,
    fetchDailyReturns,
    fetchRollingWinRate,
    fetchRMultipleDistribution,
    fetchRiskAdjustedComparison,
    fetchNAVHistory,
    fetchRollingInformationRatio,
    fetchExpectedVsActualReturn,
    fetchComparativeDrawdown,
    fetchNAVvsHighWatermark,
    fetchRollingTrackingError,
    fetchSettings,
    updateSettings,
    fetchEnumTypes,
    fetchEnumStyles,
    fetchEnumDirections,
    fetchEnumStatuses,
    uploadTradeImage,
    deleteTradeImage,
    reorderTradeImages,
    updateImageCaption,
} from '../api/journalApi';
import type {
    TradeCreate,
    TradeUpdate,
    TradeFilters,
    PortfolioCreate,
    PortfolioUpdate,
    JournalSettingsUpdate,
} from '../types';

// ── Keys ────────────────────────────────────────────────

const K = {
    trades: (f?: TradeFilters) => ['journal', 'trades', f] as const,
    trade: (id: string) => ['journal', 'trade', id] as const,
    orphans: ['journal', 'orphans'] as const,
    portfolios: ['journal', 'portfolios'] as const,
    metrics: (f?: TradeFilters) => ['journal', 'metrics', f] as const,
    equity: (f?: TradeFilters) => ['journal', 'equity', f] as const,
    exposure: (f?: TradeFilters) => ['journal', 'exposure', f] as const,
    chart: (name: string, f?: TradeFilters) => ['journal', 'chart', name, f] as const,
    settings: ['journal', 'settings'] as const,
    enums: ['journal', 'enums'] as const,
};

// ── Trades ──────────────────────────────────────────────

export function useTrades(filters?: TradeFilters) {
    return useQuery({
        queryKey: K.trades(filters),
        queryFn: () => fetchTrades(filters),
        staleTime: 30_000,
        refetchOnMount: 'always',
        placeholderData: keepPreviousData,
    });
}

export function useTrade(id: string) {
    return useQuery({
        queryKey: K.trade(id),
        queryFn: () => fetchTrade(id),
        enabled: !!id,
    });
}

export function useOrphanTrades() {
    return useQuery({
        queryKey: K.orphans,
        queryFn: fetchOrphanTrades,
    });
}

export function useCreateTrade() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: TradeCreate) => createTrade(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

export function useUpdateTrade() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: TradeUpdate }) => updateTrade(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

export function useDeleteTrade() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTrade(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

// ── Images ──────────────────────────────────────────────

export function useUploadImage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tradeId, file }: { tradeId: string; file: File }) =>
            uploadTradeImage(tradeId, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

export function useDeleteImage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tradeId, imageId }: { tradeId: string; imageId: string }) =>
            deleteTradeImage(tradeId, imageId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

export function useReorderImages() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tradeId, imageIds }: { tradeId: string; imageIds: string[] }) =>
            reorderTradeImages(tradeId, imageIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

export function useUpdateImageCaption() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ imageId, caption }: { imageId: string; caption: string | null }) =>
            updateImageCaption(imageId, caption),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

// ── Portfolios ──────────────────────────────────────────

export function usePortfolios() {
    return useQuery({
        queryKey: K.portfolios,
        queryFn: fetchPortfolios,
        staleTime: 30_000,
    });
}

export function useCreatePortfolio() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: PortfolioCreate) => createPortfolio(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: K.portfolios });
        },
    });
}

export function useUpdatePortfolio() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PortfolioUpdate }) => updatePortfolio(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: K.portfolios });
        },
    });
}

export function useDeletePortfolio() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deletePortfolio(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journal'] });
        },
    });
}

// ── Metrics & Equity ────────────────────────────────────

export function useMetrics(filters?: TradeFilters) {
    return useQuery({
        queryKey: K.metrics(filters),
        queryFn: () => fetchMetrics(filters),
        staleTime: 30_000,
        refetchOnMount: 'always',
        placeholderData: keepPreviousData,
    });
}

export function useEquityCurve(filters?: TradeFilters) {
    return useQuery({
        queryKey: K.equity(filters),
        queryFn: () => fetchEquityCurve(filters),
        staleTime: 30_000,
        refetchOnMount: 'always',
        placeholderData: keepPreviousData,
    });
}

export function useAssetsExposure(filters?: TradeFilters) {
    return useQuery({
        queryKey: K.exposure(filters),
        queryFn: () => fetchAssetsExposure(filters),
        staleTime: 30_000,
        refetchOnMount: 'always',
        placeholderData: keepPreviousData,
    });
}

// ── Charts ──────────────────────────────────────────────

export function useAlphaCurve(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('alpha', f), queryFn: () => fetchAlphaCurve(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useDrawdownChart(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('drawdown', f), queryFn: () => fetchDrawdown(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRollingMetricsChart(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('rolling', f), queryFn: () => fetchRollingMetrics(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useDailyReturns(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('dailyReturns', f), queryFn: () => fetchDailyReturns(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRollingWinRate(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('winRate', f), queryFn: () => fetchRollingWinRate(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRMultipleDistribution(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('rMultiple', f), queryFn: () => fetchRMultipleDistribution(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRiskAdjustedComparison(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('riskAdj', f), queryFn: () => fetchRiskAdjustedComparison(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useNAVHistory(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('navHistory', f), queryFn: () => fetchNAVHistory(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRollingInformationRatio(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('rollingIR', f), queryFn: () => fetchRollingInformationRatio(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useExpectedVsActualReturn(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('expVsActual', f), queryFn: () => fetchExpectedVsActualReturn(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useComparativeDrawdown(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('compDD', f), queryFn: () => fetchComparativeDrawdown(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useNAVvsHighWatermark(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('navHWM', f), queryFn: () => fetchNAVvsHighWatermark(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

export function useRollingTrackingError(f?: TradeFilters, enabled = true) {
    return useQuery({ queryKey: K.chart('rollingTE', f), queryFn: () => fetchRollingTrackingError(f), placeholderData: keepPreviousData, staleTime: 30_000, enabled });
}

// ── Settings ────────────────────────────────────────────

export function useSettings() {
    return useQuery({
        queryKey: K.settings,
        queryFn: fetchSettings,
    });
}

export function useUpdateSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: JournalSettingsUpdate) => updateSettings(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: K.settings });
        },
    });
}

// ── Enums ────────────────────────────────────────────────

export function useEnums() {
    return useQuery({
        queryKey: K.enums,
        queryFn: async () => {
            const [types, styles, directions, statuses] = await Promise.all([
                fetchEnumTypes(),
                fetchEnumStyles(),
                fetchEnumDirections(),
                fetchEnumStatuses(),
            ]);
            return { types, styles, directions, statuses };
        },
        staleTime: Infinity,
    });
}


