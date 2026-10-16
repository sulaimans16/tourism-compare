package com.tourismcompare.pricing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.api.StaySearchResult;
import com.tourismcompare.pricing.cache.ResponseCache;
import com.tourismcompare.pricing.config.PricingProperties;
import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.StaySearchRequest;
import com.tourismcompare.pricing.provider.PriceProvider;
import com.tourismcompare.pricing.snapshot.SnapshotWriter;
import java.util.Optional;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PriceComparisonService {

    private static final Logger log = LoggerFactory.getLogger(PriceComparisonService.class);

    private final PriceProvider provider;
    private final ResponseCache cache;
    private final ObjectMapper json;
    private final SnapshotWriter snapshots;
    private final PricingProperties.Cache ttl;

    public PriceComparisonService(PriceProvider provider, ResponseCache cache, ObjectMapper json,
            SnapshotWriter snapshots, PricingProperties props) {
        this.provider = provider;
        this.cache = cache;
        this.json = json;
        this.snapshots = snapshots;
        this.ttl = props.cache();
    }

    public StaySearchResult search(StaySearchRequest req) {
        return cached(req.cacheKey(), StaySearchResult.class, ttl.searchTtl(), () -> provider.search(req));
    }

    public StayOffers offers(OfferRequest req) {
        String key = req.cacheKey();
        Optional<StayOffers> hit = read(key, StayOffers.class);
        if (hit.isPresent()) return hit.get();
        StayOffers ranked = OfferRanker.rank(provider.offers(req));
        write(key, ranked, ttl.offersTtl());
        snapshots.record(ranked, req.adults(), req.children());
        return ranked;
    }

    private <T> T cached(String key, Class<T> type, java.time.Duration ttl, Supplier<T> loader) {
        return read(key, type).orElseGet(() -> {
            T fresh = loader.get();
            write(key, fresh, ttl);
            return fresh;
        });
    }

    private <T> Optional<T> read(String key, Class<T> type) {
        return cache.get(key).flatMap(s -> {
            try {
                return Optional.of(json.readValue(s, type));
            } catch (JsonProcessingException e) {
                log.warn("Dropping unreadable cache entry {}", key);
                return Optional.empty();
            }
        });
    }

    private void write(String key, Object value, java.time.Duration ttl) {
        try {
            cache.put(key, json.writeValueAsString(value), ttl);
        } catch (JsonProcessingException e) {
            log.warn("Could not cache {}: {}", key, e.getMessage());
        }
    }
}
