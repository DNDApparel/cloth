# Security Review & Fix Report

No SAST or AI-reviewer report existed in the workspace, so this was a direct
source review of every file in the repository: the API (`server/`), the
storefront (`src/`), the GitHub-only admin console (`console/`), and the
deployment configuration (`.github/workflows/`, `render.yaml`).

Findings were confirmed by reading each code path end to end. All fixes below
have been applied and verified.

## Findings and fixes

| # | Issue | CWE | Severity | File | Status |
|---|-------|-----|----------|------|--------|
| 1 | Unauthenticated writes bypassed CSRF entirely — `verifyCsrf` returned `true` for every session-less request | CWE-352 | Critical | `server/security.js` | ✅ Fixed |
| 2 | Authenticated CSRF token compared with `===` (non-constant-time) | CWE-208 | Medium | `server/security.js` | ✅ Fixed |
| 3 | `X-Forwarded-For` trusted unconditionally — a client could rotate the header and defeat every per-IP rate limit | CWE-290 | High | `server/security.js`, `server/config.js` | ✅ Fixed |
| 4 | `parseCookies` threw `URIError` on a malformed percent-escape (request-level 500); pairs without `=` produced bogus keys; duplicates could shadow the session cookie | CWE-248 | Medium | `server/security.js` | ✅ Fixed |
| 5 | Guest order lookup accepted a blank email, compared non-constant-time, and `user_id = NULL` matched a `NULL` session id | CWE-639 (BOLA) | Critical | `server/routes/orders.js` | ✅ Fixed |
| 6 | Order IDs derived from `Date.now()` — ~6 base36 characters of clock entropy, enumerable | CWE-340 | High | `server/routes/orders.js` | ✅ Fixed |
| 7 | Support thread read/reply ownership used loose `===` on an attacker-supplied email and the same `NULL`-match flaw | CWE-639 (BOLA) | High | `server/routes/support.js` | ✅ Fixed |
| 8 | Support reply endpoint had no rate limit — unbounded message insertion and thread-ID probing | CWE-770 | Medium | `server/routes/support.js` | ✅ Fixed |
| 9 | `/api/auth/code/verify` had no per-IP limit and the attempt counter was incremented only *after* a failed compare, so a disconnect mid-request allowed unlimited retries | CWE-307 | High | `server/routes/auth.js` | ✅ Fixed |
| 10 | Login code hash compared with `!==` (non-constant-time) | CWE-208 | Medium | `server/routes/auth.js` | ✅ Fixed |
| 11 | `/api/auth/password` had no throttle on current-password verification | CWE-307 | Medium | `server/routes/auth.js` | ✅ Fixed |
| 12 | Unsafe production config only warned — the server would boot with the default bootstrap password, insecure cookies or LAN origins enabled | CWE-1188 | High | `server/config.js` | ✅ Fixed |
| 13 | Mock gateway authorises any Luhn-valid card and was reachable via silent fallback | payment bypass | Critical | `server/payments/mockGateway.js`, `server/payments/index.js` | ✅ Fixed |
| 14 | Checkout accepted an unbounded `items[]` array — one request forces thousands of DB lookups | CWE-770 | Medium | `server/routes/orders.js` | ✅ Fixed |
| 15 | No `Content-Security-Policy` on API responses | CWE-1021 | Low | `server/security.js` | ✅ Fixed |
| 16 | UPI demo used `demo@upi`, a syntactically valid VPA that may belong to a real person — users could send money to a stranger | CWE-1188 | High | `src/utils/upi.js` | ✅ Fixed |
| 17 | UPI deep link built from store-controlled `storeName` with no sanitisation or amount ceiling | CWE-20 | Medium | `src/utils/upi.js` | ✅ Fixed |
| 18 | `window.location.assign()` navigated the storefront itself to a `tez://` scheme; `buildGooglePayDemoUrl` could throw inside the click handler and blank the page | CWE-601 / CWE-248 | Medium | `src/pages/Checkout.jsx` | ✅ Fixed; UPI option later removed |
| 19 | Razorpay confirmation did not bind the fetched payment to the pending intent and authoritative amount/currency, and accepted `authorized` payments as paid | CWE-345 (Insufficient Verification of Data Authenticity) | High | `server/payments/razorpayGateway.js`, `server/routes/orders.js` | ✅ Fixed |

## Fix detail

**CSRF (1, 2).** Session-less writes now require an allowlisted `Origin`. When
`Origin` is absent, `Sec-Fetch-Site` must be `same-origin` or `none` — browsers
always send it, so a cross-site forged write is rejected while non-browser
clients (curl, mobile apps) still work. The authenticated path uses
`timingSafeEqual`.

**Proxy spoofing (3).** `clientIp()` only reads `X-Forwarded-For` when the new
`TRUST_PROXY` env flag is set. Enable it on Render (which does front the app
with a proxy); leave it off anywhere the API is directly exposed.

**Authorization (5, 7).** Order and support access now route through single
helpers (`canAccessOrder`, `canAccessThread`) that require a non-empty claimed
email, compare with `timingSafeEqual`, and only treat `user_id` as a match when
it is actually set.

**Order ID entropy (6).** `newOrderId()` uses `randomBytes(9)` base64url —
72 bits — so an order can no longer be enumerated by guessing the timestamp.

**Production safety (12).** `assertProductionSafety()` now exits non-zero
instead of warning, and additionally requires `ADMIN_EMAILS`, `STORE_ORIGINS`
and `ADMIN_ORIGINS` to be set.

