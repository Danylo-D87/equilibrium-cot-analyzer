import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 min — COT data updates weekly
            gcTime: 30 * 60 * 1000,         // 30 min cache
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});
