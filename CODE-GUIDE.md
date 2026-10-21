# Code Guide

A walkthrough of every file in this repository: what it does, how it works, and
why it is built that way.

> **On "line by line".** The codebase is ~12,500 lines. A literal line-by-line
> transcript would be longer than the code and would go stale the moment
> anything changed. Instead this guide covers every file, explains each
> function's job, and walks through the non-obvious logic in detail. Where a
> specific block matters, the exact lines are quoted.

---

## Contents

1. [The big picture](#1-the-big-picture)
2. [Entry points and configuration](#2-entry-points-and-configuration)
3. [Data layer (`src/data/`)](#3-data-layer-srcdata)
4. [Pure logic (`src/utils/`)](#4-pure-logic-srcutils)
5. [Hooks (`src/hooks/`)](#5-hooks-srchooks)
6. [State (`src/context/`)](#6-state-srccontext)
7. [API client (`src/api/`)](#7-api-client-srcapi)
8. [UI primitives (`src/components/ui/`)](#8-ui-primitives-srccomponentsui)
9. [Feature components (`src/components/`)](#9-feature-components-srccomponents)
10. [Pages (`src/pages/`)](#10-pages-srcpages)
11. [Admin console (`console/`)](#11-admin-console-console)
12. [API server (`server/`)](#12-api-server-server)
13. [Deployment](#13-deployment)
14. [How the data flows, end to end](#14-how-the-data-flows-end-to-end)

---

## 1. The big picture

Three applications share one repository:

| App | Lives in | Deployed as | Status |
|---|---|---|---|
| Storefront | `src/` | `dist/` → GitHub Pages | **Live** |
| Admin console | `console/` | `dist/console/` → GitHub Pages | **Live** |
| API server | `server/` | Render (Node) | **Dormant** |

The live site is **fully static**. There is no database and no backend in the
deployed path. The storefront reads a single JSON file (`public/store-data.json`)
at boot and renders from it. Checkout does not take payment — it composes a
WhatsApp message and hands it to the customer to send.

The `server/` directory is a complete Express-style API (SQLite, sessions,
payment gateways) from an earlier design. It is kept, maintained and security-
reviewed, but nothing in the deployed site calls it. `src/api/client.js` would
talk to it if `VITE_API_URL` were set.

**Why static?** GitHub Pages is free and has no server. The trade-off is that
publishing a catalogue change means committing a file rather than clicking Save.

---

## 2. Entry points and configuration

### `index.html` / `console/index.html`
Two HTML shells, one per app. Each has a `<div id="root">` and a module script
tag pointing at its entry file. Vite rewrites those paths at build time.

### `src/main.jsx`
Boots the storefront:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

`BASE_URL` is `/clothing-ecommerce-platform/` on Pages and `/` locally, so the
same build works in both places. Providers wrap the app in dependency order —
`StoreProvider` must be outermost because `CartProvider` reads product prices
from it.

### `console/main.jsx`
Boots the admin console and picks one of two implementations:

```jsx
{import.meta.env.VITE_GITHUB_ONLY !== 'false' ? <GitHubOnlyAdmin /> : <ConsoleApp />}
```

The deploy workflow sets `VITE_GITHUB_ONLY=true`, so Pages always gets
`GitHubOnlyAdmin` — the file-export editor. `ConsoleApp` is the API-backed
version, reachable only when running locally with the flag off.

### `vite.config.js` / `vite.config.console.js`
```js
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName !== `${owner}.github.io`
  ? `/${repositoryName}/` : '/';
```
Derives the correct `base` from `GITHUB_REPOSITORY` so asset URLs resolve under
the repo subpath on Pages but stay at root locally. The console config adds
`console/` to that base and aliases `@store` → `src/`, letting console code
import storefront modules.

`allowedHosts: true` in the dev server lets Cloudflare/ngrok tunnels through —
Vite otherwise rejects forwarded `Host` headers.

### `package.json`
Scripts worth knowing:
- `dev` / `dev:console` — the two dev servers (ports 5173 / 5174)
- `build` / `build:console` — production bundles
- `share` — dev server plus a public tunnel (`scripts/share.sh`)

Runtime dependencies are only React, React DOM and React Router. Tailwind is a
dev dependency because it compiles to static CSS.

### `.env.example`
Documents every environment variable. Real secrets live in Render's dashboard
and GitHub Secrets, never in the repo.

---

## 3. Data layer (`src/data/`)

This is the heart of the app. Everything else renders what these files describe.

### `taxonomy.js`
Shared vocabulary, so navigation, filters and admin forms never disagree.

- `CATEGORIES` — three entries (`pants`, `track-pants`, `shorts`). Adding one
  here makes it appear in nav, filters and the admin category dropdown.
- `CATEGORY_MAP` — `Object.fromEntries` lookup by slug, avoids repeated `.find()`
- `NEW_CATEGORY` — a pseudo-category; `/shop?category=new` filters by the `new`
  tag rather than a real category
- `SIZES` — `['XS','S','M','L','XL','XXL']`, the default when a product omits sizes
- `COLOR_SWATCHES` — colour name → hex. The UI renders dots from this map, so a
  colour must exist here to display correctly
- `MEASUREMENTS` — size → `{chest, waist, hip, length, inseam}` in inches
- `MEASUREMENT_COLUMNS` — which of those columns to show per category (pants get
  inseam, shorts get length)
- `PRICE_RANGE` — filter slider bounds

### `products.js`
The catalogue, and the most important file to understand.

**Raw shape.** `RAW` is an array of five plain objects:

```js
{
  id: 'p-101',
  name: 'Zipped-Pocket Shorts',
  category: 'shorts',
  price: 85,              // single-piece retail
  wholesalePrice: 69,     // per-piece once bulkMinQuantity is reached
  bulkMinQuantity: 25,    // this style's own MOQ
  bulkNote: '...',        // optional caveat (Lycra uses it)
  colors: [{ name: 'Ink', images: ['/images/shorts-adidas.jpg'] }, ...],
}
```

`bulkMinQuantity` is per product because the seller quotes a different minimum
per style — 10 for Lycra, 25 for the Zipped-Pocket pair, 30 for the Side-Striped
pair. A single store-wide setting could not express that.

**`seedStock(productId, colors, sizes)`** fills every colour×size variant to
`MAX_LINE_QUANTITY` (100):

```js
colors.forEach((color) => {
  sizes.forEach((size) => {
    stock[`${color.name}::${size}`] = MAX_LINE_QUANTITY;
  });
});
```

This is deliberate. It was previously randomised to fake scarcity, but since the
wholesale tiers need 25–30 pieces and the seller confirms real availability on
WhatsApp, invented stock limits only blocked legitimate orders.

**`hydrateProduct(raw)`** expands a raw entry into what the UI consumes:
- Normalises colours so both `images[]` and a legacy single `image` work
- Generates `slug` from id + name if absent
- Fills `care` from `CARE_BY_FABRIC`, `details` from fabric/fit
- Builds `measurements` from the size list
- `compareAt`: explicit `null` stays null (no fake strikethrough); otherwise
  rounds up to the next ₹100 above a 20% markup

**Helpers** (pure, so they work on seed or admin-edited data):

| Function | Returns |
|---|---|
| `stockFor(product, color, size)` | Units for one variant |
| `totalStock(product)` | Sum across all variants |
| `isInStock(product)` | `totalStock > 0` |
| `sizesInStock(product, color)` | Sizes available in that colour |
| `colorImages(color)` | Photo array, tolerating both shapes |
| `colorImage(product, color)` | First photo, falling back to first colour |
| `primaryImage(product)` | Hero photo for cards |
| `colorNames(product)` | Colour names in order |
| `relatedProducts(product, all, limit)` | Same category first, then same fabric |

### `collections.js`
Four curated edits. Each has a slug, title, issue number, description, a hero
`image` and a `productIds` array. Also exports `BRAND_VALUES` (the scrolling
strip on the home page) and `STORY_BLOCKS` (three editorial paragraphs).

### `settings.js`
Store-wide configuration: name, tagline, support email, `bulkDiscount`
defaults, WhatsApp contacts, hero copy and image, banner, and the seller /
grievance details shown in the footer. Every field is admin-editable, and
every field is rendered somewhere — there is no setting the console can change
that the storefront ignores.

Deliberately absent: tax rate, free-shipping threshold, shipping methods and
currency. `calculateTotals` returns `tax: null` and `shipping: null` because
delivery and tax are quoted by the seller on WhatsApp, and `formatPrice`
hard-codes the rupee locale.

### `storeConfig.js`
Assembles the published default. `DEFAULT_STATIC_STORE` merges products,
categories, collections, promos, announcements and settings into the exact shape
written to `public/store-data.json`. Also holds `DEFAULT_VISIBILITY` (per-section
show/hide toggles) and default home-page copy.

### `promoCodes.js`
Seed promo codes with `type` (`percent` / `fixed` / `shipping`), `value` and
`minSubtotal`. `validatePromo()` checks a code against the current subtotal.

### `public/store-data.json`
**Not source — a build artefact.** Generated from `DEFAULT_STATIC_STORE` and
committed so GitHub Pages can serve it. The storefront fetches this at runtime.
Regenerate after any `src/data/` change:

```bash
node --input-type=module -e "
import { DEFAULT_STATIC_STORE } from './src/data/storeConfig.js';
import { writeFileSync } from 'node:fs';
writeFileSync('public/store-data.json', JSON.stringify(DEFAULT_STATIC_STORE, null, 2) + '\n');
"
```

---

## 4. Pure logic (`src/utils/`)

No React here, so these are trivially testable.

### `cart.js`
All pricing maths.

- **`MAX_LINE_QUANTITY = 100`** — single source of truth for the per-variant
  ceiling. Every stepper and clamp imports this.
- `lineId(productId, size, color)` — composite key, so the same product in two
  sizes stays as separate lines
- `hasRate(wholesalePrice, price)` — true when a product has a valid wholesale
  rate below its retail price
- `minBulkQuantity(settings, productMinQuantity)` — the product's own MOQ, or
  the store default (10) when unset
- `bulkPrice(price, settings, wholesalePrice, productMinQuantity)` — returns
  `{active, minQuantity, percent, unitPrice, savings}` for the product page panel
- `promoDiscount(amount, promo)` — percent or fixed, never exceeding the amount

**`calculateTotals(items, {promo, shippingMethod, settings})`** is the single
source of truth for every total displayed anywhere. Order of operations:

1. Group quantities by product id
2. Mark a product as qualifying when its own total quantity ≥ its own MOQ
3. Apply the per-piece wholesale saving to qualifying lines only
4. Apply the festive offer to what remains
5. Apply the promo code
6. Shipping is informational — the final quote comes from the seller

Discounts are applied in a fixed order so results are reproducible.

### `format.js`
- `formatPrice(value, {forceCents})` — `Intl.NumberFormat` in `en-IN`, so ₹ and
  lakh grouping are correct
- `formatDate`, `pad`
- `classNames(...)` — joins truthy class strings
- `seededRandom(seed)` — FNV-1a hash → 0–1 float, deterministic from a string

### `validation.js`
`isEmail`, `isPhone`, `isPostalCode`, `isRequired`, `isCardNumber` (Luhn),
`passwordScore`. Plain predicates, no framework coupling.

### `whatsapp.js`
Builds the click-to-chat message.
- `normalizeWhatsAppNumber` — strips everything but digits
- `isValidWhatsAppNumber` — 10–15 digits
- `getWhatsAppContacts(settings)` — enabled contacts, with a legacy single-number
  fallback
- `buildOrderMessage(order, {storeName})` — formatted multi-line summary
- `buildWhatsAppUrl(number, message)` — `wa.me/<digits>?text=<encoded>`
- `openWhatsAppMessage` — creates an anchor with `rel="noopener noreferrer"`
  rather than `window.open`, which pop-up blockers often reject

---

## 5. Hooks (`src/hooks/`)

### `useLocalStorage(key, initialValue)`
Persisted state with three safety properties: reads are wrapped in `try/catch`
(private mode throws), writes are wrapped (quota errors), and a `storage` event
listener keeps multiple tabs in sync. Returns `[value, setValue, reset]`.

### `useDebounce(value, delay)`
Returns a delayed copy. Used by search so filtering does not run on every
keystroke.

### `useBodyScrollLock(locked)`
Sets `overflow: hidden` on `<body>` while a modal or drawer is open, and adds
right padding equal to the scrollbar width so the page does not jump.

### `useCatalogFilters(category)`
Owns all catalogue filter state and syncs it to the URL query string, so a
filtered view is shareable and survives refresh. Returns `{filters, sort, page,
view, activeCount, update, clear}`. Array filters serialise comma-separated;
defaults are omitted to keep URLs short.

---

## 6. State (`src/context/`)

### `StoreContext.jsx`
Loads the catalogue and exposes it app-wide.

`loadPublishedStore()` fetches `store-data.json` with `cache: 'no-store'`, then
**validates the shape** before trusting it:

```js
if (!data || !Array.isArray(data.products) || !Array.isArray(data.categories) || ...)
  throw new Error('Published store data is incomplete or has an invalid format.');
```

A 404 falls back to the bundled seed, so the site renders even before anything
is published. Filters out `active: false` products and disabled categories, then
memoises `productsById`, `productsBySlug` and `categoryMap` lookups.

### `CartContext.jsx`
A reducer over cart lines, persisted to localStorage.

Actions: `add`, `updateQuantity`, `remove`, `changeSize`, `toggleSelected`,
`applyPromo`, `removePromo`, `setShippingMethod`, `syncPrices`, `clear`.

Two subtleties:

1. **Price sync.** An effect compares each line against the current product and
   dispatches `syncPrices` when price, wholesale rate, MOQ, image or name has
   changed. Without it, a cart saved before an admin price change would quote
   stale figures.

2. **Selection.** Lines carry `selected`, and `selectedItems` feeds the totals —
   so a shopper can park items in the bag without including them in the enquiry.

### `WishlistContext.jsx`
An array of product ids in localStorage. `toggle` returns whether the item was
added, so the caller can show the right toast.

### `RecentlyViewedContext.jsx`
Last 8 viewed product ids, most recent first, deduplicated.

### `ToastContext.jsx`
Notification queue. `notify(message, {tone, duration, action})` returns an id;
the list is capped at three so toasts cannot stack off-screen.

---

## 7. API client (`src/api/`)

### `client.js`
Only reachable when `VITE_API_URL` is set — dormant on Pages.

`request()` sends `credentials: 'include'`, echoes the CSRF cookie in
`X-CSRF-Token` for non-GET verbs, and normalises failures into an `ApiError`
carrying `status` and `fields`.

**`assetUrl(url)`** is security-relevant. Image paths come from admin-editable
data, so it allows only absolute http(s) URLs and site-relative paths:

```js
if (/^https?:\/\//i.test(url)) return url;
if (url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
```

That second line drops `javascript:`, `data:`, `vbscript:` and protocol-relative
URLs rather than handing them to the browser.

### `mockApi.js`
Client-side query engine — no network. `searchProducts`, `queryProducts`
(filter → sort → paginate), and `buildFacets` which counts matches per filter
value so the sidebar can grey out options that would return nothing.

---

## 8. UI primitives (`src/components/ui/`)

| File | Notes |
|---|---|
| `Button.jsx` | Renders `<button>`, router `<Link>` or `<a>` depending on props. Variants and sizes are lookup maps. |
| `Modal.jsx` | Portal-rendered dialog: scroll-locked, Esc-dismissable, focus-trapped via a `Tab` handler, returns focus on close. |
| `Drawer.jsx` | Slide-in panel, same accessibility treatment. |
| `ProductImage.jsx` | `<img>` that degrades to a "Photo coming soon" tile when `src` is empty or fails. Resets its error flag when `src` changes so colour swaps recover. |
| `QuantityStepper.jsx` | +/− buttons **and a typable field** — stepping to 100 one click at a time is not viable. Keeps a `draft` string so the input can be briefly empty, commits on blur/Enter, clamps to `[min, max]`. |
| `ColorSwatch.jsx` | Coloured dot from `COLOR_SWATCHES`, plus a button variant. |
| `Badge.jsx` | Tag pills (new / sale / bestseller). |
| `Icons.jsx` | Inline SVGs sharing stroke defaults. No icon library dependency. |
| `Toaster.jsx` | Renders the toast queue into a portal. |
| `Skeleton.jsx` | Loading placeholders. |
| `EmptyState.jsx` | Empty-result message with optional action. |

---

## 9. Feature components (`src/components/`)

### `layout/`
- **`Layout.jsx`** — shell: skip link, header, `<Outlet />`, footer, cart drawer,
  banner, toaster. Scrolls to top on navigation. Shows a connection-error screen
  if the store failed to load.
- **`Header.jsx`** — sticky nav, announcement rotator (5s interval), ⌘K search,
  cart count badge.
- **`Footer.jsx`** — nav columns plus seller/grievance details (required for
  Indian e-commerce compliance).
- **`MobileNav.jsx`** — drawer nav, closes on route change.
- **`SearchModal.jsx`** — ⌘K palette, debounced, Enter goes to full results.
- **`BannerPopup.jsx`** — promo overlay, once per session via `sessionStorage`.
- **`Breadcrumbs.jsx`** — trail with `aria-current="page"` on the last crumb.

### `product/`
- **`ProductCard.jsx`** — grid or list tile. Hovering a colour dot previews that
  colourway without navigating.
- **`ProductGallery.jsx`** — PDP gallery. Thumbnails switch photos; clicking the
  main image opens a **full-screen lightbox** (Esc closes, arrow keys navigate,
  click outside dismisses). Hover-zoom was removed — it did not work on touch
  and fought with the click target.
- **`QuickViewModal.jsx`** — add to bag without leaving the grid.
- **`SizePicker.jsx`** — size buttons, sold-out sizes struck through.
- **`SizeGuide.jsx`** — measurement table in a modal, columns per category.
- **`ProductRail.jsx`** — horizontal scroller for related/recently-viewed.

### `catalog/`
- **`FilterSidebar.jsx`** — size, colour, price, gender, fit, fabric,
  availability. Counts come from facets; zero-count options are disabled.
- **`ActiveFilters.jsx`** — removable chips.
- **`Pagination.jsx`** — numbered pages with ellipsis.

### `cart/`
- **`CartDrawer.jsx`** — slide-out bag, inline size change, free-shipping bar.
- **`OrderSummary.jsx`** — totals panel, shared by cart and checkout.

### `checkout/FormField.jsx`
Labelled input wired for accessibility: `aria-invalid`, `aria-describedby`, and
error text bound to the field.

---

## 10. Pages (`src/pages/`)

| Route | File | Notes |
|---|---|---|
| `/` | `Home.jsx` | Hero, values strip, categories, featured, editorial, new arrivals, wholesale CTA, collections. Every section respects `settings.visibility`. |
| `/shop`, `/shop/:category` | `Catalog.jsx` | Faceted browse. All state in the URL. |
| `/product/:slug` | `ProductDetail.jsx` | Gallery, colour/size pickers, wholesale panel, accordions, related. Shows the MOQ even when no wholesale rate is published. |
| `/collections`, `/collections/:slug` | `Collections.jsx`, `CollectionDetail.jsx` | Curated edits. |
| `/search` | `SearchResults.jsx` | Debounced search with sort. |
| `/wishlist` | `Wishlist.jsx` | Saved items with inline variant choice. |
| `/cart` | `Cart.jsx` | Full bag, per-line selection. |
| `/checkout` | `Checkout.jsx` | Contact details → consent → WhatsApp draft. **No payment.** |
| `/bulk-order` | `BulkOrder.jsx` | Wholesale enquiry form. |
| `/feedback` | `Feedback.jsx` | Feedback via WhatsApp. |
| `/privacy`, `/terms` | `Privacy.jsx`, `Terms.jsx` | Static policy pages. |
| `*` | `NotFound.jsx` | 404. |

**`Checkout.jsx` deserves attention** because it is the conversion point.
Validates name, phone and an explicit consent checkbox before building the
message; nothing is transmitted until the customer presses Send inside WhatsApp.
The consent text names exactly what is shared — required under Indian data
protection rules.

---

## 11. Admin console (`console/`)

### `GitHubOnlyAdmin.jsx` (~1,000 lines, the live editor)
Edits the catalogue **with no backend and no credentials in the browser**.

Flow:
1. Fetch the published `store-data.json`
2. Edit in React state, auto-saving a draft to `localStorage` on every change
3. Click **Download store data** → browser downloads a new `store-data.json`
4. Upload that file to the repo through GitHub's web UI and commit
5. The commit triggers the Pages workflow, which redeploys

Why this shape: GitHub Pages cannot write files, and embedding a token in a
public bundle would hand anyone write access to the repo. Exporting a file keeps
the credential in the user's normal GitHub session.

Five tabs, each with a one-line hint underneath the tab bar:

| Tab | Contents |
|---|---|
| Overview | Store name, tagline, support email |
| Products | Price, **wholesale rate**, **wholesale minimum pieces**, **wholesale note**, category, fabric, fit, sizes, colours, per-variant stock, photos |
| Home page | Hero, banner, home copy, categories, collections, footer seller details |
| Offers & contact | Announcements, promo codes, wholesale defaults, store-wide offer, WhatsApp numbers |
| Publish | Download the file and commit it on GitHub |

The **Wholesale defaults** section is the fallback for products that set no
rate or minimum of their own — per-product values on the Products tab always
win.

`PhotoPicker` is indirect for the same reason — it suggests a filename, lets you
download the renamed copy, and links to GitHub's upload page.

### `AdminConsole.jsx`
The API-backed console. Same editing surface, but saves over HTTP. Only active
when `VITE_GITHUB_ONLY=false`.

### `context/ConsoleAuthContext.jsx`
Staff session for the API console. Roles come from the server's email allowlist
and are re-checked on every request — the UI gate is cosmetic, not the security
boundary.

### `pages/ConsoleLogin.jsx`
Password or email-code sign-in for the API console.

---

## 12. API server (`server/`)

Dormant in production, but maintained and security-reviewed.

### `index.js`
Node `http` server. Request pipeline: CORS → security headers → static uploads →
rate limit → session → CSRF → route dispatch. Errors are caught centrally and
internal messages are never leaked.

### `config.js`
Centralised configuration from environment variables.
`assertProductionSafety()` **exits non-zero** rather than warning if the
bootstrap password is still default, cookies are insecure, LAN origins are
enabled, or the admin allowlist is unset.

### `security.js`
- `hashPassword` / `verifyPassword` — scrypt (N=16384) with per-user salt,
  constant-time comparison
- `createSession` / `readSession` / `destroySession`
- `parseCookies` — tolerates malformed percent-escapes instead of throwing;
  first value wins so a duplicate cookie cannot shadow the session
- `verifyCsrf` — token for authenticated writes; Origin or `Sec-Fetch-Site` for
  unauthenticated ones
- `clientIp` — honours `X-Forwarded-For` only when `TRUST_PROXY` is set,
  otherwise a client could rotate the header past every rate limit
- `rateLimit` — in-memory sliding window
- `requireRole` — re-reads the email allowlist per request, so revocation is
  immediate
- `clean` — strips control characters and angle brackets

### `routes/`
- `auth.js` — register, login, email-code, logout, password change. Attempt
  counters increment *before* comparison so a disconnect cannot reset them.
- `catalog.js` — public read-only endpoints
- `orders.js` — checkout intent → confirm. Prices are **always** recomputed
  server-side. Order ids are 72 bits of `randomBytes`, not timestamps.
- `support.js` — support threads with constant-time ownership checks
- `admin.js` — every route behind `requireRole(session, ['admin'])`

### `payments/`
Pluggable gateways behind one interface (`createIntent`, `confirm`,
`verifyWebhook`, `describe`). `mockGateway` throws in production so a
misconfiguration cannot mark orders paid for free. Razorpay verifies HMAC
signatures with constant-time comparison.

### `services/uploads.js`
Validates images by **magic bytes**, not the client-supplied MIME type. Writes
under a generated UUID filename and re-checks the resolved path against the
upload root.

### `db.js`
SQLite via Node's built-in `node:sqlite`. Rich documents stored as JSON columns
so the admin can edit arbitrary fields without migrations.

### `shared/geo.js`
Country/state data and address validation, shared by client and server so both
enforce the same rules.

---

## 13. Deployment

### `.github/workflows/deploy-pages.yml`
On push to `main` or manual dispatch: checkout → Node 22 → `npm ci` → build both
bundles → copy console into `dist/console/` → upload → deploy.

`cancel-in-progress: true` means a new run cancels any pending one. **Do not
re-dispatch while a run is queued** — you will cancel the run you are waiting on.

`cp dist/index.html dist/404.html` makes client-side routing work: Pages serves
`404.html` for unknown paths, React Router then handles the route.

### `render.yaml`
Blueprint for the dormant API. Secrets marked `sync: false` so they are entered
in Render's dashboard, not committed.

### `scripts/share.sh`
Starts the dev server plus a Cloudflare tunnel and prints local, network and
public URLs.

---

## 14. How the data flows, end to end

**Boot**
```
main.jsx → StoreProvider → fetch store-data.json → validate → memoise lookups
```

**Browse**
```
Catalog → useCatalogFilters (URL state) → mockApi.queryProducts → ProductCard[]
```

**Add to bag**
```
ProductDetail → addItem(product, {size, color, quantity})
  → CartContext reducer → localStorage
  → calculateTotals(selectedItems) → OrderSummary
```

**Checkout**
```
Checkout → validate + consent → buildOrderMessage → wa.me link → customer sends
```

**Publish a change**
```
/console/ → edit → Download store-data.json → upload to GitHub → commit
  → workflow → Pages → storefront fetches the new file
```

---

## Making a change

**Edit a product** — `src/data/products.js`, then regenerate `store-data.json`,
then commit. Or use `/console/` and upload the exported file.

**Add a category** — add to `CATEGORIES` in `taxonomy.js` and add its
`MEASUREMENT_COLUMNS` entry.

**Change the quantity ceiling** — `MAX_LINE_QUANTITY` in `src/utils/cart.js`.
Everything else follows.

**Add product photos** — drop files in `public/images/`, reference them as
`/images/<name>.jpg` in the product's `colors[].images`.

Always run both builds before committing:
```bash
npm run build && npm run build:console
```
