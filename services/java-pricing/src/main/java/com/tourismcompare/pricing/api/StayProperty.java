package com.tourismcompare.pricing.api;

import java.util.List;

public record StayProperty(
        String propertyToken,
        String name,
        String type,
        String description,
        Double lat,
        Double lng,
        Double rating,
        Integer reviews,
        Integer hotelClass,
        List<String> amenities,
        List<String> images,
        Double lowestNightlyInr,
        Double lowestTotalInr,
        String link) {}
