// Explicit extensions keep these modules loadable by both Vite and plain Node
// (the API server seeds its database from this file).
import { MEASUREMENTS, SIZES } from './taxonomy.js';
import { seededRandom } from '../utils/format.js';

/**
 * Seed catalog.
 *
 * Products are stored in a flat, admin-editable shape: colours carry their own
 * image list and stock is a plain `"Colour::Size" -> number` map, so every
 * field can be edited from the admin console without derived data going stale.
 *
 * Pricing: `price` is the single-piece retail rate and `wholesalePrice` is the
 * per-piece rate once the buyer reaches `bulkMinQuantity` of that product.
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

const RAW = [
  // -------------------------------------------------------------------- Shorts
  {
    id: 'p-101',
    name: 'Adidas Zip-Pocket Shorts',
    category: 'shorts',
    gender: 'men',
    price: 85,
    compareAt: null,
    wholesalePrice: 69,
    bulkMinQuantity: 25,
    fit: 'regular',
    fabric: 'Poly-cotton knit',
    tags: ['new'],
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
    name: 'Tigers Side-Stripe Shorts',
    category: 'shorts',
    gender: 'men',
    price: 100,
    compareAt: null,
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
    price: 130,
    compareAt: null,
    wholesalePrice: 95,
    bulkMinQuantity: 10,
    // Wholesale is quoted per size on this style — 10 pieces each in XL and XXL.
    bulkNote: 'Wholesale rate applies to XL and XXL, minimum 10 pieces per size.',
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
    name: 'Wild Life Zip-Pocket Pant',
    category: 'pants',
    gender: 'men',
    price: 140,
    compareAt: null,
    wholesalePrice: 95,
    bulkMinQuantity: 25,
    fit: 'regular',
    fabric: 'Brushed fleece',
    tags: ['new'],
    blurb: 'A brushed fleece pant with a zip security pocket and a straight, easy leg.',
    released: '2026-10-19',
    sold: 0,
    rating: 4.8,
    reviews: 0,
    colors: [
      { name: 'Charcoal', images: ['/images/pant-wild-life.jpg'] },
      { name: 'Ink', images: [] },
      { name: 'Navy', images: [] },
      { name: 'Slate', images: [] },
      { name: 'Moss', images: [] },
    ],
  },

  // -------------------------------------------------------------- Track pants
  {
    id: 'p-105',
    name: 'Polar Deer Side-Stripe Track Pant',
    category: 'track-pants',
    gender: 'men',
    price: 140,
    compareAt: null,
    // TODO: confirm the per-piece wholesale rate for this style — the minimum
    // order quantity is 30 but no wholesale price has been supplied yet.
    wholesalePrice: null,
    bulkMinQuantity: 30,
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
