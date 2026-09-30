export const config = { runtime: 'edge' };
import { sql } from '../_lib/db';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
  }

  try {
    const db = sql();
    
    // Fetch orders for this email
    const orders = await db`
      SELECT * FROM orders 
      WHERE email = ${email} 
      ORDER BY created_at DESC
    `;

    if (orders.length === 0) {
      return new Response(JSON.stringify({ orders: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch order items for all these orders
    const orderIds = orders.map((o: any) => o.id);
    
    const items = await db`
      SELECT * FROM order_items 
      WHERE order_id = ANY(${orderIds})
    `;

    // Attach items to their respective orders
    const ordersWithItems = orders.map((order: any) => {
      // Map flat DB columns to the OrderRecord shape the UI expects
      // (see OrderRecord in src/types.ts).
      const status = order.status === 'pending' ? 'pending_payment' : order.status === 'failed' ? 'cancelled' : order.status;
      return {
        id: String(order.id),
        order_number: order.order_ref,
        user_id: null,
        guest_email: order.email,
        status,
        // Amounts are stored in INR only, so display them as INR.
        currency: 'INR',
        total_amount_inr: Number(order.total_inr),
        total_amount_display: Number(order.total_inr),
        shipping_address: {
          fullName: order.full_name,
          email: order.email,
          phone: order.phone,
          addressLine1: order.address_line1,
          addressLine2: order.address_line2 ?? undefined,
          city: order.city,
          state: order.state,
          postalCode: order.postal_code,
          country: order.country
        },
        payment_method: 'razorpay',
        tracking_number: null,
        tracking_carrier: null,
        estimated_delivery_date: null,
        created_at: order.created_at,
        updated_at: order.paid_at ?? order.created_at,
        order_items: items
          .filter((item: any) => item.order_id === order.id)
          .map((item: any) => ({ ...item, id: String(item.id), order_id: String(item.order_id) }))
      };
    });

    return new Response(JSON.stringify({ orders: ordersWithItems }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 });
  }
}
