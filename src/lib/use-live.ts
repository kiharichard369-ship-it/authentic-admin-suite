// Tiny wrapper around useQuery so routes can swap a sync mock import for a
// live-from-DB read with one line. Falls back to the mock instantly while
// loading, then replaces with DB data once Supabase resolves.
//
//   const drivers = useLive(["delivery","drivers"], listDrivers, mockDrivers);
//
// When VITE_SUPABASE_URL is unset, the data-layer function returns the mock
// itself, so the query resolves immediately with the same shape.

import { useQuery } from "@tanstack/react-query";

export function useLive<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
  fallback: T,
): T {
  const { data } = useQuery({
    queryKey: key as unknown[],
    queryFn: fetcher,
    placeholderData: fallback,
    staleTime: 30_000,
  });
  return (data ?? fallback) as T;
}
