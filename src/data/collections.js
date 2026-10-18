/**
 * Curated edits surfaced on the home page and the /collections route.
 *
 * `image` is intentionally empty until real photography is supplied — the UI
 * falls back to a neutral placeholder rather than a stock photo.
 */

export const COLLECTIONS = [
  {
    slug: 'the-everyday-edit',
    title: 'The Everyday Edit',
    issue: '026',
    tagline: 'Wear your own rhythm.',
    description:
      'The pieces we reach for without thinking — easy forms, considered details, made for wherever the day goes.',
    image: '',
    productIds: ['p-001', 'p-008', 'p-014', 'p-019'],
  },
  {
    slug: 'move-well',
    title: 'Move Well',
    issue: '027',
    tagline: 'Built to move with you.',
    description:
      'Track pants, training three-quarters and activewear made for days on the move.',
    image: '',
    productIds: ['p-014'],
  },
  {
    slug: 'warm-month-staples',
    title: 'Warm Month Staples',
    issue: '025',
    tagline: 'Comfort for warmer days.',
    description:
      'Easy-to-wear styles for warmer weather and everyday plans.',
    image: '',
    productIds: ['p-019', 'p-025'],
  },
  {
    slug: 'soft-structure',
    title: 'Soft Structure',
    issue: '024',
    tagline: 'Comfort for every day.',
    description: 'Everyday styles in comfortable fits.',
    image: '',
    productIds: ['p-001', 'p-008'],
  },
];

export const COLLECTIONS_BY_SLUG = Object.fromEntries(COLLECTIONS.map((c) => [c.slug, c]));

/** Short brand values rendered in the scrolling strip on the home page. */
export const BRAND_VALUES = [
  'Pants and trousers.',
  'Everyday styles.',
  'Find your fit.',
  'Track pants and three-quarter pants.',
  'Wholesale enquiries welcome.',
];

export const STORY_BLOCKS = [
  {
    title: 'Everyday styles',
    body: 'Browse pants, trousers, shorts, three-quarter pants and track pants in the collection.',
  },
  {
    title: 'Product details',
    body: 'View available sizes, colours, prices and product details before sending an enquiry.',
  },
  {
    title: 'Made for everyday',
    body: 'Explore pants, trousers, shorts, three-quarter styles and track pants for your daily rotation.',
  },
];
