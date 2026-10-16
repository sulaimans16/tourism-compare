import type { DestinationAgencies } from '@tc/types';
import { Globe, MapPin, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react';
import { tamilName } from '@/lib/tamil';
import { Badge, Button } from './ui';

export function AgencyList({ group }: { group: DestinationAgencies }) {
  const operators = group.agencies.filter((a) => a.source !== 'official').length;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-bold">
          Agencies in {group.destinationName}{' '}
          <span className="font-sans text-base font-normal text-muted" lang="ta">
            {tamilName(group.destinationId)}
          </span>
        </h3>
        <p className="eyebrow">{operators} local operators · ranked by rating and reviews</p>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface" data-testid="agency-list">
        {group.agencies.map((a) => (
          <li key={a.placeId} className={a.source === 'official' ? 'bg-accent/[0.06]' : undefined}>
            <div className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.name}</span>
                  {a.source === 'official' ? (
                    <Badge tone="accent">
                      <ShieldCheck className="h-3 w-3" /> Government of Tamil Nadu
                    </Badge>
                  ) : (
                    a.rating != null && (
                      <span className="num inline-flex items-center gap-1 font-mono text-sm">
                        <Star className="h-3.5 w-3.5 fill-highlight text-highlight" aria-hidden />
                        {a.rating.toFixed(1)}
                        <span className="text-muted">({(a.userRatingCount ?? 0).toLocaleString('en-IN')})</span>
                      </span>
                    )
                  )}
                  {a.openNow != null && <Badge tone={a.openNow ? 'good' : 'default'}>{a.openNow ? 'Open now' : 'Closed now'}</Badge>}
                </div>
                {a.address && <p className="mt-0.5 truncate text-sm text-muted">{a.address}</p>}
                {a.phone && (
                  <p className="num mt-1 select-all font-mono text-sm" aria-label="Phone number">
                    {a.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {a.phone && (
                  <a href={`tel:${(a.internationalPhone ?? a.phone).replace(/\s/g, '')}`}>
                    <Button size="sm">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </Button>
                  </a>
                )}
                {a.whatsappUrl && (
                  <a href={a.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                  </a>
                )}
                {a.website && (
                  <a href={a.websiteRedirectUrl ?? a.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </Button>
                  </a>
                )}
                {a.googleMapsUri && (
                  <a href={a.googleMapsUri} target="_blank" rel="noopener noreferrer" aria-label={`${a.name} on Google Maps`}>
                    <Button size="sm" variant="ghost">
                      <MapPin className="h-3.5 w-3.5" /> Map
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {operators === 0 && <p className="text-sm text-muted">No local operators with contact details turned up for this area.</p>}
    </section>
  );
}
