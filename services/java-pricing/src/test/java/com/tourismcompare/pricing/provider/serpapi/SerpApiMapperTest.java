package com.tourismcompare.pricing.provider.serpapi;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.StayType;
import java.io.InputStream;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class SerpApiMapperTest {

    private final ObjectMapper om = new ObjectMapper();
    private final SerpApiMapper mapper =
            new SerpApiMapper(Clock.fixed(Instant.parse("2026-10-16T00:00:00Z"), ZoneOffset.UTC));

    static JsonNode fixture(ObjectMapper om, String name) throws Exception {
        try (InputStream in = SerpApiMapperTest.class.getResourceAsStream("/serpapi/" + name)) {
            return om.readTree(in);
        }
    }

    @Test
    void mapsSearchAndSkipsPropertiesWithoutToken() throws Exception {
        var result = mapper.toSearchResult(fixture(om, "search_ooty.json"));
        assertThat(result.properties()).hasSize(1);
        var p = result.properties().getFirst();
        assertThat(p.propertyToken()).isEqualTo("TOKEN_A");
        assertThat(p.lowestNightlyInr()).isEqualTo(4200.0);
        assertThat(p.lowestTotalInr()).isEqualTo(8400.0);
        assertThat(p.hotelClass()).isEqualTo(4);
        assertThat(p.lat()).isEqualTo(11.41);
        assertThat(p.images()).containsExactly("https://example.org/o.jpg");
        assertThat(result.nextPageToken()).isEqualTo("NEXT_1");
    }

    @Test
    void mapsOffersAndDerivesMissingTotals() throws Exception {
        var req = new OfferRequest("TOKEN_A", "Ooty", LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 3), 2, 0,
                StayType.hotel);
        StayOffers offers = mapper.toOffers(fixture(om, "property_offers.json"), req);
        assertThat(offers.nights()).isEqualTo(2);
        assertThat(offers.offers()).hasSize(5); // NoLink dropped
        var official = offers.offers().stream().filter(o -> o.official()).findFirst().orElseThrow();
        assertThat(official.totalInr()).isEqualTo(8200.0); // 4100 * 2 nights
        assertThat(offers.offers().getFirst().freeCancellation()).isTrue();
    }
}
