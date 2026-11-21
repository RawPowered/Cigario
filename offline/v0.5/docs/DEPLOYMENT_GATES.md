# Cigario v2 Integration — Release Gates

**State: backend prepared in source only; live service NOT deployed.**

## Safe development sequence

1. Maintain the approved luxury visual contract; keep V0.4 UI functional offline.
2. Back up MariaDB. Import `001_initial.sql` into a fresh database or verify it is already applied. Apply `002_collection_v2.sql` once. Confirm `schema_migrations` shows both versions; test roll-forward/restore on a disposable instance before touching real records.
3. Install PHP 8.2+ with `pdo_mysql`, `mbstring`, HTTPS, secure cookies, private config outside document root, and restricted MySQL user permissions. Namecheap shared hosting does not run a persistent Python inference daemon.
4. Deploy `api/v1/` and `api/v2/` under HTTPS. Confirm `_config` is not web accessible, and 403/401/405/422/409 behavior. Limit API requests to trusted origins; never use `*` with credentials.
5. Seed **real verified catalog** via a curator workflow; ensure field-level sources exist. Do not seed fictional UI examples as production data.
6. Test user A vs user B (positive and negative ownership), CSRF, invalid and expired bearer, rate limiting, duplicate import, interleaved import, imported review/lot association, stock underflow, unbalanced transfer and unknown catalog.
7. Add real account verification, recovery, deletion/export, audit, monitoring and backup/restore. Only then consider enabling registration.
8. Design bidirectional per-operation sync using durable native storage and UI conflict resolution. The V2 `initial-import` API intentionally does not implement this.
9. Port the complete V0.5 offline UX into the **main React/Capacitor** product and validate device permissions and UI. Standalone SDK-free WebView APK is not production distribution.
10. Evaluate app store eligibility for informational tobacco inventory, including iOS/Android policies; do not add sales or promotional mechanics to bypass store rules.

## Verification performed in this package

| Check | Result |
|---|---|
| Legacy offline data regression | Pass: 18 tests |
| V2 contract, UUID mapping and idempotency tests | Pass: 28 assertions |
| Offline zero-network behavior under test | Pass |
| Account/readiness responsive browser UI | Pass at 320/390/430 px |
| PHP syntax (`v1`, `v2`) | Pass |
| Experimental APK integrity and Java debug signature | Static pass |
| MariaDB migration in running server | **Not run**; no MariaDB / `pdo_mysql` available in this environment |
| Multi-user isolation and true API E2E | **Not tested** |
| Android/iPhone physical installation | **Not tested** |
| Production account sync / offline replay | **Not implemented** |

## Compatibility

- Existing V0.3/V0.4 offline localStorage key is retained, and local IDs remain unchanged; V2 stable UUID mappings are stored separately.
- V0.4 JSON backups remain restorable. New JSON backups preserve the integration identifier mapping but contain no auth credentials.
- An existing live API V1 installation requires additive migration 002, not a database replacement.
- Partial transfers now preserve original purchase cost and distinguish allocated cost. Historical V0.4 child-transfer prices are treated as allocated basis during V2 import.
- No network permissions have been introduced into the test APK. V2 client is dormant by design.

## Hard NO-GO conditions

No publishable catalogs, lost stock history, leaking user data across accounts, insecure token storage, silent sync merges, unsupported offline queue replay, untested DB migrations, missing export/restore validation, or physically untested native packages. A successful static build does not override these conditions.
