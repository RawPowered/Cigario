# Cigario · Offline Collection Studio v0.3

An **internal prototype** of Cigario's approved green/ivory/bronze experience. All catalogue items are fictional. It uses no hosting, internet permissions, account, commerce, telemetry, or paid AI service.

## Install

- Android: use `Cigario-Offline-v0.3-debug.apk` from this delivery. It is a **debug-signed experimental APK**, not Play Store-ready. Device installation has not been certified; if installation fails use the browser preview or rebuild with the official Android SDK.
- iPhone: an installable, signed IPA cannot be produced here without macOS/Xcode and Apple provisioning. The source contains a service worker and manifest to permit a **free HTTPS-hosted iPhone Home Screen PWA** later. An offline Xcode project source is also supplied separately.
- Browser: open `index.html` in an unrestricted modern browser (on `file://`, most functions work locally; PWA registration requires HTTPS). Safari on iOS needs HTTPS for Home Screen PWA installation.

## New in v0.3

- Unlimited named virtual humidors in local storage, with an optional shelf/tray for each acquisition.
- Humidor filters, name/stock/date sorting, search, and separate lot histories.
- Stock corrections with required reasons; every quantity change creates a new event.
- Lot metadata editing with a recorded correction note.
- Full and partial lot transfers with linked source/destination stock events and an `originLotId` reference.
- Private quick reviews and advanced reviews with first/middle/final third observations and draw/construction values.
- Full JSON backups and imports (with structural checks and an explicit replacement confirmation). Inventory CSV export, shown in a copyable text area.
- Automatic migration of v0.2 local browser storage to v0.3 on the same origin/installation.
- Photo-only image crops from the CEO-approved image remove baked-in text, icon overlays, and duplicated headings.
- HTTPS-only PWA manifest/service worker for future iPhone web installation.

## Try the core journey

Age declaration → Discover → Search `maduro` → Cigar Detail → Add to Humidor → choose storage + shelf → Save → Humidor → open lot → Edit / Transfer / Adjust / Journal → Account → Import & Export.

## Data limitations

- The seed catalog is **fictional**; the photographs come from an AI concept, not licensed photography of authenticated real products. MSRP examples are illustrative, not market prices.
- All state lives in `localStorage` and is **not encrypted, synchronized, or backed up to a server**. Copy a complete JSON backup before reinstalling. A debug APK with a new signing certificate cannot update the previous APK in place and may require uninstalling it, destroying local data.
- The Xcode project's WebView bridge may also write a redundant copy into device UserDefaults for prototype continuity; not appropriate for production personal data.
- No image recognition or OCR yet. Scanner routes to manual catalog search.
- No native icon resources, no native Back handling, no push notifications or sensor permissions in the experimental Android APK.
- No tobacco commerce, ads, rewards or user-generated social feed.

## Rebuild Android (experimental)

Requires Python 3.8+ plus Java `keytool` and `jarsigner`:

```bash
python android/build_apk.py Cigario-Offline-v0.3-debug.apk
node android/test_offline_logic.cjs
```

The build generator creates a **new random debug signing key each time**, so it cannot reliably update an earlier installation. Use an official Android SDK + Gradle signing setup for maintained release builds.

## Testing and verification

- `node --check app.js` and service worker syntax
- automated 18-assertion smoke/regression suite including migration, transfers, journal, corrections, and backup
- visual Chromium screenshots at 390×844 using an in-memory harness (not real Android/iOS WebView)
- APK DEX checksums, manifest structure, ZIP integrity and Java signing. Physical installation has **not** been performed.

## Longer-term product

The authoritative production repo remains [RawPowered/Cigario](https://github.com/RawPowered/Cigario), whose React/Capacitor implementation is architecturally distinct from this standalone offline test shell. Port these tested interactions to that source before any production distribution.
