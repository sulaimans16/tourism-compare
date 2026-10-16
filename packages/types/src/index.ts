import { z } from 'zod';

/** ISO date (YYYY-MM-DD). */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

// ---------------- Destinations ----------------
export const Destination = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  region: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  searchQuery: z.string(),
  tags: z.array(z.string()),
  photoUrl: z.string().nullable().optional(),
});
export type Destination = z.infer<typeof Destination>;

// ---------------- Places (Google Places API (New), normalised) ----------------
export const Place = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  rating: z.number().nullable(),
  userRatingCount: z.number().nullable(),
  primaryType: z.string().nullable(),
  googleMapsUri: z.string().nullable(),
  photoUrl: z.string().nullable(),
  editorialSummary: z.string().nullable(),
});
export type Place = z.infer<typeof Place>;

export const Agency = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingCount: z.number().nullable(),
  phone: z.string().nullable(),
  internationalPhone: z.string().nullable(),
  whatsappUrl: z.string().nullable(),
  website: z.string().nullable(),
  /** Signed tracking redirect to `website` through node-api (/go). */
  websiteRedirectUrl: z.string().nullable().optional(),
  googleMapsUri: z.string().nullable(),
  openNow: z.boolean().nullable(),
  weekdayHours: z.array(z.string()),
  businessStatus: z.string().nullable(),
  /** 'official' for the Tamil Nadu Tourism (TTDC) entry, 'google' for Places results. */
  source: z.enum(['official', 'google']),
});
export type Agency = z.infer<typeof Agency>;

export const DestinationAgencies = z.object({
  destinationId: z.string(),
  destinationName: z.string(),
  agencies: z.array(Agency),
});
export type DestinationAgencies = z.infer<typeof DestinationAgencies>;

// ---------------- Stays / price comparison ----------------
export const StayType = z.enum(['hotel', 'villa']);
export type StayType = z.infer<typeof StayType>;

export const StaySearchQuery = z.object({
  destination: z.string().min(1),
  checkIn: IsoDate,
  checkOut: IsoDate,
  adults: z.coerce.number().int().min(1).max(30).default(2),
  children: z.coerce.number().int().min(0).max(20).default(0),
  type: StayType.default('hotel'),
  sort: z.enum(['relevance', 'lowest_price', 'highest_rating']).default('relevance'),
  minPrice: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  pageToken: z.string().optional(),
});
export type StaySearchQuery = z.infer<typeof StaySearchQuery>;

export const StayProperty = z.object({
  propertyToken: z.string(),
  name: z.string(),
  type: z.string().nullable(),
  description: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  rating: z.number().nullable(),
  reviews: z.number().nullable(),
  hotelClass: z.number().nullable(),
  amenities: z.array(z.string()),
  images: z.array(z.string()),
  lowestNightlyInr: z.number().nullable(),
  lowestTotalInr: z.number().nullable(),
  link: z.string().nullable(),
});
export type StayProperty = z.infer<typeof StayProperty>;

