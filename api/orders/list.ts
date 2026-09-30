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
      return {
        ...order,
        order_items: items.filter((item: any) => item.order_id === order.id)
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
