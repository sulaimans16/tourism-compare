import {
  formatDate,
  formatDistance,
  formatDuration,
  formatInr,
  stayWindow,
  useDestinations,
  useTrip,
  useTripAgencies,
  useTripEnrichment,
  useTripMutations,
} from '@tc/core';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DayWeather, Leg, TripDay, TripDetail, TripItem } from '@tc/types';
import { Car, CheckCircle2, CloudSun, ExternalLink, GripVertical, Hotel, Printer, StickyNote, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AgencyList } from '@/components/AgencyList';
import { AttractionsList } from '@/components/AttractionsList';
import { StaysPanel } from '@/components/StaysPanel';
import { Badge, Button, Card, ErrorNote, Input, Select, Spinner, Tabs } from '@/components/ui';
import { errorMessage } from '@/lib/utils';

type Tab = 'itinerary' | 'stays' | 'summary';

export function TripPage() {
  const { id = '' } = useParams();
  const trip = useTrip(id);
  const [tab, setTab] = useState<Tab>('itinerary');

  if (trip.isLoading) return <Spinner />;
  if (trip.error || !trip.data) return <ErrorNote onRetry={() => trip.refetch()}>{errorMessage(trip.error) || 'Trip not found'}</ErrorNote>;
  const t = trip.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-stone-500">
            {formatDate(t.startDate)} – {formatDate(t.endDate)} · {t.days.length} days · {t.adults} adults
            {t.children ? `, ${t.children} children` : ''}
          </p>
        </div>
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'itinerary', label: '1. Itinerary' },
            { id: 'stays', label: '2. Stays' },
            { id: 'summary', label: '3. Summary & agencies' },
          ]}
        />
      </div>
      {tab === 'itinerary' && <ItineraryTab trip={t} />}
      {tab === 'stays' && <StaysTab trip={t} />}
      {tab === 'summary' && <SummaryTab trip={t} />}
    </div>
  );
}

// ---------------------------------------------------------------- Itinerary

function ItineraryTab({ trip }: { trip: TripDetail }) {
  const [activeDayId, setActiveDayId] = useState(trip.days[0]?.id);
  const activeDay = trip.days.find((d) => d.id === activeDayId) ?? trip.days[0];
  const m = useTripMutations(trip.id);
  const version = useMemo(() => trip.days.map((d) => d.items.map((i) => i.id).join(',')).join('|'), [trip]);
  const enrich = useTripEnrichment(trip.id, version);
  const destinations = useDestinations();
  const destName = (id: string) => destinations.data?.find((d) => d.id === id)?.name ?? id;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {trip.days.map((day, idx) => {
          const e = enrich.data?.days.find((x) => x.tripDayId === day.id);
          return (
            <DayCard
              key={day.id}
              index={idx}
              day={day}
              allDays={trip.days}
              active={day.id === activeDay?.id}
              onActivate={() => setActiveDayId(day.id)}
              weather={e?.weather ?? null}
              legs={e?.legs ?? []}
              destinations={destinations.data ?? []}
              tripId={trip.id}
            />
          );
        })}
        {m.reorder.error && <ErrorNote>{errorMessage(m.reorder.error)}</ErrorNote>}
      </div>
      {activeDay && (
        <aside className="no-print space-y-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="text-sm text-stone-500">
            Adding to <b>{formatDate(activeDay.dayDate)}</b> in <b>{destName(activeDay.destinationId)}</b>
          </div>
          <AttractionsList
            compact
            destinationId={activeDay.destinationId}
            onAdd={(p) =>
              m.addItem.mutate({
                dayId: activeDay.id,
                item: { kind: 'attraction', googlePlaceId: p.placeId, title: p.name, lat: p.lat, lng: p.lng, meta: { googleMapsUri: p.googleMapsUri, rating: p.rating } },
              })
            }
          />
        </aside>
      )}
    </div>
  );
}

