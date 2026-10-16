import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { useMapsEnabled } from './MapsProvider';

export interface PickedPlace {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  googleMapsUri: string | null;
}

/**
 * Google Places Autocomplete (PlaceAutocompleteElement), limited to India and biased to the
 * given location. Lets travellers add any restaurant, beach or temple, not only top attractions.
 */
export function PlaceSearch({ near, onPick, placeholder }: { near: { lat: number; lng: number }; onPick: (p: PickedPlace) => void; placeholder?: string }) {
  const enabled = useMapsEnabled();
  const places = useMapsLibrary('places');
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!places || !host.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Element = (places as any).PlaceAutocompleteElement;
    if (!Element) return;
    const el = new Element({
      includedRegionCodes: ['in'],
      locationBias: { center: near, radius: 30_000 },
    }) as HTMLElement;
    if (placeholder) el.setAttribute('placeholder', placeholder);
    el.style.width = '100%';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSelect = async (ev: any) => {
      const place = ev.placePrediction.toPlace();
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI'] });
      pick.current({
        placeId: place.id,
        name: place.displayName ?? 'Place',
        address: place.formattedAddress ?? null,
        lat: place.location?.lat() ?? null,
        lng: place.location?.lng() ?? null,
        googleMapsUri: place.googleMapsURI ?? null,
      });
    };
    el.addEventListener('gmp-select', onSelect);
    host.current.replaceChildren(el);
    return () => {
      el.removeEventListener('gmp-select', onSelect);
      el.remove();
    };
  }, [places, near.lat, near.lng, placeholder]);

  if (!enabled) return null;
  return <div ref={host} className="no-print" data-testid="place-search" />;
}
