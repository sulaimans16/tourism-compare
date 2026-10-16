package com.tourismcompare.pricing.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tourismcompare.pricing.provider.PriceProvider;
import com.tourismcompare.pricing.provider.ProviderException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class StaysControllerTest {

    @Autowired MockMvc mvc;
    @MockBean PriceProvider provider;

    private static final String IN = LocalDate.now().plusDays(30).toString();
    private static final String OUT = LocalDate.now().plusDays(32).toString();

    @Test
    void rejectsMissingServiceToken() throws Exception {
        mvc.perform(get("/v1/stays/search").param("destination", "Ooty").param("checkIn", IN).param("checkOut", OUT))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void validatesDates() throws Exception {
        mvc.perform(get("/v1/stays/search").header("X-Service-Token", "test-token")
                        .param("destination", "Ooty").param("checkIn", OUT).param("checkOut", IN))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void ranksOffersFromProvider() throws Exception {
        var in = LocalDate.parse(IN);
        var out = LocalDate.parse(OUT);
        when(provider.offers(any())).thenReturn(new StayOffers("T", "Hotel", null, null, in, out, 2, List.of(
                new StayOffer("Agoda", null, 5000.0, 10000.0, "https://a", false, false, false),
                new StayOffer("Booking.com", null, 4500.0, 9000.0, "https://b", false, true, false)),
                null, null, Instant.now(), "test"));
        mvc.perform(get("/v1/stays/T/offers").header("X-Service-Token", "test-token")
                        .param("destination", "Ooty").param("checkIn", IN).param("checkOut", OUT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offers[0].platform").value("Booking.com"))
                .andExpect(jsonPath("$.offers[0].cheapest").value(true))
                .andExpect(jsonPath("$.cheapest.totalInr").value(9000.0))
                .andExpect(jsonPath("$.maxSavingsInr").value(1000.0));
    }

    @Test
    void surfacesQuotaErrors() throws Exception {
        when(provider.search(any())).thenThrow(
                new ProviderException(ProviderException.Code.PROVIDER_QUOTA_EXCEEDED, "quota"));
        mvc.perform(get("/v1/stays/search").header("X-Service-Token", "test-token")
                        .param("destination", "Madurai").param("checkIn", IN).param("checkOut", OUT))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("PROVIDER_QUOTA_EXCEEDED"));
    }
}
