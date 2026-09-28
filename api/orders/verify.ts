import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sql } from '../_lib/db';

interface RequestBody {
  dbOrderId: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: 'Payment gateway is not configured yet' });
    return;
  }

  const { dbOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as RequestBody;
  if (!dbOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing payment verification fields' });
    return;
  }

  const expectedSignature = createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'utf-8');
  const actual = Buffer.from(razorpay_signature, 'utf-8');
  const signatureValid = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!signatureValid) {
    res.status(400).json({ error: 'Payment verification failed' });
    return;
  }

  try {
    const db = sql();
    const orderRows = await db`SELECT * FROM orders WHERE id = ${dbOrderId} AND razorpay_order_id = ${razorpay_order_id}`;
    const order = orderRows[0];
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
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

    res.status(200).json({
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
    });
  } catch (err) {
    console.error('POST /api/orders/verify failed:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}
