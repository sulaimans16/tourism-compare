import { useAttractions } from '@tc/core';
import type { Place } from '@tc/types';
import { MapPin, Plus, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { cn, errorMessage } from '@/lib/utils';
import { Button, EmptyState, ErrorNote, Input, Skeleton } from './ui';

const typeLabel = (t: string | null) => (t ? t.replace(/_/g, ' ') : null);

export function AttractionsList({ destinationId, onAdd, compact }: { destinationId: string; onAdd?: (p: Place) => void; compact?: boolean }) {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useAttractions(destinationId, q || undefined);

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
        }}
      >
        <Input aria-label="Search places" placeholder="Temples, beaches, waterfalls, filter coffee…" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit" variant="outline" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {error && <ErrorNote onRetry={() => refetch()}>{errorMessage(error)}</ErrorNote>}
      {data && data.places.length === 0 && <EmptyState title="Nothing found">Try a broader search.</EmptyState>}
      <div className={compact ? 'divide-y divide-line rounded-lg border border-line bg-surface' : 'grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3'} data-testid="attractions">
        {isLoading && Array.from({ length: compact ? 4 : 6 }, (_, i) => <Skeleton key={i} className={compact ? 'm-3 h-12' : 'aspect-[3/2] w-full'} />)}
        {data?.places.map((p) =>
          compact ? (
            <div key={p.placeId} className="flex items-center gap-3 p-2.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-sunken">
                {p.photoUrl && <img src={p.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{p.name}</p>
                <Meta p={p} />
              </div>
              {onAdd && (
                <Button size="sm" variant="outline" onClick={() => onAdd(p)} aria-label={`Add ${p.name}`}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <article key={p.placeId}>
              <div className="aspect-[3/2] overflow-hidden rounded-lg bg-sunken">
                {p.photoUrl && <img src={p.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-sans text-[17px] font-bold leading-snug">{p.name}</h3>
                  <Meta p={p} />
                  {p.editorialSummary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.editorialSummary}</p>}
                </div>
                {onAdd && (
                  <Button size="sm" variant="outline" onClick={() => onAdd(p)} aria-label={`Add ${p.name}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
          ),
        )}
      </div>
    </div>
  );
}

function Meta({ p }: { p: Place }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
      {p.rating != null && (
        <span className="num inline-flex items-center gap-1 font-mono text-[13px]">
          <Star className="h-3.5 w-3.5 fill-highlight text-highlight" aria-hidden />
          {p.rating} <span>({(p.userRatingCount ?? 0).toLocaleString('en-IN')})</span>
        </span>
      )}
      {typeLabel(p.primaryType) && <span className={cn('capitalize')}>{typeLabel(p.primaryType)}</span>}
      {p.googleMapsUri && (
        <a href={p.googleMapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
          <MapPin className="h-3.5 w-3.5" /> Map
        </a>
      )}
    </div>
  );
}
