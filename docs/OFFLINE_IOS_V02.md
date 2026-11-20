# Cigario iPhone Offline Prototype — Xcode Handoff (v0.2)

**Status: source project prepared; NOT compiled, signed, installed, or certified on iPhone.**

An Xcode-ready project has been assembled using the same **offline v0.2 HTML/CSS/JS and local WebP imagery** as the experimental Android APK. The complete source ZIP is distributed as a conversation artifact named **`Cigario-iPhone-Offline-v0.2-Xcode-Project.zip`**. The binary project ZIP is **not currently an asset in this repository**.

## Packaging

- Native iOS shell: SwiftUI + WKWebView using `loadFileURL` for bundled HTML and asset files.
- Application identity: `app.cigario.offline` (change to a unique identifier before signing).
- iPhone only; portrait interface; minimum deployment target iOS 16.0.
- Local records and age declaration: WKWebView storage plus prototype-only UserDefaults state bridge. Not encrypted production vault storage.
- Network navigation blocked; no backend or online service configured.
- No actual AI recognition, camera capture, synced catalog, or paid API dependency.
- The code is **separate from the main React/Capacitor source**; it exists for immediate prototype testing only.

## Install on your own iPhone for free

1. Use a **Mac** with **Xcode** installed.
2. Unzip the project and open `CigarioOffline.xcodeproj`.
3. In Xcode Settings → Accounts, sign into your personal Apple Account.
4. In target Signing & Capabilities, enable automatic signing and select your **Personal Team**; change the bundle ID if it is already in use.
5. Unlock and connect an iPhone, trust the Mac, and enable Developer Mode if prompted.
6. Select the connected iPhone in Xcode and click **Run**. Xcode compiles, signs and installs the app.
7. Test the entire offline journey: Discover → Search → Detail → Add → Humidor → Review/Journal; close/reopen to verify local persistence.

**Free Personal Team profiles expire after 7 days**, requiring periodic recompilation/reinstallation: https://developer.apple.com/help/account/basics/about-your-developer-account

## Installing on several iPhones

A paid Apple Developer Program membership is generally needed for stable distribution through TestFlight/registered devices. Apple lists membership at $99/year: https://developer.apple.com/programs/

TestFlight may be subject to external beta review. Cigario’s informational tobacco inventory design does not guarantee app approval; Apple App Review Guideline **1.4.3** prohibits apps encouraging tobacco consumption and tobacco sales facilitation: https://developer.apple.com/app-store/review/guidelines/

## Build verification

- **Passed locally:** Xcode `project.pbxproj` parsing with plutil, Swift syntax parse, Info.plist/Storyboard XML parsing, app icon presence, static JS syntax, offline logic regression suite, ZIP integrity.
- **Not available:** macOS `xcodebuild`, Apple signing certificate/provisioning, iPhone simulator/device, final screenshot fidelity verification, installable IPA.
- Never deliver the source ZIP to testers as if it were a signed IPA.

## Production consolidation

Before public beta, port the approved offline visual assets and the polished six-screen flow into `src/App.tsx` (shared React/Capacitor), then build real Android and iOS releases from the same main source. Keep private inventory, backend and age-policy controls behind explicit verification gates.