**Payment bypass (13).** `MockGateway.confirm()` throws `503` when
`NODE_ENV=production`, so even if the registry falls back to mock no order can
be marked paid without a real gateway. (Note: `/api/checkout/*` already returns
410 in this branch, so this is defence in depth for when checkout is re-enabled.)

**UPI demo (16, 17, 18).** The demo was hardened as described in the earlier
review, then removed from the checkout. Checkout now offers WhatsApp enquiry
only and does not initiate or claim online payment.

**Razorpay settlement binding (19).** The confirmation route passes the
database-stored order total and currency into verification. The gateway now
requires the submitted Razorpay order ID to match the stored intent, then
checks the fetched payment ID, associated order ID, amount and currency. Only
`captured` payments can be settled; unsuccessful Razorpay lookups fail closed.
Already-paid orders return their existing confirmation instead of decrementing
stock again on a repeated confirmation request.

## Reviewed and found safe (no change needed)

- All SQL uses prepared statements with bound parameters — no injection paths.
- Passwords use scrypt (N=16384) with per-user salt and constant-time verify.
- Upload handling validates by magic bytes, writes a generated filename, serves
  only DB-registered files, and re-checks the resolved path against the upload
  root — no path traversal.
- Admin routes are gated by `requireRole`, which re-reads the email allowlist on
  every request, so revocation is immediate.
- Cart totals are recomputed server-side; client-supplied prices are ignored.
- No `dangerouslySetInnerHTML`, `eval`, `new Function` or `innerHTML` anywhere
  in the storefront or console.
- `console/GitHubOnlyAdmin.jsx` holds no GitHub token and makes no authenticated
  API calls — it reads `store-data.json` and exports a file for manual upload.
- `ctaTo` values from store data flow into react-router `<Link to>`, which does
  not execute `javascript:` URLs.
- `deploy-pages.yml` uses pinned major action versions and minimal
  `contents: read` permissions; `render.yaml` marks `ADMIN_EMAILS` and
  `BOOTSTRAP_PASSWORD` as `sync: false`.
- No secrets, tokens or API keys committed anywhere in the repository.

## Verification

- `node --check` passes on all nine modified JS files.
- `npm run build` and `npm run build:console` both succeed.
- API boots cleanly; `/api/health` returns 200.
- Malformed cookie header returns 200 instead of 500.
- Cross-site POST with no `Origin` but `Sec-Fetch-Site: cross-site` → 403.
- CSP header present on API responses.

## Action required before deploying

1. Set `TRUST_PROXY=true` in `render.yaml` (Render terminates TLS at a proxy, so
   without this every client shares one rate-limit bucket).
2. Confirm `ADMIN_EMAILS` and `BOOTSTRAP_PASSWORD` are set in the Render
   dashboard — the API now refuses to start in production without them.
3. Online payment is disabled in the storefront; checkout enquiries are sent
   by the customer through WhatsApp.

---

# Follow-up review — 20 Oct 2026

Re-ran the full check after the catalogue rewrite, the gallery lightbox and the
quantity-limit change.

## Checks performed

| Check | Result |
|---|---|
| Dangerous sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `location.assign`, `location.href =`) | None |
| Committed secrets (tokens, API keys, passwords) | None |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `target="_blank"` without `rel="noopener noreferrer"` | None |
| `JSON.parse` without a `try/catch` guard | None |
| Outbound `fetch` destinations | Only same-origin `store-data.json` and the configured API base |
| Admin-supplied image paths | Scheme-filtered by `assetUrl` |
| Published `store-data.json` | Shape-validated before use |

## Issues fixed in this pass

| # | Issue | CWE | Severity | File | Status |
|---|-------|-----|----------|------|--------|
| 19 | `assetUrl` passed through any string that was not `http(s)`, so an admin-supplied `javascript:` or `data:` path would reach an `<img src>` / anchor | CWE-79 | Medium | `src/api/client.js` | Fixed |
| 20 | Full-screen gallery viewer added without a focus trap or scroll lock | CWE-1021 | Low | `src/components/product/ProductGallery.jsx` | Fixed — portal dialog with `aria-modal`, Esc handling, scroll lock and focus restore |
| 21 | 15 unreachable modules (account pages, auth context, support chat) still shipping in the bundle, widening the attack surface for no benefit | — | Low | 15 files | Fixed — deleted |

## Reviewed and accepted

- **Quantity ceiling raised 10 → 100.** Client-side only and advisory; the
  seller confirms the real order on WhatsApp. No server-side quantity check
  exists to bypass, because no order is transmitted.
- **Seed stock set to the ceiling.** Intentional for a made-to-order wholesale
  catalogue. It is display data, not an inventory ledger.
- **Hero / editorial / collection imagery** is the store's own product
  photography, copied from files already in `public/images/`. No third-party or
  stock imagery is referenced anywhere, so there is nothing to licence.
- **Console has no authentication.** By design — it holds no credential and
  cannot write to the repository. Publishing goes through the user's own
  authenticated GitHub session. Anyone can open `/console/` and edit a local
  draft, but only someone with push access can publish it.
- **`QuantityStepper` free-text input** strips non-digits on change and clamps
  to `[min, max]` on commit, so no unbounded value reaches the cart reducer.

## Outstanding

Nothing open. The two pricing questions raised in the previous pass have been
answered by the seller and applied to `src/data/products.js`:

- Side-Striped Track Pant (`p-105`) — ₹95 per piece from 25 pieces. The `TODO`
  and the enquiry-prompt fallback on the product page are gone.
- Zipped-Pocket Pant (`p-104`) — confirmed at ₹95 per piece; the ₹83 figure was
  a mis-read and no change was needed.
