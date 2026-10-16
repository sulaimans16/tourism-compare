package com.tourismcompare.pricing.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import java.time.Duration;
import java.util.Optional;

/** Single-instance cache. Use the redis backend when running more than one replica. */
public class InMemoryResponseCache implements ResponseCache {

    private record Entry(String value, long ttlNanos) {}

    private final Cache<String, Entry> cache = Caffeine.newBuilder()
            .maximumSize(5_000)
            .expireAfter(new Expiry<String, Entry>() {
                public long expireAfterCreate(String k, Entry e, long now) { return e.ttlNanos(); }
                public long expireAfterUpdate(String k, Entry e, long now, long cur) { return e.ttlNanos(); }
                public long expireAfterRead(String k, Entry e, long now, long cur) { return cur; }
            })
            .build();

    @Override
    public Optional<String> get(String key) {
        Entry e = cache.getIfPresent(key);
        return e == null ? Optional.empty() : Optional.of(e.value());
    }

    @Override
    public void put(String key, String value, Duration ttl) {
        cache.put(key, new Entry(value, ttl.toNanos()));
    }
}
