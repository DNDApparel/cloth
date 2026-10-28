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
    image: '/images/collection-everyday.jpg',
    productIds: ['p-101', 'p-102', 'p-103', 'p-104', 'p-105'],
  },
  {
    slug: 'move-well',
    title: 'Move Well',
    issue: '027',
    tagline: 'Built to move with you.',
    description:
      'Track pants and zip-pocket styles made for days on the move.',
    image: '/images/collection-move-well.jpg',
    productIds: ['p-105', 'p-104'],
  },
  {
    slug: 'warm-month-staples',
    title: 'Warm Month Staples',
    issue: '025',
    tagline: 'Comfort for warmer days.',
    description:
      'Easy-to-wear styles for warmer weather and everyday plans.',
    image: '/images/collection-warm-month.jpg',
    productIds: ['p-101', 'p-102'],
  },
  {
    slug: 'soft-structure',
    title: 'Soft Structure',
    issue: '024',
    tagline: 'Comfort for every day.',
    description: 'Everyday styles in comfortable fits.',
    image: '/images/collection-soft-structure.jpg',
    productIds: ['p-103', 'p-104'],
  },
];

/** Short brand values rendered in the scrolling strip on the home page. */
export const BRAND_VALUES = [
  'Straight from the manufacturer.',
  'Low prices, same cloth quality.',
  'Pants, shorts and track pants.',
  'Free delivery above ₹499.',
  'Wholesale enquiries welcome.',
];

export const STORY_BLOCKS = [
  {
    title: 'Direct from the manufacturer',
    body:
      'We buy straight from the factory in Tiruppur, so there is no distributor or showroom '
      + 'margin in the price you pay.',
  },
  {
    title: 'No compromise on quality',
    body:
      'Same cloth, same stitching, same finish as the garments the factory produces. Only the '
      + 'supply chain is shorter — the quality is not.',
  },
  {
    title: 'Made for everyday',
    body: 'Explore pants, shorts and track pants for your daily rotation.',
  },
];
