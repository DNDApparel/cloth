/**
 * Pure pricing helpers — kept free of React so they stay trivially testable.
 *
 * Discounts apply to merchandise only. Delivery and applicable taxes are
 * confirmed directly with the seller before an order is accepted.
 */

/**
 * Most pieces of a single product variant a shopper can put in the bag.
 *
 * Wholesale minimums run to 30 pieces, so the old cap of 10 made those tiers
 * unreachable from the storefront. Available stock still caps it lower.
 */
export const MAX_LINE_QUANTITY = 100;

export const DEFAULT_SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', detail: '4–6 business days', price: 79, freeOverThreshold: true },
  { id: 'express', label: 'Express', detail: '2–3 business days', price: 149, freeOverThreshold: false },
  { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 299, freeOverThreshold: false },
];

/** A cart line is identified by product + variant, so the same tee in two sizes stays separate. */
export function lineId(productId, size, color) {
  return `${productId}::${size}::${color}`;
}

export function lineSubtotal(line) {
  return line.price * line.quantity;
}

export function cartCount(items) {
  return items.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(items) {
  return items.reduce((total, line) => total + lineSubtotal(line), 0);
}

export function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function promoDiscount(amount, promo) {
  if (!promo) return 0;
  if (promo.type === 'percent') return round(amount * (promo.value / 100));
  if (promo.type === 'fixed') return Math.min(promo.value, amount);
  return 0;
}

export function shippingCost(amount, methodId, methods = DEFAULT_SHIPPING_METHODS, threshold = 1999) {
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  if (!method || amount <= 0) return 0;
  if (method.freeOverThreshold && amount >= threshold) return 0;
  return method.price;
}

/** True when a product carries its own per-piece wholesale rate. */
function hasRate(wholesalePrice, price) {
  return (
    wholesalePrice !== null &&
    wholesalePrice !== undefined &&
    wholesalePrice !== '' &&
    Number.isFinite(Number(wholesalePrice)) &&
    Number(wholesalePrice) >= 0 &&
    Number(wholesalePrice) < Number(price)
  );
}

/**
 * Minimum pieces that unlock the wholesale rate.
 *
 * Each product can override the store-wide default, because the seller quotes
 * a different minimum order quantity per style.
 */
export function minBulkQuantity(settings, productMinQuantity) {
  const perProduct = Number(productMinQuantity);
  if (Number.isFinite(perProduct) && perProduct >= 1) return Math.floor(perProduct);
  return Math.max(1, Number(settings?.bulkDiscount?.minQuantity) || 10);
}

export function bulkPrice(price, settings, wholesalePrice, productMinQuantity) {
  const bulk = settings?.bulkDiscount;
  const minQuantity = minBulkQuantity(settings, productMinQuantity);
  const percent = Number(bulk?.percent) || 0;
  const hasWholesalePrice =
    wholesalePrice !== null &&
    wholesalePrice !== undefined &&
    wholesalePrice !== '' &&
    Number.isFinite(Number(wholesalePrice)) &&
    Number(wholesalePrice) >= 0 &&
    Number(wholesalePrice) < Number(price);
  const active = Boolean(bulk?.active && (hasWholesalePrice || percent > 0));
  const unitPrice = active
    ? hasWholesalePrice
      ? round(Number(wholesalePrice))
      : round(price * (1 - percent / 100))
    : round(price);
  return {
    active,
    minQuantity,
    percent: price > 0 ? round((1 - unitPrice / price) * 100) : 0,
    unitPrice,
    savings: round(price - unitPrice),
  };
}

/**
 * Single source of truth for every total shown in the drawer, cart page,
 * checkout and order records.
 *
 * @param {Array} items cart lines
 * @param {object} options
 * @param {object|null} options.promo applied promo code
 * @param {string} options.shippingMethod selected method id
 * @param {object} options.settings store settings (tax, threshold, festive offer, methods)
 */
export function calculateTotals(items, { promo = null, shippingMethod = 'standard', settings } = {}) {
  const itemCount = cartCount(items);
  const bulk = settings?.bulkDiscount;
  const subtotal = round(cartSubtotal(items));
  const bulkMinQuantity = Math.max(1, Number(bulk?.minQuantity) || 10);
  const quantitiesByProduct = items.reduce((counts, line) => {
    counts[line.productId] = (counts[line.productId] ?? 0) + line.quantity;
    return counts;
  }, {});
  const qualifyingProducts = new Set(Object.entries(quantitiesByProduct)
    .filter(([productId, quantity]) => {
      const productLines = items.filter((line) => line.productId === productId);
      const hasProductRate = productLines.some((line) => hasRate(line.wholesalePrice, line.price));
      // Each style has its own minimum order quantity; fall back to the
      // store-wide default when a product does not set one.
      const required = minBulkQuantity(settings, productLines[0]?.bulkMinQuantity);
      return bulk?.active && quantity >= required && (hasProductRate || Number(bulk?.percent) > 0);
    })
    .map(([productId]) => productId));
  const qualifyingSubtotal = items.reduce(
    (sum, line) => sum + (qualifyingProducts.has(line.productId) ? lineSubtotal(line) : 0),
    0,
  );
  const bulkDiscount = round(items.reduce((discount, line) => {
    if (!qualifyingProducts.has(line.productId)) return discount;
    const hasProductRate = hasRate(line.wholesalePrice, line.price);
    const unitSavings = hasProductRate
      ? line.price - Number(line.wholesalePrice)
      : line.price * (Number(bulk.percent) / 100);
    return discount + unitSavings * line.quantity;
  }, 0));
  const effectiveBulkPercent = qualifyingSubtotal > 0
    ? round((bulkDiscount / qualifyingSubtotal) * 100)
    : 0;
  const bulkActive = bulkDiscount > 0;
  const afterBulk = Math.max(round(subtotal - bulkDiscount), 0);
  const festive = settings?.festiveOffer;

  const festiveActive = Boolean(festive?.active && festive.percent > 0 && afterBulk > 0);
  const festiveDiscount = festiveActive ? round(afterBulk * (festive.percent / 100)) : 0;
  const afterFestive = Math.max(round(afterBulk - festiveDiscount), 0);

  const codeDiscount = round(promoDiscount(afterFestive, promo));
  const payable = Math.max(round(afterFestive - codeDiscount), 0);

  return {
    subtotal,
    bulkDiscount,
    bulkLabel: bulkActive ? bulk.label : null,
    bulkPercent: bulkActive ? effectiveBulkPercent : 0,
    festiveDiscount,
    festiveLabel: festiveActive ? festive.label : null,
    festivePercent: festiveActive ? festive.percent : 0,
    codeDiscount,
    discount: round(bulkDiscount + festiveDiscount + codeDiscount),
    payable,
    shipping: null,
    tax: null,
    total: payable,
    itemCount,
  };
}
