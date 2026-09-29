export const config = { runtime: 'edge' };

import { sql } from '../_lib/db';

interface RequestBody {
  dbOrderId: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return new Response(JSON.stringify({ error: 'Payment gateway is not configured yet' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json() as RequestBody;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { dbOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!dbOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Missing payment verification fields' }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
  );
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // timing-safe comparison
  let signatureValid = true;
  if (expectedSignature.length !== razorpay_signature.length) {
    signatureValid = false;
  }
  for (let i = 0; i < expectedSignature.length; i++) {
    if (expectedSignature[i] !== razorpay_signature[i]) {
      signatureValid = false;
    }
  }

  if (!signatureValid) {
    return new Response(JSON.stringify({ error: 'Payment verification failed' }), { status: 400 });
  }

  try {
    const db = sql();
    const orderRows = await db`SELECT * FROM orders WHERE id = ${dbOrderId} AND razorpay_order_id = ${razorpay_order_id}`;
    const order = orderRows[0];
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    // Idempotent: a duplicate Razorpay callback replay just re-returns the
    // already-paid confirmation instead of re-running the cert assignment.
    if (order.status !== 'paid') {
      await db`
        UPDATE orders
        SET status = 'paid', razorpay_payment_id = ${razorpay_payment_id}, paid_at = now()
        WHERE id = ${dbOrderId}
      `;
      await db`
        UPDATE order_items
        SET certificate_number = 'SHK-CERT-' || LPAD(id::text, 6, '0')
        WHERE order_id = ${dbOrderId} AND certificate_number IS NULL
      `;
    }

    const paidOrderRows = await db`SELECT * FROM orders WHERE id = ${dbOrderId}`;
    const paidOrder = paidOrderRows[0];
    const itemRows = await db`SELECT * FROM order_items WHERE order_id = ${dbOrderId} ORDER BY id ASC`;

    const paidAt = new Date(paidOrder.paid_at);
    const estimatedDelivery = new Date(paidAt.getTime() + 8 * 24 * 60 * 60 * 1000);

    return new Response(JSON.stringify({
      orderRef: paidOrder.order_ref,
      orderDate: paidAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      estimatedDeliveryDate: estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      shippingAddress: {
        fullName: paidOrder.full_name,
        email: paidOrder.email,
        phone: paidOrder.phone,
        addressLine1: paidOrder.address_line1,
        addressLine2: paidOrder.address_line2 ?? undefined,
        city: paidOrder.city,
        state: paidOrder.state,
        postalCode: paidOrder.postal_code,
        country: paidOrder.country
      },
      totalINR: Number(paidOrder.total_inr),
      currency: paidOrder.currency,
      shippingCostINR: Number(paidOrder.shipping_inr),
      paymentMethod: 'razorpay',
      items: itemRows.map((r: any) => ({
        paintingId: r.painting_id,
        paintingTitle: r.painting_title,
        editionType: r.edition_type,
        frame: r.frame,
        framePriceINR: Number(r.frame_price_inr),
        unitPriceINR: Number(r.unit_price_inr),
        certificateNumber: r.certificate_number
      }))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('POST /api/orders/verify failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to verify payment' }), { status: 500 });
  }
}
