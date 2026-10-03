export const config = { runtime: 'edge' };
import { sql } from '../_lib/db';
import { text, optionalText, email as validEmail, phone as validPhone, postalCode as validPostal, oneOf, badRequest, ALLOWED_CURRENCIES, EDITION_TYPES, MAX } from '../_lib/validate';
import { sendOrderConfirmation, sendOrderAlertToStore } from '../_lib/email';
import { FRAME_OPTIONS, PRINT_EDITION_PRICE_RATIO, SHIPPING_COST_INR, FREE_SHIPPING_THRESHOLD_INR } from '../../src/data/paintings';

interface RequestItem {
  paintingId: string;
  editionType: 'original' | 'print';
  frame: string;
}

const MAX_CART_ITEMS = 20;

interface RequestBody {
  items: RequestItem[];
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // Force testMode to true for now because the frontend Razorpay widget 
  // is not implemented yet. If this is false, the API returns a Razorpay 
  // order payload instead of an OrderConfirmation, which crashes the frontend.
  const testMode = true;

  let body;
  try {
    body = await req.json() as RequestBody;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  
  // Validate and normalise everything before it touches the database or an
  // email. From here on only the cleaned values below are used.
  const raw = (body && typeof body === 'object' ? body : {}) as { items?: unknown; shipping?: unknown; currency?: unknown };
  const currency = oneOf(raw.currency, ALLOWED_CURRENCIES);
  if (!currency) return badRequest('Unsupported currency');

  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > MAX_CART_ITEMS) {
    return badRequest(`Your cart must contain between 1 and ${MAX_CART_ITEMS} items`);
  }
  const items: RequestItem[] = [];
  for (const entry of raw.items as Record<string, unknown>[]) {
    const paintingId = text(entry?.paintingId, { max: MAX.id });
    const editionType = oneOf(entry?.editionType, EDITION_TYPES);
    const frame = text(entry?.frame, { max: MAX.id });
    if (!paintingId || !editionType || !frame) return badRequest('Invalid cart item');
    items.push({ paintingId, editionType, frame });
  }

  const rawShipping = (raw.shipping && typeof raw.shipping === 'object' ? raw.shipping : {}) as Record<string, unknown>;
  const fullName = text(rawShipping.fullName, { max: MAX.name, min: 2 });
  const shippingEmail = validEmail(rawShipping.email);
  const shippingPhone = validPhone(rawShipping.phone);
  const addressLine1 = text(rawShipping.addressLine1, { max: MAX.line });
  const addressLine2 = optionalText(rawShipping.addressLine2, { max: MAX.line });
  const city = text(rawShipping.city, { max: MAX.place });
  const state = text(rawShipping.state, { max: MAX.place });
  const postalCode = validPostal(rawShipping.postalCode);
  const country = text(rawShipping.country, { max: MAX.place });

  if (!fullName || !shippingEmail || !shippingPhone || !addressLine1 || !city || !state || !postalCode || !country || addressLine2 === null) {
    return badRequest('Please check your shipping details (name, valid email and phone, address, city, state, postal code and country).');
  }
  const shipping = {
    fullName, email: shippingEmail, phone: shippingPhone, addressLine1,
    ...(addressLine2 ? { addressLine2 } : {}),
    city, state, postalCode, country
  };

  // Originals reserved for this order. They are released again if anything
  // below fails, so a failed checkout never leaves a painting marked sold.
  const reservedIds: string[] = [];
  const releaseReserved = async () => {
    for (const id of reservedIds.splice(0)) {
      try {
        await sql()`UPDATE paintings SET is_available = true WHERE id = ${id}`;
      } catch (releaseErr) {
        console.error(`Failed to release reserved painting ${id}:`, releaseErr);
      }
    }
  };

