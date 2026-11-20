# Cigario user, inventory, scanner and administration flows

These graphs are implementation maps, not claims of completed production features. The local prototype currently implements manual catalog lookup, detail, new lot, humidor, event-based count and journal entries.

## Main journey
```mermaid
flowchart TD
  A[Adult entry] --> B[Discover]
  B --> C{Search or scan?}
  C -->|Search| D[Catalog results]
  C -->|Scan| E[Capture band]
  E --> F{Recognition available?}
  F -->|No| D
  F -->|Yes later| G[Ranked candidates]
  G --> H[User confirmation]
  H --> I[Cigar details]
  D --> I
  I --> J[Add to humidor]
  J --> K[Quantity date location source cost]
  K --> L[Save acquisition event]
  L --> M[My Humidor]
  M --> N[Lot overview]
  N --> O[Private journal]
  N --> P[Inventory history]
```

## Scanner confidence / failure states
```mermaid
flowchart TD
  A[Take photo] --> B{Image valid?}
  B -->|No| C[Retake or manual search]
  B -->|Yes| D[Local crop and text detection]
  D --> E{Catalog candidate matches?}
  E -->|Yes| F[Ranked candidates]
  E -->|No and consented| G[Optional provider API]
  G --> F
  G -->|Failure| C
  F --> H{Correct brand and line?}
  H -->|No| C
  H -->|Yes| I[Confirm vitola and version]
  I --> J[Open catalog record]
  J --> K[User decides whether to add]
```

## Provenance and stock ledger
```mermaid
flowchart TD
  A[Confirm product variant] --> B[Enter acquisition metadata]
  B --> C[Create lot]
  C --> D[Append acquisition positive event]
  D --> E[Display computed stock]
  E --> F{User operation}
  F -->|Consume| G[Append minus one event]
  F -->|Adjust| H[Append signed correction with reason]
  F -->|Review| I[Append private tasting note]
  G --> E
  H --> E
  I --> E
```

## Catalog curator
```mermaid
flowchart TD
  A[New or corrected cigar submission] --> B[Queue for curator]
  B --> C[Identify canonical brand line variant]
  C --> D[Check rights and field-level source]
  D --> E{Evidence verified?}
  E -->|No| F[Reject or request evidence]
  E -->|Yes| G[Publish versioned catalog record]
  G --> H[Rebuild search or band reference index]
  H --> I[Audit release and rollback]
```

## Offline sync (future)
```mermaid
flowchart TD
  A[Local edit] --> B[Durable local mutation queue]
  B --> C{Network available?}
  C -->|No| D[Show pending local status]
  D --> C
  C -->|Yes| E[Authenticated request with idempotency key]
  E --> F{Server accepted?}
  F -->|Yes| G[Commit synchronized state]
  F -->|Conflict| H[Resolve and retry safely]
  H --> E
```
