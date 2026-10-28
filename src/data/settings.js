/**
 * Store-wide settings published with the catalogue.
 * Every monetary value is in rupees (INR).
 */

export const SEED_ANNOUNCEMENTS = [
  {
    id: 'a-diwali-sale',
    text: 'DIWALI SALE IS LIVE — up to 49% off every style. Shorts from \u20B9139, pants from \u20B9199.',
    active: true,
  },
  {
    id: 'a-diwali-delivery',
    text: 'Diwali offer — free delivery on orders above \u20B9499.',
    active: true,
  },
  {
    id: 'a-diwali',
    text: 'Diwali offer — wholesale rates on every style. Reach a product\u2019s minimum pieces and the wholesale price applies automatically.',
    active: true,
  },
  { id: 'a-1', text: 'Everyday pants, shorts and track pants — made for movement.', active: true },
  { id: 'a-2', text: 'Wholesale orders welcome — message us for bulk pricing.', active: true },
];

export const SEED_SETTINGS = {
  storeName: 'DND Apparel',
  tagline: 'Everyday pants, made to move with you.',
  supportEmail: '',
  sellerLegalName: '',
  businessAddress: '',
  gstin: '',
  grievanceOfficer: '',
  grievanceEmail: '',
  grievancePhone: '',

  // Shown on every product page and in the footer. These are printed garments
  // from Tiruppur, not brand merchandise, and the printed logos must not be
  // read as an authorised brand product.
  manufacturingNote:
    'Logos and prints are decorative only. These garments are made and printed by '
    + 'Tiruppur manufacturers and are not produced by, licensed by, or affiliated with '
    + 'any sports or fashion brand.',

  // Prices are quoted in rupees throughout; `formatPrice` hard-codes the
  // locale. Applicable taxes are confirmed by the seller on WhatsApp, so the
  // storefront carries no tax rate.

  /**
   * Diwali sale delivery offer. Orders at or above `freeAbove` ship free;
   * below it the seller quotes delivery on WhatsApp. This is a single
   * threshold rather than a shipping table because there is only one offer.
   */
  delivery: {
    freeDeliveryActive: true,
    freeAbove: 499,
    label: 'Free delivery above \u20B9499',
    note: 'Orders of \u20B9499 and above ship free during the Diwali sale. '
      + 'Below \u20B9499 the seller confirms the delivery charge before accepting the order.',
  },

  // The retail prices on every product are the Diwali sale rates — the
  // strike-through `compareAt` on each product is the pre-sale list price.
  // `festiveOffer` stays off deliberately: turning it on would stack a second
  // percentage on top of the already-reduced sale price and quote a total the
  // seller never agreed to. The same reasoning applies to the wholesale rate,
  // which is unchanged by the sale.
  festiveOffer: {
    active: false,
    label: 'Diwali sale',
    percent: 0,
  },

  bulkDiscount: {
    active: true,
    minQuantity: 10,
    percent: 10,
    label: 'Diwali wholesale offer',
  },

  whatsapp: {
    enabled: true,
    contacts: [
      { id: 'owner', label: 'Store owner', number: '9361321260', enabled: true },
    ],
  },

  hero: {
    eyebrow: 'Diwali sale · Free delivery above \u20B9499',
    titleLine1: 'Find your',
    titleLine2: 'everyday fit.',
    bodyLine1: 'Pants, shorts and track pants.',
    bodyLine2: 'Diwali prices from \u20B9139. Free delivery above \u20B9499.',
    caption: 'Shop direct. Ask us on WhatsApp.',
    // Own product photography — no third-party or stock imagery, so there is
    // nothing to licence.
    image: '/images/hero-banner.jpg',
    ctaLabel: 'Shop the collection',
    ctaTo: '/shop',
  },

  // Diwali sale popup. Shown once per browsing session a moment after the
  // page settles, so it never competes with the first paint.
  banner: {
    enabled: true,
    theme: 'dark',
    title: 'Diwali Sale is live \u2728',
    body: 'Up to 49% off every style. Shorts from \u20B9139, pants from \u20B9199, '
      + 'track pants from \u20B9249 — and free delivery on orders above \u20B9499. '
      + 'Buying in quantity? Wholesale rates apply on top.',
    ctaLabel: 'Shop the Diwali sale',
    ctaTo: '/shop',
    image: '',
    dismissible: true,
    showOncePerSession: true,
    delayMs: 1500,
  },
};
