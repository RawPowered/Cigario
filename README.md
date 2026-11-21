# Cigario

**Adult-oriented cigar catalog and private humidor inventory.** A mobile-first product for **iPhone, Android, and the web**, built around a CEO-approved six-screen design.

> **Status:** Dual-entry website + web application, shared PHP/MariaDB API foundation, and Capacitor mobile source. **Not deployed or production-certified.** The local demo remains fictional; web account/inventory sync activates only after a properly configured backend and real catalog exist.

## Product flow
**Home → Search / Scan → Cigar Detail → Add to Humidor → My Humidor → Item Review / Journal**

The UI is governed by [the locked design contract](docs/DESIGN_LOCK.md). Visual changes require explicit product-owner approval. Preserve the dark forest-green shell, warm ivory cards, copper/gold accents, editorial serif headings, mobile bottom navigation, cigar imagery, spacing, and six-screen flow.

## Architecture
- **Mobile app:** React + TypeScript + Vite; Capacitor builds for Android and iOS.
- **Public website:** `/` is the SEO-ready informational landing page.
- **Web application:** `/app/` is a responsive desktop/laptop and phone browser experience with an optional signed-in cloud account.
- **Backend:** `server/public/api/v1/index.php` and `server/database/001_initial.sql` provide the first PHP 8.2+/MariaDB shared API. **No server is deployed.**
- **Image recognition:** separate future adapter for OCR / catalog search / optionally Gemini; no inference claimed in the demo.
- **Inventory:** local demo records persist on-device; a configured web account loads separate server-owned lots, idempotent acquisition/stock events and reviews. **Native secure-token sync is still pending.**

## Local start
```bash
npm install
npm run dev
```
For a release web build:
```bash
npm run build
```
The build targets two entry pages: `dist/index.html` (public website) and `dist/app/index.html` (web application). Native Capacitor loads the same root bundle and detects the native platform to open the app instead of the public site.

**Hosting and database setup:** [Website + API deployment guide](docs/WEBSITE_AND_DATABASE.md). **API reference:** [server/public/api/v1](server/public/api/v1/README.md).

For native scaffolds (after installing Xcode on macOS for iPhone or Android Studio for Android):
```bash
npx cap add android
npx cap add ios
npm run build
npx cap sync
```
The generated `android/` and `ios/` directories require real device tests, signing, bundle identifiers and store review before distribution. See `docs/BUILD_AND_RELEASE.md`.

## Boundaries
This is **not a purchase/affiliate/giveaway app**. App-store approval is uncertain even for informational tobacco catalog apps. An age statement is not identity verification. Do not build purchases, shop links, sponsored tobacco placement, or consumption-promotion mechanics without legal and platform review. Reference: [Apple 1.4.3](https://developer.apple.com/app-store/review/guidelines/) and [Google Play policy](https://support.google.com/googleplay/android-developer/answer/9878810).

## Source material
The initial requirements come from the Cigario planning Markdown, flowcharts, approved UI mockup, and a read-only review of RawGraded's public architecture. **Do not copy TCG grading algorithms into cigar identification.** Reuse engineering patterns only, and keep the separate application independent.

**© Cigario project.** Repository licensing and ownership must be agreed by the principals before third-party code is contributed or the application is distributed.
## Offline V0.3 prototype (Android & iPhone-ready web source)

The standalone, no-hosting, no-network application source, image assets, tests and experimental debug APK builder are versioned in [`offline/v0.3/`](offline/v0.3/README.md). V0.3 supports multiple humidors, provenance-based stock adjustments and transfers, editable acquisition metadata, advanced journal notes, and offline backup/export. It is **an internal test shell, not the production React/Capacitor application**. See [`offline/v0.3/qa/VALIDATION.md`](offline/v0.3/qa/VALIDATION.md) for device-signing and testing limitations.

## Cigario Atelier V0.4 — Luxury UIX prototype

The latest **offline luxury visual pass** is under [`offline/v0.4/`](offline/v0.4/README.md). It preserves the forest/ivory/bronze design contract and V0.3 data model while enhancing imagery, typography, visual hierarchy, tactile controls, focus states and a thumb-reach action dock on the catalog detail and acquisition screens. It includes Android experimental packaging source, an offline web/PWA entry, regression tests and browser visual QA.

**Status:** offline demonstrator, not a released native iPhone/Android application. Real-device visual fidelity and install tests remain pending. The broader React/Capacitor production implementation under `src/` still requires consolidation with the offline test shell.

## Backend-ready offline V0.5 (source and secure import contract)

[`offline/v0.5/`](offline/v0.5/README.md) retains the approved luxury offline UI while adding stable server UUID mapping, a local-only revision journal, explicit catalog reconciliation, and an opt-in HTTPS adapter that **does not make automatic requests**. `server/database/002_collection_v2.sql` and `server/public/api/v2/` add an authenticated, idempotent **initial-import-only** endpoint for complete humidors, provenance events and advanced reviews.

This is **not a deployed backend or live device sync**. Verified catalog, account/security setup, MariaDB integration tests, replay/conflict resolution, React/Capacitor consolidation and physical-device qualification remain required. See [`docs/BACKEND_READY_V05.md`](docs/BACKEND_READY_V05.md).
