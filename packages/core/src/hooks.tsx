import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { ApiClient } from '@tc/api-client';
import type { CreateSavedStay, CreateTrip, CreateTripItem, StayType, UpdateTripDay } from '@tc/types';

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const c = useContext(ApiContext);
  if (!c) throw new Error('useApi must be used inside <ApiProvider>');
  return c;
}

export const keys = {
  destinations: ['destinations'] as const,
  attractions: (id: string, q?: string) => ['attractions', id, q ?? ''] as const,
  destAgencies: (id: string) => ['dest-agencies', id] as const,
  stays: (p: object) => ['stays', p] as const,
  offers: (token: string, p: object) => ['offers', token, p] as const,
  trips: ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  enrich: (id: string) => ['trip', id, 'enrich'] as const,
  tripAgencies: (id: string) => ['trip', id, 'agencies'] as const,
};

export function useDestinations() {
  const api = useApi();
  return useQuery({ queryKey: keys.destinations, queryFn: () => api.destinations.list(), staleTime: 10 * 60_000 });
}

export function useAttractions(destinationId: string | undefined, q?: string) {
  const api = useApi();
  return useQuery({
    queryKey: keys.attractions(destinationId ?? '', q),
    queryFn: () => api.destinations.attractions(destinationId!, q ? { q } : undefined),
    enabled: !!destinationId,
    staleTime: 30 * 60_000,
  });
}

export interface StaySearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  type: StayType;
  sort?: 'relevance' | 'lowest_price' | 'highest_rating';
  minPrice?: number;
  maxPrice?: number;
}

/** Live stay search. Prices are real-time, so results go stale after a few minutes. */
export function useStaySearch(p: StaySearchParams | null) {
  const api = useApi();
  return useQuery({
    queryKey: keys.stays(p ?? {}),
    queryFn: () => api.stays.search(p!),
    enabled: !!p,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    retry: (n, e) => n < 1 && (e as { status?: number }).status !== 429,
  });
}

export function useStayOffers(
  token: string | null,
  p: Omit<StaySearchParams, 'sort' | 'minPrice' | 'maxPrice'> & { tripId?: string },
) {
  const api = useApi();
  return useQuery({
    queryKey: keys.offers(token ?? '', p),
    queryFn: () => api.stays.offers(token!, p),
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: (n, e) => n < 1 && (e as { status?: number }).status !== 429,
  });
}

export function useTrips(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: keys.trips, queryFn: () => api.trips.list(), enabled });
}

export function useTrip(id: string | undefined) {
  const api = useApi();
  return useQuery({ queryKey: keys.trip(id ?? ''), queryFn: () => api.trips.get(id!), enabled: !!id });
}

export function useTripEnrichment(id: string | undefined, version?: string) {
  const api = useApi();
  return useQuery({
    queryKey: [...keys.enrich(id ?? ''), version],
    queryFn: () => api.trips.enrich(id!),
    enabled: !!id,
    staleTime: 30 * 60_000,
  });
}

export function useTripAgencies(id: string | undefined) {
  const api = useApi();
  return useQuery({ queryKey: keys.tripAgencies(id ?? ''), queryFn: () => api.trips.agencies(id!), enabled: !!id, staleTime: 60 * 60_000 });
}

export function useDestinationAgencies(destinationId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: keys.destAgencies(destinationId ?? ''),
    queryFn: () => api.destinations.agencies(destinationId!),
    enabled: !!destinationId,
    staleTime: 60 * 60_000,
  });
}

export function useCreateTrip() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTrip) => api.trips.create(body),
    onSuccess: (trip) => {
      qc.setQueryData(keys.trip(trip.id), trip);
      void qc.invalidateQueries({ queryKey: keys.trips });
    },
  });
}

export function useDeleteTrip() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.trips.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.trips }),
  });
}

/** Mutations that change a trip's contents; all refresh the trip afterwards. */
export function useTripMutations(tripId: string) {
  const api = useApi();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: keys.trip(tripId) });
  return {
    addItem: useMutation({
      mutationFn: ({ dayId, item }: { dayId: string; item: CreateTripItem }) => api.trips.addItem(tripId, dayId, item),
      onSuccess: refresh,
    }),
    removeItem: useMutation({ mutationFn: (itemId: string) => api.trips.removeItem(tripId, itemId), onSuccess: refresh }),
    moveItem: useMutation({
      mutationFn: ({ itemId, dayId }: { itemId: string; dayId: string }) =>
        api.trips.updateItem(tripId, itemId, { tripDayId: dayId }),
      onSuccess: refresh,
    }),
    reorder: useMutation({
      mutationFn: ({ dayId, itemIds }: { dayId: string; itemIds: string[] }) => api.trips.reorder(tripId, dayId, itemIds),
      onSuccess: refresh,
    }),
    updateDay: useMutation({
      mutationFn: ({ dayId, patch }: { dayId: string; patch: UpdateTripDay }) => api.trips.updateDay(tripId, dayId, patch),
      onSuccess: refresh,
    }),
    saveStay: useMutation({ mutationFn: (s: CreateSavedStay) => api.trips.saveStay(tripId, s), onSuccess: refresh }),
    removeStay: useMutation({ mutationFn: (id: string) => api.trips.removeStay(tripId, id), onSuccess: refresh }),
    setStatus: useMutation({
      mutationFn: (status: 'draft' | 'planned' | 'archived') => api.trips.update(tripId, { status }),
      onSuccess: refresh,
    }),
  };
}
