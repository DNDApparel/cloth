import { useStore } from '../context/StoreContext';

/**
 * Privacy notice.
 *
 * Describes the one data flow this storefront actually has: form fields are
 * assembled into a WhatsApp draft in the browser and nothing leaves the device
 * until the shopper presses Send themselves.
 */
export default function Privacy() {
  const { settings } = useStore();
  const grievance = [settings.grievanceOfficer, settings.grievanceEmail, settings.grievancePhone]
    .filter(Boolean);

  return (
    <main className="dnd-container max-w-4xl py-12 sm:py-16">
      <p className="dnd-eyebrow">Your information</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Privacy notice</h1>
      <p className="mt-4 text-sm text-ink-500">
        Last updated: {new Date().toLocaleDateString('en-IN')}
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="text-xl font-semibold text-ink-900">Who handles your information</h2>
          <p className="mt-2">
            {settings.sellerLegalName || settings.storeName} operates this storefront.
          </p>
          {settings.businessAddress && (
            <p className="mt-1 whitespace-pre-line">{settings.businessAddress}</p>
          )}
          {settings.gstin && <p className="mt-1">GSTIN: {settings.gstin}</p>}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">What is shared</h2>
          <p className="mt-2">
            When you prepare a purchase enquiry, the page uses the name, phone number, delivery
            address, selected items, quantity and optional note you enter to create a WhatsApp
            draft. Nothing reaches us until you review that draft and press Send in WhatsApp.
            WhatsApp then handles the message under its own terms and privacy practices.
          </p>
          <p className="mt-2">
            Your bag and wishlist are stored only in your own browser. This storefront does not
            collect payment credentials and does not accept payment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Why information is used</h2>
          <p className="mt-2">
            Enquiry details are used to answer your product, availability, quote and delivery
            questions, and to deliver an order you confirm. We use them for nothing else.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Your choices and requests</h2>
          <p className="mt-2">
            You can edit or clear the WhatsApp draft before sending it. For access, correction,
            erasure, withdrawal of consent or any privacy concern about information already shared,
            contact us using the details below. Withdrawal does not undo processing that happened
            before the request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink-900">Contact and grievance handling</h2>
          {grievance.length ? (
            <p className="mt-2">{grievance.join(' · ')}</p>
          ) : (
            <p className="mt-2">
              Message us on WhatsApp using the contact shown at checkout
              {settings.supportEmail ? `, or email ${settings.supportEmail}` : ''}, to raise a
              privacy concern.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
