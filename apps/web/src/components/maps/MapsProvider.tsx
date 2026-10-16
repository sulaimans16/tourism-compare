import { APIProvider } from '@vis.gl/react-google-maps';
import { createContext, useContext, type ReactNode } from 'react';
import { env } from '@/lib/env';

const MapsEnabled = createContext(false);

/** Loads the Maps JavaScript API once for the app. Without a browser key, maps are hidden. */
export function MapsProvider({ children }: { children: ReactNode }) {
  if (!env.googleMapsBrowserKey) return <MapsEnabled.Provider value={false}>{children}</MapsEnabled.Provider>;
  return (
    <APIProvider apiKey={env.googleMapsBrowserKey} region="IN" language="en" libraries={['places', 'marker']}>
      <MapsEnabled.Provider value={true}>{children}</MapsEnabled.Provider>
    </APIProvider>
  );
}

export const useMapsEnabled = () => useContext(MapsEnabled);
