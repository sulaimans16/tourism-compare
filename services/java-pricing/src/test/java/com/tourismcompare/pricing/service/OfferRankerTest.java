package com.tourismcompare.pricing.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourismcompare.pricing.api.StayOffer;
import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.StayType;
import com.tourismcompare.pricing.provider.serpapi.SerpApiMapper;
import java.io.InputStream;
import java.time.Clock;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class OfferRankerTest {

    @Test
    void dedupesByPlatformSortsAndFlagsCheapest() throws Exception {
        var om = new ObjectMapper();
        var req = new OfferRequest("TOKEN_A", "Ooty", LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 3), 2, 0,
                StayType.hotel);
        StayOffers raw;
        try (InputStream in = getClass().getResourceAsStream("/serpapi/property_offers.json")) {
            raw = new SerpApiMapper(Clock.systemUTC()).toOffers(om.readTree(in), req);
        }
        var ranked = OfferRanker.rank(raw);

        assertThat(ranked.offers()).extracting(StayOffer::platform)
                .containsExactly("Sample Hills Resort", "Agoda", "Booking.com", "MakeMyTrip");
        // official site wins the 8200 tie
        assertThat(ranked.cheapest().platform()).isEqualTo("Sample Hills Resort");
        assertThat(ranked.offers().getFirst().cheapest()).isTrue();
        assertThat(ranked.offers().stream().filter(StayOffer::cheapest)).hasSize(1);
        // Booking.com keeps its cheapest listing (8600, featured) not 8800
        var booking = ranked.offers().stream().filter(o -> o.platform().equals("Booking.com")).findFirst().orElseThrow();
        assertThat(booking.totalInr()).isEqualTo(8600.0);
        assertThat(booking.deepLink()).isEqualTo("https://booking.example/a");
        assertThat(ranked.maxSavingsInr()).isEqualTo(1800.0);
    }


}
