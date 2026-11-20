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