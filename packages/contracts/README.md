# Contracts

- `pricing.openapi.yaml`: the internal contract between `services/node-api` and `services/java-pricing`.
  The Java DTOs (`com.tourismcompare.pricing.api`) and the zod schemas in `@tc/types`
  (`StaySearchResult`, `StayOffers`) mirror it. Change this file first, then both sides.
- The public API spec for `services/node-api` is generated at runtime from route schemas and served at `/docs`.
