import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { isAddress, isPhone, isPincode, isRequired } from '../utils/validation';
import { getWhatsAppContacts, openWhatsAppMessage } from '../utils/whatsapp';
import { OrderSummary } from '../components/cart/OrderSummary';
import { Button } from '../components/ui/Button';

export default function Checkout() {
  const { selectedItems, totals } = useCart();
  const { settings } = useStore();
  const { notify } = useToast();
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    deliveryName: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);

  /** Updates one field and clears its error as soon as the shopper edits it. */
  function setField(key, value) {
    setCustomer((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  const recipients = useMemo(() => getWhatsAppContacts(settings), [settings]);

  if (!selectedItems.length) return <Navigate to="/cart" replace />;

  function buildMessage() {
    const lines = [
      `Hello ${settings.storeName || 'Store'}, I would like to enquire about placing an order.`,
      '',
      '*Items requested*',
      ...selectedItems.map(
        (item, index) =>
          `${index + 1}. ${item.name} — ${item.color}, size ${item.size} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`,
      ),
      '',
      `Merchandise subtotal: ${formatPrice(totals.subtotal)}`,
    ];

    if (totals.bulkDiscount > 0) {
      lines.push(`${totals.bulkLabel} (${totals.bulkPercent}%): -${formatPrice(totals.bulkDiscount)}`);
    }
    if (totals.festiveDiscount > 0) {
      lines.push(`${totals.festiveLabel} (${totals.festivePercent}%): -${formatPrice(totals.festiveDiscount)}`);
    }
    if (totals.codeDiscount > 0) {
      lines.push(`Promo discount: -${formatPrice(totals.codeDiscount)}`);
    }

    lines.push(`Estimated merchandise amount: ${formatPrice(totals.total)}`);

    // Record which delivery terms the shopper was shown, so the quote sent
    // back matches the storefront.
    if (totals.delivery?.qualified) {
      lines.push(
        `Delivery: free (order is above ${formatPrice(totals.delivery.threshold)}).`,
        'Please confirm availability, final price and applicable taxes.',
      );
    } else {
      lines.push('Please confirm availability, final price, applicable taxes and delivery charges.');
    }

    // The delivery block is formatted as an address so it can be copied
    // straight onto a shipping label.
    const addressLines = [
      customer.deliveryName.trim() || customer.name.trim(),
      customer.address.trim(),
      customer.landmark.trim() && `Landmark: ${customer.landmark.trim()}`,
      [customer.city.trim(), customer.state.trim()].filter(Boolean).join(', '),
      `PIN ${customer.pincode.trim()}`,
    ].filter(Boolean);

    lines.push(
      '',
      '*Delivery address*',
      ...addressLines,
      '',
      `Ordered by: ${customer.name.trim()}`,
      `Contact: ${customer.phone.trim()}`,
    );
    if (customer.note.trim()) lines.push(`Note: ${customer.note.trim()}`);

    return lines.join('\n');
  }

  function handleWhatsApp(contact) {
    const nextErrors = {};
    if (!isRequired(customer.name)) nextErrors.name = 'Enter your name.';
    if (!isPhone(customer.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!isAddress(customer.address)) {
      nextErrors.address = 'Enter the full address — house or flat number, street and area.';
    }
    if (!isRequired(customer.city)) nextErrors.city = 'Enter the town or city.';
    if (!isRequired(customer.state)) nextErrors.state = 'Enter the state.';
    if (!isPincode(customer.pincode)) nextErrors.pincode = 'Enter a valid 6-digit PIN code.';
    if (!consent) nextErrors.consent = 'Consent is required before sharing your enquiry.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    openWhatsAppMessage(contact.number, buildMessage());
    notify('Review the WhatsApp draft and tap Send to share your enquiry.', { tone: 'success' });
  }

  return (
    <div className="dnd-container py-10">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Purchase enquiry</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Let’s talk about your order.</h1>
        </div>
        <Link to="/cart" className="text-sm font-medium underline underline-offset-4">
          ← Back to bag
        </Link>
      </header>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_22rem] xl:gap-16">
        <div className="space-y-8">
          <section className="rounded-3xl border border-sand-300 bg-sand-50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Contact &amp; delivery details</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Send your purchase enquiry on WhatsApp. Payment is arranged directly with us; this
              website does not collect payment.
            </p>

            {settings.delivery?.freeDeliveryActive && (
              <p className="mt-3 rounded-xl bg-clay-400/15 px-3.5 py-2.5 text-sm text-clay-500">
                {settings.delivery.label} — part of the Diwali sale.
              </p>
            )}

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (recipients[0]) handleWhatsApp(recipients[0]);
              }}
            >
              <div>
                <label className="dnd-label" htmlFor="customer-name">Your name</label>
                <input
                  id="customer-name"
                  autoComplete="name"
                  className="dnd-field"
                  value={customer.name}
                  onChange={(event) => setField('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'customer-name-error' : undefined}
                />
                {errors.name && <p id="customer-name-error" className="mt-1 text-sm text-berry-500">{errors.name}</p>}
              </div>
              <div>
                <label className="dnd-label" htmlFor="customer-phone">Phone / WhatsApp number</label>
                <input
                  id="customer-phone"
                  type="tel"
                  autoComplete="tel"
                  className="dnd-field"
                  placeholder="+91 98765 43210"
                  value={customer.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'customer-phone-error' : undefined}
                />
                {errors.phone && <p id="customer-phone-error" className="mt-1 text-sm text-berry-500">{errors.phone}</p>}
              </div>

              {/* ------------------------------------------ Delivery address */}
              <fieldset className="space-y-5 border-t border-sand-300 pt-5">
                <legend className="text-sm font-semibold">Delivery address</legend>

                <CheckoutField
                  id="delivery-name"
                  label="Name for delivery (optional)"
                  hint="Leave blank to use your own name."
                  autoComplete="shipping name"
                  value={customer.deliveryName}
                  onChange={(value) => setField('deliveryName', value)}
                />

                <CheckoutField
                  id="delivery-address"
                  label="Address"
                  hint="House or flat number, building, street and area."
                  autoComplete="shipping street-address"
                  multiline
                  error={errors.address}
                  value={customer.address}
                  onChange={(value) => setField('address', value)}
                />

                <CheckoutField
                  id="delivery-landmark"
                  label="Landmark (optional)"
                  autoComplete="off"
                  value={customer.landmark}
                  onChange={(value) => setField('landmark', value)}
                />

                <div className="grid gap-5 sm:grid-cols-3">
                  <CheckoutField
                    id="delivery-city"
                    label="Town / city"
                    autoComplete="shipping address-level2"
                    error={errors.city}
                    value={customer.city}
                    onChange={(value) => setField('city', value)}
                  />
                  <CheckoutField
                    id="delivery-state"
                    label="State"
                    autoComplete="shipping address-level1"
                    error={errors.state}
                    value={customer.state}
                    onChange={(value) => setField('state', value)}
                  />
                  <CheckoutField
                    id="delivery-pincode"
                    label="PIN code"
                    autoComplete="shipping postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="600001"
                    error={errors.pincode}
                    value={customer.pincode}
                    // Digits only — a PIN code with stray characters reaches us
                    // unusable, and the courier field accepts nothing else.
                    onChange={(value) => setField('pincode', value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </fieldset>

              <div>
                <label className="dnd-label" htmlFor="customer-note">Order note (optional)</label>
                <textarea
                  id="customer-note"
                  className="dnd-field min-h-24 resize-y"
                  maxLength={400}
                  value={customer.note}
                  onChange={(event) => setCustomer({ ...customer, note: event.target.value })}
                  placeholder="Anything we should know?"
                />
              </div>
              <p className="text-xs leading-relaxed text-ink-500">
                Selecting a WhatsApp option opens a pre-filled draft. Check the recipient and
                message, then press Send in WhatsApp. Your details are shared only if you send it.
              </p>

              <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink-900)]"
                  aria-describedby={errors.consent ? 'whatsapp-consent-error' : undefined}
                />
                <span>
                  I agree to share my name, phone number, delivery address and selected items
                  through WhatsApp so this enquiry can be answered and the order delivered. See the{' '}
                  <Link to="/privacy" className="underline underline-offset-2">
                    privacy notice
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && (
                <p id="whatsapp-consent-error" role="alert" className="-mt-3 text-sm text-berry-500">
                  {errors.consent}
                </p>
              )}

              {recipients.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recipients.map((contact) => (
                    <Button
                      key={contact.id || contact.number}
                      type="button"
                      size="lg"
                      onClick={() => handleWhatsApp(contact)}
                    >
                      {recipients.length > 1 ? `WhatsApp · ${contact.label}` : 'Open WhatsApp to send'}
                    </Button>
                  ))}
                </div>
              ) : (
                <div role="status" className="rounded-2xl bg-sand-200 p-4 text-sm text-ink-700">
                  WhatsApp ordering is temporarily unavailable. Please use the contact details in
                  the footer.
                </div>
              )}
            </form>
          </section>

          {settings.visibility?.bulkOrder !== false && (
            <aside className="rounded-2xl border border-moss-500/30 bg-moss-500/10 p-5">
              <p className="font-semibold text-moss-500">Buying in quantity?</p>
              <p className="mt-1 text-sm text-ink-700">
                Each style has its own minimum order quantity and wholesale rate. See them all on
                the{' '}
                <Link to="/bulk-order" className="underline underline-offset-2">
                  wholesale enquiry page
                </Link>
                .
              </p>
            </aside>
          )}
        </div>

        <aside className="lg:sticky lg:top-28">
          <OrderSummary showPromo />
        </aside>
      </div>
    </div>
  );
}

/**
 * One labelled checkout input.
 *
 * Keeps label / hint / error wiring (`aria-invalid`, `aria-describedby`) in a
 * single place — the delivery block alone has six fields, and repeating that
 * markup is how accessibility attributes drift out of sync.
 */
function CheckoutField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  multiline = false,
  ...inputProps
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const Control = multiline ? 'textarea' : 'input';

  return (
    <div>
      <label className="dnd-label" htmlFor={id}>
        {label}
      </label>
      <Control
        id={id}
        className={`dnd-field${multiline ? ' min-h-20 resize-y' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-berry-500">
          {error}
        </p>
      )}
    </div>
  );
}
