import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { FRAME_OPTIONS, PRINT_EDITION_PRICE_RATIO, SHIPPING_COST_INR, FREE_SHIPPING_THRESHOLD_INR } from '../../src/data/paintings';

interface RequestItem {
  paintingId: string;
  editionType: 'original' | 'print';
  frame: string;
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Payment gateway is not configured yet' });
    return;
  }

  const body = req.body as RequestBody;
  const { items, shipping, currency } = body || {};

  if (!items?.length || !shipping?.fullName || !shipping?.email || !shipping?.phone || !shipping?.addressLine1) {
    res.status(400).json({ error: 'Missing cart items or shipping details' });
    return;
  }

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
        res.status(400).json({ error: `Unknown painting: ${item.paintingId}` });
        return;
      }
      if (item.editionType === 'original' && !painting.is_available) {
        res.status(409).json({ error: `"${painting.title}" is no longer available as an original` });
        return;
      }

      const frameOption = FRAME_OPTIONS.find((f) => f.name === item.frame);
      if (!frameOption) {
        res.status(400).json({ error: `Unknown frame option: ${item.frame}` });
        return;
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

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
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
      res.status(502).json({ error: 'Payment gateway rejected the order' });
      return;
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

    res.status(200).json({
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amountPaise,
      dbOrderId,
      orderRef
    });
  } catch (err) {
    console.error('POST /api/orders/create failed:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
