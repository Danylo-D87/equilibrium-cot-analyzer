import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 60 * 1000,     // 60 min — COT data updates weekly, no need to refetch often
            gcTime: 4 * 60 * 60 * 1000,    // 4 hr garbage collection
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});
