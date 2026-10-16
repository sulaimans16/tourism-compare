package com.tourismcompare.pricing.config;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed configuration. Required secrets are validated at startup so the service fails loudly
 * instead of silently returning empty or fake data.
 */
@Validated
@ConfigurationProperties(prefix = "pricing")
public record PricingProperties(
        @NotBlank(message = "PRICING_SERVICE_TOKEN must be set") String serviceToken,
        SerpApi serpapi,
        Cache cache,
        Supabase supabase) {

    public record SerpApi(
            @NotBlank(message = "SERPAPI_API_KEY must be set") String apiKey,
            @NotBlank String baseUrl,
            String country,
            String language,
            String currency,
            Duration timeout) {}

    public record Cache(String backend, Duration searchTtl, Duration offersTtl) {}

    public record Supabase(String url, String serviceRoleKey) {
        public boolean configured() {
            return url != null && !url.isBlank() && serviceRoleKey != null && !serviceRoleKey.isBlank();
        }
    }
}
