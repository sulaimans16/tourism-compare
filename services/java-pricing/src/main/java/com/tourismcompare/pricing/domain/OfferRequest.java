package com.tourismcompare.pricing.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record OfferRequest(
        String propertyToken,
        String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        StayType type) {

    public OfferRequest {
        if (propertyToken == null || propertyToken.isBlank()) throw new IllegalArgumentException("propertyToken is required");
        if (destination == null || destination.isBlank()) throw new IllegalArgumentException("destination is required");
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn))
            throw new IllegalArgumentException("checkOut must be after checkIn");
        if (adults < 1) throw new IllegalArgumentException("adults must be >= 1");
        if (children < 0) throw new IllegalArgumentException("children must be >= 0");
        if (type == null) type = StayType.hotel;
    }

    public long nights() {
        return ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    public String cacheKey() {
        return String.join("|", "offers", propertyToken, checkIn.toString(), checkOut.toString(),
                String.valueOf(adults), String.valueOf(children), type.name());
    }
}
