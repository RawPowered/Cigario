# Cigario Collection Contract v2 — Implementation Reference

## Authority
The **backend owns all authenticated customer records**. The offline app owns only local demonstration and explicitly unlinked content. The same cigar may appear in multiple purchase lots; each lot has one humidor, one origin, and an append-only stock event sequence.

## Canonical entity mapping

| Offline V0.4 field | V2 payload field | Server destination | Rule |
|---|---|---|---|
| `humidors[].id` | UUID `humidors[].id` | `humidors.id` | Per-device stable UUID map; names unique per owner |
| `lots[].id` | UUID `lots[].id` | `lots.id` | Never change after first import attempt |
| `lots[].cigarId` | `lots[].cigarId` | `cigar_catalog.id` | **Explicit human-confirmed mapping** to published, source-verified catalog; never send fictional IDs |
| `lots[].humidorId` | UUID `lots[].humidorId` | `lots.humidor_id` | Must be owned by same account |
| `lots[].originLotId` | UUID `lots[].originLotId` | `lots.origin_lot_id` | Linked partial transfers preserve lineage |
| `lots[].acquired` | `lots[].acquiredAt` | `lots.acquired_at` | Strict ISO local date |
| `lots[].qty` | `lots[].quantityAcquired` | `lots.quantity_acquired` | Positive original acquisition amount |
| `lots[].price` | `lots[].pricePaidCents` | `lots.price_paid_cents` | Total actual price paid, **not MSRP** |
| `lots[].allocatedCost` | `lots[].allocatedCostCents` | `lots.allocated_cost_cents` | Transfer allocation estimate; no fabricated second purchase |
| `lots[].notes` | `lots[].memo` | `lots.memo` | Owner-private |
| `events[].id` | UUID `events[].id` | `stock_events.id` | Append-only; original event order retained as `sequence` |
| `events[].kind` | `events[].kind` | `stock_events.kind` | Acquisition, consumed, adjustment, transfer_in/out, transferred, metadata_updated |
| `events[].tx` | UUID `events[].transactionId` | `stock_events.transaction_id` | Paired split transfers must net to zero |
| `events[].source` | `events[].note` | `stock_events.note` | User-entered reason, **not independent proof** |
| `reviews[].text` | `reviews[].notes` | `reviews.notes` | User-private journal |
| `reviews[].thirds` | `reviews[].thirds` | `reviews.thirds_json` | Optional advanced journal sections |

All identifiers are owner-scoped. Server checks ownership and catalog status; frontend UI is never an authorization boundary.

## First import handshake (not automatically invoked)

1. Member signs into a verified HTTPS backend. Native bearer tokens must be held in Android Keystore / iOS Keychain, not JS localStorage. Browser uses an HttpOnly Secure SameSite session with CSRF.
2. Client GETs `/api/v2/capabilities`; it must advertise `contract: cigario.collection.v2`, `initialImport: true`, `ongoingSync: false`.
3. Client GETs `/api/v1/auth/me`, `/api/v1/catalog`, `/api/v2/snapshot`. Account must be empty with revision 0.
4. User **manually confirms** exact canonical cigar variants and maps all local cigar IDs to verified published records. Demo IDs MUST NOT be promoted automatically.
5. `CigarioIntegration.prepareInitialImport(local, {ownerId, serverCatalogIds, confirmed: true, expectedRevision: 0})` produces a versioned payload, stable UUID mappings, and a stable mutation ID for an unchanged snapshot.
6. POST `/api/v2/import/preview` with authenticated credentials and CSRF or secure bearer token. Show counts, conflicts and a clear warning about initial import.
7. Only after a second explicit user action, POST the **identical payload** to `/api/v2/import/commit`. Server rejects nonempty accounts and mismatched revisions.
8. On HTTP 409 or network uncertainty, query the server before trying again. Reuse the same mutation ID for exact-payload retries; do not regenerate new IDs while the result is unknown.
9. Only after verified server read-back may the client mark a record synchronized. This V0.5 build **does not** perform that marking or auto-sync.

### Example envelope shape (illustrative, not an auto-executable request)

```json
{
  "contract": "cigario.collection.v2",
  "operation": "initial-import",
  "clientMutationId": "00000000-0000-4000-8000-000000000001",
  "deviceId": "00000000-0000-4000-8000-000000000002",
  "expectedServerRevision": 0,
  "source": "offline-v0.4",
  "localRevision": 1,
  "snapshot": {"humidors": [], "lots": [], "events": [], "reviews": []}
}
```

Note: the actual server requires at least one humidor and will reject unsupported or unverifiable examples.

## Event ordering and risk

Stock is computed from events in their original array sequence. An acquisition/transfer-in must account for its lot's original quantity. No negative intermediate balance is allowed; transferred paired events must sum to zero. Dates are not used to infer event ordering. The source has day-only timestamps for historic actions; UTC noon is an **import convention**, not a claim about true event time.

## Current limitations

This contract supports **one-time verified initial import**, not eventual consistency or operational multi-device sync. The local `outbox` stores revision markers for audit/debugging, **not replayable remote mutations**. Complete offline replay requires a durable transactional queue, per-operation CAS, idempotent server mutation endpoints, conflict UI, and merge rules. Server V1 endpoints cover fewer operations than the offline UI. V2 was created for initial import rather than pretending that V1 can accept the whole collection model.

## Known safety rules

No implicit networking or silent catalog remapping. No user data is uploaded when opening the offline app. No cloud credentials are embedded in JavaScript or the APK. Server import is disabled by default until hosted and configured. CSV is a report, not a lossless restore; use JSON plus mapping metadata. Existing localStorage records must be backed up before uninstalling or switching app signatures.
