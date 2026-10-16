import { AdvancedMarker, InfoWindow, Map, Pin, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { env } from '@/lib/env';
import { useMapsEnabled } from './MapsProvider';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  /** Short text inside the pin, e.g. the stop number. */
  label?: string;
  color?: string;
  href?: string | null;
}

/** Brand-adjacent colours, one per itinerary day. */
export const DAY_COLORS = ['#c2410c', '#0369a1', '#15803d', '#7c3aed', '#b45309', '#be123c', '#0f766e', '#4338ca'];

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]!);
      map.setZoom(14);
      return;
    }
    const b = new google.maps.LatLngBounds();
    points.forEach((p) => b.extend(p));
    map.fitBounds(b, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export function PlacesMap({ points, center, height = 320 }: { points: MapPoint[]; center: { lat: number; lng: number }; height?: number }) {
  const enabled = useMapsEnabled();
  const [open, setOpen] = useState<MapPoint | null>(null);
  if (!enabled) return null;
  return (
    <div className="no-print overflow-hidden rounded-xl border" style={{ height }} data-testid="map">
      <Map defaultCenter={center} defaultZoom={12} mapId={env.googleMapId} gestureHandling="cooperative" mapTypeControl={false} streetViewControl={false}>
        {points.map((p) => (
          <AdvancedMarker key={p.id} position={p} title={p.title} onClick={() => setOpen(p)}>
            <Pin background={p.color ?? DAY_COLORS[0]} borderColor="#ffffff" glyphColor="#ffffff" glyph={p.label} />
          </AdvancedMarker>
        ))}
        {open && (
          <InfoWindow position={open} onCloseClick={() => setOpen(null)} headerContent={<strong>{open.title}</strong>}>
            {open.href && <a href={open.href} target="_blank" rel="noreferrer" className="text-sm text-sky-700 underline">Open in Google Maps</a>}
          </InfoWindow>
        )}
        <FitBounds points={points} />
      </Map>
    </div>
  );
}
