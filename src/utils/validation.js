/**
 * Client-side validators for the checkout and bulk-order forms.
 *
 * These guard against typos, not against attackers — there is no server to
 * protect. The only consequence of bad input is a WhatsApp message the seller
 * cannot act on.
 */

const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

/** Indian PIN codes are six digits and never start with zero. */
const PINCODE_RE = /^[1-9]\d{5}$/;

export function isPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

export function isPincode(value) {
  return PINCODE_RE.test(String(value || '').trim());
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

/**
 * A usable street address — enough detail for a courier to find the door.
 * Short enough to catch "home" or a bare city name.
 */
export function isAddress(value) {
  return String(value ?? '').trim().length >= 10;
}
