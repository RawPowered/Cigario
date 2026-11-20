# User stories & acceptance tests

## The approved six-step journey
1. Discover → search or scanner. User can browse without an account.
2. Search → result cards/filter by wrapper and vitola. Selecting a result opens a factual profile.
3. Detail → inspect strength, origin, wrapper, binder/filler, notes; select Add to Humidor.
4. Acquisition → quantity, format, purchased-at date, optional purchase price, location, source, memo; save only with a valid quantity and date.
5. My Humidor → search locally, view total current stock and each lot's stock.
6. Item → inspect profile, stock and history; record one unit consumed; create or view private review.

## Test cases
- Search finds "maduro"; wrapper filter reduces list; empty search gives a graceful no-results state.
- Enter 12 units and save once → exactly one acquisition event of +12, location and date preserved.
- Reload app → same recorded inventory survives locally.
- Consume a unit → exactly one -1 event and one lower count; zero-stock consumption disabled.
- History shows recorded events sorted by date; acquisition value and MSRP remain distinct.
- Journal entry persists and is associated with cigar and optional acquisition lot.
- Camera permission refused, model unavailable, or file missing → manual lookup remains reachable.
- 320px Android and 390px iPhone viewport, safe areas, keyboard focus, 44px controls, reduced-motion.
- New catalog entry requires field provenance; unknown info must remain unknown, never hallucinated.
- Private beta release requires functioning authenticated backend, secure sync, audits and restore test; prototype alone does not qualify.

## UI contract
CEO-approved layout and colors are held constant. All new screens reuse shared headers, cards, accents, CTA and navigation tokens.
