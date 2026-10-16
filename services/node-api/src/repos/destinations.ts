import type { SupabaseClient } from '@supabase/supabase-js';
import type { Destination } from '@tc/types';
import { HttpError, notFound } from '../lib/errors.js';

export interface DestinationRepo {
  list(): Promise<Destination[]>;
  get(id: string): Promise<Destination>;
}

interface Row {
  id: string;
  name: string;
  state: string;
  region: string | null;
  lat: number;
  lng: number;
  search_query: string;
  tags: string[];
}

const toDestination = (r: Row): Destination => ({
  id: r.id,
  name: r.name,
  state: r.state,
  region: r.region,
  lat: r.lat,
  lng: r.lng,
  searchQuery: r.search_query,
  tags: r.tags,
});

export function supabaseDestinations(db: SupabaseClient): DestinationRepo {
  return {
    async list() {
      const { data, error } = await db
        .from('destinations')
        .select('id,name,state,region,lat,lng,search_query,tags')
        .order('sort_order');
      if (error) throw new HttpError(502, 'DB_ERROR', error.message);
      return (data as Row[]).map(toDestination);
    },
    async get(id) {
      const { data, error } = await db
        .from('destinations')
        .select('id,name,state,region,lat,lng,search_query,tags')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new HttpError(502, 'DB_ERROR', error.message);
      if (!data) throw notFound(`Destination '${id}'`);
      return toDestination(data as Row);
    },
  };
}
