package com.tourismcompare.pricing.provider;

import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.api.StaySearchResult;
import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.StaySearchRequest;

/**
 * A live source of stay listings and per-platform prices. Implementations must return only
 * what the upstream returned. They never synthesise prices.
 */
public interface PriceProvider {

    String id();

    StaySearchResult search(StaySearchRequest request);

    /** Offers as returned by the provider; ranking/deduping happens in PriceComparisonService. */
    StayOffers offers(OfferRequest request);
}