export const StaySearchResult = z.object({
  properties: z.array(StayProperty),
  nextPageToken: z.string().nullable(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type StaySearchResult = z.infer<typeof StaySearchResult>;

export const StayOffer = z.object({
  platform: z.string(),
  platformLogo: z.string().nullable(),
  nightlyInr: z.number().nullable(),
  totalInr: z.number().nullable(),
  /** Direct link to the platform (from the provider). */
  deepLink: z.string(),
  /** Signed tracking redirect through node-api (/go). Use this in UIs. */
  redirectUrl: z.string().optional(),
  official: z.boolean(),
  freeCancellation: z.boolean(),
  cheapest: z.boolean(),
});
export type StayOffer = z.infer<typeof StayOffer>;

export const StayOffers = z.object({
  propertyToken: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  checkIn: IsoDate,
  checkOut: IsoDate,
  nights: z.number(),
  offers: z.array(StayOffer),
  cheapest: StayOffer.nullable(),
  /** Savings between the most expensive and the cheapest platform total. */
  maxSavingsInr: z.number().nullable(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type StayOffers = z.infer<typeof StayOffers>;

// ---------------- Trips ----------------
export const TripItemKind = z.enum(['attraction', 'stay', 'travel', 'note']);

export const TripItem = z.object({
  id: z.string().uuid(),
  tripDayId: z.string().uuid(),
  kind: TripItemKind,
  googlePlaceId: z.string().nullable(),
  title: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  startTime: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  sortOrder: z.number(),
  meta: z.record(z.unknown()),
});
export type TripItem = z.infer<typeof TripItem>;

export const TripDay = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  dayDate: IsoDate,
  destinationId: z.string(),
  notes: z.string().nullable(),
  items: z.array(TripItem),
});
export type TripDay = z.infer<typeof TripDay>;

export const SavedStay = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  destinationId: z.string().nullable(),
  propertyToken: z.string(),
  name: z.string(),
  propertyType: z.string(),
  checkIn: IsoDate,
  checkOut: IsoDate,
  chosenPlatform: z.string().nullable(),
  priceAtSaveInr: z.number().nullable(),
  deepLink: z.string().nullable(),
});
export type SavedStay = z.infer<typeof SavedStay>;

export const Trip = z.object({
  id: z.string().uuid(),
  title: z.string(),
  startDate: IsoDate,
  endDate: IsoDate,
  adults: z.number(),
  children: z.number(),
  status: z.enum(['draft', 'planned', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Trip = z.infer<typeof Trip>;

export const TripDetail = Trip.extend({
  days: z.array(TripDay),
  stays: z.array(SavedStay),
});
export type TripDetail = z.infer<typeof TripDetail>;

export const CreateTrip = z
  .object({
    title: z.string().min(1).max(120),
    startDate: IsoDate,
    endDate: IsoDate,
    adults: z.number().int().min(1).max(30).default(2),
    children: z.number().int().min(0).max(20).default(0),
    /** One destination per day, or a single destination for the whole trip. */
    destinationIds: z.array(z.string()).min(1),
  })
  .refine((t) => t.endDate >= t.startDate, { message: 'endDate must be on/after startDate' });
export type CreateTrip = z.infer<typeof CreateTrip>;

export const UpdateTrip = z.object({
  title: z.string().min(1).max(120).optional(),
  adults: z.number().int().min(1).max(30).optional(),
  children: z.number().int().min(0).max(20).optional(),
  status: z.enum(['draft', 'planned', 'archived']).optional(),
});
export type UpdateTrip = z.infer<typeof UpdateTrip>;

export const UpdateTripDay = z.object({
  destinationId: z.string().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpdateTripDay = z.infer<typeof UpdateTripDay>;

export const CreateTripItem = z.object({
  kind: TripItemKind,
  googlePlaceId: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  meta: z.record(z.unknown()).optional(),
});
export type CreateTripItem = z.infer<typeof CreateTripItem>;

export const UpdateTripItem = CreateTripItem.partial().extend({
  tripDayId: z.string().uuid().optional(),
});
export type UpdateTripItem = z.infer<typeof UpdateTripItem>;

export const ReorderItems = z.object({
  /** Item ids in the desired order for the given day. */
  itemIds: z.array(z.string().uuid()),
});
export type ReorderItems = z.infer<typeof ReorderItems>;

export const CreateSavedStay = z.object({
  destinationId: z.string().nullable().optional(),
  propertyToken: z.string(),
  name: z.string(),
  propertyType: StayType.default('hotel'),
  checkIn: IsoDate,
  checkOut: IsoDate,
  chosenPlatform: z.string().nullable().optional(),
  priceAtSaveInr: z.number().nullable().optional(),
  deepLink: z.string().url().nullable().optional(),
});
export type CreateSavedStay = z.infer<typeof CreateSavedStay>;

// ---------------- Enrichment (weather + routes) ----------------
export const DayWeather = z.object({
  date: IsoDate,
  tempMaxC: z.number().nullable(),
  tempMinC: z.number().nullable(),
  precipitationProbability: z.number().nullable(),
  weatherCode: z.number().nullable(),
  summary: z.string().nullable(),
});
export type DayWeather = z.infer<typeof DayWeather>;

export const Leg = z.object({
  fromItemId: z.string(),
  toItemId: z.string(),
  distanceMeters: z.number().nullable(),
  durationSeconds: z.number().nullable(),
});
export type Leg = z.infer<typeof Leg>;

export const TripEnrichment = z.object({
  days: z.array(
    z.object({
      tripDayId: z.string(),
      date: IsoDate,
      /** null when the date is outside the 16-day forecast window. */
      weather: DayWeather.nullable(),
      legs: z.array(Leg),
    }),
  ),
});
export type TripEnrichment = z.infer<typeof TripEnrichment>;

// ---------------- Errors ----------------
export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;
