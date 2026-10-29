/** Shared vocabulary for navigation, filters, admin forms and badges. */

export const CATEGORIES = [
  { slug: 'pants', name: 'Pants', blurb: 'Everyday pants made for comfortable movement.' },
  { slug: 'track-pants', name: 'Track pants', blurb: 'Built to move, comfortable enough to stay in.' },
  { slug: 'shorts', name: 'Shorts', blurb: 'Men’s casual shorts for warm days and easy movement.' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

/** Pseudo-category used by navigation and filters to surface newly tagged items. */

export const GENDERS = [
  { slug: 'men', name: 'Men' },
  { slug: 'women', name: 'Women' },
  { slug: 'unisex', name: 'Unisex' },
];

// The store stocks a single size. Keeping the list as an array means the
// size picker, filter, chart and stock seeding all follow this one line.
export const SIZES = ['XXL'];

export const FITS = [
  { slug: 'slim', name: 'Slim' },
  { slug: 'regular', name: 'Regular' },
  { slug: 'relaxed', name: 'Relaxed' },
  { slug: 'oversized', name: 'Oversized' },
];

export const FABRICS = [
  'Combed cotton',
  'Organic cotton',
  'Cotton terry',
  'Brushed fleece',
  'Stretch twill',
  'Linen blend',
  'Tencel™ lyocell',
  'Performance mesh',
  'Poly-cotton knit',
];

/**
 * Swatch colours, keyed by the colour name used in `products.js`.
 *
 * A value may be a single hex string, or `[body, trim]` for a garment whose
 * zip and drawcord are a contrasting colour — the swatch then renders split
 * so the two-tone styles are distinguishable at a glance.
 */
export const COLOR_SWATCHES = {
  // Two-tone: body colour first, zip/cord trim second.
  'Grey / Yellow': ['#4a4a4a', '#e8c20a'],
  'Grey / Orange': ['#5a564f', '#f08a1c'],
  'Blue / White': ['#3d4760', '#f2efe8'],
  'Black / Red': ['#2a2724', '#c8303c'],

  Oat: '#e3d9c6',
  Bone: '#f0ece2',
  Ivory: '#faf8f4',
  Ecru: '#efe7d6',
  Sand: '#d8c7a9',
  Stone: '#b8b2a6',
  Clay: '#c47f5a',
  Rust: '#a9643f',
  Cocoa: '#6b4f3a',
  Olive: '#6b7254',
  Moss: '#5c6b52',
  Sage: '#9aa88e',
  Slate: '#6b7280',
  Indigo: '#39455e',
  Navy: '#2b3650',
  Charcoal: '#3a3730',
  Ink: '#1a1a18',
  Plum: '#8c3f52',
  Maroon: '#6d2f3c',
  Magenta: '#b10d66',
};


export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'New arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

/** Price slider bounds, in rupees. */
export const PRICE_BOUNDS = { min: 0, max: 3999, step: 50 };


export const BADGE_STYLES = {
  new: { label: 'New', className: 'bg-ink-900 text-sand-100' },
  sale: { label: 'On sale', className: 'bg-berry-500 text-white' },
  'last-chance': { label: 'Last chance', className: 'bg-moss-500 text-white' },
};

/** Garment measurements in inches, measured flat. Shown in the size guide. */
export const MEASUREMENTS = {
  XXL: { chest: 46, waist: 38, hip: 46, length: 31, inseam: 31.5 },
};

/** Which measurement columns make sense for a given category. */
export const MEASUREMENT_COLUMNS = {
  pants: [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'inseam', label: 'Inseam' },
  ],
  'track-pants': [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'inseam', label: 'Inseam' },
  ],
  shorts: [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'length', label: 'Length' },
  ],
};
