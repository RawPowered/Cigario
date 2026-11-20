# Cigario · Offline Android UI Skeleton v0.2

**A standalone internal Android APK prototype.** It requires **no online hosting, no database server, no paid AI API, no account, and no network permission**. Everything you interact with is a local demonstration of the CEO-approved six-step Cigario inventory flow.

## Download/install

APK: `Cigario-Offline-v0.2-debug.apk` (distributed alongside this source archive).

On an Android device:
1. Transfer the APK to the device (USB, local file transfer, etc.).
2. Open the APK in the device Files application.
3. If asked, permit "Install unknown apps" for that source, then install.
4. Open **Cigario** and confirm that you are 21 or older.
5. Explore **Discover → Search → Detail → Add → Humidor → Review/Journal**.

**Important:** Package ZIP structure, DEX header/checksum and APK signature are tested, but **installation on a physical Android device has not been tested in this environment**. This is an experimental SDK-free build; it may not work on every Android release or manufacturer. If installation fails, use the source web preview and rebuild with official Android Studio/Capacitor tooling. Do not treat it as Play Store-ready.

## What works without any server

- Branded mobile home with humidor totals and search actions.
- Four **fictional sample catalog records**, with wrapper, origin, vitola, strength, notes and representative images cropped from the approved concept art.
- Search with wrapper and vitola filters.
- Cigar detail pages.
- Add lot with quantity, format, date, source, location, optional price paid and notes.
- Humidor search, inventory counters and stock history.
- Log one cigar consumed, with append-only local event.
- Add personal journal notes with a 1–5 rating.
- Persistent **device-local** storage via WebView localStorage (not backed up or encrypted).
- Age declaration for adults 21+; not formal age verification.

## Not enabled in this build

- Real image recognition, OCR, camera capture or video scanning.
- Cloud catalog, real manufacturer entries, brand links, live MSRPs, feeds or APIs.
- Accounts, native secure sync, backup, browser sharing, purchases, payments or ads.
- Native launcher icon resources (APK icon may use Android default). The app interface includes a matching Cigario leaf logo.
- Android Back button screen-level navigation and platform-specific accessibility certification.

The source has **no `INTERNET` permission**. There is no remote dependency during usage. The `.webp` photo crops are from the CEO-approved AI-generated Cigario concept and are **not brand-verified cigar photos**.

## Rebuild experimental APK locally

Requirements: Python 3.8+ and Java `keytool` / `jarsigner` on PATH. No Android SDK is needed for the experimental debug package.

```bash
python android/build_apk.py Cigario-Offline-v0.2-debug.apk
node android/test_offline_logic.cjs
```

The debug signing certificate is generated **anew for each build**. Installing an APK signed with a different certificate over a previous copy will fail. Uninstall a prior debug version before installing a newly generated one; doing so removes on-device records. Keep the original APK if you want to preserve that installation.

## Production path

The parent GitHub repo at https://github.com/RawPowered/Cigario is the **main React/TypeScript + Capacitor source of truth**. This bundle is a separate, single-page offline prototype designed for quick Android review without paid infrastructure. Once the UI is signed off, its visual assets and styles should be ported into the Capacitor implementation and rebuilt with the official Android SDK, modern target API, APK Signature Scheme v2/v3, and a real regression suite. Do not attempt app-store publication with this debug APK.

## Integrity and privacy

- `AndroidManifest.xml` binary format and DEX integrity are checked by the build script.
- `jarsigner -verify` confirms the v1 debug certificate signature.
- No cloud endpoints, telemetry, tracking, purchases or tobacco promotions exist.
- All source files are included for independent inspection.
- Browser UI rendering and physical Android installation still require external device QA.