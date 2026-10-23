/** Formatting helpers. All money is Indian rupees. */

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const rupeesWithPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as INR — "₹1,299". The `en-IN` locale gives the rupee
 * symbol and lakh/crore grouping rather than thousands.
 *
 * Pass `{ forceCents: true }` for totals where paise should always show.
 */
export function formatPrice(value, { forceCents = false } = {}) {
  const amount = Number(value) || 0;
  if (forceCents || !Number.isInteger(amount)) return rupeesWithPaise.format(amount);
  return rupees.format(amount);
}

/** "2" -> "02" — used for the editorial counters throughout the UI. */
export function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
