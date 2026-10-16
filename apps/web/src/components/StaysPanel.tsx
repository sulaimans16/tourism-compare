import { useStaySearch, useStayOffers, formatInr, freshness, nightsBetween, type StaySearchParams } from '@tc/core';
import type { StayOffer, StayProperty, StayType } from '@tc/types';
import { BadgeCheck, ExternalLink, Home, Hotel, Star, TrendingDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { errorMessage } from '@/lib/utils';
import { Badge, Button, Card, ErrorNote, Input, Label, Select, Sheet, Spinner } from './ui';

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

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div>
          <Label>Stay type</Label>
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
            {(['hotel', 'villa'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${type === t ? 'bg-white shadow-sm' : 'text-stone-600'}`}
              >
                {t === 'hotel' ? <Hotel className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                {t === 'hotel' ? 'Hotels' : 'Villas & homes'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Sort</Label>
          <Select value={sort} onChange={(e) => setSort(e.target.value as StaySearchParams['sort'])}>
            <option value="lowest_price">Lowest price</option>
            <option value="highest_rating">Highest rating</option>
            <option value="relevance">Relevance</option>
          </Select>
        </div>
        <div className="w-36">
          <Label>Max / night (₹)</Label>
          <Input inputMode="numeric" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <Label>Min rating</Label>
          <Select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </Select>
        </div>
        <div className="ml-auto text-right text-xs text-stone-500">
          {props.destinationName} · {nights} night{nights === 1 ? '' : 's'} · {props.adults + props.children} guests
          {search.data && <div>Live prices fetched {freshness(search.data.fetchedAt)}</div>}
        </div>
      </Card>

      {search.isLoading && <Spinner label="Fetching live prices across platforms…" />}
      {search.error && <ErrorNote onRetry={() => search.refetch()}>{errorMessage(search.error)}</ErrorNote>}
      {search.data && properties.length === 0 && (
        <p className="p-6 text-center text-stone-500">No {type === 'villa' ? 'villas' : 'hotels'} found for these dates and filters.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="stay-results">
        {properties.map((p) => (
          <Card key={p.propertyToken} className="flex flex-col overflow-hidden">
            {p.images[0] ? (
              <img src={p.images[0]} alt={p.name} loading="lazy" className="h-44 w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-44 bg-stone-100" />
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                {p.rating != null && (
                  <Badge tone="green"><Star className="h-3 w-3 fill-current" /> {p.rating.toFixed(1)}</Badge>
                )}
              </div>
              <div className="text-xs text-stone-500">
                {[p.hotelClass ? `${p.hotelClass}-star` : p.type, p.reviews ? `${p.reviews.toLocaleString('en-IN')} reviews` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <div className="flex flex-wrap gap-1">
                {p.amenities.slice(0, 4).map((a) => <Badge key={a}>{a}</Badge>)}
              </div>
              <div className="mt-auto flex items-end justify-between pt-2">
                <div>
                  <div className="text-xs text-stone-500">from</div>
                  <div className="text-xl font-bold">{formatInr(p.lowestNightlyInr)}<span className="text-sm font-normal text-stone-500">/night</span></div>
                  {p.lowestTotalInr != null && <div className="text-xs text-stone-500">{formatInr(p.lowestTotalInr)} total</div>}
                </div>
                <Button size="sm" onClick={() => setSelected(p)}>Compare prices</Button>
              </div>
            </div>
          </Card>
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

  return (
    <Sheet open={!!property} onClose={() => { setSaved(false); onClose(); }} title={property?.name ?? ''}>
      {offers.isLoading && <Spinner label="Comparing every platform live…" />}
      {offers.error && <ErrorNote onRetry={() => offers.refetch()}>{errorMessage(offers.error)}</ErrorNote>}
      {data && (
        <div className="space-y-4" data-testid="compare-table">
          <div className="text-sm text-stone-600">
            {data.address && <div>{data.address}</div>}
            <div>
              {data.checkIn} → {data.checkOut} · {data.nights} night{data.nights === 1 ? '' : 's'} · fetched {freshness(data.fetchedAt)}
            </div>
          </div>
          {data.cheapest && (
            <Card className="flex items-center justify-between border-green-200 bg-green-50 p-4">
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-800"><TrendingDown className="h-4 w-4" /> Lowest price</div>
                <div className="text-2xl font-bold">{formatInr(data.cheapest.totalInr)} <span className="text-sm font-normal">on {data.cheapest.platform}</span></div>
                {!!data.maxSavingsInr && <div className="text-xs text-green-800">Save up to {formatInr(data.maxSavingsInr)} vs. the most expensive option</div>}
              </div>
              <a href={data.cheapest.redirectUrl ?? data.cheapest.deepLink} target="_blank" rel="noopener noreferrer">
                <Button>Go to {data.cheapest.platform} <ExternalLink className="h-4 w-4" /></Button>
              </a>
            </Card>
          )}
          {data.offers.length === 0 && <p className="text-stone-500">No platform currently lists prices for these dates.</p>}
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-stone-500">
              <tr><th className="py-2">Platform</th><th>Per night</th><th>Total</th><th /></tr>
            </thead>
            <tbody>
              {data.offers.map((o) => (
                <tr key={o.platform} className={`border-t ${o.cheapest ? 'bg-green-50' : ''}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {o.platformLogo && <img src={o.platformLogo} alt="" className="h-5 w-5 rounded" />}
                      <span className="font-medium">{o.platform}</span>
                      {o.official && <Badge tone="blue"><BadgeCheck className="h-3 w-3" /> Official site</Badge>}
                      {o.freeCancellation && <Badge tone="green">Free cancellation</Badge>}
                    </div>
                  </td>
                  <td>{formatInr(o.nightlyInr)}</td>
                  <td className="font-semibold">{formatInr(o.totalInr)}</td>
                  <td className="text-right">
                    <a href={o.redirectUrl ?? o.deepLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant={o.cheapest ? 'primary' : 'outline'}>Go to site <ExternalLink className="h-3 w-3" /></Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {saved ? 'Saved to trip ✓' : 'Save this stay to my trip'}
            </Button>
          )}
          <p className="text-xs text-stone-500">
            Prices include taxes where the platform reports them. The final price is confirmed on the provider's site.
          </p>
        </div>
      )}
    </Sheet>
  );
}
