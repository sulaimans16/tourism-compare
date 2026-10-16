import { formatDate, useDeleteTrip, useTrips } from '@tc/core';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, ErrorNote, Spinner } from '@/components/ui';
import { errorMessage } from '@/lib/utils';

export function TripsPage() {
  const trips = useTrips();
  const del = useDeleteTrip();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My trips</h1>
        <Link to="/"><Button><Plus className="h-4 w-4" /> New trip</Button></Link>
      </div>
      {trips.isLoading && <Spinner />}
      {trips.error && <ErrorNote onRetry={() => trips.refetch()}>{errorMessage(trips.error)}</ErrorNote>}
      {trips.data?.length === 0 && <p className="text-stone-500">No trips yet. Pick some destinations to start.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {trips.data?.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <Link to={`/trips/${t.id}`} className="min-w-0 flex-1">
              <div className="font-semibold">{t.title}</div>
              <div className="flex items-center gap-1 text-sm text-stone-500">
                <CalendarDays className="h-4 w-4" /> {formatDate(t.startDate)} – {formatDate(t.endDate)} · {t.adults + t.children} travellers
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Badge tone={t.status === 'planned' ? 'green' : 'default'}>{t.status}</Badge>
              <Button size="sm" variant="ghost" aria-label="Delete trip" onClick={() => confirm(`Delete "${t.title}"?`) && del.mutate(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