  try {
    // Recompute every price server-side from the database — never trust
    // a client-submitted amount for what gets charged.
    const db = sql();
    const resolvedItems: {
      paintingId: string;
      paintingTitle: string;
      editionType: 'original' | 'print';
      frame: string;
      framePriceINR: number;
      unitPriceINR: number;
    }[] = [];

    for (const item of items) {
      const rows = await db`SELECT id, title, price_inr, is_available FROM paintings WHERE id = ${item.paintingId}`;
      const painting = rows[0];
      if (!painting) {
        return new Response(JSON.stringify({ error: `Unknown painting: ${item.paintingId}` }), { status: 400 });
      }
      if (item.editionType === 'original' && !painting.is_available) {
        return new Response(JSON.stringify({ error: `"${painting.title}" is no longer available as an original` }), { status: 409 });
      }

      const frameOption = FRAME_OPTIONS.find((f) => f.name === item.frame);
      if (!frameOption) {
        return new Response(JSON.stringify({ error: `Unknown frame option: ${item.frame}` }), { status: 400 });
      }

      const unitPriceINR = item.editionType === 'original'
        ? Number(painting.price_inr)
        : Math.round(Number(painting.price_inr) * PRINT_EDITION_PRICE_RATIO);

      resolvedItems.push({
        paintingId: painting.id,
        paintingTitle: painting.title,
        editionType: item.editionType,
        frame: item.frame,
        framePriceINR: frameOption.priceINR,
        unitPriceINR
      });
    }

    const subtotalINR = resolvedItems.reduce((sum, i) => sum + i.unitPriceINR + i.framePriceINR, 0);
    const shippingINR = subtotalINR > FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_COST_INR;
    const totalINR = subtotalINR + shippingINR;

    // Charged in INR regardless of display currency — the merchant
    // account settles in INR, and formatPrice()'s INTERNATIONAL_MARKUP is
    // a display-only conversion for non-INR shoppers, not a second charge.
    const amountPaise = Math.round(totalINR * 100);

    // Reserve each original atomically. The UPDATE only succeeds while the
    // painting is still available, so two buyers racing for the same one
    // cannot both get it: exactly one UPDATE returns a row.
    for (const item of resolvedItems) {
      if (item.editionType !== 'original') continue;
      const reserved = await db`
        UPDATE paintings SET is_available = false
        WHERE id = ${item.paintingId} AND is_available = true
        RETURNING id
      `;
      if (reserved.length === 0) {
        await releaseReserved();
        return new Response(JSON.stringify({ error: `"${item.paintingTitle}" is no longer available as an original` }), { status: 409 });
      }
      reservedIds.push(item.paintingId);
    }

    // Test mode: no real gateway call, no real charge — the order is
    // inserted already marked 'test_paid' (never 'paid', so it can never
    // be mistaken for a verified Razorpay transaction) and the ref/cert
    // numbers carry a TEST- prefix throughout. This exists purely so
    // checkout's later steps (confirmation screen, certificate layout)
    // can be reviewed before real Razorpay keys are added.
    if (testMode) {
      const inserted = await db`
        INSERT INTO orders (
          full_name, email, phone, address_line1, address_line2, city, state,
          postal_code, country, currency, subtotal_inr, shipping_inr, total_inr,
          razorpay_order_id, status, paid_at
        ) VALUES (
          ${shipping.fullName}, ${shipping.email}, ${shipping.phone}, ${shipping.addressLine1},
          ${shipping.addressLine2 ?? null}, ${shipping.city}, ${shipping.state}, ${shipping.postalCode},
          ${shipping.country}, ${currency}, ${subtotalINR}, ${shippingINR}, ${totalINR},
          ${`TEST-${Date.now()}`}, 'test_paid', now()
        )
        RETURNING id, paid_at
      `;
      const dbOrderId = inserted[0].id as number;
      const orderRef = `TEST-SHK-${String(dbOrderId).padStart(6, '0')}`;
      await db`UPDATE orders SET order_ref = ${orderRef} WHERE id = ${dbOrderId}`;

      const insertedItems: { certificateNumber: string }[] = [];
      for (const item of resolvedItems) {
        const itemRows = await db`
          INSERT INTO order_items (
            order_id, painting_id, painting_title, edition_type, frame, frame_price_inr, unit_price_inr
          ) VALUES (
            ${dbOrderId}, ${item.paintingId}, ${item.paintingTitle}, ${item.editionType}, ${item.frame},
            ${item.framePriceINR}, ${item.unitPriceINR}
          )
          RETURNING id
        `;
        const certificateNumber = `TEST-SHK-CERT-${String(itemRows[0].id).padStart(6, '0')}`;
        await db`UPDATE order_items SET certificate_number = ${certificateNumber} WHERE id = ${itemRows[0].id}`;
        insertedItems.push({ certificateNumber });
      }

      const paidAt = new Date(inserted[0].paid_at);
      const estimatedDelivery = new Date(paidAt.getTime() + 8 * 24 * 60 * 60 * 1000);
      const orderDate = paidAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const estimatedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // Send emails (fire-and-forget — never block the order response)
      const emailData = {
        customerName: shipping.fullName,
        customerEmail: shipping.email,
        orderRef,
        orderDate,
        estimatedDelivery: estimatedDeliveryDate,
        items: resolvedItems,
        subtotalINR,
        shippingINR,
        totalINR,
        shippingAddress: shipping,
      };
      await Promise.allSettled([
        sendOrderConfirmation(emailData),
        sendOrderAlertToStore(emailData),
      ]).catch(() => { /* swallow — email must never break checkout */ });

      return new Response(JSON.stringify({
        testMode: true,
        orderRef,
        orderDate,
        estimatedDeliveryDate,
        shippingAddress: shipping,
        totalINR,
        currency,
        shippingCostINR: shippingINR,
        paymentMethod: 'razorpay',
        items: resolvedItems.map((item, i) => ({ ...item, certificateNumber: insertedItems[i].certificateNumber }))
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `pending-${Date.now()}`
      })
    });

    if (!razorpayRes.ok) {
      const errText = await razorpayRes.text();
      console.error('Razorpay order creation failed:', errText);
      await releaseReserved();
      return new Response(JSON.stringify({ error: 'Payment gateway rejected the order' }), { status: 502 });
    }

    const razorpayOrder: { id: string } = await razorpayRes.json();

    const inserted = await db`
      INSERT INTO orders (
        full_name, email, phone, address_line1, address_line2, city, state,
        postal_code, country, currency, subtotal_inr, shipping_inr, total_inr,
        razorpay_order_id, status
      ) VALUES (
        ${shipping.fullName}, ${shipping.email}, ${shipping.phone}, ${shipping.addressLine1},
        ${shipping.addressLine2 ?? null}, ${shipping.city}, ${shipping.state}, ${shipping.postalCode},
        ${shipping.country}, ${currency}, ${subtotalINR}, ${shippingINR}, ${totalINR},
        ${razorpayOrder.id}, 'pending'
      )
      RETURNING id
    `;
    const dbOrderId = inserted[0].id as number;
    const orderRef = `SHK-${String(dbOrderId).padStart(6, '0')}`;
    await db`UPDATE orders SET order_ref = ${orderRef} WHERE id = ${dbOrderId}`;

    for (const item of resolvedItems) {
      await db`
        INSERT INTO order_items (
          order_id, painting_id, painting_title, edition_type, frame, frame_price_inr, unit_price_inr
        ) VALUES (
          ${dbOrderId}, ${item.paintingId}, ${item.paintingTitle}, ${item.editionType}, ${item.frame},
          ${item.framePriceINR}, ${item.unitPriceINR}
        )
      `;
    }

    return new Response(JSON.stringify({
      testMode: false,
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amountPaise,
      dbOrderId,
      orderRef
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('POST /api/orders/create failed:', err);
    await releaseReserved();
    return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 });
  }
}
