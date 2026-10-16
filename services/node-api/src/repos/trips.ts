import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateSavedStay,
  CreateTrip,
  CreateTripItem,
  SavedStay,
  Trip,
  TripDay,
  TripDetail,
  TripItem,
  UpdateTrip,
  UpdateTripDay,
  UpdateTripItem,
} from '@tc/types';
import { HttpError, notFound } from '../lib/errors.js';

/** Inclusive list of ISO dates between start and end. */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Assigns destinations to days in order; the last destination fills any remaining days. */
export function planDays(start: string, end: string, destinationIds: string[]) {
  const dates = datesBetween(start, end);
  if (dates.length > 60) throw new HttpError(400, 'BAD_REQUEST', 'Trips are limited to 60 days');
  return dates.map((date, i) => ({
    day_date: date,
    destination_id: destinationIds[Math.min(i, destinationIds.length - 1)]!,
  }));
}

const dbErr = (e: { message: string; code?: string }) =>
  e.code === 'PGRST116' ? notFound('Resource') : new HttpError(400, 'DB_ERROR', e.message);

/* eslint-disable @typescript-eslint/no-explicit-any */
const toTrip = (r: any): Trip => ({
  id: r.id,
  title: r.title,
  startDate: r.start_date,
  endDate: r.end_date,
  adults: r.adults,
  children: r.children,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const toItem = (r: any): TripItem => ({
  id: r.id,
  tripDayId: r.trip_day_id,
  kind: r.kind,
  googlePlaceId: r.google_place_id,
  title: r.title,
  lat: r.lat,
  lng: r.lng,
  startTime: r.start_time ? String(r.start_time).slice(0, 5) : null,
  durationMinutes: r.duration_minutes,
  sortOrder: r.sort_order,
  meta: r.meta ?? {},
});
const toDay = (r: any): TripDay => ({
  id: r.id,
  tripId: r.trip_id,
  dayDate: r.day_date,
  destinationId: r.destination_id,
  notes: r.notes,
  items: ((r.trip_items ?? []) as any[]).map(toItem).sort((a, b) => a.sortOrder - b.sortOrder),
});
const toStay = (r: any): SavedStay => ({
  id: r.id,
  tripId: r.trip_id,
  destinationId: r.destination_id,
  propertyToken: r.property_token,
  name: r.name,
  propertyType: r.property_type,
  checkIn: r.check_in,
  checkOut: r.check_out,
  chosenPlatform: r.chosen_platform,
  priceAtSaveInr: r.price_at_save_inr == null ? null : Number(r.price_at_save_inr),
  deepLink: r.deep_link,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function itemRow(i: Partial<CreateTripItem>) {
  const row: Record<string, unknown> = {};
  if (i.kind !== undefined) row.kind = i.kind;
  if (i.googlePlaceId !== undefined) row.google_place_id = i.googlePlaceId;
  if (i.title !== undefined) row.title = i.title;
  if (i.lat !== undefined) row.lat = i.lat;
  if (i.lng !== undefined) row.lng = i.lng;
  if (i.startTime !== undefined) row.start_time = i.startTime;
  if (i.durationMinutes !== undefined) row.duration_minutes = i.durationMinutes;
  if (i.sortOrder !== undefined) row.sort_order = i.sortOrder;
  if (i.meta !== undefined) row.meta = i.meta;
  return row;
}

/** All queries run with the user's JWT, so Postgres RLS guarantees ownership. */
export class TripRepo {
  constructor(
    private db: SupabaseClient,
    private userId: string,
  ) {}

  async list(): Promise<Trip[]> {
    const { data, error } = await this.db.from('trips').select('*').order('start_date', { ascending: false });
    if (error) throw dbErr(error);
    return data.map(toTrip);
  }

  async get(id: string): Promise<TripDetail> {
    const { data, error } = await this.db
      .from('trips')
      .select('*, trip_days(*, trip_items(*)), saved_stays(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw dbErr(error);
    if (!data) throw notFound('Trip');
    const days = ((data.trip_days ?? []) as unknown[]).map(toDay).sort((a, b) => a.dayDate.localeCompare(b.dayDate));
    return { ...toTrip(data), days, stays: ((data.saved_stays ?? []) as unknown[]).map(toStay) };
  }

  async create(input: CreateTrip): Promise<TripDetail> {
    const days = planDays(input.startDate, input.endDate, input.destinationIds);
    const { data: trip, error } = await this.db
      .from('trips')
      .insert({
        user_id: this.userId,
        title: input.title,
        start_date: input.startDate,
        end_date: input.endDate,
        adults: input.adults,
        children: input.children,
      })
      .select('id')
      .single();
    if (error) throw dbErr(error);
    const { error: dayErr } = await this.db.from('trip_days').insert(days.map((d) => ({ ...d, trip_id: trip.id })));
    if (dayErr) {
      await this.db.from('trips').delete().eq('id', trip.id);
      throw dbErr(dayErr);
    }
    return this.get(trip.id);
  }

  async update(id: string, patch: UpdateTrip): Promise<Trip> {
    const { data, error } = await this.db.from('trips').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw dbErr(error);
    if (!data) throw notFound('Trip');
    return toTrip(data);
  }

  async remove(id: string): Promise<void> {
    const { error, count } = await this.db.from('trips').delete({ count: 'exact' }).eq('id', id);
    if (error) throw dbErr(error);
    if (!count) throw notFound('Trip');
  }

  async updateDay(tripId: string, dayId: string, patch: UpdateTripDay): Promise<TripDay> {
    const row: Record<string, unknown> = {};
    if (patch.destinationId !== undefined) row.destination_id = patch.destinationId;
    if (patch.notes !== undefined) row.notes = patch.notes;
    const { data, error } = await this.db
      .from('trip_days')
      .update(row)
      .eq('id', dayId)
      .eq('trip_id', tripId)
      .select('*, trip_items(*)')
      .maybeSingle();
    if (error) throw dbErr(error);
    if (!data) throw notFound('Trip day');
    return toDay(data);
  }

  private async assertDay(tripId: string, dayId: string) {
    const { data, error } = await this.db.from('trip_days').select('id').eq('id', dayId).eq('trip_id', tripId).maybeSingle();
    if (error) throw dbErr(error);
    if (!data) throw notFound('Trip day');
  }

  async addItem(tripId: string, dayId: string, item: CreateTripItem): Promise<TripItem> {
    await this.assertDay(tripId, dayId);
    let sortOrder = item.sortOrder;
    if (sortOrder === undefined) {
      const { data } = await this.db
        .from('trip_items')
        .select('sort_order')
        .eq('trip_day_id', dayId)
        .order('sort_order', { ascending: false })
        .limit(1);
      sortOrder = (data?.[0]?.sort_order ?? -1) + 1;
    }
    const { data, error } = await this.db
      .from('trip_items')
      .insert({ ...itemRow(item), sort_order: sortOrder, trip_day_id: dayId })
      .select('*')
      .single();
    if (error) throw dbErr(error);
    return toItem(data);
  }

  async updateItem(tripId: string, itemId: string, patch: UpdateTripItem): Promise<TripItem> {
    const row = itemRow(patch);
    if (patch.tripDayId) {
      await this.assertDay(tripId, patch.tripDayId);
      row.trip_day_id = patch.tripDayId;
    }
    const { data, error } = await this.db.from('trip_items').update(row).eq('id', itemId).select('*').maybeSingle();
    if (error) throw dbErr(error);
    if (!data) throw notFound('Trip item');
    return toItem(data);
  }

  async removeItem(itemId: string): Promise<void> {
    const { error, count } = await this.db.from('trip_items').delete({ count: 'exact' }).eq('id', itemId);
    if (error) throw dbErr(error);
    if (!count) throw notFound('Trip item');
  }

  async reorder(tripId: string, dayId: string, itemIds: string[]): Promise<TripDay> {
    await this.assertDay(tripId, dayId);
    await Promise.all(
      itemIds.map((id, idx) =>
        this.db.from('trip_items').update({ sort_order: idx, trip_day_id: dayId }).eq('id', id),
      ),
    );
    const { data, error } = await this.db.from('trip_days').select('*, trip_items(*)').eq('id', dayId).single();
    if (error) throw dbErr(error);
    return toDay(data);
  }

  async saveStay(tripId: string, s: CreateSavedStay): Promise<SavedStay> {
    const { data, error } = await this.db
      .from('saved_stays')
      .insert({
        trip_id: tripId,
        destination_id: s.destinationId ?? null,
        property_token: s.propertyToken,
        name: s.name,
        property_type: s.propertyType,
        check_in: s.checkIn,
        check_out: s.checkOut,
        chosen_platform: s.chosenPlatform ?? null,
        price_at_save_inr: s.priceAtSaveInr ?? null,
        deep_link: s.deepLink ?? null,
      })
      .select('*')
      .single();
    if (error) throw dbErr(error);
    return toStay(data);
  }

  async removeStay(tripId: string, stayId: string): Promise<void> {
    const { error, count } = await this.db
      .from('saved_stays')
      .delete({ count: 'exact' })
      .eq('id', stayId)
      .eq('trip_id', tripId);
    if (error) throw dbErr(error);
    if (!count) throw notFound('Saved stay');
  }
}
