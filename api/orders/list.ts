export const config = { runtime: 'edge' };
import { sql } from '../_lib/db';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }
  });

// Resolves the signed-in customer's email from their Supabase access token.
// The email is never taken from the request itself: whoever calls this
// endpoint can only ever read orders for the account they are signed in as.
async function getVerifiedEmail(req: Request): Promise<{ email?: string; status?: number; error?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    // Fail closed: without a way to verify the caller, return nothing.
    console.error('GET /api/orders/list: Supabase URL / anon key are not configured');
    return { status: 503, error: 'Order lookup is temporarily unavailable' };
  }

  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') || '');
  if (!match) {
    return { status: 401, error: 'Sign in to view your orders' };
  }

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${match[1]}` }
    });
  } catch (err) {
    console.error('GET /api/orders/list: token verification request failed:', err);
    return { status: 503, error: 'Order lookup is temporarily unavailable' };
  }
  if (!res.ok) {
    return { status: 401, error: 'Your session has expired. Please sign in again.' };
  }

  const user = await res.json() as { email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null };
  if (!user.email) {
    return { status: 401, error: 'Sign in to view your orders' };
  }
  // An unconfirmed address could belong to someone else, so don't trust it.
  if (!user.email_confirmed_at && !user.confirmed_at) {
    return { status: 403, error: 'Confirm your email address to view your orders' };
  }
  return { email: user.email.trim().toLowerCase() };
}

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const verified = await getVerifiedEmail(req);
  if (!verified.email) {
    return json({ error: verified.error }, verified.status);
  }
  const email = verified.email;

  try {
    const db = sql();
    
    // Fetch orders for this email
    const orders = await db`
      SELECT * FROM orders 
      WHERE lower(email) = ${email} 
      ORDER BY created_at DESC
    `;

    if (orders.length === 0) {
      return json({ orders: [] });
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

    return json({ orders: ordersWithItems });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return json({ error: 'Failed to fetch orders' }, 500);
  }
}
