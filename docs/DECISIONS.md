# Architecture decision records

## ADR-001: React + Capacitor
**Decision:** One React/TypeScript mobile-first UI, packaged to iOS and Android via Capacitor.
**Why:** Matches RawGraded's existing TypeScript engineering patterns, and avoids maintaining multiple unrelated native UIs.
**Trade-off:** Camera/native access, performance and store acceptance require device QA; true offline sync is future work.

## ADR-002: No mandatory cloud service for prototype
**Decision:** Initial interactive demo is local only, with fictional data and no API keys.
**Why:** Safe UX validation before incurring hosting/model costs.
**Trade-off:** No real account backup, multi-device sync or security guarantees.

## ADR-003: Namecheap backend candidate
**Decision:** PHP/MariaDB on Namecheap shared hosting is the first low-cost backend candidate.
**Constraint:** No persistent worker or assumption of Python inference running there.
**Gate:** Load, backup, storage, cron and operational limits measured prior to beta.

## ADR-004: Image recognition provider selection deferred
**Decision:** Camera and manual-search UX first; hosted Gemini or OCR + embedding model only after quality-cost evaluation.
**Gate:** Real consented sample set, top-1/top-3, ambiguous line/vitola, latency, per-scan total cost and failure fallback.
**Constraint:** No auto-save on model result, no wrapper-color-to-strength inference.

## ADR-005: Store policy gates
**Decision:** An informational inventory journal; hold promotions, sales, giveaways, affiliate links and promotional daily spotlights.
**Gate:** Written Apple/Google submission readiness review, including potential rejection despite age restrictions.
