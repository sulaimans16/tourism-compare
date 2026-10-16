package com.tourismcompare.pricing.cache;

import java.time.Duration;
import java.util.Optional;

/** Short-lived cache of serialised provider responses, to save upstream quota. */
public interface ResponseCache {
    Optional<String> get(String key);

    void put(String key, String value, Duration ttl);
}
