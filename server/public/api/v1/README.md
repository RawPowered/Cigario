# Cigario v1 HTTP API

- `GET /api/v1/health` - configuration presence (no database credentials exposed)
- `GET /api/v1/catalog` - public published catalog, bounded to 500 rows
- `GET /api/v1/auth/csrf` - bootstrap same-origin session token
- `POST /api/v1/auth/register` - disabled unless explicitly enabled in private config
- `POST /api/v1/auth/login` - HTML session cookie; optional 7-day bearer token only when `X-Cigario-Client: native`
- `POST /api/v1/auth/logout` - end session or delete bearer token
- `GET /api/v1/auth/me` - authenticated identity
- `GET /api/v1/inventory` - user-owned lots, stock events and journal entries
- `POST /api/v1/lots` - idempotent owner acquisition, one stock event
- `POST /api/v1/events` - idempotent single-unit inventory decrement, protected against negative stock
- `POST /api/v1/reviews` - personal notes and 1–5 ratings

All requests and responses are JSON. Mutating browser requests require `X-CSRF-Token` returned by `/auth/csrf`; authenticated native requests will use the bearer token once secure OS storage and app integration are implemented. There is no operator login console or catalog editor yet. Catalog is empty by default, and no demo identities or seed data are silently imported.

**Unfinished:** deployed browser authentication and synchronization validation; secure native token storage; production security/load/restore reviews; email verification and password recovery; native authentication and production deploy. The routes and schema are an implementation foundation, not a certified production service.
