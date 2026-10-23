/** Promotion codes published with the catalogue. */

export const SEED_PROMOS = [];

/**
 * Resolves a promo code against the published list. There is no server, so
 * this is the only validation — the seller confirms the final price on
 * WhatsApp.
 *
 * @returns {{ok: true, promo: object} | {ok: false, reason: string}}
 */
export function resolvePromoCode(rawCode, subtotal, promos = []) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'Enter a promo code.' };

  const promo = promos.find((p) => String(p.code).toUpperCase() === code);
  if (!promo) return { ok: false, reason: `"${code}" isn't a valid code.` };
  if (promo.active === false) return { ok: false, reason: `${promo.code} is no longer active.` };

  if (subtotal < (promo.minSubtotal ?? 0)) {
    return {
      ok: false,
      reason: `${promo.code} needs a subtotal of at least ₹${Number(
        promo.minSubtotal,
      ).toLocaleString('en-IN')}.`,
    };
  }

  return { ok: true, promo };
}
