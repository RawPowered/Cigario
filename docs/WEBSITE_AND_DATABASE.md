# Cigario Website + Mobile + API deployment (first-stage, 2026-11)

## One platform, three clients

- Public website: `/` (Vite multi-page build, SEO-ready public informational landing).
- Desktop/laptop web application: `/app/` (responsive React workspace with desktop navigation).
- Native iPhone/Android: Capacitor wraps the same shared React application; device build from `dist/index.html` routes to the app automatically using Capacitor platform detection.
- Shared backend: `https://YOUR-DOMAIN/api/v1/` over HTTPS, PHP 8.2+, MariaDB under Namecheap cPanel.

A website is not the database server. MariaDB sits behind the PHP API; clients must never connect directly to it.

## Build and install (requires a real domain / hosting account)

1. From repository root: `npm install && npm run build`. Confirm both `dist/index.html` and `dist/app/index.html` are created.
2. Create a fresh database and least-privilege DB user in cPanel (Databases > MySQL Databases). Import `server/database/001_initial.sql` using phpMyAdmin. No accounts or sample cigars are inserted automatically.
3. Copy `server/private/config.example.php` to `~/cigario-config.php`, replacing placeholders with the database credentials, a random auth salt, and exact production origin. This file **must stay outside** `public_html`.
4. Upload the **contents** of `dist/` into the site's HTTPS document root (e.g. `public_html/`). The Vite build includes the root `.htaccess` from `public/.htaccess`.
5. Upload `server/public/api/v1/index.php` and `server/public/api/v1/.htaccess` under the document root's `api/v1/` path; do not upload the private config, SQL migrations, or credentials into public_html.
6. Verify `https://DOMAIN/` opens the public site, `https://DOMAIN/app/` opens the application, and `https://DOMAIN/api/v1/health` responds with `ok:true,configured:true`. Verify `/api/v1/catalog` responds with an empty array until data is curated.
7. **Do not open user registration until** email verification/recovery, rate limiting, admin/support controls and privacy policies have been reviewed. Default `registration_enabled` is `false`.
8. Deploy a replacement website only after backing up the database and existing files. Application deploys must **not** overwrite server private config or migrations.

## Auth boundaries

Web login uses an HttpOnly Secure SameSite=Lax session cookie, same-origin requests, and CSRF token. Native bearer support is a future integration and requires platform-secure storage, client auth wiring, token rotation and logout testing. Do not store bearer tokens in the frontend's localStorage.

## Production limitations today

The public landing and desktop-responsive web app are source-complete but not hosted. The existing app uses fictional browser-local demonstration records. The React website now includes a same-origin account form and browser-to-API inventory operations, but these flows **have not been tested against a deployed MariaDB installation**. The API contains a first implementation of user-owned inventory operations, but needs further integration, tests, security review and recovery rehearsal before real user records are allowed. No domain, hosting, SSL or active database was configured here.

## Safety & operations

- Namecheap shared hosting does not support persistent daemon processes for an AI inference worker, and its cron schedule cannot run more frequently than every five minutes.
- All uploaded user images need a separate permissions, retention and scanning design before activation.
- Avoid uncited manufacturer claims or scraped images in the production catalog. Keep catalog review and field source provenance.
- Review Apple and Google tobacco content policies before native store publication. No affiliate purchases, giveaways or tobacco sales mechanics.
