import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { colorNames, primaryImage } from '../data/products';
import { formatPrice } from '../utils/format';
import { isAddress, isPhone, isPincode, isRequired } from '../utils/validation';
import { getWhatsAppContacts, openWhatsAppMessage } from '../utils/whatsapp';
import { Button } from '../components/ui/Button';
import { ProductImage } from '../components/ui/ProductImage';

/**
 * Wholesale enquiry.
 *
 * Buyers pick the actual products they want rather than a category, because
 * the minimum order quantity and the wholesale rate are set per style — a
 * category tells them nothing about either. Selecting a product reveals its
 * minimum, its per-piece rate and any pack note, and the quantity field
 * defaults to that minimum so the enquiry starts from a quantity we can
 * actually quote.
 */
export default function BulkOrder() {
  const { products, categoryMap, settings } = useStore();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();

  const contacts = useMemo(() => getWhatsAppContacts(settings), [settings]);
  const [recipientId, setRecipientId] = useState('');

  /** `{ [productId]: quantity }` — a product is selected when it has an entry. */
  const [lines, setLines] = useState(() => {
    const preselected = searchParams.get('product');
    return preselected ? { [preselected]: '' } : {};
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    business: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    note: '',
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});

  /** Updates one field and clears its error as soon as it is edited. */
  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  useEffect(() => {
    if (!contacts.some((contact) => (contact.id || contact.number) === recipientId)) {
      setRecipientId(contacts[0] ? contacts[0].id || contacts[0].number : '');
    }
  }, [contacts, recipientId]);

  const defaultMinimum = Math.max(1, Number(settings.bulkDiscount?.minQuantity) || 10);

  /** Minimum pieces that unlock this product's wholesale rate. */
  function minimumFor(product) {
    const perProduct = Number(product.bulkMinQuantity);
    return Number.isFinite(perProduct) && perProduct >= 1 ? Math.floor(perProduct) : defaultMinimum;
  }

  /** The per-piece wholesale rate, or null when none is published. */
  function wholesaleFor(product) {
    const rate = Number(product.wholesalePrice);
    return Number.isFinite(rate) && rate > 0 && rate < Number(product.price) ? rate : null;
  }

  const selected = products.filter((product) => product.id in lines);

  const selectedRecipient = contacts.find(
    (contact) => (contact.id || contact.number) === recipientId,
  );

  const totalPieces = selected.reduce((sum, product) => sum + (Number(lines[product.id]) || 0), 0);

  // Indicative only: uses the wholesale rate where one is published, otherwise
  // the retail price, so the figure never understates what we would quote.
  const estimatedTotal = selected.reduce((sum, product) => {
    const quantity = Number(lines[product.id]) || 0;
    const rate = wholesaleFor(product) ?? Number(product.price);
    return sum + rate * quantity;
  }, 0);

  function toggleProduct(product, checked) {
    setErrors((current) => ({ ...current, lines: undefined }));
    setLines((current) => {
      const next = { ...current };
      if (checked) {
        next[product.id] = String(minimumFor(product));
      } else {
        delete next[product.id];
      }
      return next;
    });
  }

  function setQuantity(productId, value) {
    setLines((current) => ({ ...current, [productId]: value }));
  }

  function submitEnquiry(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!isRequired(form.name)) nextErrors.name = 'Enter your name.';
    if (!isPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!isAddress(form.address)) {
      nextErrors.address = 'Enter the full address — building or shop number, street and area.';
    }
    if (!isRequired(form.city)) nextErrors.city = 'Enter the town or city.';
    if (!isRequired(form.state)) nextErrors.state = 'Enter the state.';
    if (!isPincode(form.pincode)) nextErrors.pincode = 'Enter a valid 6-digit PIN code.';
    if (!selected.length) nextErrors.lines = 'Choose at least one product.';
    if (!consent) nextErrors.consent = 'Consent is required before sharing your enquiry.';

    // Each selected product must reach its own minimum — a single store-wide
    // number would be wrong, since the minimums differ per style.
    const below = selected.filter(
      (product) => (Number(lines[product.id]) || 0) < minimumFor(product),
    );
    if (below.length && !nextErrors.lines) {
      nextErrors.lines = `${below.map((p) => p.name).join(', ')}: enter at least the minimum shown.`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !selectedRecipient) return;

    const itemLines = selected.map((product) => {
      const quantity = Number(lines[product.id]);
      const rate = wholesaleFor(product);
      const rateText = rate ? ` — wholesale ${formatPrice(rate)}/piece` : '';
      return `• ${product.name} × ${quantity} pieces${rateText}`;
    });

    // Formatted as a block so it can be copied straight onto a shipping label.
    const addressLines = [
      form.business.trim() || form.name.trim(),
      form.address.trim(),
      [form.city.trim(), form.state.trim()].filter(Boolean).join(', '),
      `PIN ${form.pincode.trim()}`,
    ].filter(Boolean);

    const message = [
      `Hello ${settings.storeName || 'Store'}, I would like a wholesale quote.`,
      '',
      '*Products*',
      ...itemLines,
      '',
      `Total pieces: ${totalPieces}`,
      '',
      '*Delivery address*',
      ...addressLines,
      '',
      `Contact name: ${form.name.trim()}`,
      `Phone / WhatsApp: ${form.phone.trim()}`,
      ...(form.note.trim() ? ['', `Additional details: ${form.note.trim()}`] : []),
      '',
      'Please confirm availability, wholesale pricing, applicable taxes and delivery options.',
    ].join('\n');

    openWhatsAppMessage(selectedRecipient.number, message);
    notify('Review the WhatsApp draft and tap Send to share your enquiry.', { tone: 'success' });
  }

  if (settings.visibility?.bulkOrder === false) return <Navigate to="/" replace />;

  return (
    <main className="dnd-container py-12 sm:py-16">
      <header className="max-w-3xl border-b border-sand-300 pb-8">
        <p className="dnd-eyebrow">For shops, teams and resellers</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Wholesale enquiries</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500">
          Pick the styles you need and the quantity for each. Every style has its own minimum order
          quantity, shown below. We confirm stock, the final quote and delivery with you directly.
        </p>
        {settings.factoryDirectNote && (
          <p className="mt-4 max-w-2xl rounded-xl border border-moss-500/30 bg-moss-500/10 px-4 py-3 text-sm leading-relaxed text-ink-700">
            {settings.factoryDirectNote}
          </p>
        )}
      </header>

      <form
        onSubmit={submitEnquiry}
        noValidate
        className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <section className="space-y-7">
          <fieldset>
            <legend className="dnd-label">Choose products</legend>
            <p className="mb-3 text-xs text-ink-500">
              Select a style to see its minimum order quantity and wholesale rate.
            </p>

            <ul className="space-y-3">
              {products.map((product) => {
                const checked = product.id in lines;
                const minimum = minimumFor(product);
                const rate = wholesaleFor(product);
                const quantity = Number(lines[product.id]) || 0;
                const short = checked && quantity > 0 && quantity < minimum;

                return (
                  <li
                    key={product.id}
                    className={`rounded-2xl border transition-colors ${
                      checked ? 'border-ink-900 bg-sand-50' : 'border-sand-300 bg-white'
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-4 p-4">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => toggleProduct(product, event.target.checked)}
                        className="h-4 w-4 shrink-0 accent-[var(--color-ink-900)]"
                      />
                      <ProductImage
                        src={primaryImage(product)}
                        alt=""
                        className="h-16 w-14 shrink-0 rounded-lg bg-sand-200 object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{product.name}</span>
                        <span className="block text-xs text-ink-500">
                          {categoryMap[product.category]?.name ?? product.category} ·{' '}
                          {colorNames(product).length} colours · {product.sizes.join(', ')}
                        </span>
                        <span className="mt-1 block text-xs text-ink-600">
                          Retail {formatPrice(product.price)}
                          {rate && (
                            <>
                              {' · '}
                              <strong className="text-moss-500">
                                Wholesale {formatPrice(rate)}/piece from {minimum} pieces
                              </strong>
                            </>
                          )}
                          {!rate && ` · Wholesale quote from ${minimum} pieces`}
                        </span>
                      </span>
                    </label>

                    {checked && (
                      <div className="space-y-2 border-t border-sand-200 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-xs">
                            <span className="dnd-label mb-0">Quantity</span>
                            <input
                              type="number"
                              min={minimum}
                              step="1"
                              value={lines[product.id]}
                              onChange={(event) => setQuantity(product.id, event.target.value)}
                              aria-label={`Quantity for ${product.name}`}
                              aria-invalid={short}
                              className="dnd-field w-28"
                            />
                          </label>
                          <span className="text-xs text-ink-500">
                            Minimum <strong>{minimum}</strong> pieces
                          </span>
                          {rate && quantity >= minimum && (
                            <span className="text-xs font-medium text-moss-500">
                              {quantity} × {formatPrice(rate)} = {formatPrice(rate * quantity)}
                            </span>
                          )}
                        </div>

                        {short && (
                          <p role="alert" className="dnd-error">
                            This style needs at least {minimum} pieces for the wholesale rate.
                          </p>
                        )}

                        {product.bulkNote && (
                          <p className="text-xs leading-relaxed text-ink-600">{product.bulkNote}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {errors.lines && (
              <p role="alert" className="dnd-error mt-3">
                {errors.lines}
              </p>
            )}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" error={errors.name}>
              <input
                className="dnd-field"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                required
              />
            </Field>
            <Field label="Phone / WhatsApp" error={errors.phone}>
              <input
                className="dnd-field"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                aria-invalid={Boolean(errors.phone)}
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                required
              />
            </Field>
            <Field label="Business name (optional)">
              <input
                className="dnd-field"
                autoComplete="organization"
                value={form.business}
                onChange={(event) => setField('business', event.target.value)}
              />
            </Field>
          </div>

          <fieldset className="space-y-5 border-t border-sand-300 pt-6">
            <legend className="text-sm font-semibold">Delivery address</legend>

            <Field
              label="Address"
              hint="Building or shop number, street and area."
              error={errors.address}
            >
              <textarea
                className="dnd-field min-h-20 resize-y"
                autoComplete="shipping street-address"
                aria-invalid={Boolean(errors.address)}
                value={form.address}
                onChange={(event) => setField('address', event.target.value)}
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Town / city" error={errors.city}>
                <input
                  className="dnd-field"
                  autoComplete="shipping address-level2"
                  aria-invalid={Boolean(errors.city)}
                  value={form.city}
                  onChange={(event) => setField('city', event.target.value)}
                  required
                />
              </Field>
              <Field label="State" error={errors.state}>
                <input
                  className="dnd-field"
                  autoComplete="shipping address-level1"
                  aria-invalid={Boolean(errors.state)}
                  value={form.state}
                  onChange={(event) => setField('state', event.target.value)}
                  required
                />
              </Field>
              <Field label="PIN code" error={errors.pincode}>
                <input
                  className="dnd-field"
                  autoComplete="shipping postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="600001"
                  aria-invalid={Boolean(errors.pincode)}
                  value={form.pincode}
                  // Digits only — a PIN with stray characters is unusable to a
                  // courier, and the field accepts nothing else.
                  onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </Field>
            </div>
          </fieldset>

          <Field label="Sizes, colours or other details (optional)">
            <textarea
              className="dnd-field min-h-28 resize-y"
              maxLength={500}
              value={form.note}
              onChange={(event) => setField('note', event.target.value)}
            />
          </Field>

          {contacts.length > 0 && (
            <fieldset>
              <legend className="dnd-label">Send enquiry to</legend>
              <div className="flex flex-wrap gap-3">
                {contacts.map((contact) => {
                  const id = contact.id || contact.number;
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 border border-sand-300 bg-sand-50 px-4 py-3 text-sm"
                    >
                      <input
                        type="radio"
                        name="whatsapp-contact"
                        value={id}
                        checked={recipientId === id}
                        onChange={() => setRecipientId(id)}
                      />
                      WhatsApp · {contact.label || 'Store'}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div>
            <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink-900)]"
              />
              <span>
                I agree to share the details above through WhatsApp so this wholesale enquiry can be
                answered. Read the{' '}
                <Link to="/privacy" className="underline underline-offset-2">
                  privacy notice
                </Link>
                .
              </span>
            </label>
            {errors.consent && (
              <p role="alert" className="dnd-error mt-2">
                {errors.consent}
              </p>
            )}
          </div>

          {contacts.length ? (
            <Button type="submit" size="lg">
              Prepare WhatsApp enquiry
            </Button>
          ) : (
            <p role="status" className="border border-sand-300 bg-sand-50 p-4 text-sm text-ink-500">
              WhatsApp ordering is not configured yet. Please check back once the store contact is
              published.
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink-500">
            WhatsApp opens with a draft. Review the recipient and message, then press Send. No
            payment is collected on this website.
          </p>
        </section>

        <aside className="h-fit space-y-6 lg:sticky lg:top-28">
          {selected.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-sand-300 bg-sand-50 p-5">
              <p className="font-semibold">Your enquiry</p>
              <ul className="space-y-1.5 text-sm">
                {selected.map((product) => (
                  <li key={product.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate text-ink-600">{product.name}</span>
                    <span className="shrink-0 tabular-nums">
                      {Number(lines[product.id]) || 0} pcs
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-sand-300 pt-3 text-sm font-semibold">
                <span>{totalPieces} pieces</span>
                <span className="tabular-nums">≈ {formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-xs leading-relaxed text-ink-500">
                Indicative only — the final quote, taxes and delivery are confirmed on WhatsApp.
              </p>
            </div>
          )}

          <div className="border-l-2 border-clay-400 pl-5 text-sm leading-relaxed text-ink-500">
            <p className="font-semibold text-ink-900">How wholesale requests work</p>
            <ol className="mt-3 list-inside list-decimal space-y-2">
              <li>Select styles and quantities, meeting each minimum.</li>
              <li>Choose a WhatsApp contact.</li>
              <li>Review and send your message.</li>
              <li>We confirm the quote and delivery details.</li>
            </ol>
          </div>
        </aside>
      </form>
    </main>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="dnd-label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
      {error && (
        <span role="alert" className="dnd-error">
          {error}
        </span>
      )}
    </label>
  );
}
