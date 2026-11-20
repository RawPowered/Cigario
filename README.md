# Cigario

**Adult-oriented cigar catalog and private humidor inventory.** A mobile-first product for **iPhone, Android, and the web**, built around a CEO-approved six-screen design.

> **Status:** Foundation / internal prototype. This repository is not an app-store-approved application, a tobacco retailer, or a deployed cloud service. Demo records are fictional and local-only.

## Product flow
**Home → Search / Scan → Cigar Detail → Add to Humidor → My Humidor → Item Review / Journal**

The UI is governed by [the locked design contract](docs/DESIGN_LOCK.md). Visual changes require explicit product-owner approval. Preserve the dark forest-green shell, warm ivory cards, copper/gold accents, editorial serif headings, mobile bottom navigation, cigar imagery, spacing, and six-screen flow.

## Architecture
- **Mobile app:** React + TypeScript + Vite; Capacitor builds for Android and iOS.
- **Web fallback:** the same frontend can be deployed as a static site/PWA.
- **Early backend target:** PHP 8 + MariaDB on affordable shared hosting; not yet integrated.
- **Image recognition:** separate future adapter for OCR / catalog search / optionally Gemini; no inference claimed in the demo.
- **Inventory:** local prototype persists on device; future server writes must be authenticated, idempotent, and event-sourced.

## Local start
```bash
npm install
npm run dev
```
For a release web build:
```bash
npm run build
```
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