import { formatDate, useDeleteTrip, useTrips } from '@tc/core';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, ErrorNote, Skeleton } from '@/components/ui';
import { errorMessage } from '@/lib/utils';

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;

export function TripsPage() {
  const trips = useTrips();
  const del = useDeleteTrip();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{trips.data ? `${trips.data.length} saved` : 'Saved itineraries'}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">My trips</h1>
        </div>
        <Link to="/">
          <Button>
            <Plus className="h-4 w-4" /> New trip
          </Button>
        </Link>
      </div>
      {trips.error && <ErrorNote onRetry={() => trips.refetch()}>{errorMessage(trips.error)}</ErrorNote>}
      {trips.data?.length === 0 && (
        <EmptyState title="No trips yet">
          Pick destinations on the <Link to="/" className="font-semibold text-accent hover:underline">Explore</Link> page and build your first itinerary.
        </EmptyState>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {trips.isLoading && Array.from({ length: 3 }, (_, i) => <li key={i} className="p-4"><Skeleton className="h-10 w-2/3" /></li>)}
        {trips.data?.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
            <Link to={`/trips/${t.id}`} className="group min-w-0 flex-1">
              <p className="eyebrow">
                {formatDate(t.startDate)} – {formatDate(t.endDate)} · {days(t.startDate, t.endDate)} days · {t.adults + t.children} travellers
              </p>
              <p className="mt-0.5 flex items-center gap-2 font-display text-lg font-bold group-hover:text-accent">
                {t.title} <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
            <Badge tone={t.status === 'planned' ? 'good' : 'default'}>{t.status === 'planned' ? 'Final' : 'Draft'}</Badge>
            {confirming === t.id ? (
              <span className="flex items-center gap-2">
                <span className="text-sm text-muted">Delete this trip?</span>
                <Button size="sm" variant="danger" loading={del.isPending} onClick={() => del.mutate(t.id, { onSettled: () => setConfirming(null) })}>
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" aria-label={`Delete ${t.title}`} onClick={() => setConfirming(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
