package com.tourismcompare.pricing.service;

import com.tourismcompare.pricing.api.StayOffer;
import com.tourismcompare.pricing.api.StayOffers;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Pure ranking logic: one best offer per platform, sorted by total, cheapest flagged. */
public final class OfferRanker {

    private OfferRanker() {}

    private static final Comparator<StayOffer> BY_PRICE = Comparator
            .comparing((StayOffer o) -> o.totalInr() == null ? Double.MAX_VALUE : o.totalInr())
            .thenComparing(o -> !o.official()) // prefer the hotel's own site on ties
            .thenComparing(StayOffer::platform);

    public static StayOffers rank(StayOffers raw) {
        Map<String, StayOffer> best = new LinkedHashMap<>();
        for (StayOffer o : raw.offers()) {
            String key = o.platform().toLowerCase(Locale.ROOT).trim();
            StayOffer cur = best.get(key);
            if (cur == null || BY_PRICE.compare(o, cur) < 0) {
                // keep "official" if either listing from this platform says so
                boolean official = o.official() || (cur != null && cur.official());
                best.put(key, new StayOffer(o.platform(), o.platformLogo() != null ? o.platformLogo()
                        : cur != null ? cur.platformLogo() : null, o.nightlyInr(), o.totalInr(), o.deepLink(),
                        official, o.freeCancellation(), false));
            }
        }
        List<StayOffer> sorted = new ArrayList<>(best.values());
        sorted.sort(BY_PRICE);

        StayOffer cheapest = null;
        Double savings = null;
        List<StayOffer> priced = sorted.stream().filter(o -> o.totalInr() != null).toList();
        if (!priced.isEmpty()) {
            cheapest = priced.getFirst().withCheapest(true);
            double max = priced.getLast().totalInr();
            savings = priced.size() > 1 ? Math.round((max - cheapest.totalInr()) * 100.0) / 100.0 : 0.0;
            sorted.set(sorted.indexOf(priced.getFirst()), cheapest);
        }
        return new StayOffers(raw.propertyToken(), raw.name(), raw.address(), raw.phone(), raw.checkIn(),
                raw.checkOut(), raw.nights(), List.copyOf(sorted), cheapest, savings, raw.fetchedAt(), raw.provider());
    }
}
