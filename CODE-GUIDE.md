# Code Guide

A walkthrough of every file in this repository: what it does, how it works, and
why it is built that way.

> **On "line by line".** A literal line-by-line transcript would be longer than
> the code and would go stale the moment anything changed. Instead this guide
> covers every file, explains each function's job, and walks through the
> non-obvious logic in detail. Where a specific block matters, the exact lines
> are quoted.

---

## Contents

1. [The big picture](#1-the-big-picture)
2. [Entry points and configuration](#2-entry-points-and-configuration)
3. [Data layer (`src/data/`)](#3-data-layer-srcdata)
4. [Pure logic (`src/utils/`)](#4-pure-logic-srcutils)
5. [Hooks (`src/hooks/`)](#5-hooks-srchooks)
6. [State (`src/context/`)](#6-state-srccontext)
7. [UI primitives (`src/components/ui/`)](#7-ui-primitives-srccomponentsui)
8. [Feature components (`src/components/`)](#8-feature-components-srccomponents)
9. [Pages (`src/pages/`)](#9-pages-srcpages)
10. [Deployment](#10-deployment)
11. [How the data flows, end to end](#11-how-the-data-flows-end-to-end)

---

## 1. The big picture

One application, one deployment target:

| App | Lives in | Deployed as |
|---|---|---|
| Storefront | `src/` | `dist/` → GitHub Pages |

The site is **fully static**. There is no database, no backend, no admin login
and no payment processing. The storefront reads a single JSON file
(`public/store-data.json`) at boot and renders from it. Checkout composes a
WhatsApp message and hands it to the customer to send.

The catalogue is edited as source code:

```
src/data/*.js  ──npm run publish:data──▶  public/store-data.json  ──fetch──▶  storefront
```

**Why static?** GitHub Pages is free and has no server. The trade-off is that
publishing a catalogue change means committing a file rather than clicking Save.
In exchange there is no attack surface to defend: no sessions, no uploads, no
database, no secrets in the deployed artefact.

---

## 2. Entry points and configuration

### `index.html`
The HTML shell. A `<div id="root">` and a module script tag pointing at
`src/main.jsx`. Vite rewrites that path at build time.

### `src/main.jsx`
Boots the storefront:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

`BASE_URL` is `/clothing-ecommerce-platform/` on Pages and `/` locally, so the
same build works in both places. Providers wrap the app in dependency order —
`StoreProvider` must be outermost because `CartProvider` reads product prices
from it.

### `vite.config.js`
```js
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName !== `${owner}.github.io`
  ? `/${repositoryName}/` : '/';
```
Derives the correct `base` from `GITHUB_REPOSITORY` so asset URLs resolve under
the repo subpath on Pages but stay at root locally.

`allowedHosts: true` in the dev server lets Cloudflare/ngrok tunnels through —
Vite otherwise rejects forwarded `Host` headers.

### `package.json`
Scripts worth knowing:
- `dev` — dev server on port 5173
- `publish:data` — regenerates `public/store-data.json` from `src/data/`
- `build` — production bundle
- `share` — dev server plus a public tunnel (`scripts/share.sh`)

Runtime dependencies are only React, React DOM and React Router. Tailwind is a
dev dependency because it compiles to static CSS. There are no other runtime
dependencies, so there is no supply chain to audit at runtime.

### `scripts/build-store-data.mjs`
Imports `DEFAULT_STATIC_STORE` from `src/data/storeConfig.js`, serialises it to
`public/store-data.json`, and prints the resulting catalogue so the pricing can
be eyeballed before committing. Run via `npm run publish:data`.

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
- `COLOR_SWATCHES` — colour name → hex, **or `[body, trim]`** for a two-tone
  garment. `ColorSwatch` renders the pair as a diagonal split, so "Grey /
  Yellow" and "Grey / Orange" are distinguishable at thumbnail size. A colour
  must exist in this map to display correctly; unknown names fall back to a
  neutral dot
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
  bulkNote: '...',        // optional caveat (Lycra and p-104 use it)
  maxPerVariant: 10,      // optional per-colour/size cap (p-104 only)
  colors: [{ name: 'Ink', images: ['/images/shorts-adidas.jpg'] }, ...],
}
```

`bulkMinQuantity` is per product because the seller quotes a different minimum
per style — 10 for Lycra, 25 for the Zipped-Pocket pair, 30 for the Side-Striped
pair. A single store-wide setting could not express that.

**`seedStock(colors, sizes, perVariant)`** fills every colour×size variant to
the same number, defaulting to `MAX_LINE_QUANTITY` (100) and clamped to it:

```js
const limit = Math.min(Math.max(1, perVariant), MAX_LINE_QUANTITY);
```

Flat seeding is deliberate. It was previously randomised to fake scarcity, but
since the wholesale tiers need 25–30 pieces and the seller confirms real
availability on WhatsApp, invented stock limits only blocked legitimate orders.

**The `maxPerVariant` / `bulkMinQuantity` interaction is worth understanding.**
Zipped-Pocket Pant caps each colour and size at 10 pieces but needs 25 to reach
its wholesale rate. That is not a contradiction: `calculateTotals` groups
quantities **by product id**, not by cart line, so 10 Grey/Yellow + 10
Blue/White + 5 Grey/Orange totals 25 and qualifies. The cap shapes *how* a
buyer reaches the minimum — by mixing colourways, which is exactly what the
assorted pack in `bulkNote` describes.

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
defaults, `delivery` (the free-delivery threshold), WhatsApp contacts, hero copy
and image, banner, and the seller / grievance details shown in the footer. Every
field here is rendered somewhere — there is no setting that the storefront
silently ignores.

**`delivery`** drives the Diwali free-delivery offer:

```js
delivery: { freeDeliveryActive: true, freeAbove: 499, label, note }
```

`deliveryProgress()` in `cart.js` measures the **payable** amount (after every
discount) against `freeAbove`, so the threshold is never met by a figure the
shopper is not actually paying. Set `freeDeliveryActive: false` to remove the
meter, the footer strip and the clause in Terms in one edit.

**The Diwali sale is expressed as prices, not as a percentage.** Each product's
`price` is the sale rate and `compareAt` is the pre-sale list price, which is
what renders the strikethrough. `festiveOffer` stays `active: false` on purpose:
switching it on would apply a second percentage on top of an already-reduced
price. Wholesale rates are untouched by the sale.

Deliberately absent: tax rate, shipping methods and currency. `calculateTotals`
returns `tax: null` and `shipping: null` because tax is quoted by the seller on
WhatsApp, and `formatPrice` hard-codes the rupee locale.

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
npm run publish:data
```

It prints every product's retail and wholesale rate, which is the quickest way
to confirm a price edit landed where you meant it to.

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
- `deliveryProgress(payable, settings)` — `{threshold, qualified, remaining,
  percent, label}`, or `null` when the offer is off. Measured against the
  **payable** amount, so free delivery can never be unlocked by a figure the
  shopper is not paying
- `promoDiscount(amount, promo)` — percent or fixed, never exceeding the amount

**`calculateTotals(items, {promo, shippingMethod, settings})`** is the single
source of truth for every total displayed anywhere. Order of operations:

1. Group quantities by product id
2. Mark a product as qualifying when its own total quantity ≥ its own MOQ
3. Apply the per-piece wholesale saving to qualifying lines only
4. Apply the festive offer to what remains
5. Apply the promo code
6. Compare the payable amount against the free-delivery threshold

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

**`view` is the exception** and is also mirrored to `localStorage`
(`dnd.catalog.view`). Grid/list is a personal preference, not part of the
query — opening a product and coming back drops the search string entirely,
which used to reset the layout to grid on every return. Resolution order is
explicit `?view=` → stored preference → `grid`, so a shared link still renders
as its sender saw it. The `view` key is always written to the URL on change:
without it, `grid` would be indistinguishable from "no preference" and the
stored value would immediately override the click that just set it.

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

## 7. UI primitives (`src/components/ui/`)

| File | Notes |
|---|---|
| `Button.jsx` | Renders `<button>`, router `<Link>` or `<a>` depending on props. Variants and sizes are lookup maps. |
| `Modal.jsx` | Portal-rendered dialog: scroll-locked, Esc-dismissable, focus-trapped via a `Tab` handler, returns focus on close. |
| `Drawer.jsx` | Slide-in panel, same accessibility treatment. |
| `ProductImage.jsx` | `<img>` that degrades to a "Photo coming soon" tile when `src` is empty or fails. Resets its error flag when `src` changes so colour swaps recover. |
| `QuantityStepper.jsx` | +/− buttons **and a typable field** — stepping to 100 one click at a time is not viable. Keeps a `draft` string so the input can be briefly empty, commits on blur/Enter, clamps to `[min, max]`. |
| `ColorSwatch.jsx` | Coloured dot from `COLOR_SWATCHES`, plus a button variant. Two-tone entries (`[body, trim]`) render as a diagonal split. |
| `Badge.jsx` | Tag pills (new / sale / bestseller). |
| `Icons.jsx` | Inline SVGs sharing stroke defaults. No icon library dependency. |
| `Toaster.jsx` | Renders the toast queue into a portal. |
| `Skeleton.jsx` | Loading placeholders. |
| `EmptyState.jsx` | Empty-result message with optional action. |

---

## 8. Feature components (`src/components/`)

### `layout/`
- **`Layout.jsx`** — shell: skip link, header, `<Outlet />`, footer, cart drawer,
  banner, toaster. Scrolls to top on navigation. If `store-data.json` could not
  be read it shows a retry screen, and if the bundled fallback catalogue is
  standing in it shows a warning strip above the header.
- **`Header.jsx`** — sticky nav, announcement rotator (5s interval), ⌘K search,
  cart count badge.
- **`Footer.jsx`** — nav columns plus store/grievance details (required for
  Indian e-commerce compliance).
- **`MobileNav.jsx`** — drawer nav, closes on route change.
- **`SearchModal.jsx`** — ⌘K palette, debounced, Enter goes to full results.
- **`BannerPopup.jsx`** — promo overlay. `settings.banner.showOncePerSession`
  decides whether it is suppressed after dismissal (`sessionStorage`) or shown
  on every page load — `false` during a sale, so a returning shopper still
  sees it.
- **`Crackers.jsx`** — Diwali fireworks, gated on `settings.crackers.enabled`.
  Pure CSS from a few custom properties (no canvas, no per-frame JS), so the
  browser composites it. `aria-hidden`, `pointer-events: none`, and hidden
  outright under `prefers-reduced-motion`. The layer sits *behind* the page
  (`z-index: 0`, content wrapper at `z-10`, page background moved to `html`
  with a transparent `body`), so it shows only in the open areas between
  panels — never over a product image or heading. The palette is a dark
  festival tone (deep berry, plum, ink) rather than bright sparkles.
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
- **`CartDrawer.jsx`** — slide-out bag with inline size change.
- **`OrderSummary.jsx`** — totals panel, shared by cart and checkout. Delivery
  and tax are deliberately absent: both are agreed with the seller on WhatsApp,
  so quoting a number here would be misleading.

---

## 9. Pages (`src/pages/`)

| Route | File | Notes |
|---|---|---|
| `/` | `Home.jsx` | Hero, values strip, categories, featured, editorial, new arrivals, wholesale CTA, collections. Every section respects `settings.visibility`. |
| `/shop`, `/shop/:category` | `Catalog.jsx` | Faceted browse. All state in the URL. |
| `/product/:slug` | `ProductDetail.jsx` | Gallery, colour/size pickers, accordions, related. Retail only — wholesale rates and MOQs live on `/bulk-order`. |
| `/collections`, `/collections/:slug` | `Collections.jsx`, `CollectionDetail.jsx` | Curated edits. |
| `/search` | `SearchResults.jsx` | Debounced search with sort. |
| `/wishlist` | `Wishlist.jsx` | Saved items with inline variant choice. |
| `/cart` | `Cart.jsx` | Full bag, per-line selection. |
| `/checkout` | `Checkout.jsx` | Contact details → consent → WhatsApp draft. **No payment.** |
| `/bulk-order` | `BulkOrder.jsx` | Wholesale enquiry. Lists every product; selecting one reveals its own MOQ and per-piece rate and seeds the quantity with that minimum. Validates each line against its own minimum, not a store-wide one. Accepts `?product=<id>` to pre-select. |
| `/feedback` | `Feedback.jsx` | Feedback via WhatsApp. |
| `/privacy`, `/terms` | `Privacy.jsx`, `Terms.jsx` | Static policy pages. |
| `*` | `NotFound.jsx` | 404. |

**`Checkout.jsx` deserves attention** because it is the conversion point.
Validates name, phone and an explicit consent checkbox before building the
message; nothing is transmitted until the customer presses Send inside WhatsApp.
The consent text names exactly what is shared — required under Indian data
protection rules.

---

## 10. Deployment

### `.github/workflows/deploy-pages.yml`
On push to `main` or manual dispatch: checkout → Node 22 → `npm ci` →
`npm run build` → upload → deploy.

`cancel-in-progress: true` means a new run cancels any pending one. **Do not
re-dispatch while a run is queued** — you will cancel the run you are waiting on.

`cp dist/index.html dist/404.html` makes client-side routing work: Pages serves
`404.html` for unknown paths, React Router then handles the route.

Note that the workflow does **not** regenerate `store-data.json`. That file is
committed, and `npm run publish:data` is run locally before committing. The
build only bundles what is already in the repository.

### `scripts/share.sh`
Starts the dev server plus a Cloudflare tunnel and prints local, network and
public URLs.

---

## 11. How the data flows, end to end

**Boot**
```
main.jsx → StoreProvider → fetch store-data.json → validate → memoise lookups
```

**Browse**
```
Catalog → useCatalogFilters (URL state) → catalogQuery.queryProducts → ProductCard[]
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
edit src/data/*.js → npm run publish:data → commit → push to main
  → workflow → Pages → storefront fetches the new file
```

---

## Making a change

**Edit a product** — `src/data/products.js`, then `npm run publish:data`, then
commit both the source file and the regenerated `public/store-data.json`.

**Add a category** — add to `CATEGORIES` in `taxonomy.js` and add its
`MEASUREMENT_COLUMNS` entry.

**Change the quantity ceiling** — `MAX_LINE_QUANTITY` in `src/utils/cart.js`
for the store-wide cap, or `maxPerVariant` on a single product for a tighter
per-colour limit. Everything else follows.

**Add a two-tone colour** — add `'Body / Trim': ['#body', '#trim']` to
`COLOR_SWATCHES`, then use that exact name in the product's `colors[].name`.

**Add product photos** — drop files in `public/images/`, reference them as
`/images/<name>.jpg` in the product's `colors[].images`.

Before committing:
```bash
npm run publish:data   # keeps the served JSON in step with the source
npm run build          # confirms the bundle still compiles
```

Forgetting `publish:data` is the most common mistake: the source changes, the
build succeeds, and the live site keeps serving the previous catalogue.
