package com.tourismcompare.pricing.config;

import com.tourismcompare.pricing.cache.InMemoryResponseCache;
import com.tourismcompare.pricing.cache.RedisResponseCache;
import com.tourismcompare.pricing.cache.ResponseCache;
import java.time.Clock;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class CacheConfig {

    @Bean
    ResponseCache responseCache(PricingProperties props, ObjectProvider<StringRedisTemplate> redis) {
        if ("redis".equalsIgnoreCase(props.cache().backend())) {
            return new RedisResponseCache(redis.getObject());
        }
        return new InMemoryResponseCache();
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
