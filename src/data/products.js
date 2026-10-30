// Explicit extensions keep these modules loadable by both Vite and plain Node
// (the API server seeds its database from this file).
import { MEASUREMENTS, SIZES } from './taxonomy.js';
import { MAX_LINE_QUANTITY } from '../utils/cart.js';

/**
 * Seed catalog.
 *
 * Products are stored in a flat, admin-editable shape: colours carry their own
 * image list and stock is a plain `"Colour::Size" -> number` map, so every
 * field can be edited by hand without derived data going stale.
 *
 * Pricing: `price` is the single-piece retail rate and `wholesalePrice` is the
 * per-piece rate once the buyer reaches `bulkMinQuantity` of that product.
 * `compareAt` is the pre-Diwali list price — the strike-through a shopper sees
 * next to the current rate, so the festive saving is visible on every tile.
 * Wholesale rates are unchanged by the Diwali sale: they are already the
 * seller's floor price and are quoted per style.
 * Only the first colour of each product is photographed so far — the rest
 * render a neutral placeholder until more shots are supplied.
 */

const CARE_BY_FABRIC = {
  'Combed cotton': ['Machine wash cold with like colours', 'Tumble dry low', 'Warm iron if needed'],
  'Organic cotton': ['Machine wash cold', 'Line dry in shade', 'Do not bleach'],
  'Cotton terry': ['Machine wash cold inside out', 'Tumble dry low', 'Avoid high heat'],
  'Brushed fleece': ['Machine wash cold inside out', 'Tumble dry low', 'Do not iron print'],
  'Stretch twill': ['Machine wash cold, gentle cycle', 'Hang dry', 'Cool iron on reverse'],
  'Linen blend': ['Machine wash cold, gentle cycle', 'Line dry to limit creasing', 'Iron while damp'],
  'Tencel™ lyocell': ['Machine wash cold, gentle cycle', 'Hang dry', 'Cool iron on reverse'],
  'Performance mesh': ['Machine wash cold', 'Do not use fabric softener', 'Hang dry'],
  'Poly-cotton knit': ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
  'Lycra blend': ['Machine wash cold', 'Do not bleach', 'Hang dry away from direct sun'],
};

/**
 * Fills every colour/size variant to the same number.
 *
 * This is a made-to-order wholesale catalogue rather than a fixed-inventory
 * shop, so the seller confirms real availability on WhatsApp. The number here
 * is what the quantity stepper will allow per variant: products set
 * `maxPerVariant` when the seller wants a tighter per-colour cap than the
 * store-wide `MAX_LINE_QUANTITY`.
 */
function seedStock(colors, sizes, perVariant = MAX_LINE_QUANTITY, soldOut = false) {
  // A sold-out style keeps its photography, colours and sizes; only the
  // numbers go to zero. Every "is this available" check in the app reads
  // stock, so one flag drives the badge, the disabled picker and the
  // disabled Add-to-bag button.
  const limit = soldOut ? 0 : Math.min(Math.max(1, perVariant), MAX_LINE_QUANTITY);
  const stock = {};
  colors.forEach((color) => {
    sizes.forEach((size) => {
      stock[`${color.name}::${size}`] = limit;
    });
  });
  return stock;
}

