# Offline Android V0.2 — packaging evidence

Status: **internal prototype / static validation only**.

- APK filename: `Cigario-Offline-v0.2-debug.apk`
- APK SHA-256: `be95302eb0ce54381e3741231d2c8cf41df27f3bd65173593bcf94a0bf020841`
- Offline source archive: `Cigario_Offline_Source_v0.2.zip`
- Source SHA-256: `80e185946713ed78e6c83e77d09e16d1c2e866f4ea051aa5df773a66f587711f`
- Built November 20, 2026 without Android SDK using Java jarsigner and a standalone WebView container.
- `node --check app.js`: PASS.
- `node android/test_offline_logic.cjs`: PASS for age entry, search, detail, acquisition, inventory decrement, journal, and account inventory count.
- Android manifest binary chunk structure: PASS.
- Dalvik DEX header SHA-1/Adler32: PASS.
- Archive integrity check: PASS.
- `jarsigner -verify`: PASS (v1 debug signing).
- No INTERNET permission.
- **Physical install: NOT TESTED.** Android emulator/SDK unavailable in execution container.
- **Visual screenshot match: NOT TESTED.** The available Chromium is restricted by administrator URL policy.
- **Store readiness: FAIL/NOT APPLICABLE.** Debug package targets Android API 28, is v1-signed, and does not meet current Google Play release requirements. <https://developer.android.com/google/play/requirements/target-sdk>

The editable offline source and APK are supplied as conversation artifacts and are **not yet binary assets of this GitHub repository**. The repository's React/Capacitor product remains the long-term source of truth. Avoid merging independently generated WebView shells into the native release without an integration review.

The next implementation step is to port the approved visual/photo assets and offline-state interactions into `src/App.tsx`, then build a normal Android project using official SDK/Gradle tooling and sign it with an intentionally managed key.
