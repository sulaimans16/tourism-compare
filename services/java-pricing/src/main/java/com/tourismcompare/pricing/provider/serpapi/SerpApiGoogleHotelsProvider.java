package com.tourismcompare.pricing.provider.serpapi;

import com.tourismcompare.pricing.api.StayOffers;
import com.tourismcompare.pricing.api.StaySearchResult;
import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.StaySearchRequest;
import com.tourismcompare.pricing.domain.StayType;
import com.tourismcompare.pricing.provider.PriceProvider;
import com.tourismcompare.pricing.provider.ProviderException;
import java.time.Clock;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SerpApiGoogleHotelsProvider implements PriceProvider {

    /**
     * Google Hotels requires an age per child. We do not ask for ages yet, so we send a
     * school-age default; prices for families can differ slightly on some platforms.
     */
    static final int DEFAULT_CHILD_AGE = 8;

    private final SerpApiClient client;
    private final SerpApiMapper mapper;

    public SerpApiGoogleHotelsProvider(SerpApiClient client, Clock clock) {
        this.client = client;
        this.mapper = new SerpApiMapper(clock);
    }

    @Override
    public String id() {
        return SerpApiMapper.PROVIDER;
    }

    @Override
    public StaySearchResult search(StaySearchRequest r) {
        Map<String, String> p = base(r.destination(), r.type(), r.checkIn().toString(), r.checkOut().toString(),
                r.adults(), r.children());
        switch (r.sort()) {
            case lowest_price -> p.put("sort_by", "3");
            case highest_rating -> p.put("sort_by", "8");
            default -> { }
        }
        if (r.minPrice() != null) p.put("min_price", r.minPrice().toString());
        if (r.maxPrice() != null) p.put("max_price", r.maxPrice().toString());
        if (r.pageToken() != null && !r.pageToken().isBlank()) p.put("next_page_token", r.pageToken());
        return mapper.toSearchResult(client.googleHotels(p));
    }

    @Override
    public StayOffers offers(OfferRequest r) {
        Map<String, String> p = base(r.destination(), r.type(), r.checkIn().toString(), r.checkOut().toString(),
                r.adults(), r.children());
        p.put("property_token", r.propertyToken());
        StayOffers offers = mapper.toOffers(client.googleHotels(p), r);
        if (offers == null) {
            throw new ProviderException(ProviderException.Code.PROPERTY_NOT_FOUND, "Property not found for these dates");
        }
        return offers;
    }

    private static Map<String, String> base(String q, StayType type, String in, String out, int adults, int children) {
        Map<String, String> p = new LinkedHashMap<>();
        p.put("q", q);
        p.put("check_in_date", in);
        p.put("check_out_date", out);
        p.put("adults", String.valueOf(adults));
        if (children > 0) {
            p.put("children", String.valueOf(children));
            p.put("children_ages", String.join(",", Collections.nCopies(children, String.valueOf(DEFAULT_CHILD_AGE))));
        }
        if (type == StayType.villa) p.put("vacation_rentals", "true");
        return p;
    }
}
