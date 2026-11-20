# Cigario Atelier V0.4 validation matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| JavaScript syntax | PASS | `node --check app.js`, `node --check service-worker.js` |
| Data regression | PASS | 18 assertions in `android/test_offline_logic.cjs` |
| UI browser rendering | PASS | `qa/render_luxury.py` (320, 390, 430 and 768 px) |
| Horizontal overflow | PASS | Four viewport widths × seven flows |
| Browser runtime errors | PASS | No page errors in Chromium harness |
| Primary action visibility | PASS | Detail/Add dock bounding boxes in `qa/e2e_luxury.py` |
| End-to-end interaction | PASS | add lot, set quantity/price/source, decrement, and journal note |
| APK package/signing | STATIC PASS | ZIP integrity, DEX checksums, `jarsigner -verify` |
| Device installation | NOT TESTED | No Android phone or emulator connected |
| CEO reference pixel match | NOT CERTIFIED | Screenshots from Chromium differ in device fonts/WebView details |
| iPhone PWA installation | NOT TESTED | Requires deployed HTTPS route and real Safari device |
| Real catalog recognition/sync | NOT IMPLEMENTED | Explicitly out of offline prototype scope |

The browser screenshot harness uses data-URI versions of local images and a memory-only localStorage shim. Native WebView and iOS Safari may render fonts, focus states and safe areas differently. Experimental APK is debug signed, not Play Store ready. **Do not certify a production app from these checks.**