const RAW = [
  // -------------------------------------------------------------------- Shorts
  {
    id: 'p-101',
    name: 'Zipped-Pocket Shorts',
    category: 'shorts',
    gender: 'men',
    price: 149,
    compareAt: 280,
    wholesalePrice: 69,
    bulkMinQuantity: 25,
    // Out of stock: still listed, still photographed, but every variant is
    // zeroed by `hydrateProduct` so the tile carries the "Sold out" overlay
    // and nothing can reach the bag.
    soldOut: true,
    fit: 'regular',
    fabric: 'Poly-cotton knit',
    tags: [],
    blurb: 'Everyday knit shorts with a zip security pocket and a contrast drawcord.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Ink', images: ['/images/shorts-adidas.jpg'] },
      { name: 'Navy', images: [] },
      { name: 'Charcoal', images: [] },
      { name: 'Olive', images: [] },
      { name: 'Slate', images: [] },
    ],
  },
  {
    id: 'p-102',
    name: 'Side-Striped Shorts',
    category: 'shorts',
    gender: 'men',
    price: 139,
    compareAt: 270,
    wholesalePrice: 75,
    bulkMinQuantity: 30,
    fit: 'regular',
    fabric: 'Poly-cotton knit',
    tags: ['new'],
    blurb: 'Twin side stripes, a zip pocket and a soft knit body built for warm days.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Olive', images: ['/images/shorts-tigers.jpg'] },
      { name: 'Moss', images: [] },
      { name: 'Ink', images: [] },
      { name: 'Navy', images: [] },
      { name: 'Charcoal', images: [] },
      { name: 'Sand', images: [] },
    ],
  },

  // --------------------------------------------------------------------- Pants
  {
    id: 'p-103',
    name: 'Lycra Stretch Pant',
    category: 'pants',
    gender: 'men',
    price: 249,
    compareAt: 400,
    wholesalePrice: 95,
    bulkMinQuantity: 10,
    // Wholesale is quoted per size on this style — 10 pieces each in XXL.
    bulkNote: 'Wholesale rate applies to XXL, minimum 10 pieces.',
    fit: 'regular',
    fabric: 'Lycra blend',
    tags: ['new'],
    blurb: 'A smooth lycra-blend pant with a clean straight leg and an elasticated waist.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Slate', images: ['/images/pant-lycra-grey.jpg'] },
      { name: 'Maroon', images: ['/images/pant-lycra-maroon.jpg'] },
      { name: 'Ink', images: [] },
      { name: 'Navy', images: [] },
      { name: 'Charcoal', images: [] },
    ],
  },
  {
    id: 'p-104',
    name: 'Zipped-Pocket Pant',
    category: 'pants',
    gender: 'men',
    price: 199,
    compareAt: 350,
    wholesalePrice: 95,
    bulkMinQuantity: 25,
    // Out of stock — see the note on p-101.
    soldOut: true,
    fit: 'regular',
    fabric: 'Brushed fleece',
    tags: [],
    blurb: 'A brushed fleece pant with a zip security pocket and a straight, easy leg.',
    bulkNote:
      'The 25-piece wholesale rate is an assorted pack: Grey / Yellow, Blue / White, '
      + 'Grey / Orange, Black / Red and a second Blue / White — five pieces of each.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    // Four colourways are sold individually. The fifth pack colour is a
    // repeat of Blue / White, so it needs no separate swatch.
    // Three shots per colourway, in the order they appear in the gallery:
    // the full garment, the zip detail, then the drawcord.
    colors: [
      {
        name: 'Grey / Yellow',
        images: [
          '/images/zpp-grey-yellow-full.jpg',
          '/images/zpp-grey-yellow-zip.jpg',
          '/images/zpp-grey-yellow-thread.jpg',
        ],
      },
      {
        name: 'Blue / White',
        images: [
          '/images/zpp-blue-white-full.jpg',
          '/images/zpp-blue-white-zip.jpg',
          '/images/zpp-blue-white-thread.jpg',
        ],
      },
      {
        name: 'Grey / Orange',
        images: [
          '/images/zpp-grey-orange-full.jpg',
          '/images/zpp-grey-orange-zip.jpg',
          '/images/zpp-grey-orange-thread.jpg',
        ],
      },
      {
        name: 'Black / Red',
        images: [
          '/images/zpp-black-red-full.jpg',
          '/images/zpp-black-red-zip.jpg',
          '/images/zpp-black-red-thread.jpg',
        ],
      },
    ],
  },

  // -------------------------------------------------------------- Track pants
  {
    id: 'p-105',
    name: 'Side-Striped Track Pant',
    category: 'track-pants',
    gender: 'men',
    price: 249,
    compareAt: 400,
    wholesalePrice: 95,
    bulkMinQuantity: 25,
    fit: 'regular',
    fabric: 'Poly-cotton knit',
    tags: ['new'],
    blurb: 'Twin side stripes and zip pockets on a tapered, everyday track pant.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Navy', images: ['/images/pant-polar-deer.jpg'] },
      { name: 'Ink', images: [] },
      { name: 'Charcoal', images: [] },
      { name: 'Slate', images: [] },
      { name: 'Maroon', images: [] },
      { name: 'Olive', images: [] },
    ],
  },
];

/** Expands a seed entry into the full product shape used by the app. */
function hydrateProduct(raw) {
  const sizes = raw.sizes?.length ? raw.sizes : SIZES;
  const colors = (raw.colors ?? []).map((color) => {
    const images = Array.isArray(color.images)
      ? color.images.filter((image) => typeof image === 'string' && image)
      : color.image
        ? [color.image]
        : [];
    return { ...color, images, image: color.image || images[0] || '' };
  });

  return {
    ...raw,
    sizes,
    colors,
    stock: raw.stock ?? seedStock(colors, sizes, raw.maxPerVariant, raw.soldOut),
    slug:
      raw.slug ??
      `${raw.id}-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    care: raw.care ?? CARE_BY_FABRIC[raw.fabric] ?? CARE_BY_FABRIC['Organic cotton'],
    details: raw.details ?? [
      `${raw.fabric} — ${raw.fit} fit`,
      'Designed in-house, made in limited runs',
      'Check the size guide for garment measurements',
    ],
    measurements: Object.fromEntries(sizes.map((s) => [s, MEASUREMENTS[s]])),
    compareAt: Object.hasOwn(raw, 'compareAt') && raw.compareAt === null
      ? null
      : Math.max(
          Number(raw.compareAt) || Math.ceil((Number(raw.price) * 1.2) / 100) * 100,
          Number(raw.price) + 1,
        ),
    tags: raw.tags ?? [],
  };
}

export const SEED_PRODUCTS = RAW.map(hydrateProduct);

/* ------------------------------------------------------------------
   Helpers — pure, so they work against any product list (seed or admin-edited)
   ------------------------------------------------------------------ */

export function stockFor(product, color, size) {
  return product?.stock?.[`${color}::${size}`] ?? 0;
}

function totalStock(product) {
  return Object.values(product?.stock ?? {}).reduce((sum, n) => sum + n, 0);
}

export function isInStock(product) {
  return totalStock(product) > 0;
}

export function sizesInStock(product, color) {
  return product.sizes.filter((size) => stockFor(product, color, size) > 0);
}

export function colorImage(product, color) {
  return colorImages(product.colors.find((c) => c.name === color))[0]
    ?? colorImages(product.colors[0])[0]
    ?? '';
}

export function colorImages(color) {
  if (Array.isArray(color?.images) && color.images.length) return color.images;
  return color?.image ? [color.image] : [];
}

export function primaryImage(product) {
  return colorImages(product.colors[0])[0] ?? '';
}

export function colorNames(product) {
  return product.colors.map((c) => c.name);
}

/** "You might also like" — same category first, then same fabric. */
export function relatedProducts(product, allProducts, limit = 4) {
  if (!product) return [];
  const sameCategory = allProducts.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const sameFabric = allProducts.filter(
    (p) => p.id !== product.id && p.fabric === product.fabric && p.category !== product.category,
  );
  return [...sameCategory, ...sameFabric].slice(0, limit);
}
