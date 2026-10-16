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
import { DAY_COLORS, PlacesMap, type MapPoint } from '@/components/maps/PlacesMap';
import { PlaceSearch } from '@/components/maps/PlaceSearch';
import { StaysPanel } from '@/components/StaysPanel';
import { Badge, Button, Card, ErrorNote, Input, Segmented, Select, Spinner, Tabs } from '@/components/ui';
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
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">
              {formatDate(t.startDate)} – {formatDate(t.endDate)} · {t.days.length} days · {t.adults} adult{t.adults === 1 ? '' : 's'}
              {t.children ? ` · ${t.children} child${t.children === 1 ? '' : 'ren'}` : ''}
            </p>
            <h1 className="mt-1.5 text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
          </div>
          <Badge tone={t.status === 'planned' ? 'good' : 'default'} className="capitalize">{t.status === 'planned' ? 'Final' : 'Draft'}</Badge>
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
  const [wholeTrip, setWholeTrip] = useState(false);
  const activeDest = destinations.data?.find((d) => d.id === activeDay?.destinationId);
  const points: MapPoint[] = trip.days.flatMap((day, dayIdx) =>
    wholeTrip || day.id === activeDay?.id
      ? day.items
          .filter((i) => i.lat != null && i.lng != null)
          .map((i, n) => ({
            id: i.id,
            lat: i.lat!,
            lng: i.lng!,
            title: `Day ${dayIdx + 1}: ${i.title}`,
            label: wholeTrip ? String(dayIdx + 1) : String(n + 1),
            color: DAY_COLORS[dayIdx % DAY_COLORS.length],
            href: (i.meta as { googleMapsUri?: string }).googleMapsUri ?? null,
          }))
      : [],
  );

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
          {activeDest && (
            <>
              <PlacesMap points={points} center={activeDest} height={260} />
              <label className="no-print flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={wholeTrip} onChange={(e) => setWholeTrip(e.target.checked)} /> Show the whole trip on the map
              </label>
            </>
          )}
          <div className="text-sm text-muted">
            Adding to <b>{formatDate(activeDay.dayDate)}</b> in <b>{destName(activeDay.destinationId)}</b>
          </div>
          {activeDest && (
            <PlaceSearch
              near={activeDest}
              placeholder={`Search any place in or near ${activeDest.name}`}
              onPick={(p) =>
                m.addItem.mutate({
                  dayId: activeDay.id,
                  item: { kind: 'attraction', googlePlaceId: p.placeId, title: p.name, lat: p.lat, lng: p.lng, meta: { googleMapsUri: p.googleMapsUri, address: p.address } },
                })
              }
            />
          )}
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
    <Card
      className={`p-4 transition-shadow sm:p-5 ${props.active ? 'border-accent shadow-[0_0_0_1px_rgb(var(--accent))]' : 'hover:border-muted/50'}`}
      onClick={props.onActivate}
      data-testid={`day-${props.index}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md font-mono text-sm font-semibold text-surface"
            style={{ background: DAY_COLORS[props.index % DAY_COLORS.length] }}
            aria-hidden
          >
            {String(props.index + 1).padStart(2, '0')}
          </span>
          <div>
            <p className="eyebrow">Day {props.index + 1}</p>
            <p className="font-display text-lg font-bold leading-tight">{formatDate(day.dayDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {props.weather ? (
            <Badge tone="accent" title="Open-Meteo forecast">
              <CloudSun className="h-3 w-3" /> {props.weather.summary} · {Math.round(props.weather.tempMinC ?? 0)}–{Math.round(props.weather.tempMaxC ?? 0)}°C
              {props.weather.precipitationProbability != null && ` · ${props.weather.precipitationProbability}% rain`}
            </Badge>
          ) : (
            <Badge title="Forecasts cover the next 16 days">Forecast closer to the date</Badge>
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
          <ol className="mt-4 space-y-1">
            {items.length === 0 && <li className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">Nothing planned yet. Select this day and add places from the panel.</li>}
            {items.map((item, i) => {
              const leg = props.legs.find((l) => l.toItemId === item.id);
              return (
                <li key={item.id}>
                  {i > 0 && leg && leg.durationSeconds != null && (
                    <div className="ml-[18px] flex items-center gap-1.5 border-l-2 border-dotted border-line py-1.5 pl-5 font-mono text-xs text-muted">
                      <Car className="h-3.5 w-3.5" /> {formatDuration(leg.durationSeconds)} · {formatDistance(leg.distanceMeters)} by road
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
        <Input className="h-9" aria-label="Add a note" placeholder="Add a note, e.g. leave by 5:30 for sunrise" value={note} onChange={(e) => setNote(e.target.value)} />
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
      className="flex items-center gap-2 rounded-md border border-line bg-surface p-2"
    >
      <button className="no-print cursor-grab text-muted" {...attributes} {...listeners} aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      {item.kind === 'note' ? <StickyNote className="h-4 w-4 text-highlight" /> : item.kind === 'stay' ? <Hotel className="h-4 w-4" /> : null}
      <span className={`flex-1 text-sm ${item.kind === 'note' ? 'italic text-muted' : 'font-medium'}`}>{item.title}</span>
      {mapsUri && <a href={mapsUri} target="_blank" rel="noreferrer" className="no-print text-muted hover:text-ink"><ExternalLink className="h-4 w-4" /></a>}
      <Select
        className="no-print h-7 text-xs"
        value={currentDayId}
        onChange={(e) => m.moveItem.mutate({ itemId: item.id, dayId: e.target.value })}
        aria-label="Move to day"
      >
        {days.map((d, i) => <option key={d.id} value={d.id}>Day {i + 1}</option>)}
      </Select>
      <button className="no-print text-muted hover:text-danger" onClick={() => m.removeItem.mutate(item.id)} aria-label={`Remove ${item.title}`}>
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
        <Card className="p-4 sm:p-5">
          <h3 className="eyebrow mb-1">Saved stays</h3>
          <SavedStays trip={trip} onRemove={(id) => m.removeStay.mutate(id)} />
        </Card>
      )}
      {destIds.length > 1 && (
        <Segmented<string>
          value={destId}
          onChange={setDestId}
          options={destIds.map((id) => ({ id, label: destinations.data?.find((d) => d.id === id)?.name ?? id }))}
        />
      )}
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
    <ul className="divide-y divide-line">
      {trip.stays.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-muted">
              {formatDate(s.checkIn)} → {formatDate(s.checkOut)}
              {s.chosenPlatform && (
                <>
                  {' · '}
                  <span className="num font-mono text-ink">{formatInr(s.priceAtSaveInr)}</span> on {s.chosenPlatform} when saved
                </>
              )}
            </p>
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

      <Card className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Your itinerary</h2>
        <ol className="mt-4 space-y-4">
          {trip.days.map((d, i) => (
            <li key={d.id} className="grid grid-cols-[3rem_1fr] gap-3">
              <span className="font-mono text-sm font-semibold" style={{ color: DAY_COLORS[i % DAY_COLORS.length] }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
              <p className="font-semibold">{formatDate(d.dayDate)} · {destName(d.destinationId)}</p>
              <ul className="mt-1 list-disc pl-5 text-ink marker:text-muted">
                {d.items.length === 0 && <li className="text-muted">Free day</li>}
                {d.items.map((it) => <li key={it.id} className={it.kind === 'note' ? 'italic text-muted' : ''}>{it.title}</li>)}
              </ul>
              </div>
            </li>
          ))}
        </ol>
        {trip.stays.length > 0 && (
          <>
            <h3 className="eyebrow mt-6">Stays</h3>
            <SavedStays trip={trip} />
          </>
        )}
      </Card>

      <div className="space-y-1.5 pt-2">
        <h2 className="text-2xl font-bold">Hand it to a local agency</h2>
        <p className="max-w-2xl text-muted">
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
