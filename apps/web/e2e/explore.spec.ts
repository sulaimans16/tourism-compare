import { expect, test, type Page } from '@playwright/test';

const live = !!process.env.E2E_LIVE;
const API = process.env.VITE_API_BASE_URL ?? 'http://api.e2e.local';

/** Stubbed API responses for keyless CI runs only (shape matches @tc/types). */
async function stubApi(page: Page) {
  const madurai = { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', region: 'Temple Towns', lat: 9.92, lng: 78.12, searchQuery: 'Madurai, Tamil Nadu', tags: ['temple'] };
  const offer = (platform: string, total: number, cheapest = false) => ({
    platform, platformLogo: null, nightlyInr: total / 2, totalInr: total, deepLink: `https://${platform.toLowerCase()}.example/h`,
    redirectUrl: `${API}/go?u=https%3A%2F%2F${platform.toLowerCase()}.example%2Fh&k=stay&s=sig`, official: false, freeCancellation: cheapest, cheapest,
  });
  await page.route(`${API}/**`, async (route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) => route.fulfill({ json: body });
    if (url.pathname === '/destinations') return json({ destinations: [madurai] });
    if (url.pathname === '/destinations/madurai') return json(madurai);
    if (url.pathname.endsWith('/photo')) return route.fulfill({ status: 404 });
    if (url.pathname === '/destinations/madurai/attractions')
      return json({ places: [{ placeId: 'p1', name: 'Meenakshi Amman Temple', address: null, lat: 9.91, lng: 78.11, rating: 4.8, userRatingCount: 90000, primaryType: 'hindu_temple', googleMapsUri: null, photoUrl: null, editorialSummary: null }], nextPageToken: null });
    if (url.pathname === '/stays/search')
      return json({ provider: 'stub', fetchedAt: new Date().toISOString(), nextPageToken: null, properties: [{ propertyToken: 'T1', name: 'Temple View Hotel', type: 'hotel', description: null, lat: null, lng: null, rating: 4.2, reviews: 800, hotelClass: 3, amenities: ['Free Wi-Fi'], images: [], lowestNightlyInr: 2400, lowestTotalInr: 4800, link: null }] });
    if (url.pathname === '/stays/T1/offers') {
      const offers = [offer('Agoda', 4800, true), offer('Booking', 5200)];
      return json({ propertyToken: 'T1', name: 'Temple View Hotel', address: 'Madurai', phone: null, checkIn: url.searchParams.get('checkIn'), checkOut: url.searchParams.get('checkOut'), nights: 2, offers, cheapest: offers[0], maxSavingsInr: 400, fetchedAt: new Date().toISOString(), provider: 'stub' });
    }
    if (url.pathname === '/destinations/madurai/agencies')
      return json({ destinationId: 'madurai', destinationName: 'Madurai', agencies: [
        { placeId: 'official:ttdc', name: 'Tamil Nadu Tourism Development Corporation (TTDC)', address: null, rating: null, userRatingCount: null, phone: null, internationalPhone: null, whatsappUrl: null, website: 'https://www.tamilnadutourism.tn.gov.in/', websiteRedirectUrl: null, googleMapsUri: null, openNow: null, weekdayHours: [], businessStatus: null, source: 'official' },
        { placeId: 'a1', name: 'Madurai Tours & Travels', address: 'Madurai', rating: 4.7, userRatingCount: 320, phone: '098430 00000', internationalPhone: '+91 98430 00000', whatsappUrl: 'https://wa.me/919843000000', website: null, websiteRedirectUrl: null, googleMapsUri: null, openNow: true, weekdayHours: [], businessStatus: 'OPERATIONAL', source: 'google' },
      ] });
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: url.pathname } } });
  });
}

test('explore Madurai: attractions, live stay comparison, agencies', async ({ page }) => {
  if (!live) await stubApi(page);
  await page.goto('/');
  await expect(page.getByTestId('destinations')).toContainText('Madurai');
  await page.getByTestId('destinations').getByRole('link', { name: 'Explore' }).first().click();
  await expect(page.getByRole('heading', { name: 'Madurai' })).toBeVisible();
  await expect(page.getByTestId('attractions')).toContainText(live ? /Meenakshi/i : 'Meenakshi Amman Temple');

  await page.getByRole('tab', { name: 'Stays & prices' }).click();
  await page.getByRole('button', { name: 'Compare prices' }).first().click({ timeout: 45_000 });
  const table = page.getByTestId('compare-table');
  await expect(table).toContainText('Lowest price', { timeout: 45_000 });
  const href = await table.getByRole('link').first().getAttribute('href');
  expect(href).toMatch(/\/go\?u=https?%3A/);
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('tab', { name: 'Agencies' }).click();
  const agencies = page.getByTestId('agency-list');
  await expect(agencies).toContainText('TTDC', { timeout: 30_000 });
  if (!live) await expect(agencies.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/919843000000');
});
