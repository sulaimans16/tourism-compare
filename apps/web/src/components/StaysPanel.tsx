import { formatInr, freshness, nightsBetween, useStayOffers, useStaySearch, type StaySearchParams } from '@tc/core';
import type { StayOffer, StayProperty, StayType } from '@tc/types';
import { BadgeCheck, ExternalLink, Home, Hotel, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn, errorMessage } from '@/lib/utils';
import { Badge, Button, EmptyState, ErrorNote, Input, Label, Segmented, Select, Sheet, Skeleton, Spinner } from './ui';

interface Props {
  destinationId: string;
  destinationName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  tripId?: string;
  onSave?: (p: { property: StayProperty; offer: StayOffer | null; type: StayType }) => Promise<unknown>;
}

export function StaysPanel(props: Props) {
  const [type, setType] = useState<StayType>('hotel');
  const [sort, setSort] = useState<StaySearchParams['sort']>('lowest_price');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState(0);
  const [selected, setSelected] = useState<StayProperty | null>(null);

  const params: StaySearchParams = {
    destination: props.destinationId,
    checkIn: props.checkIn,
    checkOut: props.checkOut,
    adults: props.adults,
    children: props.children,
    type,
    sort,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  };
  const search = useStaySearch(params);
  const properties = useMemo(
    () => (search.data?.properties ?? []).filter((p) => (p.rating ?? 0) >= minRating),
    [search.data, minRating],
  );
  const nights = nightsBetween(props.checkIn, props.checkOut);
  const guests = props.adults + props.children;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-line pb-4">
        <div>
          <p className="eyebrow mb-1.5">Stay type</p>
          <Segmented<StayType>
            value={type}
            onChange={setType}
            options={[
              { id: 'hotel', label: <><Hotel className="h-4 w-4" /> Hotels</> },
              { id: 'villa', label: <><Home className="h-4 w-4" /> Villas & homes</> },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="stay-sort">Sort</Label>
          <Select id="stay-sort" value={sort} onChange={(e) => setSort(e.target.value as StaySearchParams['sort'])}>
            <option value="lowest_price">Lowest price</option>
            <option value="highest_rating">Highest rating</option>
            <option value="relevance">Relevance</option>
          </Select>
        </div>
        <div className="w-36">
          <Label htmlFor="stay-max">Max ₹ / night</Label>
          <Input id="stay-max" inputMode="numeric" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <Label htmlFor="stay-rating">Rating</Label>
          <Select id="stay-rating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </Select>
        </div>
        <div className="ml-auto text-right">
          <p className="eyebrow">
            {props.destinationName} · {nights} night{nights === 1 ? '' : 's'} · {guests} guest{guests === 1 ? '' : 's'}
          </p>
          {search.data && <p className="text-sm text-muted">Live prices, fetched {freshness(search.data.fetchedAt)}</p>}
        </div>
      </div>

      {search.error && <ErrorNote onRetry={() => search.refetch()}>{errorMessage(search.error)}</ErrorNote>}
      {search.data && properties.length === 0 && (
        <EmptyState title={`No ${type === 'villa' ? 'villas or homes' : 'hotels'} match`}>Try other dates, a higher price limit or a lower rating.</EmptyState>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="stay-results">
        {search.isLoading &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/2] w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        {properties.map((p) => (
          <article key={p.propertyToken} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
            <div className="aspect-[3/2] bg-sunken">
              {p.images[0] && <img src={p.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-sans text-[17px] font-bold leading-snug">{p.name}</h3>
                {p.rating != null && (
                  <Badge tone="good" className="shrink-0">
                    <Star className="h-3 w-3 fill-current" /> {p.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted">
                {[p.hotelClass ? `${p.hotelClass}-star` : p.type, p.reviews ? `${p.reviews.toLocaleString('en-IN')} reviews` : null].filter(Boolean).join(' · ')}
              </p>
              {p.amenities.length > 0 && <p className="line-clamp-1 text-sm text-muted">{p.amenities.slice(0, 4).join(' · ')}</p>}
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
                <div>
                  <p className="eyebrow">From</p>
                  <p className="num font-mono text-xl font-semibold">
                    {formatInr(p.lowestNightlyInr)}
                    <span className="font-sans text-sm font-normal text-muted"> /night</span>
                  </p>
                  {p.lowestTotalInr != null && <p className="num font-mono text-xs text-muted">{formatInr(p.lowestTotalInr)} total</p>}
                </div>
                <Button size="sm" onClick={() => setSelected(p)}>
                  Compare prices
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <CompareSheet
        property={selected}
        onClose={() => setSelected(null)}
        params={{ ...params, tripId: props.tripId }}
        onSave={props.onSave ? (offer) => props.onSave!({ property: selected!, offer, type }) : undefined}
      />
    </div>
  );
}

function CompareSheet({
  property,
  onClose,
  params,
  onSave,
}: {
  property: StayProperty | null;
  onClose: () => void;
  params: StaySearchParams & { tripId?: string };
  onSave?: (offer: StayOffer | null) => Promise<unknown>;
}) {
  const { sort: _s, maxPrice: _m, minPrice: _n, ...offerParams } = params;
  const offers = useStayOffers(property?.propertyToken ?? null, offerParams);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const data = offers.data;
  const maxTotal = Math.max(0, ...(data?.offers ?? []).map((o) => o.totalInr ?? 0));

  return (
    <Sheet
      open={!!property}
      onClose={() => {
        setSaved(false);
        onClose();
      }}
      title={property?.name ?? ''}
      subtitle={data?.address}
    >
      {offers.isLoading && <Spinner label="Checking every booking site…" />}
      {offers.error && <ErrorNote onRetry={() => offers.refetch()}>{errorMessage(offers.error)}</ErrorNote>}
      {data && (
        <div className="space-y-5" data-testid="compare-table">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <p className="eyebrow">
                {data.checkIn} → {data.checkOut}
              </p>
              <p className="eyebrow">
                {data.nights} night{data.nights === 1 ? '' : 's'} · fetched {freshness(data.fetchedAt)}
              </p>
            </div>
            {data.cheapest ? (
              <div className="perforation mx-5 flex flex-wrap items-end justify-between gap-4 py-5">
                <div>
                  <p className="text-sm font-semibold text-highlight">Lowest price for your dates</p>
                  <p className="num mt-1 font-mono text-4xl font-semibold leading-none">{formatInr(data.cheapest.totalInr)}</p>
                  <p className="mt-2 text-sm text-muted">
                    on <span className="font-semibold text-ink">{data.cheapest.platform}</span>
                    {!!data.maxSavingsInr && <> · saves up to <span className="num font-mono text-good">{formatInr(data.maxSavingsInr)}</span></>}
                  </p>
                </div>
                <a href={data.cheapest.redirectUrl ?? data.cheapest.deepLink} target="_blank" rel="noopener noreferrer">
                  <Button>
                    Go to {data.cheapest.platform} <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ) : (
              <p className="perforation mx-5 py-5 text-muted">No booking site lists a price for these dates.</p>
            )}
          </div>

          {data.offers.length > 0 && (
            <section>
              <h3 className="eyebrow mb-2">
                {data.offers.length} site{data.offers.length === 1 ? '' : 's'}, cheapest first
              </h3>
              <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                {data.offers.map((o) => (
                  <li key={o.platform} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {o.platformLogo && <img src={o.platformLogo} alt="" className="h-5 w-5 rounded-sm" />}
                        <span className="font-semibold">{o.platform}</span>
                        {o.cheapest && <Badge tone="highlight">Cheapest</Badge>}
                        {o.official && (
                          <Badge tone="accent">
                            <BadgeCheck className="h-3 w-3" /> Hotel's own site
                          </Badge>
                        )}
                        {o.freeCancellation && <Badge tone="good">Free cancellation</Badge>}
                      </div>
                      {o.totalInr != null && maxTotal > 0 && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
                          <div
                            className={cn('h-full rounded-full', o.cheapest ? 'bg-highlight' : 'bg-muted/40')}
                            style={{ width: `${Math.max(8, (o.totalInr / maxTotal) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="row-span-2 flex items-center gap-3">
                      <div className="text-right">
                        <p className="num font-mono font-semibold">{formatInr(o.totalInr)}</p>
                        <p className="num font-mono text-xs text-muted">{formatInr(o.nightlyInr)}/night</p>
                      </div>
                      <a href={o.redirectUrl ?? o.deepLink} target="_blank" rel="noopener noreferrer" aria-label={`Go to ${o.platform}`}>
                        <Button size="sm" variant={o.cheapest ? 'primary' : 'outline'}>
                          Go <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {onSave && (
            <Button
              variant="secondary"
              className="w-full"
              loading={saving}
              disabled={saved}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(data.cheapest);
                  setSaved(true);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saved ? 'Saved to your trip' : 'Save this stay to my trip'}
            </Button>
          )}
          <p className="text-xs text-muted">
            Totals include taxes where the site reports them. You confirm the final price on the booking site.
          </p>
        </div>
      )}
    </Sheet>
  );
}
