# Security Review

## Current architecture

The deployed site is a static React bundle on GitHub Pages. It has:

- no backend, no database, no sessions and no authentication
- no payment processing of any kind
- no runtime dependencies beyond React, React DOM and React Router
- exactly one network request of its own: `GET store-data.json` from its own origin

The only data leaving the browser is a WhatsApp message that the customer
composes, reviews and sends themselves through `wa.me`.

This matters for threat modelling: there is no server to compromise, no
credential to steal and no order to tamper with. The realistic risks reduce to
client-side injection, dependency compromise and misleading commercial claims.

---

## Review — 23 Oct 2026 (post-teardown)

The admin console, the dormant Node API and every payment gateway were deleted
in this pass. That removed the large majority of the previously tracked attack
surface rather than mitigating it.

### Removed

| Component | Why it is gone |
|---|---|
| `console/` (admin console, both variants) | Unused in practice; the catalogue is edited as source. Removing it eliminates an unauthenticated editing surface and ~1,500 lines of draft/export logic. |
| `server/` (Node API, SQLite, sessions, uploads) | Dormant — nothing in the deployed path ever called it. Findings 1–15 and 19 from the earlier review applied exclusively to this code. |
| `server/payments/` (Razorpay, Juspay, mock) | No payment is collected. Keeping gateway code invited a future misconfiguration that could mark orders paid. |
| `src/api/client.js` | API transport, CSRF echo, cookie reads — all meaningless without a server. `assetUrl` was the only live export and moved to `src/utils/assetUrl.js`. |
| `shared/geo.js`, `src/components/checkout/FormField.jsx` | Unreachable from the entry point. |
| `render.yaml`, `.env.example` | Deployment config and documented secrets for a service that no longer exists. |
| 9 unused icons, `Pill`, `PROMO_TYPES`, `COLOR_NAMES`, `TAGS`, `NEW_CATEGORY`, `COLLECTIONS_BY_SLUG`, and 14 unused helpers in `format.js` / `validation.js` / `cart.js` | Dead code. `isEmail`, `isPostalCode`, `isStrongEnoughPassword` and `validateFields` in particular existed only for the deleted auth and address forms. |

Historical findings 1–15 and 19 are no longer applicable — the files they
described are not in the repository. They are preserved in git history.

### Checks performed on the remaining code

| Check | Result |
|---|---|
| `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, `location.assign`, `location.href =` | None |
| `target="_blank"` without `rel="noopener noreferrer"` | None |
| Outbound requests | `store-data.json` (same origin) and `wa.me` (user-initiated, new tab) |
| `JSON.parse` without `try/catch` | None — all three call sites are guarded |
| Committed secrets, tokens, API keys | None |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Reachability scan from `src/main.jsx` | 0 unreachable modules |
| Unimported exports | 0 |
| `npm run build` | Succeeds |

### Controls that remain relevant

**`assetUrl` scheme filtering** (`src/utils/assetUrl.js`). Image paths come from
`store-data.json`. Although that file is now only editable by someone with push
access, the filter is kept because it is the one place untrusted-shaped data
reaches an `<img src>`:

```js
if (/^https?:\/\//i.test(url)) return url;
if (url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
```

That second line drops `javascript:`, `data:` and `vbscript:` rather than
handing them to the browser.

**Published data validation** (`src/context/StoreContext.jsx`). The fetched JSON
is shape-checked before use; a malformed file falls back to the bundled
catalogue and surfaces a visible warning strip rather than rendering a broken
or empty shop.

**Gallery lightbox** (`ProductGallery.jsx`) is a portal dialog with
`aria-modal`, Esc handling, scroll lock and focus restore.

**`QuantityStepper`** strips non-digits on change and clamps to `[min, max]` on
commit, so no unbounded value reaches the cart reducer.

**localStorage parsing** (`useLocalStorage.js`, `CartContext.jsx`) is wrapped in
`try/catch`, including the cross-tab `storage` event handler — a corrupted or
hand-edited value degrades to the initial state instead of throwing during
render.

**Commercial honesty.** Checkout, cart, footer and terms all state that no
payment is collected and that the customer sends the message themselves. This
is a consumer-protection requirement, not a nicety.

### Reviewed and accepted

- **Quantity ceiling of 100 per variant** is advisory. There is no server-side
  check to bypass because no order is transmitted; the seller confirms the real
  quantity on WhatsApp.
- **Seed stock set to the ceiling** is intentional for a made-to-order
  wholesale catalogue. It is display data, not an inventory ledger.
- **Promo code resolution is client-side only.** With no server this is the
  only validation that exists. A user editing their own localStorage can show
  themselves a lower number, which changes nothing — the seller quotes the
  final price on WhatsApp.
- **All imagery is the store's own product photography.** No third-party or
  stock imagery is referenced, so there is nothing to licence.
- **Deploy workflow** uses pinned major action versions and `contents: read`.

---

## Outstanding

Nothing open.

The two pricing questions from the previous pass were answered by the seller
and applied to `src/data/products.js`: Side-Striped Track Pant (`p-105`) is ₹95
per piece from 25 pieces, and Zipped-Pocket Pant (`p-104`) is confirmed at ₹95.

---

## Before launch

These are business obligations, not code defects:

1. Complete the seller legal name, business address, GSTIN and grievance
   officer details in `src/data/settings.js` — they render in the footer and
   are required for Indian e-commerce.
2. Have the terms, privacy notice, tax treatment and pricing claims reviewed by
   a qualified professional.
