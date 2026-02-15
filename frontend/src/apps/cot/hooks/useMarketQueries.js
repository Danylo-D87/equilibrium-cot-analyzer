// =====================================================
// React Query hooks for COT data fetching
// =====================================================

import { useQuery } from '@tanstack/react-query';
import { fetchMarkets, fetchMarketData, fetchScreener, fetchGroups } from '@/lib/api';

/**
 * Fetch market list for a given report type + subtype.
 * Cached for 5 minutes (default staleTime).
 */
export function useMarkets(reportType, subtype) {
    return useQuery({
        queryKey: ['markets', reportType, subtype],
        queryFn: () => fetchMarkets(reportType, subtype),
        placeholderData: (prev) => prev, // keep old data while fetching new
    });
}

/**
 * Fetch full market data (weeks, stats, prices).
 * Only enabled when a market code is provided.
 */
export function useMarketData(reportType, subtype, code) {
    return useQuery({
        queryKey: ['marketData', reportType, subtype, code],
        queryFn: () => fetchMarketData(reportType, subtype, code),
        enabled: !!code,
    });
}

/**
 * Fetch screener data + group definitions in parallel.
 * Returns { data, groups, isLoading, error }.
 */
export function useScreenerData(reportType, subtype) {
    const screener = useQuery({
        queryKey: ['screener', reportType, subtype],
        queryFn: () => fetchScreener(reportType, subtype),
        // Backend now returns { items, total, limit, offset }
        select: (data) => data?.items ?? data,
    });

    const groupsQuery = useQuery({
        queryKey: ['groups', reportType],
        queryFn: () => fetchGroups(reportType),
        placeholderData: (prev) => prev,
    });

    return {
        screenerData: screener.data ?? null,
        groups: groupsQuery.data ?? [],
        isLoading: screener.isLoading || groupsQuery.isLoading,
        error: screener.error || groupsQuery.error,
        refetch: screener.refetch,
    };
}
