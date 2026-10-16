import { addDays, useCreateTrip, useDestinations } from '@tc/core';
import { useApi } from '@tc/core';
import { ArrowRight, Check, MapPin, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, ErrorNote, Input, Label, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);

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
  const names = (destinations.data ?? []).filter((d) => picked.includes(d.id));
  const ordered = picked.map((id) => names.find((n) => n.id === id)).filter(Boolean);

  const submit = async () => {
    const q = new URLSearchParams({ start, end, adults: String(adults), children: String(children), dest: picked.join(','), title });
    if (!session) return navigate(`/login?next=${encodeURIComponent(`/?${q}&autocreate=1`)}`);
    const trip = await createTrip.mutateAsync({
      title: title || `${ordered.map((d) => d!.name).join(' → ')} trip`,
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
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-amber-500 p-8 text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Plan Tamil Nadu your way</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          Build a day-by-day itinerary, compare live stay prices across Booking.com, Agoda, MakeMyTrip, Goibibo and hotel
          websites, then contact trusted local agencies. No booking fees, no middleman.
        </p>
      </section>

      <Card className="grid gap-4 p-5 md:grid-cols-6">
        <div className="md:col-span-2">
          <Label>Trip name (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Temple trail with family" />
        </div>
        <div>
          <Label>Start</Label>
          <Input type="date" min={today()} value={start} onChange={(e) => setStart(e.target.value)} data-testid="start-date" />
        </div>
        <div>
          <Label>End</Label>
          <Input type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} data-testid="end-date" />
        </div>
        <div>
          <Label>Adults</Label>
          <Input type="number" min={1} max={30} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} />
        </div>
        <div>
          <Label>Children</Label>
          <Input type="number" min={0} max={20} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-6">
          <span className="text-sm text-stone-500">Route:</span>
          {ordered.length === 0 && <span className="text-sm text-stone-400">pick destinations below, in the order you'll visit them</span>}
          {ordered.map((d, i) => (
            <Badge key={d!.id} tone="orange" className="text-sm">
              {i + 1}. {d!.name}
              <button onClick={() => toggle(d!.id)} aria-label={`Remove ${d!.name}`}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          <Button className="ml-auto" disabled={!picked.length} loading={createTrip.isPending} onClick={submit} data-testid="create-trip">
            Build itinerary <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {createTrip.error && <div className="md:col-span-6"><ErrorNote>{errorMessage(createTrip.error)}</ErrorNote></div>}
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Popular in Tamil Nadu</h2>
        {destinations.isLoading && <Spinner />}
        {destinations.error && <ErrorNote onRetry={() => destinations.refetch()}>{errorMessage(destinations.error)}</ErrorNote>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="destinations">
          {destinations.data?.map((d) => {
            const on = picked.includes(d.id);
            return (
              <Card key={d.id} className={`overflow-hidden ${on ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="relative h-40 bg-stone-200">
                  <img
                    src={api.destinations.photoUrl(d.id)}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-white">
                    <div className="text-lg font-semibold">{d.name}</div>
                    <div className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {d.region} · {d.state}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex flex-wrap gap-1">{d.tags.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}</div>
                  <div className="flex gap-1">
                    <Link to={`/destinations/${d.id}`}><Button size="sm" variant="ghost">Explore</Button></Link>
                    <Button size="sm" variant={on ? 'secondary' : 'outline'} onClick={() => toggle(d.id)} data-testid={`pick-${d.id}`}>
                      {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
