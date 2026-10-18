// Explicit extensions keep these modules loadable by both Vite and plain Node
// (the API server seeds its database from this file).
import { MEASUREMENTS, SIZES } from './taxonomy.js';
import { seededRandom } from '../utils/format.js';

/**
 * Seed catalog — one product per category, priced in rupees.
 *
 * Products are stored in a flat, admin-editable shape: colours carry their own
 * image list and stock is a plain `"Colour::Size" -> number` map, so every
 * field can be edited from the admin console without derived data going stale.
 *
 * Only the shorts have photography so far. Every other product ships with an
 * empty `images` array on purpose — the UI renders a neutral placeholder until
 * real photos are uploaded through the admin console.
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
};

/** Deterministic stock so "only 2 left" warnings stay stable between reloads. */
function seedStock(productId, colors, sizes) {
  const stock = {};
  colors.forEach((color, ci) => {
    sizes.forEach((size, si) => {
      const roll = seededRandom(`${productId}-${color.name}-${size}`);
      if (roll < 0.06) stock[`${color.name}::${size}`] = 0;
      else if (roll < 0.18) stock[`${color.name}::${size}`] = 1 + (Math.floor(roll * 10) % 3);
      else stock[`${color.name}::${size}`] = 6 + Math.floor(roll * 40) + ci + si;
    });
  });
  return stock;
}

const SHORTS_PHOTOS = [
  '/images/mens-casual-shorts-01.png',
  '/images/mens-casual-shorts-02.png',
  '/images/mens-casual-shorts-03.png',
  '/images/mens-casual-shorts-04.png',
  '/images/mens-casual-shorts-05.png',
  '/images/mens-casual-shorts-06.png',
];

const RAW = [
  // --------------------------------------------------------------------- Pants
  {
    id: 'p-001',
    name: 'Everyday Cotton Chino',
    category: 'pants',
    gender: 'unisex',
    price: 1299,
    compareAt: 1699,
    fit: 'relaxed',
    fabric: 'Combed cotton',
    tags: ['sale'],
    blurb: 'A dependable straight-leg cotton chino with a comfortable mid rise.',
    released: '2026-07-02',
    sold: 3180,
    rating: 4.7,
    reviews: 512,
    colors: [
      { name: 'Bone', images: [] },
      { name: 'Ink', images: [] },
      { name: 'Olive', images: [] },
    ],
  },

  // ----------------------------------------------------------------- Trousers
  {
    id: 'p-008',
    name: 'Studio Straight Trouser',
    category: 'trousers',
    gender: 'unisex',
    price: 2499,
    fit: 'regular',
    fabric: 'Stretch twill',
    tags: [],
    blurb: 'A clean straight leg with a mid rise and just enough stretch.',
    released: '2026-04-11',
    sold: 2240,
    rating: 4.8,
    reviews: 389,
    colors: [
      { name: 'Charcoal', images: [] },
      { name: 'Sand', images: [] },
      { name: 'Ink', images: [] },
    ],
  },

  // -------------------------------------------------------------- Track pants
  {
    id: 'p-014',
    name: 'Loop Terry Track Pant',
    category: 'track-pants',
    gender: 'unisex',
    price: 1899,
    fit: 'relaxed',
    fabric: 'Cotton terry',
    tags: [],
    blurb: 'A tapered terry track pant with a ribbed waist that stays put.',
    released: '2026-07-16',
    sold: 1760,
    rating: 4.7,
    reviews: 268,
    colors: [
      { name: 'Oat', images: [] },
      { name: 'Charcoal', images: [] },
      { name: 'Sage', images: [] },
    ],
  },

  // ------------------------------------------------------------- 3/4 pants
  {
    id: 'p-019',
    name: 'Basin Relaxed 3/4 Pant',
    category: 'three-fourth',
    gender: 'unisex',
    price: 1499,
    compareAt: 1899,
    fit: 'relaxed',
    fabric: 'Linen blend',
    tags: ['sale'],
    blurb: 'A breathable linen-blend three-quarter with a drawcord waist.',
    released: '2026-04-02',
    sold: 1320,
    rating: 4.3,
    reviews: 167,
    colors: [
      { name: 'Ecru', images: [] },
      { name: 'Sage', images: [] },
      { name: 'Cocoa', images: [] },
    ],
  },

  // -------------------------------------------------------------------- Shorts
  {
    id: 'p-025',
    name: 'Men’s Casual Wear Shorts',
    category: 'shorts',
    gender: 'men',
    price: 92,
    compareAt: null,
    wholesalePrice: 82,
    fit: 'regular',
    fabric: 'Performance mesh',
    tags: ['new'],
    blurb: 'Lightweight casual shorts designed for breathable, quick-drying everyday comfort.',
    released: '2026-10-12',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Magenta', images: [...SHORTS_PHOTOS] },
      { name: 'Navy', images: [...SHORTS_PHOTOS] },
    ],
  },
];

/** Expands a seed entry into the full product shape used by the app. */
export function hydrateProduct(raw) {
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
    stock: raw.stock ?? seedStock(raw.id, colors, sizes),
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

export function totalStock(product) {
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
