# Portal Glossary

- Game registry: shared source of portal game metadata, routes, feature flags, and stable asset keys.
- Portal image asset: local visual asset resolved by key through `src/config/portalAssets.ts`.
- Cover asset: card-sized image used in portal grids and legacy default game cards.
- Hero asset: wide image used for featured portal presentation.
- Featured game: deterministic playable game selected from the registry for first-screen promotion.
- Fallback asset: local image returned when a registry or caller supplies an unknown asset key.