function DayCard(props: {
  index: number;
  day: TripDay;
  allDays: TripDay[];
  active: boolean;
  onActivate: () => void;
  weather: DayWeather | null;
  legs: Leg[];
  destinations: { id: string; name: string }[];
  tripId: string;
}) {
  const { day } = props;
  const m = useTripMutations(props.tripId);
  const [note, setNote] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [order, setOrder] = useState<string[] | null>(null);
  const items = order ? order.map((id) => day.items.find((i) => i.id === id)).filter((i): i is TripItem => !!i) : day.items;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    setOrder(next);
    m.reorder.mutate({ dayId: day.id, itemIds: next }, { onSettled: () => setOrder(null) });
  };

  return (
    <Card className={`p-4 ${props.active ? 'ring-2 ring-brand-500' : ''}`} onClick={props.onActivate} data-testid={`day-${props.index}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase text-brand-600">Day {props.index + 1}</div>
          <div className="font-semibold">{formatDate(day.dayDate, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div className="flex items-center gap-2">
          {props.weather ? (
            <Badge tone="blue" title="Open-Meteo forecast">
              <CloudSun className="h-3 w-3" /> {props.weather.summary} · {Math.round(props.weather.tempMinC ?? 0)}–{Math.round(props.weather.tempMaxC ?? 0)}°C
              {props.weather.precipitationProbability != null && ` · ${props.weather.precipitationProbability}% rain`}
            </Badge>
          ) : (
            <Badge title="Forecast is available up to 16 days ahead">No forecast yet</Badge>
          )}
          <Select
            className="no-print h-8"
            value={day.destinationId}
            onChange={(e) => m.updateDay.mutate({ dayId: day.id, patch: { destinationId: e.target.value } })}
            onClick={(e) => e.stopPropagation()}
          >
            {props.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className="mt-3 space-y-1">
            {items.length === 0 && <li className="rounded-lg border border-dashed p-4 text-center text-sm text-stone-400">Select this day, then add places from the panel →</li>}
            {items.map((item, i) => {
              const leg = props.legs.find((l) => l.toItemId === item.id);
              return (
                <li key={item.id}>
                  {i > 0 && leg && leg.durationSeconds != null && (
                    <div className="flex items-center gap-1 py-1 pl-8 text-xs text-stone-500">
                      <Car className="h-3 w-3" /> {formatDuration(leg.durationSeconds)} · {formatDistance(leg.distanceMeters)}
                    </div>
                  )}
                  <SortableItem item={item} days={props.allDays} currentDayId={day.id} tripId={props.tripId} />
                </li>
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>

      <form
        className="no-print mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          m.addItem.mutate({ dayId: day.id, item: { kind: 'note', title: note.trim() } });
          setNote('');
        }}
      >
        <Input className="h-8" placeholder="Add a note (e.g. 'early start for sunrise')" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button size="sm" variant="outline" type="submit"><StickyNote className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}

function SortableItem({ item, days, currentDayId, tripId }: { item: TripItem; days: TripDay[]; currentDayId: string; tripId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const m = useTripMutations(tripId);
  const mapsUri = (item.meta as { googleMapsUri?: string }).googleMapsUri;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-lg border bg-stone-50 p-2"
    >
      <button className="no-print cursor-grab text-stone-400" {...attributes} {...listeners} aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      {item.kind === 'note' ? <StickyNote className="h-4 w-4 text-amber-500" /> : item.kind === 'stay' ? <Hotel className="h-4 w-4" /> : null}
      <span className={`flex-1 text-sm ${item.kind === 'note' ? 'italic text-stone-600' : 'font-medium'}`}>{item.title}</span>
      {mapsUri && <a href={mapsUri} target="_blank" rel="noreferrer" className="no-print text-stone-400 hover:text-stone-700"><ExternalLink className="h-4 w-4" /></a>}
      <Select
        className="no-print h-7 text-xs"
        value={currentDayId}
        onChange={(e) => m.moveItem.mutate({ itemId: item.id, dayId: e.target.value })}
        aria-label="Move to day"
      >
        {days.map((d, i) => <option key={d.id} value={d.id}>Day {i + 1}</option>)}
      </Select>
      <button className="no-print text-stone-400 hover:text-red-600" onClick={() => m.removeItem.mutate(item.id)} aria-label={`Remove ${item.title}`}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Stays

function StaysTab({ trip }: { trip: TripDetail }) {
  const destinations = useDestinations();
  const m = useTripMutations(trip.id);
  const destIds = [...new Set(trip.days.map((d) => d.destinationId))];
  const [destId, setDestId] = useState(destIds[0]!);
  const win = stayWindow(trip.days, destId);
  const dest = destinations.data?.find((d) => d.id === destId);

  return (
    <div className="space-y-4">
      {trip.stays.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">Saved stays</h3>
          <SavedStays trip={trip} onRemove={(id) => m.removeStay.mutate(id)} />
        </Card>
      )}
      <div className="flex flex-wrap gap-2">
        {destIds.map((id) => (
          <Button key={id} size="sm" variant={id === destId ? 'secondary' : 'outline'} onClick={() => setDestId(id)}>
            {destinations.data?.find((d) => d.id === id)?.name ?? id}
          </Button>
        ))}
      </div>
      {win && dest && (
        <StaysPanel
          key={destId}
          destinationId={destId}
          destinationName={dest.name}
          checkIn={win.checkIn}
          checkOut={win.checkOut}
          adults={trip.adults}
          children={trip.children}
          tripId={trip.id}
          onSave={({ property, offer, type }) =>
            m.saveStay.mutateAsync({
              destinationId: destId,
              propertyToken: property.propertyToken,
              name: property.name,
              propertyType: type,
              checkIn: win.checkIn,
              checkOut: win.checkOut,
              chosenPlatform: offer?.platform ?? null,
              priceAtSaveInr: offer?.totalInr ?? property.lowestTotalInr,
              deepLink: offer?.deepLink ?? property.link,
            })
          }
        />
      )}
    </div>
  );
}

function SavedStays({ trip, onRemove }: { trip: TripDetail; onRemove?: (id: string) => void }) {
  return (
    <ul className="divide-y">
      {trip.stays.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-stone-500">
              {formatDate(s.checkIn)} → {formatDate(s.checkOut)}
              {s.chosenPlatform && ` · ${formatInr(s.priceAtSaveInr)} on ${s.chosenPlatform} (when saved)`}
            </div>
          </div>
          <div className="no-print flex gap-2">
            {s.deepLink && (
              <a href={s.deepLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm">Book on {s.chosenPlatform ?? 'site'} <ExternalLink className="h-3 w-3" /></Button>
              </a>
            )}
            {onRemove && <Button size="sm" variant="ghost" onClick={() => onRemove(s.id)} aria-label="Remove stay"><Trash2 className="h-4 w-4" /></Button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Summary

function SummaryTab({ trip }: { trip: TripDetail }) {
  const agencies = useTripAgencies(trip.id);
  const destinations = useDestinations();
  const m = useTripMutations(trip.id);
  const destName = (id: string) => destinations.data?.find((d) => d.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / save as PDF</Button>
        {trip.status !== 'planned' && (
          <Button variant="secondary" loading={m.setStatus.isPending} onClick={() => m.setStatus.mutate('planned')}>
            <CheckCircle2 className="h-4 w-4" /> Mark itinerary as final
          </Button>
        )}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Your itinerary</h2>
        <ol className="space-y-3">
          {trip.days.map((d, i) => (
            <li key={d.id}>
              <div className="font-medium">Day {i + 1} · {formatDate(d.dayDate)} · {destName(d.destinationId)}</div>
              <ul className="ml-5 list-disc text-sm text-stone-700">
                {d.items.length === 0 && <li className="text-stone-400">Free day</li>}
                {d.items.map((it) => <li key={it.id} className={it.kind === 'note' ? 'italic' : ''}>{it.title}</li>)}
              </ul>
            </li>
          ))}
        </ol>
        {trip.stays.length > 0 && (
          <>
            <h3 className="mt-5 font-semibold">Stays</h3>
            <SavedStays trip={trip} />
          </>
        )}
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Contact an agency for this trip</h2>
        <p className="text-sm text-stone-600">
          Share this itinerary with a local operator for transport, guides or a package quote. Listings come live from Google
          with ratings and reviews; Tamil Nadu Tourism (TTDC) is the government option.
        </p>
      </div>
      {agencies.isLoading && <Spinner label="Finding local agencies…" />}
      {agencies.error && <ErrorNote onRetry={() => agencies.refetch()}>{errorMessage(agencies.error)}</ErrorNote>}
      {agencies.data?.destinations.map((g) => <AgencyList key={g.destinationId} group={g} />)}
    </div>
  );
}
