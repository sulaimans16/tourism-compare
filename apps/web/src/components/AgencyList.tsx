import type { DestinationAgencies } from '@tc/types';
import { Globe, MapPin, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react';
import { Badge, Button, Card } from './ui';

export function AgencyList({ group }: { group: DestinationAgencies }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">Travel agencies & tour operators in {group.destinationName}</h3>
      {group.agencies.length <= 1 && <p className="text-sm text-stone-500">No local agencies with contact details were found.</p>}
      <div className="grid gap-3 md:grid-cols-2" data-testid="agency-list">
        {group.agencies.map((a) => (
          <Card key={a.placeId} className={`p-4 ${a.source === 'official' ? 'border-sky-200 bg-sky-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{a.name}</div>
                {a.address && <div className="text-xs text-stone-500">{a.address}</div>}
              </div>
              {a.source === 'official' ? (
                <Badge tone="blue"><ShieldCheck className="h-3 w-3" /> Government</Badge>
              ) : a.rating != null ? (
                <Badge tone="green"><Star className="h-3 w-3 fill-current" /> {a.rating.toFixed(1)} ({a.userRatingCount ?? 0})</Badge>
              ) : null}
            </div>
            {a.openNow != null && (
              <div className={`mt-1 text-xs ${a.openNow ? 'text-green-700' : 'text-stone-500'}`}>{a.openNow ? 'Open now' : 'Closed now'}</div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {a.phone && (
                <a href={`tel:${(a.internationalPhone ?? a.phone).replace(/\s/g, '')}`}>
                  <Button size="sm"><Phone className="h-3 w-3" /> {a.phone}</Button>
                </a>
              )}
              {a.whatsappUrl && (
                <a href={a.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
                </a>
              )}
              {a.website && (
                <a href={a.websiteRedirectUrl ?? a.website} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Globe className="h-3 w-3" /> Website</Button>
                </a>
              )}
              {a.googleMapsUri && (
                <a href={a.googleMapsUri} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost"><MapPin className="h-3 w-3" /> Map</Button>
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
