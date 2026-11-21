# Cigario V0.5 · Backend-Ready Integration Foundation

**Offline application preserved.** This package is a server-alignment release of the Cigario Atelier V0.4 prototype. All visible collection functionality remains offline, with no server, account, API token, network access, or purchases needed. The CEO-approved forest green / ivory / bronze look remains unchanged except for an Account → Integration Readiness panel.

## What is now implemented

- A versioned `cigario.collection.v2` contract with strict client-side validation, durable *local* change-revision journal, stable UUID mappings for legacy offline IDs, and preserved original event sequence.
- A local readiness report and complete JSON backup that includes identifier mappings (never credentials).
- An **opt-in, non-invoked** HTTPS client, requiring authenticated user identity, curated catalog matches and explicit import approval.
- An additive MariaDB migration (`backend/database/002_collection_v2.sql`) and authenticated PHP V2 **initial-import** endpoint with dry-run preview, per-user ownership, idempotency, history-preserving transactional import, negative-stock checks and optimistic revision safeguards.
- Structured before/after audit metadata for acquisition corrections and transfers; corrected split-transfer cost semantics: original paid cost is not duplicated on child lots; an allocated transfer basis is recorded separately.
- Unknown catalog IDs no longer silently open the first cigar. Null MSRP displays as unavailable. A future verified catalog adapter hook is present but never automatically loads external data.
- Updated experimental offline Android packaging to embed the integration scripts; no INTERNET permission.

## Local testing

```bash
node --check app.js
node --check integration/contract.js
node --check integration/client.js
node android/test_offline_logic.cjs
node qa/test_backend_contract.cjs
python qa/test_ui_integration.py
php -l backend/public_html/api/v2/index.php
```

The Playwright script works through injected scripts and memory-only local storage because direct localhost browser navigation may be blocked by the sandbox. The test renders account/readiness pages at 320/390/430 px.

## Data contract and database

Read `docs/SYNC_CONTRACT.md` and `docs/DEPLOYMENT_GATES.md` before connecting any real account. This package includes an independent PHP/MySQL 001 starter plus the additive 002 migration; the repository's canonical server path is `server/` rather than `backend/`.

Important: `POST /api/v2/import/commit` can only initialize an **empty** authenticated account with **explicit approval**. It cannot merge, rebase or continuously sync. Real catalog entries must be published and have at least one verified source. Existing fictional demo catalog entries have no valid server mapping and are blocked.

## Release blockers (NOT done)

- Real domain/HTTPS, PHP PDO MySQL and MariaDB migration execution, integration tests against actual database, backups and recovery.
- Durable SQLite/IndexedDB device storage, encrypted credentials, sign-in, email verification, and account deletion/recovery.
- Bidirectional sync, offline mutation queue replay, server-assigned revisions, conflict resolution, retry testing and multi-device ownership isolation.
- Consolidation of this standalone WebView UI with the main React/Capacitor project before native production distribution.
- Verified real catalog, licensed manufacturer media, consent-based identification, privacy/accessibility/policy review.
- Physical Android/iPhone installation or app-store acceptance.

**Don't turn on account registration or advertise cloud sync yet.**
