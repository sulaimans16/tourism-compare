import { addDays, useAttractions, useDestinationAgencies } from '@tc/core';
import { useApi } from '@tc/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AgencyList } from '@/components/AgencyList';
import { AttractionsList } from '@/components/AttractionsList';
import { StaysPanel } from '@/components/StaysPanel';
import { PlacesMap } from '@/components/maps/PlacesMap';
import { Card, ErrorNote, Input, Label, Spinner, Tabs } from '@/components/ui';
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

  if (dest.isLoading) return <Spinner />;
  if (dest.error || !dest.data) return <ErrorNote>{errorMessage(dest.error) || 'Destination not found'}</ErrorNote>;
  const d = dest.data;

  return (
    <div className="space-y-5">
      <div className="relative h-56 overflow-hidden rounded-2xl bg-stone-200">
        <img src={api.destinations.photoUrl(d.id)} alt={d.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 p-6 text-white">
          <h1 className="text-3xl font-bold">{d.name}</h1>
          <p className="text-sm">{d.region} · {d.state}</p>
        </div>
      </div>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'attractions', label: 'Things to do' }, { id: 'stays', label: 'Stays & prices' }, { id: 'agencies', label: 'Agencies' }]} />

      {tab === 'attractions' && (
        <>
          <PlacesMap
            center={d}
            points={(attractions.data?.places ?? [])
              .filter((p) => p.lat != null && p.lng != null)
              .map((p, i) => ({ id: p.placeId, lat: p.lat!, lng: p.lng!, title: p.name, label: String(i + 1), href: p.googleMapsUri }))}
          />
          <AttractionsList destinationId={d.id} />
        </>
      )}
      {tab === 'stays' && (
        <>
          <Card className="flex flex-wrap gap-3 p-4">
            <div><Label>Check-in</Label><Input type="date" min={today()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} /></div>
            <div><Label>Check-out</Label><Input type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div>
            <div className="w-24"><Label>Adults</Label><Input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} /></div>
          </Card>
          <StaysPanel destinationId={d.id} destinationName={d.name} checkIn={checkIn} checkOut={checkOut} adults={adults} children={0} />
        </>
      )}
      {tab === 'agencies' && (
        <>
          {agencies.isLoading && <Spinner />}
          {agencies.error && <ErrorNote onRetry={() => agencies.refetch()}>{errorMessage(agencies.error)}</ErrorNote>}
          {agencies.data && <AgencyList group={agencies.data} />}
        </>
      )}
    </div>
  );
}
