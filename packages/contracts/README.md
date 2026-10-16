# Contracts

- `pricing.openapi.yaml`: the internal contract between `services/node-api` and `services/java-pricing`.
  The Java DTOs (`com.tourismcompare.pricing.api`) and the zod schemas in `@tc/types`
  (`StaySearchResult`, `StayOffers`) mirror it. Change this file first, then both sides.
- The public node-api routes are listed in the root README; request/response shapes are the zod schemas in `@tc/types`.
