import { addDays, nightsBetween, useApi, useAttractions, useDestinationAgencies } from '@tc/core';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AgencyList } from '@/components/AgencyList';
import { AttractionsList } from '@/components/AttractionsList';
import { PlacesMap } from '@/components/maps/PlacesMap';
import { StaysPanel } from '@/components/StaysPanel';
import { ErrorNote, Input, Label, Skeleton, Spinner, Tabs } from '@/components/ui';
import { tamilName } from '@/lib/tamil';
import { errorMessage } from '@/lib/utils';

type Tab = 'attractions' | 'stays' | 'agencies';
const today = () => new Date().toISOString().slice(0, 10);

export function DestinationPage() {
  const { id = '' } = useParams();
  const api = useApi();
  const dest = useQuery({ queryKey: ['destination', id], queryFn: () => api.destinations.get(id) });
  const [tab, setTab] = useState<Tab>('attractions');
  const [checkIn, setCheckIn] = useState(addDays(today(), 14));
  const [checkOut, setCheckOut] = useState(addDays(today(), 16));
  const [adults, setAdults] = useState(2);
  const agencies = useDestinationAgencies(tab === 'agencies' ? id : undefined);
  const attractions = useAttractions(tab === 'attractions' ? id : undefined);

  if (dest.isLoading) return <Skeleton className="h-64 w-full" />;
  if (dest.error || !dest.data) return <ErrorNote>{errorMessage(dest.error) || 'Destination not found'}</ErrorNote>;
  const d = dest.data;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All destinations
      </Link>
      <header className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-end">
        <div>
          <p className="eyebrow">
            {d.region} · {d.state} · {d.lat.toFixed(2)}°N {d.lng.toFixed(2)}°E
          </p>
          <h1 className="mt-2 text-5xl font-extrabold leading-none sm:text-6xl">{d.name}</h1>
          <p className="mt-2 text-2xl text-muted" lang="ta">
            {tamilName(d.id)}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {d.tags.map((t) => (
              <span key={t} className="rounded border border-line px-2 py-0.5 text-sm text-muted">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="aspect-[16/9] overflow-hidden rounded-xl bg-sunken">
          <img src={api.destinations.photoUrl(d.id)} alt={d.name} className="h-full w-full object-cover" />
        </div>
      </header>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'attractions', label: 'Things to do' },
          { id: 'stays', label: 'Stays & prices' },
          { id: 'agencies', label: 'Agencies' },
        ]}
      />

      {tab === 'attractions' && (
        <div className="space-y-6">
          <PlacesMap
            center={d}
            points={(attractions.data?.places ?? [])
              .filter((p) => p.lat != null && p.lng != null)
              .map((p, i) => ({ id: p.placeId, lat: p.lat!, lng: p.lng!, title: p.name, label: String(i + 1), href: p.googleMapsUri }))}
          />
          <AttractionsList destinationId={d.id} />
        </div>
      )}
      {tab === 'stays' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="dest-in">Check-in</Label>
              <Input
                id="dest-in"
                type="date"
                min={today()}
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                }}
              />
            </div>
            <div>
              <Label htmlFor="dest-out">Check-out · {nightsBetween(checkIn, checkOut)} nights</Label>
              <Input id="dest-out" type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div className="w-24">
              <Label htmlFor="dest-adults">Adults</Label>
              <Input id="dest-adults" type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          <StaysPanel destinationId={d.id} destinationName={d.name} checkIn={checkIn} checkOut={checkOut} adults={adults} children={0} />
        </div>
      )}
      {tab === 'agencies' && (
        <>
          {agencies.isLoading && <Spinner label="Finding local operators…" />}
          {agencies.error && <ErrorNote onRetry={() => agencies.refetch()}>{errorMessage(agencies.error)}</ErrorNote>}
          {agencies.data && <AgencyList group={agencies.data} />}
        </>
      )}
    </div>
  );
}
