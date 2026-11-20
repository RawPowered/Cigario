# Cigario Atelier v0.4 — Luxury UIX pass

**Design baseline:** CEO-approved six-screen Cigario Common Inventory Flow image.

### Luxury surfaces
- Recast home as a photographic private collection gallery with refined serif display typography, bronze overline and an inset frame.
- Elevated list cards, inventory metrics, humidor panels, ivory forms and product detail pages with restrained, layered depth.
- Balanced icons, tasting-note grid, editorial metadata, warm gold controls, filter chips, review tabs, and the five-tab dock.
- Added anchored actions for Add to Humidor and Save to Inventory to reduce scrolling during the primary journey.
- Set minimum 44px touch targets on critical small controls and reduced-motion states.
- Added contextual offline greeting and better focus/pressed affordances.

### Kept unchanged
- Seed catalog, existing acquisition and provenance structures, named humidors, transfer/correction ledger, detailed journal, JSON/CSV export/import.
- Offline operation: no internet permission, tracking, AI provider, or database dependency.
- Storage key `cigario-offline-v03` for same-origin continuity (no database schema change).

### Validation
- 18 inventory tests passed.
- Browser visual tests passed at 320×640, 390×844, 430×932, and 768×1024 without horizontal overflow or uncaught JS errors.
- Browser end-to-end test passed: search → detail → fixed add action → quantity → save → consumption → journal.
- APK generated, ZIP integrity and v1 debug signature verified; **Android installation still untested**.
- Real-device safe areas, native Back behavior, signing upgrade continuity, and exact reference matching still require human testing.