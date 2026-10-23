# DND Store — clothing storefront

A responsive React storefront for pants, shorts and track pants. It is a fully
static site: there is no backend, no database and no payment processing.
Customers browse the catalogue, build a bag, and send a pre-filled WhatsApp
message to the seller, who confirms availability, delivery and payment
directly.

## How it works

The catalogue lives in `src/data/` as plain JavaScript. A build step flattens
it into `public/store-data.json`, which is committed to the repository and
served as a static file. The storefront fetches that file once at boot.

```
src/data/*.js  ──npm run publish:data──▶  public/store-data.json  ──fetch──▶  storefront
```

That is the whole data pipeline. To change a price, add a product or edit copy,
edit the source file, regenerate the JSON, commit, and push — GitHub Actions
rebuilds and redeploys.

## What is included

- Product browsing, search, categories, size and colour selection, bag and
  wishlist.
- Five live products across pants, track pants and shorts.
- Per-product wholesale pricing. Each style carries its own retail price,
  wholesale unit price and minimum order quantity, because the minimum differs
  per style.
- A combined bag and wishlist view with per-item selection; only checked items
  reach the estimate and the WhatsApp message.
- A wholesale enquiry page at `/bulk-order`.
- WhatsApp enquiry checkout. The customer reviews and sends the draft; the
  site never claims an order was placed and collects no payment.
- Privacy notice and terms templates.

Indian legal requirements depend on the seller, products, sales model and
actual data practices. Have the terms, privacy notice, tax treatment, pricing
and grievance disclosures reviewed by a qualified professional before
accepting enquiries.

## Run locally

Node.js 22 or later.

```sh
npm ci
npm run dev        # http://localhost:5173/
```

## Editing the store

All store content is in `src/data/`:

| File | Holds |
|---|---|
| `products.js` | The catalogue — names, prices, wholesale rates, colours, sizes, photos |
| `taxonomy.js` | Categories, sizes, price bounds |
| `collections.js` | Curated edits, brand values, story blocks |
| `settings.js` | Store name, hero, banner, WhatsApp contacts, seller details |
| `promoCodes.js` | Promotion codes |
| `storeConfig.js` | Assembles all of the above into the published shape |

After any edit:

```sh
npm run publish:data   # regenerates public/store-data.json and prints the catalogue
npm run build          # verify the bundle still builds
git add -A && git commit && git push origin main
```

Forgetting `publish:data` is the single most common mistake — the source file
changes but the storefront keeps serving the old JSON.

### Product photos

Commit photos to `public/images/` and reference them from `products.js` as
`/images/your-file.jpg`. Portrait 1200 × 1500 px (4:5), JPEG or WebP, under
1 MB each works well. Products with no photo render a neutral placeholder
rather than a broken image.

## Deploy to GitHub Pages

[`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
builds and deploys on every push to `main`.

1. In GitHub, open **Settings → Pages** and set **Build and deployment →
   Source** to **GitHub Actions**.
2. Push to `main`. The workflow runs automatically — do not also dispatch it
   manually, as `cancel-in-progress` will cancel the earlier run.
3. The site is served at
   `https://logeshgp.github.io/clothing-ecommerce-platform/`.

Because Pages has no server-side routing, the workflow copies `index.html` to
`404.html` so deep links resolve through React Router.

## Useful commands

```sh
npm run dev            # dev server with hot reload
npm run publish:data   # regenerate public/store-data.json from src/data/
npm run build          # production bundle → dist/
npm run preview        # serve the production bundle locally
npm run share          # expose the dev server on the LAN and a public tunnel
```

## Operational notes

- There is no admin login, no session and no server. Everything published is
  in the repository, and every change is a commit.
- Customers prepare a WhatsApp draft and press Send themselves. The site cannot
  confirm a message was sent or an order accepted.
- Never commit `.env`, secrets or customer data.
- Replace sample photography and descriptions with assets the business is
  authorised to publish.
- This project is not legal, tax or accounting advice.
