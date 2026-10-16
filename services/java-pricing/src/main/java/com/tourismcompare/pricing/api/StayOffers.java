package com.tourismcompare.pricing.api;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record StayOffers(
        String propertyToken,
        String name,
        String address,
        String phone,
        LocalDate checkIn,
        LocalDate checkOut,
        long nights,
        List<StayOffer> offers,
        StayOffer cheapest,
        Double maxSavingsInr,
        Instant fetchedAt,
        String provider) {}
