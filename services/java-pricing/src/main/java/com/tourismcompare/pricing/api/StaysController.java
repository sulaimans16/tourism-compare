package com.tourismcompare.pricing.api;

import com.tourismcompare.pricing.domain.OfferRequest;
import com.tourismcompare.pricing.domain.SortOrder;
import com.tourismcompare.pricing.domain.StaySearchRequest;
import com.tourismcompare.pricing.domain.StayType;
import com.tourismcompare.pricing.service.PriceComparisonService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/stays")
public class StaysController {

    private final PriceComparisonService service;

    public StaysController(PriceComparisonService service) {
        this.service = service;
    }

    @GetMapping("/search")
    public StaySearchResult search(
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "0") int children,
            @RequestParam(defaultValue = "hotel") StayType type,
            @RequestParam(defaultValue = "relevance") SortOrder sort,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String pageToken) {
        return service.search(new StaySearchRequest(destination, checkIn, checkOut, adults, children, type, sort,
                minPrice, maxPrice, pageToken));
    }

    @GetMapping("/{propertyToken}/offers")
    public StayOffers offers(
            @PathVariable String propertyToken,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "0") int children,
            @RequestParam(defaultValue = "hotel") StayType type) {
        return service.offers(new OfferRequest(propertyToken, destination, checkIn, checkOut, adults, children, type));
    }
}
