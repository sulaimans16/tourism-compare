package com.tourismcompare.pricing.provider.serpapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourismcompare.pricing.config.PricingProperties;
import com.tourismcompare.pricing.provider.ProviderException;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class SerpApiClientParseTest {

    private final SerpApiClient client = new SerpApiClient(RestClient.builder(), new ObjectMapper(),
            new PricingProperties("t",
                    new PricingProperties.SerpApi("k", "http://localhost", "in", "en", "INR", Duration.ofSeconds(1)),
                    new PricingProperties.Cache("memory", Duration.ofMinutes(1), Duration.ofMinutes(1)),
                    new PricingProperties.Supabase("", "")));

    @Test
    void quotaErrorMapsToQuotaCode() {
        assertThatThrownBy(() -> client.parse(429, "{\"error\":\"Your account has run out of searches.\"}"))
                .isInstanceOf(ProviderException.class)
                .extracting(e -> ((ProviderException) e).code())
                .isEqualTo(ProviderException.Code.PROVIDER_QUOTA_EXCEEDED);
    }

    @Test
    void invalidKeyMapsToAuthFailure() {
        assertThatThrownBy(() -> client.parse(401, "{\"error\":\"Invalid API key.\"}"))
                .extracting(e -> ((ProviderException) e).code())
                .isEqualTo(ProviderException.Code.PROVIDER_AUTH_FAILED);
    }

    @Test
    void noResultsIsNotAnError() {
        var json = client.parse(200, "{\"error\":\"Google Hotels hasn't returned any results for this query.\"}");
        assertThat(json.path("properties").isMissingNode()).isTrue();
    }

    @Test
    void serverErrorIsTransient() {
        assertThatThrownBy(() -> client.parse(503, "oops"))
                .extracting(e -> ((ProviderException) e).code().transientFailure)
                .isEqualTo(true);
    }
}
