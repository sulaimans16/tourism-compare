package com.tourismcompare.pricing.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record StaySearchRequest(
        String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        StayType type,
        SortOrder sort,
        Integer minPrice,
        Integer maxPrice,
        String pageToken) {

    public StaySearchRequest {
        if (destination == null || destination.isBlank()) throw new IllegalArgumentException("destination is required");
        if (checkIn == null || checkOut == null) throw new IllegalArgumentException("checkIn and checkOut are required");
        if (!checkOut.isAfter(checkIn)) throw new IllegalArgumentException("checkOut must be after checkIn");
        if (checkIn.isBefore(LocalDate.now().minusDays(1))) throw new IllegalArgumentException("checkIn is in the past");
        if (adults < 1 || adults > 30) throw new IllegalArgumentException("adults must be 1-30");
        if (children < 0 || children > 20) throw new IllegalArgumentException("children must be 0-20");
        if (type == null) type = StayType.hotel;
        if (sort == null) sort = SortOrder.relevance;
    }

    public long nights() {
        return ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    public String cacheKey() {
        return String.join("|", "search", destination.toLowerCase().trim(), checkIn.toString(), checkOut.toString(),
                String.valueOf(adults), String.valueOf(children), type.name(), sort.name(),
                String.valueOf(minPrice), String.valueOf(maxPrice), String.valueOf(pageToken));
    }
}
