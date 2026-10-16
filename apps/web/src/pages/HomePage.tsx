import { addDays, useApi, useCreateTrip, useDestinations } from '@tc/core';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, ErrorNote, Input, Label, Skeleton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { tamilName } from '@/lib/tamil';
import { cn, errorMessage } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);
const nightsLabel = (start: string, end: string) => {
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  return `${days} day${days === 1 ? '' : 's'}`;
};

export function HomePage() {
  const api = useApi();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destinations = useDestinations();
  const createTrip = useCreateTrip();

  const [start, setStart] = useState(params.get('start') ?? addDays(today(), 21));
  const [end, setEnd] = useState(params.get('end') ?? addDays(today(), 24));
  const [adults, setAdults] = useState(Number(params.get('adults') ?? 2));
  const [children, setChildren] = useState(Number(params.get('children') ?? 0));
  const [picked, setPicked] = useState<string[]>(params.get('dest')?.split(',').filter(Boolean) ?? []);
  const [title, setTitle] = useState(params.get('title') ?? '');

  useEffect(() => {
    if (end < start) setEnd(start);
  }, [start, end]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const byId = new Map((destinations.data ?? []).map((d) => [d.id, d]));
  const ordered = picked.map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => !!d);

  const submit = async () => {
    const q = new URLSearchParams({ start, end, adults: String(adults), children: String(children), dest: picked.join(','), title });
    if (!session) return navigate(`/login?next=${encodeURIComponent(`/?${q}&autocreate=1`)}`);
    const trip = await createTrip.mutateAsync({
      title: title || `${ordered.map((d) => d.name).join(' → ')} trip`,
      startDate: start,
      endDate: end,
      adults,
      children,
      destinationIds: picked,
    });
    navigate(`/trips/${trip.id}`);
  };

  // Resume creation after sign-in.
  useEffect(() => {
    if (session && params.get('autocreate') === '1' && picked.length && destinations.data && !createTrip.isPending) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, destinations.data]);

  return (
    <div className="space-y-12">
      <section className="kolam -mx-4 -mt-8 border-b border-line px-4 pb-10 pt-12 sm:-mx-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Tamil Nadu · 14 destinations · live prices</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Plan the route. Compare every booking site. Call a local agency.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Build a day-by-day itinerary, see what Booking.com, Agoda, MakeMyTrip and the hotel itself charge for the same
            room, and get the numbers of operators who know the area. No booking fees.
          </p>

          <div className="mt-8 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
            <div className="flex min-h-10 flex-wrap items-center gap-2" aria-live="polite">
              <span className="eyebrow mr-1">Route</span>
              {ordered.length === 0 && <span className="text-muted">Pick destinations below in the order you'll visit them.</span>}
              {ordered.map((d, i) => (
                <Fragment key={d.id}>
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted" aria-hidden />}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 py-1 pl-2.5 pr-1.5 font-semibold text-accent">
                    {d.name}
                    <button onClick={() => toggle(d.id)} aria-label={`Remove ${d.name}`} className="rounded p-0.5 hover:bg-accent/15">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </Fragment>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_0.6fr_0.6fr_auto] lg:items-end">
              <div className="col-span-2 lg:col-span-1">
                <Label htmlFor="trip-title">Trip name (optional)</Label>
                <Input id="trip-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Temple trail with family" />
              </div>
              <div>
                <Label htmlFor="trip-start">From</Label>
                <Input id="trip-start" type="date" min={today()} value={start} onChange={(e) => setStart(e.target.value)} data-testid="start-date" />
              </div>
              <div>
                <Label htmlFor="trip-end">To · {nightsLabel(start, end)}</Label>
                <Input id="trip-end" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} data-testid="end-date" />
              </div>
              <div>
                <Label htmlFor="trip-adults">Adults</Label>
                <Input id="trip-adults" type="number" min={1} max={30} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} />
              </div>
              <div>
                <Label htmlFor="trip-children">Children</Label>
                <Input id="trip-children" type="number" min={0} max={20} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} />
              </div>
              <Button className="col-span-2 lg:col-span-1" disabled={!picked.length} loading={createTrip.isPending} onClick={submit} data-testid="create-trip">
                Build itinerary <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {createTrip.error && (
              <div className="mt-3">
                <ErrorNote>{errorMessage(createTrip.error)}</ErrorNote>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Where to go</h2>
            <p className="text-muted">Add places to your route, or open one to see things to do, stays and agencies.</p>
          </div>
        </div>
        {destinations.error && <ErrorNote onRetry={() => destinations.refetch()}>{errorMessage(destinations.error)}</ErrorNote>}
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" data-testid="destinations">
          {destinations.isLoading &&
            Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ))}
          {destinations.data?.map((d) => {
            const on = picked.includes(d.id);
            const order = picked.indexOf(d.id) + 1;
            return (
              <article key={d.id} className="group">
                <div className={cn('relative aspect-[4/3] overflow-hidden rounded-lg bg-sunken', on && 'ring-2 ring-accent ring-offset-2 ring-offset-paper')}>
                  <span className="kolam absolute inset-0 grid place-items-center px-4 text-center font-display text-3xl font-bold text-muted/60" lang="ta" aria-hidden>
                    {tamilName(d.id)}
                  </span>
                  <img
                    src={api.destinations.photoUrl(d.id)}
                    alt=""
                    loading="lazy"
                    className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                  />
                  {on && (
                    <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-accent font-mono text-sm font-semibold text-on-accent">
                      {order}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={on ? 'primary' : 'outline'}
                    className="absolute bottom-2 right-2 shadow-sm"
                    onClick={() => toggle(d.id)}
                    data-testid={`pick-${d.id}`}
                    aria-pressed={on}
                  >
                    {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {on ? 'In route' : 'Add'}
                  </Button>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold">
                    <Link to={`/destinations/${d.id}`} className="hover:text-accent">
                      {d.name}
                    </Link>
                  </h3>
                  <span className="truncate text-sm text-muted" lang="ta">
                    {tamilName(d.id)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm text-muted">{d.region}</span>
                  {d.tags.slice(0, 2).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                  <Link to={`/destinations/${d.id}`} className="ml-auto text-sm font-semibold text-accent hover:underline">
                    Explore
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
