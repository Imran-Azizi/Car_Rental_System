'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,  // 2 min — serve from cache on repeated visits
        gcTime: 10 * 60 * 1000,    // 10 min — keep in memory after unused
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
