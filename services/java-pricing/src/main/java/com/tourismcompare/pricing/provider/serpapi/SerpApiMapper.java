package com.tourismcompare.pricing.provider.serpapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.tourismcompare.pricing.api.StayOffer;
import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.api.StayProperty;
import com.tourismcompare.pricing.api.StaySearchResult;
import com.tourismcompare.pricing.domain.OfferRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Maps SerpApi Google Hotels JSON (https://serpapi.com/google-hotels-api and
 * https://serpapi.com/google-hotels-property-details-api) to our DTOs.
 */
public final class SerpApiMapper {

    public static final String PROVIDER = "serpapi_google_hotels";
    private final Clock clock;

    public SerpApiMapper(Clock clock) {
        this.clock = clock;
    }

    public StaySearchResult toSearchResult(JsonNode root) {
        List<StayProperty> out = new ArrayList<>();
        for (JsonNode p : root.path("properties")) {
            String token = text(p, "property_token");
            if (token == null) continue; // cannot compare prices without a token
            out.add(new StayProperty(
                    token,
                    text(p, "name"),
                    text(p, "type"),
                    text(p, "description"),
                    dbl(p.path("gps_coordinates"), "latitude"),
                    dbl(p.path("gps_coordinates"), "longitude"),
                    dbl(p, "overall_rating"),
                    integer(p, "reviews"),
                    integer(p, "extracted_hotel_class"),
                    strings(p.path("amenities")),
                    images(p.path("images")),
                    dbl(p.path("rate_per_night"), "extracted_lowest"),
                    dbl(p.path("total_rate"), "extracted_lowest"),
                    text(p, "link")));
        }
        String next = text(root.path("serpapi_pagination"), "next_page_token");
        return new StaySearchResult(out, next, Instant.now(clock), PROVIDER);
    }

    /** Raw offers (not deduplicated); see OfferRanker. */
    public StayOffers toOffers(JsonNode root, OfferRequest req) {
        if (root.path("name").isMissingNode() && !root.has("prices") && !root.has("featured_prices")) {
            return null;
        }
        List<StayOffer> offers = new ArrayList<>();
        for (String section : List.of("featured_prices", "prices")) {
            for (JsonNode o : root.path(section)) {
                String link = text(o, "link");
                String source = text(o, "source");
                if (link == null || source == null) continue; // not actionable without a redirect target
                Double nightly = dbl(o.path("rate_per_night"), "extracted_lowest");
                Double total = dbl(o.path("total_rate"), "extracted_lowest");
                if (total == null && nightly != null) total = nightly * req.nights();
                if (nightly == null && total != null && req.nights() > 0) nightly = total / req.nights();
                offers.add(new StayOffer(
                        source,
                        text(o, "logo"),
                        nightly,
                        total,
                        link,
                        o.path("official").asBoolean(false),
                        o.path("free_cancellation").asBoolean(false) || hasFreeCancellationRemark(o),
                        false));
            }
        }
        return new StayOffers(
                req.propertyToken(),
                text(root, "name"),
                text(root, "address"),
                text(root, "phone"),
                req.checkIn(),
                req.checkOut(),
                req.nights(),
                offers,
                null,
                null,
                Instant.now(clock),
                PROVIDER);
    }

    private static boolean hasFreeCancellationRemark(JsonNode offer) {
        for (JsonNode r : offer.path("remarks")) {
            if (r.asText("").toLowerCase().contains("free cancellation")) return true;
        }
        for (JsonNode room : offer.path("rooms")) {
            if (room.path("free_cancellation").asBoolean(false)) return true;
        }
        return false;
    }

    private static List<String> images(JsonNode arr) {
        List<String> out = new ArrayList<>();
        for (JsonNode i : arr) {
            String url = text(i, "original_image");
            if (url == null) url = text(i, "thumbnail");
            if (url != null) out.add(url);
            if (out.size() >= 6) break;
        }
        return out;
    }

    private static List<String> strings(JsonNode arr) {
        List<String> out = new ArrayList<>();
        for (JsonNode s : arr) if (s.isTextual()) out.add(s.asText());
        return out;
    }

    static String text(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isMissingNode() || v.isNull() || v.asText().isBlank() ? null : v.asText();
    }

    static Double dbl(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isNumber() ? v.asDouble() : null;
    }

    static Integer integer(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isNumber() ? v.asInt() : null;
    }
}
