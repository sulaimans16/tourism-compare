import { useAttractions } from '@tc/core';
import type { Place } from '@tc/types';
import { MapPin, Plus, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { errorMessage } from '@/lib/utils';
import { Button, Card, ErrorNote, Input, Spinner } from './ui';

export function AttractionsList({ destinationId, onAdd, compact }: { destinationId: string; onAdd?: (p: Place) => void; compact?: boolean }) {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useAttractions(destinationId, q || undefined);

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
        <Input placeholder="Search temples, beaches, cafés, viewpoints…" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit" variant="outline" aria-label="Search"><Search className="h-4 w-4" /></Button>
      </form>
      {isLoading && <Spinner />}
      {error && <ErrorNote onRetry={() => refetch()}>{errorMessage(error)}</ErrorNote>}
      <div className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'} data-testid="attractions">
        {data?.places.map((p) => (
          <Card key={p.placeId} className={`flex overflow-hidden ${compact ? 'items-center' : 'flex-col'}`}>
            {p.photoUrl && (
              <img src={p.photoUrl} alt={p.name} loading="lazy" className={compact ? 'h-16 w-16 object-cover' : 'h-36 w-full object-cover'} />
            )}
            <div className="flex flex-1 items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  {p.rating != null && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating} ({p.userRatingCount})</span>}
                  {p.googleMapsUri && <a href={p.googleMapsUri} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:underline"><MapPin className="h-3 w-3" />Map</a>}
                </div>
                {!compact && p.editorialSummary && <p className="mt-1 line-clamp-2 text-xs text-stone-600">{p.editorialSummary}</p>}
              </div>
              {onAdd && <Button size="sm" variant="outline" onClick={() => onAdd(p)} aria-label={`Add ${p.name}`}><Plus className="h-4 w-4" /></Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
