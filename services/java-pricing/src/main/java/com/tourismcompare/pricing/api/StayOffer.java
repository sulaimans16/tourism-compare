package com.tourismcompare.pricing.api;

public record StayOffer(
        String platform,
        String platformLogo,
        Double nightlyInr,
        Double totalInr,
        String deepLink,
        boolean official,
        boolean freeCancellation,
        boolean cheapest) {

    public StayOffer withCheapest(boolean value) {
        return new StayOffer(platform, platformLogo, nightlyInr, totalInr, deepLink, official, freeCancellation, value);
    }
}
