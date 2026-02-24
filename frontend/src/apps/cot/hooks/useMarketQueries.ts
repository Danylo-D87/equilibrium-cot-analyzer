// =====================================================
// React Query hooks for COT data fetching
// =====================================================

import { useQuery } from '@tanstack/react-query';
import { fetchMarkets, fetchMarketData, fetchScreener, fetchGroups, fetchScreenerV2 } from '@/lib/api';

/**
 * Fetch market list for a given report type + subtype.
 * Cached for 5 minutes (default staleTime).
 */
export function useMarkets(reportType: string, subtype: string) {
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
export function useMarketData(reportType: string, subtype: string, code: string | null) {
    return useQuery({
        queryKey: ['marketData', reportType, subtype, code],
        queryFn: () => fetchMarketData(reportType, subtype, code!),
        enabled: !!code,
    });
}

/**
 * Fetch screener data + group definitions in parallel.
 * Returns { data, groups, isLoading, error }.
 */
export function useScreenerData(reportType: string, subtype: string) {
    const screener = useQuery({
        queryKey: ['screener', reportType, subtype],
        queryFn: () => fetchScreener(reportType, subtype),
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

/**
 * Fetch all markets in a single request using the screener-v2 endpoint.
 * Each row uses its auto-detected primary report type — no report-type
 * filter needed.
 */
export function useAllScreenerData() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['screener-v2'],
        queryFn: () => fetchScreenerV2('fo'),
        staleTime: 5 * 60_000,
    });

    return {
        screenerData: data ?? null,
        isLoading,
        error,
        refetch,
    };
}
