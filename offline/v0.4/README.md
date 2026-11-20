# Cigario Atelier — Offline Luxury UIX v0.4

A **standalone offline prototype** implementing the CEO-approved Cigario visual identity: near-black forest green, emerald surfaces, warm ivory specimen cards, and restrained bronze/gold details. **Not a released store app or production collector database.** All seeded cigars and prices are fictional. No account, hosting, cloud API, tobacco purchases or telemetry is required.

## What changed visually

- Immersive photographic home gallery, subtle inset gold border, serif editorial headline, and quiet collection seal.
- Rebalanced ivory cigar cards, stronger metadata hierarchy, premium shadows and warmer cigar photography.
- More precise specimen detail hero, strength indicator, four-column tasting notes, provenance-readable facts.
- Consistent search chips, form controls, segmented tabs, humidors, stock timeline and journal cards.
- Always-accessible **Add to Humidor** and **Save to Inventory** actions above the five-tab navigation bar.
- Comfortable touch targets, focus-visible outlines, responsive safe-area spacing, restrained press animations and reduced-motion support.
- Local greeting uses the device hour. No location or network is accessed.

## Functionality kept intact

Multiple named humidors, search/filter/sort, acquisitions, provenance events, lot-level transfers and corrections, private journal entries (quick/advanced), stock history and JSON/CSV portability. The `cigario-offline-v03` localStorage key is **intentionally unchanged**: this presentation update does not migrate or discard V0.3 data on the same web origin. The schema is unchanged. On Android, however, the APK is signed with a new debug certificate and **cannot reliably upgrade a V0.3 installation in place**. Preserve important data first; removing an app can delete its local records.

## Running it

### Android test build

Download `Cigario-Atelier-Offline-v0.4-debug.apk` from the conversation and install it on an Android device that permits local APK installation. This APK was generated using an **experimental SDK-free WebView packager** (Android API target 28, debug v1 signing). It has passed static integrity checks but **has not been installed or tested on a physical Android phone**. It is not a Google Play production package.

### Desktop / iPhone web preview

Use the files in the separate `Cigario-Atelier-Web-v0.4.zip` package. Open `index.html` in a modern desktop browser for a local preview. To install it on iPhone as a PWA, upload those files to **HTTPS hosting** and open the site in Safari → Share → Add to Home Screen. HTTPS is necessary for service-worker installation; **no backend or user database is needed**. After the first load the static app can operate offline as long as the browser retains its cache and storage.

### Development and tests

```bash
node --check app.js
node --check service-worker.js
node android/test_offline_logic.cjs
python qa/render_luxury.py
python qa/e2e_luxury.py
python android/build_apk.py ./Cigario-Atelier-Offline-v0.4-debug.apk
```

The Chromium QA scripts use in-memory localStorage and local image-data injection, to avoid sandbox local-file navigation restrictions. These screenshots are browser renderings, not actual device screenshots.

## Important boundaries

- Visual fidelity is substantially improved but **not certified pixel-perfect** against the original presentation. Actual CEO approval and physical-device comparisons remain necessary.
- The camera view is only a manual-search fallback. **No cigar recognition, AI, or online APIs** are integrated.
- Reference pictures are cropped from the original approved AI-generated concept. They are not photographs of real, authenticated cigars.
- LocalStorage is neither encrypted nor server-backed. This is **demonstration data only**.
- The standalone WebView test shell and the main `src/` React + Capacitor app in the repository are still separate implementations. Consolidation is required before a maintained production release.
- The project is informational inventory software for adults. Store acceptance, even for non-sales tobacco apps, cannot be presumed.