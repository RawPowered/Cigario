# Web + Mobile paired release checklist

**Source state:** This repository is an implementation foundation. No live deployment or real user test is claimed.

## Required routes
- `/` — informational Cigario website for desktop, laptop and phone browsers
- `/app/` — web application, including responsive desktop inventory workspace
- `/api/v1/health` — API status on the same HTTPS host
- `/api/v1/catalog` — published, verified records only

## Acceptance cases
- `npm install && npm run build` completes with both HTML entry points.
- Desktop viewport 1440×900 shows a sidebar, two-column search results and wider inventory cards; phone 390×844 retains CEO-approved five-tab layout.
- Native wrapper starts in the application rather than the public landing page.
- API health and CSRF endpoints return JSON; unconfigured DB denies private operations.
- Unknown Origin returns 403; user A cannot read user B's inventory.
- Duplicate stock event mutation ID does not decrement inventory twice; last remaining unit cannot be consumed twice.
- Register is disabled by default; password recovery, email verification and deletion still block external beta readiness.
- After sign-in, web app loads server inventory rather than merging local demo. On sign-out, local demo is restored.
- New catalog imports require source provenance. Null MSRP is displayed as unavailable, not free.
- Browser cookies are Secure, HttpOnly, SameSite=Lax; native tokens must be in Keychain/Keystore before native sync.
- Live database backup/restore is demonstrated before inviting users.

## Current checked evidence
- PHP 8.4 `php -l` passed for API entry point and example config.
- PHP built-in server smoke: `GET /health` returned 200 with `configured:false`, `GET /auth/csrf` returned a token, catalog returned configuration error without DB, and an unauthorized Origin returned 403.
- GitHub file writes and branch state were checked through the GitHub connector.
- **Not run yet:** npm install/build, actual MySQL migration, real web hosting, browser screenshot comparison, native packages, account integration E2E, security penetration tests or mobile app-store review.
