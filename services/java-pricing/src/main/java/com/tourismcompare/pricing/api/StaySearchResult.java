package com.tourismcompare.pricing.api;

import java.time.Instant;
import java.util.List;

public record StaySearchResult(List<StayProperty> properties, String nextPageToken, Instant fetchedAt, String provider) {}
