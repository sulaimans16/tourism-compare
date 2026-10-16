package com.tourismcompare.pricing.provider.serpapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourismcompare.pricing.config.PricingProperties;
import com.tourismcompare.pricing.provider.ProviderException;
import com.tourismcompare.pricing.provider.ProviderException.Code;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

/** Thin HTTP client for https://serpapi.com/search.json with retry + circuit breaker. */
@Component
public class SerpApiClient {

    private static final Logger log = LoggerFactory.getLogger(SerpApiClient.class);

    private final RestClient http;
    private final ObjectMapper mapper;
    private final PricingProperties.SerpApi cfg;
    private final Retry retry;
    private final CircuitBreaker breaker;

    public SerpApiClient(RestClient.Builder builder, ObjectMapper mapper, PricingProperties props) {
        this.cfg = props.serpapi();
        this.mapper = mapper;
        this.http = builder.baseUrl(cfg.baseUrl()).build();
        this.retry = Retry.of("serpapi", RetryConfig.custom()
                .maxAttempts(2)
                .waitDuration(Duration.ofMillis(400))
                .retryOnException(e -> e instanceof ProviderException pe && pe.code().transientFailure)
                .build());
        this.breaker = CircuitBreaker.of("serpapi", CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .slidingWindowSize(20)
                .minimumNumberOfCalls(5)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .recordException(e -> e instanceof ProviderException pe && pe.code().transientFailure)
                .build());
    }

    /** Executes a Google Hotels query. {@code params} must not include api_key/engine. */
    public JsonNode googleHotels(Map<String, String> params) {
        try {
            return breaker.executeSupplier(Retry.decorateSupplier(retry, () -> call(params)));
        } catch (CallNotPermittedException e) {
            throw new ProviderException(Code.PROVIDER_UNAVAILABLE, "Price provider temporarily unavailable", e);
        }
    }

    private JsonNode call(Map<String, String> params) {
        String body;
        int status;
        try {
            var response = http.get()
                    .uri(b -> {
                        UriBuilder u = b.path("/search.json")
                                .queryParam("engine", "google_hotels")
                                .queryParam("gl", cfg.country())
                                .queryParam("hl", cfg.language())
                                .queryParam("currency", cfg.currency());
                        params.forEach(u::queryParam);
                        return u.queryParam("api_key", cfg.apiKey()).build();
                    })
                    .retrieve()
                    .onStatus(s -> true, (req, res) -> { /* handled below */ })
                    .toEntity(String.class);
            body = response.getBody();
            status = response.getStatusCode().value();
        } catch (ResourceAccessException e) {
            throw new ProviderException(Code.PROVIDER_UNAVAILABLE, "Could not reach SerpApi: " + e.getMessage(), e);
        }
        return parse(status, body);
    }

    JsonNode parse(int status, String body) {
        JsonNode json;
        try {
            json = mapper.readTree(body == null ? "{}" : body);
        } catch (IOException e) {
            throw new ProviderException(Code.PROVIDER_UNAVAILABLE, "Invalid JSON from SerpApi (HTTP " + status + ")", e);
        }
        String error = json.path("error").asText(null);
        if (error != null) {
            String lower = error.toLowerCase();
            // An empty result set is not an error for our clients.
            if (lower.contains("hasn't returned any results")) {
                return json;
            }
            log.warn("SerpApi error (HTTP {}): {}", status, error);
            if (status == 429 || lower.contains("run out of searches") || lower.contains("rate limit")) {
                throw new ProviderException(Code.PROVIDER_QUOTA_EXCEEDED, "Live price quota exhausted, try again later");
            }
            if (status == 401 || lower.contains("invalid api key")) {
                throw new ProviderException(Code.PROVIDER_AUTH_FAILED, "Price provider rejected our credentials");
            }
            if (lower.contains("property_token") || lower.contains("property token")) {
                throw new ProviderException(Code.PROPERTY_NOT_FOUND, error);
            }
            if (status >= 500) {
                throw new ProviderException(Code.PROVIDER_UNAVAILABLE, error);
            }
            throw new ProviderException(Code.PROVIDER_BAD_REQUEST, error);
        }
        if (status >= 500) {
            throw new ProviderException(Code.PROVIDER_UNAVAILABLE, "SerpApi HTTP " + status);
        }
        if (status >= 400) {
            throw new ProviderException(Code.PROVIDER_BAD_REQUEST, "SerpApi HTTP " + status);
        }
        return json;
    }
}
