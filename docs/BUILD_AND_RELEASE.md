# Build & release gates

## Prerequisites
Node.js 20+ (check the requirements for the pinned toolchain), npm, Xcode/macOS for iPhone, Android Studio/JDK for Android. Install the exact dependencies from a generated lockfile before release.

```bash
npm install
npm run typecheck
npm run build
npx cap add android
npx cap add ios
npx cap sync
```
Capacitor projects are generated locally and are not represented as already built in this repository. For Android open the project with `npx cap open android`; on macOS use `npx cap open ios`. Set unique signed application IDs, privacy disclosures, and assets before distribution.

## Combined website and API build
Run `npm run build` and verify both `dist/index.html` and `dist/app/index.html`. The website, browser application and native Capacitor app share source code but not runtime identity. Upload built static assets to the domain root and the server's `index.php` separately under `api/v1/`. Import `server/database/001_initial.sql` into MariaDB and keep private config outside public_html. Full instructions: `docs/WEBSITE_AND_DATABASE.md`.

## Release sequence
1. Compare actual iPhone and Android screenshots to `docs/DESIGN_LOCK.md` and the CEO-approved reference.
2. Replace sample records with permissioned, sourced catalog material; verify prices and metadata.
3. Migrate local prototype storage to authenticated API and IndexedDB-backed offline queue; test replay/idempotency.
4. Confirm backup/restore, logout, export, delete, accessibility, keyboard/screen-reader usage, and multi-account isolation.
5. Measure recognition on consented, real cigar-band test photos; retain manual fallback.
6. Review Apple and Google tobacco-related policies, permissions, disclosures and content with appropriate counsel. **No assumption of app-store acceptance.**
7. Produce device-signed builds, test on physical phones, and perform staged private distribution only where permitted.

## Deployment economics
Namecheap shared hosting is an optional **PHP+MariaDB backend**, not a mobile builder, persistent Python inference host, or push-processing environment. Keep inference off shared hosting. Static web builds can be uploaded to an HTTPS host; route API requests separately and never put secrets in `VITE_` variables.

## Explicitly not implemented yet
Backend, authentication, user account sync, security hardening, functional band recognition, app-store packages, store review, licensed cigar photos, production catalog or production payments.
