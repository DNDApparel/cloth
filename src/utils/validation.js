/**
 * Client-side validators for the checkout and bulk-order forms.
 *
 * These guard against typos, not against attackers — there is no server to
 * protect. The only consequence of bad input is a WhatsApp message the seller
 * cannot act on.
 */

const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function isPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}
