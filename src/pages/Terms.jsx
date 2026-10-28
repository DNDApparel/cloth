import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/format';

/**
 * Terms and conditions of sale.
 *
 * Written against what the storefront actually does: it takes no payment, it
 * places no order, and every figure shown is an estimate until the seller
 * confirms it on WhatsApp. The sale and delivery clauses read their numbers
 * from store settings so the page can never contradict the prices on a
 * product tile.
 */
export default function Terms() {
  const { settings } = useStore();
  const delivery = settings.delivery ?? {};
  const freeDelivery = delivery.freeDeliveryActive && Number(delivery.freeAbove) > 0;

  const sellerDetails = [
    settings.sellerLegalName,
    settings.businessAddress,
    settings.gstin && `GSTIN: ${settings.gstin}`,
    settings.grievanceOfficer && `Grievance officer: ${settings.grievanceOfficer}`,
    settings.grievanceEmail && `Email: ${settings.grievanceEmail}`,
    settings.grievancePhone && `Phone: ${settings.grievancePhone}`,
  ].filter(Boolean);

  return (
    <article className="dnd-container max-w-3xl py-14">
      <p className="dnd-eyebrow">Terms &amp; conditions</p>
      <h1 className="mt-2 text-4xl font-bold">Terms of sale</h1>
      <p className="mt-4 text-sm text-ink-500">
        These terms apply to every enquiry raised through this website.
      </p>

      <Section title="1. How ordering works">
        <p>
          Product pages show the listed merchandise price and current product information. Adding
          items to your bag does not place an order and does not reserve stock. When you choose
          WhatsApp, your browser opens a message draft addressed to the seller; you review and send
          it yourself.
        </p>
        <p>
          An order exists only once the seller confirms it in writing on WhatsApp. Before accepting,
          the seller confirms product availability, the final price, any applicable taxes, delivery
          charges and delivery timelines. <strong>No payment is collected on this website.</strong>
        </p>
      </Section>

      <Section title="2. Pricing and the Diwali sale">
        <p>
          All prices are in Indian rupees and are inclusive of the listed merchandise value only.
          Where a struck-through price is shown next to a product, it is that product&rsquo;s
          pre-sale list price and the lower figure is the current Diwali sale price.
        </p>
        <p>
          Sale prices are available for a limited period and may be withdrawn or revised at any
          time without notice. A price change does not apply retrospectively to an order the seller
          has already confirmed.
        </p>
        <p>
          The Diwali sale price is a retail rate for individual pieces. Wholesale rates are quoted
          separately per style and are <strong>not</strong> reduced further by the sale — the two
          offers do not stack.
        </p>
      </Section>

      <Section title="3. Delivery">
        {freeDelivery ? (
          <p>
            <strong>{delivery.label}.</strong> Orders with a merchandise total of{' '}
            {formatPrice(delivery.freeAbove)} or more are delivered free during the Diwali sale. The
            total is measured after all discounts have been applied. For orders below{' '}
            {formatPrice(delivery.freeAbove)}, the seller confirms the delivery charge on WhatsApp
            before accepting the order.
          </p>
        ) : (
          <p>
            Delivery charges are confirmed by the seller on WhatsApp before an order is accepted.
          </p>
        )}
        <p>
          Delivery timelines are estimates provided by the seller and depend on the courier, the
          destination and stock availability. Delivery is made to the address you confirm with the
          seller; please check it carefully before the order is dispatched.
        </p>
      </Section>

      <Section title="4. Wholesale and bulk orders">
        <p>
          Quantity discounts displayed on the site are indicative. Each style carries its own
          minimum order quantity, and the wholesale rate applies only once that quantity is reached
          for that style. Where a style is sold as an assorted pack, the colour mix is set by the
          seller.
        </p>
        <p>
          The seller confirms the eligible quantity, stock and final wholesale quote directly with
          the buyer. For a quote, use the{' '}
          <Link to="/bulk-order" className="underline underline-offset-2">
            wholesale enquiry form
          </Link>
          .
        </p>
      </Section>

      <Section title="5. Product information and imagery">
        <p>
          Product photographs are of the actual garments. Colour may vary slightly between screens
          and between production batches. Measurements in the size guide are garment measurements
          with a small tolerance, not body measurements.
        </p>
        {settings.manufacturingNote && <p>{settings.manufacturingNote}</p>}
      </Section>

      <Section title="6. Cancellations, returns and replacements">
        <p>
          Because no payment is taken on this website, an enquiry can be withdrawn at any point
          before the seller confirms the order. After confirmation, cancellation is at the
          seller&rsquo;s discretion.
        </p>
        <p>
          Claims for a damaged, defective or incorrect item must be raised with the seller on
          WhatsApp within 48 hours of delivery, with photographs of the item and the packaging.
          Items must be unused, unwashed and in their original packaging with tags intact.
          Replacement or refund is at the seller&rsquo;s discretion once the claim is verified.
        </p>
        <p>
          Wholesale and assorted-pack orders are made to order and are not eligible for return
          except where the goods are defective.
        </p>
      </Section>

      <Section title="7. Your information">
        <p>
          When you send an enquiry, the name, phone number and item details in the draft are shared
          with the seller through WhatsApp — and only if you press Send in WhatsApp yourself. How
          that information is handled is set out in the{' '}
          <Link to="/privacy" className="underline underline-offset-2">
            privacy notice
          </Link>
          .
        </p>
      </Section>

      <Section title="8. Liability">
        <p>
          The seller&rsquo;s liability in connection with any order is limited to the merchandise
          value of that order. Nothing in these terms limits any right you have under the Consumer
          Protection Act, 2019 or other applicable Indian law.
        </p>
      </Section>

      <Section title="9. Seller details and support">
        <p className="whitespace-pre-line">
          {sellerDetails.join('\n') || 'Seller contact details are being updated.'}
        </p>
        {settings.supportEmail && (
          <p>
            Support:{' '}
            <a href={`mailto:${settings.supportEmail}`} className="underline underline-offset-2">
              {settings.supportEmail}
            </a>
          </p>
        )}
      </Section>

      <p className="mt-10 border-t border-sand-200 pt-6 text-xs leading-relaxed text-ink-500">
        These terms are governed by Indian law. The seller should have these terms and disclosures
        reviewed for the business and applicable Indian laws before accepting orders.
      </p>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-ink-700">{children}</div>
    </section>
  );
}
