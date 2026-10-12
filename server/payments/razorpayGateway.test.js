import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { RazorpayGateway } from './razorpayGateway.js';

const SECRET = 'test-only-secret';
const INTENT_ID = 'order_expected';
const PAYMENT_ID = 'pay_test';
const AMOUNT = 1250;
const originalFetch = globalThis.fetch;

function confirmation(overrides = {}) {
  const razorpayOrderId = overrides.razorpayOrderId ?? INTENT_ID;
  const razorpayPaymentId = overrides.razorpayPaymentId ?? PAYMENT_ID;
  return {
    reference: INTENT_ID,
    expectedAmount: 12.5,
    expectedCurrency: 'INR',
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: createHmac('sha256', SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex'),
    ...overrides,
  };
}

function payment(overrides = {}) {
  return {
    id: PAYMENT_ID,
    order_id: INTENT_ID,
    amount: AMOUNT,
    currency: 'INR',
    status: 'captured',
    method: 'card',
    card: { last4: '4242' },
    ...overrides,
  };
}

function mockPaymentApi(responseBody, status = 200) {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  return () => calls;
}

test('rejects a valid signed payment for a different stored intent without fetching it', async () => {
  const calls = mockPaymentApi(payment());
  const gateway = new RazorpayGateway({ keyId: 'test-key', keySecret: SECRET });

  const result = await gateway.confirm(confirmation({ razorpayOrderId: 'order_other' }));

  assert.equal(result.paid, false);
  assert.equal(calls(), 0);
});

test('rejects fetched payment details that do not match intent, amount, or currency', async (t) => {
  const gateway = new RazorpayGateway({ keyId: 'test-key', keySecret: SECRET });
  const mismatches = [
    { order_id: 'order_other' },
    { amount: AMOUNT + 1 },
    { currency: 'USD' },
  ];

  for (const mismatch of mismatches) {
    await t.test(JSON.stringify(mismatch), async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify(payment(mismatch)), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      const result = await gateway.confirm(confirmation());
      assert.equal(result.paid, false);
    });
  }
});

test('does not settle authorized-but-uncaptured payments', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(payment({ status: 'authorized' })), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  const gateway = new RazorpayGateway({ keyId: 'test-key', keySecret: SECRET });

  const result = await gateway.confirm(confirmation());

  assert.equal(result.paid, false);
});

test('accepts a captured payment bound to the expected intent, amount, and currency', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(payment()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  const gateway = new RazorpayGateway({ keyId: 'test-key', keySecret: SECRET });

  const result = await gateway.confirm(confirmation());

  assert.equal(result.paid, true);
  assert.equal(result.reference, PAYMENT_ID);
});

test('fails closed when Razorpay cannot return payment details', async () => {
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  const gateway = new RazorpayGateway({ keyId: 'test-key', keySecret: SECRET });

  await assert.rejects(gateway.confirm(confirmation()), { status: 502 });
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
