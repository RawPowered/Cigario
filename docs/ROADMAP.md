# Delivery roadmap and objective release gates

## Stage 0 — Locked design and local demonstration (this commit)
Deliverable: reusable visual tokens, six core screen journeys, sample catalog, inventory events, private notes, age declaration, scan capture shell and mobile Capacitor configuration.

**Gate:** source present and reviewed. The following are **not yet demonstrated**: npm installation, typecheck/build on a clean machine, iPhone/Android execution, visual pixel matching to the original raster and camera access on real devices.

## Stage 0.5 — Website and shared API (repository foundation)
- Added public responsive website, desktop sidebar/wide inventory UI, and `/app/` browser route.
- Added central PHP API, MariaDB migration, browser account form, and initial remote inventory calls.
- **Pending:** hosted Namecheap setup, clean npm build, backend database integration tests, database backups, account email verification/recovery, and native secure-token sync.

## Stage 1 — Visual acceptance and native shells
- Add the exact approved PNG to `design/reference/` (checksum pinned in README).
- Replace CSS-drawn demo cigars with licensed, optimized WebP/AVIF imagery matching approval.
- Tune spacing, fonts, cards, hero detail and nav visually against six iPhone screenshots and Android screen sizes.
- Install dependencies, generate lockfile, run TypeScript build and Capacitor sync.
- Run device tests on iPhone and Android including safe areas, camera, keyboard and large text.
**Pass:** CEO signs off side-by-side comparisons; builds launch and navigation works on devices.

## Stage 2 — Catalog and server
- Design/migrate PHP + MariaDB schema for brands, lines, vitolas and field provenance.
- Server auth, HTTPS, owner authorization, catalog editorial workflows, search API, secure images.
- Replace fictional samples with sourced catalog records and licensed photos.
**Pass:** user isolation, provenance, data export, restore drill and seeded catalog accuracy.

## Stage 3 — Inventory durability
- Migrate local prototype into IndexedDB and authenticated sync.
- Idempotent append-only event writes, nonnegative stock, conflict reconciliation.
- Backups, account recovery, moderation and audit.
**Pass:** offline 100-event replay without duplicates, simulated disconnects and two-device reconciliation.

## Stage 4 — Recognition qualification
- Build consent-based labeled photo test set from multiple bands, variants, angles, low light and background.
- Measure local OCR + catalog retrieval, Gemini and any approved alternative under the same test set.
- Record top-1/top-3 brand/line accuracy, vitola ambiguity, wrong confident answer rate, latency and unit economics.
- Keep manual fallback; never auto-commit vision guesses.
**Pass:** documented accuracy-cost thresholds agreed before production deployment.

## Stage 5 — Private beta and distribution gate
- Security assessment, data deletion/retention, incident recovery, accessibility.
- Counsel/platform review for informational tobacco app restrictions.
- Internal distribution; public app-store submissions only after policy review and signing readiness.
**Pass:** store eligibility and approved release plan, not merely technical build success.

## Deliberately deferred
Storefronts, purchase links, tobacco giveaways/affiliate funnels, sponsored cigar features, location/social discovery and aggressive recommendation prompts.
