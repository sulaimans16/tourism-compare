package com.tourismcompare.pricing.snapshot;

import com.tourismcompare.pricing.api.StayOffer;
import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.config.PricingProperties;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Records every live comparison in Supabase (public.price_snapshots) via PostgREST, so the app
 * can show price history and "price when you saved it". Writes are asynchronous and best-effort.
 */
@Component
public class SnapshotWriter {

    private static final Logger log = LoggerFactory.getLogger(SnapshotWriter.class);
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final RestClient http;
    private final boolean enabled;

    public SnapshotWriter(RestClient.Builder builder, PricingProperties props) {
        var sb = props.supabase();
        this.enabled = sb.configured();
        this.http = enabled
                ? builder.clone()
                        .baseUrl(sb.url().replaceAll("/+$", "") + "/rest/v1")
                        .defaultHeader("apikey", sb.serviceRoleKey())
                        .defaultHeader("Authorization", "Bearer " + sb.serviceRoleKey())
                        .defaultHeader("Prefer", "return=minimal")
                        .build()
                : null;
        if (!enabled) log.warn("Supabase not configured; price snapshots will not be recorded");
    }

    public void record(StayOffers offers, int adults, int children) {
        if (!enabled || offers.offers().isEmpty()) return;
        List<Map<String, Object>> rows = offers.offers().stream()
                .filter(o -> o.totalInr() != null || o.nightlyInr() != null)
                .map(o -> row(offers, o, adults, children))
                .toList();
        if (rows.isEmpty()) return;
        executor.submit(() -> {
            try {
                http.post().uri("/price_snapshots").contentType(MediaType.APPLICATION_JSON).body(rows)
                        .retrieve().toBodilessEntity();
            } catch (RuntimeException e) {
                log.warn("Failed to write price snapshots: {}", e.getMessage());
            }
        });
    }

    private static Map<String, Object> row(StayOffers s, StayOffer o, int adults, int children) {
        var m = new java.util.HashMap<String, Object>();
        m.put("property_token", s.propertyToken());
        m.put("property_name", s.name());
        m.put("platform", o.platform());
        m.put("nightly_inr", o.nightlyInr());
        m.put("total_inr", o.totalInr());
        m.put("check_in", s.checkIn().toString());
        m.put("check_out", s.checkOut().toString());
        m.put("adults", adults);
        m.put("children", children);
        m.put("fetched_at", s.fetchedAt().toString());
        return m;
    }
}